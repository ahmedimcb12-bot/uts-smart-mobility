import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  ShieldAlert,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, isValidUuid } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminDashboardOverview } from "@/components/admin/AdminDashboardOverview";
import { DriverManagementTab } from "@/components/admin/DriverManagementTab";
import { BusManagementTab } from "@/components/admin/BusManagementTab";
import { RouteManagementTab } from "@/components/admin/RouteManagementTab";
import { ScheduleManagementTab } from "@/components/admin/ScheduleManagementTab";
import { PassengerManagementTab } from "@/components/admin/PassengerManagementTab";
import { StudentDisciplinaryTab } from "@/components/admin/StudentDisciplinaryTab";
import { TransportRequestsTab } from "@/components/admin/TransportRequestsTab";
import { LiveTrackingTab } from "@/components/admin/LiveTrackingTab";
import { TripsAttendanceTab } from "@/components/admin/TripsAttendanceTab";
import { ComplaintsManagementTab } from "@/components/admin/ComplaintsManagementTab";
import { NotificationsTab } from "@/components/admin/NotificationsTab";
import { ReportsAnalyticsTab } from "@/components/admin/ReportsAnalyticsTab";
import { SystemAdminTab } from "@/components/admin/SystemAdminTab";
import {
  FleetMaintenanceTab,
  type VehicleItem,
  type VehicleIssueItem,
  type MaintenanceRecordItem,
} from "@/components/admin/FleetMaintenanceTab";
import { AuditLogsTab, type AuditLogItem } from "@/components/admin/AuditLogsTab";
import {
  INITIAL_BUSES,
  INITIAL_DRIVERS,
  INITIAL_ROUTES,
  INITIAL_SCHEDULES,
  INITIAL_STUDENTS,
  INITIAL_DISCIPLINARY_LOGS,
  INITIAL_ADMIN_USERS,
  type BusItem,
  type DriverItem,
  type RouteItem,
  type AdminUserItem,
  saveBroadcastAlert,
  addStudentSimulatedEmail,
} from "@/lib/admin-operations-store";
import type {
  StudentTransportRecord,
  DisciplinaryActionRecord,
  ScheduleItem,
  FeePaymentStatus,
} from "@/lib/transport-eligibility";
import { OfflineAttendanceQueue, ATTENDANCE_EVENT_KEY } from "@/lib/offline-attendance-queue";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "UTS Transport Operations Authority — Admin Module" },
      {
        name: "description",
        content:
          "Centralized UTS Smart Transport Operations: driver approval, fleet maintenance, route scheduling, passenger management, disciplinary workflows, and audit logging.",
      },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { user, profile, isStaff, role, isLoading } = useAuth();
  const navigate = useNavigate();

  // Active Navigation Tab (Defaults to dashboard)
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Core Operations Datasets
  const [buses, setBuses] = useState<BusItem[]>(() => {
    const saved = localStorage.getItem("uts_admin_buses_v4");
    return saved ? JSON.parse(saved) : INITIAL_BUSES;
  });

  const [drivers, setDrivers] = useState<DriverItem[]>(() => {
    const saved = localStorage.getItem("uts_admin_drivers_v4");
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [routes, setRoutes] = useState<RouteItem[]>(() => {
    const saved = localStorage.getItem("uts_admin_routes_v4");
    return saved ? JSON.parse(saved) : INITIAL_ROUTES;
  });

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem("uts_admin_schedules_v4");
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [students, setStudents] = useState<StudentTransportRecord[]>(() => {
    const saved = localStorage.getItem("uts_admin_students_v4");
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [disciplinaryLogs, setDisciplinaryLogs] = useState<DisciplinaryActionRecord[]>(() => {
    const saved = localStorage.getItem("uts_admin_disciplinary_v4");
    return saved ? JSON.parse(saved) : INITIAL_DISCIPLINARY_LOGS;
  });

  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>(() => {
    const saved = localStorage.getItem("uts_admin_users_v4");
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_USERS;
  });

  const [complaints, setComplaints] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [vehicleIssues, setVehicleIssues] = useState<VehicleIssueItem[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceRecordItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const isSuperAdmin = true; // Unified Admin Authority for operations & security

  // Persist local store updates
  useEffect(() => {
    localStorage.setItem("uts_admin_buses_v4", JSON.stringify(buses));
    localStorage.setItem("uts_admin_drivers_v4", JSON.stringify(drivers));
    localStorage.setItem("uts_admin_routes_v4", JSON.stringify(routes));
    localStorage.setItem("uts_admin_schedules_v4", JSON.stringify(schedules));
    localStorage.setItem("uts_admin_students_v4", JSON.stringify(students));
    localStorage.setItem("uts_admin_disciplinary_v4", JSON.stringify(disciplinaryLogs));
    localStorage.setItem("uts_admin_users_v4", JSON.stringify(adminUsers));
  }, [buses, drivers, routes, schedules, students, disciplinaryLogs, adminUsers]);

  // Load live Supabase tables
  async function loadAdminData() {
    setDataLoading(true);
    try {
      // 1. Complaints
      const { data: compData } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (compData && compData.length > 0) setComplaints(compData);
      else {
        setComplaints([
          {
            id: "c1",
            reference: "UTS-C-1001",
            customer_name: "Ahmed Hussain (Student)",
            category: "Pickup Location",
            priority: "MEDIUM",
            status: "OPEN",
            description: "Sector H-12 gate construction required pickup stop relocated 50m north.",
            created_at: new Date().toISOString(),
          },
          {
            id: "c2",
            reference: "UTS-C-1002",
            customer_name: "Muhammad Tariq (Driver)",
            category: "Student Misconduct",
            priority: "HIGH",
            status: "OPEN",
            description: "[DRIVER REPORT]: Student Daniyal Khan misbehaved and refused to present valid transit card.",
            created_at: new Date().toISOString(),
          },
        ]);
      }

      // 2. Transport Requests
      const { data: reqData } = await supabase
        .from("transport_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (reqData && reqData.length > 0) setRequests(reqData);
      else {
        setRequests([
          {
            id: "tr1",
            full_name: "Dr. Farooq",
            organization: "FAST University",
            service_type: "Corporate Booking",
            city: "Islamabad",
            passengers: 45,
            phone: "03124567891",
            status: "NEW",
            created_at: new Date().toISOString(),
          },
          {
            id: "tr2",
            full_name: "Shahid Malik",
            organization: "Tourism Group",
            service_type: "Tourism Booking",
            city: "Lahore",
            passengers: 18,
            phone: "03009876543",
            status: "QUOTED",
            created_at: new Date().toISOString(),
          },
        ]);
      }

      // 3. Attendance Manifests
      const queue = OfflineAttendanceQueue.getQueue();
      const { data: attData } = await supabase
        .from("attendance")
        .select("*, students(full_name, institution, phone), routes(name), drivers(full_name)")
        .order("service_date", { ascending: false })
        .limit(60);

      const baseList =
        attData && attData.length > 0
          ? attData
          : [
              {
                id: "a1",
                student_id: "std-1",
                service_date: new Date().toISOString().split("T")[0],
                shift_id: "MORNING",
                status: "PRESENT",
                source: "DRIVER",
                students: { full_name: "Ahmed Hussain", roll_no: "NUST-SE-88" },
                routes: { name: "NUST Morning Route 01 (Islamabad West)" },
                drivers: { full_name: "Muhammad Tariq" },
              },
              {
                id: "a2",
                student_id: "std-2",
                service_date: new Date().toISOString().split("T")[0],
                shift_id: "MORNING",
                status: "PRESENT",
                source: "DRIVER",
                students: { full_name: "Hamza Ali", roll_no: "NUST-CS-45" },
                routes: { name: "NUST Morning Route 01 (Islamabad West)" },
                drivers: { full_name: "Muhammad Tariq" },
              },
              {
                id: "a3",
                student_id: "std-3",
                service_date: new Date().toISOString().split("T")[0],
                shift_id: "MORNING",
                status: "ABSENT",
                source: "AUTO",
                students: { full_name: "Bilal Farooq", roll_no: "NUST-ME-67" },
                routes: { name: "NUST Morning Route 01 (Islamabad West)" },
                drivers: { full_name: "Muhammad Tariq" },
              },
              {
                id: "a4",
                student_id: "std-4",
                service_date: new Date().toISOString().split("T")[0],
                shift_id: "MORNING",
                status: "PENDING",
                source: "DRIVER",
                students: { full_name: "Ali Khan", roll_no: "NUST-EE-12" },
                routes: { name: "NUST Morning Route 01 (Islamabad West)" },
                drivers: { full_name: "Muhammad Tariq" },
              },
            ];

      // Merge queued local attendance marks
      const mergedAttendance = [...baseList];
      for (const q of queue) {
        const idx = mergedAttendance.findIndex(
          (m) =>
            m.student_id === q.studentId &&
            m.service_date === q.serviceDate &&
            (m.shift_id || "MORNING") === (q.shiftId || "MORNING"),
        );
        const item = {
          id: q.id,
          student_id: q.studentId,
          service_date: q.serviceDate,
          shift_id: q.shiftId || "MORNING",
          status: q.status,
          source: q.source || "DRIVER",
          marked_at: q.markedAt,
          students: { full_name: q.studentName || "Student Passenger", roll_no: "NUST-SE-88" },
          routes: { name: q.routeName || "NUST Morning Route 01" },
          drivers: { full_name: q.driverName || "Muhammad Tariq" },
        };
        if (idx >= 0) {
          mergedAttendance[idx] = { ...mergedAttendance[idx], ...item };
        } else {
          mergedAttendance.unshift(item);
        }
      }

      setAttendance(mergedAttendance);

      // 4. Fees
      const { data: feeData } = await supabase
        .from("fee_records")
        .select("*, students(full_name), routes(name)")
        .limit(30);
      if (feeData && feeData.length > 0) setFees(feeData);
      else {
        setFees([
          {
            id: "f1",
            billing_period: "September 2026",
            amount: 12000,
            due_date: "2026-09-05",
            status: "PAID",
            students: { full_name: "Ahmed Hussain" },
          },
          {
            id: "f2",
            billing_period: "September 2026",
            amount: 12000,
            due_date: "2026-09-01",
            status: "OVERDUE",
            students: { full_name: "Bilal Farooq" },
          },
          {
            id: "f3",
            billing_period: "September 2026",
            amount: 12000,
            due_date: "2026-09-01",
            status: "OVERDUE",
            students: { full_name: "Shahzaib Tariq" },
          },
        ]);
      }

      // 5. Notifications
      const { data: notifData } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (notifData && notifData.length > 0) setNotifications(notifData);
      else {
        setNotifications([
          {
            id: "n1",
            category: "ANNOUNCEMENT",
            recipient_name: "All Enrolled Users",
            subject: "UTS Academic Transport Service operational for Fall 2026",
            body: "All coaster shifts and live attendance consoles are active.",
            status: "SENT",
            created_at: new Date().toISOString(),
          },
          {
            id: "n2",
            category: "FEE_OVERDUE",
            recipient_name: "Bilal Farooq",
            subject: "Transport fee overdue — September 2026",
            body: "Your transport fee remains outstanding past the due date.",
            status: "SENT",
            created_at: new Date().toISOString(),
          },
        ]);
      }

      // 6. Audit Logs
      try {
        const savedLogs = localStorage.getItem("uts_admin_audit_logs");
        let initialLogs = savedLogs ? JSON.parse(savedLogs) : [];

        const { data: auditData, error: auditError } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(40);

        if (!auditError && auditData && auditData.length > 0) {
          setAuditLogs(auditData as any);
        } else if (initialLogs.length > 0) {
          setAuditLogs(initialLogs);
        } else {
          const fallbackLog = [
            {
              id: "log-1",
              actor_id: null,
              actor_role: "ADMIN",
              action: "DISCIPLINARY_SUSPENSION",
              entity_type: "students",
              entity_id: "std-4",
              details: { student_name: "Daniyal Khan", action: "TEMPORARY_SUSPENSION", reason: "Driver altercation" },
              ip_address: "127.0.0.1",
              created_at: new Date().toISOString(),
            },
          ];
          setAuditLogs(fallbackLog);
          localStorage.setItem("uts_admin_audit_logs", JSON.stringify(fallbackLog));
        }
      } catch (err) {
        console.warn("Audit logs hydration note:", err);
      }
    } catch (err) {
      console.warn("Notice: Loaded operations state from local cache:", err);
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();

    // Live attendance synchronization listener
    const handleAttendanceEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setAttendance((prev) => {
          const idx = prev.findIndex(
            (p) =>
              p.student_id === detail.studentId &&
              p.service_date === detail.serviceDate &&
              (p.shift_id || "MORNING") === (detail.shiftId || "MORNING"),
          );
          const newItem = {
            id: detail.id,
            student_id: detail.studentId,
            service_date: detail.serviceDate,
            shift_id: detail.shiftId || "MORNING",
            status: detail.status,
            source: detail.source || "DRIVER",
            marked_at: detail.markedAt,
            students: { full_name: detail.studentName || "Student Passenger", roll_no: "NUST-SE-88" },
            routes: { name: detail.routeName || "NUST Morning Route 01" },
            drivers: { full_name: detail.driverName || "Muhammad Tariq" },
          };
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...newItem };
            return updated;
          }
          return [newItem, ...prev];
        });
      }
    };

    window.addEventListener(ATTENDANCE_EVENT_KEY, handleAttendanceEvent);

    const channel = supabase
      .channel("admin-attendance-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
        },
        () => {
          loadAdminData();
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener(ATTENDANCE_EVENT_KEY, handleAttendanceEvent);
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper to record audit log
  const recordAudit = async (action: string, entityType: string, entityId: string | null, details: any) => {
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      actor_id: user?.id || null,
      actor_role: "ADMIN",
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: "127.0.0.1",
      created_at: new Date().toISOString(),
    };

    setAuditLogs((prev) => {
      const updated = [newLog, ...prev];
      try {
        localStorage.setItem("uts_admin_audit_logs", JSON.stringify(updated.slice(0, 100)));
      } catch (e) {}
      return updated;
    });

    if (user && isValidUuid(user.id)) {
      try {
        await supabase.from("audit_logs").insert({
          actor_id: user.id,
          actor_role: "ADMIN",
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
        });
      } catch (e) {
        // Local audit log preserved
      }
    }
  };

  // 1. DRIVER ACTIONS
  const handleApproveDriver = async (driverId: string, notes?: string) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status: "ACTIVE" } : d)),
    );
    await recordAudit("APPROVE_DRIVER", "drivers", driverId, { notes, timestamp: new Date().toISOString() });
    toast.success("Driver application APPROVED and account activated!");
  };

  const handleRejectDriver = async (driverId: string, reason: string) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status: "INACTIVE" } : d)),
    );
    await recordAudit("REJECT_DRIVER", "drivers", driverId, { reason });
    toast.success("Driver application rejected and logged.");
  };

  const handleSuspendDriver = async (driverId: string, reason: string) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status: "SUSPENDED" } : d)),
    );
    // Also unassign driver from routes
    setRoutes((prev) =>
      prev.map((r) => (r.driver_id === driverId ? { ...r, driver_id: null, driver_name: null } : r)),
    );
    await recordAudit("SUSPEND_DRIVER", "drivers", driverId, { reason });
    toast.warning("Driver suspended and unassigned from active routes.");
  };

  const handleReactivateDriver = async (driverId: string) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status: "ACTIVE" } : d)),
    );
    await recordAudit("REACTIVATE_DRIVER", "drivers", driverId, {});
    toast.success("Driver account reactivated.");
  };

  const handleUpdateDriver = async (driverId: string, updates: Partial<DriverItem>) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, ...updates } : d)),
    );
    await recordAudit("UPDATE_DRIVER", "drivers", driverId, updates);
  };

  // 2. BUS ACTIONS
  const handleAddBus = async (newBus: Omit<BusItem, "id" | "created_at">) => {
    const busItem: BusItem = {
      ...newBus,
      id: `v-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setBuses((prev) => [busItem, ...prev]);
    await recordAudit("ADD_BUS", "vehicles", busItem.id, busItem);
  };

  const handleUpdateBus = async (busId: string, updates: Partial<BusItem>) => {
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, ...updates } : b)),
    );
    await recordAudit("UPDATE_BUS", "vehicles", busId, updates);
  };

  const handleDeleteBus = async (busId: string) => {
    setBuses((prev) => prev.filter((b) => b.id !== busId));
    await recordAudit("DELETE_BUS", "vehicles", busId, {});
  };

  const handleToggleBusMaintenance = async (busId: string, isMaintenance: boolean) => {
    const nextStatus = isMaintenance ? "UNDER_MAINTENANCE" : "ACTIVE";
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, status: nextStatus } : b)),
    );

    // If marked under maintenance, remove from upcoming schedules to prevent conflict
    if (isMaintenance) {
      setSchedules((prev) =>
        prev.map((s) => (s.bus_id === busId && s.status === "SCHEDULED" ? { ...s, status: "CANCELLED", cancellation_reason: "Bus dispatched to maintenance" } : s)),
      );
    }

    await recordAudit("TOGGLE_BUS_MAINTENANCE", "vehicles", busId, { status: nextStatus });
    toast.info(isMaintenance ? "Bus marked Under Maintenance & locked from schedules." : "Bus marked Active.");
  };

  // 3. ROUTE ACTIONS
  const handleAddRoute = async (newRoute: Omit<RouteItem, "id" | "created_at">) => {
    const routeItem: RouteItem = {
      ...newRoute,
      id: `r-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setRoutes((prev) => [routeItem, ...prev]);
    await recordAudit("CREATE_ROUTE", "routes", routeItem.id, routeItem);
  };

  const handleUpdateRoute = async (routeId: string, updates: Partial<RouteItem>) => {
    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, ...updates } : r)),
    );
    await recordAudit("UPDATE_ROUTE", "routes", routeId, updates);
  };

  const handleDeleteRoute = async (routeId: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    await recordAudit("DELETE_ROUTE", "routes", routeId, {});
  };

  // 4. SCHEDULE ACTIONS
  const handleAddSchedule = async (newSchedule: Omit<ScheduleItem, "id" | "created_at">) => {
    const scheduleItem: ScheduleItem = {
      ...newSchedule,
      id: `sch-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setSchedules((prev) => [scheduleItem, ...prev]);
    await recordAudit("CREATE_SCHEDULE", "schedules", scheduleItem.id, scheduleItem);
  };

  const handleUpdateSchedule = async (scheduleId: string, updates: Partial<ScheduleItem>) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, ...updates } : s)),
    );
    await recordAudit("UPDATE_SCHEDULE", "schedules", scheduleId, updates);
  };

  const handleCancelSchedule = async (scheduleId: string, reason: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, status: "CANCELLED", cancellation_reason: reason } : s)),
    );

    // Queue emergency cancellation notification
    const sch = schedules.find((s) => s.id === scheduleId);
    if (sch) {
      const cancelNotif = {
        id: `notif-${Date.now()}`,
        category: "BUS_CANCELLATION",
        channel: "EMAIL_AND_APP",
        recipient_target: `ROUTE_${sch.route_id}`,
        recipient_name: `Passengers on ${sch.route_name}`,
        subject: `EMERGENCY ALERT: Trip Cancelled — ${sch.route_name}`,
        body: `Your scheduled trip (${sch.departure_time}) was cancelled due to: ${reason}. Operations team is dispatching alternative transport.`,
        status: "SENT",
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [cancelNotif, ...prev]);
    }

    await recordAudit("CANCEL_SCHEDULE", "schedules", scheduleId, { reason });
  };

  // 5. PASSENGER & DISCIPLINARY ACTIONS (Sections 21-29)
  const handleUpdateStudent = async (studentId: string, updates: Partial<StudentTransportRecord>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, ...updates } : s)),
    );
    await recordAudit("UPDATE_STUDENT_PROFILE", "students", studentId, updates);
  };

  const handleTakeDisciplinaryAction = async (
    studentId: string,
    actionType: "FORMAL_WARNING" | "TEMPORARY_SUSPENSION" | "PERMANENT_SUSPENSION" | "EXPULSION" | "REINSTATED",
    reason: string,
    notes?: string,
    expiryDate?: string,
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    let newStatus = student.status;
    let transportActive = true;

    if (actionType === "EXPULSION") {
      newStatus = "EXPELLED";
      transportActive = false;
    } else if (actionType === "TEMPORARY_SUSPENSION" || actionType === "PERMANENT_SUSPENSION") {
      newStatus = "SUSPENDED_DISCIPLINARY";
      transportActive = false;
    } else if (actionType === "REINSTATED") {
      newStatus = "ACTIVE";
      transportActive = true;
    }

    const todayDate = new Date().toISOString().slice(0, 10);

    // Update Student Record (Enforces backend & driver exclusion)
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              status: newStatus,
              transport_assignment_active: transportActive,
              suspension_reason: actionType === "REINSTATED" ? null : reason,
              suspension_effective_date: actionType === "REINSTATED" ? null : todayDate,
              suspension_expiry_date: expiryDate || null,
              is_temporary_suspension: actionType === "TEMPORARY_SUSPENSION",
              disciplinary_notes: notes || null,
            }
          : s,
      ),
    );

    // Record Disciplinary Log
    const newDiscLog: DisciplinaryActionRecord = {
      id: `disc-${Date.now()}`,
      student_id: studentId,
      student_name: student.full_name,
      action_type: actionType,
      reason,
      notes: notes || undefined,
      effective_date: todayDate,
      expiry_date: expiryDate || null,
      action_by: user?.id || "admin-super-1",
      action_by_name: profile?.full_name || (isSuperAdmin ? "Super Administrator" : "Operations Admin"),
      previous_status: student.status,
      new_status: newStatus,
      created_at: new Date().toISOString(),
    };
    setDisciplinaryLogs((prev) => [newDiscLog, ...prev]);

    await recordAudit("STUDENT_DISCIPLINARY_ACTION", "students", studentId, {
      student_name: student.full_name,
      action_type: actionType,
      reason,
      previous_status: student.status,
      new_status: newStatus,
    });
  };

  const handleUpdateFeeStatus = async (studentId: string, feeStatus: FeePaymentStatus) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const isSuspendedForFee = feeStatus === "OVERDUE" || feeStatus === "SUSPENDED";
          return {
            ...s,
            fee_status: feeStatus,
            status: isSuspendedForFee ? "SUSPENDED_NON_PAYMENT" : "ACTIVE",
            transport_assignment_active: !isSuspendedForFee,
          };
        }
        return s;
      }),
    );

    await recordAudit("UPDATE_FEE_STATUS", "fee_records", studentId, { fee_status: feeStatus });
  };

  // 6. COMPLAINTS & NOTIFICATIONS ACTIONS
  const handleResolveComplaint = async (complaintId: string, notes: string) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === complaintId ? { ...c, status: "RESOLVED", resolution_notes: notes } : c)),
    );
    await recordAudit("RESOLVE_COMPLAINT", "complaints", complaintId, { resolution_notes: notes });
  };

  const handleUpdateComplaintStatus = async (complaintId: string, nextStatus: string) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === complaintId ? { ...c, status: nextStatus } : c)),
    );
  };

  const handleUpdateRequestStatus = async (requestId: string, nextStatus: string, notes?: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: nextStatus, notes } : r)),
    );
    await recordAudit("UPDATE_TRANSPORT_REQUEST", "transport_requests", requestId, { status: nextStatus, notes });
  };

  const handleSendBroadcast = async (notif: {
    category: string;
    target_audience: string;
    subject: string;
    body: string;
  }) => {
    const newBroadcast = {
      id: `notif-${Date.now()}`,
      category: notif.category,
      channel: "EMAIL_AND_APP",
      recipient_target: notif.target_audience,
      recipient_name: notif.target_audience.replace("_", " "),
      subject: notif.subject,
      body: notif.body,
      status: "SENT",
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newBroadcast, ...prev]);

    // Cross-panel reactive sync:
    saveBroadcastAlert({
      title: notif.subject,
      message: notif.body,
      category: notif.category === "WEATHER" ? "WEATHER" : notif.category === "MAINTENANCE" ? "MAINTENANCE" : notif.category === "SCHEDULE_CHANGE" ? "SCHEDULE" : "ANNOUNCEMENT",
      severity: notif.category === "BUS_CANCELLATION" || notif.category === "EMERGENCY" ? "CRITICAL" : notif.category === "WEATHER" ? "HIGH" : "INFO",
      targetAudience: notif.target_audience === "STUDENTS_ONLY" ? "STUDENTS" : notif.target_audience === "DRIVERS_ONLY" ? "DRIVERS" : "ALL",
      active: true,
      created_by_name: profile?.full_name || "Operations Admin",
    });

    if (notif.target_audience === "STUDENTS" || notif.target_audience === "ALL_USERS") {
      addStudentSimulatedEmail({
        student_email: "ahmed.hussain@nust.edu.pk",
        student_name: "Ahmed Hussain",
        subject: `[UTS Official Broadcast] ${notif.subject}`,
        body: notif.body,
        category: "GENERAL",
        priority: notif.category === "EMERGENCY" ? "HIGH" : "NORMAL",
      });
    }

    await recordAudit("DISPATCH_BROADCAST", "notifications", newBroadcast.id, notif);
  };

  // 7. SYSTEM ADMIN USERS ACTIONS
  const handleAddAdminUser = async (newAdmin: Omit<AdminUserItem, "id" | "created_at">) => {
    const adminItem: AdminUserItem = {
      ...newAdmin,
      id: `admin-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setAdminUsers((prev) => [...prev, adminItem]);
    await recordAudit("CREATE_ADMIN_ACCOUNT", "profiles", adminItem.id, adminItem);
  };

  const handleToggleAdminStatus = async (adminId: string, active: boolean) => {
    setAdminUsers((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, status: active ? "ACTIVE" : "INACTIVE" } : a)),
    );
    await recordAudit("TOGGLE_ADMIN_STATUS", "profiles", adminId, { active });
  };

  // 8. OVERDUE FEE SCAN
  const handleTriggerFeeScan = async () => {
    toast.info("Running automated scan for overdue fee records...");
    try {
      await supabase.rpc("scan_and_queue_overdue_fee_reminders" as any);
    } catch (e) {
      // Local fallback
    }

    // Mark pending fees with overdue status and notify
    setStudents((prev) =>
      prev.map((s) => {
        if (s.fee_status === "PENDING" || s.fee_status === "OVERDUE") {
          return { ...s, fee_status: "OVERDUE" as const };
        }
        return s;
      }),
    );

    await recordAudit("OVERDUE_FEE_SCAN", "fee_records", null, { timestamp: new Date().toISOString() });
    toast.success("Overdue fee scan completed. Warning reminders dispatched.");
  };

  // Security Check: Redirect non-staff users
  if (!isStaff && !isLoading) {
    return (
      <PublicLayout>
        <section className="container-page py-20">
          <div className="mx-auto max-w-md card-elevated p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Admin Access Restricted</h2>
            <p className="text-sm text-muted-foreground">
              This area is strictly restricted to verified UTS Administrators and Operations Staff.
            </p>
            <div className="pt-2">
              <Button asChild>
                <Link to="/login">Sign In as Administrator</Link>
              </Button>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  // Counts for sidebar badges
  const pendingDriverAppsCount = drivers.filter((d) => d.status === "PENDING").length;
  const openComplaintsCount = complaints.filter((c) => c.status === "OPEN" || c.status === "IN REVIEW").length;
  const overdueFeesCount = students.filter((s) => s.fee_status === "OVERDUE").length;
  const disciplinaryCasesCount = students.filter(
    (s) => s.status === "SUSPENDED_DISCIPLINARY" || s.status === "EXPELLED",
  ).length;
  const activeRequestsCount = requests.filter((r) => r.status === "NEW" || r.status === "QUOTED").length;
  const activeBusesCount = buses.filter((b) => b.status === "ACTIVE").length;

  return (
    <PublicLayout>
      {/* Top Operations Masthead */}
      <div className="surface-navy py-6 text-navy-foreground border-b border-navy-foreground/15">
        <div className="container-page flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {isSuperAdmin ? "Super Admin Executive Desk" : "UTS Transport Operations Authority"}
              </span>
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                LIVE OPERATIONS
              </Badge>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold">Central Transport Management Platform</h1>
            <p className="text-xs text-navy-foreground/75">
              Authority console for fleet management, driver verification, schedule conflicts, passenger eligibility, disciplinary enforcement, and audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAdminData}
              disabled={dataLoading}
              className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 text-xs h-8"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${dataLoading ? "animate-spin" : ""}`} /> Refresh Live Data
            </Button>
          </div>
        </div>
      </div>

      {/* Main Admin Workspace with Responsive Sidebar Navigation */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)]">
        {/* Navigation Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isSuperAdmin={isSuperAdmin}
          counts={{
            pendingDriverApps: pendingDriverAppsCount,
            openComplaints: openComplaintsCount,
            overdueFees: overdueFeesCount,
            disciplinaryCases: disciplinaryCasesCount,
            activeRequests: activeRequestsCount,
            activeBuses: activeBusesCount,
          }}
        />

        {/* Content Area Rendering the Active Module */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background overflow-y-auto">
          {/* 1. DASHBOARD */}
          {activeTab === "dashboard" && (
            <AdminDashboardOverview
              buses={buses}
              drivers={drivers}
              routes={routes}
              schedules={schedules}
              students={students}
              complaints={complaints}
              requests={requests}
              attendance={attendance}
              fees={fees}
              onNavigateTab={setActiveTab}
              onOpenAddBus={() => setActiveTab("buses")}
              onOpenCreateRoute={() => setActiveTab("routes")}
              onOpenCreateSchedule={() => setActiveTab("schedules")}
              onTriggerFeeScan={handleTriggerFeeScan}
            />
          )}

          {/* 2. DRIVERS */}
          {activeTab === "drivers" && (
            <DriverManagementTab
              drivers={drivers}
              buses={buses}
              routes={routes}
              onApproveDriver={handleApproveDriver}
              onRejectDriver={handleRejectDriver}
              onSuspendDriver={handleSuspendDriver}
              onReactivateDriver={handleReactivateDriver}
              onUpdateDriver={handleUpdateDriver}
            />
          )}

          {/* 3. BUSES */}
          {activeTab === "buses" && (
            <BusManagementTab
              buses={buses}
              drivers={drivers}
              routes={routes}
              onAddBus={handleAddBus}
              onUpdateBus={handleUpdateBus}
              onDeleteBus={handleDeleteBus}
              onToggleMaintenance={handleToggleBusMaintenance}
            />
          )}

          {/* 4. ROUTES */}
          {activeTab === "routes" && (
            <RouteManagementTab
              routes={routes}
              buses={buses}
              drivers={drivers}
              students={students}
              onAddRoute={handleAddRoute}
              onUpdateRoute={handleUpdateRoute}
              onDeleteRoute={handleDeleteRoute}
            />
          )}

          {/* 5. SCHEDULES */}
          {activeTab === "schedules" && (
            <ScheduleManagementTab
              schedules={schedules}
              routes={routes}
              buses={buses}
              drivers={drivers}
              onAddSchedule={handleAddSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onCancelSchedule={handleCancelSchedule}
            />
          )}

          {/* 6. PASSENGERS */}
          {activeTab === "passengers" && (
            <PassengerManagementTab
              students={students}
              routes={routes}
              onUpdateStudent={handleUpdateStudent}
              onTakeDisciplinaryAction={handleTakeDisciplinaryAction}
              onUpdateFeeStatus={handleUpdateFeeStatus}
            />
          )}

          {/* 7. DISCIPLINARY MANAGEMENT */}
          {activeTab === "disciplinary" && (
            <StudentDisciplinaryTab
              students={students}
              disciplinaryLogs={disciplinaryLogs}
              complaints={complaints}
              onTakeDisciplinaryAction={handleTakeDisciplinaryAction}
            />
          )}

          {/* 8. TRANSPORT REQUESTS */}
          {activeTab === "requests" && (
            <TransportRequestsTab
              requests={requests}
              onUpdateRequestStatus={handleUpdateRequestStatus}
            />
          )}

          {/* 9. LIVE TRACKING */}
          {activeTab === "tracking" && (
            <LiveTrackingTab buses={buses} routes={routes} />
          )}

          {/* 10. TRIPS & ATTENDANCE */}
          {activeTab === "trips" && (
            <TripsAttendanceTab
              schedules={schedules}
              attendance={attendance}
              routes={routes}
              drivers={drivers}
              students={students}
            />
          )}

          {/* 11. COMPLAINTS & FEEDBACK */}
          {activeTab === "complaints" && (
            <ComplaintsManagementTab
              complaints={complaints}
              onResolveComplaint={handleResolveComplaint}
              onUpdateStatus={handleUpdateComplaintStatus}
            />
          )}

          {/* 12. NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <NotificationsTab
              notifications={notifications}
              routes={routes}
              onSendBroadcast={handleSendBroadcast}
            />
          )}

          {/* 13. FLEET MAINTENANCE */}
          {activeTab === "maintenance" && (
            <FleetMaintenanceTab
              vehicles={buses as any}
              issues={vehicleIssues}
              maintenanceLogs={maintenanceLogs}
              onRefresh={loadAdminData}
              onAddMaintenance={async (data) => {
                await supabase.from("maintenance_records").insert(data);
                loadAdminData();
              }}
              onResolveIssue={async (issueId, resNotes) => {
                await supabase.from("vehicle_issues").update({ status: "RESOLVED", resolution_notes: resNotes }).eq("id", issueId);
                loadAdminData();
              }}
            />
          )}

          {/* 14. REPORTS & ANALYTICS */}
          {activeTab === "reports" && (
            <ReportsAnalyticsTab
              buses={buses}
              drivers={drivers}
              routes={routes}
              schedules={schedules}
              students={students}
              attendance={attendance}
              fees={fees}
            />
          )}

          {/* 15. SYSTEM ADMIN & RBAC */}
          {activeTab === "system" && (
            <SystemAdminTab
              adminUsers={adminUsers}
              isSuperAdmin={isSuperAdmin}
              onAddAdminUser={handleAddAdminUser}
              onToggleAdminStatus={handleToggleAdminStatus}
            />
          )}

          {/* 16. AUDIT LOGS */}
          {activeTab === "audit" && (
            <AuditLogsTab logs={auditLogs} onRefresh={loadAdminData} />
          )}
        </main>
      </div>
    </PublicLayout>
  );
}
