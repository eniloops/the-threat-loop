import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { AgentPanel } from "./AgentPanel";

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="container py-8 text-[11px] uppercase tracking-[0.25em] text-primary-glow/40">
        // the loop · v0.1 · stay in the loop
      </footer>
      <AgentPanel />
    </div>
  );
}
