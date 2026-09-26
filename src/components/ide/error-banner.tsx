import { CircleAlert, X } from "lucide-react";
import type { EditorView } from "@codemirror/view";
import { useIdeStore } from "@/lib/ide/store";
import { goToLine } from "@/components/ide/python-editor";
import { Button } from "@/components/ui/button";

export function ErrorBanner({ viewRef }: { viewRef: React.MutableRefObject<EditorView | null> }) {
  const lastError = useIdeStore((s) => s.lastError);
  const setLastError = useIdeStore((s) => s.setLastError);
  if (!lastError) return null;

  return (
    <div className="flex items-start gap-3 border-t border-danger/40 bg-danger/10 px-3 py-2.5 text-fg">
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" />
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => {
          if (lastError.line) goToLine(viewRef.current, lastError.line, lastError.column ?? 1);
        }}
      >
        <p className="text-sm font-medium">
          {lastError.type}
          {lastError.line ? (
            <span className="ml-2 font-normal text-muted">on line {lastError.line}</span>
          ) : null}
        </p>
        <p className="mt-0.5 text-sm text-fg/90">{lastError.message}</p>
      </button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-8 shrink-0"
        aria-label="Dismiss error"
        onClick={() => setLastError(null)}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
