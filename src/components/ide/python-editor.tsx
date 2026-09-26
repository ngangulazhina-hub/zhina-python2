import { useEffect, useRef } from "react";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  highlightActiveLineGutter,
  lineNumbers,
  drawSelection,
  dropCursor,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import {
  foldGutter,
  indentOnInput,
  bracketMatching,
  indentUnit,
} from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { lintGutter, linter, type Diagnostic as CmDiagnostic } from "@codemirror/lint";
import { pythonAutocomplete } from "@/lib/python/completions";
import { blockLines } from "@/lib/editor/block-lines";
import { editorCssVars, editorTheme } from "@/lib/editor/theme";
import { isVolumeKey, moveCursorLine } from "@/lib/editor/volume-cursor";
import { useIdeStore } from "@/lib/ide/store";
import { cn } from "@/lib/utils";

const themeComp = new Compartment();
const wrapComp = new Compartment();
const tabComp = new Compartment();
const blockComp = new Compartment();
const lintComp = new Compartment();

function toCmDiagnostics(): CmDiagnostic[] {
  const diags = useIdeStore.getState().diagnostics;
  const doc = useIdeStore.getState().code;
  return diags.map((d) => {
    const from = d.from || offsetFromLine(doc, d.line, d.column);
    const to = d.to && d.to > from ? d.to : Math.min(doc.length, from + 1);
    return {
      from,
      to,
      severity: d.severity === "warning" ? "warning" : "error",
      message: `${d.type}: ${d.message}`,
    };
  });
}

function offsetFromLine(code: string, line: number, column: number) {
  const lines = code.split("\n");
  let off = 0;
  for (let i = 0; i < Math.max(0, line - 1); i++) off += (lines[i]?.length ?? 0) + 1;
  return Math.min(code.length, off + Math.max(0, column - 1));
}

export function PythonEditor({
  viewRef,
  className,
}: {
  viewRef: React.MutableRefObject<EditorView | null>;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const settings = useIdeStore((s) => s.settings);
  const setCode = useIdeStore((s) => s.setCode);
  const setCursor = useIdeStore((s) => s.setCursor);

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;
    const start = useIdeStore.getState().code;
    const s = useIdeStore.getState().settings;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) setCode(update.state.doc.toString());
      const head = update.state.selection.main.head;
      const line = update.state.doc.lineAt(head);
      setCursor(line.number, head - line.from + 1);
    });

    const runKey = keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          window.dispatchEvent(new CustomEvent("zhina-run"));
          return true;
        },
      },
      {
        key: "Mod-.",
        run: () => {
          useIdeStore.getState().setScreen("settings");
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: start,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        python(),
        pythonAutocomplete(),
        highlightSelectionMatches(),
        lintGutter(),
        lintComp.of(linter(() => toCmDiagnostics(), { delay: 400 })),
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
        runKey,
        themeComp.of(editorTheme(s)),
        wrapComp.of(s.wordWrap ? EditorView.lineWrapping : []),
        tabComp.of([EditorState.tabSize.of(s.tabSize), indentUnit.of(" ".repeat(s.tabSize))]),
        blockComp.of(blockLines(s.showBlockLines, s.tabSize)),
        updateListener,
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
        }),
      ] satisfies Extension[],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [setCode, setCursor, viewRef]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: [
        themeComp.reconfigure(editorTheme(settings)),
        wrapComp.reconfigure(settings.wordWrap ? EditorView.lineWrapping : []),
        tabComp.reconfigure([EditorState.tabSize.of(settings.tabSize), indentUnit.of(" ".repeat(settings.tabSize))]),
        blockComp.reconfigure(blockLines(settings.showBlockLines, settings.tabSize)),
      ],
    });
  }, [settings, viewRef]);

  useEffect(() => {
    return useIdeStore.subscribe((state, prev) => {
      if (state.code === prev.code) return;
      const view = viewRef.current;
      if (!view) return;
      if (view.state.doc.toString() === state.code) return;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: state.code },
      });
    });
  }, [viewRef]);

  useEffect(() => {
    if (!settings.volumeCursor) return;
    const onKey = (e: KeyboardEvent) => {
      const dir = isVolumeKey(e);
      if (!dir) return;
      const view = viewRef.current;
      if (!view) return;
      e.preventDefault();
      moveCursorLine(view, dir as 1 | -1);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [settings.volumeCursor, viewRef]);

  return (
    <div
      className={cn("zhina-cm min-h-0 flex-1 overflow-hidden", className)}
      style={editorCssVars(settings)}
      ref={hostRef}
    />
  );
}

export function goToLine(view: EditorView | null, line: number, column = 1) {
  if (!view) return;
  const ln = Math.min(Math.max(1, line), view.state.doc.lines);
  const row = view.state.doc.line(ln);
  const pos = Math.min(row.to, row.from + Math.max(0, column - 1));
  view.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
  view.focus();
}
