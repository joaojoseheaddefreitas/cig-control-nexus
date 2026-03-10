import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { DollarSign, ShoppingCart, Target, TrendingUp, Percent, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  aguardando: 'hsl(45, 95%, 50%)',
  aprovado: 'hsl(145, 70%, 42%)',
  programado: 'hsl(215, 75%, 48%)',
  em_producao: 'hsl(30, 90%, 50%)',
  finalizado: 'hsl(170, 70%, 42%)',
  cancelado: 'hsl(0, 72%, 51%)',
};

export function CIVDashboard() {
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [pedRes, leadRes] = await Promise.all([
      supabase.from('pedidos').select('id, status, status_producao, valor_total, canal').neq('status', 'cancelado').order('created_at', { ascending: false }),
      supabase.from('leads').select('id, status'),
    ]);
    setPedidos(pedRes.data || []);
    setLeads(leadRes.data || []);
    setLoading(false);
  };

  const totalVendido = pedidos.reduce((s, p) => s + Number(p.valor_total || 0), 0);
  const pedidosAberto = pedidos.filter(p => !['finalizado', 'cancelado'].includes(p.status)).length;
  const ticketMedio = pedidos.length > 0 ? Math.round(totalVendido / pedidos.length) : 0;
  const leadsAtivos = leads.filter(l => !['convertido', 'perdido'].includes(l.status)).length;

  // Status grouping
  const statusMap: Record<string, number> = {};
  pedidos.forEach(p => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
  const statusLabels: Record<string, string> = {
    aguardando: 'Aguardando', aprovado: 'Aprovado', programado: 'Programado',
    em_producao: 'Em Produção', finalizado: 'Finalizado',
  };
  const pedidosPorStatus = Object.entries(statusMap).map(([status, count]) => ({
    status: statusLabels[status] || status, count, color: STATUS_COLORS[status] || 'hsl(var(--muted))',
  }));

  // Canal grouping
  const canalMap: Record<string, number> = {};
  pedidos.forEach(p => { canalMap[p.canal || 'Outros'] = (canalMap[p.canal || 'Outros'] || 0) + Number(p.valor_total || 0); });
  const canalColors = ['hsl(145, 70%, 42%)', 'hsl(215, 75%, 48%)', 'hsl(30, 90%, 50%)', 'hsl(270, 60%, 55%)', 'hsl(170, 70%, 42%)', 'hsl(45, 95%, 50%)'];
  const pedidosPorCanal = Object.entries(canalMap)
    .map(([canal, valor], i) => ({ canal, valor, color: canalColors[i % canalColors.length] }))
    .sort((a, b) => b.valor - a.valor);

  const temDados = pedidos.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success font-medium">Dados Reais</span>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="Total Vendido" value={`R$ ${(totalVendido / 1000).toFixed(0)}k`} subtitle={`${pedidos.length} pedidos`} icon={<DollarSign className="h-5 w-5" />} variant="civ" />
        <KPICard title="Pedidos Abertos" value={pedidosAberto} subtitle="Em carteira" icon={<ShoppingCart className="h-5 w-5" />} variant="civ" />
        <KPICard title="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString('pt-BR')}`} subtitle="Por pedido" icon={<Target className="h-5 w-5" />} variant="civ" />
        <KPICard title="Leads Ativos" value={leadsAtivos} subtitle={`de ${leads.length} total`} icon={<TrendingUp className="h-5 w-5" />} variant="civ" />
        <KPICard title="Finalizados" value={pedidos.filter(p => p.status === 'finalizado').length} subtitle="Entregues" icon={<Percent className="h-5 w-5" />} variant="civ" />
      </div>

      {!temDados && !loading && (
        <div className="py-8 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
          Sem dados cadastrados – insira dados para iniciar o monitoramento.
        </div>
      )}

      {temDados && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModuleCard title="Pedidos por Status" variant="civ">
            <div className="h-72 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pedidosPorStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count">
                      {pedidosPorStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3">
                {pedidosPorStatus.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.status}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </ModuleCard>

          <ModuleCard title="Faturamento por Canal" variant="civ">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pedidosPorCanal} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="canal" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Valor']} />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={18}>
                    {pedidosPorCanal.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>
        </div>
      )}
    </div>
  );
}
