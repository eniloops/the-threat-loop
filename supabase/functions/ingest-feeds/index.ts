// Ingest RSS feeds, classify with Claude, and insert into intel_items
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FEEDS: { url: string; lang: "en" | "es" }[] = [
  // English - Major Security News
  { url: "https://www.cisa.gov/feeds/hsin-isa-alerts.xml", lang: "en" },
  { url: "https://feeds.feedburner.com/TheHackersNews", lang: "en" },
  { url: "https://www.bleepingcomputer.com/feed/", lang: "en" },
  { url: "https://krebsonsecurity.com/feed/", lang: "en" },
  { url: "https://www.darkreading.com/rss.xml", lang: "en" },
  { url: "https://threatpost.com/feed/", lang: "en" },
  { url: "https://www.securityweek.com/feed", lang: "en" },
  { url: "https://cybersecuritynews.com/feed/", lang: "en" },
  { url: "https://www.infosecurity-magazine.com/rss/news/", lang: "en" },
  { url: "https://www.csoonline.com/feed/", lang: "en" },
  { url: "https://www.scmagazine.com/feed", lang: "en" },
  { url: "https://grahamcluley.com/feed/", lang: "en" },
  { url: "https://nakedsecurity.sophos.com/feed/", lang: "en" },
  { url: "https://www.tripwire.com/state-of-security/feed/", lang: "en" },
  { url: "https://heimdalsecurity.com/blog/feed/", lang: "en" },
  { url: "https://www.malwarebytes.com/blog/feed/", lang: "en" },
  { url: "https://blog.talosintelligence.com/feeds/posts/default", lang: "en" },
  { url: "https://www.mandiant.com/resources/blog/rss.xml", lang: "en" },
  { url: "https://unit42.paloaltonetworks.com/feed/", lang: "en" },
  // Government & CERT
  { url: "https://us-cert.cisa.gov/ncas/current-activity.xml", lang: "en" },
  { url: "https://www.ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml", lang: "en" },
  { url: "https://www.enisa.europa.eu/publications/rss", lang: "en" },
  { url: "https://www.cyber.gov.au/about-us/view-all-content/alerts-and-advisories/rss", lang: "en" },
  // Threat Intel
  { url: "https://otx.alienvault.com/api/v1/pulses/subscribed?format=rss", lang: "en" },
  { url: "https://feeds.feedburner.com/eset/blog", lang: "en" },
  { url: "https://www.recordedfuture.com/feed", lang: "en" },
  { url: "https://research.checkpoint.com/feed/", lang: "en" },
  { url: "https://securelist.com/feed/", lang: "en" },
  { url: "https://blog.google/threat-analysis-group/rss/", lang: "en" },
  // Spanish
  { url: "https://www.welivesecurity.com/es/feed/", lang: "es" },
  { url: "https://unaaldia.hispasec.com/feeds/posts/default", lang: "es" },
  { url: "https://www.dragonjar.org/feed", lang: "es" },
  { url: "https://www.incibe.es/rss.xml", lang: "es" },
  { url: "https://blog.segu-info.com.ar/feeds/posts/default", lang: "es" },
  { url: "https://www.certsi.es/rss.xml", lang: "es" },
  { url: "https://ciberseguridad.com/feed/", lang: "es" },
  { url: "https://www.hackplayers.com/feeds/posts/default", lang: "es" },
  { url: "https://www.redeszone.net/feed/", lang: "es" },
];

const MAX_PER_FEED = 5;
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

