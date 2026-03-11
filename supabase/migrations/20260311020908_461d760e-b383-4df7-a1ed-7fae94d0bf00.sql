
-- Contas a Pagar
CREATE TABLE public.contas_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'operacional',
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  valor NUMERIC NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL DEFAULT CURRENT_DATE,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contas a Receber
CREATE TABLE public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id),
  pedido_id UUID REFERENCES public.pedidos(id),
  valor NUMERIC NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL DEFAULT CURRENT_DATE,
  data_recebimento DATE,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Funcionários (Folha de Pagamento)
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL DEFAULT 'operador',
  setor_id UUID REFERENCES public.setores_produtivos(id),
  tipo_mao_obra TEXT NOT NULL DEFAULT 'direta',
  salario NUMERIC NOT NULL DEFAULT 0,
  encargos_percentual NUMERIC NOT NULL DEFAULT 68,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_admissao DATE DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Custos Fixos
CREATE TABLE public.custos_fixos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'administrativo',
  valor_mensal NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contas_pagar_select" ON public.contas_pagar FOR SELECT TO public USING (true);
CREATE POLICY "contas_pagar_insert" ON public.contas_pagar FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "contas_pagar_update" ON public.contas_pagar FOR UPDATE TO public USING (true);
CREATE POLICY "contas_pagar_delete" ON public.contas_pagar FOR DELETE TO public USING (true);

CREATE POLICY "contas_receber_select" ON public.contas_receber FOR SELECT TO public USING (true);
CREATE POLICY "contas_receber_insert" ON public.contas_receber FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "contas_receber_update" ON public.contas_receber FOR UPDATE TO public USING (true);
CREATE POLICY "contas_receber_delete" ON public.contas_receber FOR DELETE TO public USING (true);

CREATE POLICY "funcionarios_select" ON public.funcionarios FOR SELECT TO public USING (true);
CREATE POLICY "funcionarios_insert" ON public.funcionarios FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "funcionarios_update" ON public.funcionarios FOR UPDATE TO public USING (true);
CREATE POLICY "funcionarios_delete" ON public.funcionarios FOR DELETE TO public USING (true);

CREATE POLICY "custos_fixos_select" ON public.custos_fixos FOR SELECT TO public USING (true);
CREATE POLICY "custos_fixos_insert" ON public.custos_fixos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "custos_fixos_update" ON public.custos_fixos FOR UPDATE TO public USING (true);
CREATE POLICY "custos_fixos_delete" ON public.custos_fixos FOR DELETE TO public USING (true);
