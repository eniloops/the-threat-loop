const About = () => {
  return (
    <div className="container py-10 md:py-16 max-w-2xl space-y-8 font-mono">
      <header className="space-y-3 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-[0.25em] violet-glow">
          THE LOOP
        </h1>
      </header>

      <article className="glass-card p-6 md:p-8 space-y-5 leading-relaxed text-sm md:text-base text-foreground/75">
        <p>The Loop started as a memory.</p>
        <p>
          Back in my Deloitte days, another analyst and I would spend hours every month manually
          curating a threat landscape report for clients. Scanning headlines, categorizing
          incidents by region and sector, translating context across languages. It was tedious,
          important work.
        </p>
        <p>Now, everything can be automatized.</p>
        <p>So I built The Loop.</p>
        <p>
          It pulls from 40+ sources in English and Spanish, tags every article by region, sector,
          and threat type, and has a bilingual AI agent you can ask anything.
        </p>
      </article>

      <footer className="text-center text-[11px] tracking-[0.15em] text-muted-foreground/70 space-y-1 pt-2">
        <p>Built by Enida Casanova Mendez</p>
        <p>
          <a
            href="https://eniloops.github.io"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary-glow transition-colors"
          >
            eniloops.github.io
          </a>
          <span className="mx-2 text-primary-glow/40">·</span>
          <span className="text-primary-glow/70">#EniInTheLoop</span>
        </p>
      </footer>
    </div>
  );
};

export default About;
