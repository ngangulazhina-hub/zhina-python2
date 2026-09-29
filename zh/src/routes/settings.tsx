import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useIdeStore } from "@/lib/ide/store";

export const Route = createFileRoute("/settings")({
  ssr: false,
  component: SettingsRedirect,
});

function SettingsRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    useIdeStore.getState().setScreen("settings");
    void navigate({ to: "/" });
  }, [navigate]);
  return (
    <main className="flex h-dvh items-center justify-center bg-bg text-fg">
      <p className="text-sm text-muted">Opening settings</p>
    </main>
  );
}
