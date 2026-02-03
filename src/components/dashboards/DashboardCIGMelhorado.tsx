import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend, ComposedChart,
} from 'recharts';
import { executiveKPIs, chartData, modules } from '@/data/cigData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  LayoutDashboard, TrendingUp, Factory, Package, Wallet, Users, Clock, 
  Target, Activity, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Truck, FileText, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6'];

// Alertas do sistema
const alertas = [
  { id: 1, tipo: 'critico', modulo: 'CIP', mensagem: 'Setor Encapar Alm. com sobrecarga', tempo: '5 min' },
  { id: 2, tipo: 'atencao', modulo: 'CIC', mensagem: '12 materiais abaixo do mínimo', tempo: '15 min' },
  { id: 3, tipo: 'info', modulo: 'CIV', mensagem: '3 pedidos aguardando programação', tempo: '30 min' },
];

// Pedidos em destaque
const pedidosDestaque = [
  { id: 'PED-2001', cliente: 'Móveis Silva', status: 'em_producao', progresso: 65, valor: 12500 },
  { id: 'PED-2002', cliente: 'Loja Conforto', status: 'produzido', progresso: 100, valor: 8900 },
  { id: 'PED-2004', cliente: 'Casa & Estilo', status: 'expedido', progresso: 100, valor: 11200 },
];

const statusColors: Record<string, string> = {
  em_producao: 'text-orange-400',
  produzido: 'text-green-400',
  expedido: 'text-cyan-400',
};

