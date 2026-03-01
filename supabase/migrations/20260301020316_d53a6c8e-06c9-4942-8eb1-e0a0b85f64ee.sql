-- Add capacity fields to setores_produtivos
ALTER TABLE public.setores_produtivos
  ADD COLUMN IF NOT EXISTS mao_de_obra integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS horas_turno numeric NOT NULL DEFAULT 8.8,
  ADD COLUMN IF NOT EXISTS eficiencia numeric NOT NULL DEFAULT 0.85,
  ADD COLUMN IF NOT EXISTS maquinas_automaticas integer NOT NULL DEFAULT 1;

-- Add DELETE RLS policy for setores_produtivos
CREATE POLICY "Setores podem ser deletados" ON public.setores_produtivos FOR DELETE USING (true);

-- Add UPDATE and DELETE RLS for op_route_steps
CREATE POLICY "Route steps atualizáveis" ON public.op_route_steps FOR UPDATE USING (true);
CREATE POLICY "Route steps deletáveis" ON public.op_route_steps FOR DELETE USING (true);