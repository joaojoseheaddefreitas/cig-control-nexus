import { useState } from 'react';
import { Activity, Clock, Calendar, AlertTriangle, Users, Target, TrendingUp, Gauge, Brain, ChevronDown } from 'lucide-react';
import { cipKPIs, setoresProducao, ordensProducao, FOLGA_PRODUCAO, calcularDiasEquivalentes } from '@/data/cipData';
import { KPICardCIP } from './dashboard/KPICardCIP';
import { SetorCard } from './dashboard/SetorCard';
import { IAAlertCard, IAAlert } from './dashboard/IAAlertCard';
import { PedidoEmExecucaoCard } from './dashboard/PedidoEmExecucaoCard';
import { CargaSetorChart } from './dashboard/CargaSetorChart';
import { ProducaoMensalChart } from './dashboard/ProducaoMensalChart';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

// Calculate derived values
const totalOperadores = setoresProducao.reduce((acc, s) => acc + s.operadores, 0);
const totalMaquinas = setoresProducao.reduce((acc, s) => acc + s.maquinas, 0);
const gargaloSetor = setoresProducao.find(s => s.gargalo);
const saldoGlobalHoras = setoresProducao.reduce((acc, s) => acc + (s.horasDisponiveis - s.horasNecessarias), 0);
const eficienciaMedia = setoresProducao.reduce((acc, s) => acc + s.eficiencia, 0) / setoresProducao.length;

// MO calculation
const moNecessaria = setoresProducao.reduce((acc, s) => {
  const horasNecessariasDia = s.horasNecessarias / 8;
  return acc + horasNecessariasDia;
}, 0);

// Chart data
const cargaSetorData = setoresProducao.slice(0, 8).map(s => ({
  setor: s.nome.length > 12 ? s.nome.substring(0, 10) + '...' : s.nome,
  carga: Math.round(s.lotacao),
  status: s.status,
}));

const producaoMensalData = [
  { mes: 'Jan', realizado: 285000, meta: 300000 },
  { mes: 'Fev', realizado: 310000, meta: 300000 },
  { mes: 'Mar', realizado: 275000, meta: 320000 },
  { mes: 'Abr', realizado: 340000, meta: 350000 },
  { mes: 'Mai', realizado: 380000, meta: 400000 },
  { mes: 'Jun', realizado: 355000, meta: 450000 },
];

// IA Alerts
const iaAlerts: IAAlert[] = [
  {
    id: '1',
    tipo: 'gargalo',
    prioridade: 'alta',
    mensagem: `GARGALO DETECTADO: ${gargaloSetor?.nome || 'Corte Tecido'} com carga de ${gargaloSetor?.lotacao || 53}%. Déficit de -143h. Adicionar +1 operadores eliminaria o atraso.`,
    setor: gargaloSetor?.nome || 'Corte Tecido',
    horario: '18:05',
  },
  {
    id: '2',
    tipo: 'sugestao',
    prioridade: 'alta',
    mensagem: 'Terceirizar costura de 15 sofás cantos eliminaria o gargalo imediatamente. Custo estimado: R$ 4.500.',
    setor: 'Costura',
    horario: '17:35',
  },
  {
    id: '3',
    tipo: 'otimizacao',
    prioridade: 'media',
    mensagem: 'Embalagem com capacidade ociosa (excluída da carga). Realocar 1 auxiliar para Montagem aumenta produção em 8%.',
    setor: 'Embalagem',
    horario: '17:05',
  },
];

// Pedidos em execução
const pedidosEmExecucao = ordensProducao
  .filter(op => op.status === 'em_producao' || op.status === 'atrasado')
  .slice(0, 4)
  .map((op, i) => ({
    codigo: `PED-${1847 - i}`,
    produto: op.descricao,
    cliente: op.cliente || 'Cliente',
    progresso: Math.round((op.horasRealizadas / op.horasNecessarias) * 100),
    setorAtual: op.setor,
    status: op.status as 'em_producao' | 'atrasado' | 'aguardando',
    atraso: op.status === 'atrasado' ? 6 : undefined,
  }));

