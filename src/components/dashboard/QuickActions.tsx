import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ClipboardCheck, 
  Package, 
  UserPlus, 
  AlertTriangle,
  Scan,
  FileText
} from "lucide-react";

const actions = [
  {
    name: "Start Grading",
    description: "Grade tobacco bales",
    href: "/grading",
    icon: ClipboardCheck,
    primary: true,
  },
  {
    name: "Scan Bale",
    description: "Scan QR/Barcode",
    href: "/scan",
    icon: Scan,
    primary: false,
  },
  {
    name: "Register Bale",
    description: "New bale entry",
    href: "/bales/new",
    icon: Package,
    primary: false,
  },
  {
    name: "Add Farmer",
    description: "Register farmer",
    href: "/farmers/new",
    icon: UserPlus,
    primary: false,
  },
  {
    name: "View Disputes",
    description: "Review pending",
    href: "/disputes",
    icon: AlertTriangle,
    primary: false,
  },
  {
    name: "Generate Report",
    description: "Export data",
    href: "/reports",
    icon: FileText,
    primary: false,
  },
];

export function QuickActions() {
  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.name} to={action.href}>
              <Button
                variant={action.primary ? "enterprise" : "outline"}
                className={`w-full h-auto flex-col gap-2 py-4 ${action.primary ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <Icon className="h-5 w-5" />
                <div className="text-center">
                  <p className="font-semibold text-sm">{action.name}</p>
                  <p className={`text-xs ${action.primary ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {action.description}
                  </p>
                </div>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
