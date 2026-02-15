
-- Make tempo_total a GENERATED column (calculated by the database)
ALTER TABLE public.ops DROP COLUMN tempo_total;
ALTER TABLE public.ops ADD COLUMN tempo_total numeric GENERATED ALWAYS AS (quantidade * tempo_unitario) STORED;
