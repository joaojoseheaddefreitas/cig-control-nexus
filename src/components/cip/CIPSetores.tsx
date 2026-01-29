import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { setoresProducao, calcularDiasEquivalentes } from '@/data/cipData';
import { KPICard } from '@/components/ui/KPICard';
import { Layers, Users, TrendingUp, AlertTriangle, Pencil, Settings, BarChart3, Power, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface SetorDetalhado {
  id: number;
  nome: string;
  status: 'Normal' | 'Atenção' | 'Crítico';
  carga: number;
  equipe: { total: number; operadores: number; auxiliares: number };
  maquinas: number;
  horasDisponiveis: number;
  eficiencia: number;
  naFila: number;
  emExecucao: number;
  gargalo?: boolean;
  ativo: boolean;
}

// Dados dos setores com informações completas
const setoresIniciais: SetorDetalhado[] = [
  { 
    id: 1,
    nome: 'Corte', 
    status: 'Normal',
    carga: 34, 
    equipe: { total: 6, operadores: 4, auxiliares: 2 },
    maquinas: 3,
    horasDisponiveis: 884,
    eficiencia: 85,
    naFila: 8,
    emExecucao: 4,
    ativo: true
  },
  { 
    id: 2,
    nome: 'Montagem Estrutura', 
    status: 'Normal',
    carga: 38, 
    equipe: { total: 4, operadores: 3, auxiliares: 1 },
    maquinas: 2,
    horasDisponiveis: 628,
    eficiencia: 85,
    naFila: 6,
    emExecucao: 6,
    ativo: true
  },
  { 
    id: 3,
    nome: 'Montagem Base', 
    status: 'Normal',
    carga: 37, 
    equipe: { total: 4, operadores: 3, auxiliares: 1 },
    maquinas: 2,
    horasDisponiveis: 628,
    eficiencia: 85,
    naFila: 14,
    emExecucao: 5,
    ativo: true
  },
  { 
    id: 4,
    nome: 'Corte Tecido', 
    status: 'Atenção',
    carga: 53, 
    equipe: { total: 3, operadores: 2, auxiliares: 1 },
    maquinas: 2,
    horasDisponiveis: 471,
    eficiencia: 78,
    naFila: 12,
    emExecucao: 8,
    gargalo: true,
    ativo: true
  },
  { 
    id: 5,
    nome: 'Costura', 
    status: 'Normal',
    carga: 52, 
    equipe: { total: 10, operadores: 8, auxiliares: 2 },
    maquinas: 8,
    horasDisponiveis: 1478,
    eficiencia: 80,
    naFila: 10,
    emExecucao: 4,
    ativo: true
  },
  { 
    id: 6,
    nome: 'Montagem Almofadas', 
    status: 'Normal',
    carga: 40, 
    equipe: { total: 5, operadores: 4, auxiliares: 1 },
    maquinas: 2,
    horasDisponiveis: 785,
    eficiencia: 85,
    naFila: 14,
    emExecucao: 2,
    ativo: true
  },
  { 
    id: 7,
    nome: 'Estofamento', 
    status: 'Normal',
    carga: 53, 
    equipe: { total: 8, operadores: 6, auxiliares: 2 },
    maquinas: 3,
    horasDisponiveis: 1212,
    eficiencia: 82,
    naFila: 10,
    emExecucao: 4,
    ativo: true
  },
  { 
    id: 8,
    nome: 'Acabamento', 
    status: 'Normal',
    carga: 38, 
    equipe: { total: 4, operadores: 3, auxiliares: 1 },
    maquinas: 2,
    horasDisponiveis: 665,
    eficiencia: 90,
    naFila: 16,
    emExecucao: 7,
    ativo: true
  },
];

// Componente Gauge Circular
function CircularGauge({ value, size = 160 }: { value: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference * 0.75; // 270 graus

  const getColor = (val: number) => {
    if (val >= 80) return '#ef4444';
    if (val >= 60) return '#f59e0b';
    return '#3b82f6';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-135">
        {/* Background arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-3xl font-bold"
          style={{ color: getColor(value) }}
        >
          {value}%
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
          CARGA
        </span>
      </div>
    </div>
  );
}

// Props do SetorCard
interface SetorCardProps {
  setor: SetorDetalhado;
  onToggle: (id: number) => void;
  onEdit: (setor: SetorDetalhado) => void;
}

// Componente Card de Setor
function SetorCard({ setor, onToggle, onEdit }: SetorCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    operadores: setor.equipe.operadores,
    auxiliares: setor.equipe.auxiliares,
    maquinas: setor.maquinas,
    horasDisponiveis: setor.horasDisponiveis,
    eficiencia: setor.eficiencia,
  });

  const handleSave = () => {
    const updatedSetor: SetorDetalhado = {
      ...setor,
      equipe: {
        ...setor.equipe,
        operadores: editData.operadores,
        auxiliares: editData.auxiliares,
        total: editData.operadores + editData.auxiliares,
      },
      maquinas: editData.maquinas,
      horasDisponiveis: editData.horasDisponiveis,
      eficiencia: editData.eficiencia,
    };
    onEdit(updatedSetor);
    setIsEditing(false);
    toast.success(`Setor "${setor.nome}" atualizado! Programação e custos recalculados.`);
  };

  const getStatusBadge = () => {
    if (!setor.ativo) {
      return <Badge className="bg-zinc-600 text-zinc-200">Inativo</Badge>;
    }
    if (setor.gargalo) {
      return <Badge className="bg-red-600 text-white">Gargalo</Badge>;
    }
    switch (setor.status) {
      case 'Normal':
        return <Badge className="bg-green-600 text-white">Normal</Badge>;
      case 'Atenção':
        return <Badge className="bg-yellow-600 text-white">Atenção</Badge>;
      case 'Crítico':
        return <Badge className="bg-red-600 text-white">Crítico</Badge>;
      default:
        return <Badge className="bg-green-600 text-white">Normal</Badge>;
    }
  };

  return (
    <Card className={`bg-card/60 backdrop-blur-sm border-border/50 p-5 relative overflow-hidden transition-opacity ${!setor.ativo ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${setor.ativo ? 'bg-blue-500/20' : 'bg-zinc-500/20'}`}>
            <BarChart3 className={`h-5 w-5 ${setor.ativo ? 'text-blue-400' : 'text-zinc-400'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">{setor.nome}</h3>
            {getStatusBadge()}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Toggle Ativo/Inativo */}
          <div className="flex items-center gap-1">
            <Switch 
              checked={setor.ativo} 
              onCheckedChange={() => {
                onToggle(setor.id);
                toast.info(`Setor "${setor.nome}" ${setor.ativo ? 'desativado' : 'ativado'}. Capacidade recalculada.`);
              }}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
          
          {/* Botão Editar */}
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cip" />
                  Editar Setor: {setor.nome}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="operadores" className="text-right">Operadores</Label>
                  <Input 
                    id="operadores" 
                    value={editData.operadores}
                    onChange={(e) => setEditData({...editData, operadores: parseInt(e.target.value) || 0})}
                    type="number"
                    className="col-span-3 bg-secondary/50" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="auxiliares" className="text-right">Auxiliares</Label>
                  <Input 
                    id="auxiliares" 
                    value={editData.auxiliares}
                    onChange={(e) => setEditData({...editData, auxiliares: parseInt(e.target.value) || 0})}
                    type="number"
                    className="col-span-3 bg-secondary/50" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="maquinas" className="text-right">Máquinas</Label>
                  <Input 
                    id="maquinas" 
                    value={editData.maquinas}
                    onChange={(e) => setEditData({...editData, maquinas: parseInt(e.target.value) || 0})}
                    type="number"
                    className="col-span-3 bg-secondary/50" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="horas" className="text-right">Horas Disp.</Label>
                  <Input 
                    id="horas" 
                    value={editData.horasDisponiveis}
                    onChange={(e) => setEditData({...editData, horasDisponiveis: parseInt(e.target.value) || 0})}
                    type="number"
                    className="col-span-3 bg-secondary/50" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="eficiencia" className="text-right">Eficiência %</Label>
                  <Input 
                    id="eficiencia" 
                    value={editData.eficiencia}
                    onChange={(e) => setEditData({...editData, eficiencia: parseInt(e.target.value) || 0})}
                    type="number"
                    className="col-span-3 bg-secondary/50" 
                  />
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-400">
                ⚠️ Alterações refletirão em: Programação, Custos e Indicadores.
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-cip hover:bg-cip/90">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Gauge Circular */}
      <div className="flex justify-center mb-6">
        <CircularGauge value={setor.ativo ? setor.carga : 0} />
      </div>

      {/* Métricas Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs">Equipe</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {setor.equipe.total}
            <span className="text-xs text-muted-foreground font-normal ml-1">
              ({setor.equipe.operadores}op + {setor.equipe.auxiliares}aux)
            </span>
          </p>
        </div>

        <div className="bg-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Settings className="h-4 w-4" />
            <span className="text-xs">Máquinas</span>
          </div>
          <p className="text-xl font-bold text-foreground">{setor.maquinas}</p>
        </div>

        <div className="bg-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
            </svg>
            <span className="text-xs">Horas Disponíveis</span>
          </div>
          <p className="text-xl font-bold text-blue-400">{setor.horasDisponiveis}h</p>
        </div>

        <div className="bg-secondary/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Eficiência</span>
          </div>
          <p className="text-xl font-bold text-foreground">{setor.eficiencia}%</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <span className="text-sm">
          <span className="text-red-400 font-bold">{setor.naFila}</span>
          <span className="text-muted-foreground"> na fila</span>
        </span>
        <span className="text-sm">
          <span className="text-green-400 font-bold">{setor.emExecucao}</span>
          <span className="text-muted-foreground"> em execução</span>
        </span>
      </div>
    </Card>
  );
}

export function CIPSetores() {
  const [setores, setSetores] = useState<SetorDetalhado[]>(setoresIniciais);
  const [novoSetorOpen, setNovoSetorOpen] = useState(false);
  const [novoSetor, setNovoSetor] = useState({
    nome: '',
    operadores: 1,
    auxiliares: 0,
    maquinas: 0,
    horasDisponiveis: 100,
    eficiencia: 80,
  });

  // Handlers
  const handleToggle = (id: number) => {
    setSetores(prev => prev.map(s => 
      s.id === id ? { ...s, ativo: !s.ativo } : s
    ));
  };

  const handleEdit = (updatedSetor: SetorDetalhado) => {
    setSetores(prev => prev.map(s => 
      s.id === updatedSetor.id ? updatedSetor : s
    ));
  };

  const handleAddSetor = () => {
    if (!novoSetor.nome.trim()) {
      toast.error('Informe o nome do setor');
      return;
    }

    const newSetor: SetorDetalhado = {
      id: setores.length + 1,
      nome: novoSetor.nome,
      status: 'Normal',
      carga: 0,
      equipe: {
        total: novoSetor.operadores + novoSetor.auxiliares,
        operadores: novoSetor.operadores,
        auxiliares: novoSetor.auxiliares,
      },
      maquinas: novoSetor.maquinas,
      horasDisponiveis: novoSetor.horasDisponiveis,
      eficiencia: novoSetor.eficiencia,
      naFila: 0,
      emExecucao: 0,
      ativo: true,
    };

    setSetores([...setores, newSetor]);
    setNovoSetorOpen(false);
    setNovoSetor({
      nome: '',
      operadores: 1,
      auxiliares: 0,
      maquinas: 0,
      horasDisponiveis: 100,
      eficiencia: 80,
    });
    toast.success(`Setor "${newSetor.nome}" adicionado! Capacidade recalculada.`);
  };

  // Cálculos
  const setoresAtivos = setores.filter(s => s.ativo);
  const totalSetoresCount = setores.length;
  const totalOperadores = setoresAtivos.reduce((acc, s) => acc + s.equipe.total, 0);
  const totalMaquinas = setoresAtivos.reduce((acc, s) => acc + s.maquinas, 0);
  const eficienciaMedia = setoresAtivos.length > 0 
    ? setoresAtivos.reduce((acc, s) => acc + s.eficiencia, 0) / setoresAtivos.length 
    : 0;
  const setoresGargalo = setoresAtivos.filter(s => s.gargalo);
  const totalNaFila = setoresAtivos.reduce((acc, s) => acc + s.naFila, 0);
  const totalEmExecucao = setoresAtivos.reduce((acc, s) => acc + s.emExecucao, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-cip" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Setores de Produção</h2>
            <p className="text-sm text-muted-foreground">
              Gestão de capacidade e eficiência por setor
            </p>
          </div>
        </div>
        
        {/* Botão Novo Setor */}
        <Dialog open={novoSetorOpen} onOpenChange={setNovoSetorOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cip hover:bg-cip/90">
              <Plus className="h-4 w-4 mr-2" />
              Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-cip" />
                Adicionar Novo Setor
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Setor *</Label>
                <Input 
                  value={novoSetor.nome}
                  onChange={(e) => setNovoSetor({...novoSetor, nome: e.target.value})}
                  placeholder="Ex: Pintura"
                  className="bg-secondary/50" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Operadores</Label>
                  <Input 
                    type="number"
                    value={novoSetor.operadores}
                    onChange={(e) => setNovoSetor({...novoSetor, operadores: parseInt(e.target.value) || 0})}
                    className="bg-secondary/50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Auxiliares</Label>
                  <Input 
                    type="number"
                    value={novoSetor.auxiliares}
                    onChange={(e) => setNovoSetor({...novoSetor, auxiliares: parseInt(e.target.value) || 0})}
                    className="bg-secondary/50" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máquinas</Label>
                  <Input 
                    type="number"
                    value={novoSetor.maquinas}
                    onChange={(e) => setNovoSetor({...novoSetor, maquinas: parseInt(e.target.value) || 0})}
                    className="bg-secondary/50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas Disponíveis</Label>
                  <Input 
                    type="number"
                    value={novoSetor.horasDisponiveis}
                    onChange={(e) => setNovoSetor({...novoSetor, horasDisponiveis: parseInt(e.target.value) || 0})}
                    className="bg-secondary/50" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Eficiência (%)</Label>
                <Input 
                  type="number"
                  value={novoSetor.eficiencia}
                  onChange={(e) => setNovoSetor({...novoSetor, eficiencia: parseInt(e.target.value) || 0})}
                  className="bg-secondary/50" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNovoSetorOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleAddSetor} className="bg-cip hover:bg-cip/90">
                <Save className="h-4 w-4 mr-2" />
                Criar Setor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Setores"
          value={totalSetoresCount}
          subtitle={`${setoresAtivos.length} ativos`}
          icon={<Layers className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Operadores"
          value={totalOperadores}
          subtitle={`${totalMaquinas} máquinas`}
          icon={<Users className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Eficiência Média"
          value={`${eficienciaMedia.toFixed(0)}%`}
          subtitle="Produtividade geral"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          trendValue="+2.5%"
          variant="cip"
        />
        <KPICard
          title="Gargalos"
          value={setoresGargalo.length}
          subtitle="Setores críticos"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={setoresGargalo.length > 0 ? "down" : "up"}
          trendValue={setoresGargalo.length > 0 ? "Requer ação" : "OK"}
          variant="cip"
        />
      </div>

      {/* Resumo de Fila */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total na Fila</p>
              <p className="text-2xl font-bold text-yellow-400">{totalNaFila}</p>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div>
              <p className="text-sm text-muted-foreground">Em Execução</p>
              <p className="text-2xl font-bold text-green-400">{totalEmExecucao}</p>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div>
              <p className="text-sm text-muted-foreground">Setores Inativos</p>
              <p className="text-2xl font-bold text-zinc-400">{setores.length - setoresAtivos.length}</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {setoresGargalo.length > 0 && (
              <Badge className="bg-red-600/20 text-red-400 border-red-600/50">
                ⚠ Gargalo: {setoresGargalo.map(s => s.nome).join(', ')}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Grid de Cards de Setores */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {setores.map((setor) => (
          <SetorCard 
            key={setor.id} 
            setor={setor} 
            onToggle={handleToggle}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* Legenda */}
      <Card className="bg-secondary/30 border-border/50 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-sm text-muted-foreground font-medium">Indicadores:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-sm text-muted-foreground">Normal (&lt;60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span className="text-sm text-muted-foreground">Atenção (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-sm text-muted-foreground">Crítico (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <Power className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Ativar/Desativar setor</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">Gargalo identificado</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
