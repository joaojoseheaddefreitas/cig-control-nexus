import { supabase } from "@/integrations/supabase/client";

/**
 * Print a Pedido with all commercial details.
 */
export async function imprimirPedido(pedidoId: string) {
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .single();

  if (!pedido) return;

  const { data: itens } = await supabase
    .from("itens_pedido")
    .select("*")
    .eq("pedido_id", pedidoId)
    .order("created_at");

  const rows = (itens || [])
    .map(
      (i, idx) =>
        `<tr>
          <td style="padding:6px 10px;border:1px solid #ddd">${idx + 1}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${i.produto_nome}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${i.quantidade}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">R$ ${Number(i.valor_unitario).toFixed(2)}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">R$ ${(Number(i.quantidade) * Number(i.valor_unitario)).toFixed(2)}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${Number(i.tempo_unitario).toFixed(1)}h</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${(Number(i.quantidade) * Number(i.tempo_unitario)).toFixed(1)}h</td>
        </tr>`
    )
    .join("");

  const html = `
    <html><head><title>Pedido ${pedido.codigo}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .meta { display: flex; gap: 30px; margin: 16px 0; font-size: 13px; color: #555; }
      .meta div { display: flex; flex-direction: column; }
      .meta span:first-child { font-weight: bold; color: #333; font-size: 11px; text-transform: uppercase; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
      th { background: #f5f5f5; padding: 8px 10px; border: 1px solid #ddd; text-align: left; font-size: 11px; text-transform: uppercase; }
      .total-row { font-weight: bold; background: #f9f9f9; }
      .footer { margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
      @media print { body { padding: 10px; } }
    </style></head><body>
    <h1>PEDIDO Nº ${pedido.codigo}</h1>
    <div class="meta">
      <div><span>Cliente</span>${pedido.cliente}</div>
      <div><span>Canal</span>${pedido.canal || '—'}</div>
      <div><span>Data Entrada</span>${pedido.data_entrada ? new Date(pedido.data_entrada).toLocaleDateString('pt-BR') : '—'}</div>
      <div><span>Prazo Entrega</span>${pedido.prazo_entrega ? new Date(pedido.prazo_entrega).toLocaleDateString('pt-BR') : '—'}</div>
      <div><span>Margem</span>${Number(pedido.margem)}%</div>
      <div><span>Status</span>${pedido.status}</div>
    </div>
    ${pedido.observacoes ? `<p style="font-size:12px;color:#666"><strong>Obs:</strong> ${pedido.observacoes}</p>` : ''}
    <table>
      <thead><tr>
        <th>#</th><th>Produto</th><th style="text-align:center">Qtd</th>
        <th style="text-align:right">Vlr Unit.</th><th style="text-align:right">Vlr Total</th>
        <th style="text-align:center">Tempo Unit.</th><th style="text-align:center">Tempo Total</th>
      </tr></thead>
      <tbody>${rows}
        <tr class="total-row">
          <td colspan="4" style="padding:8px 10px;border:1px solid #ddd;text-align:right">TOTAL</td>
          <td style="padding:8px 10px;border:1px solid #ddd;text-align:right">R$ ${Number(pedido.valor_total).toFixed(2)}</td>
          <td colspan="2" style="padding:8px 10px;border:1px solid #ddd;text-align:center">
            ${(itens || []).reduce((s, i) => s + Number(i.quantidade) * Number(i.tempo_unitario), 0).toFixed(1)}h
          </td>
        </tr>
      </tbody>
    </table>
    <div class="footer">Impresso em ${new Date().toLocaleString('pt-BR')} | Sistema Industrial</div>
    </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}

/**
 * Print an OP with complete production-optimized layout.
 * Includes: Title, Código do Pedido, Observações, Barcode/QR area, Logo area.
 */
export async function imprimirOP(opId: string) {
  const { data: op } = await supabase
    .from("ops")
    .select("*")
    .eq("id", opId)
    .single();

  if (!op) return;

  // Get pedido info for código do pedido
  let codigoPedido = '—';
  let clienteNome = '—';
  let observacoesPedido = '';
  if (op.pedido_id) {
    const { data: pedido } = await supabase
      .from("pedidos")
      .select("codigo, cliente, observacoes")
      .eq("id", op.pedido_id)
      .single();
    if (pedido) {
      codigoPedido = pedido.codigo;
      clienteNome = pedido.cliente;
      observacoesPedido = pedido.observacoes || '';
    }
  }

  // Get route steps
  const { data: routeSteps } = await supabase
    .from("op_route_steps")
    .select("*, setores_produtivos(nome)")
    .eq("op_id", opId)
    .order("ordem");

  const setoresRows = (routeSteps || [])
    .map(
      (step, idx) =>
        `<tr>
          <td style="padding:6px 10px;border:1px solid #ddd">${idx + 1}</td>
          <td style="padding:6px 10px;border:1px solid #ddd">${(step as any).setores_produtivos?.nome || '—'}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">${Number(step.tempo_estimado).toFixed(1)}h</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">☐</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:center">☐</td>
        </tr>`
    )
    .join("");

  const allObservacoes = [observacoesPedido, op.observacoes].filter(Boolean).join(' | ');

  const html = `
    <html><head><title>OP ${op.numero_op}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
      .op-title { text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 2px; margin-bottom: 4px; border-bottom: 3px solid #333; padding-bottom: 8px; }
      .op-subtitle { text-align: center; font-size: 12px; color: #666; margin-bottom: 20px; }
      .op-header { display: flex; justify-content: space-between; align-items: flex-start; border: 2px solid #333; padding: 16px; margin: 16px 0; }
      .op-header .left { flex: 1; }
      .op-header .right { text-align: right; min-width: 200px; }
      .field { margin: 6px 0; font-size: 13px; }
      .field .label { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #666; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
      th { background: #f5f5f5; padding: 8px 10px; border: 1px solid #ddd; text-align: left; font-size: 11px; text-transform: uppercase; }
      .obs { margin-top: 16px; padding: 10px; border: 1px dashed #999; font-size: 12px; min-height: 60px; }
      .barcode-area { margin-top: 20px; border: 2px dashed #ccc; padding: 20px; text-align: center; min-height: 80px; }
      .barcode-area span { color: #999; font-size: 11px; text-transform: uppercase; }
      .logo-area { position: absolute; top: 20px; right: 30px; width: 120px; height: 60px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; }
      .logo-area span { color: #bbb; font-size: 9px; text-transform: uppercase; }
      .footer { margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
      @media print { body { padding: 10px; } .logo-area { border: 1px dashed #ddd; } }
    </style></head><body>
    <div style="position: relative;">
      <div class="logo-area"><span>Logotipo da Fábrica</span></div>
      <div class="op-title">ORDEM DE PRODUÇÃO</div>
      <div class="op-subtitle">OP Nº ${op.numero_op}</div>
    </div>
    <div class="op-header">
      <div class="left">
        <div class="field"><span class="label">Código do Pedido</span><br/><strong style="font-size:16px">${codigoPedido}</strong></div>
        <div class="field"><span class="label">Cliente</span><br/>${clienteNome}</div>
        <div class="field"><span class="label">Produto</span><br/>${op.produto_nome}</div>
        <div class="field"><span class="label">Quantidade</span><br/>${op.quantidade}</div>
      </div>
      <div class="right">
        <div class="field"><span class="label">Nº OP</span><br/><strong style="font-size:18px">${op.numero_op}</strong></div>
        <div class="field"><span class="label">Tempo Unitário</span><br/>${Number(op.tempo_unitario).toFixed(1)}h</div>
        <div class="field"><span class="label">Tempo Total</span><br/>${(Number(op.quantidade) * Number(op.tempo_unitario)).toFixed(1)}h</div>
        <div class="field"><span class="label">Prazo Entrega</span><br/>${op.prazo_entrega ? new Date(op.prazo_entrega).toLocaleDateString('pt-BR') : '—'}</div>
        <div class="field"><span class="label">Status</span><br/>${op.status_producao}</div>
      </div>
    </div>

    ${allObservacoes ? `<div class="obs"><strong>Observações:</strong> ${allObservacoes}</div>` : '<div class="obs"><strong>Observações:</strong> <span style="color:#ccc">Nenhuma observação registrada</span></div>'}

    <h3 style="margin-top:20px;font-size:14px">ROTEIRO DE PRODUÇÃO</h3>
    <table>
      <thead><tr>
        <th>#</th><th>Setor</th><th style="text-align:center">Tempo Est.</th>
        <th style="text-align:center">Entrada</th><th style="text-align:center">Baixa</th>
      </tr></thead>
      <tbody>${setoresRows || '<tr><td colspan="5" style="padding:8px;text-align:center">Sem setores definidos</td></tr>'}</tbody>
    </table>

    <div class="barcode-area">
      <span>Área reservada para Código de Barras / QR Code</span>
      <div style="margin-top:8px;font-family:monospace;font-size:16px;letter-spacing:4px">${op.numero_op}</div>
    </div>

    <div class="footer">Impresso em ${new Date().toLocaleString('pt-BR')} | Sistema Industrial</div>
    </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}
