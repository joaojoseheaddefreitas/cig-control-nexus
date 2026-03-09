import { useState } from 'react';
import { TopModuleTabs } from '@/components/layout/TopModuleTabs';
import { DashboardCIGMelhorado } from '@/components/dashboards/DashboardCIGMelhorado';
import { DashboardCIV } from '@/components/dashboards/DashboardCIV';
import { DashboardCIP } from '@/components/dashboards/DashboardCIP';
import { DashboardCIC } from '@/components/dashboards/DashboardCIC';
import { DashboardCIF } from '@/components/dashboards/DashboardCIF';
import { ModuleType } from '@/data/cigData';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('CIG');

  const handleGoHome = () => {
    setActiveModule('CIG');
  };

  const renderDashboard = () => {
    switch (activeModule) {
      case 'CIG':
        return <DashboardCIGMelhorado onGoHome={handleGoHome} />;
      case 'CIV':
        return <DashboardCIV onGoHome={handleGoHome} />;
      case 'CIP':
        return <DashboardCIP onGoHome={handleGoHome} />;
      case 'CIC':
        return <DashboardCIC onGoHome={handleGoHome} />;
      case 'CIF':
        return <DashboardCIF onGoHome={handleGoHome} />;
      default:
        return <DashboardCIGMelhorado onGoHome={handleGoHome} />;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <TopModuleTabs activeModule={activeModule} onModuleChange={setActiveModule} />
      <main className="flex-1 overflow-hidden pt-12">
        <div className="h-full animate-fade-in">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default Index;
