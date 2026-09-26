import { Book, Download, FolderOpen, MoreHorizontal, Plus, Settings, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXAMPLES } from "@/lib/ide/examples";
import { useIdeStore } from "@/lib/ide/store";
import { useState } from "react";

export function IdeHeader() {
  const setScreen = useIdeStore((s) => s.setScreen);
  const setCode = useIdeStore((s) => s.setCode);
  const layout = useIdeStore((s) => s.terminalLayout);
  const screen = useIdeStore((s) => s.screen);
  const [menu, setMenu] = useState(false);
  const [examples, setExamples] = useState(false);

  const openFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".py,text/x-python,text/plain";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void file.text().then((text) => setCode(text));
    };
    input.click();
  };

  const saveFile = () => {
    const blob = new Blob([useIdeStore.getState().code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "main.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="relative flex h-12 shrink-0 items-center gap-1 border-b border-border bg-bg px-2 pt-[env(safe-area-inset-top)]">
      <div className="flex min-w-0 flex-1 items-center gap-2 pl-1">
        <Logo />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium tracking-tight">Zhina</p>
          <p className="truncate text-[11px] text-muted">Python</p>
        </div>
      </div>
      {layout === "screen" ? (
        <div className="mr-1 flex rounded-lg bg-elevated p-0.5">
          <button
            type="button"
            className={`h-8 rounded-md px-3 text-xs ${screen === "editor" ? "bg-surface text-fg" : "text-muted"}`}
            onClick={() => setScreen("editor")}
          >
            Editor
          </button>
          <button
            type="button"
            className={`h-8 rounded-md px-3 text-xs ${screen === "terminal" ? "bg-surface text-fg" : "text-muted"}`}
            onClick={() => setScreen("terminal")}
          >
            Terminal
          </button>
        </div>
      ) : null}
      <Button type="button" variant="ghost" size="icon" className="size-10" aria-label="Examples" onClick={() => setExamples((v) => !v)}>
        <Book className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-10" aria-label="Libraries" onClick={() => setScreen("libraries")}>
        <span className="font-mono text-xs">lib</span>
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-10" aria-label="More" onClick={() => setMenu((v) => !v)}>
        <MoreHorizontal className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-10" aria-label="Settings" onClick={() => setScreen("settings")}>
        <Settings className="size-4" />
      </Button>

      {examples ? (
        <Menu onClose={() => setExamples(false)}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className="flex h-11 w-full items-center px-3 text-left text-sm hover:bg-elevated"
              onClick={() => {
                setCode(ex.code);
                setExamples(false);
                setScreen("editor");
              }}
            >
              {ex.title}
            </button>
          ))}
        </Menu>
      ) : null}

      {menu ? (
        <Menu onClose={() => setMenu(false)}>
          <Item icon={<Plus className="size-4" />} label="New file" onClick={() => useIdeStore.getState().newFile()} />
          <Item icon={<FolderOpen className="size-4" />} label="Open" onClick={openFile} />
          <Item icon={<Download className="size-4" />} label="Download .py" onClick={saveFile} />
          <Item
            icon={<Terminal className="size-4" />}
            label={layout === "below" ? "Terminal on its own screen" : "Terminal under editor"}
            onClick={() => useIdeStore.getState().setTerminalLayout(layout === "below" ? "screen" : "below")}
          />
        </Menu>
      ) : null}
    </header>
  );
}

function Item({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex h-11 w-full items-center gap-3 px-3 text-left text-sm hover:bg-elevated"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function Menu({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <button type="button" className="fixed inset-0 z-30" aria-label="Close menu" onClick={onClose} />
      <div className="absolute top-12 right-2 z-40 min-w-52 overflow-hidden rounded-2xl bg-surface py-1 shadow-[var(--shadow-border),var(--shadow-lift)]">
        {children}
      </div>
    </>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="shrink-0">
      <rect width="28" height="28" rx="7" fill="#b8c4ce" />
      <path d="M8 8h12l-8 6 8 6H8" fill="none" stroke="#111110" strokeWidth="2.1" strokeLinejoin="round" />
    </svg>
  );
}
