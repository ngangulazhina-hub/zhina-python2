import { EditorView, layer, RectangleMarker, type PluginValue, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

function indentOf(text: string, tabSize: number) {
  let n = 0;
  for (const ch of text) {
    if (ch === " ") n += 1;
    else if (ch === "\t") n += tabSize;
    else break;
  }
  return n;
}

function isBlank(text: string) {
  return !text.trim();
}

function currentBlock(doc: { line: (n: number) => { number: number; text: string; from: number; to: number }; lines: number }, lineNumber: number, tabSize: number) {
  const line = doc.line(lineNumber);
  let indent = indentOf(line.text, tabSize);
  if (isBlank(line.text)) {
    let up = lineNumber;
    while (up > 1 && isBlank(doc.line(up).text)) up -= 1;
    indent = indentOf(doc.line(up).text, tabSize);
  }
  let start = lineNumber;
  while (start > 1) {
    const prev = doc.line(start - 1);
    if (isBlank(prev.text)) {
      start -= 1;
      continue;
    }
    const pi = indentOf(prev.text, tabSize);
    if (pi < indent) break;
    start -= 1;
  }
  let end = lineNumber;
  while (end < doc.lines) {
    const next = doc.line(end + 1);
    if (isBlank(next.text)) {
      end += 1;
      continue;
    }
    const ni = indentOf(next.text, tabSize);
    if (ni < indent) break;
    end += 1;
  }
  while (end > start && isBlank(doc.line(end).text)) end -= 1;
  return { start, end, indent };
}

class BlockGuides implements PluginValue {
  constructor(readonly view: EditorView) {}
  update(_u: ViewUpdate) {}
}

export function blockLines(enabled: boolean, tabSize: number): Extension {
  if (!enabled) return [];

  const blockLayer = layer({
    above: false,
    class: "cm-zhina-blocks",
    update(update) {
      return update.docChanged || update.viewportChanged || update.selectionSet || update.geometryChanged;
    },
    markers(view) {
      const markers: RectangleMarker[] = [];
      const tab = tabSize || 4;
      const charW = view.defaultCharacterWidth;
      const contentLeft = view.contentDOM.getBoundingClientRect().left - view.scrollDOM.getBoundingClientRect().left + view.scrollDOM.scrollLeft;
      const sel = view.state.selection.main;
      const currentLine = view.state.doc.lineAt(sel.head);
      const block = currentBlock(view.state.doc, currentLine.number, tab);

      const startBlock = view.lineBlockAt(view.state.doc.line(block.start).from);
      const endBlock = view.lineBlockAt(view.state.doc.line(block.end).from);
      const top = startBlock.top;
      const height = endBlock.bottom - startBlock.top;
      const bandLeft = contentLeft + block.indent * charW;
      if (height > 0) {
        markers.push(new RectangleMarker("zhina-block-band", 0, top, view.scrollDOM.scrollWidth, height));
        markers.push(new RectangleMarker("zhina-block-bar", bandLeft, top, 2, height));
      }

      const { from, to } = view.viewport;
      let lineNo = view.state.doc.lineAt(from).number;
      const last = view.state.doc.lineAt(to).number;
      const seen = new Set<string>();
      for (; lineNo <= last; lineNo++) {
        const line = view.state.doc.line(lineNo);
        if (isBlank(line.text)) continue;
        const indent = indentOf(line.text, tab);
        const levels = Math.floor(indent / tab);
        const lb = view.lineBlockAt(line.from);
        for (let i = 1; i <= levels; i++) {
          const key = `${lb.top}:${i}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const x = contentLeft + i * tab * charW;
          markers.push(new RectangleMarker("zhina-guide", x, lb.top, 1, lb.height));
        }
      }
      return markers;
    },
  });

  return [
    ViewPlugin.fromClass(BlockGuides),
    blockLayer,
    EditorView.theme({
      ".cm-zhina-blocks": { pointerEvents: "none" },
    }),
  ];
}
