import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDisputes } from "@/hooks/useDisputes";
import { DisputeActionDialog } from "@/components/disputes/DisputeActionDialog";
import type { Dispute } from "@/hooks/useDisputes";
import {
  Search,
  AlertTriangle,
  Filter,
  MessageSquare,
  Clock,
  User,
  Package,
  CheckCircle,
  XCircle,
  ChevronRight,
  RefreshCw,
  Loader2,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusStyles: Record<string, string> = {
  open: "bg-warning/10 text-warning",
  under_review: "bg-primary/10 text-primary",
  resolved: "bg-success/10 text-success",
  escalated: "bg-destructive/10 text-destructive",
  closed: "bg-muted text-muted-foreground",
};

const priorityStyles: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary/50 text-secondary-foreground",
  high: "bg-destructive/10 text-destructive",
};

export default function DisputesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [actionType, setActionType] = useState<'review' | 'resolve' | 'reject'>('review');
  const [showActionDialog, setShowActionDialog] = useState(false);

  const { 
    disputes, 
    isLoading, 
    isProcessing,
    stats, 
    reviewDispute, 
    resolveDispute, 
    rejectDispute,
    refetch 
  } = useDisputes();

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.bale_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.farmer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (dispute: Dispute, action: 'review' | 'resolve' | 'reject') => {
    setSelectedDispute(dispute);
    setActionType(action);
    setShowActionDialog(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dispute Resolution</h1>
            <p className="text-muted-foreground">
              Review and resolve grading disputes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            {stats.open > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 text-warning">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">{stats.open} pending disputes require attention</span>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="card-elevated p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by dispute ID, bale code, or farmer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-11"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
                <option value="closed">Closed</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-warning">{stats.open}</p>
            <p className="text-sm text-muted-foreground">Open</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.underReview}</p>
            <p className="text-sm text-muted-foreground">Under Review</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.escalated}</p>
            <p className="text-sm text-muted-foreground">Escalated</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.resolved}</p>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.closed}</p>
            <p className="text-sm text-muted-foreground">Closed</p>
          </div>
        </div>

        {/* Disputes List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No disputes found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery || statusFilter !== 'all' 
                ? "Try adjusting your filters" 
                : "All disputes have been resolved!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDisputes.map((dispute) => (
              <div
                key={dispute.id}
                className="card-elevated p-4 hover:shadow-card-hover transition-shadow group"
              >
                <div className="flex flex-col gap-4">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-foreground">
                            {dispute.id}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                              statusStyles[dispute.status] || statusStyles.open
                            )}
                          >
                            {dispute.status.replace("_", " ")}
                          </span>
                          {dispute.priority && (
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                                priorityStyles[dispute.priority] || priorityStyles.medium
                              )}
                            >
                              {dispute.priority} priority
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          {dispute.bale_code && (
                            <span className="flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              {dispute.bale_code}
                            </span>
                          )}
                          {dispute.farmer_name && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {dispute.farmer_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDate(dispute.raised_at)}
                    </div>
                  </div>

                  {/* Grade Change */}
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Original Grade</p>
                      <span className="grade-badge grade-standard">{dispute.original_grade || '—'}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Requested Grade</p>
                      <span className="grade-badge grade-good">{dispute.new_grade_code || '—'}</span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                  </div>

                  {/* Resolution notes if resolved */}
                  {dispute.resolution_notes && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground">{dispute.resolution_notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {(dispute.status === 'open' || dispute.status === 'under_review' || dispute.status === 'escalated') && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                      {dispute.status === 'open' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAction(dispute, 'review')}
                          disabled={isProcessing}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAction(dispute, 'reject')}
                        disabled={isProcessing}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        variant="enterprise" 
                        size="sm"
                        onClick={() => handleAction(dispute, 'resolve')}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <DisputeActionDialog
        open={showActionDialog}
        onOpenChange={setShowActionDialog}
        dispute={selectedDispute}
        action={actionType}
        onReview={reviewDispute}
        onResolve={resolveDispute}
        onReject={rejectDispute}
      />
    </AppLayout>
  );
}
