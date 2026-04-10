
CREATE TABLE public.pedidos_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  fornecedor_nome TEXT NOT NULL DEFAULT '',
  material_id UUID REFERENCES public.materiais(id),
  material_nome TEXT NOT NULL DEFAULT '',
  quantidade NUMERIC NOT NULL DEFAULT 0,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'emitido',
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_previsao DATE,
  data_recebimento DATE,
  quantidade_recebida NUMERIC NOT NULL DEFAULT 0,
  nota_fiscal TEXT,
  observacoes TEXT,
  on_time BOOLEAN,
  in_full BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pedidos compra acessíveis" ON public.pedidos_compra FOR SELECT USING (true);
CREATE POLICY "Pedidos compra inseríveis" ON public.pedidos_compra FOR INSERT WITH CHECK (true);
CREATE POLICY "Pedidos compra atualizáveis" ON public.pedidos_compra FOR UPDATE USING (true);
CREATE POLICY "Pedidos compra deletáveis" ON public.pedidos_compra FOR DELETE USING (true);
