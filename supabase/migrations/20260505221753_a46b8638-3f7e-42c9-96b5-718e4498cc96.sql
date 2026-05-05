CREATE TABLE public.intel_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  region TEXT NOT NULL,
  sector TEXT NOT NULL,
  threat_type TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','es')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intel_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intel items are viewable by everyone"
ON public.intel_items
FOR SELECT
USING (true);

CREATE INDEX idx_intel_items_published_at ON public.intel_items (published_at DESC);
CREATE INDEX idx_intel_items_region ON public.intel_items (region);
CREATE INDEX idx_intel_items_sector ON public.intel_items (sector);
CREATE INDEX idx_intel_items_threat_type ON public.intel_items (threat_type);