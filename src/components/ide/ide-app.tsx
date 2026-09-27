import { useEffect, useRef, useState } from "react";
import type { EditorView } from "@codemirror/view";
import { Toaster, toast } from "sonner";
import { IdeHeader } from "@/components/ide/ide-header";
import { PythonEditor } from "@/components/ide/python-editor";
import { PythonTerminal } from "@/components/ide/python-terminal";
import { RunFab } from "@/components/ide/run-fab";
import { VolumeRocker } from "@/components/ide/volume-rocker";
import { EditorToolbar } from "@/components/ide/editor-toolbar";
import { ErrorBanner } from "@/components/ide/error-banner";
import { AnalysisStrip } from "@/components/ide/analysis-strip";
import { SettingsScreen } from "@/components/ide/settings-screen";
import { LibrariesScreen } from "@/components/ide/libraries-screen";
import { useIdeStore } from "@/lib/ide/store";
import { pythonRuntime, parsePythonError } from "@/lib/python/runtime";
import { requestPersistentStorage, requestWakeLock, storagePersisted } from "@/lib/ide/permissions";
import { analyzeWithLezer } from "@/lib/python/js-analyze";

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Not supported on this device — safe to ignore.
  }
}

export function IdeApp() {
  const viewRef = useRef<EditorView | null>(null);
  const screen = useIdeStore((s) => s.screen);
  const layout = useIdeStore((s) => s.terminalLayout);
  const hydrated = useIdeStore((s) => s.hydrated);
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);

  useEffect(() => {
    const finish = () => useIdeStore.getState().setHydrated();
    const unsub = useIdeStore.persist.onFinishHydration(finish);
    void useIdeStore.persist.rehydrate();
    if (useIdeStore.persist.hasHydrated()) finish();
    const fallback = window.setTimeout(finish, 400);
    return () => {
      unsub();
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const unsub = pythonRuntime.subscribe((ev) => {
      const store = useIdeStore.getState();
      if (ev.type === "status") {
        store.setStatus(ev.status, ev.detail);
      } else if (ev.type === "ready") {
        store.setPythonVersion(ev.version);
        store.setStatus("ready");
      } else if (ev.type === "stdout") {
        store.appendLine({ kind: "stdout", text: ev.text });
      } else if (ev.type === "stderr") {
        store.appendLine({ kind: "stderr", text: ev.text });
      } else if (ev.type === "image") {
        store.appendLine({ kind: "image", text: ev.data });
      } else if (ev.type === "python-error") {
        const parsed = parsePythonError(ev.text);
        store.setLastError(parsed);
        store.appendLine({ kind: "stderr", text: ev.text });
        if (store.terminalLayout === "screen") store.setScreen("terminal");
        vibrate([20, 40, 20]);
      } else if (ev.type === "done") {
        store.setStatus("ready");
      } else if (ev.type === "analysis") {
        const local = analyzeWithLezer(store.code);
        const merged = [...ev.diagnostics];
        for (const d of local) {
          if (!merged.some((m) => m.line === d.line && m.type === d.type)) merged.push(d);
        }
        store.setDiagnostics(merged);
      } else if (ev.type === "installed") {
        if (ev.ok) {
          toast.success(`Installed ${ev.name}`);
          store.appendLine({ kind: "system", text: `Installed ${ev.name}` });
        } else {
          toast.error(`Could not install ${ev.name}`);
          store.appendLine({
            kind: "stderr",
            text: `Install failed: ${ev.message ?? ev.name}\nTry a pure-Python wheel from https://pypi.org/project/${ev.name}/`,
          });
        }
      } else if (ev.type === "fatal") {
        store.appendLine({ kind: "stderr", text: ev.text });
        store.setStatus("error", ev.text);
        vibrate([20, 40, 20]);
      }
    });
    pythonRuntime.ensure();
    return unsub;
  }, []);

  useEffect(() => {
    let t: number | undefined;
    const runAnalyze = () => {
      const code = useIdeStore.getState().code;
      pythonRuntime.analyze(code);
    };
    t = window.setTimeout(runAnalyze, 500);
    const unsub = useIdeStore.subscribe((s, prev) => {
      if (s.code === prev.code) return;
      window.clearTimeout(t);
      t = window.setTimeout(runAnalyze, 450);
    });
    return () => {
      window.clearTimeout(t);
      unsub();
    };
  }, []);

  useEffect(() => {
    void storagePersisted().then((ok) => {
      useIdeStore.getState().setPersistGranted(ok);
      if (!ok) void requestPersistentStorage().then((g) => useIdeStore.getState().setPersistGranted(g));
    });
  }, []);

  useEffect(() => {
    const onRun = () => {
      const { code, stdin, terminalLayout, setScreen, clearTerminal, setLastError, appendLine, setStatus } =
        useIdeStore.getState();
      vibrate(15);
      clearTerminal();
      setLastError(null);
      appendLine({ kind: "system", text: "Running…" });
      setStatus("running");
      if (terminalLayout === "screen") setScreen("terminal");
      void requestWakeLock();
      pythonRuntime.run(code, stdin);
    };
    const onStop = () => pythonRuntime.stop();
    const onRepl = (e: Event) => {
      const cmd = (e as CustomEvent<string>).detail;
      pythonRuntime.repl(cmd);
    };
    const onPkg = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      if (!name) return;
      useIdeStore.getState().appendLine({ kind: "system", text: `Installing ${name}…` });
      pythonRuntime.install(name);
    };
    window.addEventListener("zhina-run", onRun);
    window.addEventListener("zhina-stop", onStop);
    window.addEventListener("zhina-repl", onRepl);
    window.addEventListener("zhina-install-package", onPkg);
    return () => {
      window.removeEventListener("zhina-run", onRun);
      window.removeEventListener("zhina-stop", onStop);
      window.removeEventListener("zhina-repl", onRepl);
      window.removeEventListener("zhina-install-package", onPkg);
    };
  }, []);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      const ev = e as Event & { prompt: () => Promise<void> };
      setDeferredPrompt(ev);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstall = () => {
      if (deferredPrompt) {
        void deferredPrompt.prompt();
        setDeferredPrompt(null);
        return;
      }
      toast("Use the browser menu: Add to Home screen");
    };
    window.addEventListener("zhina-install-app", onInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("zhina-install-app", onInstall);
    };
  }, [deferredPrompt]);

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg text-fg">
        <p className="text-sm text-muted">Opening Zhina Python</p>
      </div>
    );
  }

  if (screen === "settings") return <SettingsScreen />;
  if (screen === "libraries") return <LibrariesScreen />;

  const showTerminal = layout === "below" || screen === "terminal";
  const showEditor = layout === "below" || screen === "editor";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <IdeHeader />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {showEditor ? (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <PythonEditor viewRef={viewRef} />
            <VolumeRocker viewRef={viewRef} />
            <EditorToolbar viewRef={viewRef} />
          </div>
        ) : null}
        <ErrorBanner viewRef={viewRef} />
        {showTerminal ? (
          <PythonTerminal className={layout === "below" ? "h-[34%] max-h-[42%] min-h-[9.5rem] shrink-0" : "flex-1"} />
        ) : null}
      </div>
      <AnalysisStrip viewRef={viewRef} />
      <RunFab />
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: { background: "#232220", color: "#f0ede6", border: "1px solid #2e2c28" },
        }}
      />
    </div>
  );
}
