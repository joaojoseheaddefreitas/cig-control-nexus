import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Activity, Calendar, TrendingUp, AlertTriangle, CheckCircle, Factory, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calcularCapacidadeFabrica, type CapacidadeFabrica } from '@/services/capacidadeIndustrialService';

export function CIPCapacidade() {
  const [data, setData] = useState<CapacidadeFabrica | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const result = await calcularCapacidadeFabrica();
    setData(result);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" /> Calculando capacidade...
      </div>
    );
  }

  const chartSetores = data.setores
    .filter(s => s.horas_disponiveis_mensal > 0)
    .sort((a, b) => a.horas_disponiveis_mensal - b.horas_disponiveis_mensal)
    .map(s => ({
      setor: s.nome.substring(0, 14),
      disponivel: Number(s.horas_disponiveis_mensal.toFixed(1)),
      ocupado: Number(s.horas_ocupadas.toFixed(1)),
      livre: Number(Math.max(0, s.horas_disponiveis_mensal - s.horas_ocupadas).toFixed(1)),
      carga: s.carga_percent,
    }));

  const statusOcupacao = data.percentualOcupacao >= 85 ? 'vermelho' : data.percentualOcupacao >= 60 ? 'amarelo' : 'verde';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="h-6 w-6 text-cip" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Capacidade Produtiva</h2>
            <p className="text-sm text-muted-foreground">Dados reais do banco — Setor gargalo define a capacidade</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Atualizar
        </Button>
      </div>

      {/* Painel Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 p-6 bg-card/50 border border-border/50 rounded-lg">
          <h3 className="text-lg font-bold text-foreground mb-4">Visão Geral — Gargalo: {data.setorGargalo}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">CAPACIDADE FÁBRICA</p>
              <p className="text-3xl font-bold text-foreground">{data.capacidadeFabrica.toFixed(0)}h</p>
              <p className="text-sm text-muted-foreground">Mensal (gargalo)</p>
            </div>
            <div className="text-center p-4 bg-cip/10 border border-cip/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">HORAS NECESSÁRIAS</p>
              <p className="text-3xl font-bold text-cip">{data.horasNecessarias.toFixed(0)}h</p>
              <p className="text-sm text-cip">Carteira aberta</p>
            </div>
            <div className={cn("text-center p-4 rounded-lg border",
              data.saldoHoras >= 0 ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
            )}>
              <p className="text-xs text-muted-foreground mb-1">SALDO</p>
              <p className={cn("text-3xl font-bold", data.saldoHoras >= 0 ? "text-success" : "text-destructive")}>
                {data.saldoHoras.toFixed(0)}h
              </p>
              <p className={cn("text-sm", data.saldoHoras >= 0 ? "text-success" : "text-destructive")}>
                {data.saldoHoras >= 0 ? 'Folga' : 'Déficit'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Ocupação da Fábrica</span>
              <span className={cn("font-semibold",
                statusOcupacao === 'vermelho' ? 'text-destructive' :
                statusOcupacao === 'amarelo' ? 'text-warning' : 'text-success'
              )}>{data.percentualOcupacao}%</span>
            </div>
            <div className="h-6 bg-secondary rounded-full overflow-hidden">
              <div className={cn("h-full transition-all rounded-full",
                statusOcupacao === 'vermelho' ? 'bg-destructive' :
                statusOcupacao === 'amarelo' ? 'bg-warning' : 'bg-cip'
              )} style={{ width: `${Math.min(data.percentualOcupacao, 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
              <span>Necessário: {data.horasNecessarias.toFixed(0)}h</span>
              <span>Capacidade: {data.capacidadeFabrica.toFixed(0)}h</span>
            </div>
          </div>
        </div>

        {/* Side indicators */}
        <div className="space-y-4">
          <div className={cn("p-4 rounded-lg border",
            data.saldoHoras >= 0 ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
          )}>
            <div className="flex items-center gap-3">
              {data.saldoHoras >= 0 ? <CheckCircle className="h-8 w-8 text-success" /> : <AlertTriangle className="h-8 w-8 text-destructive" />}
              <div>
                <p className="text-sm text-muted-foreground">{data.saldoHoras >= 0 ? 'Aceita novos pedidos' : 'Capacidade excedida'}</p>
                <p className={cn("text-xl font-bold", data.saldoHoras >= 0 ? "text-success" : "text-destructive")}>
                  {Math.abs(data.saldoHoras).toFixed(0)}h {data.saldoHoras >= 0 ? 'livres' : 'excedentes'}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Gargalo</p>
                <p className="text-lg font-bold text-warning">{data.setorGargalo}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-secondary/50 border border-border/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Dias Necessários</p>
                <p className="text-xl font-bold text-foreground">{data.diasNecessarios} dias</p>
                <p className="text-xs text-muted-foreground">{data.capacidadeDiaria.toFixed(1)}h/dia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard title="Horas Necessárias" value={`${data.horasNecessarias.toFixed(0)}h`} subtitle="Carteira aberta" icon={<Clock className="h-5 w-5" />} variant="cip" />
        <KPICard title="Horas Disponíveis" value={`${data.capacidadeFabrica.toFixed(0)}h`} subtitle={`Gargalo: ${data.setorGargalo}`} icon={<Activity className="h-5 w-5" />} variant="cip" />
        <KPICard title="Saldo" value={`${data.saldoHoras.toFixed(0)}h`} subtitle={data.saldoHoras >= 0 ? 'Folga' : 'Déficit'} icon={<TrendingUp className="h-5 w-5" />} variant="cip" trend={data.saldoHoras >= 0 ? 'up' : 'down'} trendValue={data.saldoHoras >= 0 ? 'OK' : 'Crítico'} />
        <KPICard title="Ocupação" value={`${data.percentualOcupacao}%`} subtitle="% da capacidade" icon={<Factory className="h-5 w-5" />} variant="cip" />
        <KPICard title="Dias Necessários" value={`${data.diasNecessarios}d`} subtitle={`${data.diasUteis} dias úteis/mês`} icon={<Calendar className="h-5 w-5" />} variant="cip" />
      </div>

      {/* Chart: Capacity by Sector */}
      <ModuleCard title="Capacidade por Setor — Menor = Gargalo" variant="cip">
        <div className="h-80">
          {chartSetores.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartSetores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis type="category" dataKey="setor" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value}h`, '']} />
                <Legend />
                <Bar dataKey="ocupado" stackId="a" fill="hsl(var(--warning))" name="Ocupado" />
                <Bar dataKey="livre" stackId="a" fill="hsl(var(--success))" name="Livre" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados cadastrados – insira setores para iniciar o monitoramento.
            </div>
          )}
        </div>
      </ModuleCard>

      {/* Tabela detalhada */}
      <ModuleCard title="Detalhamento por Setor" variant="cip">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="text-left py-3 px-3 text-xs text-muted-foreground">Setor</th>
                <th className="text-center py-3 px-2 text-xs text-muted-foreground">Equipe</th>
                <th className="text-center py-3 px-2 text-xs text-muted-foreground">Máq.</th>
                <th className="text-center py-3 px-2 text-xs text-muted-foreground">H/Dia</th>
                <th className="text-center py-3 px-2 text-xs text-muted-foreground">Efic.</th>
                <th className="text-center py-3 px-2 text-xs text-muted-foreground">Dias Úteis</th>
                <th className="text-right py-3 px-2 text-xs text-muted-foreground">Cap. Mensal</th>
                <th className="text-right py-3 px-2 text-xs text-muted-foreground">Ocupado</th>
                <th className="text-center py-3 px-2 text-xs text-muted-foreground">Carga</th>
                <th className="text-center py-3 px-2 text-xs text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.setores.map(s => {
                const isGargalo = s.nome === data.setorGargalo;
                return (
                  <tr key={s.id} className={cn("border-b border-border/30 hover:bg-secondary/30",
                    isGargalo && "bg-warning/5 border-l-2 border-l-warning"
                  )}>
                    <td className="py-2 px-3 font-medium text-foreground text-xs">
                      {s.nome} {isGargalo && <Badge className="ml-1 bg-warning/20 text-warning text-[9px]">GARGALO</Badge>}
                    </td>
                    <td className="py-2 px-2 text-center text-xs">{s.mao_de_obra}</td>
                    <td className="py-2 px-2 text-center text-xs">{s.maquinas_automaticas}</td>
                    <td className="py-2 px-2 text-center text-xs">{s.horas_turno}h</td>
                    <td className="py-2 px-2 text-center text-xs">{Math.round(s.eficiencia * 100)}%</td>
                    <td className="py-2 px-2 text-center text-xs">{s.dias_uteis_mensais}d</td>
                    <td className="py-2 px-2 text-right font-semibold text-xs text-cip">{s.horas_disponiveis_mensal.toFixed(0)}h</td>
                    <td className="py-2 px-2 text-right text-xs">{s.horas_ocupadas.toFixed(1)}h</td>
                    <td className="py-2 px-2 text-center">
                      <span className={cn("font-bold text-xs",
                        s.carga_percent >= 80 ? "text-destructive" :
                        s.carga_percent >= 60 ? "text-warning" : "text-success"
                      )}>{s.carga_percent}%</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      {s.carga_percent >= 80 ? '🔴' : s.carga_percent >= 60 ? '🟡' : '🟢'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      {/* Info */}
      <div className="p-4 bg-cip/10 border border-cip/30 rounded-lg">
        <p className="text-sm text-cip">
          ℹ️ A capacidade da fábrica é definida pelo setor de menor capacidade (gargalo: <strong>{data.setorGargalo}</strong>).
          Fórmula: (Equipe + Máquinas) × Horas/Dia × Eficiência × Dias Úteis.
          Ocupação = Horas Necessárias ÷ Capacidade Gargalo × 100.
        </p>
      </div>
    </div>
  );
}
