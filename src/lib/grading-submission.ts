/**
 * Grading Submission Service
 * 
 * Handles saving gradings to database with price calculation,
 * audit logging, and offline support.
 */

import { supabase } from '@/integrations/supabase/client';
import { getDeviceId, getDeviceFingerprint, queueForSync, isOnline } from './offline-sync';
import { logAudit, auditGrade } from './audit-logger';
import type { LeafPosition, TobaccoColor, TobaccoTexture, TobaccoMaturity, QualityBand } from './tobacco-grading';
import type { DeviceReading, ManualEntryReason } from './hardware-devices';

export interface GradingSubmission {
  baleId: string;
  baleCode: string;
  farmerId: string;
  warehouseId: string;
  companyId: string;
  
  // Hardware readings
  weight: DeviceReading<number>;
  moisture: DeviceReading<number>;
  
  // Grading selections
  leafPosition: LeafPosition;
  color: TobaccoColor;
  texture: TobaccoTexture;
  maturity: TobaccoMaturity;
  qualityBand: QualityBand;
  defectPercent: number;
  
  // AI decisions
  aiSuggestedGrade?: string;
  aiDecisions?: Record<string, {
    decision: 'accept' | 'modify' | 'reject';
    aiValue: string;
    finalValue: string;
  }>;
  
  // Calculated values
  gradeCode: string;
  gradeClass: string;
  unitPrice: number;
  totalValue: number;
  currency: string;
  
  // Audit metadata
  capturedImageUrl?: string;
  riskScore: number;
  requiresSupervisorApproval: boolean;
  notes?: string;
}

export interface SubmissionResult {
  success: boolean;
  gradingId?: string;
  isOffline: boolean;
  requiresApproval: boolean;
  syncQueueId?: string;
  error?: string;
}

/**
 * Submit a grading to the database
 */
export async function submitGrading(submission: GradingSubmission): Promise<SubmissionResult> {
  const deviceId = getDeviceId();
  const deviceFingerprint = getDeviceFingerprint();
  const gradingId = crypto.randomUUID();
  
  // Prepare grading record
  const gradingRecord = {
    id: gradingId,
    bale_id: submission.baleId,
    company_id: submission.companyId,
    grader_id: '', // Will be set from auth
    leaf_position: submission.leafPosition,
    color: submission.color,
    texture: submission.texture,
    maturity: submission.maturity,
    moisture_percent: submission.moisture.value,
    defect_percent: submission.defectPercent,
    grade_code: submission.gradeCode,
    grade_class: submission.gradeClass,
    confidence_score: submission.riskScore > 50 ? 100 - submission.riskScore : 95,
    notes: submission.notes || null,
    device_id: deviceId,
    device_fingerprint: deviceFingerprint,
    graded_offline: !isOnline(),
    sync_status: (isOnline() ? 'synced' : 'pending') as 'synced' | 'pending',
    is_locked: false,
    graded_at: new Date().toISOString(),
  };
  
  // Prepare AI decision record if AI was used
  const aiDecisionRecord = submission.aiDecisions ? {
    company_id: submission.companyId,
    ai_prediction_id: crypto.randomUUID(),
    grading_id: gradingId,
    grader_id: '', // Will be set from auth
    ai_suggested_grade: submission.aiSuggestedGrade,
    leaf_position_decision: submission.aiDecisions.leaf_position?.decision || 'accept',
    leaf_position_ai_value: submission.aiDecisions.leaf_position?.aiValue,
    leaf_position_final_value: submission.aiDecisions.leaf_position?.finalValue || submission.leafPosition,
    color_decision: submission.aiDecisions.color?.decision || 'accept',
    color_ai_value: submission.aiDecisions.color?.aiValue,
    color_final_value: submission.aiDecisions.color?.finalValue || submission.color,
    texture_decision: submission.aiDecisions.texture?.decision || 'accept',
    texture_ai_value: submission.aiDecisions.texture?.aiValue,
    texture_final_value: submission.aiDecisions.texture?.finalValue || submission.texture,
    maturity_decision: submission.aiDecisions.maturity?.decision || 'accept',
    maturity_ai_value: submission.aiDecisions.maturity?.aiValue,
    maturity_final_value: submission.aiDecisions.maturity?.finalValue || submission.maturity,
    defects_decision: 'accept',
    defects_ai_value: submission.defectPercent,
    defects_final_value: submission.defectPercent,
    final_grade: submission.gradeCode,
    overall_decision: Object.values(submission.aiDecisions).every(d => d.decision === 'accept') 
      ? 'accept' 
      : 'modify',
  } : null;
  
  // Prepare price record
  const priceRecord = {
    id: crypto.randomUUID(),
    grading_id: gradingId,
    unit_price: submission.unitPrice,
    total_value: submission.totalValue,
    currency: submission.currency,
  };
  
  // Prepare manual entry audit records
  const manualEntryRecords: Array<{
    field: string;
    reason: ManualEntryReason;
    value: number;
  }> = [];
  
  if (submission.weight.source === 'manual' && submission.weight.manualReason) {
    manualEntryRecords.push({
      field: 'weight',
      reason: submission.weight.manualReason,
      value: submission.weight.value,
    });
  }
  
  if (submission.moisture.source === 'manual' && submission.moisture.manualReason) {
    manualEntryRecords.push({
      field: 'moisture',
      reason: submission.moisture.manualReason,
      value: submission.moisture.value,
    });
  }

  // If offline, queue for sync
  if (!isOnline()) {
    const syncQueueId = queueForSync('grading', gradingId, 'INSERT', {
      grading: gradingRecord,
      aiDecision: aiDecisionRecord,
      price: priceRecord,
      manualEntries: manualEntryRecords,
      submission,
    });
    
    return {
      success: true,
      gradingId,
      isOffline: true,
      requiresApproval: submission.requiresSupervisorApproval,
      syncQueueId,
    };
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, isOffline: false, requiresApproval: false, error: 'Not authenticated' };
    }
    
    // Update grader_id
    gradingRecord.grader_id = user.id;
    if (aiDecisionRecord) {
      aiDecisionRecord.grader_id = user.id;
    }
    
    // Insert grading
    const { error: gradingError } = await supabase
      .from('gradings')
      .insert([gradingRecord]);
    
    if (gradingError) {
      console.error('Grading insert error:', gradingError);
      // Fall back to offline queue
      const syncQueueId = queueForSync('grading', gradingId, 'INSERT', {
        grading: gradingRecord,
        aiDecision: aiDecisionRecord,
        price: priceRecord,
        manualEntries: manualEntryRecords,
      });
      
      return {
        success: true,
        gradingId,
        isOffline: true,
        requiresApproval: submission.requiresSupervisorApproval,
        syncQueueId,
      };
    }
    
    // Insert AI decision if exists
    if (aiDecisionRecord) {
      const { error: aiError } = await supabase
        .from('ai_grader_decisions')
        .insert([aiDecisionRecord]);
      
      if (aiError) {
        console.error('AI decision insert error:', aiError);
      }
    }
    
    // Insert grading price
    const { error: priceError } = await supabase
      .from('grading_prices')
      .insert([priceRecord]);
    
    if (priceError) {
      console.error('Grading price insert error:', priceError);
    }
    
    // Log audit
    await auditGrade(gradingId, submission.baleId, submission.gradeCode, {
      weight: submission.weight.value,
      moisture: submission.moisture.value,
      leafPosition: submission.leafPosition,
      color: submission.color,
      texture: submission.texture,
      maturity: submission.maturity,
      defectPercent: submission.defectPercent,
      unitPrice: submission.unitPrice,
      totalValue: submission.totalValue,
      riskScore: submission.riskScore,
      manualEntries: manualEntryRecords,
      weightSource: submission.weight.source,
      moistureSource: submission.moisture.source,
    });
    
    // Update bale status
    await supabase
      .from('bales')
      .update({ status: 'graded' })
      .eq('id', submission.baleId);
    
    return {
      success: true,
      gradingId,
      isOffline: false,
      requiresApproval: submission.requiresSupervisorApproval,
    };
    
  } catch (error) {
    console.error('Submission error:', error);
    
    // Fall back to offline queue
    const syncQueueId = queueForSync('grading', gradingId, 'INSERT', {
      grading: gradingRecord,
      aiDecision: aiDecisionRecord,
      price: priceRecord,
    });
    
    return {
      success: true,
      gradingId,
      isOffline: true,
      requiresApproval: submission.requiresSupervisorApproval,
      syncQueueId,
    };
  }
}

