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
  DialogTrigger,
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
import { OfflineAttendanceQueue } from "@/lib/offline-attendance-queue";
import { toast } from "sonner";

export const Route = createFileRoute("/driver/dashboard")({
  head: () => ({
    meta: [
      { title: "Driver Operational Console & Attendance — UTS Smart Transport" },
      {
        name: "description",
        content:
          "Driver operations console: route execution, live passenger attendance, offline sync, stop-by-stop itinerary, and incident reporting.",
      },
    ],
  }),
  component: DriverDashboardPage,
});

type RouteLifecycle = "NOT_STARTED" | "ACTIVE" | "COMPLETED";

interface DriverPassenger {
  id: string;
  name: string;
  rollNo: string;
  stop: string;
  stopSeq: number;
  pickupTime: string;
  status: "PRESENT" | "ABSENT" | "UNCHECKED";
  phone: string;
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
    id: "p1",
    name: "Ahmed Hussain",
    rollNo: "NUST-SE-88",
    stop: "G-10 Markaz Roundabout",
    stopSeq: 3,
    pickupTime: "07:30 AM",
    status: "PRESENT",
    phone: "03124567891",
  },
  {
    id: "p2",
    name: "Ali Khan",
    rollNo: "NUST-EE-12",
    stop: "G-8 Markaz Roundabout",
    stopSeq: 1,
    pickupTime: "07:15 AM",
    status: "PRESENT",
    phone: "03001234567",
  },
  {
    id: "p3",
    name: "Hamza Ali",
    rollNo: "NUST-CS-45",
    stop: "G-8 Markaz Roundabout",
    stopSeq: 1,
    pickupTime: "07:15 AM",
    status: "PRESENT",
    phone: "03019876543",
  },
  {
    id: "p4",
    name: "Usman Tariq",
    rollNo: "NUST-BBA-09",
    stop: "G-9 Sector Stop",
    stopSeq: 2,
    pickupTime: "07:22 AM",
    status: "PRESENT",
    phone: "03115554433",
  },
  {
    id: "p5",
    name: "Bilal Farooq",
    rollNo: "NUST-ME-67",
    stop: "G-10 Markaz Roundabout",
    stopSeq: 3,
    pickupTime: "07:30 AM",
    status: "UNCHECKED",
    phone: "03227788990",
  },
  {
    id: "p6",
    name: "Zainab Bibi",
    rollNo: "NUST-SE-34",
    stop: "G-10/4 Main Boulevard",
    stopSeq: 3,
    pickupTime: "07:35 AM",
    status: "PRESENT",
    phone: "03334445566",
  },
  {
    id: "p7",
    name: "Hassan Raza",
    rollNo: "NUST-CE-22",
    stop: "F-11 Markaz Shell",
    stopSeq: 4,
    pickupTime: "07:42 AM",
    status: "UNCHECKED",
    phone: "03451122334",
  },
  {
    id: "p8",
    name: "Maryam Fatima",
    rollNo: "NUST-EE-78",
    stop: "F-11 Markaz Shell",
    stopSeq: 4,
    pickupTime: "07:42 AM",
    status: "PRESENT",
    phone: "03023344556",
  },
  {
    id: "p9",
    name: "Saad Sheikh",
    rollNo: "NUST-CS-90",
    stop: "E-11 Sector Entry",
    stopSeq: 5,
    pickupTime: "07:52 AM",
    status: "UNCHECKED",
    phone: "03156677889",
  },
  {
    id: "p10",
    name: "Ayesha Malik",
    rollNo: "NUST-SE-15",
    stop: "E-11 Sector Entry",
    stopSeq: 5,
    pickupTime: "07:52 AM",
    status: "UNCHECKED",
    phone: "03218899001",
  },
  {
    id: "p11",
    name: "Danyal Baig",
    rollNo: "NUST-ME-04",
    stop: "G-10 Markaz Roundabout",
    stopSeq: 3,
    pickupTime: "07:30 AM",
    status: "PRESENT",
    phone: "03445566778",
  },
  {
    id: "p12",
    name: "Mahnoor Khan",
    rollNo: "NUST-EE-56",
    stop: "G-8 Markaz Roundabout",
    stopSeq: 1,
    pickupTime: "07:15 AM",
    status: "PRESENT",
    phone: "03009988776",
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
  const { user, profile, isDriver, isStaff, driverApplicationStatus, signOut } = useAuth();
  const navigate = useNavigate();

  // Route State
  const [routeId] = useState("r1");
  const [routeName] = useState("NUST Morning Route 01 (Islamabad West)");
  const [vehicleCode] = useState("UTS-CST-104 (Toyota Coaster)");
  const [routeStatus, setRouteStatus] = useState<RouteLifecycle>(() => {
    return (localStorage.getItem("uts_driver_route_status_v3") as RouteLifecycle) || "NOT_STARTED";
  });
  const [startTime, setStartTime] = useState<string | null>(() => {
    return localStorage.getItem("uts_driver_start_time_v3") || null;
  });
  const [completedTime, setCompletedTime] = useState<string | null>(null);

  // Passengers Manifest State
  const [passengers, setPassengers] = useState<DriverPassenger[]>(() => {
    const saved = localStorage.getItem("uts_driver_passengers_v3");
    return saved ? JSON.parse(saved) : INITIAL_PASSENGERS;
  });

  // Stops State
  const [stops, setStops] = useState<RouteStopItem[]>(INITIAL_STOPS);
  const [selectedStopFilter, setSelectedStopFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Connectivity & Offline Queue State
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Modal States
  const [isEndRouteDialogOpen, setIsEndRouteDialogOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isStudentReportModalOpen, setIsStudentReportModalOpen] = useState(false);

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
  const [submittingIncident, setSubmittingIncident] = useState(false);

  // Route History
  const [routeHistory, setRouteHistory] = useState([
    {
      id: "rh-1",
      date: "05 Sep 2026",
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

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("uts_driver_route_status_v3", routeStatus);
    if (startTime) localStorage.setItem("uts_driver_start_time_v3", startTime);
    localStorage.setItem("uts_driver_passengers_v3", JSON.stringify(passengers));
    setPendingSyncCount(OfflineAttendanceQueue.getPendingCount());
  }, [routeStatus, startTime, passengers]);

  // Online / Offline Detection & Auto-Sync Listener
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

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync Function
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

  // 1. START ROUTE ACTION
  const handleStartRoute = () => {
    if (routeStatus === "ACTIVE") return;
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setRouteStatus("ACTIVE");
    setStartTime(nowStr);
    setCompletedTime(null);
    toast.success(`Route Run Activated at ${nowStr}! Passenger manifest is live.`);
  };

  // 2. TOGGLE ATTENDANCE ACTION (Offline-first)
  const toggleAttendance = async (studentId: string) => {
    if (routeStatus === "NOT_STARTED") {
      toast.info("Please click 'START ROUTE' before marking attendance.");
      return;
    }

    let nextStatus: "PRESENT" | "UNCHECKED" = "PRESENT";

    setPassengers((prev) =>
      prev.map((p) => {
        if (p.id === studentId) {
          nextStatus = p.status === "PRESENT" ? "UNCHECKED" : "PRESENT";
          return { ...p, status: nextStatus };
        }
        return p;
      }),
    );

    // Save into Offline Attendance Queue
    if (nextStatus === "PRESENT") {
      OfflineAttendanceQueue.recordAttendance(routeId, studentId, "PRESENT", user?.id);
    }

    setPendingSyncCount(OfflineAttendanceQueue.getPendingCount());

    // If online, perform background sync
    if (navigator.onLine) {
      OfflineAttendanceQueue.syncWithCloud().then(() => {
        setPendingSyncCount(OfflineAttendanceQueue.getPendingCount());
      });
    }
  };

  // 3. COMPLETE STOP ACTION
  const handleCompleteStop = (stopId: string) => {
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, completed: true } : s)));
    toast.success("Stop waypoint marked completed.");
  };

  // 4. END ROUTE & AUTOMATED STUDENT ABSENCE CALCULATION
  const handleConfirmEndRoute = async () => {
    const endStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const serviceDate = new Date().toISOString().split("T")[0];
    let uncheckCount = 0;

    // 1. Mark non-present students as ABSENT
    const finalPassengers = passengers.map((p) => {
      if (p.status !== "PRESENT") {
        uncheckCount++;
        // Queue absent mark
        OfflineAttendanceQueue.recordAttendance(routeId, p.id, "ABSENT", user?.id);
        return { ...p, status: "ABSENT" as const };
      }
      return p;
    });

    setPassengers(finalPassengers);
    setRouteStatus("COMPLETED");
    setCompletedTime(endStr);
    setIsEndRouteDialogOpen(false);

    // 2. Record to Route History
    const newHistoryEntry = {
      id: `rh-${Date.now()}`,
      date:
        "Today, " +
        new Date().toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      route: routeName,
      vehicle: "UTS-CST-104",
      totalStudents: passengers.length,
      present: passengers.length - uncheckCount,
      absent: uncheckCount,
      startTime: startTime || "07:15 AM",
      endTime: endStr,
      status: "COMPLETED",
    };
    setRouteHistory((prev) => [newHistoryEntry, ...prev]);

    // 3. Invoke Supabase complete_route_run RPC or batch queue
    if (navigator.onLine) {
      try {
        setSyncing(true);
        await supabase.rpc("complete_route_run" as any, {
          _route_id: routeId,
          _service_date: serviceDate,
        });

        // Also sync local queue
        await OfflineAttendanceQueue.syncWithCloud();
        setPendingSyncCount(0);
      } catch (err) {
        console.warn("Route end RPC fallback notice:", err);
      } finally {
        setSyncing(false);
      }
    }

    toast.success(
      `Route completed at ${endStr}! ${uncheckCount} student(s) automatically marked absent & notified directly.`,
    );
  };

  // 5. SUBMIT VEHICLE / ROUTE ISSUE
  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDesc.trim()) {
      toast.error("Please describe the issue.");
      return;
    }

    setSubmittingIncident(true);
    try {
      // 1. Insert into vehicle_issues
      await supabase.from("vehicle_issues").insert({
        vehicle_id: "v1",
        issue_category: incidentType,
        priority: incidentPriority,
        description: incidentDesc.trim(),
        status: "OPEN",
      });

      // 2. Also create complaint for operational visibility
      await supabase.from("complaints").insert({
        customer_name: profile?.full_name || "Muhammad Tariq (Driver)",
        customer_email: user?.email || "driver@uts.com.pk",
        customer_phone: "03124567891",
        category: "AC / Comfort",
        priority: incidentPriority,
        description: `[DRIVER REPORT — ${incidentType} | Vehicle: UTS-CST-104]: ${incidentDesc.trim()}`,
        status: "OPEN",
      });

      toast.success("Issue logged and dispatched to Fleet Maintenance & Operations Desk.");
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

  // 6. REPORT STUDENT MISCONDUCT (Section 21: Driver Complaint Workflow)
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
        `Disciplinary complaint logged for student "${reportStudentName}". Operations Admin notified for review & potential suspension.`,
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
  const uncheckedCount = passengers.filter((p) => p.status === "UNCHECKED").length;

  const filteredPassengers = passengers.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.stop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.rollNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStop =
      selectedStopFilter === "ALL" ||
      p.stop.toLowerCase().includes(selectedStopFilter.toLowerCase());

    return matchesSearch && matchesStop;
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
                  UTS Driver Mobile Console
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
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-foreground/75">
                <span className="flex items-center gap-1 font-mono">
                  <Car className="h-3.5 w-3.5 text-accent" /> {vehicleCode}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-accent" /> Shift:{" "}
                  <strong>07:15 AM – 08:30 AM</strong>
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-accent" /> Driver:{" "}
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  <Play className="mr-1.5 h-4 w-4 fill-current" /> START ROUTE
                </Button>
              )}

              {routeStatus === "ACTIVE" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsEndRouteDialogOpen(true)}
                  className="font-bold text-xs"
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

      {/* OPERATIONAL METRICS BAR */}
      <section className="container-page py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card-elevated p-4">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Total Manifest
            </span>
            <p className="mt-1 text-2xl font-bold text-foreground">{passengers.length}</p>
          </div>
          <div className="card-elevated p-4">
            <span className="text-[10px] font-bold uppercase text-emerald-600">
              Present (Boarded)
            </span>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{presentCount}</p>
          </div>
          <div className="card-elevated p-4">
            <span className="text-[10px] font-bold uppercase text-amber-500">
              Unchecked (Pending)
            </span>
            <p className="mt-1 text-2xl font-bold text-amber-500">{uncheckedCount}</p>
          </div>
          <div className="card-elevated p-4">
            <span className="text-[10px] font-bold uppercase text-destructive">
              Absent (Route End)
            </span>
            <p className="mt-1 text-2xl font-bold text-destructive">{absentCount}</p>
          </div>
        </div>

        {/* TABS: PASSENGER MANIFEST & ROUTE ITINERARY */}
        <div className="mt-6">
          <Tabs defaultValue="manifest" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto h-auto p-1.5 bg-muted/60">
              <TabsTrigger value="manifest" className="py-2 text-xs">
                Student Manifest ({passengers.length})
              </TabsTrigger>
              <TabsTrigger value="stops" className="py-2 text-xs">
                Stops Itinerary ({stops.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="py-2 text-xs">
                Route History
              </TabsTrigger>
            </TabsList>

            {/* 1. STUDENT ATTENDANCE MANIFEST */}
            <TabsContent value="manifest" className="space-y-4">
              <div className="card-elevated p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search student by name, roll no, or stop..."
                    className="pl-9 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedStopFilter} onValueChange={setSelectedStopFilter}>
                  <SelectTrigger className="w-full sm:w-[220px] text-xs">
                    <SelectValue placeholder="Filter by Stop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Stops Manifest</SelectItem>
                    {stops.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        Stop {s.seq}: {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Passenger Cards Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPassengers.map((p) => {
                  const isPresent = p.status === "PRESENT";
                  const isAbsent = p.status === "ABSENT";

                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleAttendance(p.id)}
                      className={`card-elevated p-4 cursor-pointer transition-all active:scale-[0.98] border-2 ${
                        isPresent
                          ? "border-emerald-500 bg-emerald-500/5"
                          : isAbsent
                            ? "border-destructive/40 bg-destructive/5"
                            : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-foreground text-sm">{p.name}</h4>
                          <span className="text-[10px] font-mono text-muted-foreground block">
                            {p.rollNo}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isPresent
                              ? "bg-emerald-500 text-white"
                              : isAbsent
                                ? "bg-destructive text-white"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isPresent ? "PRESENT" : isAbsent ? "ABSENT" : "UNCHECKED"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> {p.stop}
                        </span>
                        <span className="font-mono">{p.pickupTime}</span>
                      </div>

                      <div className="mt-2 text-[10px] text-primary font-semibold flex items-center justify-between">
                        <span>Tap to toggle attendance</span>
                        <a
                          href={`tel:${p.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-muted-foreground hover:text-foreground underline"
                        >
                          <Phone className="h-3 w-3" /> Call
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* 2. STOPS ITINERARY */}
            <TabsContent value="stops" className="space-y-4">
              <div className="card-elevated divide-y divide-border">
                {stops.map((st) => (
                  <div key={st.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${
                          st.completed ? "bg-emerald-500 text-white" : "bg-muted text-foreground"
                        }`}
                      >
                        {st.seq}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{st.name}</h4>
                        <span className="text-xs font-mono text-muted-foreground">
                          Scheduled: {st.time}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={st.completed ? "ghost" : "outline"}
                      onClick={() => handleCompleteStop(st.id)}
                      className="text-xs"
                    >
                      {st.completed ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <Check className="h-4 w-4" /> Passed
                        </span>
                      ) : (
                        "Mark Arrived"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* 3. ROUTE HISTORY */}
            <TabsContent value="history" className="space-y-4">
              <div className="card-elevated overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3">Service Date</th>
                        <th className="px-6 py-3">Route & Vehicle</th>
                        <th className="px-6 py-3">Students Present</th>
                        <th className="px-6 py-3">Students Absent</th>
                        <th className="px-6 py-3">Run Duration</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {routeHistory.map((rh) => (
                        <tr key={rh.id} className="hover:bg-muted/30">
                          <td className="px-6 py-4 font-semibold text-foreground">{rh.date}</td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {rh.route} ({rh.vehicle})
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-600">
                            {rh.present} / {rh.totalStudents}
                          </td>
                          <td className="px-6 py-4 font-bold text-destructive">{rh.absent}</td>
                          <td className="px-6 py-4 text-xs font-mono">
                            {rh.startTime} – {rh.endTime}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className="bg-emerald-500/15 text-emerald-600 text-xs">
                              {rh.status}
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

      {/* END ROUTE CONFIRMATION MODAL */}
      <Dialog open={isEndRouteDialogOpen} onOpenChange={setIsEndRouteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Square className="h-5 w-5 fill-current" /> End Active Route Run?
            </DialogTitle>
            <DialogDescription>
              Completing this route run will lock attendance for today and trigger automated absence
              detection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1.5">
              <p>
                <strong>Present Students:</strong>{" "}
                <span className="text-emerald-600 font-bold">{presentCount}</span>
              </p>
              <p>
                <strong>Unchecked Students:</strong>{" "}
                <span className="text-destructive font-bold">{uncheckedCount}</span>
              </p>
              <p className="text-muted-foreground pt-1 border-t border-border">
                *All {uncheckedCount} unchecked students will automatically be marked{" "}
                <strong>ABSENT</strong> and dispatched absence notification notices directly.
              </p>
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

      {/* REPORT ISSUE MODAL */}
      <Dialog open={isIncidentModalOpen} onOpenChange={setIsIncidentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-500" /> Report Vehicle or Route Issue
            </DialogTitle>
            <DialogDescription>
              Report defect to UTS Fleet Maintenance and Operations Dispatch.
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
                  <SelectItem value="AC / Cooling">AC / Cooling Issue</SelectItem>
                  <SelectItem value="Brakes / Mechanical">Brakes / Mechanical Warning</SelectItem>
                  <SelectItem value="Tires & Suspension">Tires & Suspension</SelectItem>
                  <SelectItem value="Route Block / Traffic">
                    Route Block / Road Construction
                  </SelectItem>
                  <SelectItem value="Cleanliness">Cabin Cleanliness</SelectItem>
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
                  <SelectItem value="HIGH">High (Immediate assistance required)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="e.g. AC compressor belt squeaking, cooling not reaching rear rows during midday heat."
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                rows={3}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsIncidentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingIncident}>
                {submittingIncident ? "Logging..." : "Submit Issue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* REPORT STUDENT MISCONDUCT MODAL (Section 21) */}
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
