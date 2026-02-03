import { useState } from 'react';
import { GlobalSidebar } from '@/components/layout/GlobalSidebar';
import { DashboardCIGMelhorado } from '@/components/dashboards/DashboardCIGMelhorado';
import { DashboardCIV } from '@/components/dashboards/DashboardCIV';
import { DashboardCIP } from '@/components/dashboards/DashboardCIP';
import { DashboardCIC } from '@/components/dashboards/DashboardCIC';
import { DashboardCIF } from '@/components/dashboards/DashboardCIF';
import { ModuleType } from '@/data/cigData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('CIG');
  const isMobile = useIsMobile();

  const renderDashboard = () => {
    switch (activeModule) {
      case 'CIG':
        return <DashboardCIGMelhorado />;
      case 'CIV':
        return <DashboardCIV />;
      case 'CIP':
        return <DashboardCIP />;
      case 'CIC':
        return <DashboardCIC />;
      case 'CIF':
        return <DashboardCIF />;
      default:
        return <DashboardCIGMelhorado />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Global */}
      <GlobalSidebar activeModule={activeModule} onModuleChange={setActiveModule} />

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        isMobile ? "pt-16" : "ml-64"
      )}>
        <div className="animate-fade-in">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default Index;
