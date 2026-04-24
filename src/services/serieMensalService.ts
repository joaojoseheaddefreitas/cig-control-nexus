import { supabase } from "@/integrations/supabase/client";

export interface SerieMensal {
  mes: string;          // 'Jan', 'Fev', 'Mar', 'Abr'
  faturamento: number;  // RECEITA / vendas
  producao: number;     // DESPESA / mao_de_obra
  compras: number;      // DESPESA / materiais
}

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Lê transações de 2026 (Jan-Abr) e agrega por mês para uso nos
 * gráficos mensais de CIG, CIV, CIP e CIF.
 */
export async function fetchSerieMensal2026(): Promise<SerieMensal[]> {
  const { data } = await (supabase as any)
    .from('transacoes')
    .select('tipo, categoria, valor, data_emissao')
    .gte('data_emissao', '2026-01-01')
    .lte('data_emissao', '2026-04-30');

  const map = new Map<number, SerieMensal>();
  for (let m = 0; m <= 3; m++) {
    map.set(m, { mes: MESES_PT[m], faturamento: 0, producao: 0, compras: 0 });
  }

  (data || []).forEach((t: any) => {
    const mes = new Date(t.data_emissao).getMonth();
    const slot = map.get(mes);
    if (!slot) return;
    const valor = Number(t.valor) || 0;
    if (t.tipo === 'RECEITA' && t.categoria === 'vendas') slot.faturamento += valor;
    else if (t.tipo === 'DESPESA' && t.categoria === 'mao_de_obra') slot.producao += valor * 4; // proxy: 25% custo MO
    else if (t.tipo === 'DESPESA' && t.categoria === 'materiais') slot.compras += valor;
  });

  return Array.from(map.values());
}

/**
 * Retorna a média trimestral (Jan-Mar) das três métricas.
 */
export function calcularMediaTrimestral(serie: SerieMensal[]) {
  const tri = serie.slice(0, 3);
  const n = Math.max(1, tri.length);
  return {
    faturamento: tri.reduce((s, m) => s + m.faturamento, 0) / n,
    producao: tri.reduce((s, m) => s + m.producao, 0) / n,
    compras: tri.reduce((s, m) => s + m.compras, 0) / n,
  };
}

/**
 * Distribuição diária de Abril/2026 (1-23). Usada nos charts diários
 * de CIV (vendas), CIP (produção) e CIF (faturamento).
 */
export interface DistribuicaoDiariaAbril {
  dia: number;
  vendas: number;
  producao: number;
  compras: number;
}

export async function fetchDistribuicaoDiariaAbril(): Promise<DistribuicaoDiariaAbril[]> {
  const { data } = await (supabase as any)
    .from('transacoes')
    .select('tipo, categoria, valor, data_emissao')
    .gte('data_emissao', '2026-04-01')
    .lte('data_emissao', '2026-04-30');

  const map = new Map<number, DistribuicaoDiariaAbril>();
  (data || []).forEach((t: any) => {
    const dia = new Date(t.data_emissao).getDate();
    const slot = map.get(dia) || { dia, vendas: 0, producao: 0, compras: 0 };
    const valor = Number(t.valor) || 0;
    if (t.tipo === 'RECEITA' && t.categoria === 'vendas') slot.vendas += valor;
    else if (t.tipo === 'DESPESA' && t.categoria === 'mao_de_obra') slot.producao += valor * 4;
    else if (t.tipo === 'DESPESA' && t.categoria === 'materiais') slot.compras += valor;
    map.set(dia, slot);
  });

  return Array.from(map.values()).sort((a, b) => a.dia - b.dia);
}
