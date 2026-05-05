import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Feed", end: true },
  { to: "/map", label: "Map" },
  { to: "/agent", label: "Agent" },
  { to: "/about", label: "About" },
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/60 border-b border-primary/20">
      <div className="container flex items-center justify-between py-4">
        <NavLink to="/" className="group flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary-glow animate-pulse-glow" />
          <span className="text-xl md:text-2xl font-bold tracking-[0.35em] violet-glow">
            THE&nbsp;LOOP
          </span>
          <span className="ml-1 text-primary-glow/70 animate-blink">_</span>
        </NavLink>
        <nav className="flex items-center gap-1 md:gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs md:text-sm uppercase tracking-widest rounded-md transition ${
                  isActive
                    ? "bg-primary/20 text-white shadow-[0_0_14px_hsl(263_84%_58%/0.45)] border border-primary/50"
                    : "text-primary-glow/70 hover:text-white hover:bg-primary/10"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
