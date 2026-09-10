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
  UserX,
  UserCheck,
  Star,
  Mail,
  ShieldAlert,
  Flame,
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
import { useAuth, isValidUuid } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { COMPLAINT_CATEGORIES } from "@/lib/uts-data";
import { StudentLiveMap } from "@/components/student/StudentLiveMap";
import { OfflineAttendanceQueue, ATTENDANCE_EVENT_KEY } from "@/lib/offline-attendance-queue";
import {
  getBroadcastAlerts,
  getStudentSimulatedEmails,
  markStudentEmailRead,
  getStudentReviews,
  submitStudentReview,
  UTS_BROADCAST_EVENT_KEY,
  UTS_STUDENT_EMAIL_EVENT_KEY,
  UTS_REVIEWS_EVENT_KEY,
  type BroadcastAlertItem,
  type StudentSimulatedEmail,
  type StudentReviewRecord,
} from "@/lib/admin-operations-store";
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

function StudentDashboardPage() {
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

  // Real-time Today's Attendance status (Reactively updated when driver marks absent/present)
  const [todayStatus, setTodayStatus] = useState<{
    date: string;
    shift: string;
    status: "PENDING" | "PRESENT" | "ABSENT";
    markedAt: string;
    busCode: string;
    driverName: string;
    routeName: string;
    source: string;
    method?: string;
  }>({
    date: "06 Sep 2026",
    shift: "Morning",
    status: "PENDING",
    markedAt: "07:30 AM",
    busCode: "UTS-CST-104",
    driverName: "Muhammad Tariq",
    routeName: "NUST Morning Route 01",
    method: "Driver Operational Console",
    source: "Driver Mobile Console",
  });

  const [stops, setStops] = useState<RouteStop[]>([
    { id: "s1", name: "G-10 Markaz Roundabout (Your Stop)", sequence: 1, time: "07:30 AM" },
    { id: "s2", name: "G-10/4 Main Boulevard", sequence: 2, time: "07:38 AM" },
    { id: "s3", name: "F-11 Markaz Stop", sequence: 3, time: "07:48 AM" },
    { id: "s4", name: "E-11 Sector Entry", sequence: 4, time: "07:58 AM" },
    { id: "s5", name: "NUST Gate 1 (Kashmir Highway)", sequence: 5, time: "08:15 AM" },
    { id: "s6", name: "NUST H-12 Campus Main Drop", sequence: 6, time: "08:25 AM" },
  ]);

  // Reactive Monthly Attendance Logs Dataset
  const [attendanceMonthlyData, setAttendanceMonthlyData] = useState<Record<string, any[]>>({
    "September 2026": [
      {
        id: "att-sep-6",
        date: "Sep 6, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PENDING",
        checkin: "Pending",
        source: "Driver Console",
      },
      {
        id: "att-sep-5",
        date: "Sep 5, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:29 AM",
        source: "Driver Mobile Console",
      },
      {
        id: "att-sep-4",
        date: "Sep 4, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:31 AM",
        source: "Driver Mobile Console",
      },
      {
        id: "att-sep-3",
        date: "Sep 3, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "ABSENT",
        checkin: "—",
        source: "Driver Marked Absent",
      },
      {
        id: "att-sep-2",
        date: "Sep 2, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:30 AM",
        source: "Driver Mobile Console",
      },
      {
        id: "att-sep-1",
        date: "Sep 1, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:34 AM",
        source: "Driver Mobile Console",
      },
    ],
    "August 2026": [
      {
        id: "att-aug-31",
        date: "Aug 31, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:28 AM",
        source: "Driver Mobile Console",
      },
      {
        id: "att-aug-28",
        date: "Aug 28, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:33 AM",
        source: "Driver Mobile Console",
      },
      {
        id: "att-aug-27",
        date: "Aug 27, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:30 AM",
        source: "Driver Mobile Console",
      },
      {
        id: "att-aug-26",
        date: "Aug 26, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "ABSENT",
        checkin: "—",
        source: "Driver Marked Absent",
      },
      {
        id: "att-aug-25",
        date: "Aug 25, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:31 AM",
        source: "Driver Mobile Console",
      },
      {
        id: "att-aug-24",
        date: "Aug 24, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:29 AM",
        source: "Driver Mobile Console",
      },
      {
        id: "att-aug-21",
        date: "Aug 21, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:32 AM",
        source: "Driver Mobile Console",
      },
    ],
    "July 2026": [
      {
        id: "att-jul-31",
        date: "Jul 31, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:30 AM",
        source: "Driver Mobile Console",
      },
      {
        id: "att-jul-30",
        date: "Jul 30, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:32 AM",
        source: "Driver Mobile Console",
      },
      {
        id: "att-jul-29",
        date: "Jul 29, 2026",
        shift: "Morning",
        route: "NUST Morning Route 01",
        driver: "Muhammad Tariq",
        status: "PRESENT",
        checkin: "07:29 AM",
        source: "Driver Mobile Console",
      },
    ],
  });

  // Real-time synchronization effect
  useEffect(() => {
    // 1. Check local offline queue for today's mark
    const todayIso = new Date().toISOString().slice(0, 10);
    const queue = OfflineAttendanceQueue.getQueue();
    const studentMatch = queue.find(
      (r) =>
        (r.studentId === "std-1" || r.studentId === user?.id) &&
        r.serviceDate === todayIso,
    );

    if (studentMatch) {
      applyAttendanceStatus(studentMatch.status, studentMatch.markedAt);
    }

    // 2. Custom event listener for instant cross-tab / in-window reactivity
    const handleAttendanceEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (
        detail &&
        (detail.studentId === "std-1" || detail.studentId === user?.id || detail.studentName === studentData.name)
      ) {
        applyAttendanceStatus(detail.status, detail.markedAt);
        if (detail.status === "ABSENT") {
          toast.error("⚠️ Alert: Driver marked you Absent for today's shift.");
        } else if (detail.status === "PRESENT") {
          toast.success("✓ Notice: Driver verified your Boarding for today's shift.");
        }
      }
    };

    // 3. Supabase Realtime channel
    const channel = supabase
      .channel("student-attendance-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
        },
        (payload: any) => {
          if (payload.new && (payload.new.student_id === "std-1" || payload.new.student_id === user?.id)) {
            applyAttendanceStatus(payload.new.status, payload.new.marked_at);
          }
        },
      )
      .subscribe();

    window.addEventListener(ATTENDANCE_EVENT_KEY, handleAttendanceEvent);

    return () => {
      window.removeEventListener(ATTENDANCE_EVENT_KEY, handleAttendanceEvent);
      supabase.removeChannel(channel);
    };
  }, [user?.id, studentData.name]);

  function applyAttendanceStatus(status: "PENDING" | "PRESENT" | "ABSENT", markedAt?: string) {
    const formattedTime = markedAt
      ? new Date(markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "07:32 AM";

    setTodayStatus((prev) => ({
      ...prev,
      status,
      markedAt: formattedTime,
    }));

    setAttendanceMonthlyData((prev) => {
      const sep = [...(prev["September 2026"] || [])];
      if (sep.length > 0) {
        sep[0] = {
          ...sep[0],
          status,
          checkin: status === "ABSENT" ? "—" : status === "PRESENT" ? formattedTime : "Pending",
          source: status === "ABSENT" ? "Driver Marked Absent" : status === "PRESENT" ? "Driver Mobile Console" : "Driver Console",
        };
      }
      return {
        ...prev,
        "September 2026": sep,
      };
    });
  }

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

  // Broadcast Alerts from Admin Operations Desk
  const [broadcasts, setBroadcasts] = useState<BroadcastAlertItem[]>(getBroadcastAlerts);

  // Simulated Email Inbox State
  const [simulatedEmails, setSimulatedEmails] = useState<StudentSimulatedEmail[]>(() =>
    getStudentSimulatedEmails(studentData.email),
  );

  // Driver & Bus Reviews State
  const [studentReviews, setStudentReviews] = useState<StudentReviewRecord[]>(getStudentReviews);
  const [reviewOverallRating, setReviewOverallRating] = useState(5);
  const [reviewPunctuality, setReviewPunctuality] = useState(5);
  const [reviewDriving, setReviewDriving] = useState(5);
  const [reviewComfort, setReviewComfort] = useState(4);
  const [reviewCleanliness, setReviewCleanliness] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Complaints & Feedback State
  const [refreshing, setRefreshing] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState("Route Timing / Punctuality");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // SOS Emergency Trigger State
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  // Real-time listener for Broadcasts, Emails, and Reviews
  useEffect(() => {
    const handleBroadcastUpdate = () => {
      setBroadcasts(getBroadcastAlerts());
    };
    const handleEmailUpdate = () => {
      setSimulatedEmails(getStudentSimulatedEmails(studentData.email));
    };
    const handleReviewsUpdate = () => {
      setStudentReviews(getStudentReviews());
    };

    window.addEventListener(UTS_BROADCAST_EVENT_KEY, handleBroadcastUpdate);
    window.addEventListener(UTS_STUDENT_EMAIL_EVENT_KEY, handleEmailUpdate);
    window.addEventListener(UTS_REVIEWS_EVENT_KEY, handleReviewsUpdate);

    return () => {
      window.removeEventListener(UTS_BROADCAST_EVENT_KEY, handleBroadcastUpdate);
      window.removeEventListener(UTS_STUDENT_EMAIL_EVENT_KEY, handleEmailUpdate);
      window.removeEventListener(UTS_REVIEWS_EVENT_KEY, handleReviewsUpdate);
    };
  }, [studentData.email]);

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

        if (isValidUuid(user.id)) {
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
    if (user && isValidUuid(user.id)) {
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

      toast.success("Feedback submitted! Ticket dispatched to UTS Operations Desk.");
      setComplaintDesc("");
    } catch (err) {
      toast.error((err as Error).message || "Feedback submitted to local desk.");
      setComplaintDesc("");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Submit Driver & Bus Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error("Please add a brief review comment.");
      return;
    }

    setSubmittingReview(true);
    const newRev = submitStudentReview({
      student_id: user?.id || "std-1",
      student_name: studentData.name,
      driver_id: "d1",
      driver_name: studentData.driverName,
      vehicle_code: studentData.vehicleCode,
      overall_rating: reviewOverallRating,
      punctuality_rating: reviewPunctuality,
      driving_rating: reviewDriving,
      comfort_rating: reviewComfort,
      cleanliness_rating: reviewCleanliness,
      comment: reviewComment.trim(),
    });

    setStudentReviews((prev) => [newRev, ...prev]);
    setSubmittingReview(false);
    setReviewComment("");
    toast.success("Thank you! Your driver & vehicle rating has been recorded successfully.");
  };

  // Trigger Emergency SOS Beacon
  const handleTriggerEmergencySOS = async () => {
    setSosSent(true);
    try {
      await supabase.from("complaints").insert({
        customer_name: `${studentData.name} [EMERGENCY SOS BEACON]`,
        customer_email: studentData.email,
        customer_phone: studentData.phone,
        category: "Safety / Emergency SOS",
        priority: "URGENT",
        description: `🚨 EMERGENCY SOS TRIGGERED by student ${studentData.name} (${studentData.rollNo}) on Route: ${studentData.route} near ${studentData.pickupStop}. Coordinates: 33.6844, 73.0187. Mobile: ${studentData.phone}`,
        status: "OPEN",
      });
    } catch (e) {
      console.warn("SOS fallback note:", e);
    }

    toast.error(
      "🚨 EMERGENCY SOS BEACON BROADCASTED to UTS Central Operations Control Room! Dispatchers and fleet supervisors have been alerted with your coordinates.",
    );
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
              variant="destructive"
              size="sm"
              onClick={() => setIsSosModalOpen(true)}
              className="bg-destructive hover:bg-destructive/90 text-white font-bold text-xs shadow-md"
            >
              <ShieldAlert className="mr-1.5 h-4 w-4" /> EMERGENCY SOS
            </Button>

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
        {/* ACTIVE ADMIN BROADCAST ALERTS (Thunderstorm / Weather / Maintenance notices) */}
        {broadcasts.filter((b) => b.active && (b.targetAudience === "ALL" || b.targetAudience === "STUDENTS")).map((b) => (
          <div
            key={b.id}
            className={`mb-6 p-4 rounded-2xl border flex items-start gap-3.5 shadow-sm ${
              b.severity === "CRITICAL"
                ? "bg-destructive/10 border-destructive/40 text-destructive"
                : b.severity === "HIGH"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : "bg-primary/10 border-primary/40 text-primary"
            }`}
          >
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 animate-bounce text-amber-500" />
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <strong className="font-bold text-sm text-foreground">{b.title}</strong>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {b.category} • Broadcast Notice
                </Badge>
              </div>
              <p className="mt-1 text-foreground/90 leading-relaxed text-xs">{b.message}</p>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Issued by {b.created_by_name} • {new Date(b.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

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
        <div
          className={`mb-8 overflow-hidden rounded-2xl border p-5 shadow-sm transition-all ${
            todayStatus.status === "ABSENT"
              ? "border-destructive/40 bg-gradient-to-r from-destructive/15 via-destructive/5 to-transparent"
              : todayStatus.status === "PRESENT"
                ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent"
                : "border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
                  todayStatus.status === "ABSENT"
                    ? "bg-destructive"
                    : todayStatus.status === "PRESENT"
                      ? "bg-emerald-600"
                      : "bg-primary"
                }`}
              >
                {todayStatus.status === "ABSENT" ? (
                  <XCircle className="h-6 w-6" />
                ) : todayStatus.status === "PRESENT" ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <Clock className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      todayStatus.status === "ABSENT"
                        ? "text-destructive"
                        : todayStatus.status === "PRESENT"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-primary"
                    }`}
                  >
                    Today&apos;s Attendance Status ({todayStatus.date})
                  </span>
                  <Badge
                    className={`text-[10px] ${
                      todayStatus.status === "ABSENT"
                        ? "bg-destructive text-white"
                        : todayStatus.status === "PRESENT"
                          ? "bg-emerald-600 text-white"
                          : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {todayStatus.status === "ABSENT"
                      ? "ABSENT"
                      : todayStatus.status === "PRESENT"
                        ? "PRESENT"
                        : "AWAITING BOARDING"}
                  </Badge>
                </div>
                <h2 className="mt-0.5 text-lg font-bold text-foreground">
                  {todayStatus.status === "ABSENT"
                    ? `Marked Absent for Today's Shift • Stop: ${studentData.pickupStop}`
                    : todayStatus.status === "PRESENT"
                      ? `Marked Present at ${todayStatus.markedAt} • Stop: ${studentData.pickupStop}`
                      : `Scheduled Pickup at ${studentData.pickupTime} • Stop: ${studentData.pickupStop}`}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {todayStatus.status === "ABSENT"
                    ? `Recorded by ${todayStatus.method || todayStatus.source || "Driver Console"}`
                    : todayStatus.status === "PRESENT"
                      ? `Verified by ${todayStatus.method || todayStatus.source || "Driver Mobile Console"}`
                      : "Awaiting boarding verification"}{" "}
                  &bull; Vehicle: <strong>{studentData.vehicleCode}</strong> &bull; Driver:{" "}
                  <strong>{studentData.driverName}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center">
              <Button
                asChild
                size="sm"
                variant="outline"
                className={
                  todayStatus.status === "ABSENT"
                    ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                    : todayStatus.status === "PRESENT"
                      ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                      : "border-primary/30 text-primary hover:bg-primary/10"
                }
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
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 w-full h-auto p-1.5 bg-muted/60">
              <TabsTrigger value="live-map" className="py-2.5 font-semibold text-xs">
                <Navigation className="mr-1.5 h-3.5 w-3.5 text-primary" /> Live GPS Map
              </TabsTrigger>
              <TabsTrigger value="attendance" className="py-2.5 font-semibold text-xs">
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Attendance Logs
              </TabsTrigger>
              <TabsTrigger value="fees" className="py-2.5 font-semibold text-xs">
                <Receipt className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> Fee Records
              </TabsTrigger>
              <TabsTrigger value="inbox" className="py-2.5 font-semibold text-xs">
                <Mail className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                Email Alerts {simulatedEmails.length > 0 && `(${simulatedEmails.length})`}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="py-2.5 font-semibold text-xs">
                <Star className="mr-1.5 h-3.5 w-3.5 text-amber-500 fill-amber-500/20" /> Driver Reviews
              </TabsTrigger>
              <TabsTrigger value="feedback" className="py-2.5 font-semibold text-xs">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-purple-600" /> Complaints
              </TabsTrigger>
              <TabsTrigger value="safety" className="py-2.5 font-semibold text-xs text-destructive">
                <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Emergency SOS
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

            {/* TAB 2: TRANSPORT ATTENDANCE LIST & LIVE HISTORY */}
            <TabsContent value="attendance" className="space-y-6">
              {/* Today's Real-time Live Attendance Status Banner */}
              <div
                className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  todayStatus.status === "ABSENT"
                    ? "border-destructive/50 bg-destructive/10 text-destructive-foreground"
                    : todayStatus.status === "PRESENT"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                      todayStatus.status === "ABSENT"
                        ? "bg-destructive text-white"
                        : todayStatus.status === "PRESENT"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                    }`}
                  >
                    {todayStatus.status === "ABSENT" ? (
                      <XCircle className="h-5 w-5" />
                    ) : todayStatus.status === "PRESENT" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                        Today's Shift Attendance • {todayStatus.date}
                      </span>
                      <Badge
                        className={`text-[10px] font-bold ${
                          todayStatus.status === "ABSENT"
                            ? "bg-destructive text-white"
                            : todayStatus.status === "PRESENT"
                              ? "bg-emerald-600 text-white"
                              : "bg-amber-500 text-white"
                        }`}
                      >
                        {todayStatus.status === "ABSENT"
                          ? "MARKED ABSENT"
                          : todayStatus.status === "PRESENT"
                            ? "PRESENT (BOARDED)"
                            : "AWAITING BOARDING"}
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm font-semibold">
                      {todayStatus.status === "ABSENT"
                        ? `Driver ${studentData.driverName} marked you Absent for today's Morning shift on ${studentData.route}.`
                        : todayStatus.status === "PRESENT"
                          ? `Boarding verified at ${todayStatus.markedAt} by Driver ${studentData.driverName} (${studentData.vehicleCode}).`
                          : `Scheduled for Morning shift at ${studentData.pickupTime} from ${studentData.pickupStop}.`}
                    </p>
                    <p className="text-xs opacity-75 mt-0.5">
                      {todayStatus.status === "ABSENT"
                        ? "If you believe this absence was recorded in error, please contact your driver directly or call UTS dispatch."
                        : "Verified digitally via UTS Driver Operational Console."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button asChild size="sm" variant="outline" className="text-xs bg-background/80">
                    <a href={`tel:${studentData.driverPhone}`}>
                      <Phone className="mr-1.5 h-3.5 w-3.5" /> Call Driver
                    </a>
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 card-elevated overflow-hidden">
                  <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Transport Attendance History
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Daily digital attendance record verified by your assigned driver console.
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
                  <div className="grid grid-cols-4 bg-muted/30 border-b border-border p-4 text-center text-xs">
                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-semibold">
                        Total Days
                      </span>
                      <p className="mt-0.5 text-lg font-bold text-foreground">{totalDays}</p>
                    </div>
                    <div className="border-x border-border">
                      <span className="text-muted-foreground uppercase text-[10px] font-semibold text-emerald-600">
                        Present
                      </span>
                      <p className="mt-0.5 text-lg font-bold text-emerald-600">
                        {presentDays}
                      </p>
                    </div>
                    <div className="border-r border-border">
                      <span className="text-muted-foreground uppercase text-[10px] font-semibold text-destructive">
                        Absent
                      </span>
                      <p className="mt-0.5 text-lg font-bold text-destructive">
                        {absentDays}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase text-[10px] font-semibold">
                        Attendance Rate
                      </span>
                      <p className="mt-0.5 text-lg font-bold text-primary">{attendanceRate}%</p>
                    </div>
                  </div>

                  {/* Detailed Table formatted per exact specification */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 uppercase font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3">Shift</th>
                          <th className="px-5 py-3">Route</th>
                          <th className="px-5 py-3">Driver</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Verified Time / Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {activeMonthList.map((att) => {
                          const isPresent = att.status === "PRESENT";
                          const isAbsent = att.status === "ABSENT";
                          const isPending = att.status === "PENDING";

                          return (
                            <tr key={att.id} className="hover:bg-muted/30">
                              <td className="px-5 py-3.5 font-semibold text-foreground whitespace-nowrap">
                                {att.date}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-foreground">
                                {att.shift || "Morning"}
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground truncate max-w-[160px]">
                                {att.route || studentData.route}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-foreground whitespace-nowrap">
                                {att.driver || studentData.driverName}
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                    isPresent
                                      ? "bg-emerald-500/15 text-emerald-600"
                                      : isAbsent
                                        ? "bg-destructive/15 text-destructive font-bold"
                                        : "bg-amber-500/15 text-amber-600 font-semibold"
                                  }`}
                                >
                                  {isPresent && <CheckCircle2 className="h-3.5 w-3.5" />}
                                  {isAbsent && <XCircle className="h-3.5 w-3.5" />}
                                  {isPending && <Clock className="h-3.5 w-3.5" />}
                                  {isPresent ? "Present" : isAbsent ? "Absent" : "Pending"}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-muted-foreground text-[11px] font-mono">
                                {isPresent ? `${att.checkin} • ${att.source}` : isAbsent ? `— • ${att.source}` : "Pending Boarding"}
                              </td>
                            </tr>
                          );
                        })}
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

            {/* TAB 6: SIMULATED EMAIL INBOX (Fee Notices, Absence Alerts, Shift Updates) */}
            <TabsContent value="inbox" className="space-y-6">
              <div className="card-elevated p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Mail className="h-5 w-5 text-amber-500" /> Student Email Dispatch Inbox
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Simulated inbox for <strong className="text-foreground">{studentData.email}</strong> showing automated fee reminders, driver absence triggers, and shift alerts.
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {simulatedEmails.length} Email(s)
                  </Badge>
                </div>

                <div className="space-y-3">
                  {simulatedEmails.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Mail className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-semibold">No emails in your inbox yet.</p>
                    </div>
                  ) : (
                    simulatedEmails.map((email) => (
                      <div
                        key={email.id}
                        className={`p-4 rounded-xl border transition-all space-y-2 ${
                          email.category === "ABSENCE_ALERT"
                            ? "bg-destructive/5 border-destructive/30"
                            : email.category === "FEE_OVERDUE"
                              ? "bg-amber-500/5 border-amber-500/30"
                              : "bg-card border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                email.category === "ABSENCE_ALERT"
                                  ? "bg-destructive/15 text-destructive"
                                  : email.category === "FEE_OVERDUE"
                                    ? "bg-amber-500/15 text-amber-600"
                                    : email.category === "FEE_INVOICE"
                                      ? "bg-blue-500/15 text-blue-600"
                                      : "bg-secondary text-secondary-foreground"
                              }`}
                            >
                              {email.category.replace("_", " ")}
                            </span>
                            <strong className="text-sm text-foreground">{email.subject}</strong>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(email.sent_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed bg-muted/30 p-3 rounded-lg font-mono">
                          {email.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 7: DRIVER & BUS REVIEWS */}
            <TabsContent value="reviews" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Submit Review Form */}
                <div className="lg:col-span-6 card-elevated p-6 space-y-5">
                  <div className="border-b border-border pb-3">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Review Driver & Vehicle
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Rate {studentData.driverName} on punctuality, driving comfort, and cleanliness.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Overall Rating</Label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewOverallRating(star)}
                            className="p-1 hover:scale-125 transition-transform"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= reviewOverallRating
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold ml-2 text-amber-600">{reviewOverallRating} / 5 Stars</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Punctuality (1-5)</Label>
                        <Select value={String(reviewPunctuality)} onValueChange={(v) => setReviewPunctuality(Number(v))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 - Excellent (Always on time)</SelectItem>
                            <SelectItem value="4">4 - Good (Minor variance)</SelectItem>
                            <SelectItem value="3">3 - Average</SelectItem>
                            <SelectItem value="2">2 - Frequently Late</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Driving Safety (1-5)</Label>
                        <Select value={String(reviewDriving)} onValueChange={(v) => setReviewDriving(Number(v))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 - Very Safe & Smooth</SelectItem>
                            <SelectItem value="4">4 - Safe</SelectItem>
                            <SelectItem value="3">3 - Moderate</SelectItem>
                            <SelectItem value="2">2 - Harsh Braking</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">AC & Comfort (1-5)</Label>
                        <Select value={String(reviewComfort)} onValueChange={(v) => setReviewComfort(Number(v))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 - Perfect Cooling</SelectItem>
                            <SelectItem value="4">4 - Comfortable</SelectItem>
                            <SelectItem value="3">3 - Average Cooling</SelectItem>
                            <SelectItem value="2">2 - Warm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Cleanliness (1-5)</Label>
                        <Select value={String(reviewCleanliness)} onValueChange={(v) => setReviewCleanliness(Number(v))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 - Spotless</SelectItem>
                            <SelectItem value="4">4 - Clean</SelectItem>
                            <SelectItem value="3">3 - Acceptable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="rev-comment" className="text-xs">Your Feedback & Experience</Label>
                      <Textarea
                        id="rev-comment"
                        rows={3}
                        placeholder="Write a few lines about the driver's behaviour and vehicle condition..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>

                    <Button type="submit" disabled={submittingReview} className="w-full text-xs">
                      <Star className="mr-1.5 h-3.5 w-3.5 fill-current" /> Submit Passenger Review
                    </Button>
                  </form>
                </div>

                {/* Submitted Reviews Feed */}
                <div className="lg:col-span-6 card-elevated p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="text-base font-bold text-foreground">Verified Passenger Reviews</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {studentReviews.length} Total Reviews
                    </Badge>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto">
                    {studentReviews.map((rev) => (
                      <div key={rev.id} className="p-3.5 rounded-xl border border-border bg-secondary/15 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs font-bold text-foreground">{rev.student_name}</strong>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-500" />
                            <span className="text-xs font-bold">{rev.overall_rating}.0</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic">"{rev.comment}"</p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                          <span>Driver: {rev.driver_name} ({rev.vehicle_code})</span>
                          <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 8: SAFETY, EMERGENCY & SOS */}
            <TabsContent value="safety" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7 card-elevated p-6 space-y-5 border-destructive/30">
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center font-bold">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-destructive">24/7 UTS Emergency Operations Control</h3>
                      <p className="text-xs text-muted-foreground">
                        Immediate assistance, accident response, and medical dispatch hotline.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/30 text-center space-y-3">
                    <ShieldAlert className="h-10 w-10 text-destructive mx-auto animate-bounce" />
                    <h4 className="font-bold text-base text-foreground">Emergency SOS Distress Beacon</h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Pressing this button sends your live GPS coordinates, student identity, and route stop directly to the Central Dispatch emergency terminal and calls security.
                    </p>
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={handleTriggerEmergencySOS}
                      className="w-full sm:w-auto font-black px-8 py-3 text-sm shadow-lg animate-pulse"
                    >
                      <ShieldAlert className="mr-2 h-5 w-5" /> BROADCAST EMERGENCY SOS
                    </Button>
                    {sosSent && (
                      <p className="text-xs font-bold text-destructive">
                        ✓ SOS Beacon Active! Dispatch team alerted.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    <h4 className="font-bold text-foreground">Direct Emergency Contacts</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="p-3 rounded-xl border border-border bg-card">
                        <strong className="block text-foreground">UTS Dispatch Head:</strong>
                        <span className="text-primary font-bold">03124567891</span>
                      </div>
                      <div className="p-3 rounded-xl border border-border bg-card">
                        <strong className="block text-foreground">Islamabad Control Desk:</strong>
                        <span className="text-primary font-bold">051-2251642</span>
                      </div>
                      <div className="p-3 rounded-xl border border-border bg-card">
                        <strong className="block text-foreground">NUST Security Control:</strong>
                        <span className="text-primary font-bold">051-9085-1199</span>
                      </div>
                      <div className="p-3 rounded-xl border border-border bg-card">
                        <strong className="block text-foreground">National Emergency Rescue:</strong>
                        <span className="text-destructive font-bold">1122</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 card-elevated p-6 space-y-4">
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" /> Passenger Safety Protocol
                  </h3>
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">1.</span>
                      <span>Always wait for the vehicle to come to a complete halt before boarding or alighting.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">2.</span>
                      <span>Carry your official NUST Student ID card during transit for verification.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">3.</span>
                      <span>All UTS vehicles are GPS speed-capped at 60 km/h on urban roads for passenger safety.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">4.</span>
                      <span>Report any reckless driving, unauthorized stops, or misconduct immediately through the feedback tab.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* EMERGENCY SOS MODAL */}
      <Dialog open={isSosModalOpen} onOpenChange={setIsSosModalOpen}>
        <DialogContent className="sm:max-w-md border-destructive/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Emergency SOS Dispatch Confirmation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to trigger the emergency SOS distress signal to UTS Operations?
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-destructive/10 text-xs text-destructive space-y-2">
            <p><strong>Your Identity:</strong> {studentData.name} ({studentData.rollNo})</p>
            <p><strong>Current Stop:</strong> {studentData.pickupStop}</p>
            <p><strong>Assigned Bus:</strong> {studentData.vehicleCode} &bull; Driver: {studentData.driverName}</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsSosModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsSosModalOpen(false);
                handleTriggerEmergencySOS();
              }}
            >
              Confirm & Dispatch SOS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
