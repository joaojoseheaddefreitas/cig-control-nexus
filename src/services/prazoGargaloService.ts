/**
 * PRAZO POR GARGALO — Cálculo de prazo de entrega baseado
 * exclusivamente no setor gargalo (menor capacidade disponível).
 *
 * Regra (não altera estrutura/PCP/capacidades existentes):
 *
 *   1) Gargalo = setor com MAIOR ocupação % (menor capacidade disponível)
 *   2) Fila do gargalo (h) = somatório das horas pendentes do gargalo
 *   3) Carga do novo pedido no gargalo (h) = Σ (qtd_item × tempo_item_no_gargalo)
 *   4) Prazo (dias úteis) = ⌈(Fila + Carga novo pedido) / cap. diária do gargalo⌉
 *   5) Data prometida = Data atual + Prazo (somente dias úteis)
 *
 * Não é limitado a 22 dias. Se a fila aumentar, o prazo aumenta.
 */
import { supabase } from "@/integrations/supabase/client";
import { calcularCapacidadeFabrica, type SetorCapacidade } from "./capacidadeIndustrialService";
import { calcularDataEntrega } from "./capacidadeService";

export interface PrazoGargaloResult {
  setorGargalo: string;
  setorGargaloId: string | null;
  filaGargaloHoras: number;        // horas já em fila no gargalo
  cargaNovoPedidoHoras: number;    // horas do novo pedido no gargalo
  totalHorasGargalo: number;       // fila + novo pedido
  capacidadeDiariaGargalo: number; // h/dia do gargalo
  prazoDiasUteis: number;          // resultado contínuo (não limitado)
  dataPrometida: Date;
}

export type PedidoStatus = "NO_PRAZO" | "VAI_ATRASAR" | "EM_ATRASO";

export interface StatusPedido {
  status: PedidoStatus;
  diasDiferenca: number; // negativo = adiantado / 0 = no prazo / positivo = atrasado
  label: string;
}

/**
 * Identifica o gargalo e calcula o prazo somente pelo gargalo.
 * Aceita itens do novo pedido (opcional). Se vazio, retorna o
 * prazo da fila atual (útil para previsão geral de vendas).
 */
