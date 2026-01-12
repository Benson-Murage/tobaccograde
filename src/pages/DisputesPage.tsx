import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

interface Dispute {
  id: string;
  baleCode: string;
  farmer: string;
  farmerId: string;
  originalGrade: string;
  requestedGrade: string;
  reason: string;
  status: "pending" | "under_review" | "resolved" | "rejected";
  priority: "low" | "medium" | "high";
  createdAt: string;
  assignedTo: string | null;
}

const disputes: Dispute[] = [
  {
    id: "DSP-001",
    baleCode: "BL-2024-00845",
    farmer: "John Phiri",
    farmerId: "FRM-001236",
    originalGrade: "C2F",
    requestedGrade: "L3F",
    reason: "Farmer disputes color assessment. Claims tobacco was lemon, not reddish.",
    status: "pending",
    priority: "high",
    createdAt: "2024-01-12 10:30",
    assignedTo: null,
  },
  {
    id: "DSP-002",
    baleCode: "BL-2024-00839",
    farmer: "Mary Banda",
    farmerId: "FRM-001240",
    originalGrade: "X1F",
    requestedGrade: "C3F",
    reason: "Moisture reading disputed. Farmer has independent test showing 15%.",
    status: "under_review",
    priority: "medium",
    createdAt: "2024-01-11 14:22",
    assignedTo: "Quality Supervisor",
  },
  {
    id: "DSP-003",
    baleCode: "BL-2024-00832",
    farmer: "Peter Nyambi",
    farmerId: "FRM-001234",
    originalGrade: "L4F",
    requestedGrade: "L2F",
    reason: "Claims defect assessment was incorrect. Requesting re-inspection.",
    status: "resolved",
    priority: "low",
    createdAt: "2024-01-10 09:15",
    assignedTo: "Quality Supervisor",
  },
  {
    id: "DSP-004",
    baleCode: "BL-2024-00828",
    farmer: "Grace Mwanza",
    farmerId: "FRM-001237",
    originalGrade: "REJ",
    requestedGrade: "X2F",
    reason: "Rejection disputed. Farmer claims mold was external contamination, not intrinsic.",
    status: "rejected",
    priority: "high",
    createdAt: "2024-01-09 16:45",
    assignedTo: "Quality Supervisor",
  },
];

const statusStyles = {
  pending: "bg-warning/10 text-warning",
  under_review: "bg-primary/10 text-primary",
  resolved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const priorityStyles = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary/50 text-secondary-foreground",
  high: "bg-destructive/10 text-destructive",
};

export default function DisputesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.baleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = disputes.filter((d) => d.status === "pending").length;
  const reviewCount = disputes.filter((d) => d.status === "under_review").length;

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
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">{pendingCount} pending disputes require attention</span>
            </div>
          )}
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
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-primary">{reviewCount}</p>
            <p className="text-sm text-muted-foreground">Under Review</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {disputes.filter((d) => d.status === "resolved").length}
            </p>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {disputes.filter((d) => d.status === "rejected").length}
            </p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </div>
        </div>

        {/* Disputes List */}
        <div className="space-y-3">
          {filteredDisputes.map((dispute) => (
            <div
              key={dispute.id}
              className="card-elevated p-4 hover:shadow-card-hover transition-shadow cursor-pointer group"
            >
              <div className="flex flex-col gap-4">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-foreground">
                          {dispute.id}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            statusStyles[dispute.status]
                          )}
                        >
                          {dispute.status.replace("_", " ")}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            priorityStyles[dispute.priority]
                          )}
                        >
                          {dispute.priority} priority
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          {dispute.baleCode}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {dispute.farmer}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {dispute.createdAt}
                  </div>
                </div>

                {/* Grade Change */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Original Grade</p>
                    <span className="grade-badge grade-standard">{dispute.originalGrade}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Requested Grade</p>
                    <span className="grade-badge grade-good">{dispute.requestedGrade}</span>
                  </div>
                </div>

                {/* Reason */}
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                </div>

                {/* Actions */}
                {dispute.status === "pending" && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button variant="outline" size="sm">
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button variant="enterprise" size="sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
