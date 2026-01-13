import { useState, useEffect } from 'react';
import { 
  isOnline, 
  getPendingCount, 
  syncQueue, 
  setupAutoSync 
} from '@/lib/offline-sync';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type SyncState = 'online' | 'offline' | 'syncing' | 'pending' | 'error';

export function SyncStatusIndicator() {
  const [syncState, setSyncState] = useState<SyncState>('online');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Set up auto-sync
    const cleanup = setupAutoSync();

    // Update status periodically
    const updateStatus = () => {
      const online = isOnline();
      const pending = getPendingCount();
      setPendingCount(pending);

      if (!online) {
        setSyncState('offline');
      } else if (pending > 0) {
        setSyncState('pending');
      } else {
        setSyncState('online');
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => setSyncState('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      cleanup();
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline() || isSyncing) return;

    setIsSyncing(true);
    setSyncState('syncing');

    try {
      const { synced, failed } = await syncQueue();
      
      if (failed > 0) {
        setSyncState('error');
      } else {
        setSyncState('online');
        setLastSync(new Date());
      }

      setPendingCount(getPendingCount());
    } catch (error) {
      setSyncState('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusConfig = () => {
    switch (syncState) {
      case 'online':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Connected',
          color: 'text-success',
          bgColor: 'bg-success/10',
        };
      case 'offline':
        return {
          icon: <CloudOff className="h-4 w-4" />,
          label: 'Offline',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
        };
      case 'syncing':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: 'Syncing...',
          color: 'text-primary',
          bgColor: 'bg-primary/10',
        };
      case 'pending':
        return {
          icon: <Cloud className="h-4 w-4" />,
          label: `${pendingCount} pending`,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'Sync error',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-3 gap-2 rounded-full',
            config.bgColor,
            config.color
          )}
          onClick={handleManualSync}
          disabled={!isOnline() || isSyncing}
        >
          {config.icon}
          <span className="text-xs font-medium hidden sm:inline">
            {config.label}
          </span>
          {pendingCount > 0 && syncState !== 'syncing' && (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <p className="font-medium">{config.label}</p>
          {pendingCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {pendingCount} items waiting to sync
            </p>
          )}
          {lastSync && (
            <p className="text-xs text-muted-foreground">
              Last sync: {lastSync.toLocaleTimeString()}
            </p>
          )}
          {syncState === 'offline' && (
            <p className="text-xs text-muted-foreground">
              Changes will sync when online
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
