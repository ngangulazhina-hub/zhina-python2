import { useEffect, useRef, useState } from "react";
import type { EditorView } from "@codemirror/view";
import { Check } from "lucide-react";
import { useIdeStore } from "@/lib/ide/store";
import { goToLine } from "@/components/ide/python-editor";

export function AnalysisStrip({ viewRef }: { viewRef: React.MutableRefObject<EditorView | null> }) {
  const diagnostics = useIdeStore((s) => s.diagnostics);
  const cursor = useIdeStore((s) => s.cursor);
  const pythonVersion = useIdeStore((s) => s.pythonVersion);
  const status = useIdeStore((s) => s.status);
  const code = useIdeStore((s) => s.code);
  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");
  const first = errors[0] ?? warnings[0];

  // Saving already happens automatically on every keystroke (see store.setCode) —
  // this just makes that visible instead of silent, since nothing else in the UI shows it.
  const [saving, setSaving] = useState(false);
  const timer = useRef<number>();
  useEffect(() => {
    setSaving(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaving(false), 400);
    return () => window.clearTimeout(timer.current);
  }, [code]);

  return (
    <div className="flex h-8 shrink-0 items-center gap-3 overflow-hidden border-t border-border bg-surface px-3 text-xs text-muted tabular-nums">
      <span className="truncate">{status === "loading" ? "Loading interpreter" : pythonVersion}</span>
      <span>
        Ln {cursor.line}, Col {cursor.column}
      </span>
      {first ? (
        <button
          type="button"
          className="min-w-0 truncate text-left text-fg"
          onClick={() => goToLine(viewRef.current, first.line, first.column)}
        >
          {errors.length ? `${errors.length} error${errors.length === 1 ? "" : "s"}` : `${warnings.length} warning${warnings.length === 1 ? "" : "s"}`}
          {": "}
          {first.type} on line {first.line}
        </button>
      ) : (
        <span>No issues</span>
      )}
      <span className="ml-auto flex shrink-0 items-center gap-1">
        {saving ? (
          <span className="size-1.5 rounded-full bg-muted" />
        ) : (
          <Check className="size-3" />
        )}
        {saving ? "Saving…" : "Saved"}
      </span>
    </div>
  );
}