export async function calcularPrazoPorGargalo(
  itensNovoPedido: Array<{ produto_id?: string | null; produto_nome?: string; quantidade: number }> = [],
  considerarSabado: boolean = false
): Promise<PrazoGargaloResult> {
  const cap = await calcularCapacidadeFabrica();

  // Setor gargalo = MAIOR carga_percent (menor capacidade disponível)
  const gargalo: SetorCapacidade | undefined = cap.setores.length
    ? cap.setores.reduce((g, s) => (s.carga_percent > g.carga_percent ? s : g), cap.setores[0])
    : undefined;

  if (!gargalo) {
    return {
      setorGargalo: "N/A",
      setorGargaloId: null,
      filaGargaloHoras: 0,
      cargaNovoPedidoHoras: 0,
      totalHorasGargalo: 0,
      capacidadeDiariaGargalo: 0,
      prazoDiasUteis: 0,
      dataPrometida: new Date(),
    };
  }

  const filaGargaloHoras = gargalo.horas_ocupadas;

  // Carga do novo pedido SOMENTE no gargalo
  let cargaNovoPedidoHoras = 0;
  if (itensNovoPedido.length > 0) {
    const produtoIds = itensNovoPedido.map(i => i.produto_id).filter(Boolean) as string[];
    const produtoNomes = itensNovoPedido.map(i => i.produto_nome).filter(Boolean) as string[];

    // Mapa produto_id -> tempo no setor gargalo
    const tempoPorProduto = new Map<string, number>();

    if (produtoIds.length > 0) {
      const { data: pst } = await supabase
        .from("produto_setor_tempos")
        .select("produto_id, tempo_horas")
        .eq("setor_id", gargalo.id)
        .in("produto_id", produtoIds);
      for (const r of pst || []) {
        tempoPorProduto.set(r.produto_id, Number(r.tempo_horas) || 0);
      }
    }

    // Resolver por nome quando faltar id
    const nomeParaId = new Map<string, string>();
    if (produtoNomes.length > 0) {
      const { data: prods } = await supabase
        .from("produtos")
        .select("id, nome")
        .in("nome", produtoNomes);
      for (const p of prods || []) nomeParaId.set(p.nome, p.id);

      const idsExtras = Array.from(nomeParaId.values()).filter(id => !tempoPorProduto.has(id));
      if (idsExtras.length > 0) {
        const { data: pst2 } = await supabase
          .from("produto_setor_tempos")
          .select("produto_id, tempo_horas")
          .eq("setor_id", gargalo.id)
          .in("produto_id", idsExtras);
        for (const r of pst2 || []) {
          tempoPorProduto.set(r.produto_id, Number(r.tempo_horas) || 0);
        }
      }
    }

    for (const item of itensNovoPedido) {
      const pid = item.produto_id || (item.produto_nome ? nomeParaId.get(item.produto_nome) : undefined);
      const tempo = pid ? (tempoPorProduto.get(pid) || 0) : 0;
      cargaNovoPedidoHoras += (Number(item.quantidade) || 0) * tempo;
    }
  }

  const totalHorasGargalo = filaGargaloHoras + cargaNovoPedidoHoras;
  const capDia = gargalo.capDiaria > 0 ? gargalo.capDiaria : 1;
  const prazoDiasUteis = Math.max(1, Math.ceil(totalHorasGargalo / capDia));
  const dataPrometida = calcularDataEntrega(new Date(), prazoDiasUteis, considerarSabado);

  console.log(
    `[PrazoGargalo] Setor: ${gargalo.nome} | Fila: ${filaGargaloHoras.toFixed(1)}h | ` +
    `Novo: ${cargaNovoPedidoHoras.toFixed(1)}h | Total: ${totalHorasGargalo.toFixed(1)}h | ` +
    `Cap/dia: ${capDia.toFixed(1)}h | Prazo: ${prazoDiasUteis} d.ú.`
  );

  return {
    setorGargalo: gargalo.nome,
    setorGargaloId: gargalo.id,
    filaGargaloHoras,
    cargaNovoPedidoHoras,
    totalHorasGargalo,
    capacidadeDiariaGargalo: capDia,
    prazoDiasUteis,
    dataPrometida,
  };
}

/**
 * Diferença em dias úteis (positivo = b após a).
 */
function diffDiasUteis(a: Date, b: Date, considerarSabado = false): number {
  const sign = b.getTime() >= a.getTime() ? 1 : -1;
  const start = sign > 0 ? new Date(a) : new Date(b);
  const end = sign > 0 ? new Date(b) : new Date(a);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow === 0) continue;
    if (dow === 6 && !considerarSabado) continue;
    count++;
  }
  return sign * count;
}

/**
 * Status do pedido para vendas.
 *  NO_PRAZO     → previsão ≤ data prometida e hoje ≤ prometida
 *  VAI_ATRASAR  → previsão > data prometida, mas hoje ainda ≤ prometida
 *  EM_ATRASO    → hoje > data prometida
 */
export function avaliarStatusPedido(
  dataPrometida: Date,
  novaPrevisao: Date,
  hoje: Date = new Date()
): StatusPedido {
  const prom = new Date(dataPrometida); prom.setHours(0,0,0,0);
  const prev = new Date(novaPrevisao);  prev.setHours(0,0,0,0);
  const today = new Date(hoje);         today.setHours(0,0,0,0);

  if (today.getTime() > prom.getTime()) {
    const dias = diffDiasUteis(prom, today);
    return { status: "EM_ATRASO", diasDiferenca: dias, label: `EM ATRASO (${dias} d.ú.)` };
  }
  if (prev.getTime() > prom.getTime()) {
    const dias = diffDiasUteis(prom, prev);
    return { status: "VAI_ATRASAR", diasDiferenca: dias, label: `VAI ATRASAR (+${dias} d.ú.)` };
  }
  return { status: "NO_PRAZO", diasDiferenca: 0, label: "NO PRAZO" };
}
