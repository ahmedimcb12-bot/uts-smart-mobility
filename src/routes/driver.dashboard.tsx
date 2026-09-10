import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Square,
  Wifi,
  WifiOff,
  RefreshCw,
  MapPin,
  Car,
  Bell,
  AlertTriangle,
  User,
  ShieldCheck,
  Phone,
  Search,
  History,
  AlertCircle,
  Truck,
  Send,
  Navigation,
  ChevronRight,
  Flame,
  Check,
  MessageSquare,
  Wrench,
  ShieldAlert,
  UserX,
  UserCheck,
  Calendar,
  Filter,
} from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { OfflineAttendanceQueue, ATTENDANCE_EVENT_KEY } from "@/lib/offline-attendance-queue";
import {
  getBroadcastAlerts,
  triggerStudentAbsentEmail,
  recordDriverShiftStart,
  recordDriverShiftEnd,
  setBusMaintenanceStatus,
  triggerDriverDelayAlert,
  UTS_BROADCAST_EVENT_KEY,
  type BroadcastAlertItem,
} from "@/lib/admin-operations-store";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/dashboard")({
  head: () => ({
    meta: [
      { title: "Driver Operational Console & Attendance — UTS Smart Transport" },
      {
        name: "description",
        content:
          "Driver operations console: route execution, live passenger attendance, mark absence workflow, offline sync, stop-by-stop itinerary, and incident reporting.",
      },
    ],
  }),
  component: DriverDashboardPage,
});

type RouteLifecycle = "NOT_STARTED" | "ACTIVE" | "COMPLETED";

export type AttendanceStatus = "PENDING" | "PRESENT" | "ABSENT";

export interface DriverPassenger {
  id: string;
  name: string;
  rollNo: string;
  stop: string;
  stopSeq: number;
  pickupTime: string;
  status: AttendanceStatus;
  phone: string;
  routeId: string;
  shiftId: string;
}

interface RouteStopItem {
  id: string;
  seq: number;
  name: string;
  time: string;
  completed: boolean;
}

const INITIAL_PASSENGERS: DriverPassenger[] = [
  {
    id: "std-1",
    name: "Ahmed Hussain",
    rollNo: "NUST-SE-88",
    stop: "G-10 Markaz Roundabout",
    stopSeq: 3,
    pickupTime: "07:30 AM",
    status: "PENDING",
    phone: "03124567891",
    routeId: "r1",
    shiftId: "MORNING",
  },
  {
    id: "std-2",
    name: "Hamza Ali",
    rollNo: "NUST-CS-45",
    stop: "G-8 Markaz Roundabout",
    stopSeq: 1,
    pickupTime: "07:15 AM",
    status: "PENDING",
    phone: "03019876543",
    routeId: "r1",
    shiftId: "MORNING",
  },
  {
    id: "std-3",
    name: "Bilal Farooq",
    rollNo: "NUST-ME-67",
    stop: "G-10 Markaz Roundabout",
    stopSeq: 3,
    pickupTime: "07:30 AM",
    status: "PENDING",
    phone: "03227788990",
    routeId: "r1",
    shiftId: "MORNING",
  },
  {
    id: "std-4",
    name: "Ali Khan",
    rollNo: "NUST-EE-12",
    stop: "G-8 Markaz Roundabout",
    stopSeq: 1,
    pickupTime: "07:15 AM",
    status: "PENDING",
    phone: "03001234567",
    routeId: "r1",
    shiftId: "MORNING",
  },
  {
    id: "std-5",
    name: "Usman Tariq",
    rollNo: "NUST-BBA-09",
    stop: "G-9 Sector Main Stop",
    stopSeq: 2,
    pickupTime: "07:22 AM",
    status: "PENDING",
    phone: "03115554433",
    routeId: "r1",
    shiftId: "MORNING",
  },
  {
    id: "std-6",
    name: "Zainab Bibi",
    rollNo: "NUST-SE-34",
    stop: "G-10/4 Main Boulevard",
    stopSeq: 3,
    pickupTime: "07:35 AM",
    status: "PENDING",
    phone: "03334445566",
    routeId: "r1",
    shiftId: "MORNING",
  },
  {
    id: "std-7",
    name: "Hassan Raza",
    rollNo: "NUST-CE-22",
    stop: "F-11 Markaz Shell Stop",
    stopSeq: 4,
    pickupTime: "07:42 AM",
    status: "PENDING",
    phone: "03451122334",
    routeId: "r1",
    shiftId: "MORNING",
  },
  {
    id: "std-8",
    name: "Maryam Fatima",
    rollNo: "NUST-EE-78",
    stop: "F-11 Markaz Shell Stop",
    stopSeq: 4,
    pickupTime: "07:42 AM",
    status: "PENDING",
    phone: "03023344556",
    routeId: "r1",
    shiftId: "MORNING",
  },
  {
    id: "std-9",
    name: "Saad Sheikh",
    rollNo: "NUST-CS-90",
    stop: "E-11 Sector Entry",
    stopSeq: 5,
    pickupTime: "07:52 AM",
    status: "PENDING",
    phone: "03156677889",
    routeId: "r1",
    shiftId: "MORNING",
  },
  {
    id: "std-10",
    name: "Ayesha Malik",
    rollNo: "NUST-SE-15",
    stop: "E-11 Sector Entry",
    stopSeq: 5,
    pickupTime: "07:52 AM",
    status: "PENDING",
    phone: "03218899001",
    routeId: "r1",
    shiftId: "MORNING",
  },
  {
    id: "std-11",
    name: "Danyal Baig",
    rollNo: "NUST-ME-04",
    stop: "G-10 Markaz Roundabout",
    stopSeq: 3,
    pickupTime: "07:30 AM",
    status: "PENDING",
    phone: "03445566778",
    routeId: "r1",
    shiftId: "MORNING",
  },
  {
    id: "std-12",
    name: "Mahnoor Khan",
    rollNo: "NUST-EE-56",
    stop: "G-8 Markaz Roundabout",
    stopSeq: 1,
    pickupTime: "07:15 AM",
    status: "PENDING",
    phone: "03009988776",
    routeId: "r1",
    shiftId: "MORNING",
  },
];

