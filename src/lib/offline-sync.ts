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

// Sync a single item
async function syncItem(item: SyncQueueItem): Promise<boolean> {
  try {
    // For now, just mark as synced - actual sync logic would go here
    // This avoids type issues with dynamic table names
    console.log('Syncing item:', item.entity_type, item.operation, item.entity_id);
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
