/**
 * Conflict List Component
 * 
 * Displays a list of unresolved sync conflicts
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Clock,
  FileText,
  Package,
  User,
  Smartphone,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  type DataConflict,
  getUnresolvedConflicts,
  formatConflictType,
} from '@/lib/conflict-resolution';
import { ConflictResolutionDialog } from './ConflictResolutionDialog';

interface ConflictListProps {
  className?: string;
  onConflictResolved?: () => void;
}

export function ConflictList({ className, onConflictResolved }: ConflictListProps) {
  const [conflicts, setConflicts] = useState<DataConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<DataConflict | null>(null);
  
  useEffect(() => {
    loadConflicts();
  }, []);
  
  const loadConflicts = () => {
    setConflicts(getUnresolvedConflicts());
  };
  
  const handleResolved = (conflictId: string) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    onConflictResolved?.();
  };
  
  const getEntityIcon = (type: DataConflict['entityType']) => {
    switch (type) {
      case 'grading': return FileText;
      case 'bale': return Package;
      case 'farmer': return User;
      case 'device': return Smartphone;
    }
  };
  
  if (conflicts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
            <RefreshCw className="h-6 w-6 text-success" />
          </div>
          <p className="text-muted-foreground">No sync conflicts</p>
          <p className="text-sm text-muted-foreground">All data is synchronized</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Sync Conflicts
              </CardTitle>
              <CardDescription>
                {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} require resolution
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadConflicts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {conflicts.map((conflict) => {
                const Icon = getEntityIcon(conflict.entityType);
                const hasCritical = conflict.fieldConflicts.some(fc => fc.isCritical);
                
                return (
                  <button
                    key={conflict.id}
                    onClick={() => setSelectedConflict(conflict)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        hasCritical ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">
                            {conflict.entityType}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              hasCritical 
                                ? "bg-destructive/10 text-destructive border-destructive/30" 
                                : "bg-warning/10 text-warning border-warning/30"
                            )}
                          >
                            {formatConflictType(conflict.conflictType)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conflict.fieldConflicts.length} field{conflict.fieldConflicts.length !== 1 ? 's' : ''} in conflict
                          {hasCritical && ' (including critical)'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {conflict.localTimestamp.toLocaleString()}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <ConflictResolutionDialog
        conflict={selectedConflict}
        onClose={() => setSelectedConflict(null)}
        onResolved={handleResolved}
      />
    </>
  );
}