export function CIPDashboardNew() {
  const isMobile = useIsMobile();
  const [showAllSetores, setShowAllSetores] = useState(false);
  
  const displayedSetores = showAllSetores ? setoresProducao : setoresProducao.slice(0, isMobile ? 4 : 8);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cip" />
            <h1 className="font-display text-xl lg:text-2xl font-bold text-foreground">CIP</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Centro de Inteligência de Produção • {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}.
          </p>
        </div>
      </div>

      {/* KPIs Grid - Main */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KPICardCIP
          title="Capacidade Fábrica"
          value={`${cipKPIs.ocupacaoPercentual}%`}
          subtitle={`Saldo: +${saldoGlobalHoras.toFixed(0)}h`}
          icon={<Gauge className="h-5 w-5" />}
          variant="blue"
        />
        <KPICardCIP
          title="Saldo Global Horas"
          value={`+${saldoGlobalHoras.toFixed(0)}h`}
          subtitle="Folga"
          icon={<Clock className="h-5 w-5" />}
          variant="green"
        />
        <KPICardCIP
          title="Dias em Carteira"
          value={`${calcularDiasEquivalentes(saldoGlobalHoras)}d`}
          subtitle={`Gargalo: ${gargaloSetor?.nome || 'Nenhum'}`}
          icon={<Calendar className="h-5 w-5" />}
          variant="orange"
        />
        <KPICardCIP
          title="Gargalo Atual"
          value={gargaloSetor?.nome || 'Nenhum'}
          subtitle={gargaloSetor ? `--${(gargaloSetor.horasNecessarias - gargaloSetor.horasDisponiveis).toFixed(0)}h déficit` : 'Sem gargalos'}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="red"
          size="sm"
        />
      </div>

      {/* KPIs Grid - Secondary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KPICardCIP
          title="Lotação Total"
          value={totalOperadores}
          subtitle={`Nec: ${moNecessaria.toFixed(1)}`}
          icon={<Users className="h-5 w-5" />}
          variant="blue"
        />
        <KPICardCIP
          title="MO Necessária"
          value={moNecessaria.toFixed(1)}
          subtitle={`Saldo: +${(totalOperadores - moNecessaria).toFixed(1)}`}
          icon={<Users className="h-5 w-5" />}
          variant="default"
        />
        <KPICardCIP
          title="Eficiência Média"
          value={`${eficienciaMedia.toFixed(0)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="blue"
        />
        <KPICardCIP
          title="Meta do Dia"
          value={`${Math.min(100, Math.round((cipKPIs.capacidadeUtilizada / cipKPIs.capacidadeTotal) * 100 + 8))}%`}
          subtitle={`Projetado: ${Math.min(100, Math.round((cipKPIs.capacidadeUtilizada / cipKPIs.capacidadeTotal) * 100 + 16))}%`}
          icon={<Target className="h-5 w-5" />}
          variant="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CargaSetorChart data={cargaSetorData} />
        <ProducaoMensalChart data={producaoMensalData} />
      </div>

      {/* Status dos Setores */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">Status dos Setores</h2>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-[10px] text-muted-foreground">Gargalo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-[10px] text-muted-foreground">Limite</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-[10px] text-muted-foreground">OK</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] text-muted-foreground">Sobra</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAllSetores(!showAllSetores)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {showAllSetores ? 'Ver menos' : 'Ver todos'}
            <ChevronDown className={`h-4 w-4 transition-transform ${showAllSetores ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedSetores.map((setor) => (
            <SetorCard
              key={setor.id}
              nome={setor.nome}
              sigla={setor.id}
              carga={Math.round(setor.lotacao)}
              capacidadeReal={Math.round(setor.horasDisponiveis)}
              horasNecessarias={Math.round(setor.horasNecessarias)}
              lotacaoAtual={setor.operadores}
              lotacaoNecessaria={Math.ceil(setor.horasNecessarias / 8)}
              maquinas={setor.maquinas}
              diasCarteira={setor.horasDisponiveis / 8}
              eficiencia={setor.eficiencia}
              folga={Math.round(setor.horasDisponiveis - setor.horasNecessarias)}
              status={setor.status}
              moExtra={(setor.horasDisponiveis - setor.horasNecessarias) / 8}
            />
          ))}
        </div>
      </div>

      {/* IA e Pedidos Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inteligência Artificial */}
        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cip/20">
                <Brain className="h-5 w-5 text-cip" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">Inteligência Artificial</h3>
                <p className="text-xs text-muted-foreground">Diagnóstico em tempo real</p>
              </div>
            </div>
            <Badge className="bg-success/20 text-success border-success/30">
              ● Ativo
            </Badge>
          </div>
          
          <div className="space-y-3">
            {iaAlerts.map((alert) => (
              <IAAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        {/* Pedidos em Execução */}
        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-display font-bold text-foreground">Pedidos em Execução</h3>
            </div>
            <span className="text-xs text-muted-foreground">{pedidosEmExecucao.length} ativos</span>
          </div>
          
          <div className="space-y-3">
            {pedidosEmExecucao.map((pedido, index) => (
              <PedidoEmExecucaoCard
                key={index}
                {...pedido}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">Modelo Industrial CIP</span> — João José Head de Freitas
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          40 anos de chão de fábrica • Gargalo por saldo calculado, <span className="text-warning">nunca estimado</span>
        </p>
      </div>
    </div>
  );
}
