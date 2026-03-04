
-- Add scheduling fields to ops table for unified PCP screen
ALTER TABLE public.ops ADD COLUMN IF NOT EXISTS data_programada date;
ALTER TABLE public.ops ADD COLUMN IF NOT EXISTS sequencia_programada integer;

-- Index for efficient querying by programmed date
CREATE INDEX IF NOT EXISTS idx_ops_data_programada ON public.ops(data_programada);
