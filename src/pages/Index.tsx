import { useState } from 'react';
import { TopModuleTabs } from '@/components/layout/TopModuleTabs';
import { DashboardCIGMelhorado } from '@/components/dashboards/DashboardCIGMelhorado';
import { DashboardCIV } from '@/components/dashboards/DashboardCIV';
import { DashboardCIP } from '@/components/dashboards/DashboardCIP';
import { DashboardCIC } from '@/components/dashboards/DashboardCIC';
import { DashboardCIF } from '@/components/dashboards/DashboardCIF';
import { ModuleType } from '@/data/cigData';
import { SplashScreen } from '@/components/SplashScreen';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('CIG');
  const [showSplash, setShowSplash] = useState(true);
  const [dashboardReady, setDashboardReady] = useState(false);

  const handleGoHome = () => {
    setActiveModule('CIG');
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Trigger staggered entrance after splash is gone
    requestAnimationFrame(() => setDashboardReady(true));
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
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Tab bar — staggered entrance */}
      <div className={cn(
        'transition-all duration-700 ease-out',
        !showSplash && dashboardReady
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-6'
      )} style={{ transitionDelay: '100ms' }}>
        <TopModuleTabs activeModule={activeModule} onModuleChange={setActiveModule} />
      </div>

      {/* Dashboard — rises from behind with depth */}
      <main className={cn(
        'flex-1 pt-12 overflow-hidden transition-all duration-700 ease-out',
        !showSplash && dashboardReady
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-10 scale-95'
      )} style={{ transitionDelay: '300ms' }}>
        <div className="h-full">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default Index;
