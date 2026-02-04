/**
 * Dispute Action Dialog
 * 
 * Modal for reviewing, resolving, or rejecting disputes.
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';
import type { Dispute } from '@/hooks/useDisputes';

type ActionType = 'review' | 'resolve' | 'reject';

interface DisputeActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: Dispute | null;
  action: ActionType;
  onReview: (id: string) => Promise<{ success: boolean; error?: string }>;
  onResolve: (id: string, resolution: { notes: string; new_grade?: string }) => Promise<{ success: boolean; error?: string }>;
  onReject: (id: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

export function DisputeActionDialog({
  open,
  onOpenChange,
  dispute,
  action,
  onReview,
  onResolve,
  onReject,
}: DisputeActionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    if (!dispute) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let result: { success: boolean; error?: string };

      switch (action) {
        case 'review':
          result = await onReview(dispute.id);
          break;
        case 'resolve':
          if (!notes.trim()) {
            setError('Resolution notes are required');
            setIsSubmitting(false);
            return;
          }
          result = await onResolve(dispute.id, { 
            notes: notes.trim(), 
            new_grade: newGrade.trim() || undefined 
          });
          break;
        case 'reject':
          if (!notes.trim()) {
            setError('Rejection reason is required');
            setIsSubmitting(false);
            return;
          }
          result = await onReject(dispute.id, notes.trim());
          break;
        default:
          result = { success: false, error: 'Invalid action' };
      }

      if (result.success) {
        onOpenChange(false);
        setNotes('');
        setNewGrade('');
      } else {
        setError(result.error || 'Action failed');
      }
    } catch (err) {
      console.error('Action error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setNotes('');
      setNewGrade('');
      setError(null);
    }
  };

  if (!dispute) return null;

  const getTitle = () => {
    switch (action) {
      case 'review': return 'Review Dispute';
      case 'resolve': return 'Resolve Dispute';
      case 'reject': return 'Reject Dispute';
    }
  };

  const getIcon = () => {
    switch (action) {
      case 'review': return <Eye className="h-5 w-5 text-primary" />;
      case 'resolve': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'reject': return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getButtonVariant = () => {
    switch (action) {
      case 'review': return 'default' as const;
      case 'resolve': return 'default' as const;
      case 'reject': return 'destructive' as const;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {action === 'review' && 'Mark this dispute as under review.'}
            {action === 'resolve' && 'Provide resolution details and optionally update the grade.'}
            {action === 'reject' && 'Provide a reason for rejecting this dispute.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dispute Summary */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium">{dispute.bale_code}</span>
              <Badge variant="outline">{dispute.priority} priority</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{dispute.reason}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Farmer: {dispute.farmer_name}</span>
              <span>Original Grade: {dispute.original_grade}</span>
              {dispute.new_grade_code && (
                <span>Requested: {dispute.new_grade_code}</span>
              )}
            </div>
          </div>

          {/* Review confirmation */}
          {action === 'review' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <Eye className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Start Review</p>
                <p className="text-sm text-muted-foreground">
                  This dispute will be marked as "Under Review" and assigned to you.
                </p>
              </div>
            </div>
          )}

          {/* Resolution form */}
          {action === 'resolve' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new_grade">New Grade (Optional)</Label>
                <Input
                  id="new_grade"
                  placeholder="e.g., L2F"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep the original grade
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolution_notes">Resolution Notes *</Label>
                <Textarea
                  id="resolution_notes"
                  placeholder="Explain how this dispute was resolved..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </>
          )}

          {/* Rejection form */}
          {action === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Rejection Reason *</Label>
              <Textarea
                id="rejection_reason"
                placeholder="Explain why this dispute is being rejected..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant={getButtonVariant()} onClick={handleAction} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {action === 'review' && 'Start Review'}
                {action === 'resolve' && 'Resolve Dispute'}
                {action === 'reject' && 'Reject Dispute'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
