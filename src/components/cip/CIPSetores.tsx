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
import { Layers, Users, TrendingUp, AlertTriangle, Pencil, Settings, BarChart3, Power, Plus, Save, X, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SetorDB {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

interface SetorComCarga extends SetorDB {
  opsEntrada: number;
  horasOcupadas: number;
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

export function CIPSetores() {
  const [setores, setSetores] = useState<SetorComCarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoSetorOpen, setNovoSetorOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<SetorComCarga | null>(null);
  const [substituteId, setSubstituteId] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadSetores(); }, []);

  const loadSetores = async () => {
    setLoading(true);
    const { data: setoresDB } = await supabase
      .from('setores_produtivos')
      .select('*')
      .order('ordem');

    if (!setoresDB) { setLoading(false); return; }

    // Load carga real from setor_rastreamento (OPs em entrada = ocupando setor)
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

    const mapped: SetorComCarga[] = setoresDB.map(s => ({
      ...s,
      opsEntrada: cargaMap[s.id]?.ops || 0,
      horasOcupadas: cargaMap[s.id]?.horas || 0,
    }));

    setSetores(mapped);
    setLoading(false);
  };

  const handleToggle = async (setor: SetorComCarga) => {
    const { error } = await supabase
      .from('setores_produtivos')
      .update({ ativo: !setor.ativo })
      .eq('id', setor.id);
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.info(`Setor "${setor.nome}" ${setor.ativo ? 'desativado' : 'ativado'}`);
    await loadSetores();
  };

  const handleAddSetor = async () => {
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

  const handleDeleteSetor = async () => {
    if (!deleteDialog || !substituteId) { toast.error('Selecione o setor substituto'); return; }
    setDeleting(true);

    // Check for active vinculos
    const { data: vinculos } = await supabase
      .from('produto_setor_tempos')
      .select('id, produto_id, tempo_horas')
      .eq('setor_id', deleteDialog.id);

    const { data: activeOps } = await supabase
      .from('setor_rastreamento')
      .select('id')
      .eq('setor_id', deleteDialog.id)
      .eq('status', 'entrada');

    if (activeOps && activeOps.length > 0) {
      toast.error('Setor tem OPs ativas em produção. Impossível excluir.');
      setDeleting(false);
      return;
    }

    // Migrate product sector times: merge into substitute
    if (vinculos && vinculos.length > 0) {
      for (const v of vinculos) {
        // Check if substitute already has time for this product
        const { data: existing } = await supabase
          .from('produto_setor_tempos')
          .select('id, tempo_horas')
          .eq('produto_id', v.produto_id)
          .eq('setor_id', substituteId)
          .maybeSingle();

        if (existing) {
          // Sum times
          await supabase.from('produto_setor_tempos')
            .update({ tempo_horas: Number(existing.tempo_horas) + Number(v.tempo_horas) })
            .eq('id', existing.id);
        } else {
          // Move to substitute
          await supabase.from('produto_setor_tempos')
            .update({ setor_id: substituteId })
            .eq('id', v.id);
        }
      }
      // Clean up any remaining for deleted setor
      await supabase.from('produto_setor_tempos').delete().eq('setor_id', deleteDialog.id);
    }

    // Migrate route steps
    await supabase.from('op_route_steps')
      .update({ setor_id: substituteId })
      .eq('setor_id', deleteDialog.id);

    // Migrate rastreamento (pendente only)
    await supabase.from('setor_rastreamento')
      .update({ setor_id: substituteId })
      .eq('setor_id', deleteDialog.id)
      .eq('status', 'pendente');

    // Log the action
    const substituteName = setores.find(s => s.id === substituteId)?.nome || substituteId;
    await supabase.from('action_logs').insert({
      action: 'excluir_setor',
      entity: 'setores_produtivos',
      entity_id: deleteDialog.id,
      status: 'success',
      details: {
        setor_removido: deleteDialog.nome,
        setor_substituto: substituteName,
        produtos_migrados: vinculos?.length || 0,
      } as any,
    });

    // Delete the sector
    const { error } = await supabase.from('setores_produtivos').delete().eq('id', deleteDialog.id);
    if (error) { toast.error('Erro ao excluir: ' + error.message); }
    else { toast.success(`Setor "${deleteDialog.nome}" excluído. Migrado para "${substituteName}".`); }

    setDeleting(false);
    setDeleteDialog(null);
    setSubstituteId('');
    await loadSetores();
  };

  // Calculate carga % (arbitrary max 8h/day reference)
  const getCargaPercent = (s: SetorComCarga) => {
    if (!s.ativo || s.horasOcupadas === 0) return 0;
    // Assume 8h capacity per day as reference
    return Math.min(100, Math.round((s.horasOcupadas / 8) * 100));
  };

  const setoresAtivos = setores.filter(s => s.ativo);
  const totalOpsAtivas = setoresAtivos.reduce((a, s) => a + s.opsEntrada, 0);
  const totalHorasOcupadas = setoresAtivos.reduce((a, s) => a + s.horasOcupadas, 0);
  const gargalos = setoresAtivos.filter(s => getCargaPercent(s) >= 80);

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
            <p className="text-sm text-muted-foreground">Dados reais do banco — gestão de capacidade por setor</p>
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
        <KPICard title="OPs Ativas" value={totalOpsAtivas} subtitle="Em setores" icon={<Users className="h-5 w-5" />} variant="cip" />
        <KPICard title="Horas Ocupadas" value={`${totalHorasOcupadas.toFixed(1)}h`} subtitle="Carga total" icon={<TrendingUp className="h-5 w-5" />} variant="cip" />
        <KPICard title="Gargalos" value={gargalos.length} subtitle={gargalos.length > 0 ? 'Requer ação' : 'OK'} icon={<AlertTriangle className="h-5 w-5" />} variant="cip" />
      </div>

      {/* Grid de Cards */}
      <ScrollArea className="max-h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pr-2">
          {setores.map(setor => {
            const carga = getCargaPercent(setor);
            const isGargalo = carga >= 80;
            return (
              <Card key={setor.id} className={`bg-card/60 backdrop-blur-sm border-border/50 p-5 transition-opacity ${!setor.ativo ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${setor.ativo ? 'bg-blue-500/20' : 'bg-zinc-500/20'}`}>
                      <BarChart3 className={`h-5 w-5 ${setor.ativo ? 'text-blue-400' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{setor.nome}</h3>
                      <span className="text-xs text-muted-foreground">Ordem: {setor.ordem}</span>
                      {isGargalo && setor.ativo && <Badge className="ml-2 bg-red-600 text-white text-[10px]">Gargalo</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={setor.ativo} onCheckedChange={() => handleToggle(setor)} className="data-[state=checked]:bg-green-500" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteDialog(setor); setSubstituteId(''); }}
                      title="Excluir setor">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center mb-4">
                  <CircularGauge value={setor.ativo ? carga : 0} size={130} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">OPs em Entrada</p>
                    <p className="text-xl font-bold text-warning">{setor.opsEntrada}</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Horas Ocupadas</p>
                    <p className="text-xl font-bold text-blue-400">{setor.horasOcupadas.toFixed(1)}h</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Delete Dialog with Migration */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Setor: {deleteDialog?.nome}</DialogTitle>
            <DialogDescription>
              Todos os produtos e tempos vinculados serão migrados para o setor substituto.
              OPs e histórico serão preservados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {deleteDialog && deleteDialog.opsEntrada > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                ⚠ Este setor tem {deleteDialog.opsEntrada} OP(s) ativa(s). Exclusão bloqueada até finalização.
              </div>
            )}
            <div>
              <Label>Setor Substituto (migração obrigatória) *</Label>
              <Select value={substituteId} onValueChange={setSubstituteId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o setor destino" /></SelectTrigger>
                <SelectContent>
                  {setores.filter(s => s.id !== deleteDialog?.id).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Tempos dos produtos serão somados ao setor destino.</p>
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
            <span className="text-sm text-muted-foreground">Crítico (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <Power className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Ativar/Desativar</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
