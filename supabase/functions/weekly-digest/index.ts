import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const YOUR_EMAIL = "eniccm@gmail.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function scrapeArticles() {
  const feedUrl = "https://www.microsoft.com/en-us/security/blog/topic/actionable-threat-insights/feed/";
  console.log(`[scrape] fetching RSS: ${feedUrl}`);
  let xml = "";
  try {
    const res = await fetch(feedUrl, { headers: { "User-Agent": "Mozilla/5.0 TheLoopBot/1.0" } });
    console.log(`[scrape] status: ${res.status}`);
    xml = await res.text();
    console.log(`[scrape] body length: ${xml.length}, preview: ${xml.substring(0, 300)}`);
    if (!res.ok) {
      console.error(`[scrape] non-OK status ${res.status}`);
      return [];
    }
  } catch (err) {
    console.error("[scrape] fetch failed:", (err as Error).message);
    return [];
  }

  const articles: { url: string; title: string; pubDate: string }[] = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
  const pick = (block: string, tag: string) => {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const m = block.match(re);
    if (!m) return "";
    return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
  };

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    try {
      const block = match[1];
      const title = pick(block, "title");
      const url = pick(block, "link");
      const pubDate = pick(block, "pubDate");
      if (!title || !url) {
        console.warn("[scrape] skipping item missing title/url");
        continue;
      }
      const ts = pubDate ? Date.parse(pubDate) : NaN;
      if (!isNaN(ts) && ts < cutoff) continue;
      articles.push({ url, title, pubDate });
    } catch (err) {
      console.error("[scrape] item parse error:", (err as Error).message);
    }
  }
  const deduped = [...new Map(articles.map(a => [a.url, a])).values()].slice(0, 5);
  console.log(`[scrape] parsed ${deduped.length} articles within 7-day window`);
  return deduped;
}

async function findSimilarArticles(title: string) {
  try {
    const words = title.split(" ").slice(0, 3).join(" ");
    const { data, error } = await supabase
      .from("intel_items")
      .select("headline, source_name, published_at, source_url")
      .ilike("headline", `%${words}%`)
      .limit(3);
    if (error) {
      console.error("[similar] supabase error:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[similar] exception:", (err as Error).message);
    return [];
  }
}

function safeJsonParse(text: string): any | null {
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const start = cleaned.search(/[\{\[]/);
  const endChar = start !== -1 && cleaned[start] === "[" ? "]" : "}";
  const end = cleaned.lastIndexOf(endChar);
  if (start === -1 || end === -1) return null;
  cleaned = cleaned.substring(start, end + 1);
  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      return JSON.parse(cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
    } catch (e) {
      console.error("[json] parse failed:", (e as Error).message);
      return null;
    }
  }
}

async function generateWhyItMatters(title: string, similar: any[]) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are a threat intelligence analyst. For this Microsoft Security Blog article titled "${title}", write exactly 1 paragraph explaining why it matters in the broader threat landscape. Be specific, direct, and insightful. Then list these similar articles and calculate the delay in days vs the Microsoft article. Similar articles: ${JSON.stringify(similar)}. Return JSON only: { "why_it_matters": "paragraph here", "similar": [{ "title": "", "source": "", "date": "", "delay": "" }] }`
        }]
      })
    });

    console.log(`[claude] status for "${title}": ${response.status}`);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[claude] error body: ${errText.substring(0, 500)}`);
      return null;
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text;
    if (!text) {
      console.error("[claude] no content in response:", JSON.stringify(data).substring(0, 500));
      return null;
    }
    console.log(`[claude] raw text preview: ${text.substring(0, 200)}`);

    const parsed = safeJsonParse(text);
    if (!parsed || typeof parsed.why_it_matters !== "string") {
      console.error("[claude] invalid JSON shape");
      return null;
    }
    if (!Array.isArray(parsed.similar)) parsed.similar = [];
    return parsed;
  } catch (err) {
    console.error("[claude] exception:", (err as Error).message);
    return null;
  }
}

