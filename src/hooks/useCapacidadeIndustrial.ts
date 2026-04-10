import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  calcularCapacidadeFabrica,
  type CapacidadeFabrica,
} from '@/services/capacidadeIndustrialService';

/**
 * Unified reactive hook for factory capacity data.
 * ALL tabs (Dashboard, PCP, Setores) MUST use this hook
 * so they share the same source of truth.
 *
 * Subscribes to realtime changes on:
 * - ops
 * - setores_produtivos
 * - setor_rastreamento
 * - op_route_steps
 * - produto_setor_tempos
 * - pedidos
 */
export function useCapacidadeIndustrial() {
  const [capacidade, setCapacidade] = useState<CapacidadeFabrica | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await calcularCapacidadeFabrica();
      setCapacidade(result);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('[useCapacidadeIndustrial] Erro:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime subscriptions — any change in these tables triggers recalculation
  useEffect(() => {
    const channel = supabase
      .channel('capacidade-industrial-unified')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setores_produtivos' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setor_rastreamento' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'op_route_steps' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produto_setor_tempos' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { capacidade, loading, refresh, lastUpdate };
}
