import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/ui/KPICard';
import { Layers, Users, TrendingUp, AlertTriangle, Pencil, BarChart3, Plus, Save, Trash2, Loader2, Clock, Cog, Target } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCapacidadeIndustrial } from '@/hooks/useCapacidadeIndustrial';
import { getOcupacaoStatus } from '@/services/capacidadeIndustrialService';

// Circular Gauge
function CircularGauge({ value, size = 140 }: { value: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference * 0.75;
  const getColor = (val: number) => {
    if (val > 100) return '#ef4444';
    if (val >= 95) return '#f97316';
    if (val >= 80) return '#f59e0b';
    if (val >= 50) return '#22c55e';
    return '#3b82f6';
  };

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
  if (carga > 100) return <Badge className="bg-red-600 text-white text-[10px]">Gargalo</Badge>;
  if (carga >= 95) return <Badge className="bg-orange-500 text-white text-[10px]">No Limite</Badge>;
  if (carga >= 80) return <Badge className="bg-amber-500 text-white text-[10px]">Atenção</Badge>;
  if (carga >= 50) return <Badge className="bg-green-600 text-white text-[10px]">Normal</Badge>;
  return <Badge className="bg-blue-500 text-white text-[10px]">Ocioso</Badge>;
}

export function CIPSetores() {
  const { capacidade, loading, refresh } = useCapacidadeIndustrial();
  const [novoSetorOpen, setNovoSetorOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<any>(null);
  const [substituteId, setSubstituteId] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<any>(null);
  const [editForm, setEditForm] = useState({ nome: '', mao_de_obra: 1, horas_turno: 8.8, eficiencia: 85, maquinas_automaticas: 1, dias_uteis_mensais: 22, dias_uteis_manual: false });
  const [editSaving, setEditSaving] = useState(false);

  // Map unified data to display format
  const setoresData = capacidade?.setores || [];

  const handleToggle = async (setor: any) => {
    const { error } = await supabase
      .from('setores_produtivos')
      .update({ ativo: !setor.ativo } as any)
      .eq('id', setor.id);
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.info(`Setor "${setor.nome}" ${setor.ativo ? 'desativado' : 'ativado'}`);
  };

  const handleAddSetor = async () => {
    if (saving) return;
    if (!novoNome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    const maxOrdem = setoresData.length > 0 ? Math.max(...setoresData.map(s => s.ordem)) : 0;
    const { error } = await supabase.from('setores_produtivos').insert({
      nome: novoNome.trim(),
      ordem: maxOrdem + 1,
      ativo: true,
    });
    if (error) { toast.error('Erro: ' + error.message); }
    else { toast.success('Setor criado!'); setNovoSetorOpen(false); setNovoNome(''); }
    setSaving(false);
  };

  const openEdit = (setor: any) => {
    setEditDialog(setor);
    setEditForm({
      nome: setor.nome,
      mao_de_obra: setor.mao_de_obra,
      horas_turno: setor.horas_turno,
      eficiencia: Math.round(setor.eficiencia * 100),
      maquinas_automaticas: setor.maquinas_automaticas,
      dias_uteis_mensais: setor.dias_uteis_mensais || 22,
      dias_uteis_manual: setor.dias_uteis_manual || false,
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
  };

  const handleDeleteSetor = async () => {
    if (!deleteDialog || !substituteId) { toast.error('Selecione o setor substituto'); return; }
    setDeleting(true);

    // Check active OPs via rastreamento
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

    const substituteName = setoresData.find(s => s.id === substituteId)?.nome || substituteId;
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
  };

  const totalOperadores = setoresData.reduce((a, s) => a + s.mao_de_obra, 0);
  const totalMaquinas = setoresData.reduce((a, s) => a + s.maquinas_automaticas, 0);
  const eficienciaMedia = setoresData.length > 0
    ? Math.round(setoresData.reduce((a, s) => a + s.eficiencia * 100, 0) / setoresData.length)
    : 0;
  const gargalos = setoresData.filter(s => s.carga_percent >= 80);
  const prazoVendas = capacidade?.prazoVendasDias || 0;
  const setorGargalo = capacidade?.setorGargaloDias || 'N/A';

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
            <p className="text-sm text-muted-foreground">Gestão de capacidade e eficiência por setor — dados em tempo real</p>
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

      {/* KPIs — from unified source */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="Total Setores" value={setoresData.length} subtitle={`${setoresData.length} ativos`} icon={<Layers className="h-5 w-5" />} variant="cip" />
        <KPICard title="Operadores" value={totalOperadores} subtitle={`${totalMaquinas} máquinas`} icon={<Users className="h-5 w-5" />} variant="cip" />
        <KPICard title="Eficiência Média" value={`${eficienciaMedia}%`} subtitle="Produtividade geral" icon={<TrendingUp className="h-5 w-5" />} variant="cip" />
        <KPICard title="Gargalos" value={gargalos.length} subtitle={gargalos.length > 0 ? gargalos.map(g => g.nome).join(', ') : 'OK'} icon={<AlertTriangle className="h-5 w-5" />} variant="cip" />
        <KPICard title="Prazo Vendas" value={`${prazoVendas}d`} subtitle={`Gargalo: ${setorGargalo}`} icon={<Target className="h-5 w-5" />} variant="cip" />
      </div>

      {/* Summary bar */}
      <Card className="bg-card/60 border-border/50 p-4">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <p className="text-xs text-muted-foreground">Cap. Total Fábrica</p>
            <p className="text-2xl font-bold text-blue-400">{capacidade?.horasProdutivasTotais.toFixed(0) || 0}h</p>
          </div>
          <div className="border-l border-border/50 pl-8">
            <p className="text-xs text-muted-foreground">Demanda Total</p>
            <p className="text-2xl font-bold text-cip">{capacidade?.horasNecessarias.toFixed(0) || 0}h</p>
          </div>
          <div className="border-l border-border/50 pl-8">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={cn('text-2xl font-bold', (capacidade?.saldoHoras || 0) >= 0 ? 'text-success' : 'text-destructive')}>
              {(capacidade?.saldoHoras || 0) >= 0 ? '+' : ''}{capacidade?.saldoHoras.toFixed(0) || 0}h
            </p>
          </div>
          <div className="border-l border-border/50 pl-8">
            <p className="text-xs text-muted-foreground">Ocupação</p>
            <p className={cn('text-2xl font-bold', (capacidade?.percentualOcupacao || 0) > 80 ? 'text-warning' : 'text-success')}>
              {capacidade?.percentualOcupacao || 0}%
            </p>
          </div>
          {gargalos.length > 0 && (
            <Badge className="bg-red-600/20 text-red-400 border border-red-600/30 ml-auto">
              ⚠ Gargalo: {gargalos.map(g => g.nome).join(', ')}
            </Badge>
          )}
        </div>
      </Card>

      {/* Grid de Cards — using unified SetorCapacidade data */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {setoresData.map(setor => (
            <Card key={setor.id} className="bg-card/60 backdrop-blur-sm border-border/50 p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{setor.nome}</h3>
                    {getStatusBadge(setor.carga_percent)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={true} onCheckedChange={() => handleToggle(setor)} className="data-[state=checked]:bg-green-500" />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(setor)} title="Editar setor">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Gauge */}
              <div className="flex justify-center my-3">
                <CircularGauge value={setor.carga_percent} size={130} />
              </div>

              {/* 🔵 CAPACIDADE (OFERTA) */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1.5">▸ Capacidade (Oferta)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary/30 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Equipe</p>
                    <p className="text-lg font-bold text-foreground">{setor.mao_de_obra}</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Cog className="h-3 w-3" /> Multiplicador</p>
                    <p className="text-lg font-bold text-foreground">{setor.maquinas_automaticas}×</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Dias Úteis</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-lg font-bold text-foreground">{setor.dias_uteis_mensais}d</p>
                      <span className={`text-[8px] px-1 py-0.5 rounded ${setor.dias_uteis_manual ? 'bg-blue-500/20 text-blue-400' : 'bg-secondary text-muted-foreground'}`}>
                        {setor.dias_uteis_manual ? 'Manual' : 'Auto'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
                    <p className="text-[10px] text-blue-400">Cap. Total</p>
                    <p className="text-lg font-bold text-blue-400">{setor.horas_disponiveis_mensal.toFixed(0)}h</p>
                  </div>
                </div>
              </div>

              {/* 🟢 PRODUÇÃO (DEMANDA) */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-1.5">▸ Produção (Demanda)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary/30 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Eficiência</p>
                    <p className="text-lg font-bold text-foreground">{Math.round(setor.eficiencia * 100)}%</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Necessário</p>
                    <p className="text-lg font-bold text-foreground">{setor.horas_ocupadas.toFixed(1)}h</p>
                  </div>
                </div>
              </div>

              {/* Dias de Carga + Folga */}
              <div className="flex justify-between text-sm px-1">
                <span className="text-cip font-semibold">{setor.diasGargalo.toFixed(1)}d carga</span>
                <span className={cn('font-semibold', setor.folgaResidual >= 0 ? 'text-success' : 'text-destructive')}>
                  {(setor.horas_disponiveis_mensal - setor.horas_ocupadas).toFixed(0)}h folga
                </span>
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
            <div className="p-3 rounded-lg bg-secondary/30 text-sm space-y-2">
              <div>
                <p className="text-muted-foreground">🔹 Capacidade Mensal (OFERTA):</p>
                <p className="text-lg font-bold text-blue-400">
                  {((editForm.mao_de_obra || 0) * Math.max(editForm.maquinas_automaticas || 1, 1) * (editForm.horas_turno || 0) * (editForm.dias_uteis_mensais || 22)).toFixed(0)}h
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ({editForm.mao_de_obra} equipe × {Math.max(editForm.maquinas_automaticas || 1, 1)} multiplicador × {editForm.horas_turno}h × {editForm.dias_uteis_mensais} dias)
                </p>
              </div>
              <div className="border-t border-border/30 pt-2">
                <p className="text-muted-foreground">🔹 Eficiência (PRODUÇÃO):</p>
                <p className="text-sm font-bold text-foreground">{editForm.eficiencia}%</p>
              </div>
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
            <div>
              <Label>Setor Substituto *</Label>
              <Select value={substituteId} onValueChange={setSubstituteId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o setor destino" /></SelectTrigger>
                <SelectContent>
                  {setoresData.filter(s => s.id !== deleteDialog?.id).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteSetor} disabled={deleting || !substituteId}>
              {deleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Excluir e Migrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <Card className="bg-secondary/30 border-border/50 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-muted-foreground font-medium">Ocupação:</span>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500" /><span className="text-xs text-muted-foreground">&lt;50% Ocioso</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500" /><span className="text-xs text-muted-foreground">50-80% Normal</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500" /><span className="text-xs text-muted-foreground">80-95% Atenção</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-500" /><span className="text-xs text-muted-foreground">95-100% Limite</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500" /><span className="text-xs text-muted-foreground">&gt;100% Gargalo</span></div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-border/30">
          <span className="text-sm text-muted-foreground font-medium">Fórmula:</span>
          <span className="text-xs text-muted-foreground">Capacidade = Equipe × Multiplicador × Horas/Turno × Dias Úteis</span>
          <span className="text-xs text-muted-foreground">|</span>
          <span className="text-xs text-muted-foreground">Demanda = Σ(Quantidade × Tempo Padrão do Setor)</span>
        </div>
      </Card>
    </div>
  );
}
