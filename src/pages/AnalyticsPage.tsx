/**
 * Warehouse Analytics Dashboard
 * 
 * Interactive charts for grading volume, grade distribution,
 * device usage, moisture trends, and farmer delivery patterns.
 */

import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BarChart3, TrendingUp, Droplets, Package, Users, Scale,
  AlertTriangle, RefreshCw, Loader2, Activity,
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--accent))',
];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

export default function AnalyticsPage() {
  const { companyId } = useAuth();
  const [period, setPeriod] = useState('7');
  const [isLoading, setIsLoading] = useState(true);
  const [gradingVolume, setGradingVolume] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [moistureTrends, setMoistureTrends] = useState<any[]>([]);
  const [farmerDeliveries, setFarmerDeliveries] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ totalGradings: 0, avgMoisture: 0, manualRate: 0, disputeRate: 0 });

  const fetchAnalytics = async () => {
    if (!companyId) {
      loadDemoData();
      return;
    }
    setIsLoading(true);
    try {
      const days = parseInt(period);
      const since = subDays(new Date(), days).toISOString();

      const [gradingsRes, balesRes, disputesRes] = await Promise.all([
        supabase.from('gradings').select('id, grade_code, grade_class, graded_at, moisture_percent, graded_offline, confidence_score')
          .eq('company_id', companyId).gte('graded_at', since),
        supabase.from('bales').select('id, farmer_id, weight_kg, registered_at, farmers(full_name)')
          .eq('company_id', companyId).gte('registered_at', since),
        supabase.from('disputes').select('id').eq('company_id', companyId).gte('created_at', since),
      ]);

      const gradings = gradingsRes.data || [];
      const bales = balesRes.data || [];
      const disputes = disputesRes.data || [];

      // KPIs
      const avgMoisture = gradings.length > 0
        ? gradings.reduce((s, g: any) => s + (g.moisture_percent || 0), 0) / gradings.length
        : 0;
      const manualCount = gradings.filter((g: any) => g.graded_offline).length;
      setKpis({
        totalGradings: gradings.length,
        avgMoisture: Math.round(avgMoisture * 10) / 10,
        manualRate: gradings.length > 0 ? Math.round((manualCount / gradings.length) * 100) : 0,
        disputeRate: gradings.length > 0 ? Math.round((disputes.length / gradings.length) * 100) : 0,
      });

      // Daily grading volume
      const dailyMap: Record<string, number> = {};
      for (let i = 0; i < days; i++) {
        dailyMap[format(subDays(new Date(), i), 'MMM dd')] = 0;
      }
      gradings.forEach((g: any) => {
        const day = format(new Date(g.graded_at), 'MMM dd');
        if (dailyMap[day] !== undefined) dailyMap[day]++;
      });
      setGradingVolume(Object.entries(dailyMap).reverse().map(([date, count]) => ({ date, count })));

      // Grade distribution
      const gradeMap: Record<string, number> = {};
      gradings.forEach((g: any) => {
        const cls = g.grade_class || 'standard';
        gradeMap[cls] = (gradeMap[cls] || 0) + 1;
      });
      const gradeColors: Record<string, string> = {
        premium: 'hsl(var(--success))', good: 'hsl(var(--primary))',
        standard: 'hsl(var(--warning))', low: 'hsl(var(--destructive))', rejected: 'hsl(var(--muted))',
      };
      setGradeDistribution(Object.entries(gradeMap).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1), value, color: gradeColors[name] || CHART_COLORS[0],
      })));

      // Moisture trends
      const moistureMap: Record<string, number[]> = {};
      gradings.forEach((g: any) => {
        if (g.moisture_percent) {
          const day = format(new Date(g.graded_at), 'MMM dd');
          if (!moistureMap[day]) moistureMap[day] = [];
          moistureMap[day].push(g.moisture_percent);
        }
      });
      setMoistureTrends(Object.entries(moistureMap).map(([date, vals]) => ({
        date,
        avg: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
        min: Math.min(...vals),
        max: Math.max(...vals),
      })));

      // Farmer deliveries
      const farmerMap: Record<string, { name: string; count: number; totalKg: number }> = {};
      bales.forEach((b: any) => {
        const name = b.farmers?.full_name || 'Unknown';
        if (!farmerMap[b.farmer_id]) farmerMap[b.farmer_id] = { name, count: 0, totalKg: 0 };
        farmerMap[b.farmer_id].count++;
        farmerMap[b.farmer_id].totalKg += Number(b.weight_kg) || 0;
      });
      setFarmerDeliveries(
        Object.values(farmerMap).sort((a, b) => b.count - a.count).slice(0, 10)
      );

    } catch (error) {
      console.error('Analytics error:', error);
      toast.error('Failed to load analytics');
      loadDemoData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoData = () => {
    const days = parseInt(period);
    setGradingVolume(Array.from({ length: days }, (_, i) => ({
      date: format(subDays(new Date(), days - 1 - i), 'MMM dd'),
      count: Math.floor(Math.random() * 80) + 30,
    })));
    setGradeDistribution([
      { name: 'Premium', value: 24, color: 'hsl(var(--success))' },
      { name: 'Good', value: 35, color: 'hsl(var(--primary))' },
      { name: 'Standard', value: 28, color: 'hsl(var(--warning))' },
      { name: 'Low', value: 10, color: 'hsl(var(--destructive))' },
      { name: 'Rejected', value: 3, color: 'hsl(var(--muted))' },
    ]);
    setMoistureTrends(Array.from({ length: days }, (_, i) => ({
      date: format(subDays(new Date(), days - 1 - i), 'MMM dd'),
      avg: 13 + Math.random() * 3,
      min: 10 + Math.random() * 2,
      max: 16 + Math.random() * 3,
    })));
    setFarmerDeliveries([
      { name: 'Peter Nyambi', count: 24, totalKg: 950 },
      { name: 'Sarah Tembo', count: 18, totalKg: 720 },
      { name: 'John Phiri', count: 15, totalKg: 620 },
      { name: 'Grace Mwanza', count: 12, totalKg: 480 },
      { name: 'David Lungu', count: 10, totalKg: 410 },
    ]);
    setKpis({ totalGradings: 505, avgMoisture: 14.2, manualRate: 8, disputeRate: 2 });
    setIsLoading(false);
  };

  useEffect(() => { fetchAnalytics(); }, [companyId, period]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Warehouse Analytics</h1>
            <p className="text-muted-foreground">Grading volume, quality trends, and operational insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Gradings', value: kpis.totalGradings, icon: <Package className="h-5 w-5" />, color: 'bg-primary/10 text-primary' },
            { label: 'Avg Moisture %', value: `${kpis.avgMoisture}%`, icon: <Droplets className="h-5 w-5" />, color: 'bg-success/10 text-success' },
            { label: 'Manual Fallback', value: `${kpis.manualRate}%`, icon: <Scale className="h-5 w-5" />, color: 'bg-warning/10 text-warning' },
            { label: 'Dispute Rate', value: `${kpis.disputeRate}%`, icon: <AlertTriangle className="h-5 w-5" />, color: 'bg-destructive/10 text-destructive' },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${k.color}`}>{k.icon}</div>
                  <div>
                    <p className="text-2xl font-bold">{k.value}</p>
                    <p className="text-sm text-muted-foreground">{k.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grading Volume */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Daily Grading Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradingVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gradeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                      {gradeDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} bales`, 'Count']} />
                    <Legend formatter={(v) => <span className="text-sm text-muted-foreground">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Moisture Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-primary" />Moisture Trends</CardTitle>
              <CardDescription>Average, min, and max moisture readings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moistureTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[8, 22]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="max" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.1)" />
                    <Area type="monotone" dataKey="avg" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                    <Area type="monotone" dataKey="min" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.1)" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Farmer Deliveries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Top Farmer Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={farmerDeliveries} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [name === 'count' ? `${v} bales` : `${v} kg`, name === 'count' ? 'Deliveries' : 'Weight']} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
