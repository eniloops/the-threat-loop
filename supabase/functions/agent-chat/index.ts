// Streaming agent chat backed by Claude + intel_items context
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are The Loop, a personal threat intelligence agent. You have access to a curated feed of cybersecurity news from 40+ sources in English and Spanish. Answer questions clearly and concisely. Prioritize LatAm coverage when relevant. If the user writes in Spanish, respond in Spanish. If in English, respond in English. Always cite the source name and date when referencing a specific article.`;

const REGIONS = [
  "Global",
  "North America",
  "LatAm",
  "Europe",
  "APAC",
  "Middle East & Africa",
];
const SECTORS = [
  "Financial",
  "Healthcare",
  "Government",
  "Energy",
  "Technology",
  "General",
];
const THREATS = [
  "Ransomware",
  "APT",
  "CVE",
  "Phishing",
  "Supply Chain",
  "General",
];

function pickFromList(text: string, list: string[]): string | null {
  const lower = text.toLowerCase();
  for (const v of list) {
    if (lower.includes(v.toLowerCase())) return v;
  }
  // common synonyms
  if (list === REGIONS) {
    if (/\b(latam|latin america|latinoam|latinoam[eé]rica|m[eé]xico|mexico|brazil|brasil|argentina|chile|colombia|peru|per[uú])\b/i.test(text))
      return "LatAm";
    if (/\b(europe|europa|eu|uk|spain|espa[ñn]a|france|germany|alemania)\b/i.test(text))
      return "Europe";
    if (/\b(usa|u\.s\.|united states|north america|canada)\b/i.test(text))
      return "North America";
    if (/\b(asia|apac|china|japan|korea|india)\b/i.test(text)) return "APAC";
  }
  return null;
}

async function fetchContext(
  supabase: ReturnType<typeof createClient>,
  question: string,
) {
  const region = pickFromList(question, REGIONS);
  const sector = pickFromList(question, SECTORS);
  const threat = pickFromList(question, THREATS);

  let q = supabase
    .from("intel_items")
    .select(
      "headline, summary, source_name, source_url, published_at, region, sector, threat_type, language",
    )
    .order("published_at", { ascending: false })
    .limit(20);

  if (region) q = q.eq("region", region);
  if (sector) q = q.eq("sector", sector);
  if (threat) q = q.eq("threat_type", threat);

  let { data } = await q;

  // Keyword fallback if filters returned nothing
  if (!data || data.length === 0) {
    const keywords = question
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5);
    if (keywords.length) {
      const ors = keywords
        .map((k) => `headline.ilike.%${k}%,summary.ilike.%${k}%`)
        .join(",");
      const res = await supabase
        .from("intel_items")
        .select(
          "headline, summary, source_name, source_url, published_at, region, sector, threat_type, language",
        )
        .or(ors)
        .order("published_at", { ascending: false })
        .limit(15);
      data = res.data ?? [];
    }
  }

  // Final fallback: latest items
  if (!data || data.length === 0) {
    const res = await supabase
      .from("intel_items")
      .select(
        "headline, summary, source_name, source_url, published_at, region, sector, threat_type, language",
      )
      .order("published_at", { ascending: false })
      .limit(10);
    data = res.data ?? [];
  }

  return data ?? [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
    const question = lastUser?.content ?? "";

    const items = await fetchContext(supabase, question);
    const contextBlock = items
      .map((i: any, idx: number) => {
        const date = new Date(i.published_at).toISOString().slice(0, 10);
        return `[${idx + 1}] (${date}) ${i.source_name} — ${i.headline} | region:${i.region} | sector:${i.sector} | threat:${i.threat_type}\n   ${i.summary}\n   ${i.source_url}`;
      })
      .join("\n");

    const systemWithContext = `${SYSTEM_PROMPT}\n\nRELEVANT INTEL (most recent first):\n${contextBlock || "(no matching items)"}`;

    const anthropicMessages = messages.map((m: any) => ({
      role: m.role === "agent" ? "assistant" : m.role,
      content: String(m.content ?? ""),
    }));

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        system: systemWithContext,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text();
      console.error("anthropic error", upstream.status, txt);
      return new Response(
        JSON.stringify({ error: "Upstream error", status: upstream.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Transform Anthropic SSE -> OpenAI-style {choices:[{delta:{content}}]}
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buf = "";

    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, idx).replace(/\r$/, "");
          buf = buf.slice(idx + 1);
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          try {
            const evt = JSON.parse(json);
            if (
              evt.type === "content_block_delta" &&
              evt.delta?.type === "text_delta" &&
              evt.delta.text
            ) {
              const out = {
                choices: [{ delta: { content: evt.delta.text } }],
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(out)}\n\n`),
              );
            }
          } catch {
            /* ignore */
          }
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("agent-chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
