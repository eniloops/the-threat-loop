import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const YOUR_EMAIL = "eniccm@gmail.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function scrapeArticles() {
  const res = await fetch(
    "https://www.microsoft.com/en-us/security/blog/topic/actionable-threat-insights/feed/",
    { headers: { "User-Agent": "Mozilla/5.0 TheLoopBot/1.0" } }
  );
  const xml = await res.text();
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
    const block = match[1];
    const title = pick(block, "title");
    const url = pick(block, "link");
    const pubDate = pick(block, "pubDate");
    if (!title || !url) continue;
    const ts = pubDate ? Date.parse(pubDate) : NaN;
    if (!isNaN(ts) && ts < cutoff) continue;
    articles.push({ url, title, pubDate });
  }
  return [...new Map(articles.map(a => [a.url, a])).values()].slice(0, 5);
}

async function findSimilarArticles(title: string) {
  const words = title.split(" ").slice(0, 3).join(" ");
  const { data } = await supabase
    .from("intel_items")
    .select("headline, source_name, published_at, source_url")
    .ilike("headline", `%${words}%`)
    .limit(3);
  return data || [];
}

async function generateWhyItMatters(title: string, similar: any[]) {
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
  const data = await response.json();
  const text = data.content[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
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
      ${a.analysis.similar.length === 0 ? '<p style="color:#64748b;font-family:Space Mono,monospace;font-size:12px">Not applicable</p>' :
        a.analysis.similar.map((s: any) => `
          <p style="color:#e2e8f0;font-family:'Space Mono',monospace;font-size:12px;margin:4px 0">
            • ${s.source} — ${s.title} — ${s.date} 
            <span style="color:#7c3aed">[${s.delay}]</span>
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
        ${sections}
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
    const enriched = [];

    for (const article of articles) {
      const similar = await findSimilarArticles(article.title);
      const analysis = await generateWhyItMatters(article.title, similar);
      enriched.push({ ...article, analysis });
    }

    const weekDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const html = buildEmail(enriched, weekDate);

    await fetch("https://api.resend.com/emails", {
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

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});