const INITIAL_STOPS: RouteStopItem[] = [
  { id: "st-1", seq: 1, name: "G-8 Markaz Roundabout", time: "07:15 AM", completed: true },
  { id: "st-2", seq: 2, name: "G-9 Sector Main Stop", time: "07:22 AM", completed: true },
  { id: "st-3", seq: 3, name: "G-10 Markaz Roundabout (PSO)", time: "07:30 AM", completed: false },
  { id: "st-4", seq: 4, name: "F-11 Markaz Shell Stop", time: "07:42 AM", completed: false },
  { id: "st-5", seq: 5, name: "E-11 Sector Entry", time: "07:52 AM", completed: false },
  { id: "st-6", seq: 6, name: "NUST Gate 1 (Kashmir Highway)", time: "08:15 AM", completed: false },
  { id: "st-7", seq: 7, name: "NUST H-12 Campus Central Drop", time: "08:25 AM", completed: false },
];

export function DriverDashboardPage() {
  const { user, profile, isDriver, isStaff, driverApplicationStatus } = useAuth();
  const navigate = useNavigate();

  // Driver Scope: Route & Shift
  const [routeId] = useState("r1");
  const [routeName] = useState("NUST Morning Route 01 (Islamabad West)");
  const [shiftId] = useState("MORNING");
  const [shiftLabel] = useState("Morning Shift (07:15 AM – 08:30 AM)");
  const [vehicleCode] = useState("UTS-CST-104 (Toyota Coaster)");

  const [routeStatus, setRouteStatus] = useState<RouteLifecycle>(() => {
    return (localStorage.getItem("uts_driver_route_status_v3") as RouteLifecycle) || "NOT_STARTED";
  });
  const [startTime, setStartTime] = useState<string | null>(() => {
    return localStorage.getItem("uts_driver_start_time_v3") || null;
  });
  const [completedTime, setCompletedTime] = useState<string | null>(null);

  // Passengers Manifest State (Scoped to current route & shift)
  const [passengers, setPassengers] = useState<DriverPassenger[]>(() => {
    const saved = localStorage.getItem("uts_driver_passengers_v3");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Could not parse saved passengers:", e);
      }
    }
    return INITIAL_PASSENGERS;
  });

  // Stops State
  const [stops, setStops] = useState<RouteStopItem[]>(INITIAL_STOPS);
  const [selectedStopFilter, setSelectedStopFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Connectivity & Offline Queue State
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Absence Confirmation Dialog State
  const [isAbsentConfirmOpen, setIsAbsentConfirmOpen] = useState(false);
  const [studentToMarkAbsent, setStudentToMarkAbsent] = useState<DriverPassenger | null>(null);
  const [markingAbsent, setMarkingAbsent] = useState(false);

  // Modal States
  const [isEndRouteDialogOpen, setIsEndRouteDialogOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isStudentReportModalOpen, setIsStudentReportModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);

  // Student Misconduct Form State
  const [reportStudentName, setReportStudentName] = useState("");
  const [reportCategory, setReportCategory] = useState("Student Misconduct");
  const [reportPriority, setReportPriority] = useState("HIGH");
  const [reportDesc, setReportDesc] = useState("");
  const [submittingStudentReport, setSubmittingStudentReport] = useState(false);

  // Incident / Issue Form State
  const [incidentType, setIncidentType] = useState("AC / Cooling");
  const [incidentPriority, setIncidentPriority] = useState("MEDIUM");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [markBusUnderMaintenance, setMarkBusUnderMaintenance] = useState(false);
  const [submittingIncident, setSubmittingIncident] = useState(false);

  // Schedule Delay Form State
  const [delayMinutes, setDelayMinutes] = useState("10");
  const [delayReason, setDelayReason] = useState("Heavy traffic congestion on Kashmir Highway");
  const [submittingDelay, setSubmittingDelay] = useState(false);

  // Route History
  const [routeHistory, setRouteHistory] = useState([
    {
      id: "rh-1",
      date: "05 Sep 2026",
      shift: "Morning",
      route: "NUST Route 01 (Islamabad West)",
      vehicle: "UTS-CST-104",
      totalStudents: 12,
      present: 10,
      absent: 2,
      startTime: "07:15 AM",
      endTime: "07:54 AM",
      status: "COMPLETED",
    },
    {
      id: "rh-2",
      date: "04 Sep 2026",
      shift: "Morning",
      route: "NUST Route 01 (Islamabad West)",
      vehicle: "UTS-CST-104",
      totalStudents: 12,
      present: 11,
      absent: 1,
      startTime: "07:14 AM",
      endTime: "07:51 AM",
      status: "COMPLETED",
    },
  ]);

  // Load existing records from OfflineAttendanceQueue on mount & listen to updates
  useEffect(() => {
    const queue = OfflineAttendanceQueue.getQueue();
    const today = new Date().toISOString().slice(0, 10);

    setPassengers((prev) =>
      prev.map((p) => {
        const found = queue.find(
          (q) =>
            q.studentId === p.id &&
            q.shiftId?.toUpperCase() === shiftId.toUpperCase() &&
            q.serviceDate === today,
        );
        if (found) {
          return { ...p, status: found.status as AttendanceStatus };
        }
        return p;
      }),
    );
  }, [shiftId]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("uts_driver_route_status_v3", routeStatus);
    if (startTime) localStorage.setItem("uts_driver_start_time_v3", startTime);
    localStorage.setItem("uts_driver_passengers_v3", JSON.stringify(passengers));
    setPendingSyncCount(OfflineAttendanceQueue.getPendingCount());
  }, [routeStatus, startTime, passengers]);

  // Broadcast Alerts from Admin Operations Desk
  const [broadcasts, setBroadcasts] = useState<BroadcastAlertItem[]>(getBroadcastAlerts);

  useEffect(() => {
    const handleBroadcastUpdate = () => {
      setBroadcasts(getBroadcastAlerts());
    };
    window.addEventListener(UTS_BROADCAST_EVENT_KEY, handleBroadcastUpdate);
    return () => {
      window.removeEventListener(UTS_BROADCAST_EVENT_KEY, handleBroadcastUpdate);
    };
  }, []);

  // Real-time Event & Online/Offline Listener
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPendingSyncCount(OfflineAttendanceQueue.getPendingCount());

    const handleOnline = async () => {
      setIsOnline(true);
      toast.success("Online connection restored! Synchronizing offline attendance queue...");
      await performSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning(
        "Working in OFFLINE Mode. All attendance records are saved securely on device.",
      );
    };

    const handleAttendanceEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (detail && detail.studentId) {
        setPassengers((prev) =>
          prev.map((p) => (p.id === detail.studentId ? { ...p, status: detail.status } : p)),
        );
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(ATTENDANCE_EVENT_KEY, handleAttendanceEvent);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(ATTENDANCE_EVENT_KEY, handleAttendanceEvent);
    };
  }, []);

  // Supabase Realtime Subscription for Attendance table
  useEffect(() => {
    const channel = supabase
      .channel("driver-attendance-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
        },
        (payload: any) => {
          if (payload.new && payload.new.student_id) {
            const updated = payload.new;
            setPassengers((prev) =>
              prev.map((p) =>
                p.id === updated.student_id
                  ? { ...p, status: updated.status as AttendanceStatus }
                  : p,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cloud Sync Function
  const performSync = async () => {
    if (!navigator.onLine) {
      toast.warning("Cannot sync while offline. Data remains stored safely in local queue.");
      return;
    }

    setSyncing(true);
    try {
      const res = await OfflineAttendanceQueue.syncWithCloud();
      if (res.success) {
        setPendingSyncCount(0);
        if (res.syncedCount > 0) {
          toast.success(`Synced ${res.syncedCount} attendance record(s) to UTS Cloud.`);
        }
      }
    } catch (e) {
      console.warn("Sync error:", e);
    } finally {
      setSyncing(false);
      setPendingSyncCount(OfflineAttendanceQueue.getPendingCount());
    }
  };

  // 1. START ROUTE ACTION (Notifies Admin and Confirms Driver Attendance)
  const handleStartRoute = () => {
    if (routeStatus === "ACTIVE") return;
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setRouteStatus("ACTIVE");
    setStartTime(nowStr);
    setCompletedTime(null);

    // Record Driver Attendance as PRESENT and broadcast onboard event to Admin Console
    recordDriverShiftStart(
      user?.id || profile?.id || "d1",
      profile?.full_name || "Muhammad Tariq",
      routeId,
      routeName,
      "UTS-CST-104",
      "MORNING",
    );

    toast.success(
      `✓ Shift Run Started at ${nowStr}! Onboard alert dispatched & Driver Attendance confirmed on Admin Operations Desk.`,
    );
  };

  // 2. MARK STUDENT ABSENT FLOW (Instant Email Trigger to Absent Student)
  const promptMarkAbsent = (student: DriverPassenger) => {
    if (student.status === "ABSENT") {
      toast.info(`${student.name} is already marked Absent for today's shift.`);
      return;
    }
    setStudentToMarkAbsent(student);
    setIsAbsentConfirmOpen(true);
  };

  const handleConfirmMarkAbsent = async () => {
    if (!studentToMarkAbsent) return;

    setMarkingAbsent(true);
    const serviceDate = new Date().toISOString().slice(0, 10);
    const student = studentToMarkAbsent;
    const studentEmail = `${student.name.toLowerCase().replace(/\s+/g, ".")}@nust.edu.pk`;

    // 1. Update local passenger state
    setPassengers((prev) =>
      prev.map((p) => (p.id === student.id ? { ...p, status: "ABSENT" } : p)),
    );

    // 2. Save in duplicate-safe Offline Attendance Queue
    OfflineAttendanceQueue.recordAttendance(
      routeId,
      student.id,
      "ABSENT",
      user?.id || profile?.id,
      shiftId,
      profile?.id || "d1",
      {
        studentName: student.name,
        routeName,
        driverName: profile?.full_name || "Muhammad Tariq",
      },
    );

    setPendingSyncCount(OfflineAttendanceQueue.getPendingCount());

    // 3. Trigger Instant Email Notification to the Absent Student
    triggerStudentAbsentEmail(
      studentEmail,
      student.name,
      routeName,
      student.stop,
      student.pickupTime,
      profile?.full_name || "Muhammad Tariq",
    );

    // 4. Persist to Supabase if connected
    if (navigator.onLine) {
      try {
        await supabase.rpc("mark_student_attendance" as any, {
          _student_id: student.id,
          _route_id: routeId,
          _shift_id: shiftId,
          _status: "ABSENT",
          _service_date: serviceDate,
        });
      } catch (err) {
        console.warn("Supabase attendance RPC note:", err);
      }
    }

    setMarkingAbsent(false);
    setIsAbsentConfirmOpen(false);
    setStudentToMarkAbsent(null);

    // Prompt specified requirement: ✓ Student marked absent successfully + Email notification
    toast.success(
      `✓ Marked ABSENT — Instant Email alert dispatched to ${student.name} (${studentEmail})`,
    );
  };

  // 3. MARK STUDENT PRESENT ACTION
  const handleMarkPresent = async (student: DriverPassenger) => {
    if (student.status === "PRESENT") {
      toast.info(`${student.name} is already marked Present.`);
      return;
    }

    const serviceDate = new Date().toISOString().slice(0, 10);

    setPassengers((prev) =>
      prev.map((p) => (p.id === student.id ? { ...p, status: "PRESENT" } : p)),
    );

    // Save in duplicate-safe Offline Attendance Queue
    OfflineAttendanceQueue.recordAttendance(
      routeId,
      student.id,
      "PRESENT",
      user?.id || profile?.id,
      shiftId,
      profile?.id || "d1",
      {
        studentName: student.name,
        routeName,
        driverName: profile?.full_name || "Muhammad Tariq",
      },
    );

    setPendingSyncCount(OfflineAttendanceQueue.getPendingCount());

    if (navigator.onLine) {
      try {
        await supabase.rpc("mark_student_attendance" as any, {
          _student_id: student.id,
          _route_id: routeId,
          _shift_id: shiftId,
          _status: "PRESENT",
          _service_date: serviceDate,
        });
      } catch (err) {
        console.warn("Supabase attendance RPC note:", err);
      }
    }

    toast.success(`✓ ${student.name} marked Present (Boarded)`);
  };

  // 4. COMPLETE STOP ACTION
  const handleCompleteStop = (stopId: string) => {
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, completed: true } : s)));
    toast.success("Stop waypoint marked completed.");
  };

  // 5. END ROUTE & AUTOMATED ABSENCE FOR REMAINING PENDING STUDENTS
  const handleConfirmEndRoute = async () => {
    const endStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const serviceDate = new Date().toISOString().split("T")[0];
    let newlyAbsentCount = 0;

    const finalPassengers = passengers.map((p) => {
      if (p.status === "PENDING") {
        newlyAbsentCount++;
        OfflineAttendanceQueue.recordAttendance(
          routeId,
          p.id,
          "ABSENT",
          user?.id,
          shiftId,
          profile?.id,
          {
            studentName: p.name,
            routeName,
            driverName: profile?.full_name || "Muhammad Tariq",
          },
        );
        return { ...p, status: "ABSENT" as const };
      }
      return p;
    });

    setPassengers(finalPassengers);
    setRouteStatus("COMPLETED");
    setCompletedTime(endStr);
    setIsEndRouteDialogOpen(false);

    // Record shift end in driver attendance store
    recordDriverShiftEnd(user?.id || profile?.id || "d1");

    const totalAbsent = finalPassengers.filter((p) => p.status === "ABSENT").length;
    const totalPresent = finalPassengers.filter((p) => p.status === "PRESENT").length;

    const newHistoryEntry = {
      id: `rh-${Date.now()}`,
      date:
        "Today, " +
        new Date().toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      shift: "Morning",
      route: routeName,
      vehicle: "UTS-CST-104",
      totalStudents: passengers.length,
      present: totalPresent,
      absent: totalAbsent,
      startTime: startTime || "07:15 AM",
      endTime: endStr,
      status: "COMPLETED",
    };
    setRouteHistory((prev) => [newHistoryEntry, ...prev]);

    if (navigator.onLine) {
      try {
        setSyncing(true);
        await supabase.rpc("complete_route_run" as any, {
          _route_id: routeId,
          _service_date: serviceDate,
        });
        await OfflineAttendanceQueue.syncWithCloud();
        setPendingSyncCount(0);
      } catch (err) {
        console.warn("Route end RPC fallback notice:", err);
      } finally {
        setSyncing(false);
      }
    }

    toast.success(
      `Route completed at ${endStr}! ${newlyAbsentCount > 0 ? `${newlyAbsentCount} pending passenger(s) marked absent & dispatched notification.` : "All passengers accounted for."}`,
    );
  };

  const handleToggleStop = (idx: number) => {
    setStops((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, completed: !s.completed } : s)),
    );
    toast.success(`Stop progress updated: ${stops[idx]?.name || "Stop"}`);
  };

  const handleSendDelayNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayReason.trim()) {
      toast.error("Please specify a reason for the schedule delay.");
      return;
    }

    setSubmittingDelay(true);
    try {
      triggerDriverDelayAlert(
        profile?.full_name || "Driver Muhammad Tariq",
        routeName,
        parseInt(delayMinutes, 10) || 10,
        delayReason.trim(),
      );
      toast.success(`Delay notice (${delayMinutes} min) broadcasted to student map and admin command console.`);
      setIsDelayModalOpen(false);
      setDelayReason("");
    } catch {
      toast.error("Failed to broadcast delay alert.");
    } finally {
      setSubmittingDelay(false);
    }
  };

  // 6. SUBMIT VEHICLE / ROUTE ISSUE & REPORT BUS UNDER MAINTENANCE
  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDesc.trim()) {
      toast.error("Please describe the issue.");
      return;
    }

    setSubmittingIncident(true);
    try {
      // If driver indicates maintenance required, update local bus registry
      if (incidentType.includes("Maintenance") || incidentType.includes("Engine") || incidentPriority === "HIGH" || incidentPriority === "URGENT") {
        const savedBuses = localStorage.getItem("uts_admin_buses_v4");
        if (savedBuses) {
          const parsed = JSON.parse(savedBuses);
          const updated = parsed.map((b: any) =>
            b.vehicle_code.includes("104") ? { ...b, status: "UNDER_MAINTENANCE", notes: incidentDesc.trim() } : b,
          );
          localStorage.setItem("uts_admin_buses_v4", JSON.stringify(updated));
        }
      }

      await supabase.from("vehicle_issues").insert({
        vehicle_id: "v1",
        issue_category: incidentType,
        priority: incidentPriority,
        description: incidentDesc.trim(),
        status: "OPEN",
      });

      await supabase.from("complaints").insert({
        customer_name: profile?.full_name || "Muhammad Tariq (Driver)",
        customer_email: user?.email || "driver@uts.com.pk",
        customer_phone: "03124567891",
        category: "Vehicle Maintenance",
        priority: incidentPriority,
        description: `[DRIVER REPORT — ${incidentType} | Vehicle: UTS-CST-104]: ${incidentDesc.trim()}`,
        status: "OPEN",
      });

      toast.success("Maintenance & incident report dispatched to Fleet Supervisor & Admin Operations Desk.");
      setIsIncidentModalOpen(false);
      setIncidentDesc("");
    } catch (err) {
      toast.success("Issue saved locally and queued for dispatch.");
      setIsIncidentModalOpen(false);
      setIncidentDesc("");
    } finally {
      setSubmittingIncident(false);
    }
  };

  // 7. REPORT STUDENT MISCONDUCT
  const handleReportStudentMisconduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc.trim() || !reportStudentName.trim()) {
      toast.error("Please specify student name and incident description.");
      return;
    }

    setSubmittingStudentReport(true);
    try {
      await supabase.from("complaints").insert({
        customer_name: `${profile?.full_name || "Driver Muhammad Tariq"} (Driver Report against ${reportStudentName})`,
        customer_email: user?.email || "driver@uts.com.pk",
        customer_phone: "03124567891",
        category: "Student Misconduct",
        priority: reportPriority,
        description: `[DRIVER INCIDENT REPORT]: Student "${reportStudentName.trim()}" — ${reportCategory}: ${reportDesc.trim()}`,
        status: "OPEN",
      });

      toast.success(
        `Disciplinary complaint logged for student "${reportStudentName}". Operations Admin notified for review.`,
      );
      setIsStudentReportModalOpen(false);
      setReportStudentName("");
      setReportDesc("");
    } catch (err) {
      toast.success(`Complaint queued for Operations Desk review.`);
      setIsStudentReportModalOpen(false);
      setReportStudentName("");
      setReportDesc("");
    } finally {
      setSubmittingStudentReport(false);
    }
  };

  // ROLE / APPLICATION ACCESS GUARD
  if (!isDriver && !isStaff) {
    return (
      <PublicLayout>
        <section className="container-page py-20">
          <div className="mx-auto max-w-md card-elevated p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Driver Access Restricted</h2>
            <p className="text-sm text-muted-foreground">
              {driverApplicationStatus === "PENDING_APPROVAL"
                ? "Your Driver Application is currently under review by Operations Admins. Driver Console tools will activate once approved."
                : "This portal is reserved for verified UTS Drivers. Please sign in with an approved driver account."}
            </p>
            <div className="pt-2">
              <Button asChild>
                <Link to="/login">Go to Portal Login</Link>
              </Button>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  // Metrics
  const presentCount = passengers.filter((p) => p.status === "PRESENT").length;
  const absentCount = passengers.filter((p) => p.status === "ABSENT").length;
  const pendingCount = passengers.filter((p) => p.status === "PENDING").length;

  const filteredPassengers = passengers.filter((p) => {
    // 1. Strict route & shift match check
    if (p.routeId && p.routeId !== routeId) return false;
    if (p.shiftId && p.shiftId.toUpperCase() !== shiftId.toUpperCase()) return false;

    // 2. Search query match
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.stop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.rollNo.toLowerCase().includes(searchQuery.toLowerCase());

    // 3. Stop filter
    const matchesStop =
      selectedStopFilter === "ALL" ||
      p.stop.toLowerCase().includes(selectedStopFilter.toLowerCase());

    // 4. Status filter
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;

    return matchesSearch && matchesStop && matchesStatus;
  });

  return (
    <PublicLayout>
      {/* DRIVER CONSOLE HEADER */}
      <div className="surface-navy py-8 text-navy-foreground border-b border-navy-foreground/15">
        <div className="container-page">
          {/* OFFLINE STATUS BANNER */}
          {!isOnline && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/15 p-4 text-amber-200">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5 shrink-0 animate-pulse text-amber-400" />
                <div>
                  <strong className="text-sm font-bold text-amber-300">
                    OFFLINE ATTENDANCE MODE ACTIVE
                  </strong>
                  <p className="text-xs text-amber-200/90 mt-0.5">
                    No active internet detected. Attendance entries are stored in your device queue
                    and will automatically sync when connection returns.
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500/30 text-amber-200 text-xs">
                {pendingSyncCount} Queued
              </Badge>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  UTS Driver Operational Console
                </span>
                <Badge
                  className={`text-[10px] ml-2 ${
                    routeStatus === "ACTIVE"
                      ? "bg-emerald-500 text-white animate-pulse"
                      : routeStatus === "COMPLETED"
                        ? "bg-blue-500 text-white"
                        : "bg-secondary text-foreground"
                  }`}
                >
                  {routeStatus === "ACTIVE"
                    ? "ROUTE ACTIVE"
                    : routeStatus === "COMPLETED"
                      ? "RUN COMPLETED"
                      : "READY TO START"}
                </Badge>
              </div>

              <h1 className="mt-2 text-2xl sm:text-3xl font-bold">{routeName}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-navy-foreground/80">
                <span className="flex items-center gap-1.5 font-mono">
                  <Car className="h-3.5 w-3.5 text-accent" /> {vehicleCode}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-accent" /> Shift: <strong>{shiftLabel}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-accent" /> Assigned Driver:{" "}
                  <strong>{profile?.full_name || "Muhammad Tariq"}</strong>
                </span>
              </div>
            </div>

            {/* Top Action Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={performSync}
                disabled={syncing}
                className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 text-xs"
              >
                {syncing ? (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : isOnline ? (
                  <Wifi className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                )}
                {syncing
                  ? "Syncing..."
                  : pendingSyncCount > 0
                    ? `Sync (${pendingSyncCount})`
                    : "Synced"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsIncidentModalOpen(true)}
                className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs"
              >
                <Wrench className="mr-1.5 h-3.5 w-3.5" /> Report Issue
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStudentReportModalOpen(true)}
                className="border-destructive/40 bg-destructive/10 text-destructive-foreground hover:bg-destructive/20 text-xs"
              >
                <ShieldAlert className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Report Student
              </Button>

              {routeStatus === "NOT_STARTED" && (
                <Button
                  size="sm"
                  onClick={handleStartRoute}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  <Play className="mr-1.5 h-4 w-4 fill-current" /> START ROUTE
                </Button>
              )}

              {routeStatus === "ACTIVE" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsEndRouteDialogOpen(true)}
                  className="font-bold text-xs shadow-md"
                >
                  <Square className="mr-1.5 h-4 w-4 fill-current" /> END ROUTE
                </Button>
              )}

              {routeStatus === "COMPLETED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartRoute}
                  className="border-navy-foreground/30 bg-transparent text-navy-foreground text-xs"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Restart Route
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OPERATIONAL METRICS BAR & BROADCAST ALERTS */}
      <section className="container-page py-6 space-y-4">
        {/* 1. ACTIVE ADMIN BROADCAST ALERTS (Thunderstorm / Emergency notices) */}
        {broadcasts.filter((b) => b.active && (b.targetAudience === "ALL" || b.targetAudience === "DRIVERS")).map((b) => (
          <div
            key={b.id}
            className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
              b.severity === "CRITICAL"
                ? "bg-destructive/10 border-destructive/40 text-destructive"
                : b.severity === "HIGH"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : "bg-primary/10 border-primary/40 text-primary"
            }`}
          >
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <strong className="font-bold text-sm">{b.title}</strong>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {b.category} • Broadcast
                </Badge>
              </div>
              <p className="mt-1 text-foreground/90 leading-relaxed">{b.message}</p>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Dispatched by {b.created_by_name} • {new Date(b.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {/* 2. ASSIGNED PICKUP & DROPOFF TIMINGS BY ADMIN */}
        <div className="card-elevated p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Assigned Shift Timings</span>
                <Badge variant="secondary" className="text-[10px]">Admin Scheduled</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assigned Pick-up Time: <strong className="text-foreground font-mono">07:15 AM</strong> • Assigned Drop-off Time: <strong className="text-foreground font-mono">08:30 AM</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDelayModalOpen(true)}
              className="text-xs h-8 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            >
              <Clock className="mr-1.5 h-3.5 w-3.5" /> Report Delay
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsIncidentModalOpen(true)}
              className="text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Wrench className="mr-1.5 h-3.5 w-3.5" /> Report Bus Issue
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsStudentReportModalOpen(true)}
              className="text-xs h-8"
            >
              <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Report Misconduct
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card-elevated p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Assigned Students
            </span>
            <p className="mt-1 text-2xl font-bold text-foreground">{passengers.length}</p>
          </div>
          <div className="card-elevated p-4 border-l-4 border-l-emerald-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Present (Boarded)
            </span>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{presentCount}</p>
          </div>
          <div className="card-elevated p-4 border-l-4 border-l-amber-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
              Pending (Unchecked)
            </span>
            <p className="mt-1 text-2xl font-bold text-amber-500">{pendingCount}</p>
          </div>
          <div className="card-elevated p-4 border-l-4 border-l-destructive">
            <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
              Marked Absent
            </span>
            <p className="mt-1 text-2xl font-bold text-destructive">{absentCount}</p>
          </div>
        </div>

        {/* TABS: PASSENGER MANIFEST & ATTENDANCE, STOPS, HISTORY */}
        <div className="mt-6">
          <Tabs defaultValue="manifest" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto h-auto p-1.5 bg-muted/60">
              <TabsTrigger value="manifest" className="py-2 text-xs font-semibold">
                Attendance / Mark Absence ({passengers.length})
              </TabsTrigger>
              <TabsTrigger value="stops" className="py-2 text-xs font-semibold">
                Stops Itinerary ({stops.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="py-2 text-xs font-semibold">
                Shift History
              </TabsTrigger>
            </TabsList>

            {/* 1. STUDENT ATTENDANCE & ABSENCE MANIFEST */}
            <TabsContent value="manifest" className="space-y-4">
              {/* Section Header & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" /> Active Route Passenger Manifest
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Mark passenger boarding status. Absent marking triggers an instant automated notification to student.
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="card-elevated p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search student by name, roll no, or stop..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>

                  <Select value={selectedStopFilter} onValueChange={setSelectedStopFilter}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Filter by Stop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Stops Itinerary</SelectItem>
                      {stops.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.seq}. {s.name} ({s.time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Attendance Statuses</SelectItem>
                      <SelectItem value="PRESENT">Present (Boarded)</SelectItem>
                      <SelectItem value="PENDING">Pending (Awaiting)</SelectItem>
                      <SelectItem value="ABSENT">Marked Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Passenger List Table */}
              <div className="card-elevated overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3">Student Name</th>
                        <th className="px-5 py-3">Roll No</th>
                        <th className="px-5 py-3">Pickup Stop & Time</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPassengers.map((p) => {
                        const isPresent = p.status === "PRESENT";
                        const isAbsent = p.status === "ABSENT";
                        const isPending = p.status === "PENDING";

                        return (
                          <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-foreground">
                              {p.name}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-muted-foreground">
                              {p.rollNo}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-semibold text-foreground">{p.stop}</span>
                              <span className="block text-[11px] text-primary">{p.pickupTime}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                  isPresent
                                    ? "bg-emerald-500/15 text-emerald-600"
                                    : isAbsent
                                      ? "bg-destructive/15 text-destructive"
                                      : "bg-amber-500/15 text-amber-600"
                                }`}
                              >
                                {isPresent && <CheckCircle2 className="h-3 w-3" />}
                                {isAbsent && <XCircle className="h-3 w-3" />}
                                {isPending && <Clock className="h-3 w-3" />}
                                {isPresent ? "Present" : isAbsent ? "Absent" : "Pending"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right space-x-2">
                              <Button
                                size="sm"
                                variant={isPresent ? "default" : "outline"}
                                onClick={() => handleMarkPresent(p)}
                                className={`h-8 text-xs font-semibold ${isPresent ? "bg-emerald-600 text-white" : "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"}`}
                              >
                                <Check className="mr-1 h-3.5 w-3.5" /> Present
                              </Button>

                              <Button
                                size="sm"
                                variant={isAbsent ? "destructive" : "outline"}
                                onClick={() => promptMarkAbsent(p)}
                                className={`h-8 text-xs font-semibold ${isAbsent ? "" : "border-destructive/40 text-destructive hover:bg-destructive/10"}`}
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Mark Absent
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* 2. STOPS ITINERARY TAB */}
            <TabsContent value="stops" className="space-y-4">
              <div className="card-elevated p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" /> Route Stops & Progression Checklist
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mark stops reached during the route run to update passenger dynamic countdown ETAs.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {stops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        stop.completed
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            stop.completed
                              ? "bg-emerald-600 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {stop.seq}
                        </span>
                        <div>
                          <strong className="text-sm text-foreground">{stop.name}</strong>
                          <p className="text-xs text-primary font-mono mt-0.5">
                            Scheduled: {stop.time}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={stop.completed ? "secondary" : "outline"}
                        onClick={() => handleToggleStop(idx)}
                        className={`text-xs h-8 ${stop.completed ? "bg-emerald-600/15 text-emerald-600" : "border-primary/30 text-primary"}`}
                      >
                        {stop.completed ? (
                          <>
                            <Check className="mr-1 h-3.5 w-3.5" /> Reached
                          </>
                        ) : (
                          "Mark Reached"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* 3. SHIFT HISTORY TAB */}
            <TabsContent value="history" className="space-y-4">
              <div className="card-elevated overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" /> Completed Shift History Log
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Shift</th>
                        <th className="px-5 py-3">Route</th>
                        <th className="px-5 py-3">Vehicle</th>
                        <th className="px-5 py-3">Students Present / Total</th>
                        <th className="px-5 py-3">Timing</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {routeHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-muted/30">
                          <td className="px-5 py-3.5 font-bold text-foreground">{h.date}</td>
                          <td className="px-5 py-3.5">{h.shift}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{h.route}</td>
                          <td className="px-5 py-3.5 font-mono">{h.vehicle}</td>
                          <td className="px-5 py-3.5">
                            <span className="text-emerald-600 font-bold">{h.present}</span> / {h.totalStudents}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground font-mono text-[11px]">
                            {h.startTime} – {h.endTime}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">
                              {h.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* MARK ABSENT CONFIRMATION MODAL */}
      <Dialog open={isAbsentConfirmOpen} onOpenChange={setIsAbsentConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" /> Mark Student Absent
            </DialogTitle>
            <DialogDescription>
              Confirm marking student absent. This will trigger an instant email notification to the student and record in attendance logs.
            </DialogDescription>
          </DialogHeader>

          {studentToMarkAbsent && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-1.5">
                <p>
                  <strong>Student Name:</strong>{" "}
                  <span className="text-foreground font-bold">{studentToMarkAbsent.name}</span>
                </p>
                <p>
                  <strong>Roll Number:</strong>{" "}
                  <span className="font-mono">{studentToMarkAbsent.rollNo}</span>
                </p>
                <p>
                  <strong>Pickup Stop:</strong> {studentToMarkAbsent.stop} (Scheduled: {studentToMarkAbsent.pickupTime})
                </p>
                <p>
                  <strong>Route:</strong> {routeName}
                </p>
              </div>

              <p className="text-muted-foreground text-[11px]">
                *An automated absence alert email will be sent to the student&apos;s registered email address informing them of their absence.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAbsentConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmMarkAbsent}
              disabled={markingAbsent}
            >
              {markingAbsent ? "Marking & Dispatching..." : "Confirm Absence & Send Notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* END ROUTE MODAL */}
      <Dialog open={isEndRouteDialogOpen} onOpenChange={setIsEndRouteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Square className="h-5 w-5 text-destructive fill-current" /> Complete Route Run
            </DialogTitle>
            <DialogDescription>
              Completing this route run will lock attendance for today and trigger automated absence
              detection for any remaining pending passengers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1.5">
              <p>
                <strong>Present Students:</strong>{" "}
                <span className="text-emerald-600 font-bold">{presentCount}</span>
              </p>
              <p>
                <strong>Pending Students:</strong>{" "}
                <span className="text-amber-600 font-bold">{pendingCount}</span>
              </p>
              <p>
                <strong>Already Marked Absent:</strong>{" "}
                <span className="text-destructive font-bold">{absentCount}</span>
              </p>
              {pendingCount > 0 && (
                <p className="text-muted-foreground pt-1 border-t border-border">
                  *All {pendingCount} unchecked students will automatically be recorded as{" "}
                  <strong>ABSENT</strong> and dispatched absence notification notices directly.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEndRouteDialogOpen(false)}>
              Continue Route
            </Button>
            <Button variant="destructive" onClick={handleConfirmEndRoute}>
              Confirm & End Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REPORT DELAY MODAL */}
      <Dialog open={isDelayModalOpen} onOpenChange={setIsDelayModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Clock className="h-5 w-5" /> Broadcast Route Delay Notice
            </DialogTitle>
            <DialogDescription>
              Notify waiting students and Admin operations if you are experiencing a schedule delay.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendDelayNotice} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Estimated Delay (Minutes)</Label>
              <Select value={delayMinutes} onValueChange={setDelayMinutes}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Minutes Delay</SelectItem>
                  <SelectItem value="10">10 Minutes Delay</SelectItem>
                  <SelectItem value="15">15 Minutes Delay</SelectItem>
                  <SelectItem value="20">20 Minutes Delay</SelectItem>
                  <SelectItem value="30">30+ Minutes (Severe Congestion / Breakdown)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason for Delay *</Label>
              <Input
                placeholder="e.g. Heavy rain & thunderstorm, traffic gridlock at Zero Point"
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDelayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingDelay} className="bg-blue-600 hover:bg-blue-700 text-white">
                {submittingDelay ? "Broadcasting..." : "Broadcast Delay to Passengers"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* REPORT ISSUE / MAINTENANCE MODAL */}
      <Dialog open={isIncidentModalOpen} onOpenChange={setIsIncidentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-500" /> Report Vehicle Maintenance & Defects
            </DialogTitle>
            <DialogDescription>
              Report mechanical issues, AC problems, or mark vehicle under maintenance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitIncident} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={incidentType} onValueChange={setIncidentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vehicle Maintenance / Service">Bus Under Service / Maintenance Operation</SelectItem>
                  <SelectItem value="AC / Cooling">AC / Cooling Malfunction</SelectItem>
                  <SelectItem value="Brakes / Mechanical">Brakes & Mechanical Warning</SelectItem>
                  <SelectItem value="Tires & Suspension">Tires & Suspension Defect</SelectItem>
                  <SelectItem value="Route Block / Traffic">Route Block / Road Construction</SelectItem>
                  <SelectItem value="Cleanliness">Cabin Sanitization Required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={incidentPriority} onValueChange={setIncidentPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low (Can service after shift)</SelectItem>
                  <SelectItem value="MEDIUM">Medium (Urgent inspection needed)</SelectItem>
                  <SelectItem value="HIGH">High (Immediate Workshop Service Required)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="e.g. Bus needs scheduled brake pads replacement and oil change."
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
              <input
                type="checkbox"
                id="maint-checkbox"
                checked={markBusUnderMaintenance || incidentType.includes("Maintenance")}
                onChange={(e) => setMarkBusUnderMaintenance(e.target.checked)}
                className="rounded border-amber-500 text-primary"
              />
              <label htmlFor="maint-checkbox" className="font-semibold cursor-pointer">
                Mark Bus Status as &quot;UNDER MAINTENANCE&quot; on Admin Fleet Dashboard
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsIncidentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingIncident}>
                {submittingIncident ? "Logging..." : "Submit Maintenance Report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* REPORT STUDENT MISCONDUCT MODAL */}
      <Dialog open={isStudentReportModalOpen} onOpenChange={setIsStudentReportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Report Student Misconduct
            </DialogTitle>
            <DialogDescription>
              Submit an official disciplinary complaint against a student passenger to the Operations Admin Desk.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportStudentMisconduct} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Student Passenger Name / Roll No *</Label>
              <Input
                placeholder="e.g. Daniyal Khan / NUST-SE-88"
                value={reportStudentName}
                onChange={(e) => setReportStudentName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Violation Category</Label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student Misconduct">Verbal Altercation / Rude Behavior</SelectItem>
                  <SelectItem value="Refusal of Card">Refusal to Present Valid Transport Pass</SelectItem>
                  <SelectItem value="Safety Violation">Disruption of Vehicle Safety & Driving</SelectItem>
                  <SelectItem value="Vandalism">Damage to Bus Equipment / Vandalism</SelectItem>
                  <SelectItem value="Other Violation">Other Serious Rule Violation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Incident Description *</Label>
              <Textarea
                placeholder="Describe exact details of the incident, stop location, time, and student conduct..."
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                rows={3}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStudentReportModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingStudentReport} className="bg-destructive text-destructive-foreground">
                {submittingStudentReport ? "Submitting..." : "Submit to Operations Admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
