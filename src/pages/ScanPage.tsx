import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { QRScanner } from "@/components/qr/QRScanner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Package,
  User,
  ClipboardCheck,
  ChevronRight,
  History,
  Search,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface ScanResult {
  type: "bale" | "farmer" | "unknown";
  code: string;
  data?: {
    id?: string;
    name?: string;
    grade?: string;
    weight?: number;
    status?: string;
  };
}

export default function ScanPage() {
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isLooking, setIsLooking] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  const lookupCode = async (code: string): Promise<ScanResult> => {
    if (!companyId) {
      // Demo mode fallback
      if (code.startsWith("BL-")) {
        return { type: "bale", code, data: { name: "Demo Farmer", status: "pending" } };
      }
      if (code.startsWith("FRM-")) {
        return { type: "farmer", code, data: { name: "Demo Farmer" } };
      }
      return { type: "unknown", code };
    }

    // Try bale lookup
    const { data: bale } = await supabase
      .from('bales')
      .select(`
        id, bale_code, status, weight_kg,
        farmers ( full_name ),
        gradings ( grade_code )
      `)
      .eq('company_id', companyId)
      .eq('bale_code', code)
      .maybeSingle();

    if (bale) {
      return {
        type: "bale",
        code,
        data: {
          id: bale.id,
          name: (bale as any).farmers?.full_name || 'Unknown',
          grade: (bale as any).gradings?.[0]?.grade_code || undefined,
          weight: bale.weight_kg,
          status: bale.status || 'registered',
        },
      };
    }

    // Try farmer lookup
    const { data: farmer } = await supabase
      .from('farmers')
      .select('id, full_name, farmer_code')
      .eq('company_id', companyId)
      .or(`farmer_code.eq.${code},national_id.eq.${code}`)
      .maybeSingle();

    if (farmer) {
      return {
        type: "farmer",
        code: farmer.farmer_code,
        data: { id: farmer.id, name: farmer.full_name },
      };
    }

    return { type: "unknown", code };
  };

  const handleScan = async (code: string) => {
    setIsScanning(false);
    setIsLooking(true);

    try {
      const result = await lookupCode(code);
      setScanResult(result);
      setRecentScans(prev => [result, ...prev.slice(0, 9)]);

      if (result.type !== "unknown") {
        toast.success(result.type === "bale" ? "Bale Found" : "Farmer Found", {
          description: `${result.code} - ${result.data?.name || "Unknown"}`,
        });
      } else {
        toast.error("Code Not Recognized", { description: code });
      }
    } catch (error) {
      console.error('Scan lookup error:', error);
      toast.error("Lookup failed", { description: "Could not search the database" });
      setScanResult({ type: "unknown", code });
    } finally {
      setIsLooking(false);
    }
  };

  const handleAction = (action: string) => {
    if (!scanResult) return;
    switch (action) {
      case "grade":
        navigate(`/grading?bale=${scanResult.code}`);
        break;
      case "view-bale":
        navigate(`/bales?code=${scanResult.code}`);
        break;
      case "view-farmer":
        navigate(`/farmers?id=${scanResult.data?.id || scanResult.code}`);
        break;
      case "register":
        navigate(`/bales/new?farmer=${scanResult.data?.id || scanResult.code}`);
        break;
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">QR Scanner</h1>
            <p className="text-muted-foreground">Scan bale or farmer QR codes</p>
          </div>
        </div>

        {/* Scanner or Result */}
        {isScanning ? (
          <div className="card-elevated p-6">
            <QRScanner onScan={handleScan} />
          </div>
        ) : isLooking ? (
          <div className="card-elevated p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Looking up code...</p>
          </div>
        ) : scanResult ? (
          <div className="space-y-4 animate-fade-in">
            <div
              className={cn(
                "card-elevated p-6",
                scanResult.type === "bale" ? "bg-primary/5 border-primary/20" :
                scanResult.type === "farmer" ? "bg-success/5 border-success/20" :
                "bg-destructive/5 border-destructive/20"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl",
                  scanResult.type === "bale" ? "bg-primary/10 text-primary" :
                  scanResult.type === "farmer" ? "bg-success/10 text-success" :
                  "bg-destructive/10 text-destructive"
                )}>
                  {scanResult.type === "bale" ? <Package className="h-7 w-7" /> :
                   scanResult.type === "farmer" ? <User className="h-7 w-7" /> :
                   <Search className="h-7 w-7" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {scanResult.type === "bale" ? "Tobacco Bale" :
                     scanResult.type === "farmer" ? "Registered Farmer" : "Unknown Code"}
                  </p>
                  <p className="font-mono text-xl font-bold text-foreground">{scanResult.code}</p>
                  {scanResult.data?.name && (
                    <p className="text-sm text-muted-foreground mt-1">{scanResult.data.name}</p>
                  )}
                </div>
              </div>

              {scanResult.type === "bale" && scanResult.data?.status !== "not_found" && (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Grade</p>
                    <p className="font-bold text-foreground">{scanResult.data?.grade || "Pending"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="font-bold text-foreground">{scanResult.data?.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={cn("font-bold capitalize", scanResult.data?.status === "graded" ? "text-success" : "text-warning")}>
                      {scanResult.data?.status}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {scanResult.type === "bale" && (
              <div className="grid grid-cols-2 gap-3">
                {(scanResult.data?.status === "pending" || scanResult.data?.status === "registered" || scanResult.data?.status === "pending_grading") && (
                  <Button variant="enterprise" className="col-span-2" onClick={() => handleAction("grade")}>
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Grade This Bale
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
                <Button variant="outline" onClick={() => handleAction("view-bale")}>
                  <Package className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button variant="outline" onClick={() => handleAction("view-farmer")}>
                  <User className="h-4 w-4 mr-2" />
                  View Farmer
                </Button>
              </div>
            )}

            {scanResult.type === "farmer" && (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="enterprise" className="col-span-2" onClick={() => handleAction("register")}>
                  <Package className="h-4 w-4 mr-2" />
                  Register New Bale
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="outline" className="col-span-2" onClick={() => handleAction("view-farmer")}>
                  <User className="h-4 w-4 mr-2" />
                  View Farmer Profile
                </Button>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={resetScan}>
              Scan Another Code
            </Button>
          </div>
        ) : null}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Recent Scans</h3>
            </div>
            <div className="space-y-2">
              {recentScans.map((scan, i) => (
                <button
                  key={i}
                  onClick={() => { setScanResult(scan); setIsScanning(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    scan.type === "bale" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                  )}>
                    {scan.type === "bale" ? <Package className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium text-foreground truncate">{scan.code}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {scan.data?.name}{scan.data?.grade && ` • Grade: ${scan.data.grade}`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
