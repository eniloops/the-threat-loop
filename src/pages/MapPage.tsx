import { WorldMap } from "@/components/WorldMap";

const MapPage = () => {
  return (
    <div className="container py-8 md:py-12 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] violet-glow">
          GLOBAL INCIDENT MAP
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-primary-glow/60">
          // tap a node to inspect regional intel
        </p>
      </header>
      <WorldMap />
    </div>
  );
};

export default MapPage;
