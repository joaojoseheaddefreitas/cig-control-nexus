import { supabase } from "@/integrations/supabase/client";
import { verificarFechamentoPedido } from "./aprovacaoService";
import { atualizarStatusCarga } from "./cargaService";
import { verificarMateriaisOP } from "./materialCheckService";

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
  status: string;
  data_entrada: string | null;
  data_baixa: string | null;
  operador: string | null;
  observacoes: string | null;
}

export async function fetchSetores(): Promise<SetorProdutivo[]> {
  const { data, error } = await supabase
    .from("setores_produtivos")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error || !data) return [];
  return data as SetorProdutivo[];
}

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
 * - Then check auto-close on the parent pedido
 */
export async function handleSetorClick(
  opId: string,
  setorId: string,
  setores: SetorProdutivo[]
): Promise<{ error: string | null; newStatus?: string }> {
  try {
    const tracking = await fetchRastreamentoOP(opId);
    const existing = tracking.find((t) => t.setor_id === setorId);
    const setorAtual = setores.find((s) => s.id === setorId);
    if (!setorAtual) return { error: "Setor não encontrado" };

    // Check sequential order — previous sector must have "baixa"
    const setorIndex = setores.findIndex((s) => s.id === setorId);
    if (setorIndex > 0) {
      const setorAnterior = setores[setorIndex - 1];
      const trackAnterior = tracking.find((t) => t.setor_id === setorAnterior.id);
      if (!trackAnterior || (trackAnterior.status !== "baixa")) {
        return { error: `Setor anterior "${setorAnterior.nome}" precisa estar com Baixa primeiro` };
      }
    }

    if (!existing || existing.status === "pendente") {
      // First click: register Entrada (or upgrade from pre-created "pendente")
      if (existing) {
        // Update pre-created entry from approval
        const { error } = await supabase
          .from("setor_rastreamento")
          .update({
            status: "entrada",
            data_entrada: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) return { error: error.message };
      } else {
        // Create new entry (shouldn't happen normally, but safe fallback)
        const { error } = await supabase.from("setor_rastreamento").insert({
          op_id: opId,
          setor_id: setorId,
          status: "entrada",
          data_entrada: new Date().toISOString(),
        });
        if (error) return { error: error.message };
      }

      // Update current_sector on OP + status to em_producao
      await supabase.from("ops").update({
        current_sector: setorAtual.nome,
        status_producao: "em_producao",
      }).eq("id", opId);

      await supabase.from("action_logs").insert({
        action: "setor_entrada",
        entity: "setor_rastreamento",
        entity_id: opId,
        status: "success",
        details: { setor_id: setorId, setor_nome: setorAtual.nome } as any,
      });

      // Update carga status if applicable
      await atualizarStatusCarga(opId);

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

      await supabase.from("action_logs").insert({
        action: "setor_baixa",
        entity: "setor_rastreamento",
        entity_id: opId,
        status: "success",
        details: { setor_id: setorId, setor_nome: setorAtual.nome } as any,
      });

      // Check if last sector
      const isLastSetor = setorIndex === setores.length - 1;
      if (isLastSetor) {
        await supabase
          .from("ops")
          .update({ status_producao: "Producao Finalizada", current_sector: "Finalizado" })
          .eq("id", opId);

        await supabase.from("action_logs").insert({
          action: "producao_finalizada",
          entity: "ops",
          entity_id: opId,
          status: "success",
        });

        // AUTO-CLOSE: Check if all OPs for the pedido are finalized
        await verificarFechamentoPedido(opId);
      }

      // Update carga status if applicable
      await atualizarStatusCarga(opId);

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
    .select("*")
    .neq("status_producao", "Producao Finalizada")
    .order("created_at", { ascending: false });

  if (opsError || !ops) return [];

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
