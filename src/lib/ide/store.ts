import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { WELCOME_CODE } from "@/lib/ide/examples";
import { THEME_PRESETS, type EditorColors, type ThemePreset } from "@/lib/ide/themes";
import type { Diagnostic, RuntimeStatus, TerminalLine } from "@/lib/python/types";
import type { ParsedError } from "@/lib/python/traceback";

export type Screen = "editor" | "terminal" | "settings" | "libraries";
export type TerminalLayout = "below" | "screen";
export type PyFile = { id: string; name: string; code: string; updatedAt: number };

export type IdeSettings = EditorColors & {
  preset: ThemePreset;
  fontFamily: string;
  fontSize: number;
  fontWeight: "400" | "500" | "600" | "700";
  fontStyle: "normal" | "italic";
  tabSize: number;
  wordWrap: boolean;
  showBlockLines: boolean;
  volumeCursor: boolean;
};

const ink = THEME_PRESETS.ink.colors;

export const DEFAULT_SETTINGS: IdeSettings = {
  ...ink,
  preset: "ink",
  fontFamily: "IBM Plex Mono",
  fontSize: 14,
  fontWeight: "400",
  fontStyle: "normal",
  tabSize: 4,
  wordWrap: true,
  showBlockLines: true,
  volumeCursor: true,
};

type IdeState = {
  hydrated: boolean;
  hasUsed: boolean;
  code: string;
  files: PyFile[];
  currentFileId: string;
  stdin: string;
  replDraft: string;
  settings: IdeSettings;
  terminalLayout: TerminalLayout;
  screen: Screen;
  status: RuntimeStatus;
  statusDetail: string;
  pythonVersion: string;
  lines: TerminalLine[];
  diagnostics: Diagnostic[];
  lastError: ParsedError | null;
  cursor: { line: number; column: number };
  persistGranted: boolean;
  setHydrated: () => void;
  setCode: (code: string) => void;
  setStdin: (stdin: string) => void;
  setReplDraft: (v: string) => void;
  patchSettings: (patch: Partial<IdeSettings>) => void;
  applyPreset: (preset: ThemePreset) => void;
  setTerminalLayout: (layout: TerminalLayout) => void;
  setScreen: (screen: Screen) => void;
  setStatus: (status: RuntimeStatus, detail?: string) => void;
  setPythonVersion: (v: string) => void;
  appendLine: (line: Omit<TerminalLine, "id">) => void;
  clearTerminal: () => void;
  setDiagnostics: (d: Diagnostic[]) => void;
  setLastError: (e: ParsedError | null) => void;
  setCursor: (line: number, column: number) => void;
  setPersistGranted: (v: boolean) => void;
  resetSettings: () => void;
  newFile: (name?: string) => void;
  openRecentFile: (id: string) => void;
  renameCurrentFile: (name: string) => void;
  deleteFile: (id: string) => void;
  importFile: (name: string, code: string) => void;
};

let lineSeq = 0;

export const useIdeStore = create<IdeState>()(
  persist(
    (set) => ({
      hydrated: false,
      hasUsed: false,
      code: WELCOME_CODE,
      files: [{ id: "f0", name: "main.py", code: WELCOME_CODE, updatedAt: Date.now() }],
      currentFileId: "f0",
      stdin: "",
      replDraft: "",
      settings: DEFAULT_SETTINGS,
      terminalLayout: "below",
      screen: "editor",
      status: "idle",
      statusDetail: "",
      pythonVersion: "Python 3.14",
      lines: [],
      diagnostics: [],
      lastError: null,
      cursor: { line: 1, column: 1 },
      persistGranted: false,
      setHydrated: () => set({ hydrated: true }),
      setCode: (code) =>
        set((s) => ({
          code,
          hasUsed: true,
          files: s.files.map((f) => (f.id === s.currentFileId ? { ...f, code, updatedAt: Date.now() } : f)),
        })),
      setStdin: (stdin) => set({ stdin }),
      setReplDraft: (replDraft) => set({ replDraft }),
      patchSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      applyPreset: (preset) =>
        set((s) => ({
          settings: { ...s.settings, ...THEME_PRESETS[preset].colors, preset },
        })),
      setTerminalLayout: (terminalLayout) =>
        set((s) => ({
          terminalLayout,
          screen: terminalLayout === "screen" && s.screen === "terminal" ? "terminal" : "editor",
        })),
      setScreen: (screen) => set({ screen }),
      setStatus: (status, statusDetail = "") => set({ status, statusDetail }),
      setPythonVersion: (pythonVersion) => set({ pythonVersion }),
      appendLine: (line) =>
        set((s) => ({
          lines: [...s.lines, { ...line, id: `l${++lineSeq}` }].slice(-400),
        })),
      clearTerminal: () => set({ lines: [], lastError: null }),
      setDiagnostics: (diagnostics) => set({ diagnostics }),
      setLastError: (lastError) => set({ lastError }),
      setCursor: (line, column) => set({ cursor: { line, column } }),
      setPersistGranted: (persistGranted) => set({ persistGranted }),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS, terminalLayout: "below" }),
      newFile: (name) =>
        set((s) => {
          const id = `f${Date.now()}`;
          const base = (name?.trim() || `untitled${s.files.length}`).replace(/\.py$/i, "");
          return {
            files: [...s.files, { id, name: `${base}.py`, code: "", updatedAt: Date.now() }],
            currentFileId: id,
            code: "",
            hasUsed: true,
            lastError: null,
          };
        }),
      openRecentFile: (id) =>
        set((s) => {
          const f = s.files.find((x) => x.id === id);
          if (!f) return {};
          return { currentFileId: id, code: f.code, lastError: null };
        }),
      renameCurrentFile: (name) =>
        set((s) => {
          const base = name.trim().replace(/\.py$/i, "");
          if (!base) return {};
          return {
            files: s.files.map((f) => (f.id === s.currentFileId ? { ...f, name: `${base}.py` } : f)),
          };
        }),
      deleteFile: (id) =>
        set((s) => {
          const remaining = s.files.filter((f) => f.id !== id);
          if (remaining.length === 0) {
            const nf: PyFile = { id: `f${Date.now()}`, name: "main.py", code: "", updatedAt: Date.now() };
            return { files: [nf], currentFileId: nf.id, code: "" };
          }
          if (id !== s.currentFileId) return { files: remaining };
          const next = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0];
          return { files: remaining, currentFileId: next.id, code: next.code };
        }),
      importFile: (name, code) =>
        set((s) => {
          const id = `f${Date.now()}`;
          const base = name.trim().replace(/\.py$/i, "") || `untitled${s.files.length}`;
          return {
            files: [...s.files, { id, name: `${base}.py`, code, updatedAt: Date.now() }],
            currentFileId: id,
            code,
            hasUsed: true,
            lastError: null,
          };
        }),
    }),
    {
      name: "zhina-python",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
      migrate: (persisted: unknown) => {
        const s = (persisted ?? {}) as Partial<IdeState>;
        if (Array.isArray(s.files) && s.files.length > 0 && s.currentFileId) return s;
        const code = typeof s.code === "string" ? s.code : WELCOME_CODE;
        return { ...s, files: [{ id: "f0", name: "main.py", code, updatedAt: Date.now() }], currentFileId: "f0" };
      },
      partialize: (s) => ({
        code: s.code,
        files: s.files,
        currentFileId: s.currentFileId,
        stdin: s.stdin,
        settings: s.settings,
        terminalLayout: s.terminalLayout,
        hasUsed: s.hasUsed,
      }),
    },
  ),
);
