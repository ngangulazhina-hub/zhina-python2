import { analyzeWithLezer } from "@/lib/python/js-analyze";
import { parsePythonError } from "@/lib/python/traceback";
import type { Diagnostic } from "@/lib/python/types";

export type RuntimeEvent =
  | { type: "status"; status: "loading" | "ready" | "running"; detail?: string }
  | { type: "stdout"; text: string }
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
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (e: MessageEvent<RuntimeEvent>) => {
      const ev = e.data;
      if (ev.type === "ready") {
        this.ready = true;
        this.version = ev.version;
        if (this.bootTimeout) window.clearTimeout(this.bootTimeout);
      }
      if (ev.type === "fatal" && this.bootTimeout) window.clearTimeout(this.bootTimeout);
      this.emit(ev);
    };
    this.worker.onerror = (err) => {
      if (this.bootTimeout) window.clearTimeout(this.bootTimeout);
      this.emit({ type: "fatal", text: err.message || "Python worker failed" });
    };
    this.worker.postMessage({ type: "init" });
    if (this.bootTimeout) window.clearTimeout(this.bootTimeout);
    this.bootTimeout = window.setTimeout(() => {
      if (!this.ready) {
        this.emit({
          type: "fatal",
          text:
            "The interpreter did not finish starting within 90 seconds. " +
            "Try force-closing the app and reopening it. If it keeps happening, free some storage " +
            "or reinstall the APK (Pyodide core may not have been packaged correctly).",
        });
      }
    }, 90000);
  }

  ensure() {
    if (!this.worker) this.spawn();
  }

  isReady() {
    return this.ready;
  }

  run(code: string, stdin: string) {
    this.ensure();
    this.worker?.postMessage({ type: "run", code, stdin });
  }

  repl(code: string) {
    this.ensure();
    this.worker?.postMessage({ type: "repl", code });
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
