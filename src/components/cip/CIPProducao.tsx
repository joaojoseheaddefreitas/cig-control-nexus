import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { ordensProducao, cipKPIs, calcularDiasEquivalentes } from '@/data/cipData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Factory, CheckCircle, Clock, TrendingUp, Package, 
  ArrowDown, ArrowUp, RefreshCw 
} from 'lucide-react';

const producaoPorPeriodo = [
  { periodo: 'Sem 1', produzido: 142, meta: 150 },
  { periodo: 'Sem 2', produzido: 158, meta: 150 },
  { periodo: 'Sem 3', produzido: 145, meta: 150 },
  { periodo: 'Sem 4', produzido: 167, meta: 160 },
];

const baixasRecentes = [
  { op: '2025-001240', produto: 'SOFÁ FLEX', qtd: 5, setor: 'Embalagem', hora: '14:32' },
  { op: '2025-001238', produto: 'MESA FLORENÇA', qtd: 12, setor: 'Montagem', hora: '13:15' },
  { op: '2025-001235', produto: 'CADEIRA BERGAMO', qtd: 50, setor: 'Costura', hora: '11:45' },
  { op: '2025-001232', produto: 'SOFÁ ANCORA', qtd: 2, setor: 'Revestimento', hora: '10:20' },
];

const producaoPorSetor = [
  { setor: 'Montagem', produzido: 45, meta: 50 },
  { setor: 'Revestimento', produzido: 38, meta: 40 },
  { setor: 'Embalagem', produzido: 52, meta: 55 },
  { setor: 'Costura', produzido: 28, meta: 30 },
];

export function CIPProducao() {
  const opsEmProducao = ordensProducao.filter(o => o.status === 'em_producao');
  const opsConcluidas = cipKPIs.opsConcluidas;
  const totalProduzidoHoje = 163;
  const metaDia = 180;
  const percentualMeta = (totalProduzidoHoje / metaDia) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Produzido Hoje"
          value={totalProduzidoHoje}
          subtitle={`Meta: ${metaDia} unidades`}
          icon={<Factory className="h-5 w-5" />}
          trend={percentualMeta >= 90 ? 'up' : 'down'}
          trendValue={`${percentualMeta.toFixed(0)}% da meta`}
          variant="cip"
        />
        <KPICard
          title="OPs em Produção"
          value={opsEmProducao.length}
          subtitle="Ativas agora"
          icon={<RefreshCw className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Baixas do Dia"
          value={baixasRecentes.length}
          subtitle="Registradas"
          icon={<ArrowDown className="h-5 w-5" />}
          trend="up"
          trendValue="+12%"
          variant="cip"
        />
        <KPICard
          title="Concluídas (Mês)"
          value={opsConcluidas}
          subtitle="Ordens finalizadas"
          icon={<CheckCircle className="h-5 w-5" />}
          trend="up"
          trendValue="+8%"
          variant="cip"
        />
      </div>

      {/* Progresso do Dia */}
      <ModuleCard title="Progresso da Produção - Hoje" variant="cip">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-foreground">{totalProduzidoHoje} <span className="text-lg text-muted-foreground">/ {metaDia}</span></p>
              <p className="text-sm text-muted-foreground">unidades produzidas</p>
            </div>
            <div className={`text-4xl font-bold ${percentualMeta >= 90 ? 'text-green-500' : percentualMeta >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
              {percentualMeta.toFixed(0)}%
            </div>
          </div>
          <Progress value={percentualMeta} className="h-4" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0%</span>
            <span className="text-amber-500">70%</span>
            <span className="text-green-500">90%</span>
            <span>100%</span>
          </div>
        </div>
      </ModuleCard>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produção por Período */}
        <ModuleCard title="Produção Semanal" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={producaoPorPeriodo}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="periodo" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="produzido" fill="#22c55e" name="Produzido" radius={[4, 4, 0, 0]} />
                <Bar dataKey="meta" fill="#6b7280" name="Meta" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>

        {/* Produção por Setor */}
        <ModuleCard title="Produção por Setor (Hoje)" variant="cip">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={producaoPorSetor} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis type="category" dataKey="setor" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="produzido" fill="#f97316" name="Produzido" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ModuleCard>
      </div>

      {/* OPs em Produção */}
      <ModuleCard title="Ordens em Produção" variant="cip">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">OP</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Qtd</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Setor Atual</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Progresso</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prazo</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {opsEmProducao.map((op) => {
                const progresso = (op.horasRealizadas / op.horasNecessarias) * 100;
                return (
                  <tr key={op.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-foreground">{op.op}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-foreground font-medium">{op.descricao}</p>
                        <p className="text-xs text-muted-foreground">{op.cliente}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">{op.quantidade}</td>
                    <td className="py-3 px-4 text-muted-foreground">{op.setor}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress value={progresso} className="h-2 flex-1" />
                        <span className="text-xs text-foreground w-10">{progresso.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-foreground">
                      {new Date(op.prazoEntrega).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button size="sm" variant="outline" className="text-xs">
                        <ArrowDown className="h-3 w-3 mr-1" />
                        Baixa
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      {/* Baixas Recentes */}
      <ModuleCard title="Últimas Baixas de Produção" variant="cip">
        <div className="space-y-3">
          {baixasRecentes.map((baixa, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{baixa.produto}</p>
                  <p className="text-xs text-muted-foreground">OP: {baixa.op} | {baixa.setor}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-500">+{baixa.qtd}</p>
                <p className="text-xs text-muted-foreground">{baixa.hora}</p>
              </div>
            </div>
          ))}
        </div>
      </ModuleCard>
    </div>
  );
}
