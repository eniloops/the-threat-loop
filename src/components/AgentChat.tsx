import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
      "Connected. I'm tracking live intel from 40+ sources. Ask me anything — try `financial attacks in LatAm last 7 days`.",
  },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

export function AgentChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>(seed);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setThinking(true);

    const agentId = crypto.randomUUID();
    let acc = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("Rate limit exceeded. Try again shortly.");
        if (resp.status === 402) throw new Error("Out of credits.");
        throw new Error(`Agent error (${resp.status})`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { value, done: rDone } = await reader.read();
        if (rDone) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((curr) => {
                const exists = curr.find((m) => m.id === agentId);
                if (exists) {
                  return curr.map((m) =>
                    m.id === agentId ? { ...m, text: acc } : m,
                  );
                }
                return [...curr, { id: agentId, role: "agent", text: acc }];
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      setMessages((curr) => [
        ...curr,
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: `// error: ${e instanceof Error ? e.message : "unknown"}`,
        },
      ]);
    } finally {
      setThinking(false);
    }
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
        {thinking && (
          <div className="flex justify-start">
            <div className="glass-card rounded-lg px-3 py-2 text-xs text-primary-glow flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary shadow-[0_0_10px_hsl(263_84%_58%)]"></span>
              </span>
              <span className="font-mono">thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-primary/20 p-3 flex items-center gap-2 bg-black/30">
        <span className="text-primary-glow text-sm select-none">{">"}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={thinking}
          placeholder="Ask me anything — e.g. financial attacks in LatAm last 7 days"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60 text-foreground font-mono disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={thinking}
          aria-label="Send"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_14px_hsl(263_84%_58%/0.55)] transition disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
