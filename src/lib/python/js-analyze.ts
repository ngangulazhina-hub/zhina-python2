import { parser } from "@lezer/python";
import type { Diagnostic } from "@/lib/python/types";

export function analyzeWithLezer(code: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (!code.trim()) return diagnostics;

  const tree = parser.parse(code);
  tree.iterate({
    enter(node) {
      if (node.type.isError) {
        diagnostics.push({
          from: node.from,
          to: Math.max(node.to, node.from + 1),
          line: lineAt(code, node.from),
          column: colAt(code, node.from),
          severity: "error",
          type: "SyntaxError",
          message: "Invalid syntax",
        });
      }
    },
  });

  const lines = code.split("\n");
  let previousIndent = 0;
  lines.forEach((text, i) => {
    if (!text.trim() || text.trim().startsWith("#")) return;
    const indent = text.match(/^[ \t]*/)?.[0] ?? "";
    if (indent.includes(" ") && indent.includes("\t")) {
      diagnostics.push({
        from: offsetAt(code, i + 1, 1),
        to: offsetAt(code, i + 1, indent.length + 1),
        line: i + 1,
        column: 1,
        severity: "error",
        type: "TabError",
        message: "Inconsistent use of tabs and spaces in indentation",
      });
    }
    const n = indent.replace(/\t/g, "    ").length;
    if (n > previousIndent + 8 && previousIndent > 0) {
      diagnostics.push({
        from: offsetAt(code, i + 1, 1),
        to: offsetAt(code, i + 1, 2),
        line: i + 1,
        column: 1,
        severity: "warning",
        type: "IndentationWarning",
        message: "Unexpected jump in indentation",
      });
    }
    previousIndent = n;
  });

  for (const m of code.matchAll(/^(?:import|from)\s+([A-Za-z_][\w.]*)/gm)) {
    const imported = (m[1] ?? "").split(".")[0];
    if (imported && !nameUsedOutsideImport(code, imported)) {
      diagnostics.push({
        from: m.index ?? 0,
        to: (m.index ?? 0) + m[0].length,
        line: lineAt(code, m.index ?? 0),
        column: 1,
        severity: "warning",
        type: "UnusedImport",
        message: `Imported '${imported}' is never used`,
      });
    }
  }

  return unique(diagnostics);
}

function nameUsedOutsideImport(code: string, name: string) {
  const re = new RegExp(`\\b${name}\\b`, "g");
  return [...code.matchAll(re)].length > 1;
}

function lineAt(code: string, index: number) {
  return code.slice(0, index).split("\n").length;
}

function colAt(code: string, index: number) {
  const lineStart = code.lastIndexOf("\n", index - 1) + 1;
  return index - lineStart + 1;
}

function offsetAt(code: string, line: number, column: number) {
  const lines = code.split("\n");
  let off = 0;
  for (let i = 0; i < line - 1; i++) off += (lines[i]?.length ?? 0) + 1;
  return off + Math.max(0, column - 1);
}

function unique(items: Diagnostic[]) {
  const seen = new Set<string>();
  return items.filter((d) => {
    const key = `${d.line}:${d.type}:${d.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
