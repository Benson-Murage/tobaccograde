/**
 * LeafGrade - Audit Logger
 * 
 * Provides immutable audit logging for all critical operations.
 * Logs are append-only and cannot be modified or deleted.
 */

import { supabase } from '@/integrations/supabase/client';
import { getDeviceId, getDeviceFingerprint } from './offline-sync';

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'SIGNUP'
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'GRADE'
  | 'DISPUTE_OPEN'
  | 'DISPUTE_RESOLVE'
  | 'PRICE_UPDATE'
  | 'RULE_UPDATE'
  | 'EXPORT'
  | 'SYNC'
  | 'DEVICE_REGISTER'
  | 'DEVICE_TRUST'
  | 'PERMISSION_CHANGE';

export type EntityType = 
  | 'user'
  | 'profile'
  | 'company'
  | 'warehouse'
  | 'farmer'
  | 'bale'
  | 'grading'
  | 'dispute'
  | 'price_matrix'
  | 'grading_rule'
  | 'payment'
  | 'device'
  | 'role'
  | 'session'
  | 'report';

interface AuditLogEntry {
  action: AuditAction;
  entity_type: EntityType;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Get current session info
async function getSessionInfo(): Promise<{ userId: string | null; companyId: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { userId: null, companyId: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle();

  return {
    userId: user.id,
    companyId: profile?.company_id ?? null,
  };
}

// Main audit log function
export async function logAudit(entry: AuditLogEntry): Promise<boolean> {
  try {
    const { userId, companyId } = await getSessionInfo();
    
    const logData = {
      company_id: companyId,
      user_id: userId,
      action: entry.action as string,
      entity_type: entry.entity_type as string,
      entity_id: entry.entity_id ?? null,
      old_values: entry.old_values ? JSON.parse(JSON.stringify(entry.old_values)) : null,
      new_values: entry.new_values ? JSON.parse(JSON.stringify(entry.new_values)) : null,
      device_id: getDeviceId(),
      device_fingerprint: getDeviceFingerprint(),
      user_agent: navigator.userAgent,
      session_id: sessionStorage.getItem('session_id') ?? null,
    };

    const { error } = await supabase.from('audit_logs').insert([logData]);

    if (error) {
      console.error('Failed to write audit log:', error);
      storeLocalAuditLog(logData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Audit logging error:', error);
    return false;
  }
}

// Store audit log locally when offline
function storeLocalAuditLog(entry: Record<string, unknown>): void {
  const key = 'leafgrade_pending_audit_logs';
  const existing = localStorage.getItem(key);
  const logs = existing ? JSON.parse(existing) : [];
  logs.push({
    ...entry,
    local_created_at: new Date().toISOString(),
  });
  localStorage.setItem(key, JSON.stringify(logs));
}

// Sync local audit logs to server
export async function syncLocalAuditLogs(): Promise<number> {
  const key = 'leafgrade_pending_audit_logs';
  const existing = localStorage.getItem(key);
  
  if (!existing) return 0;

  const logs = JSON.parse(existing);
  let synced = 0;

  for (const log of logs) {
    delete log.local_created_at;
    const { error } = await supabase.from('audit_logs').insert(log);
    if (!error) synced++;
  }

  if (synced === logs.length) {
    localStorage.removeItem(key);
  } else {
    // Keep failed logs
    const remaining = logs.slice(synced);
    localStorage.setItem(key, JSON.stringify(remaining));
  }

  return synced;
}

// Convenience wrappers for common operations
export const auditLogin = () => logAudit({ action: 'LOGIN', entity_type: 'session' });
export const auditLogout = () => logAudit({ action: 'LOGOUT', entity_type: 'session' });

export const auditGrade = (
  gradingId: string,
  baleId: string,
  gradeCode: string,
  parameters: Record<string, unknown>
) => logAudit({
  action: 'GRADE',
  entity_type: 'grading',
  entity_id: gradingId,
  new_values: { bale_id: baleId, grade_code: gradeCode, ...parameters },
});

export const auditApprove = (
  entityType: EntityType,
  entityId: string,
  details?: Record<string, unknown>
) => logAudit({
  action: 'APPROVE',
  entity_type: entityType,
  entity_id: entityId,
  new_values: details,
});

export const auditPriceUpdate = (
  matrixId: string,
  oldPrices: Record<string, number>,
  newPrices: Record<string, number>
) => logAudit({
  action: 'PRICE_UPDATE',
  entity_type: 'price_matrix',
  entity_id: matrixId,
  old_values: oldPrices,
  new_values: newPrices,
});

export const auditDisputeOpen = (
  disputeId: string,
  gradingId: string,
  reason: string
) => logAudit({
  action: 'DISPUTE_OPEN',
  entity_type: 'dispute',
  entity_id: disputeId,
  new_values: { grading_id: gradingId, reason },
});

export const auditDisputeResolve = (
  disputeId: string,
  resolution: string,
  newGrade?: string
) => logAudit({
  action: 'DISPUTE_RESOLVE',
  entity_type: 'dispute',
  entity_id: disputeId,
  new_values: { resolution, new_grade: newGrade },
});

export const auditExport = (
  reportType: string,
  format: string,
  filters?: Record<string, unknown>
) => logAudit({
  action: 'EXPORT',
  entity_type: 'report',
  new_values: { report_type: reportType, format, filters },
});

export const auditDeviceRegister = (
  deviceId: string,
  deviceName: string
) => logAudit({
  action: 'DEVICE_REGISTER',
  entity_type: 'device',
  entity_id: deviceId,
  new_values: { device_name: deviceName },
});

export const auditPermissionChange = (
  userId: string,
  oldRoles: string[],
  newRoles: string[]
) => logAudit({
  action: 'PERMISSION_CHANGE',
  entity_type: 'role',
  entity_id: userId,
  old_values: { roles: oldRoles },
  new_values: { roles: newRoles },
});

// Format audit log for display
export function formatAuditAction(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    LOGIN: 'Logged in',
    LOGOUT: 'Logged out',
    SIGNUP: 'Created account',
    VIEW: 'Viewed',
    CREATE: 'Created',
    UPDATE: 'Updated',
    DELETE: 'Deleted',
    APPROVE: 'Approved',
    REJECT: 'Rejected',
    GRADE: 'Graded bale',
    DISPUTE_OPEN: 'Opened dispute',
    DISPUTE_RESOLVE: 'Resolved dispute',
    PRICE_UPDATE: 'Updated prices',
    RULE_UPDATE: 'Updated grading rules',
    EXPORT: 'Exported report',
    SYNC: 'Synced data',
    DEVICE_REGISTER: 'Registered device',
    DEVICE_TRUST: 'Trusted device',
    PERMISSION_CHANGE: 'Changed permissions',
  };
  return labels[action] ?? action;
}

export function formatEntityType(type: EntityType): string {
  const labels: Record<EntityType, string> = {
    user: 'User',
    profile: 'Profile',
    company: 'Company',
    warehouse: 'Warehouse',
    farmer: 'Farmer',
    bale: 'Bale',
    grading: 'Grading',
    dispute: 'Dispute',
    price_matrix: 'Price Matrix',
    grading_rule: 'Grading Rule',
    payment: 'Payment',
    device: 'Device',
    role: 'Role',
    session: 'Session',
    report: 'Report',
  };
  return labels[type] ?? type;
}
