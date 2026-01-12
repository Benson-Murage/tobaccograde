import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  Package,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

const dailyGradingData = [
  { date: "Jan 6", bales: 720, value: 98400 },
  { date: "Jan 7", bales: 680, value: 89200 },
  { date: "Jan 8", bales: 890, value: 118500 },
  { date: "Jan 9", bales: 756, value: 102300 },
  { date: "Jan 10", bales: 845, value: 125600 },
  { date: "Jan 11", bales: 920, value: 134200 },
  { date: "Jan 12", bales: 847, value: 128450 },
];

const graderPerformance = [
  { name: "James Mwale", bales: 245, accuracy: 98.2, avgTime: 1.8 },
  { name: "Mary Banda", bales: 198, accuracy: 97.5, avgTime: 2.1 },
  { name: "Peter Lungu", bales: 156, accuracy: 99.1, avgTime: 1.9 },
  { name: "Grace Tembo", bales: 134, accuracy: 96.8, avgTime: 2.3 },
];

const reports = [
  {
    name: "Daily Grading Summary",
    description: "Complete breakdown of today's grading activities",
    icon: BarChart3,
    lastGenerated: "5 min ago",
  },
  {
    name: "Farmer Payment Report",
    description: "Payment calculations for all graded bales",
    icon: DollarSign,
    lastGenerated: "1 hour ago",
  },
  {
    name: "Grade Distribution Analysis",
    description: "Statistical analysis of grade distributions",
    icon: TrendingUp,
    lastGenerated: "2 hours ago",
  },
  {
    name: "Grader Performance Report",
    description: "Individual grader metrics and accuracy",
    icon: Users,
    lastGenerated: "Today 6:00 AM",
  },
  {
    name: "Seasonal Summary",
    description: "Season-to-date cumulative report",
    icon: Calendar,
    lastGenerated: "Yesterday",
  },
  {
    name: "Dispute Resolution Log",
    description: "Complete audit trail of all disputes",
    icon: FileText,
    lastGenerated: "Real-time",
  },
];

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Generate and export detailed operational reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
            <Button variant="enterprise">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Grading Trend */}
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Daily Grading Volume</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyGradingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="bales" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Value Trend */}
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Daily Value (USD)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyGradingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--success))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Grader Performance */}
        <div className="card-elevated overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Grader Performance</h3>
            <p className="text-sm text-muted-foreground mt-1">Today's grading metrics by individual</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Grader
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Bales Graded
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Accuracy
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Avg. Time (sec)
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {graderPerformance.map((grader, index) => (
                  <tr key={grader.name} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {grader.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-medium text-foreground">{grader.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-foreground">{grader.bales}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${grader.accuracy >= 98 ? 'text-success' : grader.accuracy >= 96 ? 'text-primary' : 'text-warning'}`}>
                        {grader.accuracy}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${grader.avgTime <= 2 ? 'text-success' : 'text-warning'}`}>
                        {grader.avgTime}s
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${(grader.bales / 245) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Available Reports */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Available Reports</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <div
                  key={report.name}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm">{report.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last: {report.lastGenerated}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Excel
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
