import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  UserPlus,
  Filter,
  MoreVertical,
  MapPin,
  Package,
  Phone,
  FileText,
  ChevronRight,
} from "lucide-react";

interface Farmer {
  id: string;
  name: string;
  nationalId: string;
  contractNumber: string;
  phone: string;
  location: string;
  totalBales: number;
  seasonDeliveries: number;
  status: "active" | "inactive" | "pending";
}

const farmers: Farmer[] = [
  {
    id: "FRM-001234",
    name: "Peter Nyambi",
    nationalId: "12-345678-X-12",
    contractNumber: "CON-2024-0001",
    phone: "+263 77 123 4567",
    location: "Mashonaland East, Zimbabwe",
    totalBales: 245,
    seasonDeliveries: 12,
    status: "active",
  },
  {
    id: "FRM-001235",
    name: "Sarah Tembo",
    nationalId: "12-345679-X-12",
    contractNumber: "CON-2024-0002",
    phone: "+263 77 234 5678",
    location: "Manicaland, Zimbabwe",
    totalBales: 189,
    seasonDeliveries: 8,
    status: "active",
  },
  {
    id: "FRM-001236",
    name: "John Phiri",
    nationalId: "12-345680-X-12",
    contractNumber: "CON-2024-0003",
    phone: "+263 77 345 6789",
    location: "Mashonaland Central, Zimbabwe",
    totalBales: 312,
    seasonDeliveries: 15,
    status: "active",
  },
  {
    id: "FRM-001237",
    name: "Grace Mwanza",
    nationalId: "12-345681-X-12",
    contractNumber: "CON-2024-0004",
    phone: "+263 77 456 7890",
    location: "Mashonaland West, Zimbabwe",
    totalBales: 98,
    seasonDeliveries: 5,
    status: "pending",
  },
  {
    id: "FRM-001238",
    name: "David Lungu",
    nationalId: "12-345682-X-12",
    contractNumber: "CON-2024-0005",
    phone: "+263 77 567 8901",
    location: "Midlands, Zimbabwe",
    totalBales: 156,
    seasonDeliveries: 0,
    status: "inactive",
  },
];

const statusStyles = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning",
};

export default function FarmersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Farmer Management</h1>
            <p className="text-muted-foreground">
              Manage farmer registrations and contracts
            </p>
          </div>
          <Button variant="enterprise">
            <UserPlus className="h-4 w-4 mr-2" />
            Register Farmer
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="card-elevated p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or contract number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-11"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-foreground">1,247</p>
            <p className="text-sm text-muted-foreground">Total Farmers</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">1,089</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-warning">45</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">113</p>
            <p className="text-sm text-muted-foreground">Inactive</p>
          </div>
        </div>

        {/* Farmers List */}
        <div className="space-y-3">
          {filteredFarmers.map((farmer) => (
            <div
              key={farmer.id}
              className="card-elevated p-4 hover:shadow-card-hover transition-shadow cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar & Basic Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg shrink-0">
                    {farmer.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {farmer.name}
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                          statusStyles[farmer.status]
                        )}
                      >
                        {farmer.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="font-mono">{farmer.id}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {farmer.contractNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {farmer.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {farmer.location}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{farmer.totalBales}</p>
                    <p className="text-xs text-muted-foreground">Total Bales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{farmer.seasonDeliveries}</p>
                    <p className="text-xs text-muted-foreground">This Season</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredFarmers.length} of {farmers.length} farmers
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
