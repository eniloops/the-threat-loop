const About = () => {
  return (
    <div className="container py-8 md:py-12 max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] violet-glow">
          ABOUT THE LOOP
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-primary-glow/60">
          // signal over noise
        </p>
      </header>

      <article className="glass-card p-6 md:p-8 space-y-4 leading-relaxed text-sm md:text-base text-foreground/90">
        <p>
          <span className="text-primary-glow">The Loop</span> is a personal
          threat intelligence dashboard. It collapses noisy feeds, advisories
          and breach reports into a single, focused stream you can actually
          read.
        </p>
        <p>
          Filter intel by region, sector, threat type and time range. Pivot to
          the global map to see where activity is concentrated. When you have a
          question, ask the resident agent — it pulls from the same feed and
          answers in plain language.
        </p>
        <p className="text-muted-foreground">
          v0.1 ships with curated sample intel so the layout looks real from
          day one. Live ingestion, your own sources, and persistent history are
          on the roadmap.
        </p>
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary-glow/50 pt-2">
          // built for analysts, founders, and the perpetually paranoid.
        </p>
      </article>
    </div>
  );
};

export default About;
