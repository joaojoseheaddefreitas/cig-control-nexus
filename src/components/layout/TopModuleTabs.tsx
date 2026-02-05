 import { useState } from 'react';
 import { 
   LayoutDashboard, TrendingUp, Factory, Package, Wallet, 
   Menu, X, Home
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { ModuleType } from '@/data/cigData';
 import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
 import { Button } from '@/components/ui/button';
 
 interface TopModuleTabsProps {
   activeModule: ModuleType;
   onModuleChange: (module: ModuleType) => void;
 }
 
 // Módulos com cores
 const modules = [
   { id: 'CIG' as ModuleType, label: 'CIG', fullName: 'Dashboard Executivo', icon: LayoutDashboard, color: 'cig' },
   { id: 'CIV' as ModuleType, label: 'CIV', fullName: 'Vendas', icon: TrendingUp, color: 'civ' },
   { id: 'CIP' as ModuleType, label: 'CIP', fullName: 'Produção', icon: Factory, color: 'cip' },
   { id: 'CIC' as ModuleType, label: 'CIC', fullName: 'Compras', icon: Package, color: 'cic' },
   { id: 'CIF' as ModuleType, label: 'CIF', fullName: 'Financeiro', icon: Wallet, color: 'cif' },
 ];
 
 // Sub-páginas por módulo
 const subPages: Record<ModuleType, { id: string; label: string }[]> = {
   CIG: [
     { id: 'dashboard', label: 'Dashboard Executivo' },
   ],
   CIV: [
     { id: 'dashboard', label: 'Dashboard' },
     { id: 'leads', label: 'Leads & Oportunidades' },
     { id: 'lojas', label: 'Lojas, Canais e Vendedores' },
     { id: 'carteira', label: 'Carteira de Pedidos' },
     { id: 'pipeline', label: 'Pipeline Comercial' },
     { id: 'clientes', label: 'Clientes' },
     { id: 'analytics', label: 'Analytics' },
   ],
   CIP: [
     { id: 'dashboard', label: 'Dashboard' },
     { id: 'programacao', label: 'Programação / OPs' },
     { id: 'producao', label: 'Baixas por Setor' },
     { id: 'setores', label: 'Setores Produtivos' },
     { id: 'produtos', label: 'Cadastro Produtos' },
     { id: 'rastreamento', label: 'Rastreamento' },
     { id: 'analytics', label: 'Analytics' },
   ],
   CIC: [
     { id: 'dashboard', label: 'Dashboard' },
     { id: 'estoque', label: 'Estoque' },
     { id: 'pedidos', label: 'Pedidos de Compra' },
     { id: 'fornecedores', label: 'Fornecedores' },
   ],
   CIF: [
     { id: 'dashboard', label: 'Dashboard' },
     { id: 'contas', label: 'Contas a Pagar/Receber' },
     { id: 'fluxo', label: 'Fluxo de Caixa' },
     { id: 'dre', label: 'DRE' },
   ],
 };
 
 export function TopModuleTabs({ activeModule, onModuleChange }: TopModuleTabsProps) {
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [selectedPage, setSelectedPage] = useState('dashboard');
 
   const handleModuleClick = (module: ModuleType) => {
     onModuleChange(module);
     setSidebarOpen(true);
   };
 
   const handlePageSelect = (pageId: string) => {
     setSelectedPage(pageId);
     setSidebarOpen(false);
   };
 
   const activeModuleData = modules.find(m => m.id === activeModule);
 
   return (
     <>
       {/* Barra de Abas no Topo - Fixa */}
       <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-b border-border/50 h-14">
         <div className="h-full flex items-center justify-between px-2 sm:px-4">
           {/* Logo / Home */}
           <button
             onClick={() => {
               onModuleChange('CIG');
               setSelectedPage('dashboard');
             }}
             className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
           >
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
               <Home className="h-4 w-4 text-primary-foreground" />
             </div>
             <span className="font-display text-sm font-bold text-foreground hidden sm:inline">CIG</span>
           </button>
 
           {/* Abas dos Módulos */}
           <nav className="flex items-center gap-1">
             {modules.map((module) => {
               const isActive = activeModule === module.id;
               return (
                 <button
                   key={module.id}
                   onClick={() => handleModuleClick(module.id)}
                   className={cn(
                     'flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all',
                     isActive 
                       ? 'text-foreground' 
                       : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                   )}
                   style={isActive ? { 
                     backgroundColor: `hsl(var(--${module.color}) / 0.15)`,
                     color: `hsl(var(--${module.color}))`,
                   } : undefined}
                 >
                   <module.icon className="h-4 w-4" />
                   <span className="hidden xs:inline">{module.label}</span>
                 </button>
               );
             })}
           </nav>
 
           {/* Status */}
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
             <span className="text-xs text-muted-foreground hidden sm:inline">Online</span>
           </div>
         </div>
       </header>
 
       {/* Sheet Lateral para Sub-Páginas */}
       <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
         <SheetContent side="left" className="w-72 p-4">
           <SheetClose className="absolute right-4 top-4">
             <X className="h-5 w-5" />
           </SheetClose>
           
           {/* Título do módulo */}
           <div className="mb-6 pb-4 border-b border-border/30">
             <div className="flex items-center gap-3">
               {activeModuleData && (
                 <>
                   <div 
                     className="w-10 h-10 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: `hsl(var(--${activeModuleData.color}) / 0.2)` }}
                   >
                     <activeModuleData.icon 
                       className="h-5 w-5" 
                       style={{ color: `hsl(var(--${activeModuleData.color}))` }}
                     />
                   </div>
                   <div>
                     <h3 
                       className="font-display text-lg font-bold"
                       style={{ color: `hsl(var(--${activeModuleData.color}))` }}
                     >
                       {activeModuleData.label}
                     </h3>
                     <p className="text-xs text-muted-foreground">{activeModuleData.fullName}</p>
                   </div>
                 </>
               )}
             </div>
           </div>
 
           {/* Lista de páginas */}
           <nav className="space-y-1">
             <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 px-3">
               Páginas
             </p>
             {subPages[activeModule]?.map((page) => (
               <button
                 key={page.id}
                 onClick={() => handlePageSelect(page.id)}
                 className={cn(
                   'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left',
                   selectedPage === page.id
                     ? 'bg-secondary text-foreground font-medium'
                     : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                 )}
               >
                 {page.label}
               </button>
             ))}
           </nav>
 
           {/* Voltar ao Home */}
           <div className="mt-6 pt-4 border-t border-border/30">
             <button
               onClick={() => {
                 onModuleChange('CIG');
                 setSelectedPage('dashboard');
                 setSidebarOpen(false);
               }}
               className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
             >
               <Home className="h-4 w-4" />
               Voltar ao Home / Dashboard
             </button>
           </div>
         </SheetContent>
       </Sheet>
     </>
   );
 }