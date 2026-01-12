import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Edit,
  Save,
  Calendar,
  TrendingUp,
  Download,
} from "lucide-react";

interface PriceMatrix {
  grade: string;
  gradeClass: "premium" | "good" | "standard" | "low" | "rejected";
  pricePerKg: number;
  minWeight: number;
  maxWeight: number;
  effectiveFrom: string;
}

const priceMatrix: PriceMatrix[] = [
  { grade: "L1F", gradeClass: "premium", pricePerKg: 8.50, minWeight: 30, maxWeight: 50, effectiveFrom: "2024-01-01" },
  { grade: "L2F", gradeClass: "premium", pricePerKg: 7.80, minWeight: 30, maxWeight: 50, effectiveFrom: "2024-01-01" },
  { grade: "L3F", gradeClass: "good", pricePerKg: 6.50, minWeight: 30, maxWeight: 50, effectiveFrom: "2024-01-01" },
  { grade: "L4F", gradeClass: "good", pricePerKg: 5.80, minWeight: 30, maxWeight: 50, effectiveFrom: "2024-01-01" },
  { grade: "C1F", gradeClass: "standard", pricePerKg: 5.20, minWeight: 30, maxWeight: 50, effectiveFrom: "2024-01-01" },
  { grade: "C2F", gradeClass: "standard", pricePerKg: 4.50, minWeight: 30, maxWeight: 50, effectiveFrom: "2024-01-01" },
  { grade: "C3F", gradeClass: "standard", pricePerKg: 3.80, minWeight: 30, maxWeight: 50, effectiveFrom: "2024-01-01" },
  { grade: "X1F", gradeClass: "low", pricePerKg: 2.80, minWeight: 25, maxWeight: 50, effectiveFrom: "2024-01-01" },
  { grade: "X2F", gradeClass: "low", pricePerKg: 2.20, minWeight: 25, maxWeight: 50, effectiveFrom: "2024-01-01" },
  { grade: "X3F", gradeClass: "low", pricePerKg: 1.50, minWeight: 25, maxWeight: 50, effectiveFrom: "2024-01-01" },
  { grade: "REJ", gradeClass: "rejected", pricePerKg: 0.00, minWeight: 0, maxWeight: 50, effectiveFrom: "2024-01-01" },
];

const gradeClassStyles = {
  premium: "grade-premium",
  good: "grade-good",
  standard: "grade-standard",
  low: "grade-low",
  rejected: "grade-rejected",
};

const gradeClassBg = {
  premium: "bg-success/5 border-success/20",
  good: "bg-primary/5 border-primary/20",
  standard: "bg-secondary/20 border-secondary/30",
  low: "bg-warning/5 border-warning/20",
  rejected: "bg-destructive/5 border-destructive/20",
};

export default function PricingPage() {
  const [editMode, setEditMode] = useState(false);

  const totalValue = priceMatrix.reduce((sum, p) => sum + p.pricePerKg, 0);
  const avgPrice = totalValue / priceMatrix.filter(p => p.pricePerKg > 0).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pricing Matrix</h1>
            <p className="text-muted-foreground">
              Configure grade-based pricing for tobacco bales
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              variant={editMode ? "success" : "enterprise"}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Prices
                </>
              )}
            </Button>
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
                <p className="text-sm text-muted-foreground">Effective from Jan 1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Price Matrix Table */}
        <div className="card-elevated overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Grade Price Matrix</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Prices are in USD per kilogram. All prices are version-controlled.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Grade
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Classification
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Price/kg (USD)
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Weight Range (kg)
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Effective From
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {priceMatrix.map((price) => (
                  <tr
                    key={price.grade}
                    className={cn(
                      "transition-colors",
                      gradeClassBg[price.gradeClass]
                    )}
                  >
                    <td className="px-6 py-4">
                      <span className={cn("grade-badge", gradeClassStyles[price.gradeClass])}>
                        {price.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm capitalize text-foreground">{price.gradeClass}</span>
                    </td>
                    <td className="px-6 py-4">
                      {editMode ? (
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={price.pricePerKg}
                          className="w-24 h-9"
                        />
                      ) : (
                        <span className="text-lg font-bold text-foreground">
                          ${price.pricePerKg.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {price.minWeight} - {price.maxWeight} kg
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">{price.effectiveFrom}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Price Calculator */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Price Calculator</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Grade</label>
              <select className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {priceMatrix.map((p) => (
                  <option key={p.grade} value={p.grade}>
                    {p.grade} - ${p.pricePerKg.toFixed(2)}/kg
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Weight (kg)</label>
              <Input type="number" placeholder="Enter weight" defaultValue={42} className="h-11" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Quantity</label>
              <Input type="number" placeholder="Number of bales" defaultValue={1} className="h-11" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Total Value</label>
              <div className="h-11 px-4 rounded-lg bg-success/10 border border-success/20 flex items-center">
                <span className="text-xl font-bold text-success">$357.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
