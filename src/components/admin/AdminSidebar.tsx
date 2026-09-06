import {
  LayoutDashboard,
  Users,
  Car,
  Route as RouteIcon,
  Calendar,
  GraduationCap,
  Scale,
  FileText,
  Radio,
  ClipboardList,
  MessageSquare,
  Bell,
  Wrench,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: number | string | null;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "warning";
  superAdminOnly?: boolean;
  group: "OPERATIONS" | "USERS_SERVICES" | "COMMUNICATION_FLEET" | "GOVERNANCE";
}

interface AdminSidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isSuperAdmin: boolean;
  counts: {
    pendingDriverApps: number;
    openComplaints: number;
    overdueFees: number;
    disciplinaryCases: number;
    activeRequests: number;
    activeBuses: number;
  };
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  isSuperAdmin,
  counts,
}: AdminSidebarProps) {
  const NAV_ITEMS: NavItem[] = [
    // 1. OPERATIONS
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      group: "OPERATIONS",
    },
    {
      id: "drivers",
      label: "Driver Management",
      icon: Users,
      badge: counts.pendingDriverApps > 0 ? `${counts.pendingDriverApps} New` : null,
      badgeVariant: "warning",
      group: "OPERATIONS",
    },
    {
      id: "buses",
      label: "Bus & Fleet",
      icon: Car,
      badge: `${counts.activeBuses} Active`,
      badgeVariant: "secondary",
      group: "OPERATIONS",
    },
    {
      id: "routes",
      label: "Routes & Stops",
      icon: RouteIcon,
      group: "OPERATIONS",
    },
    {
      id: "schedules",
      label: "Schedules",
      icon: Calendar,
      group: "OPERATIONS",
    },
    {
      id: "tracking",
      label: "Live Tracking",
      icon: Radio,
      badge: "GPS LIVE",
      badgeVariant: "destructive",
      group: "OPERATIONS",
    },

    // 2. USERS & SERVICES
    {
      id: "passengers",
      label: "Passengers / Students",
      icon: GraduationCap,
      badge: counts.overdueFees > 0 ? `${counts.overdueFees} Overdue` : null,
      badgeVariant: "destructive",
      group: "USERS_SERVICES",
    },
    {
      id: "disciplinary",
      label: "Disciplinary & Misconduct",
      icon: Scale,
      badge: counts.disciplinaryCases > 0 ? `${counts.disciplinaryCases} Cases` : null,
      badgeVariant: "destructive",
      group: "USERS_SERVICES",
    },
    {
      id: "requests",
      label: "Transport Requests",
      icon: FileText,
      badge: counts.activeRequests > 0 ? counts.activeRequests : null,
      badgeVariant: "default",
      group: "USERS_SERVICES",
    },
    {
      id: "trips",
      label: "Trips & Attendance",
      icon: ClipboardList,
      group: "USERS_SERVICES",
    },
    {
      id: "complaints",
      label: "Complaints & Feedback",
      icon: MessageSquare,
      badge: counts.openComplaints > 0 ? counts.openComplaints : null,
      badgeVariant: "destructive",
      group: "USERS_SERVICES",
    },

    // 3. COMMUNICATION & FLEET
    {
      id: "notifications",
      label: "Notifications & Broadcasts",
      icon: Bell,
      group: "COMMUNICATION_FLEET",
    },
    {
      id: "maintenance",
      label: "Fleet Maintenance",
      icon: Wrench,
      group: "COMMUNICATION_FLEET",
    },
    {
      id: "reports",
      label: "Reports & Analytics",
      icon: BarChart3,
      group: "COMMUNICATION_FLEET",
    },

    // 4. GOVERNANCE
    {
      id: "system",
      label: "System Administration",
      icon: ShieldCheck,
      superAdminOnly: true,
      badge: "SUPER",
      badgeVariant: "secondary",
      group: "GOVERNANCE",
    },
    {
      id: "audit",
      label: "Audit Logs",
      icon: History,
      group: "GOVERNANCE",
    },
  ];

  const GROUPS = [
    { key: "OPERATIONS", label: "Core Operations" },
    { key: "USERS_SERVICES", label: "Passengers & Services" },
    { key: "COMMUNICATION_FLEET", label: "Fleet & Comms" },
    { key: "GOVERNANCE", label: "Security & Governance" },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-card border-r border-border min-h-[calc(100vh-140px)] flex flex-col justify-between p-3">
      <div className="space-y-6">
        {/* Role Access Indicator */}
        <div className="p-3 rounded-xl bg-muted/60 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Security Level
            </span>
            <Badge
              className={
                isSuperAdmin
                  ? "bg-primary text-primary-foreground text-[10px]"
                  : "bg-secondary text-secondary-foreground text-[10px]"
              }
            >
              {isSuperAdmin ? "SUPER ADMIN" : "OPERATIONS ADMIN"}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-foreground mt-1 truncate">
            {isSuperAdmin ? "Executive Desk (Full Access)" : "Transport Operations Authority"}
          </p>
        </div>

        {/* Navigation Group Sections */}
        {GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((item) => item.group === group.key);
          return (
            <div key={group.key} className="space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                {group.label}
              </span>
              {items.map((item) => {
                if (item.superAdminOnly && !isSuperAdmin) {
                  return null;
                }
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "text-foreground hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          item.badgeVariant === "destructive"
                            ? isActive
                              ? "bg-destructive-foreground text-destructive"
                              : "bg-destructive/15 text-destructive font-bold"
                            : item.badgeVariant === "warning"
                              ? isActive
                                ? "bg-amber-400 text-amber-950 font-bold"
                                : "bg-amber-500/20 text-amber-600 font-bold"
                              : isActive
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-border px-3 text-[11px] text-muted-foreground">
        <p className="font-semibold text-foreground">UTS Smart Mobility v3.4</p>
        <p className="text-[10px] text-muted-foreground">Central Operations Console</p>
      </div>
    </aside>
  );
}
