import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  Loader2,
  Package,
  User,
  MapPin,
  Scale,
  Droplets,
  Award,
  DollarSign,
  AlertTriangle,
  Camera,
  ArrowRight,
  Shield,
} from "lucide-react";

interface BaleTrace {
  bale: any;
  farmer: any;
  grading: any;
  price: any;
  disputes: any[];
  images: any[];
}

export default function TraceabilityPage() {
  const [search, setSearch] = useState("");
  const [trace, setTrace] = useState<BaleTrace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setIsLoading(true);
    setNotFound(false);
    setTrace(null);
    try {
      // Find bale
      const { data: bale } = await supabase
        .from("bales")
        .select("*")
        .or(`bale_code.ilike.%${search}%,qr_code.ilike.%${search}%`)
        .limit(1)
        .maybeSingle();

      if (!bale) { setNotFound(true); return; }

      // Fetch related data in parallel
      const [farmerRes, gradingRes, disputeRes, imageRes] = await Promise.all([
        supabase.from("farmers").select("*").eq("id", bale.farmer_id).maybeSingle(),
        supabase.from("gradings").select("*").eq("bale_id", bale.id).order("graded_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("disputes").select("*").eq("grading_id", bale.id),
        supabase.from("grading_images").select("*").eq("bale_id", bale.id),
      ]);

      let price = null;
      if (gradingRes.data) {
        const { data: priceData } = await supabase
          .from("grading_prices")
          .select("*")
          .eq("grading_id", gradingRes.data.id)
          .maybeSingle();
        price = priceData;
      }

      setTrace({
        bale,
        farmer: farmerRes.data,
        grading: gradingRes.data,
        price,
        disputes: disputeRes.data || [],
        images: imageRes.data || [],
      });
    } catch (err) {
      console.error(err);
      toast.error("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const TimelineStep = ({ icon, title, subtitle, active = true }: { icon: React.ReactNode; title: string; subtitle: string; active?: boolean }) => (
    <div className={cn("flex items-start gap-3 p-4 rounded-lg border", active ? "border-primary/20 bg-primary/5" : "border-border bg-muted/30")}>
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
        {icon}
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bale Traceability</h1>
          <p className="text-muted-foreground">Farm-to-warehouse complete lifecycle view</p>
        </div>

        <div className="card-elevated p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Immutable traceability records for regulatory compliance and export verification.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Enter bale code or QR code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-12 h-11"
            />
          </div>
          <Button variant="enterprise" onClick={handleSearch} disabled={isLoading || !search.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Trace"}
          </Button>
        </div>

        {notFound && (
          <div className="card-elevated p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Bale not found</h3>
            <p className="text-muted-foreground mt-1">No bale matches "{search}"</p>
          </div>
        )}

        {trace && (
          <div className="space-y-6">
            {/* Bale Header */}
            <div className="card-elevated p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{trace.bale.bale_code}</h2>
                  <p className="text-muted-foreground">
                    Registered {format(new Date(trace.bale.registered_at), "PPpp")}
                  </p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium capitalize",
                  trace.bale.status === "approved" ? "bg-success/10 text-success" :
                  trace.bale.status === "graded" ? "bg-primary/10 text-primary" :
                  trace.bale.status === "disputed" ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                )}>
                  {trace.bale.status}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Lifecycle Timeline</h3>
              <div className="grid gap-2">
                <TimelineStep
                  icon={<User className="h-4 w-4" />}
                  title={`Farmer: ${trace.farmer?.full_name || "Unknown"}`}
                  subtitle={`Code: ${trace.farmer?.farmer_code || "N/A"} · Location: ${trace.farmer?.farm_location || "N/A"}`}
                />
                <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                <TimelineStep
                  icon={<Scale className="h-4 w-4" />}
                  title={`Weight: ${trace.bale.weight_kg} kg`}
                  subtitle={`Warehouse intake · ${format(new Date(trace.bale.registered_at), "PPp")}`}
                />
                <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                {trace.grading ? (
                  <>
                    <TimelineStep
                      icon={<Award className="h-4 w-4" />}
                      title={`Grade: ${trace.grading.grade_code} (${trace.grading.grade_class || "Standard"})`}
                      subtitle={`Color: ${trace.grading.color} · Texture: ${trace.grading.texture} · Leaf: ${trace.grading.leaf_position} · Defects: ${trace.grading.defect_percent ?? 0}%`}
                    />
                    {trace.grading.moisture_percent && (
                      <>
                        <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                        <TimelineStep
                          icon={<Droplets className="h-4 w-4" />}
                          title={`Moisture: ${trace.grading.moisture_percent}%`}
                          subtitle={trace.grading.device_id ? `Device: ${trace.grading.device_id}` : "Manual reading"}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <TimelineStep icon={<Award className="h-4 w-4" />} title="Pending Grading" subtitle="Bale has not been graded yet" active={false} />
                )}
                {trace.price && (
                  <>
                    <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                    <TimelineStep
                      icon={<DollarSign className="h-4 w-4" />}
                      title={`Value: ${trace.price.currency} ${trace.price.total_value.toFixed(2)}`}
                      subtitle={`Unit price: ${trace.price.unit_price.toFixed(2)}/kg`}
                    />
                  </>
                )}
                {trace.disputes.length > 0 && (
                  <>
                    <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                    <TimelineStep
                      icon={<AlertTriangle className="h-4 w-4" />}
                      title={`${trace.disputes.length} Dispute(s)`}
                      subtitle={trace.disputes.map(d => `${d.status}: ${d.reason}`).join(" | ")}
                    />
                  </>
                )}
                {trace.images.length > 0 && (
                  <>
                    <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                    <TimelineStep
                      icon={<Camera className="h-4 w-4" />}
                      title={`${trace.images.length} Image(s) Captured`}
                      subtitle={`Evidence linked at ${format(new Date(trace.images[0].captured_at), "PPp")}`}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
