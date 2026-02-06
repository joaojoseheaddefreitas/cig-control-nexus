import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend, ComposedChart,
} from 'recharts';
import { executiveKPIs, chartData, modules, sectors } from '@/data/cigData';
import { ModuleCard } from '@/components/ui/ModuleCard';
import {
  LayoutDashboard, TrendingUp, Factory, Package, Wallet, Clock, 
  Target, AlertTriangle, ArrowUpRight, ArrowDownRight,
  DollarSign, BarChart3, Activity, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Cores da paleta obrigatória (sem roxo)
const CHART_COLORS = {
  azulMarinho: 'hsl(215, 75%, 48%)',
  verde: 'hsl(145, 70%, 42%)',
  amarelo: 'hsl(45, 95%, 50%)',
  vermelho: 'hsl(0, 72%, 51%)',
  laranja: 'hsl(30, 90%, 50%)',
  azulClaro: 'hsl(200, 75%, 50%)',
};

// Identificar o principal gargalo
const identificarGargaloPrincipal = () => {
  const gargalos = sectors.filter(s => s.lotacao < 0 || s.lotacao > 95);
  if (gargalos.length === 0) return null;
  
  // Encontrar o setor com maior déficit (menor lotação)
  const piorGargalo = gargalos.reduce((prev, curr) => 
    curr.lotacao < prev.lotacao ? curr : prev
  );
  
  return {
    setor: piorGargalo.nome,
    lotacao: piorGargalo.lotacao,
    impacto: piorGargalo.lotacao < 0 ? 'CRÍTICO' : 'ALTO',
    horasDeficit: Math.abs(piorGargalo.horasNecessarias - piorGargalo.horasDisponiveis).toFixed(1)
  };
};

// Calcular tendência financeira
const calcularTendenciaFinanceira = () => {
  const ultimoMes = chartData.fluxoCaixa[chartData.fluxoCaixa.length - 1];
  const penultimoMes = chartData.fluxoCaixa[chartData.fluxoCaixa.length - 2];
  
  const saldoAtual = ultimoMes.entradas - ultimoMes.saidas;
  const saldoAnterior = penultimoMes.entradas - penultimoMes.saidas;
  
  if (saldoAtual > saldoAnterior * 1.05) return 'positiva';
  if (saldoAtual < saldoAnterior * 0.95) return 'negativa';
  return 'neutra';
};

// Verificar se há problema crítico para IA
const verificarProblemaCritico = () => {
  const gargalo = identificarGargaloPrincipal();
  const tendencia = calcularTendenciaFinanceira();
  const capacidadeGlobal = executiveKPIs.cig.lotacaoGeral;
  
  // IA só se manifesta em problemas críticos
  if (gargalo && gargalo.lotacao < -100) {
    return { tipo: 'gargalo', mensagem: `Gargalo crítico em ${gargalo.setor}`, impacto: 'Capacidade comprometida' };
  }
  if (tendencia === 'negativa' && executiveKPIs.cif.margemLiquida < 15) {
    return { tipo: 'financeiro', mensagem: 'Margem em queda', impacto: 'Resultado operacional' };
  }
  if (capacidadeGlobal < 60) {
    return { tipo: 'capacidade', mensagem: 'Capacidade global baixa', impacto: 'Prazos de entrega' };
  }
  return null;
};

interface DashboardCIGMelhoradoProps {
  onGoHome?: () => void;
}

export function DashboardCIGMelhorado({ onGoHome }: DashboardCIGMelhoradoProps) {
  const gargaloPrincipal = identificarGargaloPrincipal();
  const tendenciaFinanceira = calcularTendenciaFinanceira();
  const problemaCritico = verificarProblemaCritico();

  // Dados para gráfico de produção x meta
  const producaoMeta = [
    { mes: 'Jan', producao: 145000, meta: 150000 },
    { mes: 'Fev', producao: 158000, meta: 155000 },
    { mes: 'Mar', producao: 172000, meta: 160000 },
    { mes: 'Abr', producao: 168000, meta: 165000 },
    { mes: 'Mai', producao: 175000, meta: 170000 },
    { mes: 'Jun', producao: 182000, meta: 175000 },
  ];

  // Dados para vendas x meta
  const vendasMeta = chartData.faturamentoPeriodo;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header Executivo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            Dashboard Executivo
          </h2>
          <p className="text-muted-foreground mt-1 ml-13">
            Visão consolidada • Sem ações operacionais
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

      {/* IA - Alerta Discreto (só aparece se houver problema crítico) */}
      {problemaCritico && (
        <div className="p-4 rounded-xl border-2 border-destructive/50 bg-destructive/10 animate-pulse-critical">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-destructive">⚠ IA: {problemaCritico.mensagem}</p>
              <p className="text-xs text-muted-foreground">Impacto: {problemaCritico.impacto}</p>
            </div>
          </div>
        </div>
      )}

      {/* KPIs Principais - Grid 5 colunas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Capacidade Global % */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cig/20 to-cig/5 border border-cig/30 hover:border-cig/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 text-cig" />
            <span className="text-xs text-muted-foreground">CAPACIDADE</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{executiveKPIs.cig.lotacaoGeral}%</p>
          <p className="text-xs text-muted-foreground mt-1">Capacidade Global</p>
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-cig rounded-full transition-all"
              style={{ width: `${executiveKPIs.cig.lotacaoGeral}%` }}
            />
          </div>
        </div>

        {/* Estoque Geral */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cic/20 to-cic/5 border border-cic/30 hover:border-cic/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-5 w-5 text-cic" />
            <span className={cn(
              "text-xs flex items-center gap-1",
              executiveKPIs.cic.materiaisCriticos > 10 ? "text-destructive" : "text-success"
            )}>
              {executiveKPIs.cic.materiaisCriticos > 10 ? (
                <><ArrowDownRight className="h-3 w-3" />Atenção</>
              ) : (
                <><ArrowUpRight className="h-3 w-3" />OK</>
              )}
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">R$ {(executiveKPIs.cic.estoqueTotal / 1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground mt-1">Estoque Geral</p>
          <p className="text-xs text-warning mt-1">{executiveKPIs.cic.materiaisCriticos} críticos</p>
        </div>

        {/* RESULTADO FINANCEIRO - Destaque Principal */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-success/30 to-success/10 border-2 border-success/50 hover:border-success transition-all relative overflow-hidden lg:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-success/10 rounded-full -mr-10 -mt-10" />
          <div className="flex items-center justify-between mb-2 relative">
            <DollarSign className="h-6 w-6 text-success" />
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded",
              tendenciaFinanceira === 'positiva' && "bg-success/20 text-success",
              tendenciaFinanceira === 'negativa' && "bg-destructive/20 text-destructive",
              tendenciaFinanceira === 'neutra' && "bg-warning/20 text-warning"
            )}>
              {tendenciaFinanceira === 'positiva' && '↑ POSITIVA'}
              {tendenciaFinanceira === 'negativa' && '↓ NEGATIVA'}
              {tendenciaFinanceira === 'neutra' && '→ NEUTRA'}
            </span>
          </div>
          <p className="text-3xl font-bold text-success relative">R$ {(executiveKPIs.cif.resultadoOperacional / 1000).toFixed(1)}k</p>
          <p className="text-xs text-foreground font-medium mt-1">Resultado Financeiro</p>
          <p className="text-xs text-success mt-1">Margem: {executiveKPIs.cif.margemLiquida}%</p>
        </div>

        {/* Produção Mensal */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cip/20 to-cip/5 border border-cip/30 hover:border-cip/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Factory className="h-5 w-5 text-cip" />
            <span className="text-xs text-success flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />+4.5%
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">R$ {(executiveKPIs.cip.producaoDiaria).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Produção Diária</p>
          <p className="text-xs text-cip mt-1">Meta: R$ 40.000</p>
        </div>

        {/* Vendas Mensais */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-civ/20 to-civ/5 border border-civ/30 hover:border-civ/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-civ" />
            <span className="text-xs text-success flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />+6.7%
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">R$ {(executiveKPIs.civ.faturamentoTotal / 1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground mt-1">Vendas Mensais</p>
          <p className="text-xs text-civ mt-1">Meta: R$ {(executiveKPIs.civ.metaMensal / 1000).toFixed(0)}k</p>
        </div>
      </div>

      {/* Gargalo Principal - Consolidado Executivo */}
      {gargaloPrincipal && (
        <div className={cn(
          "p-4 rounded-xl border-2 flex items-center gap-4",
          gargaloPrincipal.impacto === 'CRÍTICO' 
            ? "bg-destructive/10 border-destructive/50" 
            : "bg-warning/10 border-warning/50"
        )}>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            gargaloPrincipal.impacto === 'CRÍTICO' ? "bg-destructive/20" : "bg-warning/20"
          )}>
            <AlertTriangle className={cn(
              "h-6 w-6",
              gargaloPrincipal.impacto === 'CRÍTICO' ? "text-destructive" : "text-warning"
            )} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">PRINCIPAL GARGALO PRODUTIVO</p>
            <p className="text-lg font-bold text-foreground">{gargaloPrincipal.setor}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span>Déficit: <strong className="text-destructive">{gargaloPrincipal.horasDeficit}h</strong></span>
              <span>Impacto: <strong className={gargaloPrincipal.impacto === 'CRÍTICO' ? 'text-destructive' : 'text-warning'}>{gargaloPrincipal.impacto}</strong></span>
              <span>Afeta: <strong>Capacidade e Prazo</strong></span>
            </div>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-bold",
            gargaloPrincipal.impacto === 'CRÍTICO' 
              ? "bg-destructive text-destructive-foreground" 
              : "bg-warning text-warning-foreground"
          )}>
            {gargaloPrincipal.impacto}
          </div>
        </div>
      )}

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produção Mensal x Meta */}
        <ModuleCard title="Produção Mensal x Meta" variant="cip">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={producaoMeta}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} 
                  formatter={(value: number, name: string) => [`R$ ${(value / 1000).toFixed(0)}k`, name === 'producao' ? 'Produção' : 'Meta']} 
                />
                <Legend />
                <Bar dataKey="producao" fill={CHART_COLORS.laranja} name="Produção" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="meta" stroke={CHART_COLORS.azulMarinho} strokeWidth={2} strokeDasharray="5 5" name="Meta" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Vendas Mensais x Meta */}
        <ModuleCard title="Vendas Mensais x Meta" variant="civ">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={vendasMeta}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} 
                  formatter={(value: number, name: string) => [`R$ ${(value / 1000).toFixed(0)}k`, name === 'valor' ? 'Vendas' : 'Meta']} 
                />
                <Legend />
                <Bar dataKey="valor" fill={CHART_COLORS.verde} name="Vendas" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="meta" stroke={CHART_COLORS.azulMarinho} strokeWidth={2} strokeDasharray="5 5" name="Meta" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Fluxo de Caixa - CIF Consolidado */}
        <ModuleCard title="CIF - Resultado Financeiro Consolidado" variant="cif">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="semana" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} 
                  formatter={(value: number) => [`R$ ${(value / 1000).toFixed(0)}k`, '']} 
                />
                <Legend />
                <Bar dataKey="entradas" fill={CHART_COLORS.verde} name="Entradas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill={CHART_COLORS.vermelho} name="Saídas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Tendência visual */}
          <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tendência:</span>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold",
              tendenciaFinanceira === 'positiva' && "bg-success/20 text-success",
              tendenciaFinanceira === 'negativa' && "bg-destructive/20 text-destructive",
              tendenciaFinanceira === 'neutra' && "bg-warning/20 text-warning"
            )}>
              {tendenciaFinanceira === 'positiva' && <><ArrowUpRight className="h-4 w-4" /> Positiva</>}
              {tendenciaFinanceira === 'negativa' && <><ArrowDownRight className="h-4 w-4" /> Negativa</>}
              {tendenciaFinanceira === 'neutra' && <><Target className="h-4 w-4" /> Neutra</>}
            </div>
          </div>
        </ModuleCard>

        {/* Materiais Críticos */}
        <ModuleCard title="CIC - Estoque de Materiais Críticos" variant="cic">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.materiaisCriticos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis type="category" dataKey="material" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="estoque" fill={CHART_COLORS.azulClaro} name="Estoque Atual" radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="minimo" fill={CHART_COLORS.amarelo} name="Estoque Mínimo" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>
    </div>
  );
}