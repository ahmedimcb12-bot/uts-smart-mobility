import {
  Car,
  Users,
  Route as RouteIcon,
  Calendar,
  GraduationCap,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Receipt,
  MessageSquare,
  Wrench,
  Send,
  Plus,
  ArrowRight,
  ShieldAlert,
  Radio,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BusItem, DriverItem, RouteItem } from "@/lib/admin-operations-store";
import type { StudentTransportRecord, ScheduleItem } from "@/lib/transport-eligibility";

interface AdminDashboardOverviewProps {
  buses: BusItem[];
  drivers: DriverItem[];
  routes: RouteItem[];
  schedules: ScheduleItem[];
  students: StudentTransportRecord[];
  complaints: any[];
  requests: any[];
  attendance: any[];
  fees: any[];
  onNavigateTab: (tabId: string) => void;
  onOpenAddBus: () => void;
  onOpenCreateRoute: () => void;
  onOpenCreateSchedule: () => void;
  onTriggerFeeScan: () => void;
}

export function AdminDashboardOverview({
  buses,
  drivers,
  routes,
  schedules,
  students,
  complaints,
  requests,
  attendance,
  fees,
  onNavigateTab,
  onOpenAddBus,
  onOpenCreateRoute,
  onOpenCreateSchedule,
  onTriggerFeeScan,
}: AdminDashboardOverviewProps) {
  // Calculated Metrics
  const totalBuses = buses.length;
  const activeBuses = buses.filter((b) => b.status === "ACTIVE").length;
  const maintenanceBuses = buses.filter((b) => b.status === "UNDER_MAINTENANCE").length;

  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter((d) => d.status === "ACTIVE").length;
  const pendingDriverApps = drivers.filter((d) => d.status === "PENDING").length;

  const totalPassengers = students.length;
  const activeRoutes = routes.filter((r) => r.active).length;

  const todayTrips = schedules.length;
  const completedTrips = schedules.filter((s) => s.status === "COMPLETED").length;
  const inProgressTrips = schedules.filter((s) => s.status === "IN_PROGRESS").length;
  const cancelledTrips = schedules.filter((s) => s.status === "CANCELLED").length;

  const presentAttendance = attendance.filter((a) => a.status === "PRESENT").length;
  const attendanceRate = attendance.length > 0
    ? Math.round((presentAttendance / attendance.length) * 100)
    : 92;

  const pendingComplaints = complaints.filter((c) => c.status === "OPEN" || c.status === "IN REVIEW").length;
  const activeRequests = requests.filter((r) => r.status === "NEW" || r.status === "QUOTED").length;
  const overdueFeesCount = fees.filter((f) => f.status === "OVERDUE").length;

  const suspendedStudentsCount = students.filter(
    (s) => s.status === "SUSPENDED_DISCIPLINARY" || s.status === "SUSPENDED_NON_PAYMENT" || s.status === "EXPELLED",
  ).length;

  return (
    <div className="space-y-8">
      {/* 1. CRITICAL OPERATIONAL ALERTS BANNER */}
      {(pendingDriverApps > 0 || overdueFeesCount > 0 || suspendedStudentsCount > 0 || maintenanceBuses > 0) && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
              <ShieldAlert className="h-5 w-5" />
              <span>Operational Action Items Requiring Attention</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Live Dispatch Feed</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pendingDriverApps > 0 && (
              <button
                onClick={() => onNavigateTab("drivers")}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-amber-500/20 text-left hover:border-amber-500 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-foreground">{pendingDriverApps} Driver Application(s)</p>
                  <p className="text-[11px] text-muted-foreground">Pending verification & approval</p>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-500" />
              </button>
            )}

            {overdueFeesCount > 0 && (
              <button
                onClick={() => onNavigateTab("passengers")}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-destructive/20 text-left hover:border-destructive transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-destructive">{overdueFeesCount} Overdue Fee Record(s)</p>
                  <p className="text-[11px] text-muted-foreground">Grace period expired</p>
                </div>
                <ArrowRight className="h-4 w-4 text-destructive" />
              </button>
            )}

            {suspendedStudentsCount > 0 && (
              <button
                onClick={() => onNavigateTab("disciplinary")}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-destructive/20 text-left hover:border-destructive transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-foreground">{suspendedStudentsCount} Disciplinary Action(s)</p>
                  <p className="text-[11px] text-muted-foreground">Excluded from driver manifests</p>
                </div>
                <ArrowRight className="h-4 w-4 text-destructive" />
              </button>
            )}

            {maintenanceBuses > 0 && (
              <button
                onClick={() => onNavigateTab("maintenance")}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-amber-500/20 text-left hover:border-amber-500 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-foreground">{maintenanceBuses} Bus Under Maintenance</p>
                  <p className="text-[11px] text-muted-foreground">Locked from trip schedules</p>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-500" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. SUMMARY KPI METRICS GRID (14 Required Cards) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Total Buses", value: totalBuses, sub: `${activeBuses} Active`, icon: Car, color: "text-foreground" },
          { label: "Buses Active", value: activeBuses, sub: "In Fleet Service", icon: Car, color: "text-emerald-600" },
          { label: "Under Maintenance", value: maintenanceBuses, sub: "Workshop Overhaul", icon: Wrench, color: "text-amber-500" },
          { label: "Total Drivers", value: totalDrivers, sub: `${activeDrivers} Active`, icon: Users, color: "text-foreground" },
          { label: "Pending Drivers", value: pendingDriverApps, sub: "Action Required", icon: UserCheck, color: pendingDriverApps > 0 ? "text-amber-500 font-bold" : "text-muted-foreground" },
          { label: "Total Passengers", value: totalPassengers, sub: "Registered Users", icon: GraduationCap, color: "text-foreground" },
          { label: "Active Routes", value: activeRoutes, sub: "Transit Lines", icon: RouteIcon, color: "text-primary" },
          { label: "Today's Trips", value: todayTrips, sub: `${inProgressTrips} Running`, icon: Calendar, color: "text-foreground" },
          { label: "Completed Trips", value: completedTrips, sub: "Executed Today", icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Cancelled Trips", value: cancelledTrips, sub: "Trip Adjustments", icon: XCircle, color: cancelledTrips > 0 ? "text-destructive" : "text-muted-foreground" },
          { label: "Today Attendance", value: `${attendanceRate}%`, sub: "Passenger Scan Rate", icon: TrendingUp, color: "text-emerald-600" },
          { label: "Pending Complaints", value: pendingComplaints, sub: "Open Tickets", icon: MessageSquare, color: pendingComplaints > 0 ? "text-destructive" : "text-muted-foreground" },
          { label: "Transport Quotes", value: activeRequests, sub: "Charters & Inquiries", icon: FileText, color: "text-foreground" },
          { label: "Suspended / Expelled", value: suspendedStudentsCount, sub: "Access Disabled", icon: Scale, color: "text-destructive" },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="card-elevated p-3.5 space-y-1 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-bold uppercase tracking-wider truncate">{kpi.label}</span>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className={`text-xl sm:text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground truncate">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* 3. QUICK ACTION SHORTCUTS */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-card border border-border">
        <span className="text-xs font-bold text-muted-foreground mr-2">Quick Operations:</span>
        <Button size="sm" onClick={onOpenAddBus} className="h-8 text-xs">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add New Bus
        </Button>
        <Button size="sm" variant="outline" onClick={onOpenCreateRoute} className="h-8 text-xs">
          <RouteIcon className="mr-1 h-3.5 w-3.5 text-primary" /> Create Route
        </Button>
        <Button size="sm" variant="outline" onClick={onOpenCreateSchedule} className="h-8 text-xs">
          <Calendar className="mr-1 h-3.5 w-3.5 text-primary" /> Schedule Trip
        </Button>
        <Button size="sm" variant="outline" onClick={onTriggerFeeScan} className="h-8 text-xs">
          <Receipt className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Run Overdue Fee Scan
        </Button>
        <Button size="sm" variant="outline" onClick={() => onNavigateTab("notifications")} className="h-8 text-xs">
          <Send className="mr-1 h-3.5 w-3.5 text-primary" /> Broadcast Notice
        </Button>
      </div>

      {/* 4. MAIN OPERATIONAL PANELS (Today's Trips & Active Fleet) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Scheduled Trips (2 cols) */}
        <div className="lg:col-span-2 card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Today's Scheduled Trips & Manifests
              </h3>
              <p className="text-xs text-muted-foreground">Live tracking of daily shifts, assigned vehicles, and drivers</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigateTab("schedules")} className="text-xs text-primary">
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-border">
            {schedules.map((s) => (
              <div key={s.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-lg transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{s.route_name}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">{s.shift}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono text-foreground">
                      <Car className="h-3 w-3 text-primary" /> {s.bus_code}
                    </span>
                    <span>• Driver: <strong>{s.driver_name}</strong></span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3 text-muted-foreground" /> {s.departure_time} – {s.arrival_time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      s.status === "IN_PROGRESS"
                        ? "bg-emerald-500/15 text-emerald-600 animate-pulse"
                        : s.status === "COMPLETED"
                          ? "bg-blue-500/15 text-blue-600"
                          : s.status === "CANCELLED"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {s.status === "IN_PROGRESS" ? "RUNNING NOW" : s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Fleet & Live Dispatch Status (1 col) */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Radio className="h-5 w-5 text-emerald-500" /> Active Buses
            </h3>
            <Badge className="bg-emerald-500/15 text-emerald-600 font-bold text-xs">{activeBuses} Online</Badge>
          </div>

          <div className="space-y-3">
            {buses.slice(0, 4).map((b) => (
              <div key={b.id} className="p-3 rounded-xl border border-border bg-secondary/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-mono text-foreground">{b.vehicle_code}</strong>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : b.status === "UNDER_MAINTENANCE"
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{b.category} • Capacity: {b.capacity} Seats</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                  <span>Driver: {b.assigned_driver_name || "Unassigned"}</span>
                  <span className="font-mono text-primary">{b.assigned_route_name ? "Assigned" : "Standby"}</span>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onNavigateTab("buses")}>
            Manage Entire Fleet Registry
          </Button>
        </div>
      </div>

      {/* 5. RECENT COMPLAINTS & INCOMING REQUESTS PREVIEW */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Complaints */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-destructive" /> Recent Complaints & Disciplinary Flags
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigateTab("complaints")} className="text-xs text-primary">
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-border">
            {complaints.slice(0, 3).map((c) => (
              <div key={c.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary">{c.reference || "UTS-C-100"}</span>
                    <Badge variant="secondary" className="text-[10px]">{c.category}</Badge>
                  </div>
                  <Badge className={c.status === "RESOLVED" ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive text-[10px]"}>
                    {c.status}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-1">{c.description}</p>
                <p className="text-[11px] text-muted-foreground">From: {c.customer_name || "Passenger"} • Priority: {c.priority}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Incoming Transport Requests */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Incoming Commercial Quotes & Charters
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigateTab("requests")} className="text-xs text-primary">
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-border">
            {requests.slice(0, 3).map((r) => (
              <div key={r.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">{r.full_name}</span>
                  <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                </div>
                <p className="text-xs text-primary font-medium">{r.service_type} • {r.city} • {r.passengers} Pax</p>
                <p className="text-[11px] text-muted-foreground">Phone: {r.phone} {r.organization ? `• ${r.organization}` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
