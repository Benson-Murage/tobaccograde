import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit-logger";
import { toast } from "sonner";
import {
  BarChart3, Download, FileText, Calendar, TrendingUp, Users, Package, DollarSign, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
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
  { name: "Daily Grading Summary", description: "Complete breakdown of today's grading activities", icon: BarChart3, type: "grading_summary" },
  { name: "Farmer Payment Report", description: "Payment calculations for all graded bales", icon: DollarSign, type: "farmer_payment" },
  { name: "Grade Distribution Analysis", description: "Statistical analysis of grade distributions", icon: TrendingUp, type: "grade_distribution" },
  { name: "Grader Performance Report", description: "Individual grader metrics and accuracy", icon: Users, type: "grader_performance" },
  { name: "Seasonal Summary", description: "Season-to-date cumulative report", icon: Calendar, type: "seasonal_summary" },
  { name: "Dispute Resolution Log", description: "Complete audit trail of all disputes", icon: FileText, type: "dispute_log" },
];

export default function ReportsPage() {
  const { companyId } = useAuth();
  const [exporting, setExporting] = useState<string | null>(null);

  const buildCsvContent = async (type: string): Promise<string> => {
    if (type === 'grading_summary' || type === 'grade_distribution') {
      const query = supabase
        .from('gradings')
        .select('id, grade_code, grade_class, graded_at, moisture_percent, defect_percent, bales(bale_code, weight_kg, farmers(full_name))')
        .order('graded_at', { ascending: false })
        .limit(500);
      if (companyId) query.eq('company_id', companyId);
      const { data } = await query;
      let csv = 'Bale Code,Farmer,Grade,Grade Class,Moisture %,Defect %,Weight (kg),Graded At\n';
      (data || []).forEach((g: any) => {
        csv += `${g.bales?.bale_code || ''},${g.bales?.farmers?.full_name || ''},${g.grade_code},${g.grade_class || ''},${g.moisture_percent || ''},${g.defect_percent || ''},${g.bales?.weight_kg || ''},${g.graded_at}\n`;
      });
      return csv;
    } else if (type === 'farmer_payment') {
      const query = supabase
        .from('bales')
        .select('bale_code, weight_kg, status, farmers(full_name, farmer_code)')
        .order('registered_at', { ascending: false })
        .limit(500);
      if (companyId) query.eq('company_id', companyId);
      const { data } = await query;
      let csv = 'Farmer,Farmer Code,Bale Code,Weight (kg),Status\n';
      (data || []).forEach((b: any) => {
        csv += `${b.farmers?.full_name || ''},${b.farmers?.farmer_code || ''},${b.bale_code},${b.weight_kg},${b.status}\n`;
      });
      return csv;
    } else if (type === 'dispute_log') {
      const query = supabase
        .from('disputes')
        .select('id, reason, status, priority, raised_at, resolution_notes, new_grade_code')
        .order('raised_at', { ascending: false })
        .limit(500);
      if (companyId) query.eq('company_id', companyId);
      const { data } = await query;
      let csv = 'ID,Status,Priority,Reason,Resolution,New Grade,Raised At\n';
      (data || []).forEach((d: any) => {
        csv += `${d.id},${d.status},${d.priority || ''},${(d.reason || '').replace(/,/g, ';')},${(d.resolution_notes || '').replace(/,/g, ';')},${d.new_grade_code || ''},${d.raised_at}\n`;
      });
      return csv;
    } else if (type === 'grader_performance') {
      const query = supabase
        .from('grader_analytics')
        .select('grader_id, total_gradings, consistency_score, ai_accept_rate, ai_modify_rate, ai_reject_rate, risk_score, harshness_score, period_start, period_end')
        .order('total_gradings', { ascending: false })
        .limit(200);
      if (companyId) query.eq('company_id', companyId);
      const { data } = await query;
      let csv = 'Grader ID,Total Gradings,Consistency,AI Accept %,AI Modify %,AI Reject %,Risk Score,Harshness,Period Start,Period End\n';
      (data || []).forEach((g: any) => {
        csv += `${g.grader_id},${g.total_gradings},${g.consistency_score || ''},${g.ai_accept_rate || ''},${g.ai_modify_rate || ''},${g.ai_reject_rate || ''},${g.risk_score || ''},${g.harshness_score || ''},${g.period_start},${g.period_end}\n`;
      });
      return csv;
    } else if (type === 'seasonal_summary') {
      const query = supabase
        .from('bales')
        .select('bale_code, weight_kg, status, registered_at, farmers(full_name), warehouses:warehouse_id(name)')
        .order('registered_at', { ascending: false })
        .limit(500);
      if (companyId) query.eq('company_id', companyId);
      const { data } = await query;
      let csv = 'Bale Code,Farmer,Warehouse,Weight (kg),Status,Registered At\n';
      (data || []).forEach((b: any) => {
        csv += `${b.bale_code},${b.farmers?.full_name || ''},${b.warehouses?.name || ''},${b.weight_kg},${b.status},${b.registered_at}\n`;
      });
      return csv;
    }
    return '';
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportReport = useCallback(async (type: string, format: 'csv' | 'pdf') => {
    setExporting(`${type}-${format}`);
    try {
      const filename = `${type}-${new Date().toISOString().split('T')[0]}`;
      const csvContent = await buildCsvContent(type);

      if (!csvContent) {
        toast.error("No data available for this report");
        setExporting(null);
        return;
      }

      if (format === 'csv') {
        downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
      } else if (format === 'pdf') {
        // Generate a simple text-based PDF alternative (printable HTML)
        const rows = csvContent.split('\n').filter(Boolean);
        const headers = rows[0].split(',');
        let html = `<!DOCTYPE html><html><head><title>${filename}</title>
          <style>body{font-family:Arial,sans-serif;margin:40px;}h1{color:#1a3a2a;font-size:20px;}
          table{border-collapse:collapse;width:100%;margin-top:20px;}
          th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:11px;}
          th{background:#1a3a2a;color:white;}tr:nth-child(even){background:#f9f9f9;}
          .footer{margin-top:20px;font-size:10px;color:#888;}</style></head><body>
          <h1>LeafGrade - ${type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h1>
          <p>Generated: ${new Date().toLocaleString()}</p><table><thead><tr>`;
        headers.forEach(h => { html += `<th>${h}</th>`; });
        html += '</tr></thead><tbody>';
        rows.slice(1).forEach(row => {
          html += '<tr>';
          row.split(',').forEach(cell => { html += `<td>${cell}</td>`; });
          html += '</tr>';
        });
        html += '</tbody></table><p class="footer">LeafGrade Tobacco Grading Platform - Confidential</p></body></html>';

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      }

      await logAudit({
        action: 'EXPORT',
        entity_type: 'report',
        new_values: { report_type: type, format },
      });

      toast.success("Report exported", { description: `${filename}.${format}` });
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Export failed");
    } finally {
      setExporting(null);
    }
  }, [companyId]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate and export detailed operational reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Calendar className="h-4 w-4 mr-2" />Date Range</Button>
            <Button variant="enterprise" onClick={() => exportReport('grading_summary', 'csv')}>
              <Download className="h-4 w-4 mr-2" />Export All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Daily Grading Volume</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyGradingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="bales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Daily Value (USD)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyGradingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: "hsl(var(--success))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card-elevated overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Grader Performance</h3>
            <p className="text-sm text-muted-foreground mt-1">Today's grading metrics by individual</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Grader</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Bales Graded</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Accuracy</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Avg. Time (sec)</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {graderPerformance.map((grader) => (
                  <tr key={grader.name} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {grader.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-medium text-foreground">{grader.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-lg font-bold text-foreground">{grader.bales}</span></td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${grader.accuracy >= 98 ? 'text-success' : grader.accuracy >= 96 ? 'text-primary' : 'text-warning'}`}>
                        {grader.accuracy}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${grader.avgTime <= 2 ? 'text-success' : 'text-warning'}`}>{grader.avgTime}s</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${(grader.bales / 245) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Available Reports</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const Icon = report.icon;
              const isExportingCsv = exporting === `${report.type}-csv`;
              return (
                <div key={report.name} className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm">{report.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" disabled>
                      <FileText className="h-3.5 w-3.5 mr-1" />PDF
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1"
                      onClick={() => exportReport(report.type, 'csv')} disabled={!!exporting}>
                      {isExportingCsv ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                      CSV
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
