import { supabase } from "@/integrations/supabase/client";

export interface ConfigCapacidade {
  capacidade_produtiva_diaria: number;
  considerar_sabado: boolean;
}

export async function fetchConfigCapacidade(): Promise<ConfigCapacidade> {
  const { data, error } = await supabase
    .from("configuracoes_capacidade")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    // Return defaults if no config exists
    return { capacidade_produtiva_diaria: 8, considerar_sabado: false };
  }

  return {
    capacidade_produtiva_diaria: Number(data.capacidade_produtiva_diaria) || 8,
    considerar_sabado: data.considerar_sabado,
  };
}

export async function updateConfigCapacidade(config: ConfigCapacidade): Promise<{ error: string | null }> {
  // Upsert: try to update first row, insert if none exists
  const { data: existing } = await supabase
    .from("configuracoes_capacidade")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("configuracoes_capacidade")
      .update({
        capacidade_produtiva_diaria: config.capacidade_produtiva_diaria,
        considerar_sabado: config.considerar_sabado,
      })
      .eq("id", existing.id);
    return { error: error?.message || null };
  } else {
    const { error } = await supabase
      .from("configuracoes_capacidade")
      .insert({
        capacidade_produtiva_diaria: config.capacidade_produtiva_diaria,
        considerar_sabado: config.considerar_sabado,
      });
    return { error: error?.message || null };
  }
}

/**
 * Calculate delivery date skipping Sundays and optionally Saturdays.
 * Returns the final date and the number of working days.
 */
export function calcularDataEntrega(
  startDate: Date,
  diasProducao: number,
  considerarSabado: boolean
): Date {
  const result = new Date(startDate);
  let diasRestantes = diasProducao;

  while (diasRestantes > 0) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    // Skip Sunday (0)
    if (dow === 0) continue;
    // Skip Saturday (6) if not considering
    if (dow === 6 && !considerarSabado) continue;
    diasRestantes--;
  }

  return result;
}

/**
 * Calculate production days from total hours and daily capacity.
 * Handles division by zero and NaN.
 */
export function calcularDiasProducao(
  cargaTotalHoras: number,
  capacidadeDiaria: number
): number {
  if (!capacidadeDiaria || capacidadeDiaria <= 0) return 0;
  if (!cargaTotalHoras || isNaN(cargaTotalHoras)) return 0;
  return Math.ceil(cargaTotalHoras / capacidadeDiaria);
}

/**
 * Get total backlog hours from open OPs.
 */
export async function fetchCargaCarteira(): Promise<number> {
  const { data, error } = await supabase
    .from("ops")
    .select("tempo_total")
    .neq("status_producao", "Producao Finalizada");

  if (error || !data) return 0;
  return data.reduce((sum, op) => sum + (Number(op.tempo_total) || 0), 0);
}
