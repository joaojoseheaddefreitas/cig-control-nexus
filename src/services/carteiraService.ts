import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch the current accumulated hours from carteira_producao.
 */
export async function fetchCarteiraHoras(): Promise<number> {
  const { data, error } = await supabase
    .from("carteira_producao" as any)
    .select("total_horas_acumuladas")
    .limit(1)
    .maybeSingle();

  if (error || !data) return 0;
  return Number((data as any).total_horas_acumuladas) || 0;
}

/**
 * Add hours to the carteira (after approval).
 */
export async function adicionarHorasCarteira(horas: number): Promise<void> {
  const { data } = await supabase
    .from("carteira_producao" as any)
    .select("id, total_horas_acumuladas")
    .limit(1)
    .maybeSingle();

  if (data) {
    const novoTotal = Number((data as any).total_horas_acumuladas) + horas;
    await supabase
      .from("carteira_producao" as any)
      .update({ total_horas_acumuladas: novoTotal, updated_at: new Date().toISOString() } as any)
      .eq("id", (data as any).id);
  }
}

/**
 * Subtract hours from the carteira (edit or cancellation).
 */
export async function subtrairHorasCarteira(horas: number): Promise<void> {
  const { data } = await supabase
    .from("carteira_producao" as any)
    .select("id, total_horas_acumuladas")
    .limit(1)
    .maybeSingle();

  if (data) {
    const novoTotal = Math.max(0, Number((data as any).total_horas_acumuladas) - horas);
    await supabase
      .from("carteira_producao" as any)
      .update({ total_horas_acumuladas: novoTotal, updated_at: new Date().toISOString() } as any)
      .eq("id", (data as any).id);
  }
}
