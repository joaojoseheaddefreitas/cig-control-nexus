import React, { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { fetchCIFData, type CIFDashboardData } from '@/services/cifService';
import { supabase } from '@/integrations/supabase/client';

interface FinanceContextType {
  data: CIFDashboardData | null;
  loading: boolean;
  reload: () => Promise<void>;
  stats: {
    faturamento: number;
    custoMOB: number;
    custoMaterial: number;
    ebitda: number;
    margemLiq: number;
    saldoAtual: number;
    pontoEquilibrio: number;
    tendenciaReceita: number;
    tendenciaDespesa: number;
  };
}

const FinanceContext = createContext<FinanceContextType>({
  data: null,
  loading: true,
  reload: async () => {},
  stats: { faturamento: 0, custoMOB: 0, custoMaterial: 0, ebitda: 0, margemLiq: 0, saldoAtual: 0, pontoEquilibrio: 0, tendenciaReceita: 0, tendenciaDespesa: 0 },
});

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<CIFDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const cifData = await fetchCIFData();
    setData(cifData);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  // Realtime auto-refresh
  useEffect(() => {
    const ch = supabase.channel('finance-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes' }, () => reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orcamentos' }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const stats = useMemo(() => {
    if (!data) return { faturamento: 0, custoMOB: 0, custoMaterial: 0, ebitda: 0, margemLiq: 0, saldoAtual: 0, pontoEquilibrio: 0, tendenciaReceita: 0, tendenciaDespesa: 0 };

    const custoMOB = data.top3CustoMaoObra.reduce((s, c) => s + c.valor, 0);
    const custoMaterial = data.top3CustoMaterial.reduce((s, c) => s + c.valor, 0);

    return {
      faturamento: data.receita,
      custoMOB,
      custoMaterial,
      ebitda: data.ebitda,
      margemLiq: data.receita > 0 ? (data.ebitda / data.receita) * 100 : 0,
      saldoAtual: data.saldoCaixa,
      pontoEquilibrio: data.pontoEquilibrio,
      tendenciaReceita: data.tendenciaReceita,
      tendenciaDespesa: data.tendenciaDespesa,
    };
  }, [data]);

  return (
    <FinanceContext.Provider value={{ data, loading, reload, stats }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
