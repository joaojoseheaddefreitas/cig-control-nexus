import { supabase } from "@/integrations/supabase/client";

// ─── Constants ───────────────────────────────────────────────────────
export const DIAS_UTEIS_DEFAULT = 22;
export const FOLGA_OPERACIONAL = 1;        // dias — configurável
export const LIMITE_OPERACIONAL = 0.95;    // 95% da cap diária
export const ALERTA_DESEQUILIBRIO = 50;    // % de diferença entre setores

export interface SetorCapacidade {
  id: string;
  nome: string;
  ordem: number;
  mao_de_obra: number;
  horas_turno: number;
  eficiencia: number;
  maquinas_automaticas: number;
  dias_uteis_mensais: number;
  dias_uteis_manual: boolean;
  horas_disponiveis_mensal: number;
  horas_ocupadas: number;
  carga_percent: number;
  status: 'azul' | 'verde' | 'amarelo' | 'laranja' | 'vermelho';
  // PCP 3.0 — novos campos
  capDiaria: number;
  folgaResidual: number;
  diasGargalo: number;
  limiteOperacional: number;
  statusFolga: 'azul' | 'verde' | 'amarelo' | 'vermelho';
}

export interface CapacidadeFabrica {
  setorGargalo: string;
  capacidadeFabrica: number;
  horasProdutivasTotais: number;
  horasNecessarias: number;
  saldoHoras: number;
  percentualOcupacao: number;
  diasUteis: number;
  capacidadeDiaria: number;
  diasNecessarios: number;
  eficienciaMedia: number;
  setores: SetorCapacidade[];
  // PCP 3.0
  prazoVendasDias: number;
  gargaloEmDias: number;
  setorGargaloDias: string;
  alertaDesbalanceamento: boolean;
  folgaMax: number;
  folgaMin: number;
  setorMaisFolgado: string;
  setorMenosFolgado: string;
}

export function getOcupacaoStatus(percent: number): 'azul' | 'verde' | 'amarelo' | 'laranja' | 'vermelho' {
  if (percent > 100) return 'vermelho';
  if (percent >= 95) return 'laranja';
  if (percent >= 80) return 'amarelo';
  if (percent >= 50) return 'verde';
  return 'azul';
}

export function getFolgaStatus(folgaResidual: number): 'azul' | 'verde' | 'amarelo' | 'vermelho' {
  if (folgaResidual > 30) return 'azul';
  if (folgaResidual > 11) return 'verde';
  if (folgaResidual > 3)  return 'amarelo';
  return 'vermelho';
}

export function getOcupacaoLabel(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case 'vermelho': return { label: 'GARGALO', color: 'text-destructive', bg: 'bg-destructive/20' };
    case 'laranja':  return { label: 'NO LIMITE', color: 'text-orange-400', bg: 'bg-orange-400/20' };
    case 'amarelo':  return { label: 'ATENÇÃO', color: 'text-warning', bg: 'bg-warning/20' };
    case 'verde':    return { label: 'NORMAL', color: 'text-success', bg: 'bg-success/20' };
    case 'azul':     return { label: 'OCIOSO', color: 'text-blue-400', bg: 'bg-blue-400/20' };
    default:         return { label: 'N/A', color: 'text-muted-foreground', bg: 'bg-secondary/20' };
  }
}

