import { analyzeWithLezer } from "@/lib/python/js-analyze";
import { parsePythonError } from "@/lib/python/traceback";
import type { Diagnostic } from "@/lib/python/types";

export type RuntimeEvent =
  | { type: "status"; status: "loading" | "ready" | "running"; detail?: string }
  | { type: "stdout"; text: string }
  | { type: "prompt"; text: string }
  | { type: "stderr"; text: string }
  | { type: "image"; data: string }
  | { type: "python-error"; text: string }
  | { type: "done"; ok: boolean }
  | { type: "ready"; version: string }
  | { type: "analysis"; diagnostics: Diagnostic[] }
  | { type: "installed"; name: string; ok: boolean; message?: string }
  | { type: "fatal"; text: string };

type Handler = (event: RuntimeEvent) => void;

class PythonRuntime {
  private worker: Worker | null = null;
  private handlers = new Set<Handler>();
  private ready = false;
  private bootTimeout: number | undefined;
  private runTimeout: number | undefined;
  private static readonly EXECUTION_WATCHDOG_MS = 120_000;
  version = "Python 3.14";

  subscribe(handler: Handler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private emit(event: RuntimeEvent) {
    for (const h of this.handlers) h(event);
  }

  private spawn() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.ready = false;
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    this.worker = worker;
    worker.onmessage = (e: MessageEvent<RuntimeEvent>) => {
      // Ignore late messages from a worker that has already been terminated.
      if (this.worker !== worker) return;
      const ev = e.data;
      if (ev.type === "ready") {
        this.ready = true;
        this.version = ev.version;
        if (this.bootTimeout) window.clearTimeout(this.bootTimeout);
      }
      if (ev.type === "fatal" && this.bootTimeout) window.clearTimeout(this.bootTimeout);
      if (ev.type === "done" && this.runTimeout) {
        window.clearTimeout(this.runTimeout);
        this.runTimeout = undefined;
      }
      this.emit(ev);
    };
    worker.onerror = (err) => {
      if (this.worker !== worker) return;
      if (this.bootTimeout) window.clearTimeout(this.bootTimeout);
      if (this.runTimeout) {
        window.clearTimeout(this.runTimeout);
        this.runTimeout = undefined;
      }
      this.emit({ type: "fatal", text: err.message || "Python worker failed" });
    };
    worker.postMessage({ type: "init" });
    if (this.bootTimeout) window.clearTimeout(this.bootTimeout);
    this.bootTimeout = window.setTimeout(() => {
      if (!this.ready) {
        this.emit({
          type: "fatal",
          text:
            "The local Python interpreter did not finish starting within 45 seconds. " +
            "Try force-closing the app and reopening it. If it keeps happening, free some storage " +
            "or reinstall the APK (Pyodide core may not have been packaged correctly).",
        });
      }
    }, 45000);
  }

  ensure() {
    if (!this.worker) this.spawn();
  }

  isReady() {
    return this.ready;
  }

  private startExecutionWatchdog(worker: Worker) {
    if (this.runTimeout) window.clearTimeout(this.runTimeout);

    // This watchdog lives on the main thread, not inside the Python worker.
    // A program such as `while True: pass` can block the worker's JavaScript
    // event loop, so a timer inside the worker is not reliable. The main thread
    // can still terminate the stuck worker and create a fresh interpreter.
    this.runTimeout = window.setTimeout(() => {
      if (this.worker !== worker) return;
      this.runTimeout = undefined;
      worker.terminate();
      this.worker = null;
      this.ready = false;
      this.emit({
        type: "stderr",
        text:
          "\nPython execution stopped: the interpreter exceeded the 120-second overall time limit.\n",
      });
      this.emit({ type: "done", ok: false });
      this.emit({ type: "status", status: "loading", detail: "Restarting interpreter" });
      this.spawn();
    }, PythonRuntime.EXECUTION_WATCHDOG_MS);
  }

  run(code: string, stdin: string) {
    this.ensure();
    if (!this.worker) return;
    const worker = this.worker;
    worker.postMessage({ type: "run", code, stdin });
    this.startExecutionWatchdog(worker);
  }

  repl(code: string) {
    this.ensure();
    if (!this.worker) return;
    const worker = this.worker;
    worker.postMessage({ type: "repl", code });
    this.startExecutionWatchdog(worker);
  }

  analyze(code: string) {
    const local = analyzeWithLezer(code);
    this.emit({ type: "analysis", diagnostics: local });
    if (this.ready) this.worker?.postMessage({ type: "analyze", code });
  }

  install(name: string) {
    this.ensure();
    this.worker?.postMessage({ type: "install", name });
  }

  stop() {
    if (this.runTimeout) {
      window.clearTimeout(this.runTimeout);
      this.runTimeout = undefined;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.ready = false;
      this.emit({ type: "stderr", text: "\nInterrupted.\n" });
      this.emit({ type: "done", ok: false });
      this.emit({ type: "status", status: "loading", detail: "Restarting interpreter" });
      this.spawn();
    }
  }
}

export const pythonRuntime = new PythonRuntime();

export { parsePythonError };
