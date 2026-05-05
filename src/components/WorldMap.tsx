import { useMemo, useState } from "react";
import { intel, REGION_COORDS, type Region } from "@/data/intel";

const REGIONS_ON_MAP: Region[] = [
  "North America",
  "LatAm",
  "Europe",
  "APAC",
  "Middle East & Africa",
];

export function WorldMap() {
  const [active, setActive] = useState<Region | null>(null);

  const counts = useMemo(() => {
    const c: Partial<Record<Region, number>> = {};
    intel.forEach((i) => {
      c[i.region] = (c[i.region] ?? 0) + 1;
    });
    return c;
  }, []);

  const activeItems = active ? intel.filter((i) => i.region === active) : [];

  return (
    <div className="glass-card relative overflow-hidden p-2 md:p-4">
      <div className="relative w-full" style={{ aspectRatio: "2 / 1" }}>
        {/* Stylized SVG world (simplified continents as blobs) */}
        <svg
          viewBox="0 0 100 50"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(263 84% 58% / 0.18)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <pattern id="grid" width="2" height="2" patternUnits="userSpaceOnUse">
              <path d="M 2 0 L 0 0 0 2" fill="none" stroke="hsl(263 60% 30% / 0.18)" strokeWidth="0.1" />
            </pattern>
          </defs>
          <rect width="100" height="50" fill="url(#grid)" />
          <rect width="100" height="50" fill="url(#bgGlow)" />

          {/* Continent blobs (rough approximations) */}
          <g fill="hsl(263 60% 22% / 0.55)" stroke="hsl(263 84% 58% / 0.45)" strokeWidth="0.15">
            {/* North America */}
            <path d="M8,10 Q14,6 22,9 Q30,11 30,18 Q28,24 22,26 Q14,28 10,22 Q6,16 8,10 Z" />
            {/* South America */}
            <path d="M26,28 Q32,28 34,34 Q34,42 30,46 Q26,48 24,42 Q22,34 26,28 Z" />
            {/* Europe */}
            <path d="M44,10 Q52,8 56,12 Q56,18 52,20 Q46,20 44,16 Z" />
            {/* Africa */}
            <path d="M48,22 Q56,22 58,30 Q58,40 52,44 Q46,42 46,34 Q46,26 48,22 Z" />
            {/* Asia */}
            <path d="M58,8 Q72,6 84,12 Q88,20 82,24 Q70,26 60,22 Q56,16 58,8 Z" />
            {/* Australia */}
            <path d="M78,34 Q86,32 90,36 Q90,42 84,42 Q78,40 78,34 Z" />
          </g>

          {/* Markers */}
          {REGIONS_ON_MAP.map((r) => {
            const c = REGION_COORDS[r];
            const count = counts[r] ?? 0;
            const isActive = active === r;
            return (
              <g
                key={r}
                transform={`translate(${c.x}, ${c.y / 2 + 5})`}
                className="cursor-pointer"
                onClick={() => setActive(isActive ? null : r)}
              >
                <circle r={count ? 1.6 + count * 0.3 : 1.2} fill="hsl(263 84% 58% / 0.18)" />
                <circle
                  r={count ? 0.9 + count * 0.15 : 0.7}
                  fill="hsl(263 84% 58%)"
                  className={isActive ? "" : "animate-pulse-glow"}
                  style={{
                    filter: "drop-shadow(0 0 1.5px hsl(258 90% 76%))",
                  }}
                />
                <text
                  x={2.4}
                  y={0.6}
                  fontSize="1.6"
                  fill="hsl(258 90% 86%)"
                  style={{ fontFamily: "Space Mono, monospace" }}
                >
                  {r} · {count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {active && (
        <div className="mt-4 glass-card p-4 animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm tracking-widest uppercase violet-glow">
              {active} — {activeItems.length} incident{activeItems.length === 1 ? "" : "s"}
            </h3>
            <button
              className="text-xs text-primary-glow/70 hover:text-white"
              onClick={() => setActive(null)}
            >
              clear ✕
            </button>
          </div>
          <ul className="space-y-2">
            {activeItems.map((i) => (
              <li key={i.id} className="text-sm">
                <a
                  href={i.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground hover:text-primary-glow"
                >
                  {i.headline}
                </a>
                <div className="text-[11px] text-primary-glow/60">
                  {i.source} · {i.sector} · {i.threat}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
