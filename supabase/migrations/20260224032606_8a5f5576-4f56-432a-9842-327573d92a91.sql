
-- Add new fields to produtos table
ALTER TABLE public.produtos 
  ADD COLUMN IF NOT EXISTS codigo text,
  ADD COLUMN IF NOT EXISTS modelo text,
  ADD COLUMN IF NOT EXISTS linha text;

-- Create unique index on codigo (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS produtos_codigo_unique ON public.produtos (codigo) WHERE codigo IS NOT NULL;

-- Create relational table for product sector times
CREATE TABLE public.produto_setor_tempos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  setor_id uuid NOT NULL REFERENCES public.setores_produtivos(id) ON DELETE CASCADE,
  tempo_horas numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(produto_id, setor_id)
);

-- Enable RLS
ALTER TABLE public.produto_setor_tempos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tempos acessíveis" ON public.produto_setor_tempos FOR SELECT USING (true);
CREATE POLICY "Tempos inseríveis" ON public.produto_setor_tempos FOR INSERT WITH CHECK (true);
CREATE POLICY "Tempos atualizáveis" ON public.produto_setor_tempos FOR UPDATE USING (true);
CREATE POLICY "Tempos deletáveis" ON public.produto_setor_tempos FOR DELETE USING (true);
