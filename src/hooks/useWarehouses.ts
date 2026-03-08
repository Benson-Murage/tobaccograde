/**
 * Warehouse Management Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string | null;
  is_active: boolean;
}

export function useWarehouses() {
  const { companyId } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWarehouses = useCallback(async () => {
    if (!companyId) {
      setWarehouses(getDemoWarehouses());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, code, location, is_active')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setWarehouses(data && data.length > 0 ? data : getDemoWarehouses());
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setWarehouses(getDemoWarehouses());
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  return { warehouses, isLoading, refetch: fetchWarehouses };
}

function getDemoWarehouses(): Warehouse[] {
  return [
    { id: 'wh-a', name: 'Warehouse A', code: 'WH-A', location: 'Main Complex', is_active: true },
    { id: 'wh-b', name: 'Warehouse B', code: 'WH-B', location: 'East Wing', is_active: true },
    { id: 'wh-c', name: 'Warehouse C', code: 'WH-C', location: 'West Wing', is_active: true },
  ];
}
