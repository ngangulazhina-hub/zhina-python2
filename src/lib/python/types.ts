export type Diagnostic = {
  from: number;
  to: number;
  line: number;
  column: number;
  severity: "error" | "warning" | "info";
  type: string;
  message: string;
};

export type TerminalLine = {
  id: string;
  kind: "stdout" | "stderr" | "system" | "in" | "image";
  text: string;
};

export type RuntimeStatus = "idle" | "loading" | "ready" | "running" | "error";
