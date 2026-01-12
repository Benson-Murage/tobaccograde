import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { QRScanner } from "@/components/qr/QRScanner";
import { cn } from "@/lib/utils";
import {
  Package,
  User,
  Scale,
  MapPin,
  Calendar,
  CheckCircle,
  ChevronRight,
  QrCode,
  Scan,
  Search,
  Printer,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface BaleFormData {
  farmerSearch: string;
  farmerId: string;
  farmerName: string;
  weight: string;
  warehouse: string;
  bay: string;
  notes: string;
}

const warehouses = [
  { id: "WH-A", name: "Warehouse A" },
  { id: "WH-B", name: "Warehouse B" },
  { id: "WH-C", name: "Warehouse C" },
];

const bays = ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Bay 5"];

// Mock farmer data for search
const mockFarmers = [
  { id: "FRM-001234", name: "Peter Nyambi", contract: "CON-2024-0001" },
  { id: "FRM-001235", name: "Sarah Tembo", contract: "CON-2024-0002" },
  { id: "FRM-001236", name: "John Phiri", contract: "CON-2024-0003" },
  { id: "FRM-001237", name: "Grace Mwanza", contract: "CON-2024-0004" },
];

export default function BaleRegistrationPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "scanning" | "confirm" | "complete">("form");
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [generatedBaleCode, setGeneratedBaleCode] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<typeof mockFarmers>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [formData, setFormData] = useState<BaleFormData>({
    farmerSearch: "",
    farmerId: "",
    farmerName: "",
    weight: "",
    warehouse: "",
    bay: "",
    notes: "",
  });

  const handleFarmerSearch = (query: string) => {
    setFormData({ ...formData, farmerSearch: query });
    if (query.length >= 2) {
      const results = mockFarmers.filter(
        (f) =>
          f.name.toLowerCase().includes(query.toLowerCase()) ||
          f.id.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const selectFarmer = (farmer: (typeof mockFarmers)[0]) => {
    setFormData({
      ...formData,
      farmerSearch: farmer.name,
      farmerId: farmer.id,
      farmerName: farmer.name,
    });
    setShowSearchResults(false);
  };

  const handleQRScan = (result: string) => {
    setScannedCode(result);
    setShowScanner(false);

    // Check if scanned code is a farmer ID
    const farmer = mockFarmers.find((f) => f.id === result);
    if (farmer) {
      selectFarmer(farmer);
      toast({
        title: "Farmer Found",
        description: `Loaded ${farmer.name} (${farmer.id})`,
      });
    } else {
      toast({
        title: "Code Scanned",
        description: result,
      });
    }
  };

  const generateBaleCode = () => {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
    return `BL-${year}-${random}`;
  };

  const handleSubmit = () => {
    if (!formData.farmerId || !formData.weight || !formData.warehouse) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const baleCode = generateBaleCode();
    setGeneratedBaleCode(baleCode);
    setStep("confirm");
  };

  const handleConfirm = () => {
    setStep("complete");
    toast({
      title: "Bale Registered Successfully",
      description: `Bale ${generatedBaleCode} has been registered`,
    });
  };

  const handlePrintLabel = () => {
    window.print();
  };

  const resetForm = () => {
    setFormData({
      farmerSearch: "",
      farmerId: "",
      farmerName: "",
      weight: "",
      warehouse: "",
      bay: "",
      notes: "",
    });
    setGeneratedBaleCode(null);
    setScannedCode(null);
    setStep("form");
  };

  if (showScanner) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setShowScanner(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Scan QR Code</h1>
              <p className="text-muted-foreground">Scan farmer ID or bale code</p>
            </div>
          </div>

          <div className="card-elevated p-6">
            <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/bales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Register New Bale</h1>
            <p className="text-muted-foreground">
              {step === "form" && "Enter bale details or scan QR code"}
              {step === "confirm" && "Review and confirm registration"}
              {step === "complete" && "Bale registered successfully"}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {["form", "confirm", "complete"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  step === s || ["confirm", "complete"].indexOf(step) >= i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div
                  className={cn(
                    "flex-1 h-1 rounded-full transition-colors",
                    ["confirm", "complete"].indexOf(step) > i ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Step */}
        {step === "form" && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="card-elevated p-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowScanner(true)}
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Scan Farmer QR
                </Button>
                <Button variant="outline" className="flex-1">
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan Existing Bale
                </Button>
              </div>
            </div>

            {/* Farmer Selection */}
            <div className="card-elevated p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">Farmer Information</h3>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search farmer by name or ID..."
                  value={formData.farmerSearch}
                  onChange={(e) => handleFarmerSearch(e.target.value)}
                  className="pl-12 h-12"
                />
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-auto">
                    {searchResults.map((farmer) => (
                      <button
                        key={farmer.id}
                        onClick={() => selectFarmer(farmer)}
                        className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0"
                      >
                        <p className="font-medium text-foreground">{farmer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {farmer.id} • {farmer.contract}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {formData.farmerId && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-medium text-success">Farmer Selected</span>
                  </div>
                  <p className="text-sm text-foreground mt-1">
                    {formData.farmerName} ({formData.farmerId})
                  </p>
                </div>
              )}
            </div>

            {/* Weight */}
            <div className="card-elevated p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Scale className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">Bale Weight</h3>
              </div>

              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Enter weight in kg"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="h-12 text-lg pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  kg
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="card-elevated p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">Storage Location</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Warehouse *
                  </label>
                  <select
                    value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Bay
                  </label>
                  <select
                    value={formData.bay}
                    onChange={(e) => setFormData({ ...formData, bay: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select bay</option>
                    {bays.map((bay) => (
                      <option key={bay} value={bay}>
                        {bay}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card-elevated p-6 space-y-4">
              <label className="block text-sm font-medium text-muted-foreground">
                Notes (Optional)
              </label>
              <textarea
                placeholder="Any additional notes about this bale..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full h-24 px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Submit */}
            <Button variant="enterprise" size="lg" className="w-full" onClick={handleSubmit}>
              Generate Bale Code
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
        )}

        {/* Confirm Step */}
        {step === "confirm" && generatedBaleCode && (
          <div className="space-y-6">
            <div className="card-elevated p-8 text-center">
              <QRCodeDisplay
                value={generatedBaleCode}
                size={200}
                label={generatedBaleCode}
                showActions={false}
              />
            </div>

            <div className="card-elevated p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Registration Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Bale Code</span>
                  <span className="font-mono font-semibold">{generatedBaleCode}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Farmer</span>
                  <span className="font-medium">{formData.farmerName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Farmer ID</span>
                  <span className="font-mono">{formData.farmerId}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">{formData.weight} kg</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">
                    {warehouses.find((w) => w.id === formData.warehouse)?.name}
                    {formData.bay && `, ${formData.bay}`}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button variant="enterprise" className="flex-1" onClick={handleConfirm}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Registration
              </Button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && generatedBaleCode && (
          <div className="space-y-6">
            <div className="card-elevated p-8 text-center bg-success/5 border-success/20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success mx-auto mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Bale Registered Successfully!</h2>
              <p className="text-muted-foreground mt-2">
                The bale has been added to the system and is ready for grading.
              </p>
            </div>

            <div className="card-elevated p-8 text-center" id="print-label">
              <QRCodeDisplay
                value={generatedBaleCode}
                size={180}
                label={generatedBaleCode}
              />
              <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <p>{formData.farmerName}</p>
                <p>{formData.weight} kg • {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handlePrintLabel}>
                <Printer className="h-4 w-4 mr-2" />
                Print Label
              </Button>
              <Button variant="enterprise" className="flex-1" onClick={resetForm}>
                <Package className="h-4 w-4 mr-2" />
                Register Another
              </Button>
            </div>

            <Link to="/grading" className="block">
              <Button variant="gold" size="lg" className="w-full">
                Proceed to Grading
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
