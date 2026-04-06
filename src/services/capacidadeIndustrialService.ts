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
  horas_disponiveis_mensal: number;
  horas_ocupadas: number;
  carga_percent: number;
}

export interface CapacidadeFabrica {
  setorGargalo: string;
  capacidadeFabrica: number; // = min horas_disponiveis across sectors (bottleneck)
  horasProdutivasTotais: number; // SUM(equipe × 8 × 22) all sectors
  horasNecessarias: number; // sum of all open OP hours
  saldoHoras: number;
  percentualOcupacao: number; // horasNecessarias / horasProdutivasTotais × 100
  diasUteis: number;
  capacidadeDiaria: number;
  diasNecessarios: number;
  setores: SetorCapacidade[];
}

/**
 * Calculate factory capacity using bottleneck (min sector capacity) approach.
 * horas_disponiveis_setor = (equipe + maquinas) × horas_dia × eficiencia × dias_uteis
 * capacidade_fabrica = MIN(horas_disponiveis across all active sectors)
 * horas_necessarias = SUM(tempo_total) from open OPs
 */
export async function calcularCapacidadeFabrica(): Promise<CapacidadeFabrica> {
  const [setoresRes, opsRes, routeStepsRes] = await Promise.all([
    supabase.from("setores_produtivos").select("*").eq("ativo", true).order("ordem"),
    supabase.from("ops").select("id, tempo_total, status_producao").neq("status_producao", "Producao Finalizada").neq("status_producao", "cancelado"),
    supabase.from("setor_rastreamento").select("setor_id, op_id, status, ops(quantidade, tempo_unitario)").eq("status", "entrada"),
  ]);

  const setoresDB = setoresRes.data || [];
  const ops = opsRes.data || [];
  const rastreamento = routeStepsRes.data || [];

  // Build per-sector occupied hours from active tracking
  const cargaMap: Record<string, number> = {};
  (rastreamento as any[]).forEach((r: any) => {
    if (!cargaMap[r.setor_id]) cargaMap[r.setor_id] = 0;
    const q = Number(r.ops?.quantidade) || 0;
    const t = Number(r.ops?.tempo_unitario) || 0;
    cargaMap[r.setor_id] += q * t;
  });

  // Calculate per-sector capacity
  const setores: SetorCapacidade[] = setoresDB.map((s: any) => {
    const mdo = Number(s.mao_de_obra) || 0;
    const maq = Number(s.maquinas_automaticas) || 0;
    const ht = Number(s.horas_turno) || 8.8;
    const eff = Number(s.eficiencia) || 0.85;
    const diasUteis = Number(s.dias_uteis_mensais) || 22;
    const horasDisp = (mdo + maq) * ht * eff * diasUteis;
    const horasOcup = cargaMap[s.id] || 0;

    return {
      id: s.id,
      nome: s.nome,
      ordem: s.ordem,
      mao_de_obra: mdo,
      horas_turno: ht,
      eficiencia: eff,
      maquinas_automaticas: maq,
      dias_uteis_mensais: diasUteis,
      horas_disponiveis_mensal: horasDisp,
      horas_ocupadas: horasOcup,
      carga_percent: horasDisp > 0 ? Math.min(100, Math.round((horasOcup / horasDisp) * 100)) : 0,
    };
  });

  // Factory capacity = MIN of sector capacities (only sectors with workers/machines)
  const setoresComCapacidade = setores.filter(s => s.horas_disponiveis_mensal > 0);
  const capacidadeFabrica = setoresComCapacidade.length > 0
    ? Math.min(...setoresComCapacidade.map(s => s.horas_disponiveis_mensal))
    : 0;

  const setorGargaloObj = setoresComCapacidade.reduce((min, s) =>
    s.horas_disponiveis_mensal < min.horas_disponiveis_mensal ? s : min,
    setoresComCapacidade[0] || { nome: "N/A", horas_disponiveis_mensal: 0 }
  );

  // Hours needed = sum of tempo_total from all open OPs
  const horasNecessarias = ops.reduce((sum, op) => sum + (Number(op.tempo_total) || 0), 0);

  // Average dias_uteis across sectors
  const diasUteis = setoresComCapacidade.length > 0
    ? Math.round(setoresComCapacidade.reduce((s, sec) => s + sec.dias_uteis_mensais, 0) / setoresComCapacidade.length)
    : 22;

  const capacidadeDiaria = diasUteis > 0 ? capacidadeFabrica / diasUteis : 0;
  const saldoHoras = capacidadeFabrica - horasNecessarias;
  const percentualOcupacao = capacidadeFabrica > 0
    ? Math.round((horasNecessarias / capacidadeFabrica) * 100)
    : 0;
  const diasNecessarios = capacidadeDiaria > 0
    ? Math.ceil(horasNecessarias / capacidadeDiaria)
    : 0;

  return {
    setorGargalo: setorGargaloObj?.nome || "N/A",
    capacidadeFabrica,
    horasNecessarias,
    saldoHoras,
    percentualOcupacao,
    diasUteis,
    capacidadeDiaria,
    diasNecessarios,
    setores,
  };
}
