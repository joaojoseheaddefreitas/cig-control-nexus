
CREATE TABLE public.fornecedor_materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  codigo_material_fornecedor TEXT NOT NULL DEFAULT '',
  preco_atual NUMERIC NOT NULL DEFAULT 0,
  lead_time_dias INTEGER NOT NULL DEFAULT 7,
  quantidade_minima NUMERIC NOT NULL DEFAULT 1,
  fornecedor_preferencial BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fornecedor_id, material_id)
);

ALTER TABLE public.fornecedor_materiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fornecedor_materiais_select" ON public.fornecedor_materiais FOR SELECT USING (true);
CREATE POLICY "fornecedor_materiais_insert" ON public.fornecedor_materiais FOR INSERT WITH CHECK (true);
CREATE POLICY "fornecedor_materiais_update" ON public.fornecedor_materiais FOR UPDATE USING (true);
CREATE POLICY "fornecedor_materiais_delete" ON public.fornecedor_materiais FOR DELETE USING (true);

CREATE TRIGGER update_fornecedor_materiais_updated_at
  BEFORE UPDATE ON public.fornecedor_materiais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
