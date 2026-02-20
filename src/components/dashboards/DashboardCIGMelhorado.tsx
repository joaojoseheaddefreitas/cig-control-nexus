import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Legend,
} from 'recharts';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  LayoutDashboard, TrendingUp, Factory, Package, Wallet, Clock,
  Target, AlertTriangle, ArrowUpRight, ArrowDownRight,
  DollarSign, Activity, Zap, RefreshCw
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
  pedidosPorStatus: { status: string; count: number }[];
  pedidosPorCanal: { canal: string; valor: number }[];
  setoresProducao: { nome: string; opsAtivas: number }[];
}

interface DashboardCIGMelhoradoProps {
  onGoHome?: () => void;
}

export function DashboardCIGMelhorado({ onGoHome }: DashboardCIGMelhoradoProps) {
  const [kpis, setKpis] = useState<KPIData>({
    totalPedidos: 0,
    pedidosEmProducao: 0,
    pedidosAguardando: 0,
    pedidosFinalizados: 0,
    valorCarteiraTotal: 0,
    horasCarteira: 0,
    totalOPs: 0,
    opsEmProducao: 0,
    totalSetores: 0,
    pedidosPorStatus: [],
    pedidosPorCanal: [],
    setoresProducao: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    // Atualizar a cada 60 segundos
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pedidosRes, opsRes, carteiraRes, setoresRes] = await Promise.all([
        supabase.from('pedidos').select('id, status, status_producao, valor_total, canal').order('created_at', { ascending: false }),
        supabase.from('ops').select('id, status_producao, current_sector').neq('status_producao', 'cancelado'),
        supabase.from('carteira_producao').select('total_horas_acumuladas').limit(1).maybeSingle(),
        supabase.from('setores_produtivos').select('id, nome, ativo').eq('ativo', true).order('ordem'),
      ]);

      const pedidos = pedidosRes.data || [];
      const ops = opsRes.data || [];
      const horasCarteira = carteiraRes.data ? Number(carteiraRes.data.total_horas_acumuladas) : 0;
      const setores = setoresRes.data || [];

      // Agrupar pedidos por status
      const statusMap: Record<string, number> = {};
      pedidos.forEach(p => {
        statusMap[p.status] = (statusMap[p.status] || 0) + 1;
      });

      const statusLabels: Record<string, string> = {
        aguardando: 'Aguardando',
        programado: 'Programado',
        em_producao: 'Em Produção',
        finalizado: 'Finalizado',
        cancelado: 'Cancelado',
      };

      const pedidosPorStatus = Object.entries(statusMap).map(([status, count]) => ({
        status: statusLabels[status] || status,
        count,
      }));

      // Agrupar por canal
      const canalMap: Record<string, number> = {};
      pedidos.forEach(p => {
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
        nome: s.nome,
        opsAtivas: setorOpsMap[s.nome] || 0,
      }));

      setKpis({
        totalPedidos: pedidos.filter(p => p.status !== 'cancelado').length,
        pedidosEmProducao: pedidos.filter(p => p.status === 'programado' || p.status === 'em_producao').length,
        pedidosAguardando: pedidos.filter(p => p.status === 'aguardando').length,
        pedidosFinalizados: pedidos.filter(p => p.status === 'finalizado').length,
        valorCarteiraTotal: pedidos.filter(p => p.status !== 'cancelado' && p.status !== 'finalizado').reduce((s, p) => s + Number(p.valor_total || 0), 0),
        horasCarteira,
        totalOPs: ops.length,
        opsEmProducao: ops.filter(o => o.status_producao !== 'aguardando' && o.status_producao !== 'Producao Finalizada').length,
        totalSetores: setores.length,
        pedidosPorStatus,
        pedidosPorCanal,
        setoresProducao: setoresProducaoData,
      });

      setLastUpdate(new Date());
    } catch (e) {
      console.error('[CIG] Erro ao carregar dados:', e);
    }
    setLoading(false);
  };

  const temDados = kpis.totalPedidos > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
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

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-civ/20 to-civ/5 border border-civ/30 hover:border-civ/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-civ" />
            <span className="text-xs text-muted-foreground">CIV</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.totalPedidos}</p>
          <p className="text-xs text-muted-foreground mt-1">Pedidos Ativos</p>
          <p className="text-xs text-civ mt-1">{kpis.pedidosAguardando} aguardando</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-cip/20 to-cip/5 border border-cip/30 hover:border-cip/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Factory className="h-5 w-5 text-cip" />
            <span className="text-xs text-muted-foreground">CIP</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.pedidosEmProducao}</p>
          <p className="text-xs text-muted-foreground mt-1">Em Produção/Prog.</p>
          <p className="text-xs text-cip mt-1">{kpis.totalOPs} OPs geradas</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30 hover:border-success/50 transition-all">
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

        <div className="p-4 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/30 hover:border-warning/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-warning" />
            <span className="text-xs text-muted-foreground">HORAS</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.horasCarteira.toFixed(0)}h</p>
          <p className="text-xs text-muted-foreground mt-1">Carteira Acumulada</p>
          <p className="text-xs text-warning mt-1">≈ {Math.ceil(kpis.horasCarteira / 8)} dias</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground">SETORES</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{kpis.totalSetores}</p>
          <p className="text-xs text-muted-foreground mt-1">Setores Produtivos</p>
          <p className="text-xs text-primary mt-1">{kpis.opsEmProducao} OPs em curso</p>
        </div>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos por Status */}
        <ModuleCard title="Pedidos por Status" variant="civ">
          <div className="h-64">
            {kpis.pedidosPorStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.pedidosPorStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="status" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [value, 'Pedidos']}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.verde} radius={[4, 4, 0, 0]} name="Pedidos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Nenhum pedido cadastrado
              </div>
            )}
          </div>
        </ModuleCard>

        {/* Valor por Canal */}
        <ModuleCard title="Valor por Canal de Venda" variant="civ">
          <div className="h-64">
            {kpis.pedidosPorCanal.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.pedidosPorCanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="canal" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                  />
                  <Bar dataKey="valor" fill={CHART_COLORS.azulMarinho} radius={[4, 4, 0, 0]} name="Valor" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Nenhum pedido cadastrado
              </div>
            )}
          </div>
        </ModuleCard>

        {/* OPs por Setor */}
        <ModuleCard title="OPs Ativas por Setor" variant="cip">
          <div className="h-64">
            {kpis.setoresProducao.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.setoresProducao} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis type="category" dataKey="nome" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={110} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [value, 'OPs']}
                  />
                  <Bar dataKey="opsAtivas" fill={CHART_COLORS.laranja} radius={[0, 4, 4, 0]} name="OPs Ativas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Cadastre setores no CIP para ver aqui
              </div>
            )}
          </div>
        </ModuleCard>

        {/* Resumo Executivo */}
        <ModuleCard title="Resumo Executivo" variant="cig">
          <div className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold text-foreground">{kpis.totalPedidos}</p>
                <p className="text-xs text-success mt-1">{kpis.pedidosFinalizados} finalizados</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">OPs Geradas</p>
                <p className="text-2xl font-bold text-foreground">{kpis.totalOPs}</p>
                <p className="text-xs text-cip mt-1">{kpis.opsEmProducao} em curso</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Horas em Carteira</p>
                <p className="text-2xl font-bold text-foreground">{kpis.horasCarteira.toFixed(0)}h</p>
                <p className="text-xs text-warning mt-1">≈ {Math.ceil(kpis.horasCarteira / 8)} dias úteis</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Setores Ativos</p>
                <p className="text-2xl font-bold text-foreground">{kpis.totalSetores}</p>
                <p className="text-xs text-primary mt-1">Produção sequencial</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-cig/10 border border-cig/30">
              <p className="text-xs font-medium text-foreground">
                {kpis.pedidosAguardando > 0
                  ? `⚠ ${kpis.pedidosAguardando} pedido(s) aguardando programação no CIP`
                  : kpis.totalPedidos === 0
                    ? '📭 Nenhum pedido cadastrado. Inicie pelo módulo CIV.'
                    : '✅ Todos os pedidos estão programados ou em produção'}
              </p>
            </div>
          </div>
        </ModuleCard>
      </div>
    </div>
  );
}
