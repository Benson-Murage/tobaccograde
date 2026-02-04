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
      setDisputes(getDemoDisputes());
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
      setError('Failed to load disputes');
      setDisputes(getDemoDisputes());
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
      const newDispute: Dispute = {
        id: crypto.randomUUID(),
        grading_id: formData.grading_id,
        company_id: 'demo',
        raised_by: 'demo-user',
        raised_at: new Date().toISOString(),
        reason: formData.reason,
        status: 'open',
        priority: formData.priority || 'medium',
        resolution_notes: null,
        new_grade_code: formData.requested_grade || null,
        resolved_by: null,
        resolved_at: null,
        evidence_urls: formData.evidence_urls || null,
      };
      setDisputes(prev => [newDispute, ...prev]);
      return { success: true, dispute: newDispute };
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
      return { success: false, error: 'Failed to create dispute' };
    }
  };

  const reviewDispute = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);
    
    try {
      if (!companyId) {
        setDisputes(prev => prev.map(d => 
          d.id === id ? { ...d, status: 'under_review' as const } : d
        ));
        toast.success('Dispute is now under review');
        return { success: true };
      }

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
      toast.error('Failed to update dispute');
      return { success: false, error: 'Failed to update dispute' };
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
      if (!companyId) {
        setDisputes(prev => prev.map(d => 
          d.id === id ? { 
            ...d, 
            status: 'resolved' as const,
            resolution_notes: resolution.notes,
            new_grade_code: resolution.new_grade || null,
            resolved_at: new Date().toISOString(),
          } : d
        ));
        toast.success('Dispute resolved successfully');
        return { success: true };
      }

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
      toast.error('Failed to resolve dispute');
      return { success: false, error: 'Failed to resolve dispute' };
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
      if (!companyId) {
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
      }

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
      toast.error('Failed to reject dispute');
      return { success: false, error: 'Failed to reject dispute' };
    } finally {
      setIsProcessing(false);
    }
  };

  const escalateDispute = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);

    try {
      if (!companyId) {
        setDisputes(prev => prev.map(d => 
          d.id === id ? { ...d, status: 'escalated' as const, priority: 'high' } : d
        ));
        toast.success('Dispute escalated to supervisor');
        return { success: true };
      }

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
      toast.error('Failed to escalate dispute');
      return { success: false, error: 'Failed to escalate dispute' };
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

function getDemoDisputes(): Dispute[] {
  return [
    {
      id: 'DSP-001',
      grading_id: 'grading-001',
      company_id: 'demo',
      raised_by: 'farmer-001',
      raised_at: '2024-01-12T10:30:00Z',
      reason: 'Farmer disputes color assessment. Claims tobacco was lemon, not reddish.',
      status: 'open',
      priority: 'high',
      resolution_notes: null,
      new_grade_code: 'L3F',
      resolved_by: null,
      resolved_at: null,
      evidence_urls: null,
      bale_code: 'BL-2024-00845',
      farmer_name: 'John Phiri',
      farmer_id: 'FRM-001236',
      original_grade: 'C2F',
    },
    {
      id: 'DSP-002',
      grading_id: 'grading-002',
      company_id: 'demo',
      raised_by: 'farmer-002',
      raised_at: '2024-01-11T14:22:00Z',
      reason: 'Moisture reading disputed. Farmer has independent test showing 15%.',
      status: 'under_review',
      priority: 'medium',
      resolution_notes: null,
      new_grade_code: 'C3F',
      resolved_by: null,
      resolved_at: null,
      evidence_urls: null,
      bale_code: 'BL-2024-00839',
      farmer_name: 'Mary Banda',
      farmer_id: 'FRM-001240',
      original_grade: 'X1F',
    },
    {
      id: 'DSP-003',
      grading_id: 'grading-003',
      company_id: 'demo',
      raised_by: 'farmer-003',
      raised_at: '2024-01-10T09:15:00Z',
      reason: 'Claims defect assessment was incorrect. Requesting re-inspection.',
      status: 'resolved',
      priority: 'low',
      resolution_notes: 'Re-inspection confirmed original grade was accurate.',
      new_grade_code: null,
      resolved_by: 'supervisor-001',
      resolved_at: '2024-01-10T16:00:00Z',
      evidence_urls: null,
      bale_code: 'BL-2024-00832',
      farmer_name: 'Peter Nyambi',
      farmer_id: 'FRM-001234',
      original_grade: 'L4F',
    },
  ];
}
