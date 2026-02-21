
-- Adicionar campos comerciais à tabela produtos (se não existirem)
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS preco_base NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'geral';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS observacoes TEXT;
