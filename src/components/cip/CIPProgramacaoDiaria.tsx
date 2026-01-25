import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ordensProducao, capacidadeDiaria, FOLGA_PRODUCAO, cipKPIs, calcularDiasEquivalentes, getStatusCor } from '@/data/cipData';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Calendar, Clock, AlertTriangle, CheckCircle, Plus, Filter,
  ArrowUpDown, Factory, Package, Truck, Ban
} from 'lucide-react';

const statusConfig = {
  aguardando: { label: 'Aguardando', color: '#f59e0b', icon: Clock },
  em_producao: { label: 'Em Produção', color: '#3b82f6', icon: Factory },
  concluido: { label: 'Concluído', color: '#22c55e', icon: CheckCircle },
  atrasado: { label: 'Atrasado', color: '#ef4444', icon: AlertTriangle },
  bloqueado: { label: 'Bloqueado', color: '#dc2626', icon: Ban },
};

const origemConfig = {
  manual: { label: 'Manual', color: '#8b5cf6' },
  pcp: { label: 'PCP', color: '#3b82f6' },
  erp: { label: 'ERP', color: '#22c55e' },
  sap: { label: 'SAP', color: '#f97316' },
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: '#6b7280' },
  normal: { label: 'Normal', color: '#3b82f6' },
  alta: { label: 'Alta', color: '#f59e0b' },
  urgente: { label: 'Urgente', color: '#ef4444' },
};

