
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'setores_produtivos'
    AND column_name = 'fator_eficiencia_setorial'
  ) THEN
    ALTER TABLE setores_produtivos
    ADD COLUMN fator_eficiencia_setorial NUMERIC(4,2) DEFAULT 0.90;
  END IF;
END $$;

UPDATE setores_produtivos
SET fator_eficiencia_setorial = 0.90
WHERE fator_eficiencia_setorial IS NULL;
