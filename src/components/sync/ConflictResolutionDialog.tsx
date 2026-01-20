/**
 * Conflict Resolution Dialog
 * 
 * UI for resolving data conflicts between local and server versions.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Clock,
  Cloud,
  Smartphone,
  GitMerge,
  CheckCircle,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  type DataConflict,
  type ResolutionStrategy,
  formatConflictType,
  resolveConflict,
} from '@/lib/conflict-resolution';
import { toast } from 'sonner';

interface ConflictResolutionDialogProps {
  conflict: DataConflict | null;
  onClose: () => void;
  onResolved: (conflictId: string) => void;
}

export function ConflictResolutionDialog({
  conflict,
  onClose,
  onResolved,
}: ConflictResolutionDialogProps) {
  const [strategy, setStrategy] = useState<ResolutionStrategy>('keep_local');
  const [notes, setNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  
  if (!conflict) return null;
  
  const hasCriticalConflicts = conflict.fieldConflicts.some(fc => fc.isCritical);
  
  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const result = await resolveConflict({
        conflictId: conflict.id,
        strategy,
        notes,
      });
      
      if (result.success) {
        toast.success('Conflict resolved');
        onResolved(conflict.id);
        onClose();
      } else {
        toast.error('Failed to resolve conflict', { description: result.error });
      }
    } finally {
      setIsResolving(false);
    }
  };
  
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  
  return (
    <Dialog open={!!conflict} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Sync Conflict Detected
          </DialogTitle>
          <DialogDescription>
            This {conflict.entityType} was modified both locally and on the server.
            Choose how to resolve the conflict.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
            {/* Conflict Info */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                {formatConflictType(conflict.conflictType)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {conflict.entityType.charAt(0).toUpperCase() + conflict.entityType.slice(1)} ID: {conflict.entityId.slice(0, 8)}...
              </span>
            </div>
            
            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Smartphone className="h-4 w-4" />
                  Local Version
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3" />
                  {conflict.localTimestamp.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Cloud className="h-4 w-4" />
                  Server Version
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3" />
                  {conflict.serverTimestamp?.toLocaleString() || 'Deleted'}
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Field Conflicts */}
            <div>
              <h4 className="font-medium mb-3">Conflicting Fields</h4>
              <div className="space-y-2">
                {conflict.fieldConflicts.map((fc) => (
                  <div
                    key={fc.field}
                    className={cn(
                      "p-3 rounded-lg border",
                      fc.isCritical && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-medium">
                        {fc.field}
                      </span>
                      {fc.isCritical && (
                        <Badge variant="destructive" className="text-xs">
                          Critical
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-sm">
                      <div className="p-2 rounded bg-primary/10 text-primary font-mono">
                        {formatValue(fc.localValue)}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="p-2 rounded bg-muted font-mono">
                        {formatValue(fc.serverValue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* Resolution Options */}
            <div>
              <h4 className="font-medium mb-3">Resolution Strategy</h4>
              <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as ResolutionStrategy)}>
                <div className="space-y-2">
                  <label
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      strategy === 'keep_local' && "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem value="keep_local" className="mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <Smartphone className="h-4 w-4 text-primary" />
                        Keep Local Version
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use your offline changes and overwrite the server
                      </p>
                    </div>
                  </label>
                  
                  <label
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      strategy === 'keep_server' && "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem value="keep_server" className="mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <Cloud className="h-4 w-4" />
                        Keep Server Version
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Discard your local changes and use the server version
                      </p>
                    </div>
                  </label>
                  
                  <label
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      strategy === 'merge' && "border-primary bg-primary/5",
                      hasCriticalConflicts && "opacity-50"
                    )}
                  >
                    <RadioGroupItem 
                      value="merge" 
                      className="mt-0.5"
                      disabled={hasCriticalConflicts}
                    />
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <GitMerge className="h-4 w-4" />
                        Auto-Merge
                        {hasCriticalConflicts && (
                          <Badge variant="outline" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Keep local for non-critical fields, server for critical fields
                      </p>
                      {hasCriticalConflicts && (
                        <p className="text-xs text-warning mt-1">
                          Cannot auto-merge with critical field conflicts
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Notes */}
            <div>
              <Label htmlFor="notes">Resolution Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Explain why this resolution was chosen..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isResolving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button variant="enterprise" onClick={handleResolve} disabled={isResolving}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {isResolving ? 'Resolving...' : 'Resolve Conflict'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
