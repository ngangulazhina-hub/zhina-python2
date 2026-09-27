/// <reference lib="webworker" />

const INDEX_URL = "/pyodide/";
const REMOTE_CACHE_DB = "zhina-python-cache";
const REMOTE_CACHE_STORE = "responses";

function openCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(REMOTE_CACHE_DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(REMOTE_CACHE_STORE)) req.result.createObjectStore(REMOTE_CACHE_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// IndexedDB access from inside a Worker is known to sometimes hang (never
// firing onsuccess OR onerror) on Android's WebView, rather than fail
// cleanly. A try/catch does not help with a hang — only a rejection. Race
// every cache operation against a timeout so a stuck IndexedDB can never
// block a fetch the interpreter is waiting on (this is what boot-critical
// files like pyodide.asm.wasm go through).
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function cachedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const req = new Request(input, init);
  if (req.method !== "GET") return nativeFetch(req);
  const key = req.url;
  try {
    const db = await withTimeout(openCacheDb(), 2000);
    const cached = await withTimeout(
      new Promise<ArrayBuffer | null>((resolve, reject) => {
        const tx = db.transaction(REMOTE_CACHE_STORE, "readonly");
        const get = tx.objectStore(REMOTE_CACHE_STORE).get(key);
        get.onsuccess = () => resolve(get.result ?? null);
        get.onerror = () => reject(get.error);
      }),
      2000,
    );
    if (cached) return new Response(cached);
  } catch {
    // Cache is an enhancement; networking still works if storage is unavailable
    // or IndexedDB is hanging.
  }

  const response = await nativeFetch(req);
  if (response.ok && /^https?:/.test(req.url)) {
    // Cache-write happens after we already have the response we need to return.
    // Never await this — a hang here must not delay handing data back to Pyodide.
    void (async () => {
      try {
        const body = await response.clone().arrayBuffer();
        const db = await withTimeout(openCacheDb(), 2000);
        await withTimeout(
          new Promise<void>((resolve, reject) => {
            const tx = db.transaction(REMOTE_CACHE_STORE, "readwrite");
            tx.objectStore(REMOTE_CACHE_STORE).put(body, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          }),
          2000,
        );
      } catch {
        // Ignore cache failures — this must never affect the returned response.
      }
    })();
  }
  return response;
}

const nativeFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = cachedFetch;

type Pyodide = {
  runPythonAsync: (code: string, options?: { globals?: unknown }) => Promise<unknown>;
  runPython: (code: string) => unknown;
  loadPackage: (names: string | string[]) => Promise<void>;
  loadPackagesFromImports: (code: string) => Promise<void>;
  setStdout: (h: { batched?: (s: string) => void }) => void;
  setStderr: (h: { batched?: (s: string) => void }) => void;
  setStdin: (h: { stdin?: () => string | null }) => void;
  globals: {
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
  };
};

let pyodide: Pyodide | null = null;
let stdinQueue: string[] = [];
let userGlobals: unknown = null;

function post(data: Record<string, unknown>) {
  self.postMessage(data);
}

// A worker that throws asynchronously (an unhandled promise rejection, as
// opposed to a synchronous script error) does not reliably reach the main
// thread's Worker.onerror in every environment. Report both cases explicitly
// so a failure is always visible instead of leaving the UI on "Loading
// interpreter" forever with nothing to explain why.
self.addEventListener("error", (e: ErrorEvent) => {
  post({ type: "fatal", text: `Worker error: ${e.message || e.error || "unknown error"}` });
});
self.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
  const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
  post({ type: "fatal", text: `Unhandled error while starting the interpreter: ${reason}` });
});

async function ensurePyodide() {
  if (pyodide) return pyodide;
  post({ type: "status", status: "loading" });
  const url = INDEX_URL + "pyodide.mjs";
  const mod = (await import(/* @vite-ignore */ url)) as {
    loadPyodide: (opts: { indexURL: string }) => Promise<Pyodide>;
  };
  pyodide = await mod.loadPyodide({ indexURL: INDEX_URL });
  pyodide.setStdout({ batched: (s) => post({ type: "stdout", text: s }) });
  pyodide.setStderr({ batched: (s) => post({ type: "stderr", text: s }) });
  pyodide.setStdin({
    stdin: () => {
      if (!stdinQueue.length) return null;
      const line = stdinQueue.shift() ?? "";
      return line.endsWith("\n") ? line : `${line}\n`;
    },
  });
  await pyodide.runPythonAsync(`
import sys, os
os.environ.setdefault("MPLBACKEND", "AGG")
sys.ps1 = ">>> "
sys.ps2 = "... "
`);
  post({ type: "ready", version: await versionString() });
  return pyodide;
}

async function versionString() {
  if (!pyodide) return "Python";
  const v = await pyodide.runPythonAsync("import sys; sys.version.split()[0]");
  return `Python ${String(v)}`;
}

