export type EditorColors = {
  editorBg: string;
  editorFg: string;
  editorGutter: string;
  editorSelection: string;
  editorLine: string;
  editorBlock: string;
  editorGuide: string;
  editorCursor: string;
  editorComment: string;
  editorKeyword: string;
  editorString: string;
  editorNumber: string;
  editorFunction: string;
  terminalBg: string;
  terminalFg: string;
  terminalErr: string;
  terminalPrompt: string;
};

export type ThemePreset = "ink" | "paper" | "forest" | "contrast";

export const THEME_PRESETS: Record<
  ThemePreset,
  { label: string; colors: EditorColors }
> = {
  ink: {
    label: "Ink night",
    colors: {
      editorBg: "#161513",
      editorFg: "#f0ede6",
      editorGutter: "#6f6b64",
      editorSelection: "#3a474f",
      editorLine: "#1f1e1b",
      editorBlock: "rgba(184, 196, 206, 0.07)",
      editorGuide: "rgba(240, 237, 230, 0.12)",
      editorCursor: "#b8c4ce",
      editorComment: "#8a857c",
      editorKeyword: "#b8c4ce",
      editorString: "#9db5a4",
      editorNumber: "#d4c4a8",
      editorFunction: "#e4ddd0",
      terminalBg: "#0e0e0c",
      terminalFg: "#dcd6cc",
      terminalErr: "#e08b84",
      terminalPrompt: "#b8c4ce",
    },
  },
  paper: {
    label: "Paper",
    colors: {
      editorBg: "#f7f4ec",
      editorFg: "#1c1b18",
      editorGutter: "#8a857c",
      editorSelection: "#d5dde3",
      editorLine: "#efebe1",
      editorBlock: "rgba(61, 74, 85, 0.06)",
      editorGuide: "rgba(28, 27, 24, 0.12)",
      editorCursor: "#3d4a55",
      editorComment: "#7a756c",
      editorKeyword: "#3d4a55",
      editorString: "#3f6b52",
      editorNumber: "#7a5a2e",
      editorFunction: "#1c1b18",
      terminalBg: "#ece8de",
      terminalFg: "#1c1b18",
      terminalErr: "#9b3d36",
      terminalPrompt: "#3d4a55",
    },
  },
  forest: {
    label: "Forest",
    colors: {
      editorBg: "#121613",
      editorFg: "#e4ece4",
      editorGutter: "#6d7a6f",
      editorSelection: "#2c3a30",
      editorLine: "#181e1a",
      editorBlock: "rgba(125, 154, 126, 0.1)",
      editorGuide: "rgba(228, 236, 228, 0.12)",
      editorCursor: "#9db5a4",
      editorComment: "#7d8a80",
      editorKeyword: "#9db5a4",
      editorString: "#c4d4b8",
      editorNumber: "#d4c4a8",
      editorFunction: "#e4ece4",
      terminalBg: "#0c100d",
      terminalFg: "#d5e0d6",
      terminalErr: "#e08b84",
      terminalPrompt: "#9db5a4",
    },
  },
  contrast: {
    label: "High contrast",
    colors: {
      editorBg: "#000000",
      editorFg: "#ffffff",
      editorGutter: "#a3a3a3",
      editorSelection: "#335577",
      editorLine: "#141414",
      editorBlock: "rgba(255, 255, 255, 0.06)",
      editorGuide: "rgba(255, 255, 255, 0.22)",
      editorCursor: "#ffffff",
      editorComment: "#b0b0b0",
      editorKeyword: "#dce6f0",
      editorString: "#cde8d2",
      editorNumber: "#f0e6c8",
      editorFunction: "#ffffff",
      terminalBg: "#000000",
      terminalFg: "#ffffff",
      terminalErr: "#ff8a80",
      terminalPrompt: "#dce6f0",
    },
  },
};

export const FONT_FAMILIES = [
  { id: "IBM Plex Mono", label: "IBM Plex Mono" },
  { id: "JetBrains Mono", label: "JetBrains Mono" },
  { id: "Fira Code", label: "Fira Code" },
  { id: "Source Code Pro", label: "Source Code Pro" },
  { id: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", label: "System mono" },
] as const;
