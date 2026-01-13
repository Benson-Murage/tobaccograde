import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isOnline, cacheData, getCachedData, queueForSync } from '@/lib/offline-sync';

interface UseOfflineDataOptions {
  table: string;
  cacheKey: string;
  cacheTtlMs?: number;
  select?: string;
  filter?: {
    column: string;
    value: string | number | boolean;
  };
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
}

interface UseOfflineDataResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  isCached: boolean;
  refresh: () => Promise<void>;
}

export function useOfflineData<T>({
  table,
  cacheKey,
  cacheTtlMs = 3600000,
  select = '*',
  filter,
  orderBy,
  limit,
}: UseOfflineDataOptions): UseOfflineDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Try cache first if offline
    if (!isOnline()) {
      const cached = getCachedData<T[]>(cacheKey);
      if (cached) {
        setData(cached);
        setIsCached(true);
        setIsLoading(false);
        return;
      }
    }

    try {
      // Build query based on table name
      const { data: result, error: queryError } = await supabase
        .from(table as 'profiles')
        .select(select);

      if (queryError) throw queryError;

      const typedResult = (result as unknown as T[]) || [];
      setData(typedResult);
      setIsCached(false);
      cacheData(cacheKey, typedResult, cacheTtlMs);
    } catch (err) {
      const cached = getCachedData<T[]>(cacheKey);
      if (cached) {
        setData(cached);
        setIsCached(true);
      } else {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [table, cacheKey, cacheTtlMs, select, filter, orderBy, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isOffline: !isOnline(),
    isCached,
    refresh: fetchData,
  };
}
