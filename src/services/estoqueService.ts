import { supabase } from "@/integrations/supabase/client";

export interface Movimentacao {
  id: string;
  produto_id: string;
  tipo: string;
  origem: string;
  quantidade: number;
  usuario: string | null;
  motivo: string | null;
  created_at: string;
}

export interface ProdutoComSaldo {
  id: string;
  nome: string;
  unidade: string;
  saldo: number;
}

/**
 * Fetch all products with calculated balance (entradas - baixas).
 */
export async function fetchProdutosComSaldo(): Promise<ProdutoComSaldo[]> {
  const { data: produtos, error: prodError } = await supabase
    .from("produtos")
    .select("id, nome, unidade")
    .eq("ativo", true)
    .order("nome");

  if (prodError || !produtos) return [];

  const { data: movs } = await supabase
    .from("movimentacoes_estoque")
    .select("produto_id, tipo, quantidade");

  const saldoMap: Record<string, number> = {};
  (movs || []).forEach((m) => {
    if (!saldoMap[m.produto_id]) saldoMap[m.produto_id] = 0;
    if (m.tipo === "entrada") {
      saldoMap[m.produto_id] += m.quantidade;
    } else {
      saldoMap[m.produto_id] -= m.quantidade;
    }
  });

  return produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    unidade: p.unidade,
    saldo: saldoMap[p.id] || 0,
  }));
}

/**
 * Register manual stock entry or exit.
 */
export async function registrarMovimentacao(
  produtoId: string,
  tipo: "entrada" | "baixa",
  quantidade: number,
  motivo: string,
  usuario?: string
): Promise<{ error: string | null }> {
  if (quantidade <= 0) return { error: "Quantidade deve ser maior que zero" };

  const { error } = await supabase.from("movimentacoes_estoque").insert({
    produto_id: produtoId,
    tipo,
    origem: "manual",
    quantidade,
    motivo: motivo || null,
    usuario: usuario || "Admin",
  });

  if (error) return { error: error.message };

  // Log
  await supabase.from("action_logs").insert({
    action: `estoque_${tipo}`,
    entity: "movimentacoes_estoque",
    entity_id: produtoId,
    status: "success",
    details: { tipo, quantidade, motivo } as any,
  });

  return { error: null };
}

/**
 * Fetch recent movements.
 */
export async function fetchMovimentacoes(limit = 20): Promise<Movimentacao[]> {
  const { data, error } = await supabase
    .from("movimentacoes_estoque")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Movimentacao[];
}
