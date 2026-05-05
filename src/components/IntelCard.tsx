import { ArrowUpRight } from "lucide-react";
import type { IntelItem } from "@/data/intel";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

export function IntelCard({ item }: { item: IntelItem }) {
  return (
    <article className="glass-card glass-card-hover relative p-5 flex flex-col gap-4 animate-fade-in-up">
      <header className="flex flex-col gap-1">
        <h3 className="text-base md:text-lg font-bold leading-snug text-foreground">
          {item.headline}
        </h3>
        <p className="text-xs text-primary-glow/70">
          {item.source} · {fmt(item.date)}
          {item.lang === "es" && (
            <span className="ml-2 text-[10px] uppercase tracking-widest text-primary-glow/50">
              · ES
            </span>
          )}
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        <span className="pill">{item.region}</span>
        <span className="pill">{item.sector}</span>
        <span className="pill">{item.threat}</span>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2 font-normal">
        {item.summary}
      </p>

      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="mt-auto inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary-glow hover:text-white transition-colors"
      >
        Read source <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}