function buildEmail(articles: any[], weekDate: string) {
  const sections = articles.map((a, i) => `
    <div style="margin-bottom:40px;border-left:2px solid #7c3aed;padding-left:20px;">
      <p style="color:#a78bfa;font-size:12px;margin:0">0${i + 1}</p>
      <h2 style="color:#f8fafc;font-family:'Space Mono',monospace;font-size:16px;margin:8px 0">
        <a href="${a.url}" style="color:#f8fafc;text-decoration:none">${a.title}</a>
      </h2>
      <p style="color:#7c3aed;font-size:12px;font-family:'Space Mono',monospace;margin:0 0 16px">
        Microsoft Security Blog
      </p>
      <p style="color:#a78bfa;font-size:11px;font-family:'Space Mono',monospace;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">
        Why it matters
      </p>
      <p style="color:#e2e8f0;font-family:'Space Mono',monospace;font-size:13px;line-height:1.7;margin:0 0 20px">
        ${a.analysis.why_it_matters}
      </p>
      <p style="color:#a78bfa;font-size:11px;font-family:'Space Mono',monospace;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">
        Similar coverage
      </p>
      ${(a.analysis.similar?.length ?? 0) === 0 ? '<p style="color:#64748b;font-family:Space Mono,monospace;font-size:12px">Not applicable</p>' :
        a.analysis.similar.map((s: any) => `
          <p style="color:#e2e8f0;font-family:'Space Mono',monospace;font-size:12px;margin:4px 0">
            • ${s.source ?? ""} — ${s.title ?? ""} — ${s.date ?? ""} 
            <span style="color:#7c3aed">[${s.delay ?? ""}]</span>
          </p>
        `).join("")
      }
    </div>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    </head>
    <body style="background:#0a0a0f;margin:0;padding:40px 20px;font-family:'Space Mono',monospace">
      <div style="max-width:640px;margin:0 auto">
        <div style="border-bottom:1px solid #7c3aed;padding-bottom:24px;margin-bottom:40px">
          <h1 style="color:#f8fafc;font-family:'Space Mono',monospace;font-size:24px;margin:0;letter-spacing:2px">
            THE LOOP
          </h1>
          <p style="color:#7c3aed;font-family:'Space Mono',monospace;font-size:12px;margin:8px 0 0">
            Weekly Digest — ${weekDate}
          </p>
        </div>
        ${sections || '<p style="color:#a78bfa;font-family:Space Mono,monospace;font-size:13px">No articles available this week.</p>'}
        <div style="border-top:1px solid #1e1b4b;padding-top:24px;margin-top:40px">
          <p style="color:#334155;font-family:'Space Mono',monospace;font-size:11px;margin:0">
            Built by Enida Casanova Mendez · #EniInTheLoop
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

Deno.serve(async () => {
  try {
    const articles = await scrapeArticles();
    console.log(`[main] processing ${articles.length} articles`);
    const enriched = [];

    for (const article of articles) {
      try {
        const similar = await findSimilarArticles(article.title);
        const analysis = await generateWhyItMatters(article.title, similar);
        if (!analysis) {
          console.warn(`[main] skipping "${article.title}" — no analysis`);
          continue;
        }
        enriched.push({ ...article, analysis });
      } catch (err) {
        console.error(`[main] article failed "${article.title}":`, (err as Error).message);
      }
    }

    console.log(`[main] enriched ${enriched.length}/${articles.length} articles`);
    const weekDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const html = buildEmail(enriched, weekDate);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "The Loop <onboarding@resend.dev>",
        to: YOUR_EMAIL,
        subject: `THE LOOP — Weekly Digest — ${weekDate}`,
        html,
      }),
    });
    const emailBody = await emailRes.text();
    console.log(`[resend] status: ${emailRes.status}, body: ${emailBody.substring(0, 300)}`);

    return new Response(JSON.stringify({ success: true, articles: enriched.length }), { status: 200 });
  } catch (err) {
    console.error("[main] fatal:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});