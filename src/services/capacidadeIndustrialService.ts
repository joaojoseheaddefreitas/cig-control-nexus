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
  // Calculated
  horas_disponiveis_mensal: number; // OFERTA: equipe × multiplicador × 8.8 × dias (SEM eficiência)
  horas_ocupadas: number;          // DEMANDA: (qty × tempo_padrao) / eficiência
  carga_percent: number;           // ocupação = demanda / oferta × 100
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

/**
 * Get occupancy status using 5-level system:
 * 🔴 >100% Gargalo | 🟠 95-100% No limite | 🟡 80-94.9% Atenção | 🟢 50-79.9% Normal | 🔵 <50% Ocioso
 */
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

/**
 * Get efficiency classification (visual indicator only, does NOT change calculations):
 * ≥95% Muito alto | 85-94.9% Normal | 70-84.9% Atenção | <70% Problema
 */
export function getEficienciaLabel(eff: number): { label: string; color: string } {
  if (eff >= 95) return { label: 'Muito Alto', color: 'text-blue-400' };
  if (eff >= 85) return { label: 'Normal', color: 'text-success' };
  if (eff >= 70) return { label: 'Atenção', color: 'text-warning' };
  return { label: 'Problema', color: 'text-destructive' };
}

/**
 * FORMULA CENTRAL — single source of truth
 * 
 * CAPACIDADE (OFERTA):
 *   cap = equipe × multiplicador × horas_turno × dias_uteis
 *   Multiplicador: manual=1, CNC/automação=maquinas_automaticas
 *   Eficiência NÃO entra na capacidade
 *
 * HORAS NECESSÁRIAS (DEMANDA):
 *   horas = Σ(tempo_estimado_por_setor) for active OPs
 *   If no route steps: fallback = op.tempo_total / num_setores
 *   Eficiência IS applied: horas_ajustadas = horas / eficiencia
 *
 * OCUPAÇÃO:
 *   ocupação% = horas_necessárias / capacidade × 100
 */
export async function calcularCapacidadeFabrica(): Promise<CapacidadeFabrica> {
  const [setoresRes, opsRes, stepsRes, trackingRes] = await Promise.all([
    supabase.from("setores_produtivos").select("*").eq("ativo", true).order("ordem"),
    supabase.from("ops").select("id, tempo_total, tempo_unitario, quantidade, status_producao")
      .neq("status_producao", "Producao Finalizada")
      .neq("status_producao", "cancelado"),
    supabase.from("op_route_steps").select("op_id, setor_id, tempo_estimado"),
    supabase.from("setor_rastreamento").select("setor_id, op_id, status"),
  ]);

  const setoresDB = setoresRes.data || [];
  const ops = opsRes.data || [];
  const allSteps = stepsRes.data || [];
  
  const opIdsSet = new Set(ops.map(o => o.id));
  const activeSteps = allSteps.filter(s => opIdsSet.has(s.op_id));
  const opsWithSteps = new Set(activeSteps.map(s => s.op_id));
  const numSetores = setoresDB.length || 1;

  // Fallback hours for OPs without route steps
  const fallbackTotal = ops
    .filter(op => !opsWithSteps.has(op.id) && Number(op.tempo_total || 0) > 0)
    .reduce((sum, op) => sum + Number(op.tempo_total || 0), 0);
  const fallbackPerSetor = fallbackTotal / numSetores;

  const setores: SetorCapacidade[] = setoresDB.map((s: any) => {
    const mdo = Number(s.mao_de_obra) || 0;
    const multiplicador = Math.max(Number(s.maquinas_automaticas) || 1, 1);
    const ht = Number(s.horas_turno) || 8.8;
    const eff = Number(s.eficiencia) || 0.85;
    const diasUteis = Number(s.dias_uteis_mensais) || 22;

    // CAPACIDADE = equipe × multiplicador × horas_turno × dias (SEM eficiência)
    const horasDisp = mdo * multiplicador * ht * diasUteis;

    // HORAS NECESSÁRIAS = steps hours / eficiência (eficiência increases needed hours)
    const horasFromSteps = activeSteps
      .filter(st => st.setor_id === s.id)
      .reduce((sum, st) => sum + Number(st.tempo_estimado || 0), 0);
    
    const horasOcup = (horasFromSteps + fallbackPerSetor) / eff;
    const carga = horasDisp > 0 ? Math.round((horasOcup / horasDisp) * 100) : 0;

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

  // Bottleneck = sector with highest occupancy %
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
