import type { EditorView } from "@codemirror/view";

const VOLUME_KEYS = new Set([
  "AudioVolumeUp",
  "AudioVolumeDown",
  "VolumeUp",
  "VolumeDown",
  "MediaVolumeUp",
  "MediaVolumeDown",
]);

export function isVolumeKey(e: KeyboardEvent) {
  if (VOLUME_KEYS.has(e.key)) return e.key.includes("Up") ? 1 : -1;
  if (e.keyCode === 24 || e.keyCode === 175 || e.keyCode === 183) return 1;
  if (e.keyCode === 25 || e.keyCode === 174 || e.keyCode === 182) return -1;
  return 0;
}

export function moveCursorLine(view: EditorView, direction: 1 | -1) {
  const head = view.state.selection.main.head;
  const line = view.state.doc.lineAt(head);
  const col = head - line.from;
  const nextNo = line.number + direction;
  if (nextNo < 1 || nextNo > view.state.doc.lines) return;
  const next = view.state.doc.line(nextNo);
  const pos = next.from + Math.min(col, next.length);
  view.dispatch({
    selection: { anchor: pos },
    scrollIntoView: true,
  });
  view.focus();
}
