import { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BUNDLED_PACKAGES,
  PYPI_HOME,
  PYPI_SEARCH,
  STDLIB_MODULES,
  SUGGESTED_PYPI,
  pypiProjectUrl,
  type LibraryInfo,
} from "@/lib/ide/packages";
import { useIdeStore } from "@/lib/ide/store";

export function LibrariesScreen() {
  const setScreen = useIdeStore((s) => s.setScreen);
  const status = useIdeStore((s) => s.status);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");

  const q = query.trim().toLowerCase();
  const stdlib = useMemo(
    () => STDLIB_MODULES.filter((p) => !q || p.name.includes(q) || p.summary.toLowerCase().includes(q)),
    [q],
  );
  const bundled = useMemo(
    () => BUNDLED_PACKAGES.filter((p) => !q || p.name.includes(q) || p.summary.toLowerCase().includes(q)),
    [q],
  );

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-bg text-fg">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Back" onClick={() => setScreen("editor")}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-base font-medium">Libraries</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-5 pb-28">
        <p className="text-sm leading-relaxed text-muted">
          The Python standard library is always available offline. Scientific packages (numpy,
          matplotlib, …) download on first use when you have a network connection and are then
          cached for offline runs. Pure-Python packages install from{" "}
          <a className="text-fg underline decoration-border underline-offset-2" href={PYPI_HOME} target="_blank" rel="noreferrer">
            PyPI
          </a>
          .
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter libraries"
          className="mt-4 h-11 w-full rounded-xl bg-elevated px-3 text-sm text-fg outline-none"
        />

        <h2 className="mt-8 mb-3 text-xs font-medium tracking-wide text-muted uppercase">
          Preinstalled (stdlib)
        </h2>
        <div className="flex flex-col gap-2">
          {stdlib.map((p) => (
            <LibRow key={p.name} lib={p} />
          ))}
        </div>

        <h2 className="mt-8 mb-3 text-xs font-medium tracking-wide text-muted uppercase">
          Scientific packages (download once, then offline)
        </h2>
        <div className="flex flex-col gap-2">
          {bundled.map((p) => (
            <LibRow
              key={p.name}
              lib={p}
              action="Get"
              disabled={status === "running" || status === "loading"}
              onAction={() => window.dispatchEvent(new CustomEvent("zhina-install-package", { detail: p.name }))}
            />
          ))}
        </div>

        <h2 className="mt-8 mb-3 text-xs font-medium tracking-wide text-muted uppercase">
          Download from PyPI
        </h2>
        <p className="mb-3 text-sm text-muted">
          Search the index, then install a wheel. Pure-Python packages work best in the browser.
        </p>
        <div className="flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Package name, e.g. cowsay"
            className="h-11 min-w-0 flex-1 rounded-xl bg-elevated px-3 text-sm text-fg outline-none"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!custom.trim()}
            onClick={() => window.open(`${PYPI_SEARCH}${encodeURIComponent(custom.trim())}`, "_blank")}
          >
            PyPI
          </Button>
          <Button
            type="button"
            disabled={!custom.trim() || status === "running"}
            onClick={() =>
              window.dispatchEvent(new CustomEvent("zhina-install-package", { detail: custom.trim() }))
            }
          >
            Install
          </Button>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {SUGGESTED_PYPI.map((p) => (
            <LibRow
              key={p.name}
              lib={p}
              action="Install"
              onAction={() => window.dispatchEvent(new CustomEvent("zhina-install-package", { detail: p.name }))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LibRow({
  lib,
  action,
  onAction,
  disabled,
}: {
  lib: LibraryInfo;
  action?: string;
  onAction?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-elevated px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm">{lib.name}</p>
        <p className="truncate text-xs text-muted">{lib.summary}</p>
      </div>
      <a
        href={lib.kind === "stdlib" ? lib.docsUrl : pypiProjectUrl(lib.name)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:text-fg"
        aria-label={`Open ${lib.name} docs`}
      >
        <ExternalLink className="size-4" />
      </a>
      {action && onAction ? (
        <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </div>
  );
}
