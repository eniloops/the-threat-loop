import { useMemo, useState } from "react";
import { FilterBar, defaultFilters, type Filters } from "@/components/FilterBar";
import { IntelCard } from "@/components/IntelCard";
import { intel } from "@/data/intel";

const Index = () => {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - filters.rangeDays * 24 * 60 * 60 * 1000;
    return intel.filter((i) => {
      if (filters.region !== "All" && i.region !== filters.region) return false;
      if (filters.sector !== "All" && i.sector !== filters.sector) return false;
      if (filters.threat !== "All" && i.threat !== filters.threat) return false;
      if (new Date(i.date).getTime() < cutoff) return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="container py-8 md:py-12 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="text-3xl md:text-5xl font-bold tracking-[0.25em] violet-glow">
          THE LOOP
        </h1>
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-primary-glow/60">
          // signal in. noise out.
        </p>
      </section>

      <FilterBar filters={filters} onChange={setFilters} />

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm uppercase tracking-[0.25em] text-primary-glow/70">
            Intel Feed
          </h2>
          <span className="text-xs text-primary-glow/50">
            {filtered.length} / {intel.length} items
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card p-10 text-center text-muted-foreground">
            No intel matches the current filters.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((i) => (
              <IntelCard key={i.id} item={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
