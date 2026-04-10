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

export async function criarPedidoCompra(pedido: Partial<PedidoCompra>): Promise<{ error: string | null; id?: string }> {
  const valorTotal = (pedido.quantidade || 0) * (pedido.valor_unitario || 0);
  const dataPrevisao = pedido.data_previsao || null;

  const { data, error } = await (supabase as any)
    .from("pedidos_compra")
    .insert({
      fornecedor_id: pedido.fornecedor_id || null,
      fornecedor_nome: pedido.fornecedor_nome || '',
      material_id: pedido.material_id || null,
      material_nome: pedido.material_nome || '',
      quantidade: pedido.quantidade || 0,
      valor_unitario: pedido.valor_unitario || 0,
      valor_total: valorTotal,
      status: pedido.status || 'emitido',
      data_emissao: pedido.data_emissao || new Date().toISOString().split('T')[0],
      data_previsao: dataPrevisao,
      observacoes: pedido.observacoes || null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  // Auto-generate contas_pagar (previsão)
  if (data?.id) {
    await (supabase as any).from("contas_pagar").insert({
      descricao: `PC ${pedido.material_nome || ''} - ${pedido.fornecedor_nome || ''}`,
      valor: valorTotal,
      data_vencimento: dataPrevisao || new Date().toISOString().split('T')[0],
      status: 'pendente',
      categoria: 'materiais',
      fornecedor_id: pedido.fornecedor_id || null,
    });
  }

  return { error: null, id: data?.id };
}

export async function atualizarStatusPedidoCompra(
  id: string,
  status: string,
  extras?: {
    data_recebimento?: string;
    quantidade_recebida?: number;
    nota_fiscal?: string;
    on_time?: boolean;
    in_full?: boolean;
  }
): Promise<{ error: string | null }> {
  // Get current PO data before update
  const { data: pcData } = await (supabase as any)
    .from("pedidos_compra")
    .select("*")
    .eq("id", id)
    .single();

  if (!pcData) return { error: "Pedido não encontrado" };

  // === REGRA DE BLOQUEIO: recebimento > 110% do pedido ===
  if (status === 'recebido' && extras?.quantidade_recebida) {
    const limiteMaximo = Number(pcData.quantidade) * 1.10;
    const totalRecebido = Number(pcData.quantidade_recebida) + extras.quantidade_recebida;
    if (totalRecebido > limiteMaximo) {
      return { error: `Bloqueado: quantidade recebida (${totalRecebido}) excede 110% do pedido (${limiteMaximo.toFixed(0)}). Máximo permitido: ${(limiteMaximo - Number(pcData.quantidade_recebida)).toFixed(0)} unidades.` };
    }
  }

  const update: any = { status };
  if (extras) Object.assign(update, extras);
  const { error } = await (supabase as any)
    .from("pedidos_compra")
    .update(update)
    .eq("id", id);
  if (error) return { error: error.message };

  // === AUTO-INTEGRATION: When received, update estoque + financeiro ===
  if (status === 'recebido' && pcData) {
    const qtdRecebida = extras?.quantidade_recebida || pcData.quantidade;
    const valorUnit = pcData.valor_unitario;

    // 1. Create stock entry movement (movimentacoes_materiais)
    if (pcData.material_id) {
      await (supabase as any).from("movimentacoes_materiais").insert({
        material_id: pcData.material_id,
        tipo: "entrada",
        quantidade: qtdRecebida,
        valor_total: qtdRecebida * valorUnit,
        nota_fiscal: extras?.nota_fiscal || null,
        motivo: `Recebimento PC - ${pcData.fornecedor_nome}`,
        usuario: "Sistema",
      });

      // 2. Update material stock
      const { data: mat } = await (supabase as any)
        .from("materiais")
        .select("estoque_atual")
        .eq("id", pcData.material_id)
        .single();

      if (mat) {
        await (supabase as any)
          .from("materiais")
          .update({
            estoque_atual: Number(mat.estoque_atual) + qtdRecebida,
            ultima_entrada: extras?.data_recebimento || new Date().toISOString().split('T')[0],
          })
          .eq("id", pcData.material_id);
      }
    }

    // 3. Log
    await supabase.from("action_logs").insert({
      action: "recebimento_compra",
      entity: "pedidos_compra",
      entity_id: id,
      status: "success",
      details: { quantidade: qtdRecebida, fornecedor: pcData.fornecedor_nome, material: pcData.material_nome } as any,
    });
  }

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
