
ALTER TABLE public.materiais 
ADD COLUMN IF NOT EXISTS tipo_controle text NOT NULL DEFAULT 'MRP',
ADD COLUMN IF NOT EXISTS margem_seguranca_percentual numeric NOT NULL DEFAULT 20;
