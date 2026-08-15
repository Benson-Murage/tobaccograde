/**
 * Farmer Management Hook
 * 
 * Provides CRUD operations for farmers with proper database integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export interface Farmer {
  id: string;
  farmer_code: string;
  full_name: string;
  national_id: string | null;
  contract_number: string | null;
  phone: string | null;
  email: string | null;
  farm_location: string | null;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface FarmerFormData {
  full_name: string;
  national_id?: string;
  contract_number?: string;
  phone?: string;
  email?: string;
  farm_location?: string;
}

export function useFarmers() {
  const { companyId } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFarmers = useCallback(async () => {
    if (!companyId) {
      setFarmers([]);
      setError('Your account is not linked to a company yet. Contact your administrator.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('farmers')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setFarmers(data || []);
    } catch (err) {
      console.error('Error fetching farmers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load farmers');
      setFarmers([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  const generateFarmerCode = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `FRM-${year}-${random}`;
  };

  const addFarmer = async (formData: FarmerFormData): Promise<{ success: boolean; farmer?: Farmer; error?: string }> => {
    if (!companyId) {
      return { success: false, error: 'Your account is not linked to a company yet. Contact your administrator.' };
    }

    try {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('farmers')
        .select('id')
        .eq('company_id', companyId)
        .or(`national_id.eq.${formData.national_id || ''},phone.eq.${formData.phone || ''}`)
        .limit(1);

      if (existing && existing.length > 0 && (formData.national_id || formData.phone)) {
        return { success: false, error: 'A farmer with this ID or phone already exists' };
      }

      const { data, error: insertError } = await supabase
        .from('farmers')
        .insert({
          farmer_code: generateFarmerCode(),
          full_name: formData.full_name,
          national_id: formData.national_id || null,
          contract_number: formData.contract_number || null,
          phone: formData.phone || null,
          email: formData.email || null,
          farm_location: formData.farm_location || null,
          company_id: companyId,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setFarmers(prev => [data, ...prev]);
      return { success: true, farmer: data };
    } catch (err) {
      console.error('Error adding farmer:', err);
      return { success: false, error: 'Failed to add farmer' };
    }
  };

  const updateFarmer = async (id: string, updates: Partial<FarmerFormData>): Promise<{ success: boolean; error?: string }> => {
    if (!companyId) {
      return { success: false, error: 'Your account is not linked to a company yet.' };
    }

    try {
      const { error: updateError } = await supabase
        .from('farmers')
        .update(updates)
        .eq('id', id)
        .eq('company_id', companyId);

      if (updateError) {
        throw updateError;
      }

      setFarmers(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      return { success: true };
    } catch (err) {
      console.error('Error updating farmer:', err);
      return { success: false, error: 'Failed to update farmer' };
    }
  };

  const toggleFarmerStatus = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const farmer = farmers.find(f => f.id === id);
    if (!farmer) {
      return { success: false, error: 'Farmer not found' };
    }

    if (!companyId) {
      return { success: false, error: 'Your account is not linked to a company yet.' };
    }

    try {
      const { error: updateError } = await supabase
        .from('farmers')
        .update({ is_active: !farmer.is_active })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setFarmers(prev => prev.map(f => f.id === id ? { ...f, is_active: !f.is_active } : f));
      return { success: true };
    } catch (err) {
      console.error('Error toggling farmer status:', err);
      return { success: false, error: 'Failed to update farmer status' };
    }
  };

  const searchFarmers = (query: string): Farmer[] => {
    if (!query.trim()) return farmers;
    const lowerQuery = query.toLowerCase();
    return farmers.filter(f =>
      f.full_name.toLowerCase().includes(lowerQuery) ||
      f.farmer_code.toLowerCase().includes(lowerQuery) ||
      f.contract_number?.toLowerCase().includes(lowerQuery) ||
      f.phone?.includes(query)
    );
  };

  const stats = {
    total: farmers.length,
    active: farmers.filter(f => f.is_active).length,
    inactive: farmers.filter(f => !f.is_active).length,
  };

  return {
    farmers,
    isLoading,
    error,
    stats,
    addFarmer,
    updateFarmer,
    toggleFarmerStatus,
    searchFarmers,
    refetch: fetchFarmers,
  };
}

