import { supabase } from "@/integrations/supabase/client";

export interface Carga {
  id: string;
  data_emissao: string;
  status: string;
  modo: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SetorCapacidade {
  id: string;
  nome: string;
  ordem: number;
  mao_de_obra: number;
  maquinas_automaticas: number;
  horas_turno: number;
  eficiencia: number;
}

export interface GargaloResult {
  setor_id: string;
  setor_nome: string;
  horas_necessarias: number;
  capacidade_liquida: number;
  percentual: number; // 0-100+
}

/**
 * Fetch all cargas ordered by date.
 */
export async function fetchCargas(): Promise<Carga[]> {
  const { data, error } = await supabase
    .from("cargas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Carga[];
}

/**
 * Fetch active carga (EM_EXECUCAO or latest PLANEJADA).
 */
export async function fetchCargaAtiva(): Promise<Carga | null> {
  const { data } = await supabase
    .from("cargas")
    .select("*")
    .eq("status", "EM_EXECUCAO")
    .limit(1)
    .maybeSingle();
  if (data) return data as Carga;

  const { data: planejada } = await supabase
    .from("cargas")
    .select("*")
    .eq("status", "PLANEJADA")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return planejada as Carga | null;
}

/**
 * Calculate bottleneck analysis for selected OPs.
 */
export async function calcularGargalo(opIds: string[]): Promise<GargaloResult[]> {
  if (opIds.length === 0) return [];

  // Get sectors with capacity
  const { data: setores } = await supabase
    .from("setores_produtivos")
    .select("*")
    .eq("ativo", true)
    .order("ordem");
  if (!setores) return [];

  // Get route steps for selected OPs
  const { data: steps } = await supabase
    .from("op_route_steps")
    .select("op_id, setor_id, tempo_estimado")
    .in("op_id", opIds);

  // Get OP quantities
  const { data: ops } = await supabase
    .from("ops")
    .select("id, quantidade")
    .in("id", opIds);

  const qtyMap: Record<string, number> = {};
  (ops || []).forEach((op) => { qtyMap[op.id] = op.quantidade; });

  return (setores as SetorCapacidade[]).map((setor) => {
    const setorSteps = (steps || []).filter((s) => s.setor_id === setor.id);
    const horas = setorSteps.reduce((sum, s) => {
      const qty = qtyMap[s.op_id] || 1;
      return sum + Number(s.tempo_estimado) * qty;
    }, 0);
    const capacidade = (setor.mao_de_obra + setor.maquinas_automaticas) * setor.horas_turno * setor.eficiencia;
    return {
      setor_id: setor.id,
      setor_nome: setor.nome,
      horas_necessarias: horas,
      capacidade_liquida: capacidade,
      percentual: capacidade > 0 ? (horas / capacidade) * 100 : 0,
    };
  }).filter((g) => g.horas_necessarias > 0);
}

/**
 * Emit a new carga (manual mode).
 */
export async function emitirCargaManual(opIds: string[]): Promise<{ error: string | null; cargaId?: string }> {
  if (opIds.length === 0) return { error: "Selecione ao menos uma OP" };

  // Create carga
  const { data: carga, error: cargaErr } = await supabase
    .from("cargas")
    .insert({ modo: "manual", status: "PLANEJADA" })
    .select("id")
    .single();
  if (cargaErr || !carga) return { error: cargaErr?.message || "Erro ao criar carga" };

  // Link OPs
  const { error: linkErr } = await supabase
    .from("ops")
    .update({ carga_id: carga.id } as any)
    .in("id", opIds);
  if (linkErr) return { error: linkErr.message };

  // Log
  await supabase.from("action_logs").insert({
    action: "carga_emitida",
    entity: "cargas",
    entity_id: carga.id,
    status: "success",
    details: { modo: "manual", ops_count: opIds.length } as any,
  });

  return { error: null, cargaId: carga.id };
}

/**
 * Emit auto carga: pick pending OPs by priority/prazo.
 */
export async function emitirCargaAutomatica(): Promise<{ error: string | null; cargaId?: string; opsCount?: number }> {
  // Get pending OPs (no carga_id, not finalized)
  const { data: ops } = await supabase
    .from("ops")
    .select("id, tempo_total, prazo_entrega")
    .is("carga_id", null)
    .neq("status_producao", "Producao Finalizada")
    .order("prazo_entrega", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (!ops || ops.length === 0) return { error: "Nenhuma OP pendente disponível" };

  // Get capacity (daily)
  const { data: setores } = await supabase
    .from("setores_produtivos")
    .select("*")
    .eq("ativo", true);

  const capacidades = (setores || []).map((s: any) => ({
    id: s.id,
    cap: (s.mao_de_obra + s.maquinas_automaticas) * s.horas_turno * s.eficiencia,
  }));
  const minCap = capacidades.length > 0 ? Math.min(...capacidades.map((c) => c.cap)) : 8;

  // Select OPs until bottleneck capacity is reached
  let horasAcumuladas = 0;
  const selectedIds: string[] = [];
  for (const op of ops) {
    const horas = Number(op.tempo_total) || 0;
    if (horasAcumuladas + horas > minCap && selectedIds.length > 0) break;
    selectedIds.push(op.id);
    horasAcumuladas += horas;
  }

  if (selectedIds.length === 0) return { error: "Nenhuma OP cabe na capacidade disponível" };

  const result = await emitirCargaManual(selectedIds);
  if (result.error) return { error: result.error };

  // Update modo to auto
  if (result.cargaId) {
    await supabase.from("cargas").update({ modo: "automatico" } as any).eq("id", result.cargaId);
  }

  return { error: null, cargaId: result.cargaId, opsCount: selectedIds.length };
}

/**
 * Check and update carga status based on sector tracking.
 * Called after each setor_rastreamento update.
 */
export async function atualizarStatusCarga(opId: string): Promise<void> {
  // Get the OP's carga_id
  const { data: op } = await supabase
    .from("ops")
    .select("carga_id")
    .eq("id", opId)
    .single();
  if (!op?.carga_id) return;

  const cargaId = op.carga_id;

  // Get all OPs in this carga
  const { data: opsInCarga } = await supabase
    .from("ops")
    .select("id")
    .eq("carga_id", cargaId);
  if (!opsInCarga || opsInCarga.length === 0) return;

  const opIds = opsInCarga.map((o) => o.id);

  // Get first sector (by ordem)
  const { data: firstSetor } = await supabase
    .from("setores_produtivos")
    .select("id")
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .limit(1)
    .single();
  if (!firstSetor) return;

  // Get tracking for first sector for all OPs in carga
  const { data: tracking } = await supabase
    .from("setor_rastreamento")
    .select("op_id, status")
    .eq("setor_id", firstSetor.id)
    .in("op_id", opIds);

  const trackMap: Record<string, string> = {};
  (tracking || []).forEach((t) => { trackMap[t.op_id] = t.status; });

  // Check if at least one has entrada/baixa → EM_EXECUCAO
  const anyStarted = opIds.some((id) => trackMap[id] === "entrada" || trackMap[id] === "baixa");
  // Check if all have baixa → FINALIZADA
  const allBaixaFirstSector = opIds.every((id) => trackMap[id] === "baixa");

  const { data: carga } = await supabase.from("cargas").select("status").eq("id", cargaId).single();
  if (!carga) return;

  if (allBaixaFirstSector && carga.status !== "FINALIZADA") {
    await supabase.from("cargas").update({ status: "FINALIZADA" } as any).eq("id", cargaId);
    // Auto-release next PLANEJADA
    const { data: next } = await supabase
      .from("cargas")
      .select("id")
      .eq("status", "PLANEJADA")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase.from("action_logs").insert({
        action: "carga_auto_liberada",
        entity: "cargas",
        entity_id: next.id,
        status: "success",
      });
    }
  } else if (anyStarted && carga.status === "PLANEJADA") {
    await supabase.from("cargas").update({ status: "EM_EXECUCAO" } as any).eq("id", cargaId);
  }
}

/**
 * Print a specific carga - only its OPs grouped by sector.
 */
export async function imprimirCarga(cargaId: string): Promise<void> {
  const { data: carga } = await supabase.from("cargas").select("*").eq("id", cargaId).single();
  if (!carga) return;

  const { data: ops } = await supabase
    .from("ops")
    .select("*")
    .eq("carga_id", cargaId)
    .order("sequencia_fila");
  if (!ops || ops.length === 0) return;

  const { data: setores } = await supabase
    .from("setores_produtivos")
    .select("*")
    .eq("ativo", true)
    .order("ordem");

  const { data: steps } = await supabase
    .from("op_route_steps")
    .select("*")
    .in("op_id", ops.map((o) => o.id));

  let setorBlocks = "";
  (setores || []).forEach((setor: any) => {
    const setorSteps = (steps || []).filter((s: any) => s.setor_id === setor.id);
    if (setorSteps.length === 0) return;
    const opIds = setorSteps.map((s: any) => s.op_id);
    const setorOps = ops.filter((o) => opIds.includes(o.id));
    const totalHoras = setorSteps.reduce((s: number, st: any) => s + Number(st.tempo_estimado), 0);

    const rows = setorOps.map((op) => {
      const step = setorSteps.find((s: any) => s.op_id === op.id);
      return `<tr>
        <td style="padding:4px 8px;border:1px solid #ddd;font-family:monospace">${op.numero_op}</td>
        <td style="padding:4px 8px;border:1px solid #ddd">${op.produto_nome}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${op.quantidade}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${Number(step?.tempo_estimado || 0).toFixed(1)}h</td>
      </tr>`;
    }).join("");

    setorBlocks += `
      <h3 style="margin-top:20px;font-size:14px;border-bottom:2px solid #333;padding-bottom:4px">
        ${setor.nome} — Total: ${totalHoras.toFixed(1)}h
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
        <thead><tr style="background:#f5f5f5">
          <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">OP</th>
          <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Produto</th>
          <th style="padding:6px 8px;border:1px solid #ddd;text-align:center">Qtd</th>
          <th style="padding:6px 8px;border:1px solid #ddd;text-align:center">Tempo</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  });

  const html = `<html><head><title>Carga ${(carga as any).data_emissao}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
      .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
      .footer { margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
      @media print { body { padding: 10px; } }
    </style></head><body>
    <div class="header">
      <h1 style="font-size:22px;margin:0">CARGA DIÁRIA</h1>
      <p style="font-size:13px;color:#666;margin:4px 0">
        Data: ${new Date((carga as any).data_emissao).toLocaleDateString('pt-BR')} | 
        Status: ${(carga as any).status} | 
        Modo: ${(carga as any).modo} |
        OPs: ${ops.length}
      </p>
    </div>
    ${setorBlocks}
    <div class="footer">Impresso em ${new Date().toLocaleString('pt-BR')} | Sistema Industrial</div>
    </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}
