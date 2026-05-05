import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { intel } from "@/data/intel";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
}

const seed: ChatMessage[] = [
  {
    id: "m0",
    role: "agent",
    text:
      "Connected. I'm tracking 8 active intel items across 5 regions. Ask me anything — try `financial attacks in LatAm last 7 days`.",
  },
];

function mockAnswer(q: string): string {
  const lower = q.toLowerCase();
  const hits = intel.filter((i) => {
    return (
      lower.includes(i.region.toLowerCase()) ||
      lower.includes(i.sector.toLowerCase()) ||
      lower.includes(i.threat.toLowerCase()) ||
      i.headline.toLowerCase().includes(lower)
    );
  });
  if (!hits.length) {
    return `No direct matches in current feed for "${q}". I'd widen the time range or drop a filter.`;
  }
  const top = hits.slice(0, 3);
  return (
    `Found ${hits.length} relevant item${hits.length > 1 ? "s" : ""}:\n` +
    top.map((t) => `• ${t.headline} — ${t.source}`).join("\n")
  );
}

export function AgentChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>(seed);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "agent", text: mockAnswer(text) },
      ]);
    }, 450);
  };

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 ${
          compact ? "" : "md:px-6"
        }`}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground shadow-[0_0_18px_hsl(263_84%_58%/0.45)]"
                  : "max-w-[85%] rounded-lg px-3 py-2 text-sm glass-card whitespace-pre-line"
              }
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-primary/20 p-3 flex items-center gap-2 bg-black/30">
        <span className="text-primary-glow text-sm select-none">{">"}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask me anything — e.g. financial attacks in LatAm last 7 days"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60 text-foreground font-mono"
        />
        <button
          onClick={send}
          aria-label="Send"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_14px_hsl(263_84%_58%/0.55)] transition"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
