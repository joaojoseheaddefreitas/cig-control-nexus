
-- =============================================
-- SETORES PRODUTIVOS (padrão moveleiro)
-- =============================================
CREATE TABLE public.setores_produtivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.setores_produtivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Setores visíveis publicamente" ON public.setores_produtivos
  FOR SELECT USING (true);

CREATE POLICY "Setores podem ser inseridos" ON public.setores_produtivos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Setores podem ser atualizados" ON public.setores_produtivos
  FOR UPDATE USING (true);

-- Seed setores padrão moveleiro
INSERT INTO public.setores_produtivos (nome, ordem) VALUES
  ('Corte', 1),
  ('Colagem de Borda', 2),
  ('Furação', 3),
  ('Marcenaria', 4),
  ('Pintura/Acabamento', 5),
  ('Montagem', 6),
  ('Expedição', 7);

-- =============================================
-- OP MÃE (1 por pedido)
-- =============================================
CREATE TABLE public.op_maes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  numero_op TEXT NOT NULL UNIQUE,
  total_fracoes INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'aguardando',
  observacoes_especiais TEXT,
  desenho_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.op_maes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OPs visíveis publicamente" ON public.op_maes FOR SELECT USING (true);
CREATE POLICY "OPs podem ser inseridas" ON public.op_maes FOR INSERT WITH CHECK (true);
CREATE POLICY "OPs podem ser atualizadas" ON public.op_maes FOR UPDATE USING (true);
CREATE POLICY "OPs podem ser deletadas" ON public.op_maes FOR DELETE USING (true);

CREATE TRIGGER update_op_maes_updated_at
  BEFORE UPDATE ON public.op_maes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.op_maes;

-- =============================================
-- FRAÇÕES TÉCNICAS DA OP (N por OP Mãe)
-- =============================================
CREATE TABLE public.op_fracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  op_mae_id UUID NOT NULL REFERENCES public.op_maes(id) ON DELETE CASCADE,
  numero_fracao INTEGER NOT NULL,
  modelo TEXT NOT NULL DEFAULT '',
  dimensoes TEXT,
  medidas TEXT,
  quantidade_tecnica INTEGER NOT NULL DEFAULT 1,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'aguardando',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(op_mae_id, numero_fracao)
);

ALTER TABLE public.op_fracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Frações visíveis publicamente" ON public.op_fracoes FOR SELECT USING (true);
CREATE POLICY "Frações podem ser inseridas" ON public.op_fracoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Frações podem ser atualizadas" ON public.op_fracoes FOR UPDATE USING (true);
CREATE POLICY "Frações podem ser deletadas" ON public.op_fracoes FOR DELETE USING (true);

CREATE TRIGGER update_op_fracoes_updated_at
  BEFORE UPDATE ON public.op_fracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.op_fracoes;

-- =============================================
-- RASTREAMENTO POR SETOR (entrada/baixa de cada fração em cada setor)
-- =============================================
CREATE TABLE public.setor_rastreamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  op_fracao_id UUID NOT NULL REFERENCES public.op_fracoes(id) ON DELETE CASCADE,
  setor_id UUID NOT NULL REFERENCES public.setores_produtivos(id),
  data_entrada TIMESTAMPTZ,
  data_baixa TIMESTAMPTZ,
  operador TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(op_fracao_id, setor_id)
);

ALTER TABLE public.setor_rastreamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rastreamento visível publicamente" ON public.setor_rastreamento FOR SELECT USING (true);
CREATE POLICY "Rastreamento pode ser inserido" ON public.setor_rastreamento FOR INSERT WITH CHECK (true);
CREATE POLICY "Rastreamento pode ser atualizado" ON public.setor_rastreamento FOR UPDATE USING (true);

CREATE TRIGGER update_setor_rastreamento_updated_at
  BEFORE UPDATE ON public.setor_rastreamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.setor_rastreamento;
