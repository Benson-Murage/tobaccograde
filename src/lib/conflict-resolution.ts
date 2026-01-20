/**
 * Conflict Resolution Service
 * 
 * Handles data conflicts between local and server versions
 * during offline sync operations.
 */

import { supabase } from '@/integrations/supabase/client';
import { logAudit } from './audit-logger';

export type ConflictType = 
  | 'version_mismatch'
  | 'concurrent_edit'
  | 'server_deleted'
  | 'validation_failed';

export type ResolutionStrategy = 
  | 'keep_local'
  | 'keep_server'
  | 'merge'
  | 'manual';

export interface DataConflict {
  id: string;
  entityType: 'grading' | 'bale' | 'farmer' | 'device';
  entityId: string;
  conflictType: ConflictType;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown> | null;
  localTimestamp: Date;
  serverTimestamp: Date | null;
  fieldConflicts: FieldConflict[];
  resolvedAt?: Date;
  resolution?: ResolutionStrategy;
  resolvedBy?: string;
}

export interface FieldConflict {
  field: string;
  localValue: unknown;
  serverValue: unknown;
  isCritical: boolean; // Critical fields require manual review
}

export interface ConflictResolution {
  conflictId: string;
  strategy: ResolutionStrategy;
  resolvedData?: Record<string, unknown>;
  notes?: string;
}

const STORAGE_KEY = 'leafgrade_conflicts';

// Critical fields that require manual review
const CRITICAL_FIELDS: Record<string, string[]> = {
  grading: ['grade_code', 'grade_class', 'moisture_percent', 'defect_percent'],
  bale: ['weight_kg', 'farmer_id', 'status'],
};

/**
 * Detect conflicts between local and server data
 */
export function detectConflicts(
  entityType: string,
  entityId: string,
  localData: Record<string, unknown>,
  serverData: Record<string, unknown> | null,
  localTimestamp: Date,
  serverTimestamp: Date | null
): DataConflict | null {
  // No server data means it was deleted
  if (!serverData) {
    return {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType: entityType as DataConflict['entityType'],
      entityId,
      conflictType: 'server_deleted',
      localData,
      serverData: null,
      localTimestamp,
      serverTimestamp: null,
      fieldConflicts: [],
    };
  }

  // Check if server was updated after local changes
  if (serverTimestamp && serverTimestamp > localTimestamp) {
    const fieldConflicts: FieldConflict[] = [];
    const criticalFields = CRITICAL_FIELDS[entityType] || [];
    
    // Compare each field
    for (const key of Object.keys(localData)) {
      if (localData[key] !== serverData[key]) {
        fieldConflicts.push({
          field: key,
          localValue: localData[key],
          serverValue: serverData[key],
          isCritical: criticalFields.includes(key),
        });
      }
    }
    
    if (fieldConflicts.length > 0) {
      return {
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityType: entityType as DataConflict['entityType'],
        entityId,
        conflictType: 'concurrent_edit',
        localData,
        serverData,
        localTimestamp,
        serverTimestamp,
        fieldConflicts,
      };
    }
  }
  
  return null;
}

/**
 * Store conflict for later resolution
 */
export function storeConflict(conflict: DataConflict): void {
  const existing = getStoredConflicts();
  existing.push(conflict);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

/**
 * Get all stored conflicts
 */
export function getStoredConflicts(): DataConflict[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const conflicts = JSON.parse(stored);
    return conflicts.map((c: any) => ({
      ...c,
      localTimestamp: new Date(c.localTimestamp),
      serverTimestamp: c.serverTimestamp ? new Date(c.serverTimestamp) : null,
      resolvedAt: c.resolvedAt ? new Date(c.resolvedAt) : undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Get unresolved conflicts
 */
export function getUnresolvedConflicts(): DataConflict[] {
  return getStoredConflicts().filter(c => !c.resolvedAt);
}

/**
 * Get conflict count
 */
export function getConflictCount(): number {
  return getUnresolvedConflicts().length;
}

/**
 * Resolve a conflict
 */
export async function resolveConflict(
  resolution: ConflictResolution
): Promise<{ success: boolean; error?: string }> {
  try {
    const conflicts = getStoredConflicts();
    const conflict = conflicts.find(c => c.id === resolution.conflictId);
    
    if (!conflict) {
      return { success: false, error: 'Conflict not found' };
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    let finalData: Record<string, unknown>;
    
    switch (resolution.strategy) {
      case 'keep_local':
        finalData = conflict.localData;
        break;
      case 'keep_server':
        finalData = conflict.serverData || {};
        break;
      case 'merge':
        finalData = resolution.resolvedData || mergeData(conflict);
        break;
      case 'manual':
        if (!resolution.resolvedData) {
          return { success: false, error: 'Manual resolution requires resolved data' };
        }
        finalData = resolution.resolvedData;
        break;
      default:
        return { success: false, error: 'Invalid resolution strategy' };
    }
    
    // Apply the resolution to the database
    if (conflict.conflictType !== 'server_deleted') {
      const { error } = await supabase
        .from(conflict.entityType === 'grading' ? 'gradings' : 
              conflict.entityType === 'bale' ? 'bales' : 
              conflict.entityType === 'farmer' ? 'farmers' : 'devices')
        .update(finalData)
        .eq('id', conflict.entityId);
      
      if (error) {
        console.error('Resolution apply error:', error);
        return { success: false, error: error.message };
      }
    }
    
    // Mark conflict as resolved
    conflict.resolvedAt = new Date();
    conflict.resolution = resolution.strategy;
    conflict.resolvedBy = user?.id;
    
    // Update storage
    const updatedConflicts = conflicts.map(c => 
      c.id === resolution.conflictId ? conflict : c
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConflicts));
    
    // Log audit
    await logAudit({
      action: 'SYNC',
      entity_type: conflict.entityType as any,
      entity_id: conflict.entityId,
      old_values: { conflict: conflict.conflictType },
      new_values: {
        resolution: resolution.strategy,
        notes: resolution.notes,
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Resolution error:', error);
    return { success: false, error: 'Failed to resolve conflict' };
  }
}

/**
 * Auto-merge data (prefer local for non-critical, server for critical)
 */
function mergeData(conflict: DataConflict): Record<string, unknown> {
  const merged = { ...conflict.serverData };
  
  for (const fc of conflict.fieldConflicts) {
    if (!fc.isCritical) {
      // For non-critical fields, keep local changes
      merged[fc.field] = fc.localValue;
    }
    // Critical fields keep server value
  }
  
  return merged;
}

/**
 * Clear resolved conflicts older than specified days
 */
export function clearOldConflicts(daysOld: number = 30): number {
  const conflicts = getStoredConflicts();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  
  const remaining = conflicts.filter(c => 
    !c.resolvedAt || c.resolvedAt > cutoff
  );
  
  const cleared = conflicts.length - remaining.length;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  
  return cleared;
}

/**
 * Format conflict type for display
 */
export function formatConflictType(type: ConflictType): string {
  const labels: Record<ConflictType, string> = {
    version_mismatch: 'Version Mismatch',
    concurrent_edit: 'Concurrent Edit',
    server_deleted: 'Deleted on Server',
    validation_failed: 'Validation Failed',
  };
  return labels[type];
}

/**
 * Format resolution strategy for display
 */
export function formatResolutionStrategy(strategy: ResolutionStrategy): string {
  const labels: Record<ResolutionStrategy, string> = {
    keep_local: 'Keep Local Version',
    keep_server: 'Keep Server Version',
    merge: 'Auto-Merge',
    manual: 'Manual Resolution',
  };
  return labels[strategy];
}
