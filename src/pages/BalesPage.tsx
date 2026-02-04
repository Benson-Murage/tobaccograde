import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useBales } from "@/hooks/useBales";
import {
  Search,
  Package,
  Filter,
  QrCode,
  Calendar,
  User,
  Scale,
  Loader2,
  RefreshCw,
} from "lucide-react";

const statusStyles: Record<string, string> = {
  registered: "bg-muted text-muted-foreground",
  pending_grading: "bg-muted text-muted-foreground",
  graded: "bg-primary/10 text-primary",
  disputed: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  paid: "bg-success/10 text-success",
};

const gradeClassStyles: Record<string, string> = {
  premium: "grade-premium",
  good: "grade-good",
  standard: "grade-standard",
  low: "grade-low",
  rejected: "grade-rejected",
};

export default function BalesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { bales, isLoading, stats, searchBales, filterByStatus, refetch } = useBales();

  const getFilteredBales = () => {
    let result = bales;
    
    if (searchQuery) {
      result = searchBales(searchQuery);
    }
    
    if (statusFilter !== "all") {
      result = result.filter(b => b.status === statusFilter);
    }
    
    return result;
  };

  const filteredBales = getFilteredBales();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bales & Batches</h1>
            <p className="text-muted-foreground">
              Track and manage tobacco bale registration
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Link to="/scan">
              <Button variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                Scan
              </Button>
            </Link>
            <Link to="/bales/new">
              <Button variant="enterprise">
                <Package className="h-4 w-4 mr-2" />
                Register Bale
              </Button>
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="card-elevated p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by bale code, farmer name, or ID..."
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
                <option value="registered">Registered</option>
                <option value="pending_grading">Pending</option>
                <option value="graded">Graded</option>
                <option value="disputed">Disputed</option>
                <option value="paid">Paid</option>
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
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.pending + stats.registered}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.graded}</p>
            <p className="text-sm text-muted-foreground">Graded</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-warning">{stats.disputed}</p>
            <p className="text-sm text-muted-foreground">Disputed</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.paid}</p>
            <p className="text-sm text-muted-foreground">Paid</p>
          </div>
        </div>

        {/* Bales Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredBales.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No bales found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery || statusFilter !== 'all' 
                ? "Try adjusting your filters" 
                : "Register your first bale to get started"}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link to="/bales/new">
                <Button variant="enterprise" className="mt-4">
                  <Package className="h-4 w-4 mr-2" />
                  Register Bale
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Bale Code
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Farmer
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Weight
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Grade
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Registered
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Warehouse
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBales.map((bale) => (
                    <tr
                      key={bale.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium">{bale.bale_code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{bale.farmer_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground font-mono">{bale.farmer_code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Scale className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{bale.weight_kg} kg</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {bale.grade_code ? (
                          <span className={cn("grade-badge", gradeClassStyles[bale.grade_class || 'standard'])}>
                            {bale.grade_code}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                            statusStyles[bale.status] || statusStyles.registered
                          )}
                        >
                          {bale.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(bale.registered_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{bale.warehouse_name || 'Unknown'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {filteredBales.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredBales.length} of {bales.length} bales
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
