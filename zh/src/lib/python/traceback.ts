export type ParsedError = {
  type: string;
  message: string;
  line: number | null;
  column: number | null;
  traceback: string;
};

const TYPE_RE =
  /([A-Za-z_][A-Za-z0-9_]*(?:Error|Exception|Warning|Exit|Interrupt))\s*:/;
const FILE_LINE_RE = /File ".*?", line (\d+)/g;
const SYNTAX_LINE_RE = /File ".*?", line (\d+)/;

export function parsePythonError(raw: string): ParsedError {
  const text = raw.replace(/^PythonError:\s*/i, "").trim();
  const typeMatch = text.match(TYPE_RE);
  const type = typeMatch?.[1] ?? "Error";

  let message = text;
  const lastType = text.lastIndexOf(`${type}:`);
  if (lastType >= 0) {
    message = text.slice(lastType + type.length + 1).trim();
    const nextNl = message.indexOf("\n");
    if (nextNl >= 0) message = message.slice(0, nextNl).trim();
  }

  let line: number | null = null;
  let column: number | null = null;

  const lines: number[] = [];
  for (const match of text.matchAll(FILE_LINE_RE)) {
    const n = Number(match[1]);
    if (Number.isFinite(n)) lines.push(n);
  }
  if (lines.length) line = lines[lines.length - 1] ?? null;

  const syntax = text.match(SYNTAX_LINE_RE);
  if (!line && syntax) line = Number(syntax[1]);

  const caretLine = text.split("\n").find((l) => l.includes("^"));
  if (caretLine && line) {
    const idx = caretLine.indexOf("^");
    if (idx >= 0) column = idx + 1;
  }

  if (type === "SyntaxError" || type === "IndentationError" || type === "TabError") {
    const syn = text.match(/line (\d+)/);
    if (syn) line = Number(syn[1]);
  }

  return { type, message: message || text.slice(0, 180), line, column, traceback: text };
}
