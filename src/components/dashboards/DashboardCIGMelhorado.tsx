import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  LayoutDashboard, TrendingUp, Factory, DollarSign, Clock,
  AlertTriangle, Activity, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const CHART_COLORS = {
  azulMarinho: 'hsl(215, 75%, 48%)',
  verde: 'hsl(145, 70%, 42%)',
  amarelo: 'hsl(45, 95%, 50%)',
  vermelho: 'hsl(0, 72%, 51%)',
  laranja: 'hsl(30, 90%, 50%)',
  azulClaro: 'hsl(200, 75%, 50%)',
};

interface KPIData {
  totalPedidos: number;
  pedidosEmProducao: number;
  pedidosAguardando: number;
  pedidosFinalizados: number;
  valorCarteiraTotal: number;
  horasCarteira: number;
  totalOPs: number;
  opsEmProducao: number;
  totalSetores: number;
  capacidadeDiaria: number;
  pedidosPorStatus: { status: string; count: number }[];
  pedidosPorCanal: { canal: string; valor: number }[];
  setoresProducao: { nome: string; opsAtivas: number }[];
  alertas: string[];
}

interface DashboardCIGMelhoradoProps {
  onGoHome?: () => void;
}

export function DashboardCIGMelhorado({ onGoHome }: DashboardCIGMelhoradoProps) {
  const [kpis, setKpis] = useState<KPIData>({
    totalPedidos: 0, pedidosEmProducao: 0, pedidosAguardando: 0, pedidosFinalizados: 0,
    valorCarteiraTotal: 0, horasCarteira: 0, totalOPs: 0, opsEmProducao: 0,
    totalSetores: 0, capacidadeDiaria: 8,
    pedidosPorStatus: [], pedidosPorCanal: [], setoresProducao: [], alertas: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pedidosRes, opsRes, carteiraRes, setoresRes, configRes] = await Promise.all([
        supabase.from('pedidos').select('id, status, status_producao, valor_total, canal').order('created_at', { ascending: false }),
        supabase.from('ops').select('id, status_producao, current_sector').neq('status_producao', 'cancelado'),
        supabase.from('carteira_producao').select('total_horas_acumuladas').limit(1).maybeSingle(),
        supabase.from('setores_produtivos').select('id, nome, ativo').eq('ativo', true).order('ordem'),
        supabase.from('configuracoes_capacidade').select('capacidade_produtiva_diaria').limit(1).maybeSingle(),
      ]);

      const pedidos = pedidosRes.data || [];
      const ops = opsRes.data || [];
      const horasCarteira = carteiraRes.data ? Number(carteiraRes.data.total_horas_acumuladas) : 0;
      const setores = setoresRes.data || [];
      const capacidadeDiaria = configRes.data ? Number(configRes.data.capacidade_produtiva_diaria) : 8;

      // Status grouping
      const statusMap: Record<string, number> = {};
      pedidos.forEach(p => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
      const statusLabels: Record<string, string> = {
        aguardando: 'Aguardando', programado: 'Programado', em_producao: 'Em Produção',
        finalizado: 'Finalizado', cancelado: 'Cancelado',
      };
      const pedidosPorStatus = Object.entries(statusMap)
        .filter(([s]) => s !== 'cancelado')
        .map(([status, count]) => ({ status: statusLabels[status] || status, count }));

      // Canal grouping
      const canalMap: Record<string, number> = {};
      pedidos.filter(p => p.status !== 'cancelado').forEach(p => {
        const canal = p.canal || 'Outros';
        canalMap[canal] = (canalMap[canal] || 0) + Number(p.valor_total || 0);
      });
      const pedidosPorCanal = Object.entries(canalMap)
        .map(([canal, valor]) => ({ canal, valor }))
        .sort((a, b) => b.valor - a.valor);

      // OPs por setor
      const setorOpsMap: Record<string, number> = {};
      ops.forEach(op => {
        if (op.current_sector) {
          setorOpsMap[op.current_sector] = (setorOpsMap[op.current_sector] || 0) + 1;
        }
      });
      const setoresProducaoData = setores.map(s => ({
        nome: s.nome, opsAtivas: setorOpsMap[s.nome] || 0,
      }));

      // Alertas inteligentes
      const alertas: string[] = [];
      const pedidosAtivos = pedidos.filter(p => p.status !== 'cancelado' && p.status !== 'finalizado');
      const opsAtivas = ops.filter(o => o.status_producao !== 'Producao Finalizada' && o.status_producao !== 'aguardando');
      const diasCarteira = capacidadeDiaria > 0 ? Math.ceil(horasCarteira / capacidadeDiaria) : 0;

      if (diasCarteira > 15) alertas.push(`🔴 Sobrecarga: ${diasCarteira} dias de carteira (>15 dias)`);
      else if (diasCarteira > 10) alertas.push(`🟡 Carga alta: ${diasCarteira} dias de carteira`);

      const aguardando = pedidos.filter(p => p.status === 'aguardando').length;
      if (aguardando > 3) alertas.push(`🔴 ${aguardando} pedidos aguardando programação`);
      else if (aguardando > 0) alertas.push(`🟡 ${aguardando} pedido(s) aguardando programação`);

      // Check sector bottleneck
      const maxOps = Math.max(...setoresProducaoData.map(s => s.opsAtivas), 0);
      if (maxOps > 5) {
        const gargalo = setoresProducaoData.find(s => s.opsAtivas === maxOps);
        if (gargalo) alertas.push(`🔴 Gargalo: ${gargalo.nome} com ${maxOps} OPs`);
      }

      if (alertas.length === 0 && pedidosAtivos.length > 0) {
        alertas.push('✅ Operação normal — sem alertas críticos');
      }

      setKpis({
        totalPedidos: pedidos.filter(p => p.status !== 'cancelado').length,
        pedidosEmProducao: pedidos.filter(p => p.status === 'programado' || p.status === 'em_producao').length,
        pedidosAguardando: aguardando,
        pedidosFinalizados: pedidos.filter(p => p.status === 'finalizado').length,
        valorCarteiraTotal: pedidosAtivos.reduce((s, p) => s + Number(p.valor_total || 0), 0),
        horasCarteira,
        totalOPs: ops.length,
        opsEmProducao: opsAtivas.length,
        totalSetores: setores.length,
        capacidadeDiaria,
        pedidosPorStatus, pedidosPorCanal, setoresProducao: setoresProducaoData,
        alertas,
      });
      setLastUpdate(new Date());
    } catch (e) {
      console.error('[CIG] Erro ao carregar dados:', e);
    }
    setLoading(false);
  };

  const temDados = kpis.totalPedidos > 0;
  const diasCarteira = kpis.capacidadeDiaria > 0 ? Math.ceil(kpis.horasCarteira / kpis.capacidadeDiaria) : 0;
  const cargaPercentual = kpis.capacidadeDiaria > 0 ? Math.round((kpis.horasCarteira / (kpis.capacidadeDiaria * 22)) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            Dashboard Executivo
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Dados em tempo real • Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Atualizar
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/30">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-success font-medium">Dados Reais</span>
          </div>
        </div>
      </div>

      {!temDados && !loading && (
        <div className="p-6 rounded-xl border-2 border-warning/30 bg-warning/10 text-center">
          <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
          <p className="font-medium text-foreground">Nenhum dado encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">Cadastre pedidos no CIV para ver os dados aqui.</p>
        </div>
      )}

      {/* Alertas Inteligentes */}
      {kpis.alertas.length > 0 && (
        <div className="space-y-2">
          {kpis.alertas.map((alerta, i) => (
            <div key={i} className={cn(
              'p-3 rounded-lg border text-sm font-medium',
              alerta.startsWith('🔴') ? 'bg-destructive/10 border-destructive/30 text-destructive' :
              alerta.startsWith('🟡') ? 'bg-warning/10 border-warning/30 text-warning' :
              'bg-success/10 border-success/30 text-success'
            )}>
              {alerta}
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-civ/20 to-civ/5 border border-civ/30">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-civ" />
            <span className="text-xs text-muted-foreground">CIV</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.totalPedidos}</p>
          <p className="text-xs text-muted-foreground mt-1">Pedidos Ativos</p>
          <p className="text-xs text-civ mt-1">{kpis.pedidosAguardando} aguardando</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-cip/20 to-cip/5 border border-cip/30">
          <div className="flex items-center justify-between mb-2">
            <Factory className="h-5 w-5 text-cip" />
            <span className="text-xs text-muted-foreground">CIP</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.pedidosEmProducao}</p>
          <p className="text-xs text-muted-foreground mt-1">Em Produção/Prog.</p>
          <p className="text-xs text-cip mt-1">{kpis.totalOPs} OPs | {kpis.opsEmProducao} em curso</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-success" />
            <span className="text-xs text-muted-foreground">CARTEIRA</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            R$ {kpis.valorCarteiraTotal >= 1000000
              ? `${(kpis.valorCarteiraTotal / 1000000).toFixed(1)}M`
              : `${(kpis.valorCarteiraTotal / 1000).toFixed(0)}k`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Valor em Aberto</p>
          <p className="text-xs text-success mt-1">{kpis.pedidosFinalizados} finalizados</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/30">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-warning" />
            <span className="text-xs text-muted-foreground">HORAS</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.horasCarteira.toFixed(0)}h</p>
          <p className="text-xs text-muted-foreground mt-1">Carteira Acumulada</p>
          <p className="text-xs text-warning mt-1">≈ {diasCarteira} dias úteis</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">CAPACIDADE</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.capacidadeDiaria}h</p>
          <p className="text-xs text-muted-foreground mt-1">Capacidade/Dia</p>
          <p className={cn('text-xs mt-1', cargaPercentual > 100 ? 'text-destructive' : cargaPercentual > 80 ? 'text-warning' : 'text-success')}>
            {cargaPercentual}% carga mensal
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30">
          <div className="flex items-center justify-between mb-2">
            <Factory className="h-5 w-5 text-accent-foreground" />
            <span className="text-xs text-muted-foreground">SETORES</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.totalSetores}</p>
          <p className="text-xs text-muted-foreground mt-1">Setores Produtivos</p>
          <p className="text-xs text-primary mt-1">Sequencial ativo</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleCard title="Pedidos por Status" variant="civ">
          <div className="h-64">
            {kpis.pedidosPorStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.pedidosPorStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="status" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [value, 'Pedidos']} />
                  <Bar dataKey="count" fill={CHART_COLORS.verde} radius={[4, 4, 0, 0]} name="Pedidos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Nenhum pedido</div>
            )}
          </div>
        </ModuleCard>

        <ModuleCard title="Valor por Canal de Venda" variant="civ">
          <div className="h-64">
            {kpis.pedidosPorCanal.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.pedidosPorCanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="canal" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                  <Bar dataKey="valor" fill={CHART_COLORS.azulMarinho} radius={[4, 4, 0, 0]} name="Valor" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Nenhum pedido</div>
            )}
          </div>
        </ModuleCard>

        <ModuleCard title="OPs Ativas por Setor" variant="cip">
          <div className="h-64">
            {kpis.setoresProducao.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.setoresProducao} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={140} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [value, 'OPs']} />
                  <Bar dataKey="opsAtivas" fill={CHART_COLORS.laranja} radius={[0, 4, 4, 0]} name="OPs Ativas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Nenhum setor</div>
            )}
          </div>
        </ModuleCard>

        <ModuleCard title="Capacidade × Carga" variant="cig">
          <div className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Capacidade Diária</p>
                <p className="text-2xl font-bold text-foreground">{kpis.capacidadeDiaria}h</p>
                <p className="text-xs text-primary mt-1">{kpis.totalSetores} setores</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Carga em Carteira</p>
                <p className="text-2xl font-bold text-foreground">{kpis.horasCarteira.toFixed(0)}h</p>
                <p className={cn('text-xs mt-1', diasCarteira > 15 ? 'text-destructive' : diasCarteira > 10 ? 'text-warning' : 'text-success')}>
                  ≈ {diasCarteira} dias úteis
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">OPs Geradas</p>
                <p className="text-2xl font-bold text-foreground">{kpis.totalOPs}</p>
                <p className="text-xs text-cip mt-1">{kpis.opsEmProducao} em curso</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Carga vs Capacidade</p>
                <p className={cn('text-2xl font-bold', cargaPercentual > 100 ? 'text-destructive' : cargaPercentual > 80 ? 'text-warning' : 'text-success')}>
                  {cargaPercentual}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">do mês (22 dias)</p>
              </div>
            </div>
            <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', cargaPercentual > 100 ? 'bg-destructive' : cargaPercentual > 80 ? 'bg-warning' : 'bg-success')}
                style={{ width: `${Math.min(cargaPercentual, 100)}%` }}
              />
            </div>
          </div>
        </ModuleCard>
      </div>
    </div>
  );
}
