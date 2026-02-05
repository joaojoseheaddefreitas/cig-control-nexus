import { useState } from 'react';
import { 
  Search, Filter, Plus, Edit, Trash2, Eye, Package, 
  QrCode, Clock, DollarSign, Layers, Save, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { KPICard } from '@/components/ui/KPICard';
import { ModuleCard } from '@/components/ui/ModuleCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

// Tipos
interface Produto {
  id: string;
  codigo: string;
  modelo: string;
  descricao: string;
  categoria: 'sofa' | 'poltrona' | 'cadeira' | 'mesa' | 'rack' | 'estante';
  tempos: {
    corte: number;
    montagem: number;
    revestimento: number;
    acabamento: number;
    embalagem: number;
  };
  rtc: number; // Tempo total em horas
  precoBase: number;
  margemComercial: number;
  precoFinal: number;
  ativo: boolean;
}

// Dados mock
const produtosMock: Produto[] = [
  { 
    id: '1', codigo: 'SF-001', modelo: 'ANCORA', descricao: 'Sofá 2 Lugares Retrátil', 
    categoria: 'sofa',
    tempos: { corte: 2.8, montagem: 0.8, revestimento: 0.7, acabamento: 0.3, embalagem: 0.2 },
    rtc: 4.8, precoBase: 1200, margemComercial: 38, precoFinal: 1650, ativo: true
  },
  { 
    id: '2', codigo: 'SF-002', modelo: 'ASTOR', descricao: 'Sofá 3 Lugares Fixo', 
    categoria: 'sofa',
    tempos: { corte: 3.0, montagem: 1.2, revestimento: 0.9, acabamento: 0.4, embalagem: 0.3 },
    rtc: 5.8, precoBase: 1280, margemComercial: 33, precoFinal: 1700, ativo: true
  },
  { 
    id: '3', codigo: 'PL-001', modelo: 'BERGAMO', descricao: 'Poltrona Decorativa', 
    categoria: 'poltrona',
    tempos: { corte: 1.5, montagem: 0.5, revestimento: 0.4, acabamento: 0.2, embalagem: 0.15 },
    rtc: 2.75, precoBase: 480, margemComercial: 42, precoFinal: 680, ativo: true
  },
  { 
    id: '4', codigo: 'CD-001', modelo: 'TRIESTE', descricao: 'Cadeira Estofada', 
    categoria: 'cadeira',
    tempos: { corte: 0.8, montagem: 0.3, revestimento: 0.25, acabamento: 0.1, embalagem: 0.1 },
    rtc: 1.55, precoBase: 85, margemComercial: 58, precoFinal: 135, ativo: true
  },
  { 
    id: '5', codigo: 'MS-001', modelo: 'FLORENÇA', descricao: 'Mesa de Jantar 6 Lugares', 
    categoria: 'mesa',
    tempos: { corte: 1.2, montagem: 0.6, revestimento: 0, acabamento: 0.4, embalagem: 0.2 },
    rtc: 2.4, precoBase: 650, margemComercial: 35, precoFinal: 880, ativo: true
  },
  { 
    id: '6', codigo: 'SF-003', modelo: 'FLEX', descricao: 'Sofá Canto com Mecanismo', 
    categoria: 'sofa',
    tempos: { corte: 10.0, montagem: 0.8, revestimento: 0.83, acabamento: 0.5, embalagem: 0.4 },
    rtc: 12.53, precoBase: 1100, margemComercial: 35, precoFinal: 1483, ativo: false
  },
];

const categoriaConfig: Record<string, { label: string; color: string }> = {
  sofa: { label: 'Sofá', color: 'bg-orange-500/20 text-orange-400' },
  poltrona: { label: 'Poltrona', color: 'bg-purple-500/20 text-purple-400' },
  cadeira: { label: 'Cadeira', color: 'bg-blue-500/20 text-blue-400' },
  mesa: { label: 'Mesa', color: 'bg-green-500/20 text-green-400' },
  rack: { label: 'Rack', color: 'bg-cyan-500/20 text-cyan-400' },
  estante: { label: 'Estante', color: 'bg-pink-500/20 text-pink-400' },
};

export function CIPCadastroProdutosCompleto() {
  const [search, setSearch] = useState('');
  const [produtos] = useState<Produto[]>(produtosMock);
  const [activeTab, setActiveTab] = useState('lista');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredProdutos = produtos.filter(p => 
    p.codigo.toLowerCase().includes(search.toLowerCase()) ||
    p.modelo.toLowerCase().includes(search.toLowerCase()) ||
    p.descricao.toLowerCase().includes(search.toLowerCase())
  );

  // KPIs
  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter(p => p.ativo).length;
  const tempoMedio = produtos.reduce((acc, p) => acc + p.rtc, 0) / produtos.length;
  const margemMedia = produtos.reduce((acc, p) => acc + p.margemComercial, 0) / produtos.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Aviso */}
      <div className="p-4 rounded-lg bg-cip/10 border border-cip/30">
        <div className="flex items-start gap-3">
          <Package className="h-6 w-6 text-cip flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-cip">Cadastro de Produtos (CIP)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Produtos são cadastrados com <strong>código, modelo, descrição, tempos produtivos, RTC e preço base</strong>. 
              A <strong>margem comercial</strong> é aplicada pelo setor de Vendas (CIV).
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Produtos"
          value={totalProdutos}
          subtitle="Cadastrados"
          icon={<Package className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Produtos Ativos"
          value={produtosAtivos}
          subtitle="Comercializados"
          icon={<Layers className="h-5 w-5" />}
          trend="up"
          trendValue={`${((produtosAtivos/totalProdutos)*100).toFixed(0)}%`}
          variant="cip"
        />
        <KPICard
          title="Tempo Médio (RTC)"
          value={`${tempoMedio.toFixed(1)}h`}
          subtitle="Por produto"
          icon={<Clock className="h-5 w-5" />}
          variant="cip"
        />
        <KPICard
          title="Margem Média"
          value={`${margemMedia.toFixed(0)}%`}
          subtitle="Comercial aplicada"
          icon={<DollarSign className="h-5 w-5" />}
          variant="cip"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="lista">Lista de Produtos</TabsTrigger>
            <TabsTrigger value="novo">Novo Produto</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab Lista */}
        <TabsContent value="lista" className="space-y-4">
          <div className="rounded-xl border border-border/30 bg-card/80 overflow-hidden max-h-[500px]">
            <ScrollArea className="h-full max-h-[500px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Modelo</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Descrição</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Categoria</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">RTC (h)</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Preço Base</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium hidden xl:table-cell">Margem</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Preço Final</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProdutos.map((produto) => (
                    <tr key={produto.id} className={cn(
                      "border-b border-border/30 hover:bg-secondary/30 transition-colors",
                      !produto.ativo && "opacity-50"
                    )}>
                      <td className="py-3 px-4 font-mono font-medium text-foreground">{produto.codigo}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{produto.modelo}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{produto.descricao}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={categoriaConfig[produto.categoria].color}>
                          {categoriaConfig[produto.categoria].label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-foreground hidden lg:table-cell">
                        <span className="font-mono">{produto.rtc.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground hidden lg:table-cell">
                        R$ {produto.precoBase.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right hidden xl:table-cell">
                        <span className="text-civ font-semibold">{produto.margemComercial}%</span>
                      </td>
                      <td className="py-3 px-4 text-right text-foreground font-semibold">
                        R$ {produto.precoFinal.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={produto.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <span className="font-mono text-cip">{produto.codigo}</span>
                                  <span>•</span>
                                  <span>{produto.modelo}</span>
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-muted-foreground">{produto.descricao}</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                  <div className="p-3 rounded-lg bg-secondary/50">
                                    <p className="text-xs text-muted-foreground">Corte</p>
                                    <p className="font-semibold">{produto.tempos.corte}h</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-secondary/50">
                                    <p className="text-xs text-muted-foreground">Montagem</p>
                                    <p className="font-semibold">{produto.tempos.montagem}h</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-secondary/50">
                                    <p className="text-xs text-muted-foreground">Revestimento</p>
                                    <p className="font-semibold">{produto.tempos.revestimento}h</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-secondary/50">
                                    <p className="text-xs text-muted-foreground">Acabamento</p>
                                    <p className="font-semibold">{produto.tempos.acabamento}h</p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-secondary/50">
                                    <p className="text-xs text-muted-foreground">Embalagem</p>
                                    <p className="font-semibold">{produto.tempos.embalagem}h</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                                  <div className="text-center p-3 rounded-lg bg-cip/10">
                                    <p className="text-xs text-muted-foreground">RTC Total</p>
                                    <p className="text-xl font-bold text-cip">{produto.rtc}h</p>
                                  </div>
                                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                                    <p className="text-xs text-muted-foreground">Preço Base</p>
                                    <p className="text-xl font-bold">R$ {produto.precoBase}</p>
                                  </div>
                                  <div className="text-center p-3 rounded-lg bg-civ/10">
                                    <p className="text-xs text-muted-foreground">Preço Final</p>
                                    <p className="text-xl font-bold text-civ">R$ {produto.precoFinal}</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Tab Novo Produto */}
        <TabsContent value="novo" className="space-y-4">
          <ModuleCard title="Cadastrar Novo Produto" variant="cip">
            <div className="space-y-6">
              {/* Informações básicas */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">INFORMAÇÕES BÁSICAS</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Código</label>
                    <Input placeholder="SF-001" className="mt-1 font-mono" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Modelo</label>
                    <Input placeholder="ANCORA" className="mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-muted-foreground">Descrição</label>
                    <Input placeholder="Sofá 2 Lugares Retrátil" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Categoria</label>
                    <select className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      <option>Sofá</option>
                      <option>Poltrona</option>
                      <option>Cadeira</option>
                      <option>Mesa</option>
                      <option>Rack</option>
                      <option>Estante</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Preço Base (R$)</label>
                    <Input type="number" placeholder="0.00" className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Tempos produtivos */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">TEMPOS PRODUTIVOS (horas)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Corte</label>
                    <Input type="number" step="0.1" placeholder="0.0" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Montagem</label>
                    <Input type="number" step="0.1" placeholder="0.0" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Revestimento</label>
                    <Input type="number" step="0.1" placeholder="0.0" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Acabamento</label>
                    <Input type="number" step="0.1" placeholder="0.0" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Embalagem</label>
                    <Input type="number" step="0.1" placeholder="0.0" className="mt-1" />
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-cip/10 border border-cip/30 inline-block">
                  <span className="text-sm text-muted-foreground">RTC Calculado: </span>
                  <span className="font-bold text-cip">0.0h</span>
                </div>
              </div>

              {/* Observações para produtos especiais */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">OBSERVAÇÕES (Produtos Especiais)</h4>
                <Textarea 
                  placeholder="Observações para cadastro de produtos especiais, personalizações, restrições, etc."
                  className="min-h-[100px]"
                />
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setActiveTab('lista')}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button className="bg-cip hover:bg-cip/90">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Produto
                </Button>
              </div>
            </div>
          </ModuleCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
