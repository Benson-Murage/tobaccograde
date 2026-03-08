/**
 * Grader Performance Intelligence
 * 
 * Analytics for evaluating grader consistency, AI agreement,
 * bias detection, and dispute patterns.
 */

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Shield, RefreshCw, Loader2, BarChart3, Brain, Pencil,
} from 'lucide-react';

interface GraderProfile {
  id: string;
  name: string;
  totalGradings: number;
  aiAcceptRate: number;
  aiModifyRate: number;
  aiRejectRate: number;
  consistencyScore: number;
  harshnessScore: number;
  riskScore: number;
  requiresReview: boolean;
  deviationTrend: string;
  gradeDistribution: Record<string, number>;
}

export default function GraderPerformancePage() {
  const { companyId } = useAuth();
  const [graders, setGraders] = useState<GraderProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrader, setSelectedGrader] = useState<GraderProfile | null>(null);

  const fetchGraderPerformance = async () => {
    if (!companyId) {
      setGraders(getDemoGraders());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('grader_analytics')
        .select(`
          grader_id, total_gradings, ai_accept_rate, ai_modify_rate, ai_reject_rate,
          consistency_score, harshness_score, risk_score, requires_review,
          deviation_trend, grade_distribution,
          profiles:grader_id ( full_name )
        `)
        .eq('company_id', companyId)
        .order('risk_score', { ascending: false })
        .limit(30);

      if (error) throw error;

      const transformed: GraderProfile[] = (data || []).map((g: any) => ({
        id: g.grader_id,
        name: g.profiles?.full_name || 'Unknown',
        totalGradings: g.total_gradings || 0,
        aiAcceptRate: Number(g.ai_accept_rate) || 0,
        aiModifyRate: Number(g.ai_modify_rate) || 0,
        aiRejectRate: Number(g.ai_reject_rate) || 0,
        consistencyScore: Number(g.consistency_score) || 0,
        harshnessScore: Number(g.harshness_score) || 50,
        riskScore: Number(g.risk_score) || 0,
        requiresReview: g.requires_review || false,
        deviationTrend: g.deviation_trend || 'stable',
        gradeDistribution: (g.grade_distribution as Record<string, number>) || {},
      }));

      setGraders(transformed.length > 0 ? transformed : getDemoGraders());
    } catch (error) {
      console.error('Grader analytics error:', error);
      setGraders(getDemoGraders());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchGraderPerformance(); }, [companyId]);

  const getBiasLabel = (score: number) => {
    if (score < 35) return { label: 'Lenient', color: 'text-success' };
    if (score < 65) return { label: 'Balanced', color: 'text-primary' };
    return { label: 'Strict', color: 'text-destructive' };
  };

  const getRiskBadge = (score: number) => {
    if (score < 25) return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Low Risk</Badge>;
    if (score < 50) return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Medium</Badge>;
    return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">High Risk</Badge>;
  };

  const selected = selectedGrader || graders[0];
  const radarData = selected ? [
    { metric: 'Consistency', value: selected.consistencyScore },
    { metric: 'AI Agreement', value: selected.aiAcceptRate },
    { metric: 'Volume', value: Math.min(100, (selected.totalGradings / 100) * 100) },
    { metric: 'Low Risk', value: 100 - selected.riskScore },
    { metric: 'Balance', value: 100 - Math.abs(selected.harshnessScore - 50) * 2 },
  ] : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Grader Performance</h1>
            <p className="text-muted-foreground">Monitor grader consistency, bias detection, and AI agreement</p>
          </div>
          <Button variant="outline" onClick={fetchGraderPerformance} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grader List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Graders</CardTitle>
                <CardDescription>{graders.length} graders tracked</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-border/50">
                    {graders.map((g) => {
                      const bias = getBiasLabel(g.harshnessScore);
                      return (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGrader(g)}
                          className={cn(
                            'w-full text-left p-4 hover:bg-muted/50 transition-colors',
                            selected?.id === g.id && 'bg-primary/5 border-l-2 border-primary'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{g.name}</span>
                            {g.requiresReview && <AlertTriangle className="h-4 w-4 text-warning" />}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{g.totalGradings} gradings</span>
                            <span>•</span>
                            <span className={bias.color}>{bias.label}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            {getRiskBadge(g.riskScore)}
                            <span className="text-xs text-muted-foreground">
                              {Math.round(g.consistencyScore)}% consistent
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Grader Detail */}
            <div className="lg:col-span-2 space-y-6">
              {selected && (
                <>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold">{selected.totalGradings}</p>
                        <p className="text-xs text-muted-foreground">Total Gradings</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-success">{Math.round(selected.aiAcceptRate)}%</p>
                        <p className="text-xs text-muted-foreground">AI Accept Rate</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-primary">{Math.round(selected.consistencyScore)}%</p>
                        <p className="text-xs text-muted-foreground">Consistency</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className={cn("text-2xl font-bold", getBiasLabel(selected.harshnessScore).color)}>
                          {getBiasLabel(selected.harshnessScore).label}
                        </p>
                        <p className="text-xs text-muted-foreground">Grading Bias</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Radar + AI Decisions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Performance Radar</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid stroke="hsl(var(--border))" />
                              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />AI Decision Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm flex items-center gap-1"><CheckCircle className="h-3 w-3 text-success" />Accepted</span>
                            <span className="text-sm font-medium">{Math.round(selected.aiAcceptRate)}%</span>
                          </div>
                          <Progress value={selected.aiAcceptRate} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm flex items-center gap-1"><Pencil className="h-3 w-3 text-warning" />Modified</span>
                            <span className="text-sm font-medium">{Math.round(selected.aiModifyRate)}%</span>
                          </div>
                          <Progress value={selected.aiModifyRate} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" />Rejected</span>
                            <span className="text-sm font-medium">{Math.round(selected.aiRejectRate)}%</span>
                          </div>
                          <Progress value={selected.aiRejectRate} className="h-2" />
                        </div>
                        <div className="pt-2 border-t border-border/50">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Deviation Trend</span>
                            <span className="flex items-center gap-1 font-medium">
                              {selected.deviationTrend === 'up' && <TrendingUp className="h-4 w-4 text-destructive" />}
                              {selected.deviationTrend === 'down' && <TrendingDown className="h-4 w-4 text-success" />}
                              {selected.deviationTrend === 'stable' && <span className="text-primary">Stable</span>}
                              {selected.deviationTrend}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function getDemoGraders(): GraderProfile[] {
  return [
    { id: '1', name: 'James Mwale', totalGradings: 312, aiAcceptRate: 78, aiModifyRate: 15, aiRejectRate: 7, consistencyScore: 92, harshnessScore: 55, riskScore: 12, requiresReview: false, deviationTrend: 'stable', gradeDistribution: { premium: 25, good: 40, standard: 25, low: 8, rejected: 2 } },
    { id: '2', name: 'Mary Banda', totalGradings: 287, aiAcceptRate: 62, aiModifyRate: 28, aiRejectRate: 10, consistencyScore: 78, harshnessScore: 72, riskScore: 35, requiresReview: true, deviationTrend: 'up', gradeDistribution: { premium: 15, good: 30, standard: 35, low: 15, rejected: 5 } },
    { id: '3', name: 'Robert Chirwa', totalGradings: 156, aiAcceptRate: 85, aiModifyRate: 10, aiRejectRate: 5, consistencyScore: 95, harshnessScore: 48, riskScore: 8, requiresReview: false, deviationTrend: 'down', gradeDistribution: { premium: 30, good: 35, standard: 25, low: 8, rejected: 2 } },
    { id: '4', name: 'Agnes Phiri', totalGradings: 98, aiAcceptRate: 55, aiModifyRate: 30, aiRejectRate: 15, consistencyScore: 65, harshnessScore: 28, riskScore: 55, requiresReview: true, deviationTrend: 'up', gradeDistribution: { premium: 40, good: 35, standard: 15, low: 8, rejected: 2 } },
  ];
}
