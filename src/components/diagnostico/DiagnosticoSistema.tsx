import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, CheckCircle2, XCircle, RefreshCw, 
  Database, Clock, AlertTriangle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { testConnection, fetchActionLogs, fetchErrorLogs } from '@/services/pedidoService';

interface ConnectionStatus {
  ok: boolean;
  latency: number;
  error?: string;
  checkedAt: Date;
}

export function DiagnosticoSistema() {
  const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [conn, acts, errs] = await Promise.all([
        testConnection(),
        fetchActionLogs(5),
        fetchErrorLogs(5),
      ]);
      setConnStatus({ ...conn, checkedAt: new Date() });
      setActions(acts.data || []);
      setErrors(errs.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Diagnóstico do Sistema
          </h2>
          <p className="text-sm text-muted-foreground">Status em tempo real do backend</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Status da Conexão */}
      <div className={cn(
        "p-4 rounded-xl border",
        connStatus?.ok 
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-red-500/10 border-red-500/30"
      )}>
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Banco de Dados</span>
              {connStatus ? (
                connStatus.ok ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Conectado
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                    <XCircle className="h-3 w-3 mr-1" /> Erro
                  </Badge>
                )
              ) : (
                <Badge className="text-xs">Verificando...</Badge>
              )}
            </div>
            {connStatus && (
              <div className="text-xs text-muted-foreground mt-1 flex gap-4">
                <span>Latência: {connStatus.latency}ms</span>
                <span>Verificado: {connStatus.checkedAt.toLocaleTimeString('pt-BR')}</span>
                {connStatus.error && <span className="text-red-400">{connStatus.error}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Últimas 5 ações */}
        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Últimas 5 Ações
          </h3>
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ação registrada</p>
          ) : (
            <div className="space-y-2">
              {actions.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs p-2 rounded bg-secondary/30">
                  {a.status === 'success' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                  )}
                  <span className="font-mono font-medium">{a.action}</span>
                  <span className="text-muted-foreground">{a.entity}</span>
                  <span className="ml-auto text-muted-foreground">
                    {new Date(a.created_at).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos 5 erros */}
        <div className="rounded-xl border border-border/30 bg-card/80 p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Últimos 5 Erros
          </h3>
          {errors.length === 0 ? (
            <p className="text-sm text-green-400 text-center py-4">✓ Sem erros registrados</p>
          ) : (
            <div className="space-y-2">
              {errors.map((e) => (
                <div key={e.id} className="text-xs p-2 rounded bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    <span className="font-mono">{e.action} {e.entity}</span>
                    <span className="ml-auto text-muted-foreground">
                      {new Date(e.created_at).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  {e.details?.error && (
                    <p className="text-red-300 mt-1 pl-5">{String(e.details.error)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