/**
 * Lock a grading record (requires supervisor for high-risk)
 */
export async function lockGrading(
  gradingId: string,
  supervisorId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const { error } = await supabase
      .from('gradings')
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        locked_by: supervisorId || user.id,
        approved_by: supervisorId || null,
        approved_at: supervisorId ? new Date().toISOString() : null,
      })
      .eq('id', gradingId);
    
    if (error) {
      console.error('Lock error:', error);
      return { success: false, error: error.message };
    }
    
    await logAudit({
      action: 'APPROVE',
      entity_type: 'grading',
      entity_id: gradingId,
      new_values: {
        is_locked: true,
        approved_by: supervisorId || user.id,
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Lock error:', error);
    return { success: false, error: 'Failed to lock grading' };
  }
}

/**
 * Get pending gradings that require supervisor approval
 */
export async function getPendingApprovals(): Promise<{
  gradings: Array<{
    id: string;
    bale_code: string;
    farmer_name: string;
    grade_code: string;
    graded_at: string;
    grader_name: string;
    risk_score: number;
    manual_entries: string[];
  }>;
  error?: string;
}> {
  try {
    // Get gradings that are not locked and have high risk indicators
    const { data: gradings, error } = await supabase
      .from('gradings')
      .select(`
        id,
        grade_code,
        graded_at,
        confidence_score,
        notes,
        bales (
          bale_code,
          farmers (
            full_name
          )
        ),
        profiles:grader_id (
          full_name
        )
      `)
      .eq('is_locked', false)
      .order('graded_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Pending approvals query error:', error);
      return { gradings: [], error: error.message };
    }
    
    // Transform the data
    const transformed = (gradings || []).map((g: any) => ({
      id: g.id,
      bale_code: g.bales?.bale_code || 'Unknown',
      farmer_name: g.bales?.farmers?.full_name || 'Unknown',
      grade_code: g.grade_code,
      graded_at: g.graded_at,
      grader_name: g.profiles?.full_name || 'Unknown',
      risk_score: g.confidence_score ? 100 - g.confidence_score : 50,
      manual_entries: [],
    }));
    
    return { gradings: transformed };
  } catch (error) {
    console.error('Pending approvals error:', error);
    return { gradings: [], error: 'Failed to fetch pending approvals' };
  }
}
