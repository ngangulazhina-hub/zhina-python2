// Parses a subset of ANSI SGR (Select Graphic Rendition) escape codes —
// the ones Python code actually produces via print("\033[...m...") — into
// styled text segments. Unsupported/unknown codes are stripped rather than
// shown as garbage characters.

export type AnsiSegment = {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  dim?: boolean;
};

const FG_COLORS: Record<number, string> = {
  30: "#3b3a37",
  31: "#e5657a",
  32: "#8fbf6f",
  33: "#d9b158",
  34: "#6fa8dc",
  35: "#b48ead",
  36: "#67c3c0",
  37: "#d8d4cb",
  90: "#787569",
  91: "#f28fa0",
  92: "#a9d98a",
  93: "#e8c878",
  94: "#8fc0ef",
  95: "#cdaed0",
  96: "#8fdad7",
  97: "#f0ede6",
};

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[([0-9;]*)m/g;

export function parseAnsi(input: string): AnsiSegment[] {
  if (!input.includes("\x1b[")) return [{ text: input }];

  const segments: AnsiSegment[] = [];
  let current: Omit<AnsiSegment, "text"> = {};
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  ANSI_RE.lastIndex = 0;
  while ((match = ANSI_RE.exec(input))) {
    if (match.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, match.index), ...current });
    }
    const codes = match[1] ? match[1].split(";").map(Number) : [0];
    for (const code of codes) {
      if (code === 0) current = {};
      else if (code === 1) current = { ...current, bold: true };
      else if (code === 2) current = { ...current, dim: true };
      else if (code === 3) current = { ...current, italic: true };
      else if (code === 4) current = { ...current, underline: true };
      else if (code === 22) current = { ...current, bold: false, dim: false };
      else if (code === 23) current = { ...current, italic: false };
      else if (code === 24) current = { ...current, underline: false };
      else if (code === 39) current = { ...current, color: undefined };
      else if (code in FG_COLORS) current = { ...current, color: FG_COLORS[code] };
    }
    lastIndex = ANSI_RE.lastIndex;
  }
  if (lastIndex < input.length) segments.push({ text: input.slice(lastIndex), ...current });
  return segments.length ? segments : [{ text: "" }];
}

export function stripAnsi(input: string): string {
  return input.replace(new RegExp(ANSI_RE.source, "g"), "");
}
