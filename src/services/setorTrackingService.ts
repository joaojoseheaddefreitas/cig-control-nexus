import { supabase } from "@/integrations/supabase/client";

export interface SetorProdutivo {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

export interface RastreamentoSetor {
  id: string;
  op_id: string;
  setor_id: string;
  status: string; // 'pendente' | 'entrada' | 'baixa'
  data_entrada: string | null;
  data_baixa: string | null;
  operador: string | null;
  observacoes: string | null;
}

/**
 * Fetch all active setores ordered by `ordem`.
 */
export async function fetchSetores(): Promise<SetorProdutivo[]> {
  const { data, error } = await supabase
    .from("setores_produtivos")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error || !data) return [];
  return data as SetorProdutivo[];
}

/**
 * Fetch tracking records for a specific OP.
 */
export async function fetchRastreamentoOP(opId: string): Promise<RastreamentoSetor[]> {
  const { data, error } = await supabase
    .from("setor_rastreamento")
    .select("*")
    .eq("op_id", opId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as RastreamentoSetor[];
}

/**
 * Handle a click on a sector cell for an OP.
 * 1st click = Entrada (yellow)
 * 2nd click = Baixa (green)
 * 
 * Rules:
 * - Cannot skip sectors (previous sector must be "baixa")
 * - Cannot double-baixa
 * - When last sector is baixa'd, mark OP as "Producao Finalizada"
 */
export async function handleSetorClick(
  opId: string,
  setorId: string,
  setores: SetorProdutivo[]
): Promise<{ error: string | null; newStatus?: string }> {
  try {
    // Fetch current tracking for this OP
    const tracking = await fetchRastreamentoOP(opId);

    // Find existing record for this sector
    const existing = tracking.find((t) => t.setor_id === setorId);

    // Find sector order
    const setorAtual = setores.find((s) => s.id === setorId);
    if (!setorAtual) return { error: "Setor não encontrado" };

    // Check sequential order: previous sector must be "baixa"
    const setorIndex = setores.findIndex((s) => s.id === setorId);
    if (setorIndex > 0) {
      const setorAnterior = setores[setorIndex - 1];
      const trackAnterior = tracking.find((t) => t.setor_id === setorAnterior.id);
      if (!trackAnterior || trackAnterior.status !== "baixa") {
        return { error: `Setor anterior "${setorAnterior.nome}" precisa estar com Baixa primeiro` };
      }
    }

    if (!existing) {
      // First click: register Entrada
      const { error } = await supabase.from("setor_rastreamento").insert({
        op_id: opId,
        setor_id: setorId,
        status: "entrada",
        data_entrada: new Date().toISOString(),
      });

      if (error) return { error: error.message };

      // Log action
      await supabase.from("action_logs").insert({
        action: "setor_entrada",
        entity: "setor_rastreamento",
        entity_id: opId,
        status: "success",
        details: { setor_id: setorId, setor_nome: setorAtual.nome } as any,
      });

      return { error: null, newStatus: "entrada" };
    }

    if (existing.status === "entrada") {
      // Second click: register Baixa
      const { error } = await supabase
        .from("setor_rastreamento")
        .update({
          status: "baixa",
          data_baixa: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) return { error: error.message };

      // Log action
      await supabase.from("action_logs").insert({
        action: "setor_baixa",
        entity: "setor_rastreamento",
        entity_id: opId,
        status: "success",
        details: { setor_id: setorId, setor_nome: setorAtual.nome } as any,
      });

      // Check if this was the last sector
      const isLastSetor = setorIndex === setores.length - 1;
      if (isLastSetor) {
        // Mark OP as "Producao Finalizada"
        await supabase
          .from("ops")
          .update({ status_producao: "Producao Finalizada" })
          .eq("id", opId);

        await supabase.from("action_logs").insert({
          action: "producao_finalizada",
          entity: "ops",
          entity_id: opId,
          status: "success",
        });
      }

      return { error: null, newStatus: "baixa" };
    }

    if (existing.status === "baixa") {
      return { error: "Setor já possui baixa registrada" };
    }

    return { error: "Status desconhecido" };
  } catch (e: any) {
    return { error: e.message || "Erro ao registrar apontamento" };
  }
}

/**
 * Fetch all OPs with their tracking data for the CIP grid.
 */
export async function fetchOPsComRastreamento() {
  const { data: ops, error: opsError } = await supabase
    .from("ops")
    .select("*, familia_op!inner(numero_familia, pedido_id)")
    .neq("status_producao", "Producao Finalizada")
    .order("created_at", { ascending: false });

  if (opsError || !ops) return [];

  // Fetch all tracking records
  const opIds = ops.map((op) => op.id);
  if (opIds.length === 0) return [];

  const { data: tracking } = await supabase
    .from("setor_rastreamento")
    .select("*")
    .in("op_id", opIds);

  return ops.map((op) => ({
    ...op,
    rastreamento: (tracking || []).filter((t) => t.op_id === op.id),
  }));
}
