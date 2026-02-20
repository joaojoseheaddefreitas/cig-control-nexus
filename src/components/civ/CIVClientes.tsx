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
import { Users, Target, TrendingUp, DollarSign, Plus, Edit, Trash2, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nome: string;
  cnpj_cpf: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  status_financeiro: string;
  observacoes: string | null;
  ativo: boolean;
}

const statusConfig: Record<string, string> = {
  LIBERADO: 'bg-success/20 text-success border-success/30',
  BLOQUEADO: 'bg-destructive/20 text-destructive border-destructive/30',
  ANALISE: 'bg-warning/20 text-warning border-warning/30',
};

const emptyForm = (): Partial<Cliente> => ({
  nome: '', cnpj_cpf: '', email: '', telefone: '', cidade: '', estado: '', status_financeiro: 'LIBERADO', observacoes: '', ativo: true
});

export function CIVClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Partial<Cliente> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadClientes(); }, []);

  const loadClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clientes').select('*').order('nome');
    if (error) { toast.error('Erro ao carregar clientes'); }
    else { setClientes(data || []); }
    setLoading(false);
  };

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.cidade || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.cnpj_cpf || '').includes(search)
  );

  const liberados = clientes.filter(c => c.status_financeiro === 'LIBERADO').length;
  const bloqueados = clientes.filter(c => c.status_financeiro === 'BLOQUEADO').length;
  const ativos = clientes.filter(c => c.ativo).length;

  const openNew = () => {
    setEditingCliente(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditingCliente({ ...c });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingCliente?.nome) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        nome: editingCliente.nome,
        cnpj_cpf: editingCliente.cnpj_cpf || null,
        email: editingCliente.email || null,
        telefone: editingCliente.telefone || null,
        cidade: editingCliente.cidade || null,
        estado: editingCliente.estado || null,
        status_financeiro: editingCliente.status_financeiro || 'LIBERADO',
        observacoes: editingCliente.observacoes || null,
        ativo: editingCliente.ativo ?? true,
      };

      if (editingCliente.id) {
        const { error } = await supabase.from('clientes').update(payload).eq('id', editingCliente.id);
        if (error) throw error;
        toast.success('Cliente atualizado');
      } else {
        const { error } = await supabase.from('clientes').insert(payload);
        if (error) throw error;
        toast.success('Cliente cadastrado');
      }
      setDialogOpen(false);
      await loadClientes();
    } catch (e: any) {
      toast.error('Erro ao salvar', { description: e.message });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Deseja excluir "${nome}"? Pedidos vinculados não serão afetados.`)) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir', { description: error.message }); }
    else { toast.success('Cliente excluído'); await loadClientes(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Clientes" value={clientes.length} subtitle="Na base" icon={<Users className="h-5 w-5" />} variant="civ" />
        <KPICard title="Ativos" value={ativos} subtitle="Em operação" icon={<TrendingUp className="h-5 w-5" />} variant="civ" />
        <KPICard title="Liberados" value={liberados} subtitle="Crédito ok" icon={<Target className="h-5 w-5" />} variant="civ" />
        <KPICard title="Bloqueados" value={bloqueados} subtitle="Restrição financeira" icon={<DollarSign className="h-5 w-5" />} variant="civ" />
      </div>

      {/* Tabela */}
      <ModuleCard title="Clientes & Relacionamento" variant="civ">
        <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
          <Input
            placeholder="Buscar por nome, cidade ou CNPJ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button size="sm" className="bg-civ hover:bg-civ/90 gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo Cliente
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30 sticky top-0">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">CNPJ/CPF</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Cidade/UF</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Telefone</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status Fin.</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ativo</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {clientes.length === 0 ? 'Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.' : 'Nenhum cliente encontrado.'}
                  </td></tr>
                ) : (
                  filtered.map(c => (
                    <tr key={c.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{c.nome}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell font-mono text-xs">{c.cnpj_cpf || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{[c.cidade, c.estado].filter(Boolean).join('/') || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{c.telefone || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className={statusConfig[c.status_financeiro] || 'bg-secondary/20'}>
                          {c.status_financeiro}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {c.ativo ? (
                          <Badge variant="outline" className="bg-success/20 text-success border-success/30">Sim</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted/20 text-muted-foreground">Não</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id, c.nome)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </ModuleCard>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCliente?.id ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription>Cadastre ou edite os dados do cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input value={editingCliente?.nome || ''} onChange={e => setEditingCliente(prev => ({ ...prev, nome: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">CNPJ/CPF</label>
              <Input value={editingCliente?.cnpj_cpf || ''} onChange={e => setEditingCliente(prev => ({ ...prev, cnpj_cpf: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={editingCliente?.email || ''} onChange={e => setEditingCliente(prev => ({ ...prev, email: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input value={editingCliente?.telefone || ''} onChange={e => setEditingCliente(prev => ({ ...prev, telefone: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Cidade</label>
                <Input value={editingCliente?.cidade || ''} onChange={e => setEditingCliente(prev => ({ ...prev, cidade: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">UF</label>
                <Input value={editingCliente?.estado || ''} onChange={e => setEditingCliente(prev => ({ ...prev, estado: e.target.value.toUpperCase().slice(0, 2) }))} className="mt-1" maxLength={2} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status Financeiro</label>
              <Select value={editingCliente?.status_financeiro || 'LIBERADO'} onValueChange={v => setEditingCliente(prev => ({ ...prev, status_financeiro: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIBERADO">LIBERADO</SelectItem>
                  <SelectItem value="BLOQUEADO">BLOQUEADO</SelectItem>
                  <SelectItem value="ANALISE">EM ANÁLISE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Input value={editingCliente?.observacoes || ''} onChange={e => setEditingCliente(prev => ({ ...prev, observacoes: e.target.value }))} className="mt-1" placeholder="Notas relevantes sobre o cliente..." />
            </div>
            {editingCliente?.id && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="clienteAtivo" checked={editingCliente?.ativo ?? true} onChange={e => setEditingCliente(prev => ({ ...prev, ativo: e.target.checked }))} />
                <label htmlFor="clienteAtivo" className="text-sm">Ativo</label>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
