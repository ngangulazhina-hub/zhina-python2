import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIdeStore } from "@/lib/ide/store";
import { cn } from "@/lib/utils";

export function RunFab() {
  const status = useIdeStore((s) => s.status);
  const running = status === "running";
  const loading = status === "loading";

  return (
    <Button
      type="button"
      size="fab"
      className={cn(
        "fixed z-40",
        running ? "bg-danger text-fg" : "bg-accent text-accent-fg",
      )}
      style={{
        right: "max(1rem, env(safe-area-inset-right))",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
      aria-label={running ? "Stop" : loading ? "Loading Python" : "Run"}
      disabled={loading && !running}
      onClick={() => {
        window.dispatchEvent(new CustomEvent(running ? "zhina-stop" : "zhina-run"));
      }}
    >
      {running ? (
        <Square className="size-5 fill-current" />
      ) : (
        <Play className="size-6 fill-current" style={{ marginLeft: 2 }} />
      )}
    </Button>
  );
}
