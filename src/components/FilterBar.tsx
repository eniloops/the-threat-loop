import { REGIONS, SECTORS, THREATS, TIME_RANGES } from "@/data/intel";
import type { Region, Sector, ThreatType } from "@/data/intel";

export interface Filters {
  region: Region | "All";
  sector: Sector | "All";
  threat: ThreatType | "All";
  rangeDays: number; // 1, 7, 30
}

export const defaultFilters: Filters = {
  region: "All",
  sector: "All",
  threat: "All",
  rangeDays: 30,
};

function PillRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.2em] text-primary-glow/60">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={`pill ${active ? "pill-active" : ""}`}
              type="button"
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  return (
    <div className="glass-card p-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <PillRow
        label="Region"
        value={filters.region}
        onChange={(v) => onChange({ ...filters, region: v })}
        options={[
          { label: "All", value: "All" as const },
          ...REGIONS.map((r) => ({ label: r, value: r })),
        ]}
      />
      <PillRow
        label="Sector"
        value={filters.sector}
        onChange={(v) => onChange({ ...filters, sector: v })}
        options={[
          { label: "All", value: "All" as const },
          ...SECTORS.map((s) => ({ label: s, value: s })),
        ]}
      />
      <PillRow
        label="Threat Type"
        value={filters.threat}
        onChange={(v) => onChange({ ...filters, threat: v })}
        options={[
          { label: "All", value: "All" as const },
          ...THREATS.map((t) => ({ label: t, value: t })),
        ]}
      />
      <PillRow
        label="Time Range"
        value={filters.rangeDays}
        onChange={(v) => onChange({ ...filters, rangeDays: v })}
        options={TIME_RANGES.map((t) => ({ label: t.label, value: t.days }))}
      />
    </div>
  );
}