const ANALYZE_SRC = `
import ast, json, builtins, sys

def _zhina_analyze(src):
    out = []
    try:
        tree = ast.parse(src)
    except SyntaxError as e:
        out.append({
            "from": 0,
            "to": 0,
            "line": int(e.lineno or 1),
            "column": int(e.offset or 1),
            "severity": "error",
            "type": type(e).__name__,
            "message": e.msg or "invalid syntax",
        })
        return json.dumps(out)

    assigned = set()
    imported = []
    used = set()

    class V(ast.NodeVisitor):
        def visit_FunctionDef(self, node):
            assigned.add(node.name)
            self.generic_visit(node)
        def visit_AsyncFunctionDef(self, node):
            assigned.add(node.name)
            self.generic_visit(node)
        def visit_ClassDef(self, node):
            assigned.add(node.name)
            self.generic_visit(node)
        def visit_Assign(self, node):
            for t in node.targets:
                if isinstance(t, ast.Name):
                    assigned.add(t.id)
            self.generic_visit(node)
        def visit_AnnAssign(self, node):
            if isinstance(node.target, ast.Name):
                assigned.add(node.target.id)
            self.generic_visit(node)
        def visit_Import(self, node):
            for a in node.names:
                imported.append((a.asname or a.name.split(".")[0], node.lineno, a.name))
            self.generic_visit(node)
        def visit_ImportFrom(self, node):
            for a in node.names:
                if a.name == "*":
                    continue
                imported.append((a.asname or a.name, node.lineno, a.name))
            self.generic_visit(node)
        def visit_Name(self, node):
            if isinstance(node.ctx, ast.Load):
                used.add(node.id)
            self.generic_visit(node)

    V().visit(tree)
    builtin = set(dir(builtins))
    for name, lineno, raw in imported:
        if name not in used:
            out.append({
                "from": 0,
                "to": 0,
                "line": int(lineno),
                "column": 1,
                "severity": "warning",
                "type": "UnusedImport",
                "message": f"Imported '{raw}' is never used",
            })
    return json.dumps(out)
`;

const CAPTURE_FIGS = `
def _zhina_capture_figs():
    import sys
    if "matplotlib" not in sys.modules:
        return []
    import matplotlib.pyplot as plt
    import io, base64
    out = []
    for num in list(plt.get_fignums()):
        fig = plt.figure(num)
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=140, bbox_inches="tight", facecolor="white")
        out.append(base64.b64encode(buf.getvalue()).decode("ascii"))
    plt.close("all")
    return out
`;

async function run(code: string, stdin: string, mode: "run" | "repl") {
  const py = await ensurePyodide();
  stdinQueue = stdin.split(/\r?\n/);
  if (stdinQueue.length && stdinQueue[stdinQueue.length - 1] === "") stdinQueue.pop();
  post({ type: "status", status: "running" });
  try {
    await py.loadPackagesFromImports(code);
  } catch (err) {
    post({ type: "stderr", text: `Package load: ${String(err)}\n` });
  }
  try {
    if (mode === "run" || !userGlobals) {
      userGlobals = py.runPython("{'__name__': '__main__'}");
    }
    const result = await py.runPythonAsync(code, { globals: userGlobals as object });
    if (mode === "repl" && result !== undefined && result !== null) {
      const text = String(result);
      if (text && text !== "None") post({ type: "stdout", text: `${text}\n` });
    }
    await sendFigures(py);
    post({ type: "done", ok: true });
  } catch (err) {
    post({ type: "python-error", text: errorText(err) });
    post({ type: "done", ok: false });
  } finally {
    post({ type: "status", status: "ready" });
  }
}

async function sendFigures(py: Pyodide) {
  try {
    const figs = await py.runPythonAsync(`${CAPTURE_FIGS}\n_zhina_capture_figs()`);
    let arr: unknown[] = [];
    if (Array.isArray(figs)) arr = figs;
    else if (figs && typeof (figs as { toJs?: () => unknown }).toJs === "function") {
      const js = (figs as { toJs: () => unknown }).toJs();
      arr = Array.isArray(js) ? js : [];
    }
    for (const img of arr) post({ type: "image", data: String(img) });
  } catch {
    /* no figures */
  }
}

function errorText(err: unknown) {
  if (err && typeof err === "object") {
    const e = err as { message?: string; name?: string; toString?: () => string };
    return e.message || e.toString?.() || String(err);
  }
  return String(err);
}

async function analyze(code: string) {
  const py = await ensurePyodide();
  try {
    py.globals.set("_zhina_src", code);
    const raw = await py.runPythonAsync(ANALYZE_SRC + "\n_zhina_analyze(_zhina_src)");
    post({ type: "analysis", diagnostics: JSON.parse(String(raw)) });
  } catch (err) {
    post({ type: "analysis", diagnostics: [] });
    void err;
  }
}

async function install(name: string) {
  const py = await ensurePyodide();
  post({ type: "status", status: "loading", detail: `Installing ${name}` });
  try {
    await py.loadPackage("micropip");
    py.globals.set("_zhina_pkg", name);
    await py.runPythonAsync(`
import micropip
await micropip.install(_zhina_pkg)
`);
    post({ type: "installed", name, ok: true });
  } catch (err) {
    try {
      await py.loadPackage(name);
      post({ type: "installed", name, ok: true });
    } catch (err2) {
      post({
        type: "installed",
        name,
        ok: false,
        message: errorText(err2 ?? err),
      });
    }
  } finally {
    post({ type: "status", status: "ready" });
  }
}

let chain: Promise<void> = Promise.resolve();

self.onmessage = (event: MessageEvent) => {
  const msg = event.data as { type: string; code?: string; stdin?: string; name?: string };
  chain = chain.then(async () => {
    try {
      if (msg.type === "init") await ensurePyodide();
      else if (msg.type === "run") await run(msg.code ?? "", msg.stdin ?? "", "run");
      else if (msg.type === "repl") await run(msg.code ?? "", msg.stdin ?? "", "repl");
      else if (msg.type === "analyze") await analyze(msg.code ?? "");
      else if (msg.type === "install") await install(msg.name ?? "");
    } catch (err) {
      post({ type: "fatal", text: errorText(err) });
    }
  });
};
