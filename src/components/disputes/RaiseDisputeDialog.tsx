/**
 * Raise Dispute Dialog
 *
 * Lets an authorised user contest a graded bale's result.
 * Creates a real dispute record linked to the bale's grading.
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Loader2, MessageSquare } from 'lucide-react';
import type { DisputeFormData } from '@/hooks/useDisputes';

interface RaiseDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bale: {
    id: string;
    bale_code: string;
    grade_code?: string | null;
    grading_id?: string;
  } | null;
  onSubmit: (data: DisputeFormData) => Promise<{ success: boolean; error?: string }>;
}

const REASON_PRESETS = [
  'Grader disagrees with final grade',
  'Moisture reading inconsistent with visual state',
  'Weight discrepancy against intake scale',
  'Suspected AI suggestion accepted without review',
  'Foreign material found during handling',
];

export function RaiseDisputeDialog({ open, onOpenChange, bale, onSubmit }: RaiseDisputeDialogProps) {
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [requestedGrade, setRequestedGrade] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!bale) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('A dispute reason is required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await onSubmit({
        grading_id: bale.grading_id || '',
        reason: reason.trim(),
        priority,
        requested_grade: requestedGrade.trim() || undefined,
      });
      if (result.success) {
        setReason('');
        setPriority('medium');
        setRequestedGrade('');
        onOpenChange(false);
      } else {
        setError(result.error || 'Failed to raise dispute');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isSubmitting) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-warning" />
            Raise Dispute
          </DialogTitle>
          <DialogDescription>
            Contest the recorded grade for bale {bale.bale_code}
            {bale.grade_code ? ` (current grade ${bale.grade_code})` : ''}. A supervisor will review it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dispute-reason">Reason *</Label>
            <Textarea
              id="dispute-reason"
              placeholder="Explain why this grade is being contested..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requested-grade">Requested Grade</Label>
              <Input
                id="requested-grade"
                placeholder="e.g., L2F"
                value={requestedGrade}
                onChange={(e) => setRequestedGrade(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {REASON_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReason(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="enterprise" onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Dispute'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
