## The Loop — Personal Threat Intelligence Dashboard

A dark, hacker-terminal-meets-luxury dashboard with violet glow aesthetics and Space Mono throughout.

### Design system
- Background `#0a0a0f`, primary violet `#7c3aed`, secondary glow `#a78bfa`
- Glass cards: `rgba(255,255,255,0.04)` bg, `1px solid rgba(124,58,237,0.3)` border, `backdrop-blur(12px)`, soft violet box-shadow
- Space Mono (Google Fonts) globally — no sans-serif anywhere
- Tokens added to `index.css` and `tailwind.config.ts` (HSL); reusable `.glass-card` and `.violet-glow` utilities

### Routing & layout
- Routes: `/` Feed, `/map` Map, `/agent` Agent, `/about` About
- Persistent shell with:
  - Top header: "THE LOOP" wordmark with violet glow, nav links (Feed / Map / Agent / About)
  - Collapsible Agent side panel fixed to the right on every page (toggle button always visible, slides in 380px wide)

### Feed page (home)
- Filter row: pill/dropdown filters for Region, Sector, Threat Type, Time Range (options exactly as specified)
- Filters are client-side; multi-pill toggles update the grid live
- Responsive card grid: 3 cols desktop / 2 tablet / 1 mobile
- Card content: headline, source + date, three violet tag pills (region/sector/threat), 2-line AI summary, "Read source →" link
- Seeded with 8 hardcoded realistic intel items spanning regions/sectors/threats; ≥2 LatAm cards, 1 in Spanish

### Map page
- Full-bleed dark world map with incident markers per region; markers pulse violet
- Clicking a marker opens a glass popover listing intel for that region (pulled from same seed dataset)
- Implementation: lightweight SVG world map (react-simple-maps) — no API keys required

### Agent page
- Full-page version of the chat: header "ASK THE LOOP", scrollable transcript, input with violet send button
- Placeholder: "Ask me anything — e.g. financial attacks in LatAm last 7 days"
- User bubbles right-aligned violet; agent bubbles left-aligned dark glass
- Side panel on other pages shares the same chat component/state (in-memory for now; mock responses)

### About page
- Short mono-styled write-up explaining what The Loop is, the data sources concept, and the agent

### Backend
- Lovable Cloud enabled (Supabase-ready) — connection initialized, no tables required for v1
- GitHub: connect via Connectors → GitHub after approval (one-click in Lovable UI)

### Tech notes
- React + Tailwind, React Router (already present), shadcn cards/buttons restyled to glass
- Seed data lives in `src/data/intel.ts` with typed `IntelItem`
- Components: `AppShell`, `TopNav`, `AgentPanel`, `AgentChat`, `IntelCard`, `FilterBar`, `WorldMap`
- No blue palette, no generic cyber stock patterns, no sans-serif

### Out of scope (v1)
- Real intel ingestion / live LLM agent (mocked responses)
- Auth and persistence (can be added later on Cloud)
