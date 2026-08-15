/**
 * Dispute Management Hook
 * 
 * Provides CRUD operations for disputes with proper database integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit-logger';
import { toast } from 'sonner';

export interface Dispute {
  id: string;
  grading_id: string;
  company_id: string;
  raised_by: string;
  raised_at: string;
  reason: string;
  status: 'open' | 'under_review' | 'resolved' | 'escalated' | 'closed';
  priority: string | null;
  resolution_notes: string | null;
  new_grade_code: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  evidence_urls: string[] | null;
  // Joined fields
  bale_code?: string;
  farmer_name?: string;
  farmer_id?: string;
  original_grade?: string;
  grader_name?: string;
}

export interface DisputeFormData {
  grading_id: string;
  reason: string;
  priority?: 'low' | 'medium' | 'high';
  evidence_urls?: string[];
  requested_grade?: string;
}

export function useDisputes() {
  const { user, companyId } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDisputes = useCallback(async () => {
    if (!companyId) {
      setDisputes([]);
      setError('Your account is not linked to a company yet. Contact your administrator.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('disputes')
        .select(`
          *,
          gradings (
            grade_code,
            bales (
              bale_code,
              farmers (
                full_name,
                farmer_code
              )
            ),
            profiles:grader_id (
              full_name
            )
          )
        `)
        .eq('company_id', companyId)
        .order('raised_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const transformed: Dispute[] = (data || []).map((d: any) => ({
        id: d.id,
        grading_id: d.grading_id,
        company_id: d.company_id,
        raised_by: d.raised_by,
        raised_at: d.raised_at,
        reason: d.reason,
        status: d.status,
        priority: d.priority,
        resolution_notes: d.resolution_notes,
        new_grade_code: d.new_grade_code,
        resolved_by: d.resolved_by,
        resolved_at: d.resolved_at,
        evidence_urls: d.evidence_urls,
        bale_code: d.gradings?.bales?.bale_code,
        farmer_name: d.gradings?.bales?.farmers?.full_name,
        farmer_id: d.gradings?.bales?.farmers?.farmer_code,
        original_grade: d.gradings?.grade_code,
        grader_name: d.gradings?.profiles?.full_name,
      }));

      setDisputes(transformed);
    } catch (err) {
      console.error('Error fetching disputes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
      setDisputes([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const createDispute = async (formData: DisputeFormData): Promise<{ success: boolean; dispute?: Dispute; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!companyId) {
      return { success: false, error: 'Your account is not linked to a company yet.' };
    }

    try {
      const { data, error: insertError } = await supabase
        .from('disputes')
        .insert({
          grading_id: formData.grading_id,
          company_id: companyId,
          raised_by: user.id,
          reason: formData.reason,
          priority: formData.priority || 'medium',
          new_grade_code: formData.requested_grade || null,
          evidence_urls: formData.evidence_urls || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      await logAudit({
        action: 'DISPUTE_OPEN',
        entity_type: 'dispute',
        entity_id: data.id,
        new_values: { ...formData } as Record<string, unknown>,
      });

      await fetchDisputes();
      return { success: true, dispute: data };
    } catch (err) {
      console.error('Error creating dispute:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create dispute' };
    }
  };

  const reviewDispute = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);
    
    try {
      const { error: updateError } = await supabase
        .from('disputes')
        .update({ 
          status: 'under_review',
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await logAudit({
        action: 'UPDATE',
        entity_type: 'dispute',
        entity_id: id,
        new_values: { status: 'under_review' },
      });

      setDisputes(prev => prev.map(d => 
        d.id === id ? { ...d, status: 'under_review' as const } : d
      ));
      toast.success('Dispute is now under review');
      return { success: true };
    } catch (err) {
      console.error('Error reviewing dispute:', err);
      const message = err instanceof Error ? err.message : 'Failed to update dispute';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsProcessing(false);
    }
  };

  const resolveDispute = async (
    id: string, 
    resolution: { notes: string; new_grade?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsProcessing(true);

    try {
      const { error: updateError } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          resolution_notes: resolution.notes,
          new_grade_code: resolution.new_grade || null,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await logAudit({
        action: 'DISPUTE_RESOLVE',
        entity_type: 'dispute',
        entity_id: id,
        new_values: { status: 'resolved', ...resolution },
      });

      setDisputes(prev => prev.map(d => 
        d.id === id ? {
          ...d, 
          status: 'resolved' as const,
          resolution_notes: resolution.notes,
          resolved_at: new Date().toISOString(),
        } : d
      ));
      toast.success('Dispute resolved successfully');
      return { success: true };
    } catch (err) {
      console.error('Error resolving dispute:', err);
      const message = err instanceof Error ? err.message : 'Failed to resolve dispute';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectDispute = async (id: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsProcessing(true);

    try {
      const { error: updateError } = await supabase
        .from('disputes')
        .update({
          status: 'closed',
          resolution_notes: `REJECTED: ${reason}`,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await logAudit({
        action: 'REJECT',
        entity_type: 'dispute',
        entity_id: id,
        new_values: { status: 'closed', rejection_reason: reason },
      });

      setDisputes(prev => prev.map(d => 
        d.id === id ? { 
          ...d, 
          status: 'closed' as const,
          resolution_notes: `REJECTED: ${reason}`,
          resolved_at: new Date().toISOString(),
        } : d
      ));
      toast.success('Dispute rejected');
      return { success: true };
    } catch (err) {
      console.error('Error rejecting dispute:', err);
      const message = err instanceof Error ? err.message : 'Failed to reject dispute';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsProcessing(false);
    }
  };

  const escalateDispute = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);

    try {
      const { error: updateError } = await supabase
        .from('disputes')
        .update({ 
          status: 'escalated',
          priority: 'high',
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await logAudit({
        action: 'UPDATE',
        entity_type: 'dispute',
        entity_id: id,
        new_values: { status: 'escalated' },
      });

      setDisputes(prev => prev.map(d => 
        d.id === id ? { ...d, status: 'escalated' as const, priority: 'high' } : d
      ));
      toast.success('Dispute escalated to supervisor');
      return { success: true };
    } catch (err) {
      console.error('Error escalating dispute:', err);
      const message = err instanceof Error ? err.message : 'Failed to escalate dispute';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsProcessing(false);
    }
  };

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    underReview: disputes.filter(d => d.status === 'under_review').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    escalated: disputes.filter(d => d.status === 'escalated').length,
    closed: disputes.filter(d => d.status === 'closed').length,
  };

  return {
    disputes,
    isLoading,
    isProcessing,
    error,
    stats,
    createDispute,
    reviewDispute,
    resolveDispute,
    rejectDispute,
    escalateDispute,
    refetch: fetchDisputes,
  };
}