export function CIPProgramacaoDiaria() {
  const [filtroData, setFiltroData] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  
  // Cálculos de capacidade
  const capacidadeLiquida = cipKPIs.capacidadeTotal * (1 - FOLGA_PRODUCAO);
  const ocupacaoAtual = (cipKPIs.capacidadeUtilizada / capacidadeLiquida) * 100;
  const horasRestantes = capacidadeLiquida - cipKPIs.capacidadeUtilizada;
  const diasRestantes = calcularDiasEquivalentes(horasRestantes);
  
  // Status geral
  const statusGeral = getStatusCor(ocupacaoAtual);
  
  const opsFiltradas = ordensProducao.filter(op => {
    if (filtroStatus && op.status !== filtroStatus) return false;
    if (filtroData && op.dataProgramada !== filtroData) return false;
    return true;
  });

  const chartCapacidade = capacidadeDiaria.map(d => ({
    dia: new Date(d.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
    ocupacao: d.ocupacaoPercentual,
    limite: 85,
    status: d.status,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicador Principal de Capacidade - OBRIGATÓRIO */}
      <div className={`p-6 rounded-lg border-2 ${
        statusGeral === 'verde' ? 'bg-green-500/10 border-green-500/50' :
        statusGeral === 'amarelo' ? 'bg-amber-500/10 border-amber-500/50' :
        'bg-red-500/10 border-red-500/50'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
              statusGeral === 'verde' ? 'bg-green-500 text-white' :
              statusGeral === 'amarelo' ? 'bg-amber-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {statusGeral === 'verde' ? '🟢' : statusGeral === 'amarelo' ? '🟡' : '🔴'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Capacidade Produtiva</h3>
              <p className={`text-sm ${
                statusGeral === 'verde' ? 'text-green-400' :
                statusGeral === 'amarelo' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {statusGeral === 'verde' ? 'Dentro da capacidade - Aceita novos pedidos' :
                 statusGeral === 'amarelo' ? 'Próximo do limite - Avaliar com cuidado' :
                 'Capacidade excedida - BLOQUEADO para novos pedidos'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xs text-muted-foreground">OCUPAÇÃO</p>
              <p className="text-3xl font-bold text-foreground">{ocupacaoAtual.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">HORAS LIVRES</p>
              <p className="text-3xl font-bold text-cip">{horasRestantes.toFixed(0)}h</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">DIAS LIVRES</p>
              <p className="text-3xl font-bold text-cip">{diasRestantes} dias</p>
            </div>
          </div>
        </div>
        
        {/* Barra de Progresso */}
        <div className="mt-4">
          <div className="h-4 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                statusGeral === 'verde' ? 'bg-green-500' :
                statusGeral === 'amarelo' ? 'bg-amber-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, ocupacaoAtual)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0%</span>
            <span className="text-amber-500">70%</span>
            <span className="text-red-500">85%</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* Folga Fixa */}
        <div className="mt-4 p-3 bg-secondary/50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            ⚠️ Folga fixa de <strong className="text-cip">{(FOLGA_PRODUCAO * 100).toFixed(0)}%</strong> já descontada da capacidade total
          </span>
          <Badge variant="outline">Não editável</Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="OPs Programadas"
          value={ordensProducao.length}
          subtitle="Hoje + próximos dias"
          icon={<Calendar className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Em Produção"
          value={ordensProducao.filter(o => o.status === 'em_producao').length}
          subtitle="Ativas agora"
          icon={<Factory className="h-5 w-5" />}
          trend="up"
          trendValue="Normal"
          variant="cip"
        />
        <KPICard
          title="Bloqueadas"
          value={ordensProducao.filter(o => o.status === 'bloqueado').length}
          subtitle="Aguardando material"
          icon={<Ban className="h-5 w-5" />}
          trend="down"
          trendValue="Atenção"
          variant="cip"
        />
        <KPICard
          title="Eficiência Média"
          value={`${cipKPIs.eficienciaMedia}%`}
          subtitle="Produtividade"
          icon={<CheckCircle className="h-5 w-5" />}
          variant="cip"
        />
      </div>

      {/* Gráfico de Ocupação */}
      <ModuleCard title="Ocupação Programada por Dia" variant="cip">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartCapacidade}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#333' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, 'Ocupação']} />
              <Bar dataKey="ocupacao" radius={[4, 4, 0, 0]} barSize={40}>
                {chartCapacidade.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.status === 'verde' ? '#22c55e' :
                      entry.status === 'amarelo' ? '#f59e0b' :
                      '#ef4444'
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ModuleCard>

      {/* Filtros e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select 
            className="px-3 py-2 bg-secondary border border-border rounded-md text-sm"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <Input 
            type="date" 
            className="w-auto"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
          />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>
        <Button className="bg-cip hover:bg-cip/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nova OP
        </Button>
      </div>

      {/* Tabela de OPs */}
      <ModuleCard title="Carga Diária Programada" variant="cip">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">OP</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Produto</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Qtd</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Data Prog.</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prazo</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Setor</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Origem</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Prioridade</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Horas</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Dias</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {opsFiltradas.map((op) => {
                const StatusIcon = statusConfig[op.status].icon;
                const diasNecessarios = calcularDiasEquivalentes(op.horasNecessarias);
                
                return (
                  <tr key={op.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-foreground">{op.op}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-foreground font-medium">{op.produto}</p>
                        <p className="text-xs text-muted-foreground">{op.descricao}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-foreground font-semibold">{op.quantidade}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      {new Date(op.dataProgramada).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-center text-foreground">
                      {new Date(op.prazoEntrega).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{op.setor}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge style={{ backgroundColor: origemConfig[op.origem].color + '20', color: origemConfig[op.origem].color, border: `1px solid ${origemConfig[op.origem].color}` }}>
                        {origemConfig[op.origem].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge style={{ backgroundColor: prioridadeConfig[op.prioridade].color + '20', color: prioridadeConfig[op.prioridade].color }}>
                        {prioridadeConfig[op.prioridade].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-foreground">{op.horasNecessarias.toFixed(1)}h</div>
                      <div className="text-xs text-muted-foreground">{op.horasRealizadas.toFixed(1)}h feito</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-cip">
                      {diasNecessarios}d
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <StatusIcon className="h-4 w-4" style={{ color: statusConfig[op.status].color }} />
                        <Badge style={{ backgroundColor: statusConfig[op.status].color, color: '#fff' }}>
                          {statusConfig[op.status].label}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ModuleCard>

      {/* Legenda */}
      <div className="p-4 bg-secondary/30 rounded-lg">
        <p className="text-sm text-muted-foreground mb-3">Legenda de Status:</p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: config.color }} />
                <span className="text-xs" style={{ color: config.color }}>{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
