
-- Tabela de transações financeiras
CREATE TABLE public.transacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'DESPESA',
  categoria TEXT NOT NULL DEFAULT 'geral',
  descricao TEXT NOT NULL DEFAULT '',
  valor NUMERIC NOT NULL DEFAULT 0,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transacoes_select" ON public.transacoes FOR SELECT USING (true);
CREATE POLICY "transacoes_insert" ON public.transacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "transacoes_update" ON public.transacoes FOR UPDATE USING (true);
CREATE POLICY "transacoes_delete" ON public.transacoes FOR DELETE USING (true);

-- Tabela de orçamentos
CREATE TABLE public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL DEFAULT 'geral',
  valor_limite NUMERIC NOT NULL DEFAULT 0,
  mes_ano DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orcamentos_select" ON public.orcamentos FOR SELECT USING (true);
CREATE POLICY "orcamentos_insert" ON public.orcamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "orcamentos_update" ON public.orcamentos FOR UPDATE USING (true);
CREATE POLICY "orcamentos_delete" ON public.orcamentos FOR DELETE USING (true);

-- Tabela de logs de auditoria
CREATE TABLE public.logs_auditoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario TEXT NOT NULL DEFAULT 'sistema',
  acao TEXT NOT NULL DEFAULT '',
  valor_antigo NUMERIC,
  valor_novo NUMERIC,
  detalhes TEXT,
  entidade TEXT,
  entidade_id UUID,
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_auditoria_select" ON public.logs_auditoria FOR SELECT USING (true);
CREATE POLICY "logs_auditoria_insert" ON public.logs_auditoria FOR INSERT WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orcamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.logs_auditoria;
