import { supabase } from "@/integrations/supabase/client";

export interface CIFDashboardData {
  faturamento: number;
  custoMateriais: number;
  custoMaoDeObra: number;
  custoTotal: number;
  ebitda: number;
  margemLiquida: number;
  pedidosTotal: number;
  pedidosFaturados: number;
  rentabilidadeSKU: { sku: string; preco: number; custo: number; margem: number; volume: number }[];
  receitaMensal: { mes: string; receita: number; custo: number; margem: number }[];
  custoFixo: number;
  pontoEquilibrio: number;
}

const CUSTO_HORA_MOB = 18.5; // R$/hora mão de obra

export async function fetchCIFData(): Promise<CIFDashboardData> {
  // Fetch pedidos for revenue
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, valor_total, status, status_faturamento, created_at")
    .order("created_at", { ascending: false });

  // Fetch ops for cost calculation
  const { data: ops } = await supabase
    .from("ops")
    .select("id, produto_nome, quantidade, tempo_unitario, tempo_total, status_producao");

  // Fetch materiais for cost
  const { data: materiais } = await (supabase as any)
    .from("materiais")
    .select("estoque_atual, valor_unitario");

  const allPedidos = pedidos || [];
  const allOps = ops || [];

  const faturamento = allPedidos.reduce((s, p) => s + Number(p.valor_total || 0), 0);
  const pedidosFaturados = allPedidos.filter(p => p.status_faturamento === 'faturado').length;

  // MOB cost = sum of all OP hours × cost/hour
  const totalHoras = allOps.reduce((s, op) => s + Number(op.tempo_total || 0), 0);
  const custoMaoDeObra = totalHoras * CUSTO_HORA_MOB;

  // Material cost from current stock value
  const custoMateriais = (materiais || []).reduce((s: number, m: any) =>
    s + Number(m.estoque_atual || 0) * Number(m.valor_unitario || 0), 0);

  const custoFixo = 54000; // Fixed costs (rent, admin, etc.)
  const custoTotal = custoMaoDeObra + custoMateriais * 0.3; // 30% of stock as consumed
  const ebitda = faturamento - custoTotal - custoFixo;
  const margemLiquida = faturamento > 0 ? (ebitda / faturamento) * 100 : 0;

  // Margem de contribuição média
  const margemContrib = faturamento > 0 ? ((faturamento - custoTotal) / faturamento) * 100 : 35;
  const pontoEquilibrio = margemContrib > 0 ? custoFixo / (margemContrib / 100) : 0;

  // SKU profitability from products
  const { data: produtos } = await supabase
    .from("produtos")
    .select("nome, preco_base, tempo_unitario")
    .eq("ativo", true)
    .limit(10);

  const rentabilidadeSKU = (produtos || []).map(p => {
    const custoUnit = Number(p.tempo_unitario) * CUSTO_HORA_MOB * 1.3; // MOB + overhead
    const margem = Number(p.preco_base) > 0
      ? ((Number(p.preco_base) - custoUnit) / Number(p.preco_base)) * 100
      : 0;
    const vol = allOps.filter(op => op.produto_nome === p.nome).reduce((s, op) => s + Number(op.quantidade), 0);
    return {
      sku: p.nome.length > 20 ? p.nome.substring(0, 20) + '…' : p.nome,
      preco: Number(p.preco_base),
      custo: Number(custoUnit.toFixed(2)),
      margem: Number(margem.toFixed(1)),
      volume: vol,
    };
  }).filter(s => s.preco > 0);

  // Monthly revenue (group by month)
  const monthMap = new Map<string, { receita: number; custo: number }>();
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  allPedidos.forEach(p => {
    const d = new Date(p.created_at);
    const key = meses[d.getMonth()];
    const cur = monthMap.get(key) || { receita: 0, custo: 0 };
    cur.receita += Number(p.valor_total || 0);
    cur.custo += Number(p.valor_total || 0) * 0.7; // Estimated 70% cost ratio
    monthMap.set(key, cur);
  });
  const receitaMensal = Array.from(monthMap.entries()).map(([mes, v]) => ({
    mes,
    receita: v.receita,
    custo: v.custo,
    margem: v.receita > 0 ? ((v.receita - v.custo) / v.receita) * 100 : 0,
  }));

  return {
    faturamento,
    custoMateriais,
    custoMaoDeObra,
    custoTotal,
    ebitda,
    margemLiquida,
    pedidosTotal: allPedidos.length,
    pedidosFaturados,
    rentabilidadeSKU,
    receitaMensal: receitaMensal.length > 0 ? receitaMensal : meses.slice(0, 6).map(m => ({ mes: m, receita: 0, custo: 0, margem: 0 })),
    custoFixo,
    pontoEquilibrio,
  };
}
