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
import { UserCheck, Target, TrendingUp, Users, Plus, Edit, Trash2, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface LeadDB {
  id: string;
  nome: string;
  empresa: string | null;
  email: string | null;
  telefone: string | null;
  origem: string;
  status: string;
  observacoes: string | null;
  vendedor_id: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  novo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  qualificado: 'bg-success/20 text-success border-success/30',
  proposta: 'bg-warning/20 text-warning border-warning/30',
  negociacao: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  convertido: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  perdido: 'bg-destructive/20 text-destructive border-destructive/30',
};

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  convertido: 'Convertido',
  perdido: 'Perdido',
};

const emptyLead = (): Partial<LeadDB> => ({
  nome: '', empresa: '', email: '', telefone: '', origem: 'site', status: 'novo', observacoes: ''
});

export function CIVLeads() {
  const [leads, setLeads] = useState<LeadDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Partial<LeadDB> | null>(null);
  const [saving, setSaving] = useState(false);
  const [vendedores, setVendedores] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [leadsRes, vendRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('vendedores').select('id, nome').eq('ativo', true).order('nome'),
    ]);
    setLeads(leadsRes.data || []);
    setVendedores(vendRes.data || []);
    setLoading(false);
  };

  const filtered = leads.filter(l =>
    l.nome.toLowerCase().includes(search.toLowerCase()) ||
    (l.empresa || '').toLowerCase().includes(search.toLowerCase()) ||
    l.origem.toLowerCase().includes(search.toLowerCase())
  );

  const leadsAtivos = leads.filter(l => !['convertido', 'perdido'].includes(l.status));
  const leadsConvertidos = leads.filter(l => l.status === 'convertido').length;
  const taxaConversao = leads.length > 0 ? ((leadsConvertidos / leads.length) * 100).toFixed(0) : '0';

  const openNew = () => { setEditingLead(emptyLead()); setDialogOpen(true); };
  const openEdit = (l: LeadDB) => { setEditingLead({ ...l }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!editingLead?.nome) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        nome: editingLead.nome,
        empresa: editingLead.empresa || null,
        email: editingLead.email || null,
        telefone: editingLead.telefone || null,
        origem: editingLead.origem || 'site',
        status: editingLead.status || 'novo',
        observacoes: editingLead.observacoes || null,
        vendedor_id: editingLead.vendedor_id || null,
      };

      if (editingLead.id) {
        const { error } = await supabase.from('leads').update(payload).eq('id', editingLead.id);
        if (error) throw error;
        toast.success('Lead atualizado');
      } else {
        const { error } = await supabase.from('leads').insert(payload);
        if (error) throw error;
        toast.success('Lead cadastrado');
      }
      setDialogOpen(false);
      await loadData();
    } catch (e: any) {
      toast.error('Erro ao salvar', { description: e.message });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Deseja excluir o lead "${nome}"?`)) return;
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir', { description: error.message }); }
    else { toast.success('Lead excluído'); await loadData(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Leads" value={leads.length} subtitle="Na base" icon={<Users className="h-5 w-5" />} variant="civ" />
        <KPICard title="Leads Ativos" value={leadsAtivos.length} subtitle="Em andamento" icon={<UserCheck className="h-5 w-5" />} variant="civ" />
        <KPICard title="Taxa Conversão" value={`${taxaConversao}%`} subtitle="Lead → Convertido" icon={<Target className="h-5 w-5" />} variant="civ" />
        <KPICard title="Convertidos" value={leadsConvertidos} subtitle="Total" icon={<TrendingUp className="h-5 w-5" />} variant="civ" />
      </div>

      {/* Tabela de Leads */}
      <ModuleCard title="Leads & Oportunidades" variant="civ">
        <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
          <Input
            placeholder="Buscar por nome, empresa ou origem..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button size="sm" className="bg-civ hover:bg-civ/90 gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo Lead
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando...
          </div>
        ) : (
          <div className="rounded-xl border border-border/30 overflow-hidden">
            <ScrollArea className="max-h-[500px]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/30 sticky top-0 z-10">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nome</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Empresa</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Telefone</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Email</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Origem</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">
                        {leads.length === 0
                          ? 'Sem dados cadastrados – insira dados para iniciar o monitoramento.'
                          : 'Nenhum lead encontrado.'}
                      </td></tr>
                    ) : (
                      filtered.map(lead => (
                        <tr key={lead.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">{lead.nome}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{lead.empresa || '—'}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{lead.telefone || '—'}</td>
                          <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{lead.email || '—'}</td>
                          <td className="py-3 px-4 text-muted-foreground capitalize">{lead.origem}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline" className={statusColors[lead.status] || 'bg-secondary/20'}>
                              {statusLabels[lead.status] || lead.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lead)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(lead.id, lead.nome)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </div>
        )}
      </ModuleCard>

      {/* Dialog New/Edit Lead */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead?.id ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
            <DialogDescription>Cadastre ou edite os dados do lead.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input value={editingLead?.nome || ''} onChange={e => setEditingLead(prev => ({ ...prev, nome: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Empresa</label>
              <Input value={editingLead?.empresa || ''} onChange={e => setEditingLead(prev => ({ ...prev, empresa: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input value={editingLead?.telefone || ''} onChange={e => setEditingLead(prev => ({ ...prev, telefone: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={editingLead?.email || ''} onChange={e => setEditingLead(prev => ({ ...prev, email: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Origem</label>
                <Select value={editingLead?.origem || 'site'} onValueChange={v => setEditingLead(prev => ({ ...prev, origem: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="feira">Feira</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="whatsapp">Whatsapp</SelectItem>
                    <SelectItem value="representante">Representante</SelectItem>
                    <SelectItem value="loja">Loja</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={editingLead?.status || 'novo'} onValueChange={v => setEditingLead(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="qualificado">Qualificado</SelectItem>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="negociacao">Negociação</SelectItem>
                    <SelectItem value="convertido">Convertido</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Responsável (Vendedor)</label>
              <Select value={editingLead?.vendedor_id || 'none'} onValueChange={v => setEditingLead(prev => ({ ...prev, vendedor_id: v === 'none' ? null : v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {vendedores.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Input value={editingLead?.observacoes || ''} onChange={e => setEditingLead(prev => ({ ...prev, observacoes: e.target.value }))} className="mt-1" placeholder="Produto de interesse, valor estimado..." />
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
