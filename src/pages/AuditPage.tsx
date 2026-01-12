import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  Shield,
  Filter,
  Download,
  Clock,
  User,
  Monitor,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Edit,
  Eye,
  Trash2,
  LogIn,
} from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  action: string;
  actionType: "create" | "update" | "delete" | "view" | "login" | "grade";
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  deviceId: string;
  location: string;
}

const auditLogs: AuditLog[] = [
  {
    id: "AUD-001",
    timestamp: "2024-01-12 14:32:15",
    user: "James Mwale",
    userId: "USR-002",
    action: "Graded bale",
    actionType: "grade",
    resource: "Bale",
    resourceId: "BL-2024-00847",
    details: "Assigned grade L1F to bale. Weight: 42.5kg, Moisture: 14%",
    ipAddress: "192.168.1.45",
    deviceId: "DEV-TABLET-003",
    location: "Warehouse A, Bay 3",
  },
  {
    id: "AUD-002",
    timestamp: "2024-01-12 14:28:42",
    user: "John Mukasa",
    userId: "USR-001",
    action: "Updated pricing",
    actionType: "update",
    resource: "Price Matrix",
    resourceId: "PRICE-2024",
    details: "Changed L1F price from $8.20 to $8.50 per kg",
    ipAddress: "192.168.1.10",
    deviceId: "DEV-DESKTOP-001",
    location: "Admin Office",
  },
  {
    id: "AUD-003",
    timestamp: "2024-01-12 14:15:33",
    user: "Mary Banda",
    userId: "USR-003",
    action: "Graded bale",
    actionType: "grade",
    resource: "Bale",
    resourceId: "BL-2024-00846",
    details: "Assigned grade L3F to bale. Weight: 38.2kg, Moisture: 16%",
    ipAddress: "192.168.1.46",
    deviceId: "DEV-TABLET-004",
    location: "Warehouse B, Bay 1",
  },
  {
    id: "AUD-004",
    timestamp: "2024-01-12 14:02:18",
    user: "Sarah Tembo",
    userId: "USR-004",
    action: "Resolved dispute",
    actionType: "update",
    resource: "Dispute",
    resourceId: "DSP-003",
    details: "Dispute rejected. Original grade L4F maintained after re-inspection.",
    ipAddress: "192.168.1.20",
    deviceId: "DEV-DESKTOP-002",
    location: "Quality Office",
  },
  {
    id: "AUD-005",
    timestamp: "2024-01-12 13:45:00",
    user: "James Mwale",
    userId: "USR-002",
    action: "Logged in",
    actionType: "login",
    resource: "Session",
    resourceId: "SES-20240112-003",
    details: "Successful login from registered device",
    ipAddress: "192.168.1.45",
    deviceId: "DEV-TABLET-003",
    location: "Warehouse A",
  },
  {
    id: "AUD-006",
    timestamp: "2024-01-12 13:30:22",
    user: "John Mukasa",
    userId: "USR-001",
    action: "Created farmer",
    actionType: "create",
    resource: "Farmer",
    resourceId: "FRM-001250",
    details: "Registered new farmer: Grace Phiri, Contract: CON-2024-0050",
    ipAddress: "192.168.1.10",
    deviceId: "DEV-DESKTOP-001",
    location: "Admin Office",
  },
];

const actionTypeIcons = {
  create: <CheckCircle className="h-4 w-4" />,
  update: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  view: <Eye className="h-4 w-4" />,
  login: <LogIn className="h-4 w-4" />,
  grade: <Shield className="h-4 w-4" />,
};

const actionTypeStyles = {
  create: "bg-success/10 text-success",
  update: "bg-primary/10 text-primary",
  delete: "bg-destructive/10 text-destructive",
  view: "bg-muted text-muted-foreground",
  login: "bg-secondary/50 text-secondary-foreground",
  grade: "bg-warning/10 text-warning",
};

export default function AuditPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground">
              Immutable record of all system activities
            </p>
          </div>
          <Button variant="enterprise">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>

        {/* Info Banner */}
        <div className="card-elevated p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Tamper-Proof Audit Trail</p>
              <p className="text-sm text-muted-foreground">
                All logs are cryptographically signed and cannot be modified or deleted. 
                This ensures full regulatory compliance and dispute resolution support.
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
                placeholder="Search by user, action, or resource ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-11"
              />
            </div>
            <div className="flex gap-2">
              <select className="h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="all">All Actions</option>
                <option value="grade">Grading</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
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
            <p className="text-2xl font-bold text-foreground">12,847</p>
            <p className="text-sm text-muted-foreground">Total Logs Today</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-warning">8,234</p>
            <p className="text-sm text-muted-foreground">Grading Actions</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-primary">3,421</p>
            <p className="text-sm text-muted-foreground">Updates</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-success">1,192</p>
            <p className="text-sm text-muted-foreground">Logins</p>
          </div>
        </div>

        {/* Audit Log List */}
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="card-elevated p-4 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        actionTypeStyles[log.actionType]
                      )}
                    >
                      {actionTypeIcons[log.actionType]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{log.action}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.id}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {log.timestamp}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pl-11">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {log.user} ({log.userId})
                  </span>
                  <span className="flex items-center gap-1">
                    <Monitor className="h-3.5 w-3.5" />
                    {log.deviceId}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {log.location}
                  </span>
                  <span className="font-mono">{log.ipAddress}</span>
                  <span className="font-mono text-primary">{log.resource}: {log.resourceId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of 12,847 logs
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
