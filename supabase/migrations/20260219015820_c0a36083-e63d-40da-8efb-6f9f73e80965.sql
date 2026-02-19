
-- ========================================
-- TABELA: clientes
-- ========================================
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj_cpf TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  status_financeiro TEXT NOT NULL DEFAULT 'LIBERADO',
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clientes acessíveis" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "Clientes inseríveis" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Clientes atualizáveis" ON public.clientes FOR UPDATE USING (true);
CREATE POLICY "Clientes deletáveis" ON public.clientes FOR DELETE USING (true);

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- TABELA: lojas
-- ========================================
CREATE TABLE public.lojas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  telefone TEXT,
  responsavel TEXT,
  tipo TEXT NOT NULL DEFAULT 'loja',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lojas acessíveis" ON public.lojas FOR SELECT USING (true);
CREATE POLICY "Lojas inseríveis" ON public.lojas FOR INSERT WITH CHECK (true);
CREATE POLICY "Lojas atualizáveis" ON public.lojas FOR UPDATE USING (true);
CREATE POLICY "Lojas deletáveis" ON public.lojas FOR DELETE USING (true);

CREATE TRIGGER update_lojas_updated_at
  BEFORE UPDATE ON public.lojas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- TABELA: vendedores
-- ========================================
CREATE TABLE public.vendedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  loja_id UUID REFERENCES public.lojas(id),
  comissao_percentual NUMERIC NOT NULL DEFAULT 0,
  meta_mensal NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendedores acessíveis" ON public.vendedores FOR SELECT USING (true);
CREATE POLICY "Vendedores inseríveis" ON public.vendedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Vendedores atualizáveis" ON public.vendedores FOR UPDATE USING (true);
CREATE POLICY "Vendedores deletáveis" ON public.vendedores FOR DELETE USING (true);

CREATE TRIGGER update_vendedores_updated_at
  BEFORE UPDATE ON public.vendedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- TABELA: pipeline (oportunidades de venda)
-- ========================================
CREATE TABLE public.pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id),
  vendedor_id UUID REFERENCES public.vendedores(id),
  valor_estimado NUMERIC NOT NULL DEFAULT 0,
  etapa TEXT NOT NULL DEFAULT 'prospeccao',
  probabilidade INTEGER NOT NULL DEFAULT 10,
  data_previsao DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pipeline acessível" ON public.pipeline FOR SELECT USING (true);
CREATE POLICY "Pipeline inserível" ON public.pipeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Pipeline atualizável" ON public.pipeline FOR UPDATE USING (true);
CREATE POLICY "Pipeline deletável" ON public.pipeline FOR DELETE USING (true);

CREATE TRIGGER update_pipeline_updated_at
  BEFORE UPDATE ON public.pipeline
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- TABELA: leads
-- ========================================
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  empresa TEXT,
  email TEXT,
  telefone TEXT,
  origem TEXT NOT NULL DEFAULT 'site',
  status TEXT NOT NULL DEFAULT 'novo',
  vendedor_id UUID REFERENCES public.vendedores(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leads acessíveis" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Leads inseríveis" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Leads atualizáveis" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Leads deletáveis" ON public.leads FOR DELETE USING (true);

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- TABELA: projetos_especiais
-- ========================================
CREATE TABLE public.projetos_especiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id),
  descricao TEXT,
  valor_estimado NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'em_analise',
  data_inicio DATE,
  data_previsao_entrega DATE,
  responsavel TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projetos_especiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projetos acessíveis" ON public.projetos_especiais FOR SELECT USING (true);
CREATE POLICY "Projetos inseríveis" ON public.projetos_especiais FOR INSERT WITH CHECK (true);
CREATE POLICY "Projetos atualizáveis" ON public.projetos_especiais FOR UPDATE USING (true);
CREATE POLICY "Projetos deletáveis" ON public.projetos_especiais FOR DELETE USING (true);

CREATE TRIGGER update_projetos_updated_at
  BEFORE UPDATE ON public.projetos_especiais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- ADICIONAR observacoes ao pedidos (geral)
-- ========================================
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- ========================================
-- ADICIONAR vendedor_id e cliente_id ao pedidos
-- ========================================
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES public.vendedores(id);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES public.lojas(id);
