import { supabase } from "@/integrations/supabase/client";

export interface PedidoDB {
  id: string;
  codigo: string;
  cliente: string;
  produto: string;
  quantidade: number;
  canal: string;
  margem: number;
  valor_total: number;
  data_entrada: string;
  prazo_entrega: string | null;
  status: string;
  op: string | null;
  nota_fiscal: string | null;
  data_faturamento: string | null;
  data_expedicao: string | null;
  origem_dado: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionLog {
  action: string;
  entity: string;
  entity_id?: string;
  status: string;
  details?: Record<string, unknown>;
}

// Log de ações para diagnóstico
async function logAction(log: ActionLog) {
  try {
    await supabase.from("action_logs").insert([{
      action: log.action,
      entity: log.entity,
      entity_id: log.entity_id || null,
      status: log.status,
      details: (log.details || null) as any,
    }]);
  } catch (e) {
    console.error("[ACTION_LOG] Falha ao registrar log:", e);
  }
}

// Buscar todos os pedidos
export async function fetchPedidos(): Promise<{ data: PedidoDB[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[PEDIDOS] Erro ao buscar:", error.message);
    await logAction({ action: "fetch", entity: "pedidos", status: "error", details: { error: error.message } });
    return { data: null, error: error.message };
  }

  return { data: data as PedidoDB[], error: null };
}

// Inserir pedido
export async function insertPedido(pedido: Omit<PedidoDB, "id" | "created_at" | "updated_at">): Promise<{ data: PedidoDB | null; error: string | null }> {
  const { data, error } = await supabase
    .from("pedidos")
    .insert(pedido)
    .select()
    .single();

  if (error) {
    console.error("[PEDIDOS] Erro ao inserir:", error.message);
    await logAction({ action: "insert", entity: "pedidos", entity_id: pedido.codigo, status: "error", details: { error: error.message, pedido } });
    return { data: null, error: error.message };
  }

  console.log("[PEDIDOS] ✅ Pedido inserido:", data.codigo);
  await logAction({ action: "insert", entity: "pedidos", entity_id: data.id, status: "success", details: { codigo: data.codigo } });
  return { data: data as PedidoDB, error: null };
}

// Atualizar pedido
export async function updatePedido(id: string, updates: Partial<PedidoDB>): Promise<{ data: PedidoDB | null; error: string | null }> {
  const { data, error } = await supabase
    .from("pedidos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PEDIDOS] Erro ao atualizar:", error.message);
    await logAction({ action: "update", entity: "pedidos", entity_id: id, status: "error", details: { error: error.message, updates } });
    return { data: null, error: error.message };
  }

  console.log("[PEDIDOS] ✅ Pedido atualizado:", data.codigo);
  await logAction({ action: "update", entity: "pedidos", entity_id: id, status: "success", details: { codigo: data.codigo } });
  return { data: data as PedidoDB, error: null };
}

// Deletar pedido
export async function deletePedido(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("pedidos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[PEDIDOS] Erro ao deletar:", error.message);
    await logAction({ action: "delete", entity: "pedidos", entity_id: id, status: "error", details: { error: error.message } });
    return { error: error.message };
  }

  console.log("[PEDIDOS] ✅ Pedido deletado:", id);
  await logAction({ action: "delete", entity: "pedidos", entity_id: id, status: "success" });
  return { error: null };
}

// Testar conexão com banco
export async function testConnection(): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    const { error } = await supabase.from("pedidos").select("id").limit(1);
    const latency = Date.now() - start;
    if (error) {
      return { ok: false, latency, error: error.message };
    }
    return { ok: true, latency };
  } catch (e: any) {
    return { ok: false, latency: Date.now() - start, error: e.message };
  }
}

// Buscar logs de diagnóstico
export async function fetchActionLogs(limit = 5): Promise<{ data: any[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("action_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// Buscar últimos erros
export async function fetchErrorLogs(limit = 5): Promise<{ data: any[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("action_logs")
    .select("*")
    .eq("status", "error")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