export function getEficienciaLabel(eff: number): { label: string; color: string } {
  if (eff >= 95) return { label: 'Muito Alto', color: 'text-blue-400' };
  if (eff >= 85) return { label: 'Normal', color: 'text-success' };
  if (eff >= 70) return { label: 'Atenção', color: 'text-warning' };
  return { label: 'Problema', color: 'text-destructive' };
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PRODUCT_ALIASES: Record<string, string> = {
  'astor   02 lugares': 'ASTOR 02L',
  'astor 02 lugares': 'ASTOR 02L',
  'sofa astor 2 l': 'ASTOR 02L',
  'sofa astor 2l': 'ASTOR 02L',
  'astor 03l': 'ASTOR 03L',
  'sofa ancora 3 lugares': 'ANCORA - 03 LUGARES',
  'sofa cast': 'CAST - 02 LUGARES 1 BRACO',
  'sofa cast  1l': 'CAST - 01 LUGAR 1 BRACO',
  'sofa cast 1l': 'CAST - 01 LUGAR 1 BRACO',
  'craft 03 lugares': 'CRAFT - 03 LUGARES',
  'atenas   02 lugares assento solto': 'ATENAS - 02 LUGARES ASSENTO SOLTO',
  'atenas   03 lugares assento solto': 'ATENAS - 03 LUGARES ASSENTO SOLTO',
  'master 100   03 lugares i 02 alm': 'MASTER 100 - 03 LUGARES I 02 ALM',
};

function findProductId(
  opNome: string,
  produtosMap: Map<string, string>
): string | null {
  const norm = normalizeName(opNome);
  if (produtosMap.has(norm)) return produtosMap.get(norm)!;

  for (const [alias, canonical] of Object.entries(PRODUCT_ALIASES)) {
    if (norm === alias || norm.includes(alias)) {
      const canonNorm = normalizeName(canonical);
      if (produtosMap.has(canonNorm)) return produtosMap.get(canonNorm)!;
    }
  }

  for (const [prodNorm, prodId] of produtosMap.entries()) {
    if (norm.includes(prodNorm) || prodNorm.includes(norm)) return prodId;
  }

  return null;
}

/**
 * FORMULA CENTRAL — PCP 3.0
 *
 * CAPACIDADE (OFERTA):
 *   capDisp = equipe × multiplicador × horas_turno × dias_uteis
 *   capDiaria = equipe × multiplicador × horas_turno
 *
 * DEMANDA POR SETOR:
 *   horasNec = SUM(op_route_steps.tempo_estimado) para OPs ativas do setor
 *
 * OCUPAÇÃO:
 *   ocupação% = horasNec / capDisp × 100
 *
 * DIAS DE GARGALO:
 *   diasGargalo = horasNec / capDiaria
 *
 * FOLGA RESIDUAL:
 *   folgaResidual% = (capDisp - horasNec) / capDisp × 100
 *
 * PRAZO DE VENDAS:
 *   prazoVendasDias = max(diasGargalo de todos setores) + FOLGA_OPERACIONAL
 *
 * GARGALO DA FÁBRICA:
 *   Setor com MAIOR ocupação %
 *
 * Eficiência 85% NÃO entra nessas fórmulas.
 */
export async function calcularCapacidadeFabrica(): Promise<CapacidadeFabrica> {
  const [setoresRes, opsRes, pstRes, produtosRes, routeStepsRes] = await Promise.all([
    supabase.from("setores_produtivos").select("*").eq("ativo", true).order("ordem"),
    supabase.from("ops").select("id, tempo_total, tempo_unitario, quantidade, status_producao, produto_nome")
      .in("status_producao", ["programada", "aguardando", "em_producao"]),
    supabase.from("produto_setor_tempos").select("produto_id, setor_id, tempo_horas"),
    supabase.from("produtos").select("id, nome").eq("ativo", true),
    supabase.from("op_route_steps").select("op_id, setor_id, tempo_estimado"),
  ]);

  const setoresDB = setoresRes.data || [];
  const ops = opsRes.data || [];
  const pstRows = pstRes.data || [];
  const produtos = produtosRes.data || [];
  const allRouteSteps = routeStepsRes.data || [];

  // Active OP ids
  const activeOpIds = new Set(ops.map(o => o.id));

  // Build product name → id map
  const produtosMap = new Map<string, string>();
  for (const p of produtos) {
    produtosMap.set(normalizeName(p.nome), p.id);
  }

  // Build setor_id → { produto_id → tempo_horas } lookup
  const temposPorSetor = new Map<string, Map<string, number>>();
  for (const row of pstRows) {
    if (!temposPorSetor.has(row.setor_id)) {
      temposPorSetor.set(row.setor_id, new Map());
    }
    temposPorSetor.get(row.setor_id)!.set(row.produto_id, Number(row.tempo_horas) || 0);
  }

  // PRIMARY: demand from op_route_steps (already has qty × tempo baked in)
  const demandaRouteSteps = new Map<string, number>();
  for (const step of allRouteSteps) {
    if (!activeOpIds.has(step.op_id)) continue;
    const atual = demandaRouteSteps.get(step.setor_id) || 0;
    demandaRouteSteps.set(step.setor_id, atual + Number(step.tempo_estimado || 0));
  }

  // FALLBACK: for OPs without route_steps, use produto_setor_tempos
  const opsWithSteps = new Set(allRouteSteps.filter(s => activeOpIds.has(s.op_id)).map(s => s.op_id));
  const demandaFallback = new Map<string, number>();
  let opsComTempo = 0;
  let opsSemTempo = 0;

  for (const op of ops) {
    if (opsWithSteps.has(op.id)) {
      opsComTempo++;
      continue; // Already counted in route_steps
    }
    const qty = Number(op.quantidade) || 0;
    const produtoId = findProductId(op.produto_nome, produtosMap);

    if (!produtoId) {
      opsSemTempo++;
      console.log(`[Capacidade] ⚠ Produto não encontrado: "${op.produto_nome}" — ignorado no cálculo por setor`);
      continue;
    }

    opsComTempo++;
    for (const [setorId, produtoTempos] of temposPorSetor.entries()) {
      const tempoSetor = produtoTempos.get(produtoId);
      if (tempoSetor && tempoSetor > 0) {
        const atual = demandaFallback.get(setorId) || 0;
        demandaFallback.set(setorId, atual + qty * tempoSetor);
      }
    }
  }

  console.log(`[Capacidade] OPs ativas: ${ops.length} | Com route_steps: ${opsWithSteps.size} | Fallback: ${opsComTempo - opsWithSteps.size} | Sem tempo: ${opsSemTempo}`);

  const setores: SetorCapacidade[] = setoresDB.map((s: any) => {
    const mdo = Number(s.mao_de_obra) || 0;
    const multiplicador = Math.max(Number(s.maquinas_automaticas) || 1, 1);
    const ht = Number(s.horas_turno) || 8.8;
    const eff = Number(s.eficiencia) || 0.85;
    const diasUteis = Number(s.dias_uteis_mensais) || 22;

    // CAPACIDADE (OFERTA)
    const horasDisp = mdo * multiplicador * ht * diasUteis;
    const capDiaria = mdo * multiplicador * ht;

    // DEMANDA POR SETOR — route_steps (primary) + fallback
    const horasOcup = (demandaRouteSteps.get(s.id) || 0) + (demandaFallback.get(s.id) || 0);

    // OCUPAÇÃO = demanda / capacidade × 100
    const carga = horasDisp > 0 ? Math.round((horasOcup / horasDisp) * 100) : 0;

    // DIAS DE GARGALO = horasNec / capDiaria
    const diasGargalo = capDiaria > 0 ? horasOcup / capDiaria : 0;

    // FOLGA RESIDUAL %
    const folgaResidual = horasDisp > 0 ? ((horasDisp - horasOcup) / horasDisp) * 100 : 100;

    // LIMITE OPERACIONAL (95% da cap diária)
    const limiteOp = capDiaria * LIMITE_OPERACIONAL;

    // SEMÁFORO baseado em FOLGA RESIDUAL
    const statusFolga = getFolgaStatus(folgaResidual);

    console.log(`[Capacidade] ${s.nome}: Demanda=${horasOcup.toFixed(1)}h | Cap=${horasDisp.toFixed(0)}h | Ocup=${carga}% | Dias=${diasGargalo.toFixed(1)} | Folga=${folgaResidual.toFixed(1)}%`);

    return {
      id: s.id,
      nome: s.nome,
      ordem: s.ordem,
      mao_de_obra: mdo,
      horas_turno: ht,
      eficiencia: eff,
      maquinas_automaticas: multiplicador,
      dias_uteis_mensais: diasUteis,
      dias_uteis_manual: s.dias_uteis_manual || false,
      horas_disponiveis_mensal: horasDisp,
      horas_ocupadas: horasOcup,
      carga_percent: carga,
      status: getOcupacaoStatus(carga),
      capDiaria,
      folgaResidual,
      diasGargalo,
      limiteOperacional: limiteOp,
      statusFolga,
    };
  });

  // Factory totals
  const horasProdutivasTotais = setores.reduce((sum, s) => sum + s.horas_disponiveis_mensal, 0);
  const horasNecessarias = setores.reduce((sum, s) => sum + s.horas_ocupadas, 0);
  const saldoHoras = horasProdutivasTotais - horasNecessarias;
  const percentualOcupacao = horasProdutivasTotais > 0
    ? Math.round((horasNecessarias / horasProdutivasTotais) * 100) : 0;

  // GARGALO = setor com MAIOR ocupação %
  const setorGargaloObj = setores.length > 0
    ? setores.reduce((max, s) => s.carga_percent > max.carga_percent ? s : max, setores[0])
    : null;

  const eficienciaMedia = setores.length > 0
    ? setores.reduce((sum, s) => sum + s.eficiencia, 0) / setores.length
    : 0.85;

  const diasUteis = setores.length > 0
    ? Math.round(setores.reduce((s, sec) => s + sec.dias_uteis_mensais, 0) / setores.length)
    : 22;

  const capacidadeFabrica = horasProdutivasTotais;
  const capacidadeDiariaTotal = diasUteis > 0 ? capacidadeFabrica / diasUteis : 0;
  const diasNecessarios = capacidadeDiariaTotal > 0
    ? Math.ceil(horasNecessarias / capacidadeDiariaTotal) : 0;

  // PCP 3.0 — Prazo de vendas baseado em dias do gargalo
  const gargaloEmDias = setores.length > 0
    ? Math.max(...setores.map(s => s.diasGargalo))
    : 0;
  // Prazo de vendas = dias reais do gargalo (sem folga adicional)
  // Ex: 956.4h / 52.8h/dia = 18.1d → 19 dias úteis
  const prazoVendasDias = Math.ceil(gargaloEmDias);

  const setorGargaloDiasObj = setores.length > 0
    ? setores.reduce((max, s) => s.diasGargalo > max.diasGargalo ? s : max, setores[0])
    : null;

  // Alerta de desbalanceamento
  const folgaMax = setores.length > 0 ? Math.max(...setores.map(s => s.folgaResidual)) : 0;
  const folgaMin = setores.length > 0 ? Math.min(...setores.map(s => s.folgaResidual)) : 0;
  const setorMaisFolgado = setores.find(s => s.folgaResidual === folgaMax);
  const setorMenosFolgado = setores.find(s => s.folgaResidual === folgaMin);
  const alertaDesbalanceamento = (folgaMax - folgaMin) > ALERTA_DESEQUILIBRIO;

  console.log(`[Capacidade] PRAZO VENDAS: ${prazoVendasDias}d | Gargalo dias: ${gargaloEmDias.toFixed(1)} (${setorGargaloDiasObj?.nome}) | Desbalanc: ${alertaDesbalanceamento ? 'SIM' : 'NÃO'}`);

  return {
    setorGargalo: setorGargaloObj?.nome || "N/A",
    capacidadeFabrica,
    horasProdutivasTotais,
    horasNecessarias,
    saldoHoras,
    percentualOcupacao,
    diasUteis,
    capacidadeDiaria: capacidadeDiariaTotal,
    diasNecessarios,
    eficienciaMedia,
    setores,
    prazoVendasDias,
    gargaloEmDias,
    setorGargaloDias: setorGargaloDiasObj?.nome || 'N/A',
    alertaDesbalanceamento,
    folgaMax,
    folgaMin,
    setorMaisFolgado: setorMaisFolgado?.nome || 'N/A',
    setorMenosFolgado: setorMenosFolgado?.nome || 'N/A',
  };
}
