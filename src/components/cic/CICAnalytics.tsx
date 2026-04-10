import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { KPICard } from '@/components/ui/KPICard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart2, TrendingUp, Package, RefreshCw, DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchMateriais, type Material } from '@/services/materiaisService';
import { fetchPedidosCompra, type PedidoCompra } from '@/services/pedidoCompraService';
import { supabase } from '@/integrations/supabase/client';

const COLORS = {
  azul: 'hsl(215, 75%, 48%)',
  verde: 'hsl(145, 70%, 42%)',
  amarelo: 'hsl(45, 95%, 50%)',
  vermelho: 'hsl(0, 72%, 51%)',
  laranja: 'hsl(30, 90%, 50%)',
  roxo: 'hsl(270, 60%, 55%)',
  azulClaro: 'hsl(200, 75%, 50%)',
};

const fmtCurrency = (v: number) => v >= 999500 ? `R$ ${(v / 1000000).toFixed(2)}M` : v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`;

export function CICAnalytics() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [pedidosCompra, setPedidosCompra] = useState<PedidoCompra[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [mats, pcs, movData] = await Promise.all([
      fetchMateriais(),
      fetchPedidosCompra(),
      supabase.from('movimentacoes_materiais').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    setMateriais(mats);
    setPedidosCompra(pcs);
    setMovimentacoes(movData.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ABC Curve
  const abcData = useMemo(() => {
    const sorted = [...materiais]
      .map(m => ({ nome: m.nome.substring(0, 15), valor: m.valor_estoque || 0, codigo: m.codigo }))
      .sort((a, b) => b.valor - a.valor);
    const total = sorted.reduce((s, m) => s + m.valor, 0);
    let acum = 0;
    return sorted.map(m => {
      acum += m.valor;
      const pct = total > 0 ? (acum / total) * 100 : 0;
      const classe = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
      return { ...m, acumulado: pct, classe };
    });
  }, [materiais]);

  const classA = abcData.filter(m => m.classe === 'A');
  const classB = abcData.filter(m => m.classe === 'B');
  const classC = abcData.filter(m => m.classe === 'C');

  // Stock turnover (giro)
  const giroData = useMemo(() => {
    return materiais
      .filter(m => m.consumo_medio_diario > 0 && m.estoque_atual > 0)
      .map(m => {
        const consumoMensal = m.consumo_medio_diario * 22;
        const giro = m.estoque_atual > 0 ? consumoMensal / m.estoque_atual : 0;
        return { nome: m.nome.substring(0, 12), giro: Number(giro.toFixed(2)), consumoMensal };
      })
      .sort((a, b) => b.giro - a.giro)
      .slice(0, 10);
  }, [materiais]);

  // Consumption by category
  const consumoCategoria = useMemo(() => {
    const cats = new Map<string, number>();
    materiais.forEach(m => {
      const consumoMensal = m.consumo_medio_diario * 22 * m.valor_unitario;
      cats.set(m.categoria, (cats.get(m.categoria) || 0) + consumoMensal);
    });
    const pieColors = [COLORS.azul, COLORS.verde, COLORS.amarelo, COLORS.laranja, COLORS.vermelho, COLORS.roxo, COLORS.azulClaro];
    return Array.from(cats.entries()).map(([cat, val], i) => ({ name: cat, value: Number(val.toFixed(0)), color: pieColors[i % pieColors.length] }));
  }, [materiais]);

  // Supplier performance
  const fornPerf = useMemo(() => {
    const perf = new Map<string, { total: number; onTime: number; inFull: number; leadTimes: number[] }>();
    pedidosCompra.filter(p => p.status === 'recebido').forEach(p => {
      const nome = p.fornecedor_nome || 'Sem Nome';
      const cur = perf.get(nome) || { total: 0, onTime: 0, inFull: 0, leadTimes: [] };
      cur.total++;
      if (p.on_time) cur.onTime++;
      if (p.in_full) cur.inFull++;
      if (p.data_emissao && p.data_recebimento) {
        const diff = Math.round((new Date(p.data_recebimento).getTime() - new Date(p.data_emissao).getTime()) / 86400000);
        if (diff > 0) cur.leadTimes.push(diff);
      }
      perf.set(nome, cur);
    });
    return Array.from(perf.entries()).map(([nome, d]) => ({
      nome: nome.substring(0, 15),
      otif: d.total > 0 ? Math.round(((d.onTime + d.inFull) / (d.total * 2)) * 100) : 0,
      leadTime: d.leadTimes.length > 0 ? Math.round(d.leadTimes.reduce((s, v) => s + v, 0) / d.leadTimes.length) : 0,
      total: d.total,
    })).sort((a, b) => b.otif - a.otif);
  }, [pedidosCompra]);

  const valorEstoque = materiais.reduce((s, m) => s + (m.valor_estoque || 0), 0);
  const consumoMensalTotal = materiais.reduce((s, m) => s + m.consumo_medio_diario * 22 * m.valor_unitario, 0);
  const giroMedio = valorEstoque > 0 ? consumoMensalTotal / valorEstoque : 0;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Valor Estoque" value={fmtCurrency(valorEstoque)} subtitle="Total valorizado" icon={<DollarSign className="h-5 w-5" />} variant="cic" />
        <KPICard title="Giro Médio" value={giroMedio.toFixed(2)} subtitle="Consumo / Estoque" icon={<TrendingUp className="h-5 w-5" />} variant="cic" />
        <KPICard title="Classe A" value={classA.length} subtitle={`${((classA.length / materiais.length) * 100 || 0).toFixed(0)}% dos itens`} icon={<Package className="h-5 w-5" />} variant="cic" />
        <KPICard title="Consumo Mensal" value={fmtCurrency(consumoMensalTotal)} subtitle="Projeção 22 dias" icon={<BarChart2 className="h-5 w-5" />} variant="cic" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ABC */}
        <ModuleCard title="Curva ABC — Classificação de Materiais" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={abcData.slice(0, 12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={v => fmtCurrency(v)} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(v: number, name: string) => [name === 'valor' ? fmtCurrency(v) : `${v.toFixed(0)}%`, name === 'valor' ? 'Valor' : 'Acumulado']} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {abcData.slice(0, 12).map((e, i) => (
                    <Cell key={i} fill={e.classe === 'A' ? COLORS.vermelho : e.classe === 'B' ? COLORS.amarelo : COLORS.verde} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="acumulado" stroke={COLORS.azulClaro} strokeWidth={2} dot={false} yAxisId="right" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 mt-2 justify-center">
            <Badge className="bg-red-500/20 text-red-400 text-[10px]">A: {classA.length} itens (80% valor)</Badge>
            <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px]">B: {classB.length} itens (15% valor)</Badge>
            <Badge className="bg-green-500/20 text-green-400 text-[10px]">C: {classC.length} itens (5% valor)</Badge>
          </div>
        </ModuleCard>

        {/* Giro */}
        <ModuleCard title="Giro de Estoque — Top 10" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={giroData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(v: number) => [`${v.toFixed(2)}x`, 'Giro']} />
                <Bar dataKey="giro" fill={COLORS.azul} radius={[0, 4, 4, 0]}>
                  {giroData.map((e, i) => (
                    <Cell key={i} fill={e.giro > 2 ? COLORS.verde : e.giro > 1 ? COLORS.amarelo : COLORS.vermelho} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Consumo por categoria */}
        <ModuleCard title="Consumo Mensal por Categoria" variant="cic">
          <div className="h-64 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={consumoCategoria} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value">
                    {consumoCategoria.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(v: number) => [fmtCurrency(v), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-1.5">
              {consumoCategoria.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-semibold">{fmtCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>

        {/* Performance Fornecedores */}
        <ModuleCard title="Performance de Fornecedores" variant="cic">
          <div className="h-64">
            {fornPerf.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Nenhum pedido recebido para avaliar
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fornPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(v: number, name: string) => [name === 'otif' ? `${v}%` : `${v}d`, name === 'otif' ? 'OTIF' : 'Lead Time']} />
                  <Bar dataKey="otif" fill={COLORS.verde} radius={[4, 4, 0, 0]} name="OTIF %" />
                  <Bar dataKey="leadTime" fill={COLORS.azulClaro} radius={[4, 4, 0, 0]} name="Lead Time (dias)" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ModuleCard>
      </div>

      {/* ABC Table */}
      <ModuleCard title="Classificação ABC Detalhada" variant="cic">
        <ScrollArea className="max-h-[300px]">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Código</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Material</th>
              <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Valor Estoque</th>
              <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">% Acumulado</th>
              <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">Classe</th>
            </tr></thead>
            <tbody>
              {abcData.map((m, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="py-2 px-3 text-xs text-muted-foreground">{m.codigo}</td>
                  <td className="py-2 px-3 text-xs font-medium">{m.nome}</td>
                  <td className="py-2 px-3 text-xs text-right">{fmtCurrency(m.valor)}</td>
                  <td className="py-2 px-3 text-xs text-center">{m.acumulado.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-center">
                    <Badge className={cn("text-[10px]",
                      m.classe === 'A' ? 'bg-red-500/20 text-red-400' :
                      m.classe === 'B' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                    )}>{m.classe}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </ModuleCard>
    </div>
  );
}
