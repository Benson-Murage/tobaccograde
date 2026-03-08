import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Users,
  Package,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCw,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WarehouseRow {
  id: string;
  name: string;
  code: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
  bale_count?: number;
  device_count?: number;
  grader_count?: number;
}

export default function WarehouseManagementPage() {
  const { companyId, isAdmin } = useAuth();
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .order("name");
      if (error) throw error;

      // Get counts per warehouse
      const enriched = await Promise.all(
        (data || []).map(async (wh) => {
          const [bales, devices] = await Promise.all([
            supabase.from("bales").select("id", { count: "exact", head: true }).eq("warehouse_id", wh.id),
            supabase.from("devices").select("id", { count: "exact", head: true }).eq("company_id", wh.company_id),
          ]);
          return {
            ...wh,
            bale_count: bales.count || 0,
            device_count: devices.count || 0,
          } as WarehouseRow;
        })
      );
      setWarehouses(enriched);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load warehouses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async () => {
    if (!newName || !newCode || !companyId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("warehouses").insert({
        company_id: companyId,
        name: newName,
        code: newCode,
        location: newLocation || null,
      });
      if (error) throw error;
      toast.success("Warehouse created");
      setDialogOpen(false);
      setNewName(""); setNewCode(""); setNewLocation("");
      fetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create warehouse");
    } finally {
      setSaving(false);
    }
  };

  const filtered = warehouses.filter(
    (w) =>
      !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Warehouse Management</h1>
            <p className="text-muted-foreground">Manage warehouses, devices, and throughput</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetch} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            {isAdmin && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="enterprise"><Plus className="h-4 w-4 mr-2" />Add Warehouse</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Warehouse</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Main Warehouse" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Code</label>
                      <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="WH-001" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Harare, Zimbabwe" className="mt-1" />
                    </div>
                    <Button className="w-full" onClick={handleCreate} disabled={saving || !newName || !newCode}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Create Warehouse
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{warehouses.length}</p>
            <p className="text-sm text-muted-foreground">Total Warehouses</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">{warehouses.filter(w => w.is_active).length}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {warehouses.reduce((s, w) => s + (w.bale_count || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Bales</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              {warehouses.reduce((s, w) => s + (w.device_count || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Devices</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search warehouses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12 h-11" />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No warehouses found</h3>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((wh) => (
              <div key={wh.id} className="card-elevated p-5 hover:shadow-card-hover transition-shadow space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{wh.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{wh.code}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                    wh.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}>
                    {wh.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {wh.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {wh.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {wh.location}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">{wh.bale_count || 0}</span>
                    <span className="text-muted-foreground">bales</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">{wh.device_count || 0}</span>
                    <span className="text-muted-foreground">devices</span>
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
