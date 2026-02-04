import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useFarmers } from "@/hooks/useFarmers";
import { FarmerRegistrationDialog } from "@/components/farmers/FarmerRegistrationDialog";
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
  Loader2,
  RefreshCw,
} from "lucide-react";

const statusStyles = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning",
};

export default function FarmersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { farmers, isLoading, stats, addFarmer, searchFarmers, refetch } = useFarmers();

  const filteredFarmers = searchQuery ? searchFarmers(searchQuery) : farmers;

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
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="enterprise" onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Register Farmer
            </Button>
          </div>
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
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Farmers</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.active}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-warning">0</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
            <p className="text-sm text-muted-foreground">Inactive</p>
          </div>
        </div>

        {/* Farmers List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No farmers found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery ? "Try a different search term" : "Register your first farmer to get started"}
            </p>
            {!searchQuery && (
              <Button variant="enterprise" className="mt-4" onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Register Farmer
              </Button>
            )}
          </div>
        ) : (
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
                      {farmer.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {farmer.full_name}
                        </h3>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            statusStyles[farmer.is_active ? 'active' : 'inactive']
                          )}
                        >
                          {farmer.is_active ? 'active' : 'inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="font-mono">{farmer.farmer_code}</span>
                        {farmer.contract_number && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              {farmer.contract_number}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact & Location */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {farmer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {farmer.phone}
                      </span>
                    )}
                    {farmer.farm_location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {farmer.farm_location}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredFarmers.length > 0 && (
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
        )}
      </div>

      {/* Registration Dialog */}
      <FarmerRegistrationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={addFarmer}
      />
    </AppLayout>
  );
}
