import { useEffect, useRef } from "react";
import { Trash2, Copy } from "lucide-react";
import { useIdeStore } from "@/lib/ide/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseAnsi, stripAnsi } from "@/lib/python/ansi";

export function PythonTerminal({ className }: { className?: string }) {
  const lines = useIdeStore((s) => s.lines);
  const stdin = useIdeStore((s) => s.stdin);
  const setStdin = useIdeStore((s) => s.setStdin);
  const replDraft = useIdeStore((s) => s.replDraft);
  const setReplDraft = useIdeStore((s) => s.setReplDraft);
  const settings = useIdeStore((s) => s.settings);
  const clearTerminal = useIdeStore((s) => s.clearTerminal);
  const status = useIdeStore((s) => s.status);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines]);

  const onRepl = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || status === "running" || status === "loading") return;
    const cmd = replDraft.trim();
    if (!cmd) return;
    useIdeStore.getState().appendLine({ kind: "in", text: `>>> ${cmd}` });
    setReplDraft("");
    window.dispatchEvent(new CustomEvent("zhina-repl", { detail: cmd }));
  };

  return (
    <section
      className={cn("flex min-h-0 flex-col", className)}
      style={{
        background: settings.terminalBg,
        color: settings.terminalFg,
        fontFamily: settings.fontFamily,
        fontSize: `${Math.max(12, settings.fontSize - 1)}px`,
        fontWeight: settings.fontWeight,
        fontStyle: settings.fontStyle,
      }}
    >
      <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-t border-border px-3">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Terminal</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9"
            aria-label="Copy output"
            onClick={() => {
              const text = lines
                .filter((l) => l.kind !== "image")
                .map((l) => stripAnsi(l.text))
                .join("\n");
              void navigator.clipboard?.writeText(text);
            }}
          >
            <Copy className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9"
            aria-label="Clear terminal"
            onClick={clearTerminal}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>
      <div ref={scroller} className="min-h-0 flex-1 overflow-auto px-3 pb-2">
        {lines.length === 0 ? (
          <p className="pt-2 text-sm" style={{ color: settings.terminalPrompt }}>
            Output appears here. Type below to use the interactive shell.
          </p>
        ) : (
          lines.map((line) =>
            line.kind === "image" ? (
              <img
                key={line.id}
                src={`data:image/png;base64,${line.text}`}
                alt="Plot output"
                className="my-2 max-w-full rounded-md outline outline-1 -outline-offset-1 outline-black/10"
              />
            ) : (
              <pre key={line.id} className="whitespace-pre-wrap break-words leading-relaxed">
                {parseAnsi(line.text).map((seg, i) => (
                  <span
                    key={i}
                    style={{
                      color:
                        seg.color ??
                        (line.kind === "stderr"
                          ? settings.terminalErr
                          : line.kind === "in" || line.kind === "system" || line.kind === "prompt"
                            ? settings.terminalPrompt
                            : settings.terminalFg),
                      fontWeight: seg.bold ? 700 : undefined,
                      fontStyle: seg.italic ? "italic" : undefined,
                      textDecoration: seg.underline ? "underline" : undefined,
                      opacity: seg.dim ? 0.65 : undefined,
                    }}
                  >
                    {seg.text}
                  </span>
                ))}
              </pre>
            ),
          )
        )}
      </div>
      <div className="shrink-0 border-t border-border px-3 py-2">
        <label className="mb-1 block text-[11px] tracking-wide text-muted uppercase">
          Program input
        </label>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={2}
          placeholder="Program input: one answer per input() call, in order"
          className="mb-2 w-full resize-none rounded-lg border-0 bg-black/20 px-2 py-1.5 text-sm outline-none"
          style={{ color: settings.terminalFg }}
        />
        <div className="flex items-center gap-2">
          <span className="select-none" style={{ color: settings.terminalPrompt }}>
            {">>>"}
          </span>
          <input
            value={replDraft}
            onChange={(e) => setReplDraft(e.target.value)}
            onKeyDown={onRepl}
            placeholder="Interactive shell"
            className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
            style={{ color: settings.terminalFg }}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </div>
    </section>
  );
}
