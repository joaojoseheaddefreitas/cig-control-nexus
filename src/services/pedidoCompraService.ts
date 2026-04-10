import { supabase } from "@/integrations/supabase/client";

export interface PedidoCompra {
  id: string;
  fornecedor_id: string | null;
  fornecedor_nome: string;
  material_id: string | null;
  material_nome: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  status: string;
  data_emissao: string;
  data_previsao: string | null;
  data_recebimento: string | null;
  quantidade_recebida: number;
  nota_fiscal: string | null;
  observacoes: string | null;
  on_time: boolean | null;
  in_full: boolean | null;
  created_at: string;
  updated_at: string;
}

export async function fetchPedidosCompra(): Promise<PedidoCompra[]> {
  const { data, error } = await (supabase as any)
    .from("pedidos_compra")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as PedidoCompra[];
}

export async function criarPedidoCompra(pedido: Partial<PedidoCompra>): Promise<{ error: string | null }> {
  const { error } = await (supabase as any)
    .from("pedidos_compra")
    .insert({
      fornecedor_id: pedido.fornecedor_id || null,
      fornecedor_nome: pedido.fornecedor_nome || '',
      material_id: pedido.material_id || null,
      material_nome: pedido.material_nome || '',
      quantidade: pedido.quantidade || 0,
      valor_unitario: pedido.valor_unitario || 0,
      valor_total: (pedido.quantidade || 0) * (pedido.valor_unitario || 0),
      status: pedido.status || 'emitido',
      data_emissao: pedido.data_emissao || new Date().toISOString().split('T')[0],
      data_previsao: pedido.data_previsao || null,
      observacoes: pedido.observacoes || null,
    });
  if (error) return { error: error.message };
  return { error: null };
}

export async function atualizarStatusPedidoCompra(
  id: string,
  status: string,
  extras?: { data_recebimento?: string; quantidade_recebida?: number; nota_fiscal?: string; on_time?: boolean; in_full?: boolean }
): Promise<{ error: string | null }> {
  const update: any = { status };
  if (extras) Object.assign(update, extras);
  const { error } = await (supabase as any)
    .from("pedidos_compra")
    .update(update)
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deletarPedidoCompra(id: string): Promise<{ error: string | null }> {
  const { error } = await (supabase as any)
    .from("pedidos_compra")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}
