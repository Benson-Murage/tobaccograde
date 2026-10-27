/**
 * Farmer Profile Page
 *
 * Farmer details, editable contact/contract fields, full delivery history,
 * and payment recording for company administrators.
 *
 * Payment rule: a payment aggregates the farmer's currently unpaid graded
 * bales (status 'graded'). Recording a payment moves those bales to 'paid',
 * so a second recording attempt finds nothing to pay — duplicate payments are
 * prevented by bale status, not by trust in the UI.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-logger";
import {
  ArrowLeft, Phone, MapPin, Mail, Wallet, Loader2, Pencil, Package, DollarSign, FileText, AlertTriangle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Farmer {
  id: string;
  farmer_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  farm_location: string | null;
  national_id: string | null;
  contract_number: string | null;
  bank_account: string | null;
  mobile_money_number: string | null;
}

interface DeliveryRow {
  id: string;
  bale_code: string;
  weight_kg: number;
  status: string;
  registered_at: string;
  grade_code: string | null;
  total_value: number | null;
}

interface PaymentRow {
  id: string;
  total_weight_kg: number | null;
  total_value: number | null;
  currency: string | null;
  status: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export default function FarmerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companyId, user } = useAuth();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Farmer>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [unpaid, setUnpaid] = useState<DeliveryRow[]>([]);

  const load = useCallback(async () => {
    if (!id || !companyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: farmerData, error: farmerError } = await supabase
        .from("farmers")
        .select("id, farmer_code, full_name, phone, email, farm_location, national_id, contract_number, bank_account, mobile_money_number")
        .eq("id", id)
        .eq("company_id", companyId)
        .maybeSingle();
      if (farmerError) throw farmerError;
      if (!farmerData) {
        setError("Farmer not found");
        return;
      }
      setFarmer(farmerData as Farmer);
      setEditForm(farmerData as Farmer);

      const { data: baleData, error: baleError } = await supabase
        .from("bales")
        .select("id, bale_code, weight_kg, status, registered_at, gradings ( grade_code, grading_prices ( total_value ) )")
        .eq("farmer_id", id)
        .eq("company_id", companyId)
        .order("registered_at", { ascending: false })
        .limit(200);
      if (baleError) throw baleError;
      const rows: DeliveryRow[] = (baleData || []).map((b: any) => ({
        id: b.id,
        bale_code: b.bale_code,
        weight_kg: b.weight_kg,
        status: b.status,
        registered_at: b.registered_at,
        grade_code: b.gradings?.[0]?.grade_code ?? null,
        total_value: b.gradings?.[0]?.grading_prices?.[0]?.total_value ?? null,
      }));
      setDeliveries(rows);
      setUnpaid(rows.filter((r) => r.status === "graded"));

      const { data: payData, error: payError } = await supabase
        .from("payments")
        .select("id, total_weight_kg, total_value, currency, status, payment_reference, paid_at, created_at")
        .eq("farmer_id", id)
        .order("created_at", { ascending: false });
      if (payError) throw payError;
      setPayments((payData || []) as PaymentRow[]);
    } catch (err) {
      console.error("Failed to load farmer:", err);
      setError("Could not load this farmer's profile");
    } finally {
      setIsLoading(false);
    }
  }, [id, companyId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveEdit = async () => {
    if (!farmer || !editForm.full_name?.trim()) {
      toast.error("Full name is required");
      return;
    }
    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("farmers")
        .update({
          full_name: editForm.full_name.trim(),
          phone: editForm.phone || null,
          email: editForm.email || null,
          farm_location: editForm.farm_location || null,
          national_id: editForm.national_id || null,
          contract_number: editForm.contract_number || null,
          bank_account: editForm.bank_account || null,
          mobile_money_number: editForm.mobile_money_number || null,
        })
        .eq("id", farmer.id);
      if (updateError) throw updateError;
      await logAudit({
        action: "UPDATE",
        entity_type: "farmer",
        entity_id: farmer.id,
        old_values: { full_name: farmer.full_name, phone: farmer.phone, farm_location: farmer.farm_location, contract_number: farmer.contract_number },
        new_values: { full_name: editForm.full_name.trim(), phone: editForm.phone || null, farm_location: editForm.farm_location || null, contract_number: editForm.contract_number || null },
      });
      toast.success("Farmer updated");
      setEditOpen(false);
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update farmer");
    } finally {
      setIsSaving(false);
    }
  };

  const totalUnpaid = unpaid.reduce((s, r) => s + Number(r.total_value || 0), 0);
  const unpaidWeight = unpaid.reduce((s, r) => s + Number(r.weight_kg || 0), 0);

  const handleRecordPayment = async () => {
    if (!farmer || unpaid.length === 0 || !companyId) return;
    setIsPaying(true);
    try {
      // Re-check unpaid bales server-side to avoid paying stale data
      const { data: stillUnpaid, error: checkError } = await supabase
        .from("bales")
        .select("id, weight_kg, gradings ( grading_prices ( total_value ) )")
        .eq("farmer_id", farmer.id)
        .eq("company_id", companyId)
        .eq("status", "graded");
      if (checkError) throw checkError;
      if (!stillUnpaid || stillUnpaid.length === 0) {
        toast.error("No unpaid graded bales remain — nothing to pay");
        setIsPaying(false);
        setPayOpen(false);
        load();
        return;
      }
      const weight = stillUnpaid.reduce((s, b: any) => s + Number(b.weight_kg || 0), 0);
      const value = stillUnpaid.reduce((s, b: any) => s + Number(b.gradings?.[0]?.grading_prices?.[0]?.total_value || 0), 0);

      const { data: payment, error: payError } = await supabase
        .from("payments")
        .insert({
          company_id: companyId,
          farmer_id: farmer.id,
          total_weight_kg: weight,
          total_value: value,
          currency: "USD",
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_reference: `PAY-${Date.now().toString(36).toUpperCase()}`,
        })
        .select()
        .single();
      if (payError) throw payError;

      const { error: baleUpdateError } = await supabase
        .from("bales")
        .update({ status: "paid" })
        .in("id", stillUnpaid.map((b: any) => b.id));
      if (baleUpdateError) throw baleUpdateError;

      // Audit trail is written by the audit_payments database trigger.
      toast.success(`Payment recorded: ${value.toFixed(2)} USD for ${stillUnpaid.length} bale(s)`);
      setPayOpen(false);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to record payment");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (error || !farmer) {
    return (
      <AppLayout>
        <div className="card-elevated p-12 text-center max-w-md mx-auto mt-10">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="text-muted-foreground">{error || "Farmer not found"}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/farmers")}>Back to Farmers</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/farmers")} className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Farmers
        </Button>

        {/* Header */}
        <div className="card-elevated p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{farmer.full_name}</h1>
                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{farmer.farmer_code}</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                {farmer.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{farmer.phone}</span>}
                {farmer.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{farmer.email}</span>}
                {farmer.farm_location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{farmer.farm_location}</span>}
                {farmer.contract_number && <span className="flex items-center gap-1"><FileText className="h-4 w-4" />{farmer.contract_number}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button variant="enterprise" disabled={unpaid.length === 0} onClick={() => setPayOpen(true)}>
                <Wallet className="h-4 w-4 mr-2" /> Record Payment
              </Button>
            </div>
          </div>
        </div>

        {/* Delivery summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{deliveries.length}</p>
            <p className="text-sm text-muted-foreground">Total Deliveries</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{deliveries.filter(d => d.status === "graded" || d.status === "paid").length}</p>
            <p className="text-sm text-muted-foreground">Graded Bales</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {deliveries.reduce((s, d) => s + Number(d.total_value || 0), 0).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Total Value (USD)</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-warning">{unpaid.length}</p>
            <p className="text-sm text-muted-foreground">Awaiting Payment</p>
          </div>
        </div>

        {/* Delivery history */}
        <div className="card-elevated overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Delivery History</h2>
          </div>
          {deliveries.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No bales delivered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-6 py-3">Bale</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-6 py-3">Grade</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-6 py-3">Weight (kg)</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-6 py-3">Value (USD)</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-6 py-3">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/20">
                      <td className="px-6 py-3 font-mono text-sm">{d.bale_code}</td>
                      <td className="px-6 py-3 text-sm">{d.grade_code || "—"}</td>
                      <td className="px-6 py-3 text-sm">{d.weight_kg}</td>
                      <td className="px-6 py-3 text-sm">{d.total_value != null ? d.total_value.toFixed(2) : "—"}</td>
                      <td className="px-6 py-3 text-sm capitalize">{d.status}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{new Date(d.registered_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment history */}
        <div className="card-elevated overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Payment History</h2>
          </div>
          {payments.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No payments recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-6 py-3">Reference</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-6 py-3">Weight (kg)</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-6 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-6 py-3 font-mono text-sm">{p.payment_reference || p.id.slice(0, 8)}</td>
                      <td className="px-6 py-3 text-sm">{p.total_weight_kg ?? "—"}</td>
                      <td className="px-6 py-3 text-sm font-medium">{p.total_value?.toFixed(2)} {p.currency || ""}</td>
                      <td className="px-6 py-3 text-sm capitalize">{p.status}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{new Date(p.paid_at || p.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit dialog */}
        <Dialog open={editOpen} onOpenChange={(o) => { if (!isSaving) setEditOpen(o); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Farmer — {farmer.full_name}</DialogTitle>
              <DialogDescription>Update contact and contract details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full name *</Label>
                <Input id="full_name" value={editForm.full_name || ""} onChange={(e) => setEditForm(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={editForm.phone || ""} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={editForm.email || ""} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="national_id">National ID</Label>
                  <Input id="national_id" value={editForm.national_id || ""} onChange={(e) => setEditForm(p => ({ ...p, national_id: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contract_number">Contract number</Label>
                  <Input id="contract_number" value={editForm.contract_number || ""} onChange={(e) => setEditForm(p => ({ ...p, contract_number: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="farm_location">Farm location</Label>
                <Input id="farm_location" value={editForm.farm_location || ""} onChange={(e) => setEditForm(p => ({ ...p, farm_location: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bank_account">Bank account</Label>
                  <Input id="bank_account" value={editForm.bank_account || ""} onChange={(e) => setEditForm(p => ({ ...p, bank_account: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mobile_money">Mobile money</Label>
                  <Input id="mobile_money" value={editForm.mobile_money_number || ""} onChange={(e) => setEditForm(p => ({ ...p, mobile_money_number: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button variant="enterprise" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment confirmation */}
        <Dialog open={payOpen} onOpenChange={(o) => { if (!isPaying) setPayOpen(o); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment — {farmer.full_name}</DialogTitle>
              <DialogDescription>
                Pay all graded, unpaid bales for this farmer. This action is audited.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-border p-4 space-y-1 text-sm">
              <p>{unpaid.length} bale(s) · {unpaidWeight.toFixed(1)} kg</p>
              <p className="text-lg font-bold text-foreground">{totalUnpaid.toFixed(2)} USD</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayOpen(false)} disabled={isPaying}>Cancel</Button>
              <Button variant="enterprise" onClick={handleRecordPayment} disabled={isPaying || unpaid.length === 0}>
                {isPaying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Recording...</> : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