export function DashboardCIGMelhorado() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header com resumo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            Dashboard Executivo
          </h2>
          <p className="text-muted-foreground mt-1 ml-13">
            Visão consolidada de todas as centrais de inteligência
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/30">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-success font-medium">Sistema Online</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Alertas destacados */}
      {alertas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alertas.map((alerta) => (
            <div 
              key={alerta.id}
              className={cn(
                "p-3 rounded-lg border flex items-start gap-3",
                alerta.tipo === 'critico' && "bg-destructive/10 border-destructive/30",
                alerta.tipo === 'atencao' && "bg-warning/10 border-warning/30",
                alerta.tipo === 'info' && "bg-primary/10 border-primary/30"
              )}
            >
              <AlertTriangle className={cn(
                "h-5 w-5 flex-shrink-0 mt-0.5",
                alerta.tipo === 'critico' && "text-destructive",
                alerta.tipo === 'atencao' && "text-warning",
                alerta.tipo === 'info' && "text-primary"
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{alerta.modulo}</span>
                  <span className="text-xs text-muted-foreground">• {alerta.tempo}</span>
                </div>
                <p className="text-sm text-foreground truncate">{alerta.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPIs Executivos - Grid destacado */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-cig/20 to-cig/5 border border-cig/30 hover:border-cig/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-cig" />
            <span className="text-xs text-success flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />+2.3%
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{executiveKPIs.cig.lotacaoGeral}%</p>
          <p className="text-xs text-muted-foreground">Lotação Geral</p>
          <p className="text-xs text-cig mt-1">{executiveKPIs.cig.operadoresTotal} operadores</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-civ/20 to-civ/5 border border-civ/30 hover:border-civ/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-civ" />
            <span className="text-xs text-success flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />+6.7%
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">R$ {(executiveKPIs.civ.faturamentoTotal / 1000).toFixed(1)}k</p>
          <p className="text-xs text-muted-foreground">Faturamento Mensal</p>
          <p className="text-xs text-civ mt-1">Meta: R$ {(executiveKPIs.civ.metaMensal / 1000).toFixed(0)}k</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-cip/20 to-cip/5 border border-cip/30 hover:border-cip/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Factory className="h-5 w-5 text-cip" />
            <span className="text-xs text-muted-foreground">Estável</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{executiveKPIs.cip.disponibilidade}%</p>
          <p className="text-xs text-muted-foreground">Capacidade Produtiva</p>
          <p className="text-xs text-cip mt-1">{executiveKPIs.cip.capacidadeTotal.toFixed(0)}h disponíveis</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-cic/20 to-cic/5 border border-cic/30 hover:border-cic/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-5 w-5 text-cic" />
            <span className="text-xs text-destructive flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3" />Atenção
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{executiveKPIs.cic.materiaisCriticos}</p>
          <p className="text-xs text-muted-foreground">Materiais Críticos</p>
          <p className="text-xs text-cic mt-1">{executiveKPIs.cic.riscoRuptura} em risco</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-cif/20 to-cif/5 border border-cif/30 hover:border-cif/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="h-5 w-5 text-cif" />
            <span className="text-xs text-success flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />+5.2%
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">R$ {(executiveKPIs.cif.resultadoOperacional / 1000).toFixed(1)}k</p>
          <p className="text-xs text-muted-foreground">Resultado Operacional</p>
          <p className="text-xs text-cif mt-1">Margem: {executiveKPIs.cif.margemLiquida}%</p>
        </div>
      </div>

      {/* Módulos rápidos - navegação visual */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modules.slice(1).map((module) => (
          <div
            key={module.id}
            className={cn(
              "p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105",
              `border-${module.cor}/30 hover:border-${module.cor}/60 bg-${module.cor}/5`
            )}
            style={{
              borderColor: `hsl(var(--${module.cor}) / 0.3)`,
              backgroundColor: `hsl(var(--${module.cor}) / 0.05)`
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `hsl(var(--${module.cor}) / 0.2)` }}
              >
                {module.id === 'CIV' && <TrendingUp className="h-5 w-5" style={{ color: `hsl(var(--${module.cor}))` }} />}
                {module.id === 'CIP' && <Factory className="h-5 w-5" style={{ color: `hsl(var(--${module.cor}))` }} />}
                {module.id === 'CIC' && <Package className="h-5 w-5" style={{ color: `hsl(var(--${module.cor}))` }} />}
                {module.id === 'CIF' && <Wallet className="h-5 w-5" style={{ color: `hsl(var(--${module.cor}))` }} />}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{module.id}</h3>
                <p className="text-xs text-muted-foreground">{module.descricao}</p>
              </div>
            </div>
            <div className="text-right">
              <span 
                className="text-2xl font-bold"
                style={{ color: `hsl(var(--${module.cor}))` }}
              >
                {module.id === 'CIV' && '85%'}
                {module.id === 'CIP' && '73%'}
                {module.id === 'CIC' && '92%'}
                {module.id === 'CIF' && '78%'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento */}
        <ModuleCard title="CIV - Faturamento por Período" variant="civ" action={{ label: 'Ver CIV', onClick: () => {} }}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.faturamentoPeriodo}>
                <defs>
                  <linearGradient id="colorValorCig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--civ))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--civ))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']} />
                <Area type="monotone" dataKey="valor" stroke="hsl(var(--civ))" strokeWidth={2} fill="url(#colorValorCig)" />
                <Line type="monotone" dataKey="meta" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Lotação por Setor */}
        <ModuleCard title="CIP - Lotação por Setor" variant="cip" action={{ label: 'Ver CIP', onClick: () => {} }}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.lotacaoPorSetor.slice(0, 8)} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="setor" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Lotação']} />
                <Bar dataKey="lotacao" fill="hsl(var(--cip))" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Materiais Críticos */}
        <ModuleCard title="CIC - Estoque de Materiais Críticos" variant="cic" action={{ label: 'Ver CIC', onClick: () => {} }}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.materiaisCriticos}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="material" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="estoque" fill="hsl(var(--cic))" name="Estoque Atual" radius={[4, 4, 0, 0]} />
                <Bar dataKey="minimo" fill="hsl(var(--muted-foreground))" name="Estoque Mínimo" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Fluxo de Caixa */}
        <ModuleCard title="CIF - Fluxo de Caixa Semanal" variant="cif" action={{ label: 'Ver CIF', onClick: () => {} }}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="semana" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                <Legend />
                <Bar dataKey="entradas" fill="hsl(var(--success))" name="Entradas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="hsl(var(--destructive))" name="Saídas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* Pedidos em destaque */}
      <ModuleCard title="Pedidos em Destaque" variant="cig">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pedidosDestaque.map((pedido) => (
            <div key={pedido.id} className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-semibold">{pedido.id}</span>
                <span className={cn("text-xs font-semibold", statusColors[pedido.status])}>
                  {pedido.status === 'em_producao' && 'Em Produção'}
                  {pedido.status === 'produzido' && 'Produzido'}
                  {pedido.status === 'expedido' && 'Expedido'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{pedido.cliente}</p>
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-3">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${pedido.progresso}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold">R$ {(pedido.valor / 1000).toFixed(1)}k</span>
              </div>
            </div>
          ))}
        </div>
      </ModuleCard>
    </div>
  );
}
