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
    <div className="min-h-screen bg-background">
      <TopModuleTabs activeModule={activeModule} onModuleChange={setActiveModule} />
      <main className="min-h-screen transition-all duration-300 pt-12">
        <div className="animate-fade-in">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default Index;
