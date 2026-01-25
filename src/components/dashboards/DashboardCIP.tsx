import { useState } from 'react';
import {
  BarChart2, Calendar, Layers, Factory, Package, Settings,
  Activity, Brain, LineChart, Clock,
} from 'lucide-react';

// Import all CIP tabs
import { CIPDashboard } from '@/components/cip/CIPDashboard';
import { CIPCarteira } from '@/components/cip/CIPCarteira';
import { CIPProgramacaoDiaria } from '@/components/cip/CIPProgramacaoDiaria';
import { CIPSetores } from '@/components/cip/CIPSetores';
import { CIPProducao } from '@/components/cip/CIPProducao';
import { CIPCapacidade } from '@/components/cip/CIPCapacidade';
import { CIPIA } from '@/components/cip/CIPIA';
import { CIPAnalytics } from '@/components/cip/CIPAnalytics';

type TabType = 'dashboard' | 'carteira' | 'programacao' | 'setores' | 'producao' | 'capacidade' | 'ia' | 'analytics';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'carteira', label: 'Carteira', icon: Package },
  { id: 'programacao', label: 'Programação Diária (PCP)', icon: Calendar },
  { id: 'setores', label: 'Setores', icon: Layers },
  { id: 'producao', label: 'Produção / Baixas', icon: Factory },
  { id: 'capacidade', label: 'Capacidade', icon: Clock },
  { id: 'ia', label: 'Inteligência IA', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
];

export function DashboardCIP() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <CIPDashboard />;
      case 'carteira': return <CIPCarteira />;
      case 'programacao': return <CIPProgramacaoDiaria />;
      case 'setores': return <CIPSetores />;
      case 'producao': return <CIPProducao />;
      case 'capacidade': return <CIPCapacidade />;
      case 'ia': return <CIPIA />;
      case 'analytics': return <CIPAnalytics />;
      default: return <CIPDashboard />;
    }
  };

  return (
    <div className="flex animate-fade-in">
      {/* Sidebar */}
      <aside className="w-60 min-h-[calc(100vh-8rem)] border-r border-border/50 bg-card/30 p-4">
        <div className="mb-6">
          <h3 className="text-cip font-display text-lg font-bold">CIP CONTROL 360</h3>
          <p className="text-xs text-muted-foreground">Central de Inteligência da Produção</p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-cip/20 text-cip'
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
            CIP CONTROL 360 – Central de Inteligência da Produção
          </p>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
