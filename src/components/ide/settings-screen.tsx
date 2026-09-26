import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { FONT_FAMILIES, THEME_PRESETS, type ThemePreset } from "@/lib/ide/themes";
import { useIdeStore, type IdeSettings } from "@/lib/ide/store";
import { isAndroid, isStandalone, requestPersistentStorage } from "@/lib/ide/permissions";
import { cn } from "@/lib/utils";

const COLOR_FIELDS: { key: keyof IdeSettings; label: string }[] = [
  { key: "editorBg", label: "Editor background" },
  { key: "editorFg", label: "Editor text" },
  { key: "editorGutter", label: "Line numbers" },
  { key: "editorSelection", label: "Selection" },
  { key: "editorLine", label: "Current line" },
  { key: "editorCursor", label: "Cursor" },
  { key: "editorComment", label: "Comments" },
  { key: "editorKeyword", label: "Keywords" },
  { key: "editorString", label: "Strings" },
  { key: "editorNumber", label: "Numbers" },
  { key: "editorFunction", label: "Functions" },
  { key: "terminalBg", label: "Terminal background" },
  { key: "terminalFg", label: "Terminal text" },
  { key: "terminalErr", label: "Terminal errors" },
  { key: "terminalPrompt", label: "Terminal prompt" },
];

export function SettingsScreen() {
  const settings = useIdeStore((s) => s.settings);
  const patch = useIdeStore((s) => s.patchSettings);
  const applyPreset = useIdeStore((s) => s.applyPreset);
  const layout = useIdeStore((s) => s.terminalLayout);
  const setLayout = useIdeStore((s) => s.setTerminalLayout);
  const setScreen = useIdeStore((s) => s.setScreen);
  const persistGranted = useIdeStore((s) => s.persistGranted);
  const setPersistGranted = useIdeStore((s) => s.setPersistGranted);
  const pythonVersion = useIdeStore((s) => s.pythonVersion);
  const standalone = isStandalone();
  const android = isAndroid();

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg text-fg">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Back" onClick={() => setScreen("editor")}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-base font-medium">Settings</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-5 pb-28">
        <Group title="Theme">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => applyPreset(id)}
                className={cn(
                  "h-11 rounded-xl px-3 text-left text-sm",
                  settings.preset === id ? "bg-accent text-accent-fg" : "bg-elevated text-fg",
                )}
              >
                {THEME_PRESETS[id].label}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Font">
          <label className="block text-sm text-muted">Family</label>
          <select
            className="mt-1.5 h-11 w-full rounded-xl bg-elevated px-3 text-sm text-fg"
            value={settings.fontFamily}
            onChange={(e) => patch({ fontFamily: e.target.value })}
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-sm">Size {settings.fontSize}px</span>
            <Slider
              className="max-w-48"
              min={12}
              max={22}
              step={1}
              value={[settings.fontSize]}
              onValueChange={(v) => patch({ fontSize: v[0] ?? 14 })}
            />
          </div>
          <div className="mt-4 flex gap-2">
            {(["400", "500", "600", "700"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => patch({ fontWeight: w })}
                className={cn(
                  "h-10 flex-1 rounded-lg text-sm",
                  settings.fontWeight === w ? "bg-accent text-accent-fg" : "bg-elevated",
                )}
              >
                {w}
              </button>
            ))}
          </div>
          <Row label="Italic">
            <Switch
              checked={settings.fontStyle === "italic"}
              onCheckedChange={(c) => patch({ fontStyle: c ? "italic" : "normal" })}
            />
          </Row>
        </Group>

        <Group title="Colours">
          <div className="grid grid-cols-1 gap-2">
            {COLOR_FIELDS.map((field) => {
              const value = String(settings[field.key]);
              if (!value.startsWith("#") || value.length < 7) return null;
              return (
                <label key={field.key} className="flex h-11 items-center justify-between gap-3 rounded-xl bg-elevated px-3">
                  <span className="text-sm">{field.label}</span>
                  <input
                    type="color"
                    value={value.slice(0, 7)}
                    onChange={(e) => patch({ [field.key]: e.target.value } as Partial<IdeSettings>)}
                    className="size-8 cursor-pointer rounded border-0 bg-transparent"
                  />
                </label>
              );
            })}
          </div>
        </Group>

        <Group title="Layout">
          <p className="mb-2 text-sm text-muted">Where the terminal lives</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={cn(
                "h-11 rounded-xl text-sm",
                layout === "below" ? "bg-accent text-accent-fg" : "bg-elevated",
              )}
              onClick={() => setLayout("below")}
            >
              Under the editor
            </button>
            <button
              type="button"
              className={cn(
                "h-11 rounded-xl text-sm",
                layout === "screen" ? "bg-accent text-accent-fg" : "bg-elevated",
              )}
              onClick={() => setLayout("screen")}
            >
              Own screen
            </button>
          </div>
          <Row label="Block lines">
            <Switch
              checked={settings.showBlockLines}
              onCheckedChange={(c) => patch({ showBlockLines: c })}
            />
          </Row>
          <Row label="Word wrap">
            <Switch checked={settings.wordWrap} onCheckedChange={(c) => patch({ wordWrap: c })} />
          </Row>
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-sm">Tab size {settings.tabSize}</span>
            <Slider
              className="max-w-40"
              min={2}
              max={8}
              step={2}
              value={[settings.tabSize]}
              onValueChange={(v) => patch({ tabSize: v[0] ?? 4 })}
            />
          </div>
        </Group>

        <Group title="Cursor">
          <Row label="Volume buttons move cursor">
            <Switch
              checked={settings.volumeCursor}
              onCheckedChange={(c) => patch({ volumeCursor: c })}
            />
          </Row>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Volume up/down on the rocker (and hardware keys when the system sends them) move the caret
            a line at a time. Useful on a phone held in one hand.
          </p>
        </Group>

        <Group title="Permissions">
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Zhina saves your code on this device. Persistent storage keeps it if the browser wants to
            free space.
          </p>
          <Button
            type="button"
            variant={persistGranted ? "secondary" : "default"}
            onClick={async () => {
              const ok = await requestPersistentStorage();
              setPersistGranted(ok);
            }}
          >
            {persistGranted ? "Storage allowed" : "Allow persistent storage"}
          </Button>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>Clipboard — used when you copy output</li>
            <li>Wake lock — screen can stay awake while a program runs</li>
            <li>Files — only when you open or download a .py file</li>
          </ul>
        </Group>

        <Group title="Android install">
          {standalone ? (
            <p className="text-sm leading-relaxed">Running as an installed app.</p>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
              <li>Open Zhina Python in Chrome on Android.</li>
              {android ? <li>Tap the menu, then Add to Home screen / Install app.</li> : <li>Chrome menu → Add to Home screen.</li>}
              <li>Open the icon for a full-screen interpreter.</li>
            </ol>
          )}
          <InstallButton />
        </Group>

        <Group title="About">
          <p className="text-sm leading-relaxed text-muted">
            {pythonVersion} via Pyodide. Standard library is included. Extra packages load from the
            Pyodide build or PyPI (Libraries).
          </p>
          <Button type="button" variant="secondary" className="mt-3" onClick={() => useIdeStore.getState().resetSettings()}>
            Reset settings
          </Button>
        </Group>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 flex min-h-11 items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function InstallButton() {
  return (
    <Button
      type="button"
      variant="secondary"
      className="mt-4"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("zhina-install-app"));
      }}
    >
      Install app
    </Button>
  );
}
