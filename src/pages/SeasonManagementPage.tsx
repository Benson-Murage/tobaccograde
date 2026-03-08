import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar,
  Plus,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Sun,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SeasonRow {
  id: string;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  bale_count?: number;
}

export default function SeasonManagementPage() {
  const { companyId, isAdmin } = useAuth();
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", start_date: "", end_date: "" });
  const [saving, setSaving] = useState(false);

  const fetchSeasons = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (s) => {
          const { count } = await supabase
            .from("bales")
            .select("id", { count: "exact", head: true })
            .eq("season_id", s.id);
          return { ...s, bale_count: count || 0 } as SeasonRow;
        })
      );
      setSeasons(enriched);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load seasons");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSeasons(); }, [fetchSeasons]);

  const handleCreate = async () => {
    if (!form.name || !form.code || !form.start_date || !form.end_date || !companyId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("seasons").insert({
        company_id: companyId,
        name: form.name,
        code: form.code,
        start_date: form.start_date,
        end_date: form.end_date,
      });
      if (error) throw error;
      toast.success("Season created");
      setDialogOpen(false);
      setForm({ name: "", code: "", start_date: "", end_date: "" });
      fetchSeasons();
    } catch (err: any) {
      toast.error(err.message || "Failed to create season");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (season: SeasonRow) => {
    try {
      const { error } = await supabase
        .from("seasons")
        .update({ is_active: !season.is_active })
        .eq("id", season.id);
      if (error) throw error;
      toast.success(season.is_active ? "Season deactivated" : "Season activated");
      fetchSeasons();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const activeSeason = seasons.find((s) => s.is_active);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Season Management</h1>
            <p className="text-muted-foreground">Manage tobacco grading seasons</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchSeasons} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            {isAdmin && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="enterprise"><Plus className="h-4 w-4 mr-2" />New Season</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Season</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="2026 Main Season" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Code</label>
                      <Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} placeholder="2026-MAIN" className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                        <Input type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">End Date</label>
                        <Input type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} className="mt-1" />
                      </div>
                    </div>
                    <Button className="w-full" onClick={handleCreate} disabled={saving || !form.name || !form.code}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Create Season
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Active Season Banner */}
        {activeSeason && (
          <div className="card-elevated p-4 bg-success/5 border-success/20">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium text-foreground">Active Season: {activeSeason.name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(activeSeason.start_date), "MMM d, yyyy")} — {format(new Date(activeSeason.end_date), "MMM d, yyyy")}
                  {" · "}{activeSeason.bale_count} bales processed
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{seasons.length}</p>
            <p className="text-sm text-muted-foreground">Total Seasons</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">{seasons.filter(s => s.is_active).length}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {seasons.reduce((s, sea) => s + (sea.bale_count || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Bales</p>
          </div>
        </div>

        {/* Season list */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : seasons.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No seasons configured</h3>
            <p className="text-muted-foreground mt-1">Create a season to start grading operations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {seasons.map((season) => (
              <div key={season.id} className="card-elevated p-5 hover:shadow-card-hover transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      season.is_active ? "bg-success/10" : "bg-muted"
                    )}>
                      <Calendar className={cn("h-5 w-5", season.is_active ? "text-success" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{season.name}</h3>
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{season.code}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(season.start_date), "MMM d, yyyy")} — {format(new Date(season.end_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{season.bale_count}</p>
                      <p className="text-xs text-muted-foreground">Bales</p>
                    </div>
                    <span className={cn(
                      "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                      season.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      {season.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {season.is_active ? "Active" : "Inactive"}
                    </span>
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => toggleActive(season)}>
                        {season.is_active ? "Deactivate" : "Activate"}
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
