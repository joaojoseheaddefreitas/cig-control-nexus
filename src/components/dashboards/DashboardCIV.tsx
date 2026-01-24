import { useState } from 'react';
import {
  BarChart2, UserCheck, Store, FileText, Target, Calculator,
  Users, Package, TrendingUp, Briefcase, Brain, LineChart,
} from 'lucide-react';

// Import all CIV tabs
import { CIVDashboard } from '@/components/civ/CIVDashboard';
import { CIVLeads } from '@/components/civ/CIVLeads';
import { CIVLojas } from '@/components/civ/CIVLojas';
import { CIVCarteira } from '@/components/civ/CIVCarteira';
import { CIVPipeline } from '@/components/civ/CIVPipeline';
import { CIVSimulacao } from '@/components/civ/CIVSimulacao';
import { CIVClientes } from '@/components/civ/CIVClientes';
import { CIVProdutos } from '@/components/civ/CIVProdutos';
import { CIVMercado } from '@/components/civ/CIVMercado';
import { CIVProjetos } from '@/components/civ/CIVProjetos';
import { CIVIA } from '@/components/civ/CIVIA';
import { CIVAnalytics } from '@/components/civ/CIVAnalytics';

type TabType = 'dashboard' | 'leads' | 'lojas' | 'carteira' | 'pipeline' | 'simulacao' | 'clientes' | 'produtos' | 'mercado' | 'projetos' | 'ia' | 'analytics';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'leads', label: 'Leads & Oportunidades', icon: UserCheck },
  { id: 'lojas', label: 'Lojas, Canais e Vendedores', icon: Store },
  { id: 'carteira', label: 'Carteira de Pedidos', icon: FileText },
  { id: 'pipeline', label: 'Pipeline Comercial', icon: Target },
  { id: 'simulacao', label: 'Simulação de Prazo', icon: Calculator },
  { id: 'clientes', label: 'Clientes & Relacionamento', icon: Users },
  { id: 'produtos', label: 'Produtos & Mix', icon: Package },
  { id: 'mercado', label: 'Pesquisa de Mercado', icon: TrendingUp },
  { id: 'projetos', label: 'Projetos Especiais', icon: Briefcase },
  { id: 'ia', label: 'Inteligência IA', icon: Brain },
  { id: 'analytics', label: 'Analytics Avançado', icon: LineChart },
];

export function DashboardCIV() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <CIVDashboard />;
      case 'leads': return <CIVLeads />;
      case 'lojas': return <CIVLojas />;
      case 'carteira': return <CIVCarteira />;
      case 'pipeline': return <CIVPipeline />;
      case 'simulacao': return <CIVSimulacao />;
      case 'clientes': return <CIVClientes />;
      case 'produtos': return <CIVProdutos />;
      case 'mercado': return <CIVMercado />;
      case 'projetos': return <CIVProjetos />;
      case 'ia': return <CIVIA />;
      case 'analytics': return <CIVAnalytics />;
      default: return <CIVDashboard />;
    }
  };

  return (
    <div className="flex animate-fade-in">
      {/* Sidebar */}
      <aside className="w-60 min-h-[calc(100vh-8rem)] border-r border-border/50 bg-card/30 p-4">
        <div className="mb-6">
          <h3 className="text-civ font-display text-lg font-bold">CIV CONTROL</h3>
          <p className="text-xs text-muted-foreground">Central de Inteligência de Vendas</p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-civ/20 text-civ'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
            {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
          </h2>
          <p className="text-muted-foreground mt-1">
            CIV CONTROL – Central de Inteligência de Vendas
          </p>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
