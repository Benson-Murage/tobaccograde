import { supabase } from '@/integrations/supabase/client';

// Types
type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';

interface SyncQueueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  status: SyncStatus;
  retry_count: number;
  created_at: string;
  last_error?: string;
}

interface OfflineStore {
  queue: SyncQueueItem[];
  lastSyncAt: string | null;
  deviceId: string;
}

const STORAGE_KEY = 'leafgrade_offline_store';
const MAX_RETRIES = 3;

// Get or create device ID
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('leafgrade_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('leafgrade_device_id', deviceId);
  }
  return deviceId;
}

// Get device fingerprint (simplified)
export function getDeviceFingerprint(): string {
  const nav = window.navigator;
  const screen = window.screen;
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ].join('|');
  return btoa(fingerprint).slice(0, 32);
}

// Initialize offline store
function getStore(): OfflineStore {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    queue: [],
    lastSyncAt: null,
    deviceId: getDeviceId(),
  };
}

function saveStore(store: OfflineStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Add item to sync queue
export function queueForSync(
  entityType: string,
  entityId: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  payload: Record<string, unknown>
): string {
  const store = getStore();
  const item: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    entity_type: entityType,
    entity_id: entityId,
    operation,
    payload: {
      ...payload,
      device_id: getDeviceId(),
      device_fingerprint: getDeviceFingerprint(),
    },
    status: 'pending',
    retry_count: 0,
    created_at: new Date().toISOString(),
  };
  store.queue.push(item);
  saveStore(store);
  
  // Attempt immediate sync if online
  if (isOnline()) {
    syncQueue();
  }
  
  return item.id;
}

// Get pending items count
export function getPendingCount(): number {
  const store = getStore();
  return store.queue.filter((item) => item.status === 'pending').length;
}

// Get all queue items
export function getQueueItems(): SyncQueueItem[] {
  return getStore().queue;
}

// Clear synced items
export function clearSyncedItems(): void {
  const store = getStore();
  store.queue = store.queue.filter((item) => item.status !== 'synced');
  saveStore(store);
}

// Whitelist of tables the generic sync path may write to
const SYNCABLE_TABLES = new Set(['grading', 'gradings']);

// Persist a queued offline grading submission to the database
async function syncGrading(payload: {
  grading: Record<string, unknown>;
  aiDecision: Record<string, unknown> | null;
  price: Record<string, unknown> | null;
  submission: { baleId: string };
}): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Retry later once the device has an authenticated session
    console.error('Sync deferred: no authenticated session yet');
    return false;
  }

  const grading = {
    ...payload.grading,
    grader_id: user.id,
    graded_offline: true,
    sync_status: 'synced' as const,
    synced_at: new Date().toISOString(),
  };

  // Duplicate protection: if this grading already made it to the server, skip
  const { data: existing } = await supabase
    .from('gradings')
    .select('id')
    .eq('id', grading.id as string)
    .maybeSingle();
  if (existing) {
    return true;
  }

  const { error } = await supabase.from('gradings').insert([grading]);
  if (error) {
    console.error('Grading sync error:', error);
    return false;
  }

  if (payload.aiDecision) {
    const { error: aiError } = await supabase.from('ai_grader_decisions').insert([{
      ...payload.aiDecision,
      grader_id: user.id,
    }]);
    if (aiError) console.error('AI decision sync error:', aiError);
  }

  if (payload.price) {
    const { error: priceError } = await supabase.from('grading_prices').insert([payload.price]);
    if (priceError) console.error('Grading price sync error:', priceError);
  }

  const companyId = payload.grading.company_id as string;
  await supabase.from('audit_logs').insert([{
    company_id: companyId,
    user_id: user.id,
    action: 'INSERT',
    entity_type: 'grading',
    entity_id: grading.id,
    new_values: grading,
  }]);

  if (payload.submission?.baleId) {
    await supabase
      .from('bales')
      .update({ status: 'graded' })
      .eq('id', payload.submission.baleId);
  }

  return true;
}

// Sync a single item
async function syncItem(item: SyncQueueItem): Promise<boolean> {
  try {
    if (item.entity_type === 'grading' && item.operation === 'INSERT') {
      return await syncGrading(item.payload as never);
    }
    if (!SYNCABLE_TABLES.has(item.entity_type)) {
      console.error('No sync handler for entity type:', item.entity_type);
      return false;
    }
    const { error } = await supabase.from(item.entity_type).upsert([item.payload]);
    if (error) {
      console.error('Sync error for item:', item.id, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Sync error for item:', item.id, error);
    return false;
  }
}

// Process sync queue
export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  if (!isOnline()) {
    return { synced: 0, failed: 0 };
  }

  const store = getStore();
  let synced = 0;
  let failed = 0;

  const pendingItems = store.queue.filter((item) => 
    item.status === 'pending' || (item.status === 'failed' && item.retry_count < MAX_RETRIES)
  );

  for (const item of pendingItems) {
    item.status = 'syncing';
    saveStore(store);

    const success = await syncItem(item);

    if (success) {
      item.status = 'synced';
      synced++;
    } else {
      item.retry_count++;
      item.status = item.retry_count >= MAX_RETRIES ? 'failed' : 'pending';
      item.last_error = 'Sync failed, will retry';
      failed++;
    }
    saveStore(store);
  }

  if (synced > 0) {
    store.lastSyncAt = new Date().toISOString();
    saveStore(store);
  }

  return { synced, failed };
}

// Set up automatic sync on connection restore
export function setupAutoSync(): () => void {
  const handleOnline = () => {
    console.log('Connection restored, syncing...');
    syncQueue();
  };

  window.addEventListener('online', handleOnline);

  // Also set up periodic sync
  const intervalId = setInterval(() => {
    if (isOnline() && getPendingCount() > 0) {
      syncQueue();
    }
  }, 30000); // Every 30 seconds

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(intervalId);
  };
}

// Offline data cache for reads
const CACHE_PREFIX = 'leafgrade_cache_';

export function cacheData(key: string, data: unknown, ttlMs: number = 3600000): void {
  const cacheItem = {
    data,
    expiresAt: Date.now() + ttlMs,
  };
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
}

export function getCachedData<T>(key: string): T | null {
  const cached = localStorage.getItem(CACHE_PREFIX + key);
  if (!cached) return null;

  try {
    const { data, expiresAt } = JSON.parse(cached);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

export function clearCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
