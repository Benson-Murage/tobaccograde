/**
 * Add Bales to Export Batch Dialog
 *
 * Lets an administrator attach graded bales from the batch's warehouse to an
 * export batch. Totals are recomputed from the actual bale records.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Package, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logAudit } from '@/lib/audit-logger';

interface AddBalesToBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: {
    id: string;
    batch_code: string;
    warehouse_id: string;
    company_id: string;
  } | null;
  onSaved: () => void;
}

interface EligibleBale {
  id: string;
  bale_code: string;
  weight_kg: number;
  grade_code: string | null;
}

export function AddBalesToBatchDialog({ open, onOpenChange, batch, onSaved }: AddBalesToBatchDialogProps) {
  const [bales, setBales] = useState<EligibleBale[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBales = useCallback(async () => {
    if (!batch) return;
    setIsLoading(true);
    setError(null);
    try {
      // Graded bales in this warehouse that are not already part of another batch
      const { data: linked } = await supabase
        .from('export_batch_bales')
        .select('bale_id');
      const linkedIds = new Set((linked || []).map((l: { bale_id: string }) => l.bale_id));

      const { data, error: baleError } = await supabase
        .from('bales')
        .select('id, bale_code, weight_kg, gradings ( grade_code )')
        .eq('company_id', batch.company_id)
        .eq('warehouse_id', batch.warehouse_id)
        .eq('status', 'graded');
      if (baleError) throw baleError;

      const eligible: EligibleBale[] = (data || [])
        .filter((b: { id: string }) => !linkedIds.has(b.id))
        .map((b: { id: string; bale_code: string; weight_kg: number; gradings?: { grade_code: string }[] }) => ({
          id: b.id,
          bale_code: b.bale_code,
          weight_kg: b.weight_kg,
          grade_code: b.gradings?.[0]?.grade_code ?? null,
        }));
      setBales(eligible);
      setSelected(new Set());
    } catch (err) {
      console.error('Failed to load eligible bales:', err);
      setError('Could not load graded bales for this warehouse');
    } finally {
      setIsLoading(false);
    }
  }, [batch]);

  useEffect(() => {
    if (open) loadBales();
  }, [open, loadBales]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!batch || selected.size === 0) return;
    setIsSaving(true);
    setError(null);
    try {
      const rows = Array.from(selected).map((baleId) => ({
        batch_id: batch.id,
        bale_id: baleId,
      }));
      const { error: insertError } = await supabase
        .from('export_batch_bales')
        .insert(rows);
      if (insertError) throw insertError;

      // Recompute totals from the batch's bales
      const { data: batchBales, error: totalsError } = await supabase
        .from('export_batch_bales')
        .select('bale_id')
        .eq('batch_id', batch.id);
      if (totalsError) throw totalsError;

      const { data: baleRows, error: weightsError } = await supabase
        .from('bales')
        .select('id, weight_kg')
        .in('id', (batchBales || []).map((r: { bale_id: string }) => r.bale_id));
      if (weightsError) throw weightsError;

      const totalWeight = (baleRows || []).reduce(
        (sum: number, b: { weight_kg: number }) => sum + Number(b.weight_kg), 0);
      const { error: updateError } = await supabase
        .from('export_batches')
        .update({
          total_bales: (baleRows || []).length,
          total_weight_kg: totalWeight,
        })
        .eq('id', batch.id);
      if (updateError) throw updateError;

      await logAudit({
        action: 'UPDATE',
        entity_type: 'export_batch',
        entity_id: batch.id,
        new_values: { bales_added: selected.size, total_bales: (baleRows || []).length, total_weight_kg: totalWeight },
      });

      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to add bales:', err);
      setError(err instanceof Error ? err.message : 'Failed to add bales to batch');
    } finally {
      setIsSaving(false);
    }
  };

  if (!batch) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isSaving) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Add Graded Bales — {batch.batch_code}
          </DialogTitle>
          <DialogDescription>
            Select graded bales from this batch's warehouse to include in the export.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto space-y-2 py-2">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : bales.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No graded bales available in this warehouse.
            </p>
          ) : (
            bales.map((bale) => (
              <label
                key={bale.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(bale.id)}
                  onCheckedChange={() => toggle(bale.id)}
                />
                <span className="font-mono text-sm font-medium">{bale.bale_code}</span>
                <span className="text-xs text-muted-foreground">
                  {bale.grade_code || '—'} · {bale.weight_kg} kg
                </span>
              </label>
            ))
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="enterprise"
            onClick={handleSave}
            disabled={isSaving || selected.size === 0}
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>
            ) : (
              `Add ${selected.size} Bale${selected.size === 1 ? '' : 's'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
