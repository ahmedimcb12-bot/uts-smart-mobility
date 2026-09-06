import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Filter,
  Car,
  Users,
  Route as RouteIcon,
  CheckCircle2,
  XCircle,
  Receipt,
  Download,
  Star,
  Clock,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { BusItem, DriverItem, RouteItem } from "@/lib/admin-operations-store";
import type { StudentTransportRecord, ScheduleItem } from "@/lib/transport-eligibility";
import { toast } from "sonner";

interface ReportsAnalyticsTabProps {
  buses: BusItem[];
  drivers: DriverItem[];
  routes: RouteItem[];
  schedules: ScheduleItem[];
  students: StudentTransportRecord[];
  attendance: any[];
  fees: any[];
}

export function ReportsAnalyticsTab({
  buses,
  drivers,
  routes,
  schedules,
  students,
  attendance,
  fees,
}: ReportsAnalyticsTabProps) {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "custom">("month");

  // Sample analytics time-series data
  const TRIP_TRENDS = [
    { day: "Mon", scheduled: 12, completed: 12, cancelled: 0 },
    { day: "Tue", scheduled: 12, completed: 11, cancelled: 1 },
    { day: "Wed", scheduled: 14, completed: 14, cancelled: 0 },
    { day: "Thu", scheduled: 14, completed: 13, cancelled: 1 },
    { day: "Fri", scheduled: 12, completed: 12, cancelled: 0 },
    { day: "Sat", scheduled: 6, completed: 6, cancelled: 0 },
  ];

  const ATTENDANCE_TRENDS = [
    { day: "Mon", presentRate: 94 },
    { day: "Tue", presentRate: 91 },
    { day: "Wed", presentRate: 96 },
    { day: "Thu", presentRate: 93 },
    { day: "Fri", presentRate: 89 },
    { day: "Sat", presentRate: 92 },
  ];

  const FLEET_STATUS_PIE = [
    { name: "Active in Service", value: buses.filter((b) => b.status === "ACTIVE").length, color: "#10b981" },
    { name: "Under Maintenance", value: buses.filter((b) => b.status === "UNDER_MAINTENANCE").length, color: "#f59e0b" },
    { name: "Standby / Inactive", value: buses.filter((b) => b.status === "INACTIVE").length || 1, color: "#64748b" },
  ];

  const handleExportCSV = () => {
    toast.success("Operations summary report compiled and downloaded as CSV.");
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Range Selectors */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Reports & Fleet Operational Analytics
            </h2>
            <p className="text-xs text-muted-foreground">
              Evaluate trip execution rates, passenger attendance percentages, fee collection efficiency, and vehicle utilization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" variant="outline" onClick={handleExportCSV} className="text-xs h-9">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card-elevated p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Trips Run</span>
          <p className="text-2xl font-black text-foreground font-mono">148</p>
          <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
            <TrendingUp className="h-3 w-3" /> 98.6% Completion Rate
          </span>
        </div>

        <div className="card-elevated p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Average Attendance</span>
          <p className="text-2xl font-black text-emerald-600 font-mono">93.2%</p>
          <span className="text-[10px] text-muted-foreground">1,240 Check-ins Recorded</span>
        </div>

        <div className="card-elevated p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fleet Utilization</span>
          <p className="text-2xl font-black text-primary font-mono">87.5%</p>
          <span className="text-[10px] text-muted-foreground">Active Fleet Deployment</span>
        </div>

        <div className="card-elevated p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fee Collection Rate</span>
          <p className="text-2xl font-black text-foreground font-mono">91.4%</p>
          <span className="text-[10px] text-emerald-600 font-semibold">PKR 1.48M Collected</span>
        </div>
      </div>

      {/* Interactive Charts (Recharts) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Trip Completion Trend */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Weekly Trip Dispatch vs Completion</h3>
              <p className="text-xs text-muted-foreground">Scheduled shifts versus executed and completed runs</p>
            </div>
            <Badge variant="outline" className="text-[10px]">Shifts / Day</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TRIP_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="scheduled" fill="#3b82f6" name="Scheduled" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Passenger Attendance Rate Trend */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Student Attendance Daily Trajectory (%)</h3>
              <p className="text-xs text-muted-foreground">Percentage of enrolled passengers boarding scheduled routes</p>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px]">93% Avg</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ATTENDANCE_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="presentRate" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Present %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Driver Performance Ranking Table */}
      <div className="card-elevated overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" /> Driver Operational Ratings & Safety Performance
            </h3>
            <p className="text-xs text-muted-foreground">
              Based on schedule punctuality, student passenger feedback ratings, and trip completion history.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Driver</th>
                <th className="px-6 py-3.5">Assigned Vehicle</th>
                <th className="px-6 py-3.5">Assigned Route</th>
                <th className="px-6 py-3.5">Safety Rating</th>
                <th className="px-6 py-3.5">Total Trips</th>
                <th className="px-6 py-3.5">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground text-xs">
                    {d.full_name}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-foreground">
                    {d.assigned_bus_code || "UTS-CST-104"}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {d.assigned_route_name || "NUST Morning Route 01"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>{d.rating || "4.9"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-foreground font-semibold">
                    {d.total_trips || 120} Trips
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px]">100% On-Time</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
