import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { IdeApp } from "@/components/ide/ide-app";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <main className="flex h-dvh items-center justify-center bg-bg text-fg">
        <p className="text-sm text-muted">Zhina Python</p>
      </main>
    );
  }
  return <IdeApp />;
}
