import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Settings,
  Users,
  Sliders,
  Shield,
  Building2,
  Save,
  Plus,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";

const tabs = [
  { id: "company", name: "Company", icon: Building2 },
  { id: "grading", name: "Grading Rules", icon: Sliders },
  { id: "users", name: "User Management", icon: Users },
  { id: "security", name: "Security", icon: Shield },
];

interface GradingRule {
  id: string;
  name: string;
  conditions: string;
  resultGrade: string;
  active: boolean;
}

export default function SettingsPage() {
  const { profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("grading");
  const [isSaving, setIsSaving] = useState(false);

  const [companyInfo, setCompanyInfo] = useState({
    name: "Zimbabwe Tobacco Holdings",
    regNumber: "ZW-TB-2024-001",
    phone: "+263 4 123 4567",
    email: "admin@zth.co.zw",
  });

  const [gradingRules, setGradingRules] = useState<GradingRule[]>([
    { id: "1", name: "Premium Leaf Rule", conditions: "Position=Leaf, Color=Lemon, Moisture=12-18%, Defects<5%", resultGrade: "L1F", active: true },
    { id: "2", name: "Good Leaf Rule", conditions: "Position=Leaf, Color=Orange/Lemon, Moisture=12-18%, Defects<10%", resultGrade: "L2F", active: true },
    { id: "3", name: "Standard Cutter Rule", conditions: "Position=Cutters, Color=Any, Moisture=12-20%, Defects<15%", resultGrade: "C2F", active: true },
    { id: "4", name: "Low Grade Rule", conditions: "Defects>15% OR Moisture>22%", resultGrade: "X2F", active: true },
    { id: "5", name: "Rejection Rule", conditions: "Defects>30% OR Mold=Yes OR Foreign Matter>5%", resultGrade: "REJ", active: true },
  ]);

  const [users] = useState([
    { id: "1", name: profile?.full_name || "John Mukasa", email: profile?.email || "john@company.com", role: "Company Admin", status: "active" },
    { id: "2", name: "James Mwale", email: "james@company.com", role: "Grader", status: "active" },
    { id: "3", name: "Mary Banda", email: "mary@company.com", role: "Grader", status: "active" },
    { id: "4", name: "Sarah Tembo", email: "sarah@company.com", role: "Quality Supervisor", status: "active" },
  ]);

  const handleSaveCompany = async () => {
    setIsSaving(true);
    try {
      // In production, this would write to companies table
      await new Promise(r => setTimeout(r, 500));
      toast.success('Company information saved');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRule = (id: string) => {
    setGradingRules(prev => prev.map(r =>
      r.id === id ? { ...r, active: !r.active } : r
    ));
    toast.success('Rule status updated');
  };

  const handleDeleteRule = (id: string) => {
    setGradingRules(prev => prev.filter(r => r.id !== id));
    toast.success('Grading rule removed');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure system settings and grading rules</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Company Settings */}
        {activeTab === "company" && (
          <div className="card-elevated p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Company Name</label>
                <Input value={companyInfo.name} onChange={e => setCompanyInfo(p => ({ ...p, name: e.target.value }))} className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Registration Number</label>
                <Input value={companyInfo.regNumber} onChange={e => setCompanyInfo(p => ({ ...p, regNumber: e.target.value }))} className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Primary Contact</label>
                <Input value={companyInfo.phone} onChange={e => setCompanyInfo(p => ({ ...p, phone: e.target.value }))} className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                <Input value={companyInfo.email} onChange={e => setCompanyInfo(p => ({ ...p, email: e.target.value }))} className="h-11" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="enterprise" onClick={handleSaveCompany} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* Grading Rules */}
        {activeTab === "grading" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Grading Rules Engine</h3>
              <Button variant="enterprise" onClick={() => toast.info('Rule editor coming soon')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Define the rules that determine tobacco grades. Rules are evaluated in order from top to bottom.
            </p>
            <div className="space-y-3">
              {gradingRules.map((rule, index) => (
                <div key={rule.id} className="card-elevated p-4 hover:shadow-card-hover transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                        {index + 1}
                      </div>
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={cn("w-3 h-3 rounded-full cursor-pointer transition-colors", rule.active ? "bg-success" : "bg-muted-foreground")}
                        title={rule.active ? 'Active - click to disable' : 'Disabled - click to enable'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("font-semibold", rule.active ? "text-foreground" : "text-muted-foreground line-through")}>{rule.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1 font-mono">{rule.conditions}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Result</p>
                        <span className="grade-badge grade-premium">{rule.resultGrade}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => toast.info('Rule editor coming soon')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Management */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">User Management</h3>
              <Button variant="enterprise" onClick={() => toast.info('Invite users via the authentication page')}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            <div className="card-elevated overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Role</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{user.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                          user.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        )}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => toast.info('User editing coming in next release')}>Edit</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === "security" && (
          <div className="card-elevated p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Security Settings</h3>
            <div className="space-y-4">
              {[
                { title: "Two-Factor Authentication", desc: "Require 2FA for all admin users", enabled: true },
                { title: "Audit Logging", desc: "Log all user actions for compliance", enabled: true },
                { title: "Device Fingerprinting", desc: "Track device IDs for grading sessions", enabled: true },
              ].map((setting) => (
                <div key={setting.title} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <h4 className="font-medium text-foreground">{setting.title}</h4>
                    <p className="text-sm text-muted-foreground">{setting.desc}</p>
                  </div>
                  <div className={cn("w-12 h-6 rounded-full relative cursor-pointer transition-colors", setting.enabled ? "bg-success" : "bg-muted")}>
                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", setting.enabled ? "right-1" : "left-1")} />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <h4 className="font-medium text-foreground">Session Timeout</h4>
                  <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                </div>
                <select className="h-9 px-3 rounded-lg border border-input bg-background text-sm">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
