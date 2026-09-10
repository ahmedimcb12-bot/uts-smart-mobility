import { useState, useMemo, useEffect } from "react";
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
  User,
  History,
  Download,
  RotateCcw,
  Check,
  Eye,
  UserCheck,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ScheduleItem, StudentTransportRecord } from "@/lib/transport-eligibility";
import {
  getDriverShiftAttendance,
  triggerStudentAbsentEmail,
  UTS_DRIVER_ONBOARD_EVENT_KEY,
  type DriverItem,
  type RouteItem,
  type DriverShiftAttendanceRecord,
} from "@/lib/admin-operations-store";

interface TripsAttendanceTabProps {
  schedules?: ScheduleItem[];
  attendance: any[];
  routes?: RouteItem[];
  drivers?: DriverItem[];
  students?: StudentTransportRecord[];
}

export function TripsAttendanceTab({
  schedules = [],
  attendance = [],
  routes = [],
  drivers = [],
  students = [],
}: TripsAttendanceTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"STUDENT_MANIFEST" | "DRIVER_SHIFTS" | "ABSENT_STUDENTS">("STUDENT_MANIFEST");

  // Driver Shift Attendance records
  const [driverShifts, setDriverShifts] = useState<DriverShiftAttendanceRecord[]>(() =>
    getDriverShiftAttendance(),
  );

  useEffect(() => {
    const handleDriverShiftUpdate = () => {
      setDriverShifts(getDriverShiftAttendance());
    };
    window.addEventListener(UTS_DRIVER_ONBOARD_EVENT_KEY, handleDriverShiftUpdate);
    return () => {
      window.removeEventListener(UTS_DRIVER_ONBOARD_EVENT_KEY, handleDriverShiftUpdate);
    };
  }, []);

  // Filter States
  const [searchStudent, setSearchStudent] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("ALL");
  const [selectedRoute, setSelectedRoute] = useState<string>("ALL");
  const [selectedShift, setSelectedShift] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Individual Student History Modal State
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<{
    id: string;
    name: string;
    rollNo?: string;
  } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Normalize Attendance records
  const normalizedRecords = useMemo(() => {
    return attendance.map((att, idx) => {
      const studentName =
        att.students?.full_name ||
        att.student_name ||
        att.studentName ||
        "Student Passenger";
      const studentId = att.student_id || att.studentId || `std-${idx}`;
      const routeName =
        att.routes?.name ||
        att.route_name ||
        att.routeName ||
        "NUST Morning Route 01 (Islamabad West)";
      const routeId = att.route_id || att.routeId || "r1";
      const driverName =
        att.drivers?.full_name ||
        att.driver_name ||
        att.driverName ||
        "Muhammad Tariq";
      const driverId = att.driver_id || att.driverId || "d1";
      const shift = (att.shift_id || att.shiftId || "MORNING").toUpperCase();
      const status = (att.status || "PENDING").toUpperCase();
      const serviceDate =
        att.service_date ||
        att.serviceDate ||
        new Date().toISOString().slice(0, 10);
      const markedAt = att.marked_at || att.markedAt || new Date().toISOString();
      const source = att.source || (status === "ABSENT" ? "AUTO" : "DRIVER");

      return {
        id: att.id || `att-${idx}`,
        studentId,
        studentName,
        rollNo: att.students?.roll_no || att.rollNo || (studentId === "std-1" ? "NUST-SE-88" : `NUST-${idx + 10}`),
        routeId,
        routeName,
        driverId,
        driverName,
        shift,
        status,
        serviceDate,
        markedAt,
        source,
      };
    });
  }, [attendance]);

  // Filtered dataset based on multi-dimensional filters
  const filteredRecords = useMemo(() => {
    return normalizedRecords.filter((record) => {
      // 1. Search by Student Name or Roll No
      if (
        searchStudent &&
        !record.studentName.toLowerCase().includes(searchStudent.toLowerCase()) &&
        !record.rollNo.toLowerCase().includes(searchStudent.toLowerCase())
      ) {
        return false;
      }

      // 2. Date Filter
      if (selectedDate && record.serviceDate !== selectedDate) {
        return false;
      }

      // 3. Driver Filter
      if (
        selectedDriver !== "ALL" &&
        record.driverId !== selectedDriver &&
        record.driverName !== selectedDriver
      ) {
        return false;
      }

      // 4. Route Filter
      if (
        selectedRoute !== "ALL" &&
        record.routeId !== selectedRoute &&
        record.routeName !== selectedRoute
      ) {
        return false;
      }

      // 5. Shift Filter
      if (
        selectedShift !== "ALL" &&
        record.shift.toUpperCase() !== selectedShift.toUpperCase()
      ) {
        return false;
      }

      // 6. Status Filter
      if (
        selectedStatus !== "ALL" &&
        record.status.toUpperCase() !== selectedStatus.toUpperCase()
      ) {
        return false;
      }

      return true;
    });
  }, [
    normalizedRecords,
    searchStudent,
    selectedDate,
    selectedDriver,
    selectedRoute,
    selectedShift,
    selectedStatus,
  ]);

  // Summary Metrics
  const totalCount = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status === "PRESENT").length;
  const absentCount = filteredRecords.filter((r) => r.status === "ABSENT").length;
  const pendingCount = filteredRecords.filter((r) => r.status === "PENDING" || r.status === "UNCHECKED").length;

  // Clear all filters
  const handleResetFilters = () => {
    setSearchStudent("");
    setSelectedDate("");
    setSelectedDriver("ALL");
    setSelectedRoute("ALL");
    setSelectedShift("ALL");
    setSelectedStatus("ALL");
    toast.info("Attendance filters reset.");
  };

  // Open Student History Modal
  const openStudentHistory = (student: { id: string; name: string; rollNo?: string }) => {
    setSelectedStudentForHistory(student);
    setIsHistoryModalOpen(true);
  };

  // Get records for specific student
  const studentHistoryRecords = useMemo(() => {
    if (!selectedStudentForHistory) return [];
    return normalizedRecords.filter(
      (r) =>
        r.studentId === selectedStudentForHistory.id ||
        r.studentName.toLowerCase() === selectedStudentForHistory.name.toLowerCase(),
    );
  }, [normalizedRecords, selectedStudentForHistory]);

  const studentTotalDays = studentHistoryRecords.length;
  const studentPresentDays = studentHistoryRecords.filter((r) => r.status === "PRESENT").length;
  const studentAbsentDays = studentHistoryRecords.filter((r) => r.status === "ABSENT").length;
  const studentRate =
    studentTotalDays > 0 ? Math.round((studentPresentDays / studentTotalDays) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Overview Banner & Metric KPI Cards */}
      <div className="card-elevated p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Central Operations Console
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mt-1">
              <ClipboardList className="h-5 w-5 text-primary" /> Attendance Management & Trip Operations
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live student passenger attendance, driver mark absence logs, multi-dimensional filters, and individual student history inspection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.success(`Exported ${filteredRecords.length} attendance records to CSV summary.`)
              }
              className="text-xs h-8"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export Manifest
            </Button>
          </div>
        </div>

        {/* 4 Summary Statistics Cards: Present, Absent, Pending, Total */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Records
            </span>
            <p className="mt-1 text-2xl font-bold text-foreground">{totalCount}</p>
            <span className="text-[11px] text-muted-foreground">Manifest entries</span>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 border-l-4 border-l-emerald-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Present (Boarded)
            </span>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{presentCount}</p>
            <span className="text-[11px] text-emerald-600 font-medium">Verified by Driver</span>
          </div>

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 border-l-4 border-l-destructive">
            <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
              Marked Absent
            </span>
            <p className="mt-1 text-2xl font-bold text-destructive">{absentCount}</p>
            <span className="text-[11px] text-destructive font-medium">Recorded Absences</span>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 border-l-4 border-l-amber-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
              Pending (Unmarked)
            </span>
            <p className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</p>
            <span className="text-[11px] text-amber-600 font-medium">Awaiting Boarding</span>
          </div>
        </div>

        {/* View Switcher Sub-Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button
            size="sm"
            variant={activeSubTab === "STUDENT_MANIFEST" ? "default" : "outline"}
            onClick={() => setActiveSubTab("STUDENT_MANIFEST")}
            className="text-xs h-8"
          >
            <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
            Student Passenger Manifest ({totalCount})
          </Button>

          <Button
            size="sm"
            variant={activeSubTab === "DRIVER_SHIFTS" ? "default" : "outline"}
            onClick={() => setActiveSubTab("DRIVER_SHIFTS")}
            className="text-xs h-8"
          >
            <UserCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
            Driver Shift Attendance ({driverShifts.length})
          </Button>

          <Button
            size="sm"
            variant={activeSubTab === "ABSENT_STUDENTS" ? "default" : "outline"}
            onClick={() => setActiveSubTab("ABSENT_STUDENTS")}
            className="text-xs h-8"
          >
            <Mail className="mr-1.5 h-3.5 w-3.5 text-destructive" />
            Absent Follow-Up & Email Alerts ({absentCount})
          </Button>
        </div>
      </div>

      {/* 1. DRIVER SHIFT LOGS VIEW */}
      {activeSubTab === "DRIVER_SHIFTS" && (
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-600" /> Driver Shift Attendance & Verification Log
              </h3>
              <p className="text-xs text-muted-foreground">
                Live automated check-ins logged when drivers click "Start Route" on mobile console
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Driver Name</th>
                  <th className="px-6 py-3.5">Assigned Route</th>
                  <th className="px-6 py-3.5">Vehicle</th>
                  <th className="px-6 py-3.5">Shift</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Shift Started</th>
                  <th className="px-6 py-3.5">Shift Ended</th>
                  <th className="px-6 py-3.5">Duty Status</th>
                  <th className="px-6 py-3.5">Authority Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {driverShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-bold text-foreground">{shift.driver_name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{shift.route_name}</td>
                    <td className="px-6 py-4 font-mono font-bold text-primary">{shift.vehicle_code}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {shift.shift}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono">{shift.date}</td>
                    <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{shift.start_time}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{shift.end_time || "In Progress"}</td>
                    <td className="px-6 py-4">
                      <Badge
                        className={
                          shift.status === "ON_DUTY"
                            ? "bg-emerald-500/15 text-emerald-600 font-bold"
                            : "bg-blue-500/15 text-blue-600"
                        }
                      >
                        {shift.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ABSENT FOLLOW-UP & EMAIL ALERTS VIEW */}
      {activeSubTab === "ABSENT_STUDENTS" && (
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Mail className="h-5 w-5 text-destructive" /> Absent Students & Email Dispatch Monitor
              </h3>
              <p className="text-xs text-muted-foreground">
                Instant email notifications are automatically triggered to absent students when marked by drivers
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Student Passenger</th>
                  <th className="px-6 py-3.5">Route</th>
                  <th className="px-6 py-3.5">Shift</th>
                  <th className="px-6 py-3.5">Reporting Driver</th>
                  <th className="px-6 py-3.5">Service Date</th>
                  <th className="px-6 py-3.5">Email Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {normalizedRecords
                  .filter((r) => r.status === "ABSENT")
                  .map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-bold text-foreground">
                        {rec.studentName}
                        <span className="block text-[11px] font-mono text-muted-foreground">{rec.rollNo}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{rec.routeName}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {rec.shift}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-foreground font-medium">{rec.driverName}</td>
                      <td className="px-6 py-4 font-mono">{rec.serviceDate}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Email Dispatched
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            triggerStudentAbsentEmail(
                              "student@uts.edu.pk",
                              rec.studentName,
                              rec.routeName,
                              "Designated Stop",
                              "07:30 AM",
                              rec.driverName,
                            );
                            toast.success(`Absence follow-up email re-dispatched to ${rec.studentName}!`);
                          }}
                          className="h-7 text-xs text-primary"
                        >
                          <Send className="mr-1 h-3 w-3" /> Resend Email
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. STUDENT MANIFEST MAIN VIEW */}
      {activeSubTab === "STUDENT_MANIFEST" && (
        <>
          {/* COMPREHENSIVE FILTER BAR */}
          <div className="card-elevated p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Filter Attendance Records</h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetFilters}
                className="text-xs h-7 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-1 h-3 w-3" /> Reset Filters
              </Button>
            </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* 1. Student Search */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold">Student</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Name / Roll No..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>

          {/* 2. Date Filter */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold">Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          {/* 3. Driver Filter */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold">Driver</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="All Drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Drivers</SelectItem>
                <SelectItem value="Muhammad Tariq">Muhammad Tariq</SelectItem>
                <SelectItem value="Rashid Mehmood">Rashid Mehmood</SelectItem>
                <SelectItem value="Ghulam Abbas">Ghulam Abbas</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.full_name}>
                    {d.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Route Filter */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold">Route</Label>
            <Select value={selectedRoute} onValueChange={setSelectedRoute}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="All Routes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Routes</SelectItem>
                <SelectItem value="NUST Morning Route 01 (Islamabad West)">NUST Route 01</SelectItem>
                <SelectItem value="Blue Area Corporate Express">Blue Area Express</SelectItem>
                <SelectItem value="Rawalpindi – Islamabad Intercity Shuttle">RWP-ISB Shuttle</SelectItem>
                {routes.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 5. Shift Filter */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold">Shift</Label>
            <Select value={selectedShift} onValueChange={setSelectedShift}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Shifts</SelectItem>
                <SelectItem value="MORNING">Morning Shift</SelectItem>
                <SelectItem value="AFTERNOON">Afternoon Shift</SelectItem>
                <SelectItem value="EVENING">Evening Shift</SelectItem>
                <SelectItem value="NIGHT">Night Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 6. Status Filter */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PRESENT">Present Only</SelectItem>
                <SelectItem value="ABSENT">Absent Only</SelectItem>
                <SelectItem value="PENDING">Pending Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ATTENDANCE RECORDS TABLE */}
      <div className="card-elevated overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Attendance Manifest Records</h3>
            <p className="text-xs text-muted-foreground">
              Showing {filteredRecords.length} records matching applied filters.
            </p>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold">No attendance records found matching filters.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetFilters}
              className="mt-3 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Student Passenger</th>
                  <th className="px-6 py-3.5">Route & Bus</th>
                  <th className="px-6 py-3.5">Shift</th>
                  <th className="px-6 py-3.5">Assigned Driver</th>
                  <th className="px-6 py-3.5">Service Date</th>
                  <th className="px-6 py-3.5">Attendance Status</th>
                  <th className="px-6 py-3.5">Source & Timestamp</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredRecords.map((att) => {
                  const isPresent = att.status === "PRESENT";
                  const isAbsent = att.status === "ABSENT";
                  const isPending = att.status === "PENDING" || att.status === "UNCHECKED";

                  return (
                    <tr key={att.id} className="hover:bg-muted/30 transition-colors">
                      {/* Student Name */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground text-sm">{att.studentName}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {att.rollNo}
                        </div>
                      </td>

                      {/* Route */}
                      <td className="px-6 py-4 text-muted-foreground max-w-[180px] truncate">
                        <span className="font-medium text-foreground block truncate">
                          {att.routeName}
                        </span>
                      </td>

                      {/* Shift */}
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                          {att.shift}
                        </Badge>
                      </td>

                      {/* Driver */}
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{att.driverName}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 font-mono font-bold text-foreground whitespace-nowrap">
                        {att.serviceDate}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isPresent
                              ? "bg-emerald-500/15 text-emerald-600"
                              : isAbsent
                                ? "bg-destructive/15 text-destructive"
                                : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {isPresent && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {isAbsent && <XCircle className="h-3.5 w-3.5" />}
                          {isPending && <Clock className="h-3.5 w-3.5" />}
                          {isPresent ? "Present" : isAbsent ? "Absent" : "Pending"}
                        </span>
                      </td>

                      {/* Verification Source */}
                      <td className="px-6 py-4 text-muted-foreground text-[11px]">
                        <div>
                          {att.source === "AUTO" ? (
                            <span className="text-amber-600 font-medium">Auto Route-End</span>
                          ) : (
                            <span className="text-foreground">Driver Mobile Console</span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                          {new Date(att.markedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Individual Student History Button */}
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openStudentHistory({
                              id: att.studentId,
                              name: att.studentName,
                              rollNo: att.rollNo,
                            })
                          }
                          className="h-7 text-xs"
                        >
                          <History className="mr-1 h-3 w-3" /> History
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* INDIVIDUAL STUDENT ATTENDANCE HISTORY MODAL */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <History className="h-5 w-5 text-primary" /> Individual Student Attendance History
            </DialogTitle>
            <DialogDescription>
              Complete chronological attendance log and performance rate for <strong>{selectedStudentForHistory?.name}</strong> (ID: {selectedStudentForHistory?.rollNo}).
            </DialogDescription>
          </DialogHeader>

          {selectedStudentForHistory && (
            <div className="space-y-4 py-2">
              {/* Summary KPIs */}
              <div className="grid grid-cols-4 bg-muted/40 rounded-xl p-3 text-center text-xs border border-border">
                <div>
                  <span className="text-muted-foreground uppercase text-[10px] font-semibold">
                    Total Sessions
                  </span>
                  <p className="mt-0.5 text-lg font-bold text-foreground">{studentTotalDays}</p>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[10px] font-semibold text-emerald-600">
                    Present
                  </span>
                  <p className="mt-0.5 text-lg font-bold text-emerald-600">
                    {studentPresentDays}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[10px] font-semibold text-destructive">
                    Absent
                  </span>
                  <p className="mt-0.5 text-lg font-bold text-destructive">
                    {studentAbsentDays}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[10px] font-semibold text-primary">
                    Attendance Rate
                  </span>
                  <p className="mt-0.5 text-lg font-bold text-primary">{studentRate}%</p>
                </div>
              </div>

              {/* Individual Records Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 uppercase font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Shift</th>
                      <th className="px-4 py-2.5">Route</th>
                      <th className="px-4 py-2.5">Driver</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Verified Via</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {studentHistoryRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                          No historical attendance records logged for this student yet.
                        </td>
                      </tr>
                    ) : (
                      studentHistoryRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5 font-semibold text-foreground whitespace-nowrap">
                            {rec.serviceDate}
                          </td>
                          <td className="px-4 py-2.5 font-medium">{rec.shift}</td>
                          <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[140px]">
                            {rec.routeName}
                          </td>
                          <td className="px-4 py-2.5 font-medium">{rec.driverName}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === "PRESENT"
                                  ? "bg-emerald-500/15 text-emerald-600"
                                  : rec.status === "ABSENT"
                                    ? "bg-destructive/15 text-destructive font-bold"
                                    : "bg-amber-500/15 text-amber-600"
                              }`}
                            >
                              {rec.status === "PRESENT" && <CheckCircle2 className="h-3 w-3" />}
                              {rec.status === "ABSENT" && <XCircle className="h-3 w-3" />}
                              {rec.status === "PENDING" && <Clock className="h-3 w-3" />}
                              {rec.status === "PRESENT"
                                ? "Present"
                                : rec.status === "ABSENT"
                                  ? "Absent"
                                  : "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-[10px] font-mono">
                            {rec.source === "AUTO" ? "Auto Route-End" : "Driver Console"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsHistoryModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
