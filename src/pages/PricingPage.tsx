import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit-logger";
import { toast } from "sonner";
import {
  DollarSign,
  Edit,
  Save,
  Calendar,
  TrendingUp,
  Download,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

interface PriceRow {
  grade: string;
  gradeClass: "premium" | "good" | "standard" | "low" | "rejected";
  pricePerKg: number;
  minWeight: number;
  maxWeight: number;
}

// Default prices - used for demo and as template
const DEFAULT_PRICES: PriceRow[] = [
  { grade: "L1F", gradeClass: "premium", pricePerKg: 8.50, minWeight: 30, maxWeight: 50 },
  { grade: "L2F", gradeClass: "premium", pricePerKg: 7.80, minWeight: 30, maxWeight: 50 },
  { grade: "L3F", gradeClass: "good", pricePerKg: 6.50, minWeight: 30, maxWeight: 50 },
  { grade: "L4F", gradeClass: "good", pricePerKg: 5.80, minWeight: 30, maxWeight: 50 },
  { grade: "C1F", gradeClass: "standard", pricePerKg: 5.20, minWeight: 30, maxWeight: 50 },
  { grade: "C2F", gradeClass: "standard", pricePerKg: 4.50, minWeight: 30, maxWeight: 50 },
  { grade: "C3F", gradeClass: "standard", pricePerKg: 3.80, minWeight: 30, maxWeight: 50 },
  { grade: "X1F", gradeClass: "low", pricePerKg: 2.80, minWeight: 25, maxWeight: 50 },
  { grade: "X2F", gradeClass: "low", pricePerKg: 2.20, minWeight: 25, maxWeight: 50 },
  { grade: "X3F", gradeClass: "low", pricePerKg: 1.50, minWeight: 25, maxWeight: 50 },
  { grade: "REJ", gradeClass: "rejected", pricePerKg: 0.00, minWeight: 0, maxWeight: 50 },
];

const gradeClassStyles: Record<string, string> = {
  premium: "grade-premium",
  good: "grade-good",
  standard: "grade-standard",
  low: "grade-low",
  rejected: "grade-rejected",
};

const gradeClassBg: Record<string, string> = {
  premium: "bg-success/5 border-success/20",
  good: "bg-primary/5 border-primary/20",
  standard: "bg-secondary/20 border-secondary/30",
  low: "bg-warning/5 border-warning/20",
  rejected: "bg-destructive/5 border-destructive/20",
};

export default function PricingPage() {
  const { companyId, isAdmin } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [priceMatrix, setPriceMatrix] = useState<PriceRow[]>(DEFAULT_PRICES);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [matrixId, setMatrixId] = useState<string | null>(null);
  const [calcGrade, setCalcGrade] = useState("L1F");
  const [calcWeight, setCalcWeight] = useState(42);
  const [calcQty, setCalcQty] = useState(1);

  const fetchPrices = useCallback(async () => {
    if (!companyId) {
      setPriceMatrix(DEFAULT_PRICES);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('price_matrices')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMatrixId(data.id);
        const prices = data.prices as Record<string, any>;
        const rows: PriceRow[] = DEFAULT_PRICES.map(dp => ({
          ...dp,
          pricePerKg: prices[dp.grade]?.price ?? dp.pricePerKg,
        }));
        setPriceMatrix(rows);
      }
    } catch (err) {
      console.error('Error fetching prices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleSave = async () => {
    if (Object.keys(editedPrices).length === 0) {
      setEditMode(false);
      return;
    }

    setIsSaving(true);
    try {
      // Build new prices object
      const pricesObj: Record<string, { price: number }> = {};
      priceMatrix.forEach(p => {
        pricesObj[p.grade] = {
          price: editedPrices[p.grade] !== undefined ? editedPrices[p.grade] : p.pricePerKg,
        };
      });

      if (companyId) {
        const { error } = await supabase
          .from('price_matrices')
          .upsert({
            id: matrixId || undefined,
            company_id: companyId,
            name: '2024 Season Prices',
            prices: pricesObj,
            is_active: true,
            version: 1,
          });

        if (error) throw error;

        await logAudit({
          action: 'PRICE_UPDATE',
          entity_type: 'price_matrix',
          entity_id: matrixId || undefined,
          old_values: Object.fromEntries(priceMatrix.map(p => [p.grade, p.pricePerKg])),
          new_values: editedPrices,
        });
      }

      // Update local state
      setPriceMatrix(prev => prev.map(p => ({
        ...p,
        pricePerKg: editedPrices[p.grade] !== undefined ? editedPrices[p.grade] : p.pricePerKg,
      })));
      setEditedPrices({});
      setEditMode(false);
      toast.success('Prices saved successfully');
    } catch (err) {
      console.error('Error saving prices:', err);
      toast.error('Failed to save prices');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedPrices({});
    setEditMode(false);
  };

  const calcPrice = priceMatrix.find(p => p.grade === calcGrade)?.pricePerKg || 0;
  const calcTotal = (editedPrices[calcGrade] ?? calcPrice) * calcWeight * calcQty;

  const avgPrice = priceMatrix.reduce((sum, p) => sum + p.pricePerKg, 0) / priceMatrix.filter(p => p.pricePerKg > 0).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pricing Matrix</h1>
            <p className="text-muted-foreground">Configure grade-based pricing for tobacco bales</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchPrices} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            {editMode ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="enterprise" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="enterprise" onClick={() => setEditMode(true)} disabled={!isAdmin && !!companyId}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Prices
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${avgPrice.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Average Price/kg</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${priceMatrix[0].pricePerKg.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Top Grade (L1F)</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20 text-secondary-foreground">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">2024 Season</p>
                <p className="text-sm text-muted-foreground">Active pricing period</p>
              </div>
            </div>
          </div>
        </div>

        {/* Price Matrix Table */}
        <div className="card-elevated overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Grade Price Matrix</h3>
            <p className="text-sm text-muted-foreground mt-1">Prices are in USD per kilogram.</p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Grade</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Classification</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Price/kg (USD)</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Weight Range (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {priceMatrix.map((price) => (
                    <tr key={price.grade} className={cn("transition-colors", gradeClassBg[price.gradeClass])}>
                      <td className="px-6 py-4">
                        <span className={cn("grade-badge", gradeClassStyles[price.gradeClass])}>{price.grade}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm capitalize text-foreground">{price.gradeClass}</span>
                      </td>
                      <td className="px-6 py-4">
                        {editMode ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={price.pricePerKg}
                            onChange={(e) => setEditedPrices(prev => ({ ...prev, [price.grade]: parseFloat(e.target.value) || 0 }))}
                            className="w-24 h-9"
                          />
                        ) : (
                          <span className="text-lg font-bold text-foreground">${price.pricePerKg.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{price.minWeight} - {price.maxWeight} kg</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Price Calculator */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Price Calculator</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Grade</label>
              <select
                value={calcGrade}
                onChange={(e) => setCalcGrade(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {priceMatrix.map((p) => (
                  <option key={p.grade} value={p.grade}>{p.grade} - ${p.pricePerKg.toFixed(2)}/kg</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Weight (kg)</label>
              <Input type="number" value={calcWeight} onChange={e => setCalcWeight(parseFloat(e.target.value) || 0)} className="h-11" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Quantity</label>
              <Input type="number" value={calcQty} onChange={e => setCalcQty(parseInt(e.target.value) || 1)} className="h-11" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Total Value</label>
              <div className="h-11 px-4 rounded-lg bg-success/10 border border-success/20 flex items-center">
                <span className="text-xl font-bold text-success">${calcTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
