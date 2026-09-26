import type { EditorView } from "@codemirror/view";
import { useIdeStore } from "@/lib/ide/store";
import { goToLine } from "@/components/ide/python-editor";

export function AnalysisStrip({ viewRef }: { viewRef: React.MutableRefObject<EditorView | null> }) {
  const diagnostics = useIdeStore((s) => s.diagnostics);
  const cursor = useIdeStore((s) => s.cursor);
  const pythonVersion = useIdeStore((s) => s.pythonVersion);
  const status = useIdeStore((s) => s.status);
  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");
  const first = errors[0] ?? warnings[0];

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
    </div>
  );
}
