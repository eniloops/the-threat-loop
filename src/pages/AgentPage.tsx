import { AgentChat } from "@/components/AgentChat";

const AgentPage = () => {
  return (
    <div className="container py-8 md:py-12">
      <header className="space-y-2 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] violet-glow">
          ASK THE LOOP
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-primary-glow/60">
          // your private threat intel analyst
        </p>
      </header>

      <div className="glass-card h-[70vh] overflow-hidden flex flex-col">
        <AgentChat />
      </div>
    </div>
  );
};

export default AgentPage;
