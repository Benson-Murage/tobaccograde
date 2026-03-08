import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardCheck,
  DollarSign,
  AlertTriangle,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Menu,
  Eye,
  LogIn,
  Building2,
  Calendar,
  FileCheck,
  Route,
  Gauge,
  Camera,
  Wrench,
  Bug,
  Link2,
  Satellite,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { toast } from "sonner";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Farmers", href: "/farmers", icon: Users },
  { name: "Bales & Batches", href: "/bales", icon: Package },
  { name: "Grading", href: "/grading", icon: ClipboardCheck },
  { name: "Traceability", href: "/traceability", icon: Route },
  { name: "Pricing", href: "/pricing", icon: DollarSign },
  { name: "Disputes", href: "/disputes", icon: AlertTriangle },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Analytics", href: "/analytics", icon: Gauge },
];

const adminNavigation = [
  { name: "Warehouses", href: "/warehouses", icon: Building2 },
  { name: "Seasons", href: "/seasons", icon: Calendar },
  { name: "Export Cert.", href: "/export-certification", icon: FileCheck },
  { name: "Supervisor", href: "/supervisor", icon: Eye },
  { name: "Image Review", href: "/image-review", icon: Camera },
  { name: "Grader Perf.", href: "/grader-performance", icon: BarChart3 },
  { name: "Calibration", href: "/device-calibration", icon: Wrench },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Audit Logs", href: "/audit", icon: Shield },
];

interface AppSidebarProps {
  userRole?: string;
  userName?: string;
  onSignOut?: () => Promise<void>;
}

export function AppSidebar({ userRole = "Guest", userName = "Guest User", onSignOut }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    if (!onSignOut) {
      navigate('/auth');
      return;
    }
    setIsSigningOut(true);
    try {
      await onSignOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
        collapsed && "justify-center px-2"
      )}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <Leaf className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col flex-1">
            <span className="text-lg font-bold text-sidebar-foreground">LeafGrade</span>
            <span className="text-xs text-sidebar-foreground/60">Tobacco Grading System</span>
          </div>
        )}
        {!collapsed && <NotificationBell />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-sidebar-primary")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        {/* Admin section */}
        {(userRole === "Super Admin" || userRole === "Company Admin" || userRole === "Quality Supervisor" || userRole === "User") && (
          <>
            <div className={cn(
              "pt-4 pb-2",
              collapsed ? "px-2" : "px-3"
            )}>
              {!collapsed && (
                <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  Administration
                </span>
              )}
              {collapsed && <div className="h-px bg-sidebar-border" />}
            </div>
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active && "text-sidebar-primary")} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer section */}
      <div className={cn(
        "border-t border-sidebar-border p-3 space-y-1",
        collapsed && "px-2"
      )}>
        {/* Theme toggle */}
        <ThemeToggle collapsed={collapsed} />

        {/* User info */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg",
          collapsed && "justify-center px-2"
        )}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-foreground">
            {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{userRole}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            collapsed && "justify-center px-2"
          )}
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {onSignOut ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          {!collapsed && <span>{onSignOut ? (isSigningOut ? 'Signing out...' : 'Sign out') : 'Sign in'}</span>}
        </Button>
      </div>

      {/* Collapse toggle - desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 sidebar-gradient flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col sidebar-gradient transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
