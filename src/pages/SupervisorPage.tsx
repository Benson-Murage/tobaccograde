/**
 * Supervisor Dashboard
 * 
 * Dashboard for supervisors to review and approve gradings,
 * monitor grader performance, and resolve conflicts.
 */

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { lockGrading } from '@/lib/grading-submission';
import { logAudit } from '@/lib/audit-logger';
import { ConflictList } from '@/components/sync/ConflictList';
import { getConflictCount } from '@/lib/conflict-resolution';
import { toast } from 'sonner';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Package,
  TrendingUp,
  TrendingDown,
  FileCheck,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  BarChart3,
  GitMerge,
  Pencil,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PendingGrading {
  id: string;
  bale_code: string;
  farmer_name: string;
  grade_code: string;
  grade_class: string;
  graded_at: string;
  grader_name: string;
  moisture_percent: number;
  defect_percent: number;
  confidence_score: number;
  has_manual_entries: boolean;
  risk_score: number;
}

interface GraderStats {
  grader_id: string;
  grader_name: string;
  total_gradings: number;
  avg_risk_score: number;
  manual_entry_rate: number;
  ai_accept_rate: number;
  deviation_trend: 'up' | 'down' | 'stable';
  requires_review: boolean;
}

export default function SupervisorPage() {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingGradings, setPendingGradings] = useState<PendingGrading[]>([]);
  const [graderStats, setGraderStats] = useState<GraderStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrading, setSelectedGrading] = useState<PendingGrading | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [conflictCount, setConflictCount] = useState(0);
  
  // Check supervisor role
  const isSupervisor = hasRole('quality_supervisor') || hasRole('company_admin');
  
  useEffect(() => {
    if (isSupervisor) {
      loadPendingGradings();
      loadGraderStats();
      setConflictCount(getConflictCount());
    }
  }, [isSupervisor]);
  
  const loadPendingGradings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gradings')
        .select(`
          id,
          grade_code,
          grade_class,
          graded_at,
          moisture_percent,
          defect_percent,
          confidence_score,
          bales (
            bale_code,
            farmers (
              full_name
            )
          ),
          profiles:grader_id (
            full_name
          )
        `)
        .eq('is_locked', false)
        .order('graded_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error loading pending gradings:', error);
        toast.error('Failed to load pending gradings');
        return;
      }
      
      const transformed: PendingGrading[] = (data || []).map((g: any) => ({
        id: g.id,
        bale_code: g.bales?.bale_code || 'Unknown',
        farmer_name: g.bales?.farmers?.full_name || 'Unknown',
        grade_code: g.grade_code,
        grade_class: g.grade_class || 'standard',
        graded_at: g.graded_at,
        grader_name: g.profiles?.full_name || 'Unknown',
        moisture_percent: g.moisture_percent,
        defect_percent: g.defect_percent,
        confidence_score: g.confidence_score || 90,
        has_manual_entries: g.confidence_score < 80,
        risk_score: g.confidence_score ? 100 - g.confidence_score : 20,
      }));
      
      setPendingGradings(transformed);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadGraderStats = async () => {
    try {
      const { data, error } = await supabase
        .from('grader_analytics')
        .select(`
          grader_id,
          total_gradings,
          risk_score,
          ai_accept_rate,
          deviation_trend,
          requires_review,
          profiles:grader_id (
            full_name
          )
        `)
        .order('risk_score', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error loading grader stats:', error);
        return;
      }
      
      const transformed: GraderStats[] = (data || []).map((s: any) => ({
        grader_id: s.grader_id,
        grader_name: s.profiles?.full_name || 'Unknown',
        total_gradings: s.total_gradings || 0,
        avg_risk_score: s.risk_score || 0,
        manual_entry_rate: 0, // Would need to calculate
        ai_accept_rate: s.ai_accept_rate || 0,
        deviation_trend: s.deviation_trend || 'stable',
        requires_review: s.requires_review || false,
      }));
      
      setGraderStats(transformed);
    } catch (error) {
      console.error('Error loading grader stats:', error);
    }
  };
  
  const handleApprove = async () => {
    if (!selectedGrading || !user) return;
    
    try {
      const result = await lockGrading(selectedGrading.id, user.id);
      
      if (result.success) {
        toast.success('Grading approved and locked');
        setPendingGradings(prev => prev.filter(g => g.id !== selectedGrading.id));
        setShowApproveDialog(false);
        setSelectedGrading(null);
      } else {
        toast.error('Failed to approve grading', { description: result.error });
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve grading');
    }
  };
  
  const handleReject = async () => {
    if (!selectedGrading || !user || !rejectionNotes.trim()) return;
    
    try {
      // Update grading with rejection
      const { error } = await supabase
        .from('gradings')
        .update({
          notes: `REJECTED: ${rejectionNotes}`,
          sync_status: 'failed',
        })
        .eq('id', selectedGrading.id);
      
      if (error) {
        toast.error('Failed to reject grading');
        return;
      }
      
      await logAudit({
        action: 'REJECT',
        entity_type: 'grading',
        entity_id: selectedGrading.id,
        new_values: {
          rejected_by: user.id,
          rejection_reason: rejectionNotes,
        },
      });
      
      toast.success('Grading rejected');
      setPendingGradings(prev => prev.filter(g => g.id !== selectedGrading.id));
      setShowRejectDialog(false);
      setSelectedGrading(null);
      setRejectionNotes('');
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject grading');
    }
  };
  
  const getRiskBadgeClass = (score: number) => {
    if (score < 20) return 'bg-success/10 text-success border-success/30';
    if (score < 50) return 'bg-warning/10 text-warning border-warning/30';
    return 'bg-destructive/10 text-destructive border-destructive/30';
  };
  
  const getGradeClass = (cls: string) => {
    const classes: Record<string, string> = {
      premium: 'bg-success text-success-foreground',
      good: 'bg-primary text-primary-foreground',
      standard: 'bg-secondary text-secondary-foreground',
      low: 'bg-warning text-warning-foreground',
      rejected: 'bg-destructive text-destructive-foreground',
    };
    return classes[cls] || classes.standard;
  };
  
  if (!isSupervisor) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You need Supervisor or Admin privileges to access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Supervisor Dashboard</h1>
            <p className="text-muted-foreground">
              Review gradings, approve manual entries, and monitor grader performance
            </p>
          </div>
          <Button variant="outline" onClick={loadPendingGradings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingGradings.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {pendingGradings.filter(g => g.risk_score > 50).length}
                  </p>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Pencil className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {pendingGradings.filter(g => g.has_manual_entries).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Manual Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <GitMerge className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{conflictCount}</p>
                  <p className="text-sm text-muted-foreground">Sync Conflicts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Pending
              {pendingGradings.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingGradings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="graders" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Graders
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="flex items-center gap-2">
              <GitMerge className="h-4 w-4" />
              Conflicts
              {conflictCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {conflictCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Pending Approvals Tab */}
          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Gradings</CardTitle>
                <CardDescription>
                  Review and approve gradings before they are locked
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Loading...
                  </div>
                ) : pendingGradings.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                    <p className="font-medium">All caught up!</p>
                    <p className="text-sm text-muted-foreground">
                      No gradings pending approval
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bale</TableHead>
                          <TableHead>Farmer</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Moisture</TableHead>
                          <TableHead>Risk</TableHead>
                          <TableHead>Grader</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingGradings.map((grading) => (
                          <TableRow key={grading.id}>
                            <TableCell className="font-mono font-medium">
                              <div className="flex items-center gap-2">
                                {grading.bale_code}
                                {grading.has_manual_entries && (
                                  <AlertTriangle className="h-4 w-4 text-warning" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{grading.farmer_name}</TableCell>
                            <TableCell>
                              <Badge className={getGradeClass(grading.grade_class)}>
                                {grading.grade_code}
                              </Badge>
                            </TableCell>
                            <TableCell>{grading.moisture_percent}%</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getRiskBadgeClass(grading.risk_score)}>
                                {grading.risk_score}
                              </Badge>
                            </TableCell>
                            <TableCell>{grading.grader_name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDistanceToNow(new Date(grading.graded_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedGrading(grading);
                                    setShowApproveDialog(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 text-success" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedGrading(grading);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Grader Performance Tab */}
          <TabsContent value="graders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Grader Performance</CardTitle>
                <CardDescription>
                  Monitor grader accuracy and identify potential issues
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {graderStats.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No grader analytics available
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grader</TableHead>
                        <TableHead>Total Gradings</TableHead>
                        <TableHead>Risk Score</TableHead>
                        <TableHead>AI Accept Rate</TableHead>
                        <TableHead>Trend</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {graderStats.map((stat) => (
                        <TableRow key={stat.grader_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              {stat.grader_name}
                            </div>
                          </TableCell>
                          <TableCell>{stat.total_gradings}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={100 - stat.avg_risk_score} 
                                className="w-16 h-2"
                              />
                              <span className="text-sm">{stat.avg_risk_score.toFixed(0)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{(stat.ai_accept_rate * 100).toFixed(0)}%</TableCell>
                          <TableCell>
                            {stat.deviation_trend === 'up' && (
                              <TrendingUp className="h-4 w-4 text-destructive" />
                            )}
                            {stat.deviation_trend === 'down' && (
                              <TrendingDown className="h-4 w-4 text-success" />
                            )}
                            {stat.deviation_trend === 'stable' && (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {stat.requires_review ? (
                              <Badge variant="destructive">Needs Review</Badge>
                            ) : (
                              <Badge variant="secondary">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conflicts Tab */}
          <TabsContent value="conflicts" className="mt-6">
            <ConflictList 
              onConflictResolved={() => setConflictCount(getConflictCount())} 
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Grading</DialogTitle>
            <DialogDescription>
              This will lock the grading record and prevent further modifications.
            </DialogDescription>
          </DialogHeader>
          {selectedGrading && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bale</p>
                  <p className="font-mono font-medium">{selectedGrading.bale_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Farmer</p>
                  <p className="font-medium">{selectedGrading.farmer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <Badge className={getGradeClass(selectedGrading.grade_class)}>
                    {selectedGrading.grade_code}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <Badge variant="outline" className={getRiskBadgeClass(selectedGrading.risk_score)}>
                    {selectedGrading.risk_score}
                  </Badge>
                </div>
              </div>
              {selectedGrading.has_manual_entries && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <p className="text-sm text-warning flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    This grading contains manual entries
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button variant="enterprise" onClick={handleApprove}>
              <Lock className="h-4 w-4 mr-2" />
              Approve & Lock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Grading</DialogTitle>
            <DialogDescription>
              The grading will be marked for re-evaluation. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          {selectedGrading && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bale</p>
                  <p className="font-mono font-medium">{selectedGrading.bale_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <Badge className={getGradeClass(selectedGrading.grade_class)}>
                    {selectedGrading.grade_code}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Rejection Reason *</p>
                <Textarea
                  placeholder="Explain why this grading is being rejected..."
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false);
              setRejectionNotes('');
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionNotes.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Grading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
