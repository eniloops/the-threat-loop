import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { AgentChat } from "./AgentChat";

export function AgentPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close agent" : "Open agent"}
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center shadow-[0_0_24px_hsl(263_84%_58%/0.65)] hover:scale-105 transition"
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {open && (
        <aside
          className="fixed top-0 right-0 z-40 h-full w-[380px] max-w-[92vw] glass-card !rounded-none border-l animate-slide-in-right flex flex-col"
          style={{ borderTop: "none", borderBottom: "none", borderRight: "none" }}
        >
          <header className="px-4 py-3 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary-glow animate-pulse-glow" />
              <h2 className="text-sm font-bold tracking-[0.2em] violet-glow">
                ASK THE LOOP
              </h2>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-primary-glow/60">
              online
            </span>
          </header>
          <div className="flex-1 min-h-0">
            <AgentChat compact />
          </div>
        </aside>
      )}
    </>
  );
}
