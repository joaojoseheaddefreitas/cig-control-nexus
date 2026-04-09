import { supabase } from "@/integrations/supabase/client";

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
}

export function getOcupacaoStatus(percent: number): 'azul' | 'verde' | 'amarelo' | 'laranja' | 'vermelho' {
  if (percent > 100) return 'vermelho';
  if (percent >= 95) return 'laranja';
  if (percent >= 80) return 'amarelo';
  if (percent >= 50) return 'verde';
  return 'azul';
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

/**
 * Normalize product name for fuzzy matching.
 * "Sofá Astor 2 L" → "sofa astor 2 l"
 * "ASTOR - 02 LUGARES" → "astor 02 lugares"
 * "ASTOR 02L" → "astor 02l"
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // remove special chars
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Known aliases: OP product name → canonical product name in produto_setor_tempos
 */
const PRODUCT_ALIASES: Record<string, string> = {
  'astor - 02 lugares': 'ASTOR 02L',
  'astor 02 lugares': 'ASTOR 02L',
  'sofa astor 2 l': 'ASTOR 02L',
  'sofa astor 2l': 'ASTOR 02L',
  'sofa ancora 3 lugares': 'ANCORA - 03 LUGARES',
  'sofa cast': 'CAST - 02 LUGARES 1 BRAÇO',
  'sofa cast 1l': 'CAST - 01 LUGAR 1 BRAÇO',
  'craft 03 lugares': 'CRAFT - 03 LUGARES',
};

/**
 * Find the best matching product_id for an OP's produto_nome
 */
function findProductId(
  opNome: string,
  produtosMap: Map<string, string> // normalized name → product id
): string | null {
  // 1. Direct match
  const norm = normalizeName(opNome);
  if (produtosMap.has(norm)) return produtosMap.get(norm)!;

  // 2. Alias match
  for (const [alias, canonical] of Object.entries(PRODUCT_ALIASES)) {
    if (norm === alias || norm.includes(alias)) {
      const canonNorm = normalizeName(canonical);
      if (produtosMap.has(canonNorm)) return produtosMap.get(canonNorm)!;
    }
  }

  // 3. Substring match — find product whose normalized name is contained in OP name or vice versa
  for (const [prodNorm, prodId] of produtosMap.entries()) {
    if (norm.includes(prodNorm) || prodNorm.includes(norm)) return prodId;
  }

  return null;
}

/**
 * FORMULA CENTRAL — single source of truth
 *
 * CAPACIDADE (OFERTA):
 *   cap = equipe × multiplicador × horas_turno × dias_uteis (SEM eficiência)
 *
 * DEMANDA POR SETOR:
 *   Para cada OP ativa, buscar tempo por setor em produto_setor_tempos
 *   demanda_setor += quantidade × tempo_do_setor
 *   Depois: demanda_ajustada = demanda_setor / eficiência
 *
 * OCUPAÇÃO:
 *   ocupação% = demanda_ajustada / capacidade × 100
 *
 * GARGALO DA FÁBRICA:
 *   Setor com MENOR horas disponíveis relativas à demanda (maior ocupação %)
 */
export async function calcularCapacidadeFabrica(): Promise<CapacidadeFabrica> {
  const [setoresRes, opsRes, pstRes, produtosRes] = await Promise.all([
    supabase.from("setores_produtivos").select("*").eq("ativo", true).order("ordem"),
    supabase.from("ops").select("id, tempo_total, tempo_unitario, quantidade, status_producao, produto_nome")
      .in("status_producao", ["programada", "aguardando", "em_producao"]),
    supabase.from("produto_setor_tempos").select("produto_id, setor_id, tempo_horas"),
    supabase.from("produtos").select("id, nome").eq("ativo", true),
  ]);

  const setoresDB = setoresRes.data || [];
  const ops = opsRes.data || [];
  const pstRows = pstRes.data || [];
  const produtos = produtosRes.data || [];

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

  // Calculate demand PER SECTOR
  // demandaBrutaPorSetor[setor_id] = Σ(quantidade × tempo_do_setor)
  const demandaBrutaPorSetor = new Map<string, number>();
  let opsComTempo = 0;
  let opsSemTempo = 0;

  for (const op of ops) {
    const qty = Number(op.quantidade) || 0;
    const produtoId = findProductId(op.produto_nome, produtosMap);

    if (!produtoId) {
      opsSemTempo++;
      console.log(`[Capacidade] ⚠ Produto não encontrado: "${op.produto_nome}" — ignorado no cálculo por setor`);
      continue;
    }

    opsComTempo++;
    // For each sector, accumulate: qty × tempo_horas
    for (const [setorId, produtoTempos] of temposPorSetor.entries()) {
      const tempoSetor = produtoTempos.get(produtoId);
      if (tempoSetor && tempoSetor > 0) {
        const atual = demandaBrutaPorSetor.get(setorId) || 0;
        demandaBrutaPorSetor.set(setorId, atual + qty * tempoSetor);
      }
    }
  }

  console.log(`[Capacidade] OPs ativas: ${ops.length} | Com tempo por setor: ${opsComTempo} | Sem tempo: ${opsSemTempo}`);

  const setores: SetorCapacidade[] = setoresDB.map((s: any) => {
    const mdo = Number(s.mao_de_obra) || 0;
    const multiplicador = Math.max(Number(s.maquinas_automaticas) || 1, 1);
    const ht = Number(s.horas_turno) || 8.8;
    const eff = Number(s.eficiencia) || 0.85;
    const diasUteis = Number(s.dias_uteis_mensais) || 22;

    // CAPACIDADE (OFERTA) = equipe × multiplicador × horas_turno × dias
    const horasDisp = mdo * multiplicador * ht * diasUteis;

    // DEMANDA POR SETOR — tempo real já inclui eficiência (NÃO dividir)
    const horasOcup = demandaBrutaPorSetor.get(s.id) || 0;

    // OCUPAÇÃO = demanda / capacidade × 100
    const carga = horasDisp > 0 ? Math.round((horasOcup / horasDisp) * 100) : 0;

    console.log(`[Capacidade] ${s.nome}: Demanda=${horasOcup.toFixed(1)}h | Cap=${horasDisp.toFixed(0)}h | Ocup=${carga}%`);

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
  const capacidadeDiaria = diasUteis > 0 ? capacidadeFabrica / diasUteis : 0;
  const diasNecessarios = capacidadeDiaria > 0
    ? Math.ceil(horasNecessarias / capacidadeDiaria) : 0;

  return {
    setorGargalo: setorGargaloObj?.nome || "N/A",
    capacidadeFabrica,
    horasProdutivasTotais,
    horasNecessarias,
    saldoHoras,
    percentualOcupacao,
    diasUteis,
    capacidadeDiaria,
    diasNecessarios,
    eficienciaMedia,
    setores,
  };
}
