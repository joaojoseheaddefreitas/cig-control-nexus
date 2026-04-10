import { supabase } from "@/integrations/supabase/client";

export interface TransacaoRow {
  id: string;
  tipo: string;
  categoria: string;
  descricao: string;
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  status: string;
  created_at: string;
}

export interface OrcamentoRow {
  id: string;
  categoria: string;
  valor_limite: number;
  mes_ano: string;
}

export interface LogAuditoriaRow {
  id: string;
  usuario: string;
  acao: string;
  valor_antigo: number | null;
  valor_novo: number | null;
  detalhes: string | null;
  entidade: string | null;
  entidade_id: string | null;
  data: string;
}

export interface RentabilidadeSKU {
  sku: string;
  preco: number;
  custoMaterial: number;
  custoMaoObra: number;
  custoIndireto: number;
  custoImpostos: number;
  custoComissao: number;
  custoTotal: number;
  margem: number;
  lucroUnitario: number;
  volume: number;
  lucroTotal: number;
  curvaABC: 'A' | 'B' | 'C';
}

export interface CIFDashboardData {
  receita: number;
  despesa: number;
  ebitda: number;
  saldoCaixa: number;
  receitaMesAnterior: number;
  despesaMesAnterior: number;
  tendenciaReceita: number;
  tendenciaDespesa: number;
  top3CustoMaterial: { categoria: string; valor: number }[];
  top3CustoMaoObra: { categoria: string; valor: number }[];
  receitaMensal: { mes: string; receita: number; despesa: number; resultado: number }[];
  fluxoProjetado: { dia: string; saldo: number }[];
  custosPorCategoria: { categoria: string; valor: number; limite: number; percentual: number }[];
  rentabilidadeSKU: RentabilidadeSKU[];
  pontoEquilibrio: number;
  custoFixo: number;
  faturamento: number;
  transacoes: TransacaoRow[];
  orcamentos: OrcamentoRow[];
  logs: LogAuditoriaRow[];
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export async function fetchCIFData(): Promise<CIFDashboardData> {
  const [transRes, orcRes, logsRes, produtosRes, opsRes, configFinRes] = await Promise.all([
    (supabase as any).from("transacoes").select("*").order("data_emissao", { ascending: false }),
    (supabase as any).from("orcamentos").select("*"),
    (supabase as any).from("logs_auditoria").select("*").order("data", { ascending: false }).limit(50),
    supabase.from("produtos").select("nome, preco_base, tempo_unitario").eq("ativo", true).limit(20),
    supabase.from("ops").select("id, produto_nome, quantidade, tempo_unitario, tempo_total, status_producao"),
    (supabase as any).from("configuracoes_financeiras").select("*").limit(1),
  ]);

  const transacoes: TransacaoRow[] = (transRes.data || []) as any[];
  const orcamentos: OrcamentoRow[] = (orcRes.data || []) as any[];
  const cfgFin = (configFinRes.data || [])[0] || { impostos_percentual: 8.5, comissoes_percentual: 5 };
  const impostosPerc = Number(cfgFin.impostos_percentual) / 100;
  const comissaoPerc = Number(cfgFin.comissoes_percentual) / 100;
  const logs: LogAuditoriaRow[] = (logsRes.data || []) as any[];

  const now = new Date();
  const mesAtual = now.getMonth();
  const anoAtual = now.getFullYear();

  const isCurrentMonth = (d: string) => {
    const dt = new Date(d);
    return dt.getMonth() === mesAtual && dt.getFullYear() === anoAtual;
  };
  const isPrevMonth = (d: string) => {
    const dt = new Date(d);
    const pm = mesAtual === 0 ? 11 : mesAtual - 1;
    const py = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    return dt.getMonth() === pm && dt.getFullYear() === py;
  };

  // KPIs do mês atual
  const receitasPagas = transacoes.filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO');
  const despesasPagas = transacoes.filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO');

  const receita = receitasPagas.reduce((s, t) => s + Number(t.valor), 0);
  const despesa = despesasPagas.reduce((s, t) => s + Number(t.valor), 0);
  const saldoCaixa = receita - despesa;
  const ebitda = saldoCaixa;

  // Mês anterior
  const receitaMesAnterior = receitasPagas.filter(t => isPrevMonth(t.data_emissao)).reduce((s, t) => s + Number(t.valor), 0);
  const despesaMesAnterior = despesasPagas.filter(t => isPrevMonth(t.data_emissao)).reduce((s, t) => s + Number(t.valor), 0);
  const receitaMesAtual = receitasPagas.filter(t => isCurrentMonth(t.data_emissao)).reduce((s, t) => s + Number(t.valor), 0);
  const despesaMesAtual = despesasPagas.filter(t => isCurrentMonth(t.data_emissao)).reduce((s, t) => s + Number(t.valor), 0);

  const tendenciaReceita = receitaMesAnterior > 0 ? ((receitaMesAtual / receitaMesAnterior) - 1) * 100 : 0;
  const tendenciaDespesa = despesaMesAnterior > 0 ? ((despesaMesAtual / despesaMesAnterior) - 1) * 100 : 0;

  // Top 3 categorias
  const despesasByCat = new Map<string, number>();
  despesasPagas.forEach(t => {
    despesasByCat.set(t.categoria, (despesasByCat.get(t.categoria) || 0) + Number(t.valor));
  });
  const sortedCats = Array.from(despesasByCat.entries()).sort((a, b) => b[1] - a[1]);
  const top3CustoMaterial = sortedCats.filter(([c]) => c === 'materiais' || c === 'energia' || c === 'manutencao').slice(0, 3).map(([categoria, valor]) => ({ categoria, valor }));
  const top3CustoMaoObra = sortedCats.filter(([c]) => c === 'mao_de_obra' || c === 'administrativo' || c === 'aluguel').slice(0, 3).map(([categoria, valor]) => ({ categoria, valor }));

  // Receita mensal (12 meses)
  const monthMap = new Map<string, { receita: number; despesa: number }>();
  transacoes.forEach(t => {
    const d = new Date(t.data_emissao);
    const key = `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
    const cur = monthMap.get(key) || { receita: 0, despesa: 0 };
    if (t.tipo === 'RECEITA') cur.receita += Number(t.valor);
    else cur.despesa += Number(t.valor);
    monthMap.set(key, cur);
  });
  const receitaMensal = Array.from(monthMap.entries())
    .map(([mes, v]) => ({ mes, receita: v.receita, despesa: v.despesa, resultado: v.receita - v.despesa }))
    .reverse();

  // Fluxo projetado (30 dias)
  const pendentes = transacoes.filter(t => t.status === 'PENDENTE');
  const fluxoProjetado: { dia: string; saldo: number }[] = [];
  let saldoAcum = saldoCaixa;
  for (let i = 0; i < 30; i++) {
    const dia = new Date(now);
    dia.setDate(dia.getDate() + i);
    const diaStr = dia.toISOString().slice(0, 10);
    const doDia = pendentes.filter(t => t.data_vencimento === diaStr);
    doDia.forEach(t => {
      if (t.tipo === 'RECEITA') saldoAcum += Number(t.valor);
      else saldoAcum -= Number(t.valor);
    });
    if (i % 3 === 0 || i === 29) {
      fluxoProjetado.push({ dia: `${dia.getDate()}/${dia.getMonth() + 1}`, saldo: saldoAcum });
    }
  }

  // Custos por categoria vs orçamento
  const mesAtualOrc = orcamentos.filter(o => {
    const d = new Date(o.mes_ano);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });
  // Use any month's budget if current month has none
  const orcsToUse = mesAtualOrc.length > 0 ? mesAtualOrc : orcamentos;
  const custosPorCategoria = orcsToUse.map(o => {
    const gastoReal = despesasPagas
      .filter(t => t.categoria === o.categoria && isCurrentMonth(t.data_emissao))
      .reduce((s, t) => s + Number(t.valor), 0);
    // If no current month data, use all-time average
    const gastoFinal = gastoReal > 0 ? gastoReal : despesasPagas
      .filter(t => t.categoria === o.categoria)
      .reduce((s, t) => s + Number(t.valor), 0) / Math.max(1, monthMap.size);
    const percentual = Number(o.valor_limite) > 0 ? (gastoFinal / Number(o.valor_limite)) * 100 : 0;
    return { categoria: o.categoria, valor: gastoFinal, limite: Number(o.valor_limite), percentual };
  });

  // Custos fixos
  const custoFixoMensal = sortedCats
    .filter(([c]) => c === 'aluguel' || c === 'energia' || c === 'administrativo' || c === 'manutencao')
    .reduce((s, [, v]) => s + v, 0) / Math.max(1, monthMap.size);

  const margemContrib = receita > 0 ? ((receita - despesa + custoFixoMensal * monthMap.size) / receita) * 100 : 35;
  const pontoEquilibrio = margemContrib > 0 ? custoFixoMensal / (margemContrib / 100) : 0;

  // Rentabilidade SKU
  const CUSTO_HORA = 18.5;
  const CUSTO_INDIRETO_MULT = 0.15; // 15% overhead
  const allOps = opsRes.data || [];

  const rentabilidadeRaw: RentabilidadeSKU[] = (produtosRes.data || []).map(p => {
    const preco = Number(p.preco_base);
    const custoMaoObra = Number(p.tempo_unitario) * CUSTO_HORA;
    const custoMaterial = custoMaoObra * 0.3; // proxy
    const custoIndireto = (custoMaoObra + custoMaterial) * CUSTO_INDIRETO_MULT;
    const custoImpostos = preco * impostosPerc;
    const custoComissao = preco * comissaoPerc;
    const custoTotal = custoMaoObra + custoMaterial + custoIndireto + custoImpostos + custoComissao;
    const margem = preco > 0 ? ((preco - custoTotal) / preco) * 100 : 0;
    const lucroUnitario = preco - custoTotal;
    const volume = allOps.filter(op => op.produto_nome === p.nome).reduce((s, op) => s + Number(op.quantidade), 0);
    return {
      sku: p.nome.length > 20 ? p.nome.substring(0, 20) + '…' : p.nome,
      preco,
      custoMaterial: Number(custoMaterial.toFixed(2)),
      custoMaoObra: Number(custoMaoObra.toFixed(2)),
      custoIndireto: Number(custoIndireto.toFixed(2)),
      custoImpostos: Number(custoImpostos.toFixed(2)),
      custoComissao: Number(custoComissao.toFixed(2)),
      custoTotal: Number(custoTotal.toFixed(2)),
      margem: Number(margem.toFixed(1)),
      lucroUnitario: Number(lucroUnitario.toFixed(2)),
      volume,
      lucroTotal: Number((lucroUnitario * volume).toFixed(2)),
      curvaABC: 'C' as const,
    };
  }).filter(s => s.preco > 0);

  // Sort by lucroTotal DESC (only products with volume)
  const comVolume = rentabilidadeRaw.filter(s => s.volume > 0).sort((a, b) => b.lucroTotal - a.lucroTotal);
  const semVolume = rentabilidadeRaw.filter(s => s.volume === 0);

  // Curva ABC calculation
  const totalLucro = comVolume.reduce((s, p) => s + Math.max(0, p.lucroTotal), 0);
  let acum = 0;
  comVolume.forEach(p => {
    acum += Math.max(0, p.lucroTotal);
    if (totalLucro > 0) {
      const pct = acum / totalLucro;
      p.curvaABC = pct <= 0.8 ? 'A' : pct <= 0.95 ? 'B' : 'C';
    }
  });

  const rentabilidadeSKU = [...comVolume, ...semVolume];

  return {
    receita, despesa, ebitda, saldoCaixa,
    receitaMesAnterior, despesaMesAnterior,
    tendenciaReceita, tendenciaDespesa,
    top3CustoMaterial, top3CustoMaoObra,
    receitaMensal, fluxoProjetado,
    custosPorCategoria, rentabilidadeSKU,
    pontoEquilibrio, custoFixo: custoFixoMensal,
    faturamento: receita,
    transacoes, orcamentos, logs,
  };
}

export async function marcarComoPago(id: string, valorOriginal: number): Promise<void> {
  const { error } = await (supabase as any).from("transacoes").update({ status: 'PAGO' }).eq('id', id);
  if (error) throw error;

  await (supabase as any).from("logs_auditoria").insert({
    usuario: 'sistema',
    acao: 'BAIXA_PAGAMENTO',
    valor_antigo: 0,
    valor_novo: valorOriginal,
    detalhes: `Transação ${id} marcada como PAGO`,
    entidade: 'transacoes',
    entidade_id: id,
  });
}

export async function criarTransacao(t: Partial<TransacaoRow>): Promise<void> {
  const { data, error } = await (supabase as any).from("transacoes").insert(t).select().single();
  if (error) throw error;

  await (supabase as any).from("logs_auditoria").insert({
    usuario: 'sistema',
    acao: 'CRIACAO_TRANSACAO',
    valor_antigo: null,
    valor_novo: Number(t.valor || 0),
    detalhes: `${t.tipo}: ${t.descricao}`,
    entidade: 'transacoes',
    entidade_id: data?.id,
  });
}
