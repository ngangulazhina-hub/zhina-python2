import { useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { EditorView } from "@codemirror/view";
import { moveCursorLine } from "@/lib/editor/volume-cursor";
import { useIdeStore } from "@/lib/ide/store";

export function VolumeRocker({ viewRef }: { viewRef: React.MutableRefObject<EditorView | null> }) {
  const enabled = useIdeStore((s) => s.settings.volumeCursor);
  const timer = useRef<number | null>(null);

  if (!enabled) return null;

  const hold = (dir: 1 | -1) => {
    const step = () => {
      if (viewRef.current) moveCursorLine(viewRef.current, dir);
    };
    step();
    const id = window.setTimeout(() => {
      timer.current = window.setInterval(step, 70);
    }, 380);
    const stop = () => {
      window.clearTimeout(id);
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointerup", stop);
  };

  return (
    <div
      className="pointer-events-auto absolute top-1/3 z-30 flex w-10 flex-col overflow-hidden rounded-l-xl border border-border bg-elevated shadow-[var(--shadow-border)]"
      style={{ right: "max(0px, env(safe-area-inset-right, 0px))" }}
      aria-label="Volume buttons move the cursor"
    >
      <button
        type="button"
        className="flex h-11 items-center justify-center text-fg active:bg-surface"
        aria-label="Move cursor up"
        onPointerDown={(e) => {
          e.preventDefault();
          hold(-1);
        }}
      >
        <ChevronUp className="size-4" />
      </button>
      <div className="h-px bg-border" />
      <button
        type="button"
        className="flex h-11 items-center justify-center text-fg active:bg-surface"
        aria-label="Move cursor down"
        onPointerDown={(e) => {
          e.preventDefault();
          hold(1);
        }}
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}
