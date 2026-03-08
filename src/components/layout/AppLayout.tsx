import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/lib/auth";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, roles, signOut, isAuthenticated } = useAuth();

  const getRoleLabel = () => {
    if (roles.some(r => r.role === 'super_admin')) return 'Super Admin';
    if (roles.some(r => r.role === 'company_admin')) return 'Company Admin';
    if (roles.some(r => r.role === 'quality_supervisor')) return 'Quality Supervisor';
    if (roles.some(r => r.role === 'grader')) return 'Grader';
    if (roles.some(r => r.role === 'auditor')) return 'Auditor';
    if (roles.some(r => r.role === 'farmer')) return 'Farmer';
    return 'User';
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        userRole={getRoleLabel()}
        userName={profile?.full_name || 'Guest User'}
        onSignOut={isAuthenticated ? signOut : undefined}
      />
      <main className="lg:pl-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
