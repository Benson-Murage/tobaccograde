import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  Package,
  Filter,
  QrCode,
  Calendar,
  User,
  Scale,
  Clock,
  ChevronDown,
} from "lucide-react";

interface Bale {
  id: string;
  code: string;
  farmer: string;
  farmerId: string;
  weight: number;
  grade: string | null;
  gradeClass: "premium" | "good" | "standard" | "low" | "rejected" | null;
  status: "pending" | "graded" | "disputed" | "paid";
  deliveryDate: string;
  warehouse: string;
  batchId: string | null;
}

const bales: Bale[] = [
  {
    id: "1",
    code: "BL-2024-00848",
    farmer: "Peter Nyambi",
    farmerId: "FRM-001234",
    weight: 42.5,
    grade: null,
    gradeClass: null,
    status: "pending",
    deliveryDate: "2024-01-12",
    warehouse: "Warehouse A",
    batchId: null,
  },
  {
    id: "2",
    code: "BL-2024-00847",
    farmer: "Peter Nyambi",
    farmerId: "FRM-001234",
    weight: 38.2,
    grade: "L1F",
    gradeClass: "premium",
    status: "graded",
    deliveryDate: "2024-01-12",
    warehouse: "Warehouse A",
    batchId: "BATCH-001",
  },
  {
    id: "3",
    code: "BL-2024-00846",
    farmer: "Sarah Tembo",
    farmerId: "FRM-001235",
    weight: 45.0,
    grade: "L3F",
    gradeClass: "good",
    status: "graded",
    deliveryDate: "2024-01-12",
    warehouse: "Warehouse B",
    batchId: "BATCH-002",
  },
  {
    id: "4",
    code: "BL-2024-00845",
    farmer: "John Phiri",
    farmerId: "FRM-001236",
    weight: 36.8,
    grade: "C2F",
    gradeClass: "standard",
    status: "disputed",
    deliveryDate: "2024-01-11",
    warehouse: "Warehouse A",
    batchId: "BATCH-001",
  },
  {
    id: "5",
    code: "BL-2024-00844",
    farmer: "Grace Mwanza",
    farmerId: "FRM-001237",
    weight: 41.2,
    grade: "L2F",
    gradeClass: "good",
    status: "paid",
    deliveryDate: "2024-01-11",
    warehouse: "Warehouse B",
    batchId: "BATCH-002",
  },
];

const statusStyles = {
  pending: "bg-muted text-muted-foreground",
  graded: "bg-primary/10 text-primary",
  disputed: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
};

const gradeClassStyles = {
  premium: "grade-premium",
  good: "grade-good",
  standard: "grade-standard",
  low: "grade-low",
  rejected: "grade-rejected",
};

export default function BalesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredBales = bales.filter((bale) => {
    const matchesSearch =
      bale.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bale.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bale.farmerId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || bale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <Button variant="outline">
              <QrCode className="h-4 w-4 mr-2" />
              Scan
            </Button>
            <Button variant="enterprise">
              <Package className="h-4 w-4 mr-2" />
              Register Bale
            </Button>
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
                <option value="pending">Pending</option>
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
            <p className="text-2xl font-bold text-foreground">847</p>
            <p className="text-sm text-muted-foreground">Total Today</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">342</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-primary">493</p>
            <p className="text-sm text-muted-foreground">Graded</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-warning">12</p>
            <p className="text-sm text-muted-foreground">Disputed</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">245</p>
            <p className="text-sm text-muted-foreground">Paid</p>
          </div>
        </div>

        {/* Bales Table */}
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
                    Delivery
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
                        <span className="font-mono text-sm font-medium">{bale.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{bale.farmer}</p>
                        <p className="text-xs text-muted-foreground font-mono">{bale.farmerId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{bale.weight} kg</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {bale.grade ? (
                        <span className={cn("grade-badge", gradeClassStyles[bale.gradeClass!])}>
                          {bale.grade}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                          statusStyles[bale.status]
                        )}
                      >
                        {bale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {bale.deliveryDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">{bale.warehouse}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
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
      </div>
    </AppLayout>
  );
}
