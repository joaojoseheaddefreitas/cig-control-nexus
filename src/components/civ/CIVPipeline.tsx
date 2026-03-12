import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Target, TrendingUp, AlertTriangle, DollarSign, Plus, Edit, Trash2, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface PipelineItem {
  id: string;
  titulo: string;
  etapa: string;
  valor_estimado: number;
  probabilidade: number;
  data_previsao: string | null;
  cliente_id: string | null;
  vendedor_id: string | null;
  observacoes: string | null;
}

const etapaColors: Record<string, string> = {
  prospeccao: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contato: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  proposta: 'bg-warning/20 text-warning border-warning/30',
  negociacao: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fechado: 'bg-success/20 text-success border-success/30',
  perdido: 'bg-destructive/20 text-destructive border-destructive/30',
};

const etapaLabels: Record<string, string> = {
  prospeccao: 'Prospecção',
  contato: 'Contato',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

const ETAPAS_KANBAN = ['prospeccao', 'contato', 'proposta', 'negociacao', 'fechado', 'perdido'];

const emptyPipeline = (): Partial<PipelineItem> => ({
  titulo: '', etapa: 'prospeccao', valor_estimado: 0, probabilidade: 10, observacoes: ''
});

export function CIVPipeline() {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<PipelineItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [vendedores, setVendedores] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [pipeRes, cliRes, vendRes] = await Promise.all([
      supabase.from('pipeline').select('*').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('vendedores').select('id, nome').eq('ativo', true).order('nome'),
    ]);
    setItems(pipeRes.data || []);
    setClientes(cliRes.data || []);
    setVendedores(vendRes.data || []);
    setLoading(false);
  };

  const totalValor = items.reduce((s, i) => s + Number(i.valor_estimado || 0), 0);
  const valorPerdido = items.filter(i => i.etapa === 'perdido').reduce((s, i) => s + Number(i.valor_estimado || 0), 0);
  const fechados = items.filter(i => i.etapa === 'fechado').length;
  const taxaConversao = items.length > 0 ? ((fechados / items.length) * 100).toFixed(0) : '0';

  const openNew = () => { setEditing(emptyPipeline()); setDialogOpen(true); };
  const openEdit = (item: PipelineItem) => { setEditing({ ...item }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!editing?.titulo) { toast.error('Título é obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        titulo: editing.titulo,
        etapa: editing.etapa || 'prospeccao',
        valor_estimado: Number(editing.valor_estimado) || 0,
        probabilidade: Number(editing.probabilidade) || 10,
        data_previsao: editing.data_previsao || null,
        cliente_id: editing.cliente_id || null,
        vendedor_id: editing.vendedor_id || null,
        observacoes: editing.observacoes || null,
      };
      if (editing.id) {
        const { error } = await supabase.from('pipeline').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Oportunidade atualizada');
      } else {
        const { error } = await supabase.from('pipeline').insert(payload);
        if (error) throw error;
        toast.success('Oportunidade criada');
      }
      setDialogOpen(false);
      await loadData();
    } catch (e: any) {
      toast.error('Erro ao salvar', { description: e.message });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`Excluir "${titulo}"?`)) return;
    const { error } = await supabase.from('pipeline').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir', { description: error.message });
    else { toast.success('Oportunidade excluída'); await loadData(); }
  };

  const handleChangeEtapa = async (id: string, novaEtapa: string) => {
    const { error } = await supabase.from('pipeline').update({ etapa: novaEtapa }).eq('id', id);
    if (error) toast.error('Erro ao mover', { description: error.message });
    else await loadData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Pipeline Total" value={items.length} subtitle="Oportunidades" icon={<Target className="h-5 w-5" />} variant="civ" />
        <KPICard title="Valor Total" value={`R$ ${(totalValor / 1000).toFixed(0)}k`} subtitle="Potencial" icon={<DollarSign className="h-5 w-5" />} variant="civ" />
        <KPICard title="Taxa Conversão" value={`${taxaConversao}%`} subtitle="Fechados" icon={<TrendingUp className="h-5 w-5" />} variant="civ" />
        <KPICard title="Valor Perdido" value={`R$ ${(valorPerdido / 1000).toFixed(0)}k`} subtitle="Perdidos" icon={<AlertTriangle className="h-5 w-5" />} variant="civ" />
      </div>

      {/* Kanban */}
      <ModuleCard title="Pipeline Comercial – Kanban" variant="civ">
        <div className="flex justify-end mb-4">
          <Button size="sm" className="bg-civ hover:bg-civ/90 gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Nova Oportunidade
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Sem dados cadastrados – insira dados para iniciar o monitoramento.
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-[900px]">
              {ETAPAS_KANBAN.map(etapa => {
                const etapaItems = items.filter(i => i.etapa === etapa);
                const valorEtapa = etapaItems.reduce((s, i) => s + Number(i.valor_estimado || 0), 0);
                return (
                  <div key={etapa} className="flex-1 min-w-[150px] bg-secondary/20 rounded-xl p-3 border border-border/30">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className={etapaColors[etapa]}>{etapaLabels[etapa]}</Badge>
                      <span className="text-xs text-muted-foreground">{etapaItems.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">R$ {(valorEtapa / 1000).toFixed(0)}k</p>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {etapaItems.map(item => (
                        <div key={item.id} className="bg-card/80 rounded-lg p-3 border border-border/30 hover:border-civ/30 transition-colors">
                          <p className="text-sm font-medium text-foreground truncate">{item.titulo}</p>
                          <p className="text-xs text-civ font-semibold mt-1">R$ {Number(item.valor_estimado).toLocaleString('pt-BR')}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{item.probabilidade}% prob.</p>
                          <div className="flex items-center gap-1 mt-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(item)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(item.id, item.titulo)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ModuleCard>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
            <DialogDescription>Cadastre ou edite uma oportunidade do pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input value={editing?.titulo || ''} onChange={e => setEditing(prev => ({ ...prev, titulo: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Etapa</label>
                <Select value={editing?.etapa || 'prospeccao'} onValueChange={v => setEditing(prev => ({ ...prev, etapa: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ETAPAS_KANBAN.map(e => <SelectItem key={e} value={e}>{etapaLabels[e]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Valor Estimado</label>
                <Input type="number" value={editing?.valor_estimado || ''} onChange={e => setEditing(prev => ({ ...prev, valor_estimado: Number(e.target.value) }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Probabilidade %</label>
                <Input type="number" min={0} max={100} value={editing?.probabilidade || ''} onChange={e => setEditing(prev => ({ ...prev, probabilidade: Number(e.target.value) }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Previsão</label>
                <Input type="date" value={editing?.data_previsao || ''} onChange={e => setEditing(prev => ({ ...prev, data_previsao: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Cliente</label>
              <Select value={editing?.cliente_id || 'none'} onValueChange={v => setEditing(prev => ({ ...prev, cliente_id: v === 'none' ? null : v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Vendedor</label>
              <Select value={editing?.vendedor_id || ''} onValueChange={v => setEditing(prev => ({ ...prev, vendedor_id: v || null }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {vendedores.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Input value={editing?.observacoes || ''} onChange={e => setEditing(prev => ({ ...prev, observacoes: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background pb-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-civ hover:bg-civ/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
