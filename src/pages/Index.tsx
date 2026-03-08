import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { GradeDistributionChart } from "@/components/dashboard/GradeDistributionChart";
import { RecentGradingsTable } from "@/components/dashboard/RecentGradingsTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { 
  Package, 
  ClipboardCheck, 
  DollarSign, 
  Users,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";

export default function Index() {
  const { stats, recentGradings, isLoading } = useDashboardStats();

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of today's grading operations.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <KPICard
            title="Total Bales Today"
            value={isLoading ? "..." : stats.totalBalesToday.toLocaleString()}
            subtitle={`${stats.pendingGrading} pending grading`}
            trend={{ value: 12, label: "vs yesterday" }}
            icon={<Package className="h-6 w-6" />}
          />
          <KPICard
            title="Bales Graded"
            value={isLoading ? "..." : stats.balesGraded.toLocaleString()}
            subtitle={`${stats.completionRate}% completion rate`}
            trend={{ value: 8, label: "vs yesterday" }}
            icon={<ClipboardCheck className="h-6 w-6" />}
          />
          <KPICard
            title="Total Value"
            value={isLoading ? "..." : `$${stats.totalValue.toLocaleString()}`}
            subtitle={stats.avgValuePerBale > 0 ? `Avg. $${stats.avgValuePerBale}/bale` : "Calculated on grading"}
            trend={{ value: 15, label: "vs last week" }}
            icon={<DollarSign className="h-6 w-6" />}
          />
          <KPICard
            title="Active Farmers"
            value={isLoading ? "..." : stats.activeFarmers.toLocaleString()}
            subtitle={`${stats.deliveriesToday} deliveries today`}
            trend={{ value: 5, label: "new this week" }}
            icon={<Users className="h-6 w-6" />}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-elevated p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pendingDisputes}</p>
              <p className="text-sm text-muted-foreground">Pending Disputes</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.averageGrade}</p>
              <p className="text-sm text-muted-foreground">Average Grade</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.gradingAccuracy}%</p>
              <p className="text-sm text-muted-foreground">Grading Accuracy</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <GradeDistributionChart />
          </div>
          <div className="lg:col-span-2">
            <QuickActions />
          </div>
        </div>

        {/* Recent Gradings Table */}
        <RecentGradingsTable gradings={recentGradings} />
      </div>
    </AppLayout>
  );
}
