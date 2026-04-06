import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Loader2, Search, Factory } from 'lucide-react';

interface SetorDiag {
  id: string;
  nome: string;
  mao_de_obra: number;
  maquinas_automaticas: number;
  horas_turno: number;
  eficiencia: number;
  dias_uteis_mensais: number;
  horas_disponiveis: number;
  horas_ocupadas: number;
  carga_percent: number;
  erros: string[];
}

interface OPsByStatus {
  status: string;
  count: number;
  horas: number;
}

interface DiagData {
  setores: SetorDiag[];
  opsByStatus: OPsByStatus[];
  horasNecessarias: number;
  horasFinalizadasIncluidas: number;
  horasProdutivasTotais: number;
  capacidadeGargalo: number;
  percentualOcupacao: number;
  saldoHoras: number;
  errosGlobais: string[];
  alertas: string[];
}

export function CIPDiagnosticoCapacidade() {
  const [data, setData] = useState<DiagData | null>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);

    // Fetch all data
    const [setoresRes, opsRes, trackRes] = await Promise.all([
      supabase.from("setores_produtivos").select("*").eq("ativo", true).order("ordem"),
      supabase.from("ops").select("id, status_producao, tempo_total, quantidade, tempo_unitario"),
      supabase.from("setor_rastreamento").select("setor_id, op_id, status, ops(quantidade, tempo_unitario)").eq("status", "entrada"),
    ]);

    const setoresDB = setoresRes.data || [];
    const allOps = opsRes.data || [];
    const tracking = trackRes.data || [];

    // --- OPs by status ---
    const statusMap: Record<string, { count: number; horas: number }> = {};
    allOps.forEach((op: any) => {
      const st = op.status_producao || 'desconhecido';
      if (!statusMap[st]) statusMap[st] = { count: 0, horas: 0 };
      statusMap[st].count++;
      statusMap[st].horas += Number(op.tempo_total) || 0;
    });
    const opsByStatus: OPsByStatus[] = Object.entries(statusMap).map(([status, v]) => ({
      status, count: v.count, horas: v.horas,
    }));

    // --- Which OPs should count ---
    const statusExcluidos = ['Producao Finalizada', 'cancelado'];
    const opsAtivas = allOps.filter((op: any) => !statusExcluidos.includes(op.status_producao));
    const opsFinalizadas = allOps.filter((op: any) => op.status_producao === 'Producao Finalizada');

    const horasNecessarias = opsAtivas.reduce((s, op) => s + (Number(op.tempo_total) || 0), 0);
    const horasFinalizadasIncluidas = opsFinalizadas.reduce((s, op) => s + (Number(op.tempo_total) || 0), 0);

    // --- Tracking per sector ---
    const cargaMap: Record<string, number> = {};
    (tracking as any[]).forEach((r: any) => {
      if (!cargaMap[r.setor_id]) cargaMap[r.setor_id] = 0;
      const q = Number(r.ops?.quantidade) || 0;
      const t = Number(r.ops?.tempo_unitario) || 0;
      cargaMap[r.setor_id] += q * t;
    });

    // --- Sector diagnostics ---
    const errosGlobais: string[] = [];
    const alertas: string[] = [];

    const setores: SetorDiag[] = setoresDB.map((s: any) => {
      const mdo = Number(s.mao_de_obra) || 0;
      const maq = Number(s.maquinas_automaticas) || 0;
      const ht = Number(s.horas_turno) || 8.8;
      const eff = Number(s.eficiencia) || 0.85;
      const dias = Number(s.dias_uteis_mensais) || 22;
      const horasDisp = (mdo + maq) * ht * eff * dias;
      const horasOcup = cargaMap[s.id] || 0;
      const carga = horasDisp > 0 ? Math.round((horasOcup / horasDisp) * 100) : 0;

      const erros: string[] = [];

      if (mdo === 0 && maq === 0) {
        erros.push('ERRO: Setor sem mão de obra e sem máquinas — capacidade = 0.');
      }
      if (horasDisp === 0) {
        erros.push('ERRO: Setor com horas disponíveis zeradas.');
      }
      if (dias !== 22) {
        erros.push(`ERRO: Dias produtivos incorretos (${dias} ao invés de 22).`);
      }
      if (eff !== 0.85) {
        erros.push(`ERRO: Eficiência incorreta (${(eff * 100).toFixed(0)}% ao invés de 85%).`);
      }
      if (ht !== 8.8) {
        alertas.push(`ALERTA: ${s.nome} — Horas/turno = ${ht}h (padrão: 8.8h).`);
      }
      if (carga > 100) {
        erros.push(`GARGALO: Carga ${carga}% excede capacidade.`);
      }

      return {
        id: s.id, nome: s.nome, mao_de_obra: mdo, maquinas_automaticas: maq,
        horas_turno: ht, eficiencia: eff, dias_uteis_mensais: dias,
        horas_disponiveis: horasDisp, horas_ocupadas: horasOcup,
        carga_percent: carga, erros,
      };
    });

    // --- Global calculations ---
    const horasProdutivasTotais = setoresDB.reduce((sum: number, s: any) => {
      return sum + ((Number(s.mao_de_obra) || 0) * 8 * 22);
    }, 0);

    const setoresComCap = setores.filter(s => s.horas_disponiveis > 0);
    const capacidadeGargalo = setoresComCap.length > 0
      ? Math.min(...setoresComCap.map(s => s.horas_disponiveis))
      : 0;

    const percentualOcupacao = horasProdutivasTotais > 0
      ? Math.round((horasNecessarias / horasProdutivasTotais) * 100)
      : 0;

    const saldoHoras = capacidadeGargalo - horasNecessarias;

    // --- Global errors ---
    if (horasNecessarias > 0 && percentualOcupacao === 0) {
      errosGlobais.push('ERRO CRÍTICO: Capacidade zerada com carga existente.');
    }
    if (horasNecessarias > 0 && horasProdutivasTotais === 0) {
      errosGlobais.push('ERRO CRÍTICO: Horas produtivas totais = 0 mas existem OPs ativas.');
    }
    if (saldoHoras < 0) {
      errosGlobais.push(`ALERTA: Saldo negativo de ${Math.abs(saldoHoras).toFixed(0)}h — fábrica sobrecarregada.`);
    }

    setData({
      setores, opsByStatus, horasNecessarias, horasFinalizadasIncluidas,
      horasProdutivasTotais, capacidadeGargalo, percentualOcupacao,
      saldoHoras, errosGlobais, alertas,
    });
    setLoading(false);
  };

  useEffect(() => { runDiagnostic(); }, []);

  const totalErros = data ? data.errosGlobais.length + data.setores.reduce((s, sec) => s + sec.erros.length, 0) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-destructive" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">🔍 Diagnóstico de Capacidade</h2>
            <p className="text-sm text-muted-foreground">Análise completa de inconsistências nos cálculos</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={runDiagnostic} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Reanalisar
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" /> Analisando...
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary badge */}
          <div className={cn("p-4 rounded-lg border flex items-center gap-3",
            totalErros > 0 ? "bg-destructive/10 border-destructive/30" : "bg-success/10 border-success/30"
          )}>
            {totalErros > 0
              ? <XCircle className="h-8 w-8 text-destructive" />
              : <CheckCircle className="h-8 w-8 text-success" />}
            <div>
              <p className="font-bold text-lg text-foreground">
                {totalErros > 0 ? `${totalErros} erro(s) encontrado(s)` : 'Nenhum erro crítico encontrado'}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.alertas.length > 0 && `+ ${data.alertas.length} alerta(s)`}
              </p>
            </div>
          </div>

          {/* SECTION 1: OPs by Status */}
          <div className="p-5 bg-card/50 border border-border/50 rounded-lg space-y-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              📋 Horas Necessárias — Detalhamento por Status
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30">
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground">Status</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground">Qtd OPs</th>
                  <th className="text-right py-2 px-3 text-xs text-muted-foreground">Horas</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground">Incluído no cálculo?</th>
                  <th className="text-center py-2 px-3 text-xs text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.opsByStatus.map(op => {
                  const excluido = ['Producao Finalizada', 'cancelado'].includes(op.status);
                  return (
                    <tr key={op.status} className={cn("border-b border-border/30",
                      excluido && "bg-destructive/5"
                    )}>
                      <td className="py-2 px-3 font-medium text-foreground text-xs">{op.status}</td>
                      <td className="py-2 px-3 text-center text-xs">{op.count}</td>
                      <td className="py-2 px-3 text-right font-mono text-xs">{op.horas.toFixed(1)}h</td>
                      <td className="py-2 px-3 text-center">
                        {excluido
                          ? <Badge className="bg-destructive/20 text-destructive text-[10px]">NÃO</Badge>
                          : <Badge className="bg-success/20 text-success text-[10px]">SIM</Badge>}
                      </td>
                      <td className="py-2 px-3 text-center text-xs">
                        {excluido ? '⛔ Excluído corretamente' : '✅ OK'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-secondary/50 font-bold">
                  <td className="py-2 px-3 text-xs">TOTAL CONSIDERADO</td>
                  <td className="py-2 px-3 text-center text-xs">
                    {data.opsByStatus.filter(o => !['Producao Finalizada', 'cancelado'].includes(o.status)).reduce((s, o) => s + o.count, 0)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-xs text-cip">{data.horasNecessarias.toFixed(1)}h</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>

            {data.horasFinalizadasIncluidas > 0 && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded text-warning text-xs font-semibold">
                ⚠️ INFO: Existem {data.horasFinalizadasIncluidas.toFixed(1)}h de OPs Finalizadas no banco, mas NÃO estão sendo incluídas no cálculo de capacidade.
              </div>
            )}
          </div>

          {/* SECTION 2: Sector Details */}
          <div className="p-5 bg-card/50 border border-border/50 rounded-lg space-y-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              🏭 Horas Produtivas — Detalhamento por Setor
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground">Setor</th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">Equipe</th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">Máq.</th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">H/Dia</th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">Eficiência</th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">Dias</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground">H. Calculadas</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground">H. Ocupadas</th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">Carga</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground">Erros</th>
                  </tr>
                </thead>
                <tbody>
                  {data.setores.map(s => (
                    <tr key={s.id} className={cn("border-b border-border/30",
                      s.erros.length > 0 && "bg-destructive/5"
                    )}>
                      <td className="py-2 px-2 font-medium text-foreground text-xs">{s.nome}</td>
                      <td className="py-2 px-2 text-center text-xs">{s.mao_de_obra}</td>
                      <td className="py-2 px-2 text-center text-xs">{s.maquinas_automaticas}</td>
                      <td className="py-2 px-2 text-center text-xs">{s.horas_turno}h</td>
                      <td className={cn("py-2 px-2 text-center text-xs font-semibold",
                        s.eficiencia !== 0.85 ? "text-destructive" : "text-success"
                      )}>{(s.eficiencia * 100).toFixed(0)}%</td>
                      <td className={cn("py-2 px-2 text-center text-xs font-semibold",
                        s.dias_uteis_mensais !== 22 ? "text-destructive" : "text-success"
                      )}>{s.dias_uteis_mensais}d</td>
                      <td className="py-2 px-2 text-right font-mono text-xs">{s.horas_disponiveis.toFixed(1)}h</td>
                      <td className="py-2 px-2 text-right font-mono text-xs">{s.horas_ocupadas.toFixed(1)}h</td>
                      <td className="py-2 px-2 text-center">
                        <span className={cn("font-bold text-xs",
                          s.carga_percent > 100 ? "text-destructive" :
                          s.carga_percent >= 80 ? "text-warning" : "text-success"
                        )}>{s.carga_percent}%</span>
                      </td>
                      <td className="py-2 px-2 text-xs">
                        {s.erros.length === 0
                          ? <span className="text-success">✅ OK</span>
                          : s.erros.map((e, i) => (
                              <div key={i} className="text-destructive font-semibold">{e}</div>
                            ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-secondary/30 rounded text-xs text-muted-foreground">
              <strong>Fórmula:</strong> H.Calculadas = (Equipe + Máq.) × H/Dia × Eficiência × Dias
              <br />
              <strong>Padrão esperado:</strong> Eficiência = 85%, Dias = 22, H/Dia = 8.8h
            </div>
          </div>

          {/* SECTION 3: Global Capacity */}
          <div className="p-5 bg-card/50 border border-border/50 rounded-lg space-y-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              📊 Capacidade da Fábrica — Resultado Final
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-secondary/30 rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground mb-1">HORAS NECESSÁRIAS</p>
                <p className="text-xl font-bold text-cip">{data.horasNecessarias.toFixed(0)}h</p>
                <p className="text-[10px] text-muted-foreground">OPs ativas</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground mb-1">H. PRODUTIVAS TOTAIS</p>
                <p className="text-xl font-bold text-foreground">{data.horasProdutivasTotais.toFixed(0)}h</p>
                <p className="text-[10px] text-muted-foreground">Σ(Equipe×8×22)</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground mb-1">CAP. GARGALO</p>
                <p className="text-xl font-bold text-foreground">{data.capacidadeGargalo.toFixed(0)}h</p>
                <p className="text-[10px] text-muted-foreground">MIN(setores)</p>
              </div>
              <div className={cn("p-3 rounded-lg text-center border",
                data.saldoHoras >= 0 ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
              )}>
                <p className="text-[10px] text-muted-foreground mb-1">SALDO</p>
                <p className={cn("text-xl font-bold", data.saldoHoras >= 0 ? "text-success" : "text-destructive")}>
                  {data.saldoHoras.toFixed(0)}h
                </p>
                <p className="text-[10px] text-muted-foreground">{data.saldoHoras >= 0 ? 'Folga' : 'Déficit'}</p>
              </div>
              <div className={cn("p-3 rounded-lg text-center border",
                data.percentualOcupacao > 100 ? "bg-destructive/10 border-destructive/30" :
                data.percentualOcupacao >= 80 ? "bg-warning/10 border-warning/30" :
                "bg-success/10 border-success/30"
              )}>
                <p className="text-[10px] text-muted-foreground mb-1">OCUPAÇÃO</p>
                <p className={cn("text-xl font-bold",
                  data.percentualOcupacao > 100 ? "text-destructive" :
                  data.percentualOcupacao >= 80 ? "text-warning" : "text-success"
                )}>{data.percentualOcupacao}%</p>
                <p className="text-[10px] text-muted-foreground">Nec./Total</p>
              </div>
            </div>

            <div className="p-3 bg-secondary/30 rounded text-xs text-muted-foreground">
              <strong>Fórmulas:</strong><br />
              Ocupação (%) = Horas Necessárias ({data.horasNecessarias.toFixed(0)}) ÷ Horas Produtivas Totais ({data.horasProdutivasTotais.toFixed(0)}) × 100 = <strong>{data.percentualOcupacao}%</strong><br />
              Saldo = Cap. Gargalo ({data.capacidadeGargalo.toFixed(0)}) - Horas Necessárias ({data.horasNecessarias.toFixed(0)}) = <strong>{data.saldoHoras.toFixed(0)}h</strong>
            </div>
          </div>

          {/* SECTION 4: All Errors */}
          <div className="p-5 bg-card/50 border border-border/50 rounded-lg space-y-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              🚨 Resumo de Erros e Alertas
            </h3>

            {data.errosGlobais.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-destructive">ERROS GLOBAIS:</p>
                {data.errosGlobais.map((e, i) => (
                  <div key={i} className="p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm font-semibold flex items-center gap-2">
                    <XCircle className="h-4 w-4 shrink-0" /> {e}
                  </div>
                ))}
              </div>
            )}

            {data.setores.filter(s => s.erros.length > 0).map(s => (
              <div key={s.id} className="space-y-1">
                <p className="text-xs font-semibold text-foreground">{s.nome}:</p>
                {s.erros.map((e, i) => (
                  <div key={i} className="p-2 bg-destructive/10 border border-destructive/30 rounded text-destructive text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 shrink-0" /> {e}
                  </div>
                ))}
              </div>
            ))}

            {data.alertas.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-warning">ALERTAS:</p>
                {data.alertas.map((a, i) => (
                  <div key={i} className="p-2 bg-warning/10 border border-warning/30 rounded text-warning text-xs font-semibold">
                    ⚠️ {a}
                  </div>
                ))}
              </div>
            )}

            {totalErros === 0 && data.alertas.length === 0 && (
              <div className="p-4 bg-success/10 border border-success/30 rounded text-success text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Todos os cálculos estão corretos. Nenhuma inconsistência encontrada.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
