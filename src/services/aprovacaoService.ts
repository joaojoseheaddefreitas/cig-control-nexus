import { supabase } from "@/integrations/supabase/client";
import {
  fetchConfigCapacidade,
  fetchCargaCarteira,
  calcularDiasProducao,
  calcularDataEntrega,
} from "./capacidadeService";

interface ItemPedido {
  produto_nome: string;
  produto_id?: string;
  quantidade: number;
  tempo_unitario: number;
  valor_unitario: number;
  observacoes?: string;
}

/**
 * Approve a pedido:
 * 1. Insert itens_pedido
 * 2. Create familia_op
 * 3. Create 1 OP per item
 * 4. Calculate prazo from finite capacity
 * 5. Update pedido status + prazo
 */
export async function aprovarPedido(
  pedidoId: string,
  itens: ItemPedido[]
): Promise<{ error: string | null; familiaNumero?: string; prazoEntrega?: string }> {
  try {
    // 1. Fetch capacity config
    const config = await fetchConfigCapacidade();
    const cargaCarteira = await fetchCargaCarteira();

    // 2. Calculate total hours for new order
    const cargaNovoPedido = itens.reduce((sum, item) => {
      const tempo = (item.quantidade || 0) * (item.tempo_unitario || 0);
      return sum + (isNaN(tempo) ? 0 : tempo);
    }, 0);

    // 3. Calculate deadline
    const cargaTotal = cargaCarteira + cargaNovoPedido;
    const diasProducao = calcularDiasProducao(cargaTotal, config.capacidade_produtiva_diaria);
    const dataEntrega = calcularDataEntrega(new Date(), diasProducao, config.considerar_sabado);
    const prazoEntregaStr = dataEntrega.toISOString().split("T")[0];

    // 4. Insert itens_pedido
    const itensToInsert = itens.map((item) => ({
      pedido_id: pedidoId,
      produto_nome: item.produto_nome,
      produto_id: item.produto_id || null,
      quantidade: item.quantidade,
      tempo_unitario: item.tempo_unitario,
      valor_unitario: item.valor_unitario,
      tempo_total: item.quantidade * item.tempo_unitario,
      valor_total: item.quantidade * item.valor_unitario,
      observacoes: item.observacoes || null,
    }));

    const { data: insertedItens, error: itensError } = await supabase
      .from("itens_pedido")
      .insert(itensToInsert)
      .select();

    if (itensError || !insertedItens) {
      return { error: `Erro ao inserir itens: ${itensError?.message}` };
    }

    // 5. Get pedido codigo for OP numbering
    const { data: pedidoData, error: pedidoFetchError } = await supabase
      .from("pedidos")
      .select("codigo")
      .eq("id", pedidoId)
      .single();

    if (pedidoFetchError || !pedidoData) {
      return { error: `Erro ao buscar pedido: ${pedidoFetchError?.message}` };
    }

    const codigoPedido = pedidoData.codigo;

    // 6. Generate familia_op number (sequential)
    const { data: familiaNumData, error: familiaNumError } = await supabase
      .rpc("gerar_numero_familia");

    if (familiaNumError || !familiaNumData) {
      return { error: `Erro ao gerar número família: ${familiaNumError?.message}` };
    }

    const numeroFamilia = familiaNumData as string;

    // 7. Create familia_op
    const { data: familia, error: familiaError } = await supabase
      .from("familia_op")
      .insert({
        numero_familia: codigoPedido,
        pedido_id: pedidoId,
        total_ops: insertedItens.length,
        tempo_total_familia: cargaNovoPedido,
        status: "aberta",
      })
      .select()
      .single();

    if (familiaError || !familia) {
      return { error: `Erro ao criar família OP: ${familiaError?.message}` };
    }

    // 8. Create 1 OP per item — numbering: {codigo}-01, {codigo}-02
    const opsToInsert = insertedItens.map((item, idx) => ({
      familia_op_id: familia.id,
      item_pedido_id: item.id,
      numero_op: `${codigoPedido}-${String(idx + 1).padStart(2, '0')}`,
      produto_nome: item.produto_nome,
      quantidade: item.quantidade,
      tempo_unitario: Number(item.tempo_unitario),
      tempo_total: Number(item.tempo_total) || item.quantidade * Number(item.tempo_unitario),
      prazo_entrega: prazoEntregaStr,
      status_producao: "aguardando",
      status_faturamento: "pendente",
    }));

    const { error: opsError } = await supabase.from("ops").insert(opsToInsert);

    if (opsError) {
      return { error: `Erro ao criar OPs: ${opsError.message}` };
    }

    // 9. Update pedido
    const { error: pedidoError } = await supabase
      .from("pedidos")
      .update({
        status: "programado",
        status_producao: "programado",
        prazo_entrega: prazoEntregaStr,
        prazo_calculado_dias: diasProducao,
        op: codigoPedido,
      })
      .eq("id", pedidoId);

    if (pedidoError) {
      return { error: `Erro ao atualizar pedido: ${pedidoError.message}` };
    }

    // 10. Log action
    await supabase.from("action_logs").insert({
      action: "aprovar_pedido",
      entity: "pedidos",
      entity_id: pedidoId,
      status: "success",
      details: {
        familia: codigoPedido,
        total_ops: insertedItens.length,
        carga_horas: cargaNovoPedido,
        prazo_dias: diasProducao,
        prazo_entrega: prazoEntregaStr,
      } as any,
    });

    return { error: null, familiaNumero: codigoPedido, prazoEntrega: prazoEntregaStr };
  } catch (e: any) {
    return { error: e.message || "Erro desconhecido na aprovação" };
  }
}
