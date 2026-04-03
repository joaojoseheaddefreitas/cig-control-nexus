import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KPICard } from '@/components/ui/KPICard';
import { Layers, Users, TrendingUp, AlertTriangle, Pencil, Settings, BarChart3, Power, Plus, Save, X, Trash2, Loader2, Clock, Cog } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SetorDB {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  mao_de_obra: number;
  horas_turno: number;
  eficiencia: number;
  maquinas_automaticas: number;
  dias_uteis_mensais: number;
  dias_uteis_manual: boolean;
}

interface SetorComCarga extends SetorDB {
  opsEntrada: number;
  horasOcupadas: number;
  horasDisponiveis: number;
  cargaPercent: number;
}

// Circular Gauge
function CircularGauge({ value, size = 140 }: { value: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference * 0.75;
  const getColor = (val: number) => val >= 80 ? '#ef4444' : val >= 60 ? '#f59e0b' : '#3b82f6';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-135">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth}
          strokeDasharray={`${circumference*0.75} ${circumference*0.25}`} strokeLinecap="round" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={getColor(value)} strokeWidth={strokeWidth}
          strokeDasharray={`${circumference*0.75} ${circumference*0.25}`} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: getColor(value) }}>{value}%</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">CARGA</span>
      </div>
    </div>
  );
}

function getStatusBadge(carga: number) {
  if (carga >= 80) return <Badge className="bg-red-600 text-white text-[10px]">Gargalo</Badge>;
  if (carga >= 60) return <Badge className="bg-amber-500 text-white text-[10px]">Atenção</Badge>;
  return <Badge className="bg-green-600 text-white text-[10px]">Normal</Badge>;
}

