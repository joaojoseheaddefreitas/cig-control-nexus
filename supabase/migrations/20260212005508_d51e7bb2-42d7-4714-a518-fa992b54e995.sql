
-- =============================================
-- FASE 1: REESTRUTURAÇÃO COMPLETA DO BANCO
-- =============================================

-- 1. Remover tabelas antigas (ordem por dependência)
DROP TABLE IF EXISTS public.setor_rastreamento CASCADE;
DROP TABLE IF EXISTS public.op_fracoes CASCADE;
DROP TABLE IF EXISTS public.op_maes CASCADE;

-- 2. Criar tabela de PRODUTOS
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  tempo_unitario NUMERIC NOT NULL DEFAULT 1, -- horas por unidade
  unidade TEXT NOT NULL DEFAULT 'un',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Produtos acessíveis" ON public.produtos FOR SELECT USING (true);
CREATE POLICY "Produtos inseríveis" ON public.produtos FOR INSERT WITH CHECK (true);
CREATE POLICY "Produtos atualizáveis" ON public.produtos FOR UPDATE USING (true);
CREATE POLICY "Produtos deletáveis" ON public.produtos FOR DELETE USING (true);

-- 3. Criar tabela de FORNECEDORES
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  contato TEXT,
  email TEXT,
  telefone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fornecedores acessíveis" ON public.fornecedores FOR SELECT USING (true);
CREATE POLICY "Fornecedores inseríveis" ON public.fornecedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Fornecedores atualizáveis" ON public.fornecedores FOR UPDATE USING (true);
CREATE POLICY "Fornecedores deletáveis" ON public.fornecedores FOR DELETE USING (true);

-- 4. Criar tabela de ITENS DO PEDIDO
CREATE TABLE public.itens_pedido (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id),
  produto_nome TEXT NOT NULL, -- denormalizado para exibição
  quantidade INTEGER NOT NULL DEFAULT 1,
  tempo_unitario NUMERIC NOT NULL DEFAULT 1, -- horas
  tempo_total NUMERIC GENERATED ALWAYS AS (quantidade * tempo_unitario) STORED,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Itens acessíveis" ON public.itens_pedido FOR SELECT USING (true);
CREATE POLICY "Itens inseríveis" ON public.itens_pedido FOR INSERT WITH CHECK (true);
CREATE POLICY "Itens atualizáveis" ON public.itens_pedido FOR UPDATE USING (true);
CREATE POLICY "Itens deletáveis" ON public.itens_pedido FOR DELETE USING (true);

