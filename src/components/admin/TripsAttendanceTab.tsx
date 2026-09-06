import { useState } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Users,
  Route as RouteIcon,
  Calendar,
  AlertTriangle,
  FileCheck,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ScheduleItem } from "@/lib/transport-eligibility";

interface TripsAttendanceTabProps {
  schedules: ScheduleItem[];
  attendance: any[];
}

export function TripsAttendanceTab({ schedules, attendance }: TripsAttendanceTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [isManifestOpen, setIsManifestOpen] = useState(false);

  const filteredAttendance = attendance.filter((att) => {
    const studentName = att.students?.full_name || "";
    const routeName = att.routes?.name || "";
    return (
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.service_date?.includes(searchQuery)
    );
  });

  const presentCount = attendance.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Trip Operations & Attendance Manifests
            </h2>
            <p className="text-xs text-muted-foreground">
              Monitor passenger boarding logs, digital attendance scanned from driver consoles, and automated absence notifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4" /> {presentCount} Present
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-destructive/15 text-destructive text-xs font-bold">
              <XCircle className="h-4 w-4" /> {absentCount} Absences
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search attendance records by student name, route, or service date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Attendance Manifest Records Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Student Passenger</th>
                <th className="px-6 py-3.5">Assigned Route</th>
                <th className="px-6 py-3.5">Service Date</th>
                <th className="px-6 py-3.5">Boarding Status</th>
                <th className="px-6 py-3.5">Verification Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAttendance.map((att) => (
                <tr key={att.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground text-sm">
                    {att.students?.full_name || "Enrolled Passenger"}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {att.routes?.name || "NUST Morning Route 01"}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono font-bold text-foreground">
                    {att.service_date}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        att.status === "PRESENT"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {att.status === "PRESENT" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {att.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {att.source === "AUTO" ? (
                      <span className="text-amber-600 font-semibold">Auto Route-End Calculation</span>
                    ) : (
                      <span className="text-foreground">Driver Mobile Console</span>
                    )}
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
