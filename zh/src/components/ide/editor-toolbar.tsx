import type { EditorView } from "@codemirror/view";
import {
  cursorCharLeft,
  cursorCharRight,
  cursorLineUp,
  cursorLineDown,
  cursorLineBoundaryBackward,
  cursorLineBoundaryForward,
  indentMore,
  indentLess,
  undo,
  redo,
} from "@codemirror/commands";
import { openSearchPanel } from "@codemirror/search";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Redo2, Search, Undo2, MoveVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { goToLine } from "@/components/ide/python-editor";

// Packaged as a native app, the browser no longer supplies its own
// arrow-key/cursor accessory bar above the keyboard (that was always the
// browser's UI, not this app's) — so this replaces it, and stays visible
// rather than depending on flaky on-device "is the keyboard open" detection.
const SYMBOLS = ["(", ")", "[", "]", "{", "}", ":", '"', "'", "#", "_", "=", ".", ","];

function insertText(view: EditorView, text: string) {
  view.dispatch(view.state.replaceSelection(text));
  view.focus();
}

function Key({
  children,
  label,
  onClick,
  wide,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-sm text-fg active:bg-surface",
        wide ? "min-w-11 px-3" : "w-9",
      )}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ viewRef }: { viewRef: React.MutableRefObject<EditorView | null> }) {
  const run = (fn: (v: EditorView) => void) => {
    const view = viewRef.current;
    if (!view) return;
    fn(view);
    view.focus();
  };

  return (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-t border-border bg-bg px-1.5 py-1.5">
      <Key
        label="Search"
        onClick={() => {
          const view = viewRef.current;
          if (view) openSearchPanel(view);
        }}
      >
        <Search className="size-4" />
      </Key>
      <Key
        label="Go to line"
        onClick={() => {
          const view = viewRef.current;
          if (!view) return;
          const total = view.state.doc.lines;
          const raw = window.prompt(`Go to line (1–${total})`);
          if (!raw) return;
          const n = parseInt(raw, 10);
          if (Number.isFinite(n)) goToLine(view, n);
        }}
      >
        <MoveVertical className="size-4" />
      </Key>
      <div className="mx-0.5 h-6 w-px shrink-0 bg-border" />
      <Key label="Undo" onClick={() => run((v) => undo(v))}>
        <Undo2 className="size-4" />
      </Key>
      <Key label="Redo" onClick={() => run((v) => redo(v))}>
        <Redo2 className="size-4" />
      </Key>
      <Key label="Tab" wide onClick={() => run((v) => indentMore(v))}>
        Tab
      </Key>
      <Key label="Shift+Tab" wide onClick={() => run((v) => indentLess(v))}>
        ⇤
      </Key>
      <div className="mx-0.5 h-6 w-px shrink-0 bg-border" />
      <Key label="Move left" onClick={() => run((v) => cursorCharLeft(v))}>
        <ArrowLeft className="size-4" />
      </Key>
      <Key label="Move right" onClick={() => run((v) => cursorCharRight(v))}>
        <ArrowRight className="size-4" />
      </Key>
      <Key label="Move up" onClick={() => run((v) => cursorLineUp(v))}>
        <ArrowUp className="size-4" />
      </Key>
      <Key label="Move down" onClick={() => run((v) => cursorLineDown(v))}>
        <ArrowDown className="size-4" />
      </Key>
      <Key label="Line start" wide onClick={() => run((v) => cursorLineBoundaryBackward(v))}>
        Home
      </Key>
      <Key label="Line end" wide onClick={() => run((v) => cursorLineBoundaryForward(v))}>
        End
      </Key>
      <div className="mx-0.5 h-6 w-px shrink-0 bg-border" />
      {SYMBOLS.map((s) => (
        <Key key={s} label={`Insert ${s}`} onClick={() => run((v) => insertText(v, s))}>
          {s}
        </Key>
      ))}
    </div>
  );
}
