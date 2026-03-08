import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, Shield, Search, Hash, Clock, User, Package, FileCheck, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const eventIcons: Record<string, typeof Package> = {
  farmer_registration: User,
  warehouse_intake: Package,
  grading_completed: FileCheck,
  payment_processed: CheckCircle2,
  export_approved: Shield,
  dispute_raised: Shield,
  dispute_resolved: CheckCircle2,
};

const eventColors: Record<string, string> = {
  farmer_registration: 'bg-primary/10 text-primary',
  warehouse_intake: 'bg-secondary/10 text-secondary',
  grading_completed: 'bg-success/10 text-success',
  payment_processed: 'bg-accent/10 text-accent-foreground',
  export_approved: 'bg-primary/10 text-primary',
  dispute_raised: 'bg-destructive/10 text-destructive',
  dispute_resolved: 'bg-success/10 text-success',
};

export default function BlockchainLedgerPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: ledgerEntries, isLoading } = useQuery({
    queryKey: ['traceability-ledger'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('traceability_ledger')
        .select('*')
        .order('block_number', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const filteredEntries = ledgerEntries?.filter((e: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.event_type?.toLowerCase().includes(q) ||
      e.record_hash?.toLowerCase().includes(q) ||
      JSON.stringify(e.event_data)?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: ledgerEntries?.length || 0,
    events: [...new Set(ledgerEntries?.map((e: any) => e.event_type))].length,
    latestBlock: ledgerEntries?.[0]?.block_number || 0,
    verified: ledgerEntries?.filter((e: any) => e.previous_hash).length || 0,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            Blockchain Traceability Ledger
          </h1>
          <p className="text-muted-foreground">Tamper-proof hash-chain record of all batch lifecycle events</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Blocks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-secondary">{stats.events}</p>
              <p className="text-sm text-muted-foreground">Event Types</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">#{stats.latestBlock}</p>
              <p className="text-sm text-muted-foreground">Latest Block</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-success">{stats.verified}</p>
              <p className="text-sm text-muted-foreground">Chain-Linked</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ledger">
          <TabsList>
            <TabsTrigger value="ledger">Ledger View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <CardTitle>Immutable Ledger</CardTitle>
                  <div className="flex-1 max-w-sm">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by hash, event type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Block #</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Hash</TableHead>
                      <TableHead>Previous Hash</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : filteredEntries?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No ledger entries</TableCell></TableRow>
                    ) : filteredEntries?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm">#{entry.block_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={eventColors[entry.event_type] || ''}>
                            {entry.event_type?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">{entry.record_hash}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">{entry.previous_hash || '—genesis—'}</TableCell>
                        <TableCell className="text-sm">{format(new Date(entry.created_at), 'MMM d, HH:mm:ss')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {JSON.stringify(entry.event_data).slice(0, 80)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-0">
                  {filteredEntries?.map((entry: any, i: number) => {
                    const Icon = eventIcons[entry.event_type] || Hash;
                    return (
                      <div key={entry.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${eventColors[entry.event_type] || 'bg-muted'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          {i < (filteredEntries?.length || 0) - 1 && <div className="w-px flex-1 bg-border my-1" />}
                        </div>
                        <div className="pb-6 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{entry.event_type?.replace(/_/g, ' ')}</span>
                            <Badge variant="secondary" className="text-xs font-mono">#{entry.block_number}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(entry.created_at), 'PPpp')}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 font-mono">
                            Hash: {entry.record_hash?.slice(0, 16)}...
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {(!filteredEntries || filteredEntries.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No ledger entries yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
