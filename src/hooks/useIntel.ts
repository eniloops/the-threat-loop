import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { IntelItem, Region, Sector, ThreatType } from "@/data/intel";

interface IntelRow {
  id: string;
  headline: string;
  summary: string;
  source_name: string;
  source_url: string;
  published_at: string;
  region: string;
  sector: string;
  threat_type: string;
  language: string;
}

export function useIntel() {
  return useQuery({
    queryKey: ["intel_items"],
    queryFn: async (): Promise<IntelItem[]> => {
      const { data, error } = await supabase
        .from("intel_items")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data as IntelRow[]).map((r) => ({
        id: r.id,
        headline: r.headline,
        summary: r.summary,
        source: r.source_name,
        url: r.source_url,
        date: r.published_at,
        region: r.region as Region,
        sector: r.sector as Sector,
        threat: r.threat_type as ThreatType,
        lang: (r.language as "en" | "es") ?? "en",
      }));
    },
  });
}
