import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DashboardCIG } from '@/components/dashboards/DashboardCIG';
import { DashboardCIV } from '@/components/dashboards/DashboardCIV';
import { DashboardCIP } from '@/components/dashboards/DashboardCIP';
import { DashboardCIC } from '@/components/dashboards/DashboardCIC';
import { DashboardCIF } from '@/components/dashboards/DashboardCIF';
import { ModuleType } from '@/data/cigData';

const Index = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('CIG');

  const renderDashboard = () => {
    switch (activeModule) {
      case 'CIG':
        return <DashboardCIG />;
      case 'CIV':
        return <DashboardCIV />;
      case 'CIP':
        return <DashboardCIP />;
      case 'CIC':
        return <DashboardCIC />;
      case 'CIF':
        return <DashboardCIF />;
      default:
        return <DashboardCIG />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeModule={activeModule} onModuleChange={setActiveModule} />
      <main className="animate-fade-in">
        {renderDashboard()}
      </main>
    </div>
  );
};

export default Index;