interface RssItem {
  headline: string;
  source_url: string;
  published_at: string;
  raw: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function pickTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  // RSS 2.0 <item>
  const itemRegex = /<item[\s>][\s\S]*?<\/item>/gi;
  const entryRegex = /<entry[\s>][\s\S]*?<\/entry>/gi;
  const blocks = [
    ...(xml.match(itemRegex) || []),
    ...(xml.match(entryRegex) || []),
  ];
  for (const block of blocks) {
    const title = pickTag(block, "title");
    let link = pickTag(block, "link");
    if (link && /<link[^>]*href=/i.test(block) && !/^https?:/i.test(decodeEntities(link).trim())) {
      const m = block.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (m) link = m[1];
    }
    const pub =
      pickTag(block, "pubDate") ||
      pickTag(block, "published") ||
      pickTag(block, "updated") ||
      pickTag(block, "dc:date");
    const desc =
      pickTag(block, "content:encoded") ||
      pickTag(block, "description") ||
      pickTag(block, "summary") ||
      pickTag(block, "content") ||
      "";
    if (!title || !link) continue;
    const url = decodeEntities(link).trim();
    if (!/^https?:\/\//i.test(url)) continue;
    let publishedAt = new Date().toISOString();
    if (pub) {
      const d = new Date(decodeEntities(pub).trim());
      if (!isNaN(d.getTime())) publishedAt = d.toISOString();
    }
    items.push({
      headline: stripHtml(title).slice(0, 500),
      source_url: url,
      published_at: publishedAt,
      raw: stripHtml(desc).slice(0, 4000),
    });
  }
  return items.slice(0, MAX_PER_FEED);
}

function getFeedSourceName(url: string): string {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return h;
  } catch {
    return url;
  }
}

async function fetchFeed(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "TheLoop/1.0 (+intel)" },
    });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.text();
  } catch (e) {
    console.error("fetch failed", url, (e as Error).message);
    return null;
  }
}

interface Classification {
  summary: string;
  region: string;
  sector: string;
  threat_type: string;
  language: "en" | "es";
}

async function classify(
  apiKey: string,
  item: RssItem,
  hintLang: "en" | "es",
): Promise<Classification | null> {
  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 400,
    tools: [
      {
        name: "classify_intel",
        description: "Summarize and classify a threat intelligence article.",
        input_schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description:
                "2-sentence summary in the SAME language as the source article (English or Spanish).",
            },
            region: {
              type: "string",
              enum: [
                "Global",
                "North America",
                "LatAm",
                "Europe",
                "APAC",
                "Middle East & Africa",
              ],
            },
            sector: {
              type: "string",
              enum: [
                "Financial",
                "Healthcare",
                "Government",
                "Energy",
                "Technology",
                "General",
              ],
            },
            threat_type: {
              type: "string",
              enum: [
                "Ransomware",
                "APT",
                "CVE",
                "Phishing",
                "Supply Chain",
                "General",
              ],
            },
            language: { type: "string", enum: ["en", "es"] },
          },
          required: ["summary", "region", "sector", "threat_type", "language"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "classify_intel" },
    messages: [
      {
        role: "user",
        content: `Headline: ${item.headline}\nURL: ${item.source_url}\nContent: ${item.raw}\n\nLikely language hint: ${hintLang}. Classify and summarize.`,
      },
    ],
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    console.error("anthropic", r.status, await r.text());
    return null;
  }
  const data = await r.json();
  const tool = data?.content?.find((c: any) => c.type === "tool_use");
  if (!tool?.input) return null;
  return tool.input as Classification;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const feed of FEEDS) {
    const xml = await fetchFeed(feed.url);
    if (!xml) {
      failed++;
      continue;
    }
    const items = parseRss(xml);
    const sourceName = getFeedSourceName(feed.url);

    for (const item of items) {
      // Dedup by source_url
      const { data: exists } = await supabase
        .from("intel_items")
        .select("id")
        .eq("source_url", item.source_url)
        .maybeSingle();
      if (exists) {
        skipped++;
        continue;
      }

      const cls = await classify(ANTHROPIC_KEY, item, feed.lang);
      if (!cls) {
        failed++;
        continue;
      }

      const { error } = await supabase.from("intel_items").insert({
        headline: item.headline,
        summary: cls.summary,
        source_name: sourceName,
        source_url: item.source_url,
        published_at: item.published_at,
        region: cls.region,
        sector: cls.sector,
        threat_type: cls.threat_type,
        language: cls.language || feed.lang,
      });
      if (error) {
        console.error("insert error", error.message);
        failed++;
      } else {
        inserted++;
      }
    }
  }

  return new Response(
    JSON.stringify({ inserted, skipped, failed, feeds: FEEDS.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
