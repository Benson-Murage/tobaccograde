import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-logger";
import { format } from "date-fns";
import {
  FileCheck,
  Plus,
  Loader2,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Ship,
  Download,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExportBatch {
  id: string;
  batch_code: string;
  status: string;
  total_bales: number;
  total_weight_kg: number;
  inspection_status: string;
  certificate_number: string | null;
  destination_country: string | null;
  buyer_name: string | null;
  created_at: string;
  certified_at: string | null;
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_inspection: "bg-warning/10 text-warning",
  inspected: "bg-primary/10 text-primary",
  certified: "bg-success/10 text-success",
  shipped: "bg-secondary text-secondary-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="h-3 w-3" />,
  pending_inspection: <AlertTriangle className="h-3 w-3" />,
  inspected: <Eye className="h-3 w-3" />,
  certified: <CheckCircle className="h-3 w-3" />,
  shipped: <Ship className="h-3 w-3" />,
};

export default function ExportCertificationPage() {
  const { companyId, user } = useAuth();
  const [batches, setBatches] = useState<ExportBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ batch_code: "", destination_country: "", buyer_name: "" });
  const [saving, setSaving] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [batchRes, whRes] = await Promise.all([
        supabase.from("export_batches").select("*").order("created_at", { ascending: false }),
        supabase.from("warehouses").select("id, name").eq("is_active", true).order("name"),
      ]);
      if (batchRes.error) throw batchRes.error;
      setBatches((batchRes.data || []) as ExportBatch[]);
      setWarehouses(whRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load export batches");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!form.batch_code || !selectedWarehouse || !companyId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("export_batches").insert({
        company_id: companyId,
        warehouse_id: selectedWarehouse,
        batch_code: form.batch_code,
        destination_country: form.destination_country || null,
        buyer_name: form.buyer_name || null,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success("Export batch created");
      logAudit({ action: "CREATE", entity_type: "bale", new_values: { batch_code: form.batch_code, type: "export_batch" } });
      setDialogOpen(false);
      setForm({ batch_code: "", destination_country: "", buyer_name: "" });
      setSelectedWarehouse("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create batch");
    } finally {
      setSaving(false);
    }
  };

  const handleCertify = async (batch: ExportBatch) => {
    const certNumber = `CERT-${batch.batch_code}-${Date.now().toString(36).toUpperCase()}`;
    try {
      const { error } = await supabase
        .from("export_batches")
        .update({
          status: "certified",
          inspection_status: "approved",
          certificate_number: certNumber,
          certified_by: user?.id,
          certified_at: new Date().toISOString(),
        })
        .eq("id", batch.id);
      if (error) throw error;
      toast.success(`Batch certified: ${certNumber}`);
      logAudit({ action: "APPROVE", entity_type: "bale", entity_id: batch.id, new_values: { certificate_number: certNumber, type: "export_certification" } });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const exportCertificate = (batch: ExportBatch) => {
    const content = [
      "TOBACCO EXPORT CERTIFICATE",
      "=".repeat(40),
      `Certificate No: ${batch.certificate_number}`,
      `Batch Code: ${batch.batch_code}`,
      `Total Bales: ${batch.total_bales}`,
      `Total Weight: ${batch.total_weight_kg} kg`,
      `Destination: ${batch.destination_country || "N/A"}`,
      `Buyer: ${batch.buyer_name || "N/A"}`,
      `Certified At: ${batch.certified_at ? format(new Date(batch.certified_at), "PPpp") : "N/A"}`,
      "",
      "This certificate confirms that the above tobacco bales have been",
      "inspected and meet the required quality standards for export.",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.certificate_number || batch.batch_code}-certificate.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Certificate downloaded");
  };

  const filtered = batches.filter(
    (b) => !search || b.batch_code.toLowerCase().includes(search.toLowerCase()) || b.destination_country?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Export Certification</h1>
            <p className="text-muted-foreground">Manage export batches, inspections, and certifications</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="enterprise"><Plus className="h-4 w-4 mr-2" />New Batch</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Export Batch</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Batch Code</label>
                    <Input value={form.batch_code} onChange={(e) => setForm(p => ({ ...p, batch_code: e.target.value }))} placeholder="EXP-2026-001" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Warehouse</label>
                    <select
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Select warehouse...</option>
                      {warehouses.map((wh) => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Destination Country</label>
                    <Input value={form.destination_country} onChange={(e) => setForm(p => ({ ...p, destination_country: e.target.value }))} placeholder="China" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Buyer Name</label>
                    <Input value={form.buyer_name} onChange={(e) => setForm(p => ({ ...p, buyer_name: e.target.value }))} placeholder="International Tobacco Co." className="mt-1" />
                  </div>
                  <Button className="w-full" onClick={handleCreate} disabled={saving || !form.batch_code || !selectedWarehouse}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create Batch
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{batches.length}</p>
            <p className="text-sm text-muted-foreground">Total Batches</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">{batches.filter(b => b.status === "certified").length}</p>
            <p className="text-sm text-muted-foreground">Certified</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-warning">{batches.filter(b => b.status === "pending_inspection").length}</p>
            <p className="text-sm text-muted-foreground">Pending Inspection</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-primary">{batches.filter(b => b.status === "shipped").length}</p>
            <p className="text-sm text-muted-foreground">Shipped</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search batches..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12 h-11" />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No export batches</h3>
            <p className="text-muted-foreground mt-1">Create a batch to start the export certification process</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((batch) => (
              <div key={batch.id} className="card-elevated p-5 hover:shadow-card-hover transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{batch.batch_code}</h3>
                        <span className={cn(
                          "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                          statusStyles[batch.status] || "bg-muted text-muted-foreground"
                        )}>
                          {statusIcons[batch.status]}
                          {batch.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {batch.total_bales} bales · {batch.total_weight_kg} kg
                        {batch.destination_country && ` · → ${batch.destination_country}`}
                      </p>
                      {batch.certificate_number && (
                        <p className="text-xs font-mono text-success mt-1">Certificate: {batch.certificate_number}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {batch.status === "draft" && (
                      <Button variant="outline" size="sm" onClick={() => {
                        supabase.from("export_batches").update({ status: "pending_inspection" }).eq("id", batch.id)
                          .then(() => { toast.success("Submitted for inspection"); fetchData(); });
                      }}>
                        Submit for Inspection
                      </Button>
                    )}
                    {(batch.status === "pending_inspection" || batch.status === "inspected") && (
                      <Button variant="enterprise" size="sm" onClick={() => handleCertify(batch)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Certify
                      </Button>
                    )}
                    {batch.status === "certified" && (
                      <Button variant="outline" size="sm" onClick={() => exportCertificate(batch)}>
                        <Download className="h-4 w-4 mr-1" /> Certificate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
