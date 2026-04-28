import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, Clock, Package, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// Carteira mantém APENAS 4 status oficiais:
// Programado, Em Produção, Finalizado, Atrasado
const STATUS_COLORS: Record<string, string> = {
  programado: '#3b82f6',
  em_producao: '#f59e0b',
  finalizado: '#22c55e',
  atrasado: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  programado: 'Programado',
  em_producao: 'Em Produção',
  finalizado: 'Finalizado',
  atrasado: 'Atrasado',
};

/**
 * Normaliza o status efetivo do pedido para a carteira.
 * - "finalizado" sempre se mantém
 * - se prazo_entrega < hoje (e não finalizado) → "atrasado"
 * - "em_producao" se mantém
 * - qualquer outro (aguardando, aprovado, programado) → "programado"
 */
function getEffectiveStatus(p: any): 'programado' | 'em_producao' | 'finalizado' | 'atrasado' {
  if (p.status === 'finalizado' || p.status_producao === 'finalizado') return 'finalizado';
  const prazo = p.prazo_entrega ? new Date(p.prazo_entrega) : null;
  if (prazo) {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    prazo.setHours(0,0,0,0);
    if (prazo.getTime() < hoje.getTime()) return 'atrasado';
  }
  if (p.status === 'em_producao' || p.status_producao === 'em_producao') return 'em_producao';
  return 'programado';
}

const CANAL_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#14b8a6'];

export function CIVCarteira() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, codigo, cliente, produto, quantidade, valor_total, margem, canal, status, status_producao, prazo_entrega, op, observacoes')
      .order('created_at', { ascending: false });
    if (!error && data) setPedidos(data);
    setLoading(false);
  };

  // Considera ativos todos exceto cancelado
  const ativos = pedidos.filter(p => p.status !== 'cancelado');
  // Anexa o status efetivo (com regra de atraso)
  const ativosNorm = ativos.map(p => ({ ...p, _statusEf: getEffectiveStatus(p) }));

  const totalPedidos = ativosNorm.length;
  const valorTotal = ativosNorm.reduce((acc, p) => acc + Number(p.valor_total || 0), 0);
  const emProducao = ativosNorm.filter(p => p._statusEf === 'em_producao' || p._statusEf === 'programado').length;
  const atrasados = ativosNorm.filter(p => p._statusEf === 'atrasado').length;

  // Pedidos por status (apenas 4 oficiais)
  const statusMap: Record<string, number> = {};
  ativosNorm.forEach(p => { statusMap[p._statusEf] = (statusMap[p._statusEf] || 0) + 1; });
  const pedidosPorStatus = Object.entries(statusMap).map(([status, count]) => ({
    status: STATUS_LABELS[status] || status,
    count,
    color: STATUS_COLORS[status] || '#6b7280',
  }));

  // Valor por canal
  const canalMap: Record<string, number> = {};
  ativosNorm.forEach(p => {
    const canal = p.canal || 'Outros';
    canalMap[canal] = (canalMap[canal] || 0) + Number(p.valor_total || 0);
  });
  const valorPorCanal = Object.entries(canalMap).map(([canal, valor]) => ({ canal, valor }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Total Pedidos" value={totalPedidos} subtitle="Em carteira" icon={<FileText className="h-5 w-5" />} variant="civ" />
        <KPICard title="Valor Total" value={`R$ ${(valorTotal / 1000).toFixed(0)}k`} subtitle="Carteira" icon={<DollarSign className="h-5 w-5" />} variant="civ" />
        <KPICard title="Em Produção" value={emProducao} subtitle="Com OP gerada" icon={<Package className="h-5 w-5" />} variant="civ" />
        <KPICard title="Atrasados" value={atrasados} subtitle="Prazo vencido" icon={<Clock className="h-5 w-5" />} variant="civ" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Pedidos por Status" variant="civ">
          <div className="h-72 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pedidosPorStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count">
                    {pedidosPorStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {pedidosPorStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.status}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.count}</span>
                </div>
              ))}
              {pedidosPorStatus.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum pedido cadastrado</p>
              )}
            </div>
          </div>
        </ModuleCard>

        <ModuleCard title="Valor por Canal" variant="civ">
          <div className="h-72">
            {valorPorCanal.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valorPorCanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="canal" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                  <Bar dataKey="valor" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Nenhum pedido cadastrado ainda
              </div>
            )}
          </div>
        </ModuleCard>
      </div>

      {/* Tabela de Carteira */}
      <ModuleCard title="Carteira Total de Pedidos" variant="civ">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr className="border-b border-border/50 sticky top-0 bg-secondary/80 backdrop-blur-sm z-10">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Pedido</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Canal</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Produto(s)</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">OP</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nenhum pedido cadastrado. Use o módulo CIV → Cadastro de Pedidos.</td></tr>
                ) : (
                  pedidos.map((pedido) => (
                    <tr key={pedido.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-foreground">{pedido.codigo}</td>
                      <td className="py-3 px-4 text-foreground">{pedido.cliente}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{pedido.canal || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{pedido.produto}</td>
                      <td className="py-3 px-4 text-right text-foreground">R$ {Number(pedido.valor_total || 0).toLocaleString('pt-BR')}</td>
                      <td className="py-3 px-4 text-center">
                        {pedido.op ? (
                          <span className="font-mono text-xs bg-cip/20 text-cip px-2 py-1 rounded">{pedido.op}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge style={{ backgroundColor: STATUS_COLORS[pedido.status] || '#6b7280', color: '#fff' }}>
                          {STATUS_LABELS[pedido.status] || pedido.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground hidden lg:table-cell">
                        {pedido.prazo_entrega ? new Date(pedido.prazo_entrega).toLocaleDateString('pt-BR') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </ModuleCard>
    </div>
  );
}
