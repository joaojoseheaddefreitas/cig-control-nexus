
-- Tabela de pedidos (CIV)
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  cliente TEXT NOT NULL,
  produto TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  canal TEXT NOT NULL DEFAULT '',
  margem NUMERIC(5,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  prazo_entrega DATE,
  status TEXT NOT NULL DEFAULT 'aguardando',
  op TEXT,
  nota_fiscal TEXT,
  data_faturamento DATE,
  data_expedicao DATE,
  origem_dado TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Política pública (sem auth por enquanto - dados da fábrica, não por usuário)
CREATE POLICY "Pedidos são acessíveis publicamente" ON public.pedidos FOR SELECT USING (true);
CREATE POLICY "Pedidos podem ser inseridos" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Pedidos podem ser atualizados" ON public.pedidos FOR UPDATE USING (true);
CREATE POLICY "Pedidos podem ser deletados" ON public.pedidos FOR DELETE USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de log de ações (para diagnóstico)
CREATE TABLE public.action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logs são acessíveis publicamente" ON public.action_logs FOR SELECT USING (true);
CREATE POLICY "Logs podem ser inseridos" ON public.action_logs FOR INSERT WITH CHECK (true);

-- Habilitar realtime para pedidos
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
