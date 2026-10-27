/**
 * Bale Management Hook
 * 
 * Provides CRUD operations for bales with proper database integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { logAudit } from '@/lib/audit-logger';

export interface Bale {
  id: string;
  bale_code: string;
  farmer_id: string;
  farmer_name?: string;
  farmer_code?: string;
  grading_id?: string;
  weight_kg: number;
  warehouse_id: string;
  warehouse_name?: string;
  status: 'registered' | 'pending_grading' | 'graded' | 'disputed' | 'approved' | 'paid';
  grade_code?: string | null;
  grade_class?: string | null;
  registered_at: string;
  batch_number?: string | null;
  lot_number?: string | null;
  qr_code?: string | null;
  company_id: string;
}

export interface BaleFormData {
  farmer_id: string;
  weight_kg: number;
  warehouse_id: string;
  batch_number?: string;
  lot_number?: string;
  notes?: string;
}

export function useBales() {
  const { companyId } = useAuth();
  const [bales, setBales] = useState<Bale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBales = useCallback(async () => {
    if (!companyId) {
      setBales([]);
      setError('Your account is not linked to a company yet. Contact your administrator.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('bales')
        .select(`
          *,
          farmers (
            full_name,
            farmer_code
          ),
          warehouses (
            name
          ),
          gradings (
            id,
            grade_code,
            grade_class
          )
        `)
        .eq('company_id', companyId)
        .order('registered_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      const transformed: Bale[] = (data || []).map((b: any) => ({
        id: b.id,
        bale_code: b.bale_code,
        farmer_id: b.farmer_id,
        farmer_name: b.farmers?.full_name,
        farmer_code: b.farmers?.farmer_code,
        grading_id: b.gradings?.[0]?.id || undefined,
        weight_kg: b.weight_kg,
        warehouse_id: b.warehouse_id,
        warehouse_name: b.warehouses?.name,
        status: b.status,
        grade_code: b.gradings?.[0]?.grade_code || null,
        grade_class: b.gradings?.[0]?.grade_class || null,
        registered_at: b.registered_at,
        batch_number: b.batch_number,
        lot_number: b.lot_number,
        qr_code: b.qr_code,
        company_id: b.company_id,
      }));

      setBales(transformed);
    } catch (err) {
      console.error('Error fetching bales:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bales');
      setBales([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchBales();
  }, [fetchBales]);

  const generateBaleCode = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `BL-${year}-${random}`;
  };

  const registerBale = async (formData: BaleFormData): Promise<{ success: boolean; bale?: Bale; error?: string }> => {
    if (!companyId) {
      return { success: false, error: 'Your account is not linked to a company yet. Contact your administrator.' };
    }

    try {
      const baleCode = generateBaleCode();
      
      const { data, error: insertError } = await supabase
        .from('bales')
        .insert({
          bale_code: baleCode,
          farmer_id: formData.farmer_id,
          weight_kg: formData.weight_kg,
          warehouse_id: formData.warehouse_id,
          batch_number: formData.batch_number || null,
          lot_number: formData.lot_number || null,
          qr_code: baleCode,
          company_id: companyId,
          status: 'registered',
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      await logAudit({
        action: 'CREATE',
        entity_type: 'bale',
        entity_id: data.id,
        new_values: { ...data } as Record<string, unknown>,
      });

      await fetchBales();
      toast.success('Bale registered successfully');
      return { success: true, bale: data };
    } catch (err) {
      console.error('Error registering bale:', err);
      toast.error('Failed to register bale');
      return { success: false, error: 'Failed to register bale' };
    }
  };

  const updateBaleStatus = async (id: string, status: Bale['status']): Promise<{ success: boolean; error?: string }> => {
    if (!companyId) {
      return { success: false, error: 'Your account is not linked to a company yet.' };
    }

    try {
      const { error: updateError } = await supabase
        .from('bales')
        .update({ status })
        .eq('id', id)
        .eq('company_id', companyId);

      if (updateError) {
        throw updateError;
      }

      setBales(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      return { success: true };
    } catch (err) {
      console.error('Error updating bale status:', err);
      return { success: false, error: 'Failed to update bale status' };
    }
  };

  const searchBales = (query: string): Bale[] => {
    if (!query.trim()) return bales;
    const lowerQuery = query.toLowerCase();
    return bales.filter(b =>
      b.bale_code.toLowerCase().includes(lowerQuery) ||
      b.farmer_name?.toLowerCase().includes(lowerQuery) ||
      b.farmer_code?.toLowerCase().includes(lowerQuery)
    );
  };

  const filterByStatus = (status: string): Bale[] => {
    if (status === 'all') return bales;
    return bales.filter(b => b.status === status);
  };

  const stats = {
    total: bales.length,
    registered: bales.filter(b => b.status === 'registered').length,
    pending: bales.filter(b => b.status === 'pending_grading').length,
    graded: bales.filter(b => b.status === 'graded').length,
    disputed: bales.filter(b => b.status === 'disputed').length,
    paid: bales.filter(b => b.status === 'paid').length,
  };

  return {
    bales,
    isLoading,
    error,
    stats,
    registerBale,
    updateBaleStatus,
    searchBales,
    filterByStatus,
    refetch: fetchBales,
  };
}
