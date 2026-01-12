import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  Scan,
  Camera,
  CheckCircle,
  ChevronRight,
  Package,
  User,
  Scale,
  Droplets,
  Leaf,
  AlertCircle,
} from "lucide-react";

// Mock data for current bale being graded
const currentBale = {
  code: "BL-2024-00848",
  farmer: "Peter Nyambi",
  farmerId: "FRM-001234",
  weight: 42.5,
  deliveryDate: "2024-01-12",
  warehouse: "Warehouse A - Bay 3",
};

type GradingParameter = {
  id: string;
  name: string;
  icon: React.ReactNode;
  options: { value: string; label: string }[];
};

const gradingParameters: GradingParameter[] = [
  {
    id: "position",
    name: "Leaf Position",
    icon: <Leaf className="h-5 w-5" />,
    options: [
      { value: "lugs", label: "Lugs (P)" },
      { value: "cutters", label: "Cutters (C)" },
      { value: "leaf", label: "Leaf (L)" },
      { value: "tips", label: "Tips (T)" },
    ],
  },
  {
    id: "color",
    name: "Color",
    icon: <div className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-600" />,
    options: [
      { value: "lemon", label: "Lemon" },
      { value: "orange", label: "Orange" },
      { value: "reddish", label: "Reddish" },
      { value: "brown", label: "Brown" },
      { value: "greenish", label: "Greenish" },
    ],
  },
  {
    id: "maturity",
    name: "Maturity",
    icon: <Scale className="h-5 w-5" />,
    options: [
      { value: "under", label: "Under-mature" },
      { value: "mature", label: "Mature" },
      { value: "over", label: "Over-mature" },
    ],
  },
  {
    id: "texture",
    name: "Texture / Body",
    icon: <Package className="h-5 w-5" />,
    options: [
      { value: "thin", label: "Thin" },
      { value: "medium", label: "Medium" },
      { value: "heavy", label: "Heavy" },
    ],
  },
];

const moistureOptions = [
  { value: "below12", label: "< 12%", status: "warning" },
  { value: "12-15", label: "12-15%", status: "success" },
  { value: "15-18", label: "15-18%", status: "success" },
  { value: "above18", label: "> 18%", status: "warning" },
];

const defectOptions = [
  { value: "none", label: "None (0%)", status: "success" },
  { value: "minimal", label: "Minimal (1-5%)", status: "success" },
  { value: "moderate", label: "Moderate (5-10%)", status: "warning" },
  { value: "significant", label: "Significant (>10%)", status: "error" },
];

export default function GradingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [moisture, setMoisture] = useState<string | null>(null);
  const [defects, setDefects] = useState<string | null>(null);
  const [step, setStep] = useState<"search" | "grading" | "review">("grading");

  const handleSelection = (parameterId: string, value: string) => {
    setSelections((prev) => ({ ...prev, [parameterId]: value }));
  };

  const calculatedGrade = (() => {
    if (Object.keys(selections).length < 4 || !moisture || !defects) return null;
    // Simplified grade calculation for demo
    const position = selections.position;
    const color = selections.color;
    const isGoodQuality = moisture === "12-15" || moisture === "15-18";
    const lowDefects = defects === "none" || defects === "minimal";
    
    if (position === "leaf" && color === "lemon" && isGoodQuality && lowDefects) {
      return { grade: "L1F", class: "premium" as const };
    } else if (position === "leaf" && isGoodQuality && lowDefects) {
      return { grade: "L2F", class: "good" as const };
    } else if (position === "cutters" && isGoodQuality) {
      return { grade: "C2F", class: "standard" as const };
    } else if (defects === "significant") {
      return { grade: "REJ", class: "rejected" as const };
    }
    return { grade: "X2F", class: "low" as const };
  })();

  const gradeClassColors = {
    premium: "bg-success text-success-foreground",
    good: "bg-primary text-primary-foreground",
    standard: "bg-secondary text-secondary-foreground",
    low: "bg-warning text-warning-foreground",
    rejected: "bg-destructive text-destructive-foreground",
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tobacco Grading</h1>
            <p className="text-muted-foreground">Grade bales quickly and accurately</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="default">
              <Scan className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
            <Button variant="outline" size="default">
              <Camera className="h-4 w-4 mr-2" />
              Photo
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by bale code, farmer name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </div>

        {/* Current Bale Info */}
        <div className="card-elevated p-6 gradient-hero text-primary-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span className="font-mono text-lg font-bold">{currentBale.code}</span>
              </div>
              <div className="flex items-center gap-4 text-primary-foreground/80 text-sm">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {currentBale.farmer}
                </span>
                <span className="flex items-center gap-1">
                  <Scale className="h-4 w-4" />
                  {currentBale.weight} kg
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-primary-foreground/70">
              <p>{currentBale.warehouse}</p>
              <p>{currentBale.deliveryDate}</p>
            </div>
          </div>
        </div>

        {/* Grading Parameters */}
        <div className="space-y-4">
          {gradingParameters.map((param) => (
            <div key={param.id} className="card-elevated p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {param.icon}
                </div>
                <h3 className="font-semibold text-foreground">{param.name}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {param.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelection(param.id, option.value)}
                    className={cn(
                      "grading-button rounded-lg border-2 font-medium transition-all",
                      selections[param.id] === option.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Moisture */}
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Droplets className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Moisture Content</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {moistureOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMoisture(option.value)}
                  className={cn(
                    "grading-button rounded-lg border-2 font-medium transition-all",
                    moisture === option.value
                      ? option.status === "success"
                        ? "border-success bg-success text-success-foreground"
                        : "border-warning bg-warning text-warning-foreground"
                      : "border-border bg-background hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Defects */}
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Defects</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {defectOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDefects(option.value)}
                  className={cn(
                    "grading-button rounded-lg border-2 font-medium transition-all text-sm",
                    defects === option.value
                      ? option.status === "success"
                        ? "border-success bg-success text-success-foreground"
                        : option.status === "warning"
                        ? "border-warning bg-warning text-warning-foreground"
                        : "border-destructive bg-destructive text-destructive-foreground"
                      : "border-border bg-background hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculated Grade & Submit */}
        <div className="card-elevated p-6 sticky bottom-4 bg-card/95 backdrop-blur">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground font-medium">Calculated Grade:</span>
              {calculatedGrade ? (
                <span
                  className={cn(
                    "px-6 py-2 rounded-lg text-xl font-bold",
                    gradeClassColors[calculatedGrade.class]
                  )}
                >
                  {calculatedGrade.grade}
                </span>
              ) : (
                <span className="px-6 py-2 rounded-lg text-xl font-bold bg-muted text-muted-foreground">
                  ---
                </span>
              )}
            </div>
            <Button
              variant="enterprise"
              size="lg"
              disabled={!calculatedGrade}
              className="w-full sm:w-auto"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Confirm Grade
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
