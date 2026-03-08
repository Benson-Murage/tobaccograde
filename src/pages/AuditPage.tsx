import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatAuditAction, formatEntityType } from "@/lib/audit-logger";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  Shield,
  Filter,
  Download,
  Clock,
  User,
  Monitor,
  CheckCircle,
  AlertTriangle,
  Edit,
  Eye,
  Trash2,
  LogIn,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  created_at: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  device_id: string | null;
  device_fingerprint: string | null;
  user_agent: string | null;
  session_id: string | null;
  // joined
  user_name?: string;
}

const actionTypeIcons: Record<string, React.ReactNode> = {
  LOGIN: <LogIn className="h-4 w-4" />,
  LOGOUT: <LogIn className="h-4 w-4" />,
  CREATE: <CheckCircle className="h-4 w-4" />,
  INSERT: <CheckCircle className="h-4 w-4" />,
  UPDATE: <Edit className="h-4 w-4" />,
  DELETE: <Trash2 className="h-4 w-4" />,
  VIEW: <Eye className="h-4 w-4" />,
  GRADE: <Shield className="h-4 w-4" />,
  APPROVE: <CheckCircle className="h-4 w-4" />,
  REJECT: <AlertTriangle className="h-4 w-4" />,
  DISPUTE_OPEN: <AlertTriangle className="h-4 w-4" />,
  DISPUTE_RESOLVE: <CheckCircle className="h-4 w-4" />,
};

const actionTypeStyles: Record<string, string> = {
  LOGIN: "bg-secondary/50 text-secondary-foreground",
  LOGOUT: "bg-secondary/50 text-secondary-foreground",
  CREATE: "bg-success/10 text-success",
  INSERT: "bg-success/10 text-success",
  UPDATE: "bg-primary/10 text-primary",
  DELETE: "bg-destructive/10 text-destructive",
  VIEW: "bg-muted text-muted-foreground",
  GRADE: "bg-warning/10 text-warning",
  APPROVE: "bg-success/10 text-success",
  REJECT: "bg-destructive/10 text-destructive",
  DISPUTE_OPEN: "bg-warning/10 text-warning",
  DISPUTE_RESOLVE: "bg-success/10 text-success",
};

export default function AuditPage() {
  const { companyId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        toast.error('Failed to load audit logs');
        return;
      }

      setLogs((data || []) as AuditLog[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(
    (log) =>
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Device ID'].join(','),
      ...filteredLogs.map(log => [
        log.id, log.created_at, log.action, log.entity_type, log.entity_id || '', log.device_id || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit logs exported');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground">Immutable record of all system activities</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="enterprise" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="card-elevated p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Tamper-Proof Audit Trail</p>
              <p className="text-sm text-muted-foreground">
                All logs are append-only and cannot be modified or deleted.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="card-elevated p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by action, entity type, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-11"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Actions</option>
                <option value="GRADE">Grading</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="APPROVE">Approve</option>
                <option value="REJECT">Reject</option>
                <option value="DISPUTE_OPEN">Dispute Open</option>
                <option value="DISPUTE_RESOLVE">Dispute Resolve</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalCount}</p>
            <p className="text-sm text-muted-foreground">Total Logs</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              {logs.filter(l => l.action === 'GRADE').length}
            </p>
            <p className="text-sm text-muted-foreground">Grading Actions</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {logs.filter(l => l.action === 'UPDATE').length}
            </p>
            <p className="text-sm text-muted-foreground">Updates</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {logs.filter(l => l.action === 'LOGIN').length}
            </p>
            <p className="text-sm text-muted-foreground">Logins</p>
          </div>
        </div>

        {/* Audit Log List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No audit logs found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery || actionFilter !== 'all' ? 'Try adjusting your filters' : 'Logs will appear as actions are performed'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div key={log.id} className="card-elevated p-4 hover:shadow-card-hover transition-shadow">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        actionTypeStyles[log.action] || "bg-muted text-muted-foreground"
                      )}>
                        {actionTypeIcons[log.action] || <Edit className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {formatAuditAction(log.action as any) || log.action}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {formatEntityType(log.entity_type as any) || log.entity_type}
                          </span>
                        </div>
                        {log.entity_id && (
                          <p className="text-sm text-muted-foreground font-mono">
                            {log.entity_id.substring(0, 8)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDate(log.created_at)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pl-11">
                    {log.user_id && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {log.user_id.substring(0, 8)}...
                      </span>
                    )}
                    {log.device_id && (
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3.5 w-3.5" />
                        {log.device_id.substring(0, 16)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination info */}
        {filteredLogs.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {totalCount} logs
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
