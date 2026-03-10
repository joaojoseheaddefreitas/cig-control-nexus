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
import { Briefcase, DollarSign, Clock, AlertTriangle, Plus, Edit, Trash2, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Projeto {
  id: string;
  nome: string;
  descricao: string | null;
  cliente_id: string | null;
  valor_estimado: number;
  data_inicio: string | null;
  data_previsao_entrega: string | null;
  status: string;
  responsavel: string | null;
  observacoes: string | null;
}

const statusColors: Record<string, string> = {
  em_analise: 'bg-blue-500/20 text-blue-400',
  aprovado: 'bg-success/20 text-success',
  em_producao: 'bg-warning/20 text-warning',
  concluido: 'bg-teal-500/20 text-teal-400',
  cancelado: 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<string, string> = {
  em_analise: 'Em Análise',
  aprovado: 'Aprovado',
  em_producao: 'Em Produção',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const emptyProjeto = (): Partial<Projeto> => ({
  nome: '', descricao: '', valor_estimado: 0, status: 'em_analise', responsavel: '', observacoes: ''
});

export function CIVProjetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Projeto> | null>(null);
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [projRes, cliRes] = await Promise.all([
      supabase.from('projetos_especiais').select('*').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome'),
    ]);
    setProjetos(projRes.data || []);
    setClientes(cliRes.data || []);
    setLoading(false);
  };

  const filtered = projetos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.responsavel || '').toLowerCase().includes(search.toLowerCase())
  );

  const valorTotal = projetos.reduce((s, p) => s + Number(p.valor_estimado || 0), 0);
  const emAndamento = projetos.filter(p => ['em_analise', 'aprovado', 'em_producao'].includes(p.status)).length;

  const openNew = () => { setEditing(emptyProjeto()); setDialogOpen(true); };
  const openEdit = (p: Projeto) => { setEditing({ ...p }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!editing?.nome) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        nome: editing.nome,
        descricao: editing.descricao || null,
        cliente_id: editing.cliente_id || null,
        valor_estimado: Number(editing.valor_estimado) || 0,
        data_inicio: editing.data_inicio || null,
        data_previsao_entrega: editing.data_previsao_entrega || null,
        status: editing.status || 'em_analise',
        responsavel: editing.responsavel || null,
        observacoes: editing.observacoes || null,
      };
      if (editing.id) {
        const { error } = await supabase.from('projetos_especiais').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Projeto atualizado');
      } else {
        const { error } = await supabase.from('projetos_especiais').insert(payload);
        if (error) throw error;
        toast.success('Projeto cadastrado');
      }
      setDialogOpen(false);
      await loadData();
    } catch (e: any) {
      toast.error('Erro ao salvar', { description: e.message });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Excluir "${nome}"?`)) return;
    const { error } = await supabase.from('projetos_especiais').delete().eq('id', id);
    if (error) toast.error('Erro', { description: error.message });
    else { toast.success('Projeto excluído'); await loadData(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Projetos" value={projetos.length} subtitle="Especiais" icon={<Briefcase className="h-5 w-5" />} variant="civ" />
        <KPICard title="Valor Total" value={`R$ ${(valorTotal / 1000).toFixed(0)}k`} subtitle="Em carteira" icon={<DollarSign className="h-5 w-5" />} variant="civ" />
        <KPICard title="Em Andamento" value={emAndamento} subtitle="Ativos" icon={<Clock className="h-5 w-5" />} variant="civ" />
        <KPICard title="Concluídos" value={projetos.filter(p => p.status === 'concluido').length} subtitle="Entregues" icon={<AlertTriangle className="h-5 w-5" />} variant="civ" />
      </div>

      <ModuleCard title="Projetos Especiais" variant="civ">
        <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
          <Input placeholder="Buscar projeto..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          <Button size="sm" className="bg-civ hover:bg-civ/90 gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo Projeto
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Carregando...</div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Projeto</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Descrição</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Valor</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Responsável</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Prazo</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">
                      {projetos.length === 0 ? 'Sem dados cadastrados – insira dados para iniciar o monitoramento.' : 'Nenhum projeto encontrado.'}
                    </td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{p.nome}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell truncate max-w-[200px]">{p.descricao || '—'}</td>
                      <td className="py-3 px-4 text-right text-foreground font-semibold">R$ {Number(p.valor_estimado).toLocaleString('pt-BR')}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{p.responsavel || '—'}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground hidden lg:table-cell">{p.data_previsao_entrega ? new Date(p.data_previsao_entrega).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={statusColors[p.status] || 'bg-secondary/20'}>{statusLabels[p.status] || p.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id, p.nome)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        )}
      </ModuleCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
            <DialogDescription>Cadastre um projeto especial ou sob medida.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Nome do Projeto *</label>
              <Input value={editing?.nome || ''} onChange={e => setEditing(prev => ({ ...prev, nome: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input value={editing?.descricao || ''} onChange={e => setEditing(prev => ({ ...prev, descricao: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Valor Estimado</label>
                <Input type="number" value={editing?.valor_estimado || ''} onChange={e => setEditing(prev => ({ ...prev, valor_estimado: Number(e.target.value) }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Responsável</label>
                <Input value={editing?.responsavel || ''} onChange={e => setEditing(prev => ({ ...prev, responsavel: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Data Início</label>
                <Input type="date" value={editing?.data_inicio || ''} onChange={e => setEditing(prev => ({ ...prev, data_inicio: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Prazo Entrega</label>
                <Input type="date" value={editing?.data_previsao_entrega || ''} onChange={e => setEditing(prev => ({ ...prev, data_previsao_entrega: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Cliente</label>
                <Select value={editing?.cliente_id || ''} onValueChange={v => setEditing(prev => ({ ...prev, cliente_id: v || null }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={editing?.status || 'em_analise'} onValueChange={v => setEditing(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="em_producao">Em Produção</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Input value={editing?.observacoes || ''} onChange={e => setEditing(prev => ({ ...prev, observacoes: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background pb-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-civ hover:bg-civ/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />} Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