export function CIPSetores() {
  const [setores, setSetores] = useState<SetorComCarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoSetorOpen, setNovoSetorOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<SetorComCarga | null>(null);
  const [substituteId, setSubstituteId] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<SetorComCarga | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', mao_de_obra: 1, horas_turno: 8.8, eficiencia: 85, maquinas_automaticas: 1, dias_uteis_mensais: 22, dias_uteis_manual: false });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { loadSetores(); }, []);

  const loadSetores = async () => {
    setLoading(true);
    const { data: setoresDB } = await supabase
      .from('setores_produtivos')
      .select('*')
      .order('ordem');

    if (!setoresDB) { setLoading(false); return; }

    // Load carga real from setor_rastreamento
    const { data: rastreamento } = await supabase
      .from('setor_rastreamento')
      .select('setor_id, op_id, status, ops(quantidade, tempo_unitario)')
      .eq('status', 'entrada');

    const cargaMap: Record<string, { ops: number; horas: number }> = {};
    (rastreamento || []).forEach((r: any) => {
      if (!cargaMap[r.setor_id]) cargaMap[r.setor_id] = { ops: 0, horas: 0 };
      cargaMap[r.setor_id].ops++;
      const q = Number(r.ops?.quantidade) || 0;
      const t = Number(r.ops?.tempo_unitario) || 0;
      cargaMap[r.setor_id].horas += q * t;
    });

    const mapped: SetorComCarga[] = (setoresDB as any[]).map(s => {
      const horasOcupadas = cargaMap[s.id]?.horas || 0;
      const mdo = Number(s.mao_de_obra) || 1;
      const ht = Number(s.horas_turno) || 8.8;
      const eff = Number(s.eficiencia) || 0.85;
      const maq = Number(s.maquinas_automaticas) || 0;
      const diasUteis = Number(s.dias_uteis_mensais) || 22;
      const horasDisponiveis = (mdo + maq) * ht * eff * diasUteis;
      const cargaPercent = horasDisponiveis > 0 ? Math.min(100, Math.round((horasOcupadas / horasDisponiveis) * 100)) : 0;

      return {
        ...s,
        mao_de_obra: mdo,
        horas_turno: ht,
        eficiencia: eff,
        maquinas_automaticas: maq,
        opsEntrada: cargaMap[s.id]?.ops || 0,
        horasOcupadas,
        horasDisponiveis,
        cargaPercent,
      };
    });

    setSetores(mapped);
    setLoading(false);
  };

  const handleToggle = async (setor: SetorComCarga) => {
    const { error } = await supabase
      .from('setores_produtivos')
      .update({ ativo: !setor.ativo } as any)
      .eq('id', setor.id);
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.info(`Setor "${setor.nome}" ${setor.ativo ? 'desativado' : 'ativado'}`);
    await loadSetores();
  };

  const handleAddSetor = async () => {
    if (saving) return;
    if (!novoNome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    const maxOrdem = setores.length > 0 ? Math.max(...setores.map(s => s.ordem)) : 0;
    const { error } = await supabase.from('setores_produtivos').insert({
      nome: novoNome.trim(),
      ordem: maxOrdem + 1,
      ativo: true,
    });
    if (error) { toast.error('Erro: ' + error.message); }
    else { toast.success('Setor criado!'); setNovoSetorOpen(false); setNovoNome(''); }
    setSaving(false);
    await loadSetores();
  };

  const openEdit = (setor: SetorComCarga) => {
    setEditDialog(setor);
    setEditForm({
      nome: setor.nome,
      mao_de_obra: setor.mao_de_obra,
      horas_turno: setor.horas_turno,
      eficiencia: Math.round(setor.eficiencia * 100),
      maquinas_automaticas: setor.maquinas_automaticas,
      dias_uteis_mensais: (setor as any).dias_uteis_mensais || 22,
      dias_uteis_manual: (setor as any).dias_uteis_manual || false,
    });
  };

  const handleEditSave = async () => {
    if (editSaving || !editDialog) return;
    if (!editForm.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setEditSaving(true);
    const { error } = await supabase
      .from('setores_produtivos')
      .update({
        nome: editForm.nome.trim(),
        mao_de_obra: editForm.mao_de_obra,
        horas_turno: editForm.horas_turno,
        eficiencia: editForm.eficiencia / 100,
        maquinas_automaticas: editForm.maquinas_automaticas,
        dias_uteis_mensais: editForm.dias_uteis_mensais,
        dias_uteis_manual: editForm.dias_uteis_manual,
      } as any)
      .eq('id', editDialog.id);
    if (error) { toast.error('Erro: ' + error.message); }
    else { toast.success(`Setor "${editForm.nome}" atualizado!`); setEditDialog(null); }
    setEditSaving(false);
    await loadSetores();
  };

  const handleDeleteSetor = async () => {
    if (!deleteDialog || !substituteId) { toast.error('Selecione o setor substituto'); return; }
    setDeleting(true);

    const { data: activeOps } = await supabase
      .from('setor_rastreamento')
      .select('id')
      .eq('setor_id', deleteDialog.id)
      .eq('status', 'entrada');

    if (activeOps && activeOps.length > 0) {
      toast.error('Setor tem OPs ativas. Impossível excluir.');
      setDeleting(false);
      return;
    }

    // Migrate product sector times
    const { data: vinculos } = await supabase
      .from('produto_setor_tempos')
      .select('id, produto_id, tempo_horas')
      .eq('setor_id', deleteDialog.id);

    if (vinculos && vinculos.length > 0) {
      for (const v of vinculos) {
        const { data: existing } = await supabase
          .from('produto_setor_tempos')
          .select('id, tempo_horas')
          .eq('produto_id', v.produto_id)
          .eq('setor_id', substituteId)
          .maybeSingle();
        if (existing) {
          await supabase.from('produto_setor_tempos')
            .update({ tempo_horas: Number(existing.tempo_horas) + Number(v.tempo_horas) })
            .eq('id', existing.id);
        } else {
          await supabase.from('produto_setor_tempos')
            .update({ setor_id: substituteId })
            .eq('id', v.id);
        }
      }
      await supabase.from('produto_setor_tempos').delete().eq('setor_id', deleteDialog.id);
    }

    await supabase.from('op_route_steps').update({ setor_id: substituteId } as any).eq('setor_id', deleteDialog.id);
    await supabase.from('setor_rastreamento').update({ setor_id: substituteId } as any).eq('setor_id', deleteDialog.id).eq('status', 'pendente');

    const substituteName = setores.find(s => s.id === substituteId)?.nome || substituteId;
    await supabase.from('action_logs').insert({
      action: 'excluir_setor', entity: 'setores_produtivos', entity_id: deleteDialog.id, status: 'success',
      details: { setor_removido: deleteDialog.nome, setor_substituto: substituteName, produtos_migrados: vinculos?.length || 0 } as any,
    });

    const { error } = await supabase.from('setores_produtivos').delete().eq('id', deleteDialog.id);
    if (error) { toast.error('Erro: ' + error.message); }
    else { toast.success(`Setor "${deleteDialog.nome}" excluído → "${substituteName}".`); }

    setDeleting(false);
    setDeleteDialog(null);
    setSubstituteId('');
    await loadSetores();
  };

  const setoresAtivos = setores.filter(s => s.ativo);
  const totalOperadores = setoresAtivos.reduce((a, s) => a + s.mao_de_obra, 0);
  const totalMaquinas = setoresAtivos.reduce((a, s) => a + s.maquinas_automaticas, 0);
  const eficienciaMedia = setoresAtivos.length > 0
    ? Math.round(setoresAtivos.reduce((a, s) => a + s.eficiencia * 100, 0) / setoresAtivos.length)
    : 0;
  const gargalos = setoresAtivos.filter(s => s.cargaPercent >= 80);
  const totalNaFila = setoresAtivos.reduce((a, s) => a + s.opsEntrada, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" /> Carregando setores...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-cip" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Setores de Produção</h2>
            <p className="text-sm text-muted-foreground">Gestão de capacidade e eficiência por setor</p>
          </div>
        </div>
        <Dialog open={novoSetorOpen} onOpenChange={setNovoSetorOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cip hover:bg-cip/90"><Plus className="h-4 w-4 mr-2" /> Novo Setor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Setor</DialogTitle>
              <DialogDescription>O setor será adicionado ao final da sequência produtiva.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome do Setor *</Label>
                <Input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Ex: Pintura" className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNovoSetorOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddSetor} disabled={saving} className="bg-cip hover:bg-cip/90">
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Criar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Setores" value={setores.length} subtitle={`${setoresAtivos.length} ativos`} icon={<Layers className="h-5 w-5" />} variant="cip" />
        <KPICard title="Operadores" value={totalOperadores} subtitle={`${totalMaquinas} máquinas`} icon={<Users className="h-5 w-5" />} variant="cip" />
        <KPICard title="Eficiência Média" value={`${eficienciaMedia}%`} subtitle="Produtividade geral" icon={<TrendingUp className="h-5 w-5" />} variant="cip" />
        <KPICard title="Gargalos" value={gargalos.length} subtitle={gargalos.length > 0 ? 'Setores críticos' : 'OK'} icon={<AlertTriangle className="h-5 w-5" />} variant="cip" />
      </div>

      {/* Summary bar */}
      <Card className="bg-card/60 border-border/50 p-4">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <p className="text-xs text-muted-foreground">Total na Fila</p>
            <p className="text-2xl font-bold text-cip">{totalNaFila}</p>
          </div>
          <div className="border-l border-border/50 pl-8">
            <p className="text-xs text-muted-foreground">Em Execução</p>
            <p className="text-2xl font-bold text-amber-400">{totalNaFila}</p>
          </div>
          <div className="border-l border-border/50 pl-8">
            <p className="text-xs text-muted-foreground">Setores Inativos</p>
            <p className="text-2xl font-bold text-foreground">{setores.length - setoresAtivos.length}</p>
          </div>
          {gargalos.length > 0 && (
            <Badge className="bg-red-600/20 text-red-400 border border-red-600/30 ml-auto">
              ⚠ Gargalo: {gargalos.map(g => g.nome).join(', ')}
            </Badge>
          )}
        </div>
      </Card>

      {/* Grid de Cards */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {setores.map(setor => (
            <Card key={setor.id} className={`bg-card/60 backdrop-blur-sm border-border/50 p-5 transition-opacity ${!setor.ativo ? 'opacity-50' : ''}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${setor.ativo ? 'bg-blue-500/20' : 'bg-zinc-500/20'}`}>
                    <BarChart3 className={`h-5 w-5 ${setor.ativo ? 'text-blue-400' : 'text-zinc-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{setor.nome}</h3>
                    {setor.ativo && getStatusBadge(setor.cargaPercent)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={setor.ativo} onCheckedChange={() => handleToggle(setor)} className="data-[state=checked]:bg-green-500" />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(setor)} title="Editar setor">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Gauge */}
              <div className="flex justify-center my-3">
                <CircularGauge value={setor.ativo ? setor.cargaPercent : 0} size={130} />
              </div>

              {/* Capacity Data */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Equipe</p>
                  <p className="text-xl font-bold text-foreground">{setor.mao_de_obra}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Cog className="h-3 w-3" /> Máquinas</p>
                  <p className="text-xl font-bold text-foreground">{setor.maquinas_automaticas}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Horas Disponíveis</p>
                  <p className="text-xl font-bold text-blue-400">{setor.horasDisponiveis.toFixed(0)}h</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Eficiência</p>
                  <p className="text-xl font-bold text-foreground">{Math.round(setor.eficiencia * 100)}%</p>
                </div>
              </div>

              {/* OPs info */}
              <div className="flex justify-between text-sm px-1">
                <span className="text-cip font-semibold">{setor.opsEntrada} na fila</span>
                <span className="text-blue-400 font-semibold">{setor.horasOcupadas.toFixed(1)}h ocupadas</span>
              </div>

              {/* Delete */}
              <div className="mt-3 pt-3 border-t border-border/30 flex justify-end">
                <Button variant="ghost" size="sm" className="text-destructive text-xs h-7" onClick={() => { setDeleteDialog(setor); setSubstituteId(''); }}>
                  <Trash2 className="h-3 w-3 mr-1" /> Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Setor: {editDialog?.nome}</DialogTitle>
            <DialogDescription>Altere os dados de capacidade do setor. Os valores são editáveis por fábrica.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome do Setor *</Label>
              <Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mão de Obra (operadores)</Label>
                <Input type="number" min={0} value={editForm.mao_de_obra} onChange={e => setEditForm({ ...editForm, mao_de_obra: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <Label>Máquinas Automáticas</Label>
                <Input type="number" min={0} value={editForm.maquinas_automaticas} onChange={e => setEditForm({ ...editForm, maquinas_automaticas: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <Label>Horas/Turno</Label>
                <Input type="number" min={0} step={0.1} value={editForm.horas_turno} onChange={e => setEditForm({ ...editForm, horas_turno: parseFloat(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <Label>Eficiência (%)</Label>
                <Input type="number" min={0} max={100} value={editForm.eficiencia} onChange={e => setEditForm({ ...editForm, eficiencia: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dias Úteis / Mês</Label>
                <Input type="number" min={1} max={31} value={editForm.dias_uteis_mensais} onChange={e => setEditForm({ ...editForm, dias_uteis_mensais: parseInt(e.target.value) || 22 })} className="mt-1" disabled={!editForm.dias_uteis_manual} />
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch checked={editForm.dias_uteis_manual} onCheckedChange={checked => setEditForm({ ...editForm, dias_uteis_manual: checked })} />
                  <Label className="text-xs">Manual</Label>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-sm">
              <p className="text-muted-foreground">Capacidade Mensal:</p>
              <p className="text-lg font-bold text-blue-400">
                {(((editForm.mao_de_obra || 0) + (editForm.maquinas_automaticas || 0)) * (editForm.horas_turno || 0) * ((editForm.eficiencia || 0) / 100) * (editForm.dias_uteis_mensais || 22)).toFixed(0)}h
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ({editForm.mao_de_obra + editForm.maquinas_automaticas} recursos × {editForm.horas_turno}h × {editForm.eficiencia}% × {editForm.dias_uteis_mensais} dias)
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={editSaving} className="bg-cip hover:bg-cip/90">
              {editSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Setor: {deleteDialog?.nome}</DialogTitle>
            <DialogDescription>Produtos e tempos serão migrados ao setor substituto. OPs e histórico preservados.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {deleteDialog && deleteDialog.opsEntrada > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                ⚠ Este setor tem {deleteDialog.opsEntrada} OP(s) ativa(s). Exclusão bloqueada.
              </div>
            )}
            <div>
              <Label>Setor Substituto *</Label>
              <Select value={substituteId} onValueChange={setSubstituteId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o setor destino" /></SelectTrigger>
                <SelectContent>
                  {setores.filter(s => s.id !== deleteDialog?.id).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteSetor}
              disabled={deleting || !substituteId || (deleteDialog?.opsEntrada || 0) > 0}>
              {deleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Excluir e Migrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legend */}
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
            <span className="text-sm text-muted-foreground">Gargalo (&gt;80%)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}