-- 5. Criar tabela FAMILIA_OP (1 por pedido)
CREATE TABLE public.familia_op (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL UNIQUE REFERENCES public.pedidos(id) ON DELETE CASCADE,
  numero_familia TEXT NOT NULL UNIQUE, -- ex: "0601"
  total_ops INTEGER NOT NULL DEFAULT 0,
  tempo_total_familia NUMERIC NOT NULL DEFAULT 0, -- soma dos tempos
  status TEXT NOT NULL DEFAULT 'aberta',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.familia_op ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Familia acessível" ON public.familia_op FOR SELECT USING (true);
CREATE POLICY "Familia inserível" ON public.familia_op FOR INSERT WITH CHECK (true);
CREATE POLICY "Familia atualizável" ON public.familia_op FOR UPDATE USING (true);

-- 6. Criar tabela OPS (1 por item do pedido)
CREATE TABLE public.ops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  familia_op_id UUID NOT NULL REFERENCES public.familia_op(id) ON DELETE CASCADE,
  item_pedido_id UUID NOT NULL REFERENCES public.itens_pedido(id) ON DELETE CASCADE,
  numero_op TEXT NOT NULL, -- ex: "0601-1/2"
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  tempo_unitario NUMERIC NOT NULL DEFAULT 1,
  tempo_total NUMERIC NOT NULL DEFAULT 0,
  prazo_entrega DATE,
  status_producao TEXT NOT NULL DEFAULT 'aguardando',
  status_faturamento TEXT NOT NULL DEFAULT 'pendente',
  data_nf DATE,
  nota_fiscal TEXT,
  observacoes TEXT,
  desenho_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "OPs acessíveis" ON public.ops FOR SELECT USING (true);
CREATE POLICY "OPs inseríveis" ON public.ops FOR INSERT WITH CHECK (true);
CREATE POLICY "OPs atualizáveis" ON public.ops FOR UPDATE USING (true);

-- 7. Recriar SETOR_RASTREAMENTO vinculado a OPs
CREATE TABLE public.setor_rastreamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  op_id UUID NOT NULL REFERENCES public.ops(id) ON DELETE CASCADE,
  setor_id UUID NOT NULL REFERENCES public.setores_produtivos(id),
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, em_andamento, concluido
  data_entrada TIMESTAMPTZ,
  data_baixa TIMESTAMPTZ,
  operador TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.setor_rastreamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rastreamento acessível" ON public.setor_rastreamento FOR SELECT USING (true);
CREATE POLICY "Rastreamento inserível" ON public.setor_rastreamento FOR INSERT WITH CHECK (true);
CREATE POLICY "Rastreamento atualizável" ON public.setor_rastreamento FOR UPDATE USING (true);

-- 8. Criar CONFIGURACOES_CAPACIDADE
CREATE TABLE public.configuracoes_capacidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  capacidade_produtiva_diaria NUMERIC NOT NULL DEFAULT 8, -- horas/dia
  considerar_sabado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_capacidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Config acessível" ON public.configuracoes_capacidade FOR SELECT USING (true);
CREATE POLICY "Config inserível" ON public.configuracoes_capacidade FOR INSERT WITH CHECK (true);
CREATE POLICY "Config atualizável" ON public.configuracoes_capacidade FOR UPDATE USING (true);

-- Inserir config padrão
INSERT INTO public.configuracoes_capacidade (capacidade_produtiva_diaria, considerar_sabado)
VALUES (8, false);

-- 9. Criar MOVIMENTACOES_ESTOQUE
CREATE TABLE public.movimentacoes_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'baixa')),
  origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'compra', 'op', 'requisicao')),
  quantidade INTEGER NOT NULL,
  motivo TEXT,
  usuario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mov acessível" ON public.movimentacoes_estoque FOR SELECT USING (true);
CREATE POLICY "Mov inserível" ON public.movimentacoes_estoque FOR INSERT WITH CHECK (true);

-- 10. Alterar PEDIDOS: adicionar status_producao, status_faturamento, prazo calculado
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS status_producao TEXT NOT NULL DEFAULT 'aguardando',
  ADD COLUMN IF NOT EXISTS status_faturamento TEXT NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS prazo_calculado_dias INTEGER,
  ADD COLUMN IF NOT EXISTS data_nf DATE;

-- 11. Triggers de updated_at para novas tabelas
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_itens_pedido_updated_at BEFORE UPDATE ON public.itens_pedido FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_familia_op_updated_at BEFORE UPDATE ON public.familia_op FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ops_updated_at BEFORE UPDATE ON public.ops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_setor_rastreamento_updated_at BEFORE UPDATE ON public.setor_rastreamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON public.configuracoes_capacidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Realtime para tabelas operacionais
ALTER PUBLICATION supabase_realtime ADD TABLE public.ops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.setor_rastreamento;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itens_pedido;
ALTER PUBLICATION supabase_realtime ADD TABLE public.familia_op;
ALTER PUBLICATION supabase_realtime ADD TABLE public.movimentacoes_estoque;

-- 13. Sequência para numeração de família OP
CREATE SEQUENCE IF NOT EXISTS public.familia_op_seq START WITH 1;

-- 14. Função para gerar número de família
CREATE OR REPLACE FUNCTION public.gerar_numero_familia()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT LPAD(nextval('public.familia_op_seq')::TEXT, 4, '0');
$$;
