
-- Create cargas table for Daily Load Engine
CREATE TABLE public.cargas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'PLANEJADA',
  modo text NOT NULL DEFAULT 'manual',
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cargas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cargas acessíveis" ON public.cargas FOR SELECT USING (true);
CREATE POLICY "Cargas inseríveis" ON public.cargas FOR INSERT WITH CHECK (true);
CREATE POLICY "Cargas atualizáveis" ON public.cargas FOR UPDATE USING (true);
CREATE POLICY "Cargas deletáveis" ON public.cargas FOR DELETE USING (true);

-- Add carga_id to ops table
ALTER TABLE public.ops ADD COLUMN carga_id uuid REFERENCES public.cargas(id);

-- Enable realtime for cargas
ALTER PUBLICATION supabase_realtime ADD TABLE public.cargas;

-- Trigger for updated_at
CREATE TRIGGER update_cargas_updated_at
  BEFORE UPDATE ON public.cargas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
