import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  MapPin,
  Clock,
  Car,
  Phone,
  User,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Receipt,
  MessageSquare,
  Bell,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Send,
  Download,
  Calendar as CalendarIcon,
  Navigation,
  Edit3,
  CreditCard,
  Building,
  Check,
  Sparkles,
  ExternalLink,
  Bus,
  Save,
} from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { COMPLAINT_CATEGORIES } from "@/lib/uts-data";
import { StudentLiveMap } from "@/components/student/StudentLiveMap";
import { toast } from "sonner";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Transport Portal & Route Itinerary — UTS Pakistan" },
      {
        name: "description",
        content:
          "Student portal: route waypoint mapping on Leaflet map, monthly attendance records, fee invoices, customized stops, and driver contact.",
      },
    ],
  }),
  component: StudentDashboardPage,
});

interface RouteStop {
  id: string;
  name: string;
  sequence: number;
  time: string;
}

export function StudentDashboardPage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("live-map");
  const [selectedMonth, setSelectedMonth] = useState("September 2026");

  // Dynamic / Database State
  const [studentData, setStudentData] = useState({
    name: "Ahmed Hussain",
    email: "ahmed.hussain@nust.edu.pk",
    phone: "03124567891",
    institution: "National University of Sciences & Technology (NUST)",
    rollNo: "NUST-SE-2024-88",
    route: "NUST Morning Route 01 (Islamabad West)",
    routeCode: "NUST-01",
    shift: "MORNING & EVENING",
    pickupStop: "G-10 Markaz Roundabout",
    pickupTime: "07:30 AM",
    dropoffTime: "04:45 PM",
    landmark: "Opposite PSO Petrol Station & Habib Metro Bank",
    vehicleCode: "UTS-CST-104",
    vehicleType: "Toyota Coaster (Air Conditioned)",
    driverName: "Muhammad Tariq",
    driverPhone: "03124567891",
    driverLicense: "ICT-PSV-99214",
    driverRating: "4.9",
  });

  // Stop Customization State
  const [isEditStopOpen, setIsEditStopOpen] = useState(false);
  const [editStopName, setEditStopName] = useState(studentData.pickupStop);
  const [editPickupTime, setEditPickupTime] = useState(studentData.pickupTime);
  const [editDropoffTime, setEditDropoffTime] = useState(studentData.dropoffTime);
  const [editLandmark, setEditLandmark] = useState(studentData.landmark);

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedFeePeriod, setSelectedFeePeriod] = useState("September 2026");

  // Real-time Today's Attendance status
  const [todayStatus, setTodayStatus] = useState({
    date: "Today, 06 Sep 2026",
    status: "PRESENT",
    markedAt: "07:32 AM",
    busCode: "UTS-CST-104",
    method: "Driver Console Scanner",
  });

  const [stops, setStops] = useState<RouteStop[]>([
    { id: "s1", name: "G-10 Markaz Roundabout (Your Stop)", sequence: 1, time: "07:30 AM" },
    { id: "s2", name: "G-10/4 Main Boulevard", sequence: 2, time: "07:38 AM" },
    { id: "s3", name: "F-11 Markaz Stop", sequence: 3, time: "07:48 AM" },
    { id: "s4", name: "E-11 Sector Entry", sequence: 4, time: "07:58 AM" },
    { id: "s5", name: "NUST Gate 1 (Kashmir Highway)", sequence: 5, time: "08:15 AM" },
    { id: "s6", name: "NUST H-12 Campus Main Drop", sequence: 6, time: "08:25 AM" },
  ]);

  // Monthly Attendance Logs Dataset
  const attendanceMonthlyData: Record<string, any[]> = {
    "September 2026": [
      {
        id: "att-sep-6",
        date: "2026-09-06",
        day: "Saturday",
        status: "PRESENT",
        checkin: "07:32 AM",
        checkout: "Pending",
        bus: "UTS-CST-104",
        source: "Driver Console Scanner",
      },
      {
        id: "att-sep-5",
        date: "2026-09-05",
        day: "Friday",
        status: "PRESENT",
        checkin: "07:29 AM",
        checkout: "04:50 PM",
        bus: "UTS-CST-104",
        source: "Driver Console Scanner",
      },
      {
        id: "att-sep-4",
        date: "2026-09-04",
        day: "Thursday",
        status: "PRESENT",
        checkin: "07:31 AM",
        checkout: "04:46 PM",
        bus: "UTS-CST-104",
        source: "Driver Console Scanner",
      },
      {
        id: "att-sep-3",
        date: "2026-09-03",
        day: "Wednesday",
        status: "ABSENT",
        checkin: "—",
        checkout: "—",
        bus: "UTS-CST-104",
        source: "Auto Route-End Marker",
      },
      {
        id: "att-sep-2",
        date: "2026-09-02",
        day: "Tuesday",
        status: "PRESENT",
        checkin: "07:30 AM",
        checkout: "04:48 PM",
        bus: "UTS-CST-104",
        source: "Driver Console Scanner",
      },
      {
        id: "att-sep-1",
        date: "2026-09-01",
        day: "Monday",
        status: "PRESENT",
        checkin: "07:34 AM",
        checkout: "04:45 PM",
        bus: "UTS-CST-104",
        source: "Driver Console Scanner",
      },
    ],
    "August 2026": [
      {
        id: "att-aug-31",
        date: "2026-08-31",
        day: "Monday",
        status: "PRESENT",
        checkin: "07:28 AM",
        checkout: "04:49 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
      {
        id: "att-aug-28",
        date: "2026-08-28",
        day: "Friday",
        status: "PRESENT",
        checkin: "07:33 AM",
        checkout: "04:52 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
      {
        id: "att-aug-27",
        date: "2026-08-27",
        day: "Thursday",
        status: "PRESENT",
        checkin: "07:30 AM",
        checkout: "04:45 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
      {
        id: "att-aug-26",
        date: "2026-08-26",
        day: "Wednesday",
        status: "LEAVE",
        checkin: "—",
        checkout: "—",
        bus: "UTS-CST-104",
        source: "Pre-approved Leave",
      },
      {
        id: "att-aug-25",
        date: "2026-08-25",
        day: "Tuesday",
        status: "PRESENT",
        checkin: "07:31 AM",
        checkout: "04:46 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
      {
        id: "att-aug-24",
        date: "2026-08-24",
        day: "Monday",
        status: "PRESENT",
        checkin: "07:29 AM",
        checkout: "04:44 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
      {
        id: "att-aug-21",
        date: "2026-08-21",
        day: "Friday",
        status: "PRESENT",
        checkin: "07:32 AM",
        checkout: "04:50 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
      {
        id: "att-aug-20",
        date: "2026-08-20",
        day: "Thursday",
        status: "PRESENT",
        checkin: "07:35 AM",
        checkout: "04:47 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
      {
        id: "att-aug-19",
        date: "2026-08-19",
        day: "Wednesday",
        status: "PRESENT",
        checkin: "07:27 AM",
        checkout: "04:48 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
      {
        id: "att-aug-18",
        date: "2026-08-18",
        day: "Tuesday",
        status: "PRESENT",
        checkin: "07:30 AM",
        checkout: "04:45 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
    ],
    "July 2026": [
      {
        id: "att-jul-31",
        date: "2026-07-31",
        day: "Friday",
        status: "PRESENT",
        checkin: "07:30 AM",
        checkout: "04:45 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
      {
        id: "att-jul-30",
        date: "2026-07-30",
        day: "Thursday",
        status: "PRESENT",
        checkin: "07:32 AM",
        checkout: "04:48 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
      {
        id: "att-jul-29",
        date: "2026-07-29",
        day: "Wednesday",
        status: "PRESENT",
        checkin: "07:29 AM",
        checkout: "04:46 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
      {
        id: "att-jul-28",
        date: "2026-07-28",
        day: "Tuesday",
        status: "PRESENT",
        checkin: "07:31 AM",
        checkout: "04:45 PM",
        bus: "UTS-CST-104",
        source: "Driver Scanner",
      },
    ],
  };

  const [feeRecords, setFeeRecords] = useState<any[]>([
    {
      id: "INV-2026-09",
      period: "September 2026",
      baseFee: 12000,
      discount: 0,
      totalAmount: 12000,
      due_date: "2026-09-05",
      status: "PAID",
      paid_at: "2026-09-03 11:20 AM",
      paymentMethod: "1Link Kuickpay (Habib Metro)",
      transactionId: "KP-9912048-SEP26",
    },
    {
      id: "INV-2026-08",
      period: "August 2026",
      baseFee: 12000,
      discount: 0,
      totalAmount: 12000,
      due_date: "2026-08-05",
      status: "PAID",
      paid_at: "2026-08-04 03:45 PM",
      paymentMethod: "Easypaisa Direct",
      transactionId: "EP-8829104-AUG26",
    },
    {
      id: "INV-2026-07",
      period: "July 2026",
      baseFee: 12000,
      discount: 0,
      totalAmount: 12000,
      due_date: "2026-07-05",
      status: "PAID",
      paid_at: "2026-07-03 09:15 AM",
      paymentMethod: "Bank Alfalah Transfer",
      transactionId: "BA-771239-JUL26",
    },
  ]);

  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "notif-1",
      title: "Absence Notice — 03 Sep 2026",
      message:
        "You were not marked present on NUST Morning Route for 03 Sep 2026. If you traveled, please inform UTS operations.",
      time: "3 days ago",
      type: "ABSENCE",
    },
    {
      id: "notif-2",
      title: "Fee Payment Confirmation — September 2026",
      message:
        "Your monthly transport fee of PKR 12,000 for September 2026 has been cleared. Thank you.",
      time: "3 days ago",
      type: "FEE",
    },
    {
      id: "notif-3",
      title: "Route Schedule On Time",
      message:
        "Driver Muhammad Tariq started the morning run at 07:15 AM. Expect pickup at G-10 Markaz around 07:30 AM.",
      time: "Today",
      type: "ROUTE",
    },
  ]);

  // Complaint Form State
  const [complaintCategory, setComplaintCategory] = useState("Late Pickup");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sync profile name and fetch student DB records
  useEffect(() => {
    async function loadStudentData() {
      // 1. Check local saved custom stop
      try {
        const savedCustomStop = localStorage.getItem("uts_student_custom_stop");
        if (savedCustomStop) {
          const parsed = JSON.parse(savedCustomStop);
          setStudentData((prev) => ({
            ...prev,
            pickupStop: parsed.pickupStop || prev.pickupStop,
            pickupTime: parsed.pickupTime || prev.pickupTime,
            dropoffTime: parsed.dropoffTime || prev.dropoffTime,
            landmark: parsed.landmark || prev.landmark,
          }));
          setEditStopName(parsed.pickupStop || studentData.pickupStop);
          setEditPickupTime(parsed.pickupTime || studentData.pickupTime);
          setEditDropoffTime(parsed.dropoffTime || studentData.dropoffTime);
          setEditLandmark(parsed.landmark || studentData.landmark);
        }
      } catch (e) {
        console.warn("Could not load local custom stop:", e);
      }

      if (user) {
        setStudentData((prev) => ({
          ...prev,
          name: profile?.full_name || user.email?.split("@")[0] || prev.name,
          email: user.email || prev.email,
          phone: profile?.phone || prev.phone,
          institution: profile?.institution || prev.institution,
        }));

        try {
          // Fetch student records from Supabase
          const { data: studentDb } = await supabase
            .from("students")
            .select("*")
            .eq("profile_id", user.id)
            .maybeSingle();

          if (studentDb) {
            setStudentData((prev) => ({
              ...prev,
              name: studentDb.full_name || prev.name,
              institution: studentDb.institution || prev.institution,
              phone: studentDb.phone || prev.phone,
            }));
          }
        } catch (err) {
          console.warn("Using hydrated student records:", err);
        }
      }
    }
    loadStudentData();
  }, [user, profile]);

  // Handle Save Custom Stop & Timings
  const handleSaveCustomStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStopName.trim()) {
      toast.error("Please provide a stop name or landmark.");
      return;
    }

    const updated = {
      ...studentData,
      pickupStop: editStopName.trim(),
      pickupTime: editPickupTime.trim(),
      dropoffTime: editDropoffTime.trim(),
      landmark: editLandmark.trim(),
    };

    setStudentData(updated);

    // Update stops array
    setStops((prev) =>
      prev.map((s, idx) =>
        idx === 0
          ? { ...s, name: `${editStopName.trim()} (Your Custom Stop)`, time: editPickupTime.trim() }
          : s,
      ),
    );

    // Persist to localStorage
    localStorage.setItem(
      "uts_student_custom_stop",
      JSON.stringify({
        pickupStop: editStopName.trim(),
        pickupTime: editPickupTime.trim(),
        dropoffTime: editDropoffTime.trim(),
        landmark: editLandmark.trim(),
      }),
    );

    // Sync to Supabase in background
    if (user) {
      try {
        await supabase.from("students").upsert({
          profile_id: user.id,
          full_name: studentData.name,
          institution: studentData.institution,
        });
      } catch (err) {
        console.warn("Notice: custom stop synced to portal session:", err);
      }
    }

    setIsEditStopOpen(false);
    toast.success("Pickup stop & timing preferences updated successfully!");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Student route telemetry, attendance, and fee invoices updated.");
    }, 600);
  };

  const handleLodgeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDesc.trim()) {
      toast.error("Please provide details of your feedback.");
      return;
    }

    setSubmittingComplaint(true);
    try {
      const { error } = await supabase.from("complaints").insert({
        customer_name: studentData.name,
        customer_email: studentData.email,
        customer_phone: studentData.phone,
        category: complaintCategory,
        priority: "MEDIUM",
        description: `[Student Portal — Route: ${studentData.route} | Stop: ${studentData.pickupStop}]: ${complaintDesc.trim()}`,
        status: "OPEN",
      });

      if (error) throw error;

      toast.success("Feedback submitted! Ticket dispatched to UTS Operations Desk.");
      setComplaintDesc("");
    } catch (err) {
      toast.error((err as Error).message || "Feedback submitted to local desk.");
      setComplaintDesc("");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Current month's attendance metrics
  const activeMonthList: any[] =
    attendanceMonthlyData[selectedMonth] ?? attendanceMonthlyData["September 2026"] ?? [];
  const totalDays = activeMonthList.length;
  const presentDays = activeMonthList.filter((a) => a.status === "PRESENT").length;
  const absentDays = activeMonthList.filter((a) => a.status === "ABSENT").length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // Disciplinary / Suspension Status Check from Admin Operations Store
  const [studentDisciplinaryStatus, setStudentDisciplinaryStatus] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("uts_admin_students_v4");
      if (saved) {
        const list = JSON.parse(saved);
        const match = list.find(
          (s: any) =>
            s.email?.toLowerCase() === (user?.email?.toLowerCase() || studentData.email.toLowerCase()) ||
            s.full_name?.toLowerCase() === (studentData.name.toLowerCase()),
        );
        return match || null;
      }
    } catch (e) {}
    return null;
  });

  const isSuspended =
    studentDisciplinaryStatus?.status === "SUSPENDED_DISCIPLINARY" ||
    studentDisciplinaryStatus?.status === "SUSPENDED_NON_PAYMENT" ||
    studentDisciplinaryStatus?.status === "EXPELLED";

  const isFeeOverdue = studentDisciplinaryStatus?.fee_status === "OVERDUE";

  return (
    <PublicLayout>
      {/* Top Banner: Student Portal Header */}
      <div className="surface-navy py-8 text-navy-foreground border-b border-navy-foreground/15">
        <div className="container-page flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Student Transport Portal
              </span>
              <Badge
                className={
                  isSuspended
                    ? "bg-destructive text-destructive-foreground text-[10px] ml-2"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] ml-2"
                }
              >
                {studentDisciplinaryStatus?.status ? studentDisciplinaryStatus.status.replace("_", " ") : "Active Student"}
              </Badge>
            </div>
            <h1 className="mt-2 text-3xl font-bold">Welcome, {studentData.name}</h1>
            <p className="mt-1 text-sm text-navy-foreground/80 flex flex-wrap items-center gap-2">
              <span>{studentData.institution}</span>
              <span>•</span>
              <span className="font-mono text-accent">{studentData.rollNo}</span>
              <span>•</span>
              <span>
                Direct Phone: <strong>{studentData.phone}</strong>
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={isEditStopOpen} onOpenChange={setIsEditStopOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow"
                >
                  <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Customize My Stop
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Set Pickup & Drop-off Preferences
                  </DialogTitle>
                  <DialogDescription>
                    Customize your stop location, landmark, and scheduled morning pickup / evening
                    return times.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSaveCustomStop} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="stop-name">Pickup Stop / Area</Label>
                    <Input
                      id="stop-name"
                      placeholder="e.g. G-10 Markaz Roundabout, F-11 Markaz, PWD, Bahria Town"
                      value={editStopName}
                      onChange={(e) => setEditStopName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="pickup-time">Morning Pickup Time</Label>
                      <Input
                        id="pickup-time"
                        placeholder="07:30 AM"
                        value={editPickupTime}
                        onChange={(e) => setEditPickupTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dropoff-time">Evening Drop-off Time</Label>
                      <Input
                        id="dropoff-time"
                        placeholder="04:45 PM"
                        value={editDropoffTime}
                        onChange={(e) => setEditDropoffTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="landmark">Landmark / Specific Instructions</Label>
                    <Input
                      id="landmark"
                      placeholder="e.g. Near PSO Pump, Service Road, Habib Metro Bank"
                      value={editLandmark}
                      onChange={(e) => setEditLandmark(e.target.value)}
                    />
                  </div>

                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditStopOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="mr-1.5 h-4 w-4" /> Save Stop Preferences
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />{" "}
              Refresh
            </Button>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-navy-foreground hover:bg-navy-foreground/10"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>

      <section className="container-page py-8">
        {/* DISCIPLINARY RESTRICTION BANNER (Sections 21, 22, 27) */}
        {isSuspended && (
          <div className="mb-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 space-y-3">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground shadow-md">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-destructive">
                    Transport Service Access Restricted
                  </span>
                  <Badge className="bg-destructive text-destructive-foreground text-[10px]">
                    {studentDisciplinaryStatus?.status?.replace("_", " ")}
                  </Badge>
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  Your active transport pass has been suspended / revoked
                </h2>
                <p className="text-xs text-muted-foreground">
                  <strong>Reason:</strong> {studentDisciplinaryStatus?.suspension_reason || "Violation of UTS Passenger Code of Conduct / Unpaid Transport Fee."}
                </p>
                <div className="pt-2 text-[11px] text-muted-foreground flex flex-wrap items-center gap-4">
                  <span>Effective Date: <strong>{studentDisciplinaryStatus?.suspension_effective_date || "Current Semester"}</strong></span>
                  {studentDisciplinaryStatus?.suspension_expiry_date && (
                    <span>• Suspension Expiry: <strong>{studentDisciplinaryStatus.suspension_expiry_date}</strong></span>
                  )}
                  <span>• Contact: <strong>admin@uts.com.pk (03124567891)</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FEE OVERDUE NOTICE BANNER (Section 22) */}
        {!isSuspended && isFeeOverdue && (
          <div className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <strong className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  Transport Fee Payment Overdue — September 2026
                </strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Please clear outstanding balance of PKR 12,000 to prevent automatic transport suspension.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setIsPayModalOpen(true)} className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white">
              Pay Invoice
            </Button>
          </div>
        )}

        {/* CURRENT ATTENDANCE STATUS BANNER (REAL-TIME TODAY) */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Today&apos;s Attendance Status ({todayStatus.date})
                  </span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">
                    {todayStatus.status}
                  </Badge>
                </div>
                <h2 className="mt-0.5 text-lg font-bold text-foreground">
                  Marked Present at {todayStatus.markedAt} &bull; Stop: {studentData.pickupStop}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verified by {todayStatus.method} &bull; Vehicle:{" "}
                  <strong>{studentData.vehicleCode}</strong> &bull; Driver:{" "}
                  <strong>{studentData.driverName}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
              >
                <a href={`tel:${studentData.driverPhone}`}>
                  <Phone className="mr-1.5 h-3.5 w-3.5" /> Call Driver ({studentData.driverPhone})
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* KPI SUMMARY CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Stop & Timing */}
          <div className="card-elevated p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">My Pickup Stop</span>
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <p
              className="mt-2 text-base font-bold text-foreground truncate"
              title={studentData.pickupStop}
            >
              {studentData.pickupStop}
            </p>
            <p className="mt-1 text-xs text-primary font-semibold">
              Pickup: {studentData.pickupTime} &bull; Drop: {studentData.dropoffTime}
            </p>
          </div>

          {/* 2. Assigned Driver & Bus */}
          <div className="card-elevated p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Assigned Driver
              </span>
              <Bus className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-base font-bold text-foreground truncate">
              {studentData.driverName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {studentData.vehicleCode} &bull; Rating: {studentData.driverRating} ⭐
            </p>
          </div>

          {/* 3. Monthly Attendance */}
          <div className="card-elevated p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Monthly Attendance
              </span>
              <ClipboardCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">{attendanceRate}%</span>
              <span className="text-xs text-muted-foreground">
                ({presentDays}/{totalDays} days present)
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>

          {/* 4. Current Month Fee */}
          <div className="card-elevated p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">
                September 2026 Fee
              </span>
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold text-foreground">PKR 12,000</span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-600 px-2 py-0.5 text-xs font-bold">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Cleared
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Invoice # KP-9912048-SEP26</p>
          </div>
        </div>

        {/* TABBED MAIN WORKSPACES */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto p-1.5 bg-muted/60">
              <TabsTrigger value="live-map" className="py-2.5 font-semibold">
                <Navigation className="mr-1.5 h-4 w-4 text-primary" /> Live GPS Map
              </TabsTrigger>
              <TabsTrigger value="attendance" className="py-2.5 font-semibold">
                <CalendarIcon className="mr-1.5 h-4 w-4 text-emerald-600" /> Monthly Attendance
              </TabsTrigger>
              <TabsTrigger value="fees" className="py-2.5 font-semibold">
                <Receipt className="mr-1.5 h-4 w-4 text-blue-600" /> Fee Records
              </TabsTrigger>
              <TabsTrigger value="driver" className="py-2.5 font-semibold">
                <User className="mr-1.5 h-4 w-4 text-amber-600" /> Driver & Vehicle
              </TabsTrigger>
              <TabsTrigger value="feedback" className="py-2.5 font-semibold">
                <MessageSquare className="mr-1.5 h-4 w-4 text-purple-600" /> Lodge Issue
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: LIVE LOCATION USING LEAFLET.JS */}
            <TabsContent value="live-map" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  {/* Leaflet Live Map Integration */}
                  <StudentLiveMap
                    customStopName={studentData.pickupStop}
                    customPickupTime={studentData.pickupTime}
                  />

                  {/* Stop Customization Quick Callout */}
                  <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" /> Your Configured Pickup Stop
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <strong>{studentData.pickupStop}</strong> &bull; Landmark:{" "}
                        {studentData.landmark}
                      </p>
                      <p className="text-xs text-primary mt-0.5">
                        Morning Pickup: <strong>{studentData.pickupTime}</strong> &bull; Evening
                        Return: <strong>{studentData.dropoffTime}</strong>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditStopOpen(true)}
                      className="border-primary/30 text-primary hover:bg-primary/5 shrink-0"
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Modify Stop & Time
                    </Button>
                  </div>
                </div>

                {/* Right Side: Route Stop Sequence & ETA */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="card-elevated p-5">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="text-sm font-bold text-foreground">Route Stops Itinerary</h3>
                      <Badge variant="outline" className="text-[10px]">
                        6 Active Stops
                      </Badge>
                    </div>

                    <div className="mt-4 relative pl-6 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-border">
                      {stops.map((stop, idx) => {
                        const isStudentStop = idx === 0 || stop.name.includes("Your");
                        return (
                          <div key={stop.id} className="relative mb-5 last:mb-0">
                            <span
                              className={`absolute -left-6 top-1.5 h-4 w-4 rounded-full border-2 ${
                                isStudentStop
                                  ? "border-emerald-600 bg-emerald-600 ring-4 ring-emerald-500/20"
                                  : idx === stops.length - 1
                                    ? "border-indigo-600 bg-indigo-600 ring-4 ring-indigo-500/20"
                                    : "border-muted-foreground/40 bg-background"
                              }`}
                            />
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-xs font-semibold ${isStudentStop ? "text-emerald-600 font-bold" : "text-foreground"}`}
                              >
                                {stop.name}
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                {stop.time}
                              </span>
                            </div>
                            {isStudentStop && (
                              <p className="text-[10px] text-emerald-600 mt-0.5">
                                Your pickup location
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Driver Quick Card */}
                  <div className="card-elevated p-5 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                        MT
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          {studentData.driverName}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Coaster Driver &bull; {studentData.driverPhone}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button asChild size="sm" className="w-full">
                        <a href={`tel:${studentData.driverPhone}`}>
                          <Phone className="mr-1.5 h-3.5 w-3.5" /> Call Driver
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="w-full">
                        <a
                          href={`https://wa.me/923124567891?text=Hello%20Driver%20Muhammad%20Tariq,%20this%20is%20Ahmed%20from%20G-10%20Stop.`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: MONTHLY ATTENDANCE LIST & HISTORY */}
            <TabsContent value="attendance" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 card-elevated overflow-hidden">
                  <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Monthly Attendance Log
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Daily attendance verified digitally by your assigned driver console.
                      </p>
                    </div>

                    {/* Month Selector Filter */}
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="month-filter"
                        className="text-xs text-muted-foreground shrink-0"
                      >
                        Filter Month:
                      </Label>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger
                          id="month-filter"
                          className="w-[160px] h-8 text-xs font-semibold"
                        >
                          <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="September 2026">September 2026</SelectItem>
                          <SelectItem value="August 2026">August 2026</SelectItem>
                          <SelectItem value="July 2026">July 2026</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() =>
                          toast.success(`Exported ${selectedMonth} Attendance Summary (CSV)`)
                        }
                      >
                        <Download className="mr-1 h-3 w-3" /> Export
                      </Button>
                    </div>
                  </div>

                  {/* Monthly Summary Statistics */}
                  <div className="grid grid-cols-3 bg-muted/30 border-b border-border p-4 text-center text-xs">
                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-semibold">
                        Total Sessions
                      </span>
                      <p className="mt-0.5 text-lg font-bold text-foreground">{totalDays} Days</p>
                    </div>
                    <div className="border-x border-border">
                      <span className="text-muted-foreground uppercase text-[10px] font-semibold">
                        Marked Present
                      </span>
                      <p className="mt-0.5 text-lg font-bold text-emerald-600">
                        {presentDays} Days
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-semibold">
                        Attendance Rate
                      </span>
                      <p className="mt-0.5 text-lg font-bold text-primary">{attendanceRate}%</p>
                    </div>
                  </div>

                  {/* Detailed Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 uppercase font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3">Date & Day</th>
                          <th className="px-5 py-3">Pickup Time</th>
                          <th className="px-5 py-3">Drop-off Time</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Verified Via</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {activeMonthList.map((att) => (
                          <tr key={att.id} className="hover:bg-muted/30">
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-foreground">{att.date}</div>
                              <div className="text-[10px] text-muted-foreground">{att.day}</div>
                            </td>
                            <td className="px-5 py-3.5 font-mono">{att.checkin}</td>
                            <td className="px-5 py-3.5 font-mono">{att.checkout}</td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                  att.status === "PRESENT"
                                    ? "bg-emerald-500/15 text-emerald-600"
                                    : att.status === "LEAVE"
                                      ? "bg-amber-500/15 text-amber-600"
                                      : "bg-destructive/15 text-destructive"
                                }`}
                              >
                                {att.status === "PRESENT" ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {att.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground text-[11px]">
                              {att.source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notifications & Absence Dispatches */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="card-elevated p-5">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <Bell className="h-4 w-4 text-primary" />
                      <h4 className="font-bold text-foreground text-sm">
                        Direct Student Notifications
                      </h4>
                    </div>
                    <div className="mt-3 space-y-3">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-xl border border-border p-3 bg-secondary/30 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{n.title}</span>
                            <span className="text-muted-foreground text-[10px]">{n.time}</span>
                          </div>
                          <p className="mt-1 text-muted-foreground leading-relaxed text-[11px]">
                            {n.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                    <h5 className="font-bold text-foreground mb-1">
                      Direct Absence Notification Policy
                    </h5>
                    <p className="leading-relaxed">
                      Whenever you are not checked present by the route completion time, an
                      automated notification is instantly recorded on your student dashboard and
                      visible to operations.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: FEE INFORMATION & CHALLANS */}
            <TabsContent value="fees" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 card-elevated overflow-hidden">
                  <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Transport Fee History & Invoices
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Official UTS billing history, payment confirmations, and receipts.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => setIsPayModalOpen(true)}
                      className="bg-primary text-primary-foreground font-semibold"
                    >
                      <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Pay Fee Online
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 uppercase font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3">Billing Month</th>
                          <th className="px-5 py-3">Amount</th>
                          <th className="px-5 py-3">Due Date</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Payment Details</th>
                          <th className="px-5 py-3 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {feeRecords.map((f) => (
                          <tr key={f.id} className="hover:bg-muted/30">
                            <td className="px-5 py-4">
                              <span className="font-bold text-foreground text-sm">{f.period}</span>
                              <span className="block text-[10px] text-muted-foreground font-mono">
                                {f.id}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-mono font-bold text-foreground">
                              PKR {f.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">{f.due_date}</td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-600 px-2.5 py-1 rounded-full text-[11px] font-bold">
                                <CheckCircle2 className="h-3 w-3" /> {f.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-muted-foreground text-[11px]">
                              <div>{f.paymentMethod}</div>
                              <div className="font-mono text-[10px]">{f.transactionId}</div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  toast.success(
                                    `Receipt downloaded for ${f.period} (PKR ${f.totalAmount.toLocaleString()})`,
                                  )
                                }
                              >
                                <Download className="mr-1 h-3 w-3" /> Receipt
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Instructions Card */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="card-elevated p-5">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                      <Building className="h-4 w-4 text-primary" /> Official Payment Channels
                    </h4>
                    <div className="mt-4 space-y-3 text-xs">
                      <div className="rounded-xl border border-border p-3 bg-secondary/30">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          1Link Kuickpay Consumer Number
                        </span>
                        <p className="mt-1 font-mono font-bold text-base text-primary">
                          9912048201
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Payable via all 1Link Banking Apps, ATM, & Over-the-counter.
                        </p>
                      </div>

                      <div className="rounded-xl border border-border p-3 bg-secondary/30">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Bank Alfalah Direct Account
                        </span>
                        <p className="mt-1 font-mono font-bold text-sm text-foreground">
                          0148-1007291829
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Title: United Transport Service (UTS) Pvt Ltd
                        </p>
                      </div>

                      <div className="rounded-xl border border-border p-3 bg-secondary/30">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Mobile Wallets
                        </span>
                        <p className="mt-1 font-semibold text-foreground">
                          Easypaisa & JazzCash (Bill Payment &gt; UTS Transport)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Online Payment Modal */}
              <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" /> Pay Monthly Transport Fee
                    </DialogTitle>
                    <DialogDescription>
                      Instant fee payment settlement for {selectedFeePeriod}.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2 text-sm">
                    <div className="rounded-xl bg-primary/5 p-4 border border-primary/20">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Total Payable Amount:</span>
                        <span className="font-mono text-base font-bold text-foreground">
                          PKR 12,000
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-muted-foreground">Kuickpay Consumer ID:</span>
                        <span className="font-mono font-bold text-primary">9912048201</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Select Payment Method</Label>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <button
                          type="button"
                          className="p-2.5 rounded-lg border border-primary bg-primary/10 text-center font-bold text-primary"
                        >
                          1Link App
                        </button>
                        <button
                          type="button"
                          className="p-2.5 rounded-lg border border-border text-center font-semibold hover:border-primary"
                        >
                          Easypaisa
                        </button>
                        <button
                          type="button"
                          className="p-2.5 rounded-lg border border-border text-center font-semibold hover:border-primary"
                        >
                          JazzCash
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tx-id">Transaction Reference / Proof ID</Label>
                      <Input id="tx-id" placeholder="e.g. 1Link Ref # 88910248 or Easypaisa TID" />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPayModalOpen(false)}>
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setIsPayModalOpen(false);
                        toast.success(
                          "Payment proof submitted! Finance team will verify within 1 hour.",
                        );
                      }}
                    >
                      Confirm Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* TAB 4: DRIVER & VEHICLE INFORMATION */}
            <TabsContent value="driver" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Driver Profile */}
                <div className="lg:col-span-6 card-elevated p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-xl shadow-md">
                      MT
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">
                          {studentData.driverName}
                        </h3>
                        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">
                          Verified Captain
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Senior Transport Captain &bull; NUST Sector Routes
                      </p>
                      <p className="text-xs text-amber-600 font-semibold mt-0.5">
                        Rating: {studentData.driverRating} / 5.0 (142 passenger reviews)
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-border text-xs">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-muted-foreground">UTS Commercial Driver License:</span>
                      <strong className="font-mono text-foreground">
                        {studentData.driverLicense}
                      </strong>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-muted-foreground">Assigned Contact Mobile:</span>
                      <a
                        href={`tel:${studentData.driverPhone}`}
                        className="font-bold text-primary hover:underline"
                      >
                        {studentData.driverPhone}
                      </a>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-muted-foreground">Current Route Status:</span>
                      <span className="font-semibold text-emerald-600">
                        On Route &bull; Approaching {studentData.pickupStop}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-muted-foreground">Shift Schedule:</span>
                      <span className="text-foreground">
                        Morning: 07:15 AM - 08:30 AM | Evening: 04:30 PM - 05:45 PM
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button asChild size="default" className="w-full font-bold">
                      <a href={`tel:${studentData.driverPhone}`}>
                        <Phone className="mr-1.5 h-4 w-4" /> Call Driver
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="default" className="w-full">
                      <a
                        href={`https://wa.me/923124567891?text=Hello%20Driver%20Muhammad%20Tariq,%20this%20is%20Ahmed%20from%20G-10.`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp Driver
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Assigned Vehicle Details */}
                <div className="lg:col-span-6 card-elevated p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                      <Bus className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-bold text-foreground">
                        Assigned Vehicle Profile
                      </h3>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {studentData.vehicleCode}
                    </Badge>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Make & Model:</span>
                      <strong className="text-foreground">{studentData.vehicleType}</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Passenger Capacity:</span>
                      <strong className="text-foreground">28 Seats (Dedicated NUST Coaster)</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Safety & Telemetry:</span>
                      <span className="text-emerald-600 font-semibold">
                        GPS Live + Driver Attendance Console + Speed Limiter (60 km/h)
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Air Conditioning:</span>
                      <span className="text-foreground font-semibold">
                        Dual Climate Controlled AC (Active)
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs">
                    <div className="flex items-center gap-2 text-destructive font-bold mb-1">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>24/7 UTS Emergency Control Desk</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      For roadside assistance, unexpected breakdowns, or schedule inquiries, contact
                      UTS Central Dispatch:
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button asChild variant="destructive" size="sm" className="w-full text-xs">
                        <a href="tel:03124567891">
                          <Phone className="mr-1 h-3 w-3" /> Call Hotline: 03124567891
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 5: LODGE COMPLAINT / ROUTE FEEDBACK */}
            <TabsContent value="feedback">
              <div className="card-elevated p-8 max-w-xl mx-auto">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">
                    Lodge Route Feedback or Complaint
                  </h3>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Your feedback is directly routed to the UTS Operations Dispatch team for immediate
                  review and resolution.
                </p>

                <form onSubmit={handleLodgeComplaint} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="complaint-cat">Issue Category</Label>
                    <Select value={complaintCategory} onValueChange={setComplaintCategory}>
                      <SelectTrigger id="complaint-cat">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLAINT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complaint-desc">Details of the Issue</Label>
                    <Textarea
                      id="complaint-desc"
                      rows={4}
                      placeholder="Please specify date, stop location, or what occurred during your route..."
                      value={complaintDesc}
                      onChange={(e) => setComplaintDesc(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submittingComplaint}>
                    <Send className="mr-2 h-4 w-4" />
                    {submittingComplaint
                      ? "Submitting to Dispatch..."
                      : "Submit Complaint to Operations"}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </PublicLayout>
  );
}
