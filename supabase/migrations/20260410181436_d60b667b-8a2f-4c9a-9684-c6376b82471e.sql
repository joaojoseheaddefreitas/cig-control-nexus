
CREATE TABLE public.configuracoes_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  impostos_percentual numeric NOT NULL DEFAULT 0,
  comissoes_percentual numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_fin_select" ON public.configuracoes_financeiras FOR SELECT USING (true);
CREATE POLICY "config_fin_insert" ON public.configuracoes_financeiras FOR INSERT WITH CHECK (true);
CREATE POLICY "config_fin_update" ON public.configuracoes_financeiras FOR UPDATE USING (true);

-- Seed default row
INSERT INTO public.configuracoes_financeiras (impostos_percentual, comissoes_percentual) VALUES (8.5, 5.0);
