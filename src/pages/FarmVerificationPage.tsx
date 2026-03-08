import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MapPin, Satellite, CheckCircle, AlertTriangle, XCircle, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

const statusBadge: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  verified: 'bg-success/10 text-success border-success/20',
  flagged: 'bg-warning/10 text-warning border-warning/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function FarmVerificationPage() {
  const [search, setSearch] = useState('');
  const [newVerification, setNewVerification] = useState({ farmer_id: '', declared_area: '', notes: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: verifications, isLoading } = useQuery({
    queryKey: ['farm-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farm_verifications')
        .select(`*, farmers(full_name, farmer_code, farm_location)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: farmers } = useQuery({
    queryKey: ['farmers-for-verification'],
    queryFn: async () => {
      const { data, error } = await supabase.from('farmers').select('id, full_name, farmer_code').eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const createVerification = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile?.company_id) throw new Error('No company');

      const { error } = await supabase.from('farm_verifications').insert({
        company_id: profile.company_id,
        farmer_id: newVerification.farmer_id,
        verified_by: user.id,
        declared_area_hectares: parseFloat(newVerification.declared_area) || null,
        discrepancy_notes: newVerification.notes || null,
        verification_status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Verification request created');
      queryClient.invalidateQueries({ queryKey: ['farm-verifications'] });
      setDialogOpen(false);
      setNewVerification({ farmer_id: '', declared_area: '', notes: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('farm_verifications')
        .update({ verification_status: status, verified_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['farm-verifications'] });
    },
  });

  const filtered = verifications?.filter((v: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.farmers?.full_name?.toLowerCase().includes(q) || v.farmers?.farmer_code?.toLowerCase().includes(q);
  });

  const stats = {
    total: verifications?.length || 0,
    verified: verifications?.filter((v: any) => v.verification_status === 'verified').length || 0,
    flagged: verifications?.filter((v: any) => v.verification_status === 'flagged').length || 0,
    pending: verifications?.filter((v: any) => v.verification_status === 'pending').length || 0,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Satellite className="h-6 w-6 text-primary" />
              Farm Verification
            </h1>
            <p className="text-muted-foreground">Verify farm boundaries, crop areas, and legitimacy</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Verification</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Farm Verification</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Farmer</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newVerification.farmer_id}
                    onChange={(e) => setNewVerification(p => ({ ...p, farmer_id: e.target.value }))}
                  >
                    <option value="">Select farmer...</option>
                    {farmers?.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.full_name} ({f.farmer_code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Declared Area (hectares)</Label>
                  <Input type="number" value={newVerification.declared_area}
                    onChange={(e) => setNewVerification(p => ({ ...p, declared_area: e.target.value }))} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={newVerification.notes}
                    onChange={(e) => setNewVerification(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <Button onClick={() => createVerification.mutate()} disabled={!newVerification.farmer_id || createVerification.isPending}>
                  {createVerification.isPending ? 'Creating...' : 'Create Verification'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-foreground">{stats.total}</p><p className="text-sm text-muted-foreground">Total</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-success">{stats.verified}</p><p className="text-sm text-muted-foreground">Verified</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-warning">{stats.flagged}</p><p className="text-sm text-muted-foreground">Flagged</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-muted-foreground">{stats.pending}</p><p className="text-sm text-muted-foreground">Pending</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <CardTitle>Verifications</CardTitle>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search farmer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Declared Area</TableHead>
                  <TableHead>Verified Area</TableHead>
                  <TableHead>Crop Health</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No verifications</TableCell></TableRow>
                ) : filtered?.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.farmers?.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.farmers?.farm_location || '—'}</TableCell>
                    <TableCell>{v.declared_area_hectares ? `${v.declared_area_hectares} ha` : '—'}</TableCell>
                    <TableCell>{v.verified_area_hectares ? `${v.verified_area_hectares} ha` : '—'}</TableCell>
                    <TableCell>{v.crop_health_score ? `${v.crop_health_score}/100` : '—'}</TableCell>
                    <TableCell><Badge className={statusBadge[v.verification_status]}>{v.verification_status}</Badge></TableCell>
                    <TableCell className="text-sm">{format(new Date(v.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {v.verification_status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: v.id, status: 'verified' })}>
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: v.id, status: 'flagged' })}>
                            <AlertTriangle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: v.id, status: 'rejected' })}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
