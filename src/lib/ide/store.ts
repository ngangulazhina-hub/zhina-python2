import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { WELCOME_CODE } from "@/lib/ide/examples";
import { THEME_PRESETS, type EditorColors, type ThemePreset } from "@/lib/ide/themes";
import type { Diagnostic, RuntimeStatus, TerminalLine } from "@/lib/python/types";
import type { ParsedError } from "@/lib/python/traceback";

export type Screen = "editor" | "terminal" | "settings" | "libraries";
export type TerminalLayout = "below" | "screen";

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
  newFile: () => void;
};

let lineSeq = 0;

export const useIdeStore = create<IdeState>()(
  persist(
    (set) => ({
      hydrated: false,
      hasUsed: false,
      code: WELCOME_CODE,
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
      setCode: (code) => set({ code, hasUsed: true }),
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
      newFile: () => set({ code: "", hasUsed: true, lastError: null }),
    }),
    {
      name: "zhina-python",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        code: s.code,
        stdin: s.stdin,
        settings: s.settings,
        terminalLayout: s.terminalLayout,
        hasUsed: s.hasUsed,
      }),
    },
  ),
);
