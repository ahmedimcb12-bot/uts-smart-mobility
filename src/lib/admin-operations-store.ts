import { supabase } from "@/integrations/supabase/client";
import type {
  StudentTransportRecord,
  DisciplinaryActionRecord,
  ScheduleItem,
} from "./transport-eligibility";

export interface BusItem {
  id: string;
  vehicle_code: string;
  category: string;
  manufacturer?: string | undefined;
  model_year?: string | undefined;
  registration_no?: string | undefined;
  capacity: number;
  status: "ACTIVE" | "UNDER_MAINTENANCE" | "INACTIVE";
  assigned_driver_id?: string | null | undefined;
  assigned_driver_name?: string | null | undefined;
  assigned_route_id?: string | null | undefined;
  assigned_route_name?: string | null | undefined;
  notes?: string | null | undefined;
  created_at?: string | undefined;
}

export interface DriverItem {
  id: string;
  profile_id?: string | null | undefined;
  full_name: string;
  phone: string;
  email?: string | undefined;
  license_no: string;
  license_expiry?: string | undefined;
  experience_years?: number | undefined;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "INACTIVE";
  assigned_bus_id?: string | null | undefined;
  assigned_bus_code?: string | null | undefined;
  assigned_route_id?: string | null | undefined;
  assigned_route_name?: string | null | undefined;
  rating?: number | undefined;
  total_trips?: number | undefined;
  created_at?: string | undefined;
}

export interface RouteStopItem {
  id: string;
  route_id?: string | undefined;
  name: string;
  sequence: number;
  pickup_time?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  landmark?: string | undefined;
}

export interface RouteItem {
  id: string;
  name: string;
  code: string;
  shift: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
  driver_id?: string | null | undefined;
  driver_name?: string | null | undefined;
  vehicle_id?: string | null | undefined;
  vehicle_code?: string | null | undefined;
  active: boolean;
  stops_count?: number | undefined;
  passengers_count?: number | undefined;
  stops?: RouteStopItem[] | undefined;
  created_at?: string | undefined;
}

export interface AdminUserItem {
  id: string;
  full_name: string;
  email: string;
  phone?: string | undefined;
  role: "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  last_login?: string | undefined;
  created_at: string;
}

export interface BroadcastAlertItem {
  id: string;
  title: string;
  message: string;
  category: "WEATHER" | "MAINTENANCE" | "EMERGENCY" | "ANNOUNCEMENT" | "SCHEDULE";
  severity: "CRITICAL" | "HIGH" | "INFO";
  targetAudience: "ALL" | "STUDENTS" | "DRIVERS";
  active: boolean;
  created_at: string;
  created_by_name: string;
}

export interface DriverShiftAttendanceRecord {
  id: string;
  driver_id: string;
  driver_name: string;
  route_id: string;
  route_name: string;
  vehicle_code: string;
  shift: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
  date: string;
  start_time: string;
  end_time?: string | null;
  status: "PRESENT" | "ON_DUTY" | "COMPLETED";
  confirmed_by_admin: boolean;
  created_at: string;
}

export interface StudentSimulatedEmail {
  id: string;
  student_email: string;
  student_name: string;
  subject: string;
  body: string;
  category: "ABSENCE_ALERT" | "FEE_INVOICE" | "FEE_OVERDUE" | "SHIFT_NOTICE" | "GENERAL";
  sent_at: string;
  read: boolean;
  priority?: "HIGH" | "MEDIUM" | "NORMAL";
}

export interface StudentReviewRecord {
  id: string;
  student_id: string;
  student_name: string;
  driver_id: string;
  driver_name: string;
  vehicle_code: string;
  overall_rating: number;
  punctuality_rating: number;
  driving_rating: number;
  comfort_rating: number;
  cleanliness_rating: number;
  comment: string;
  created_at: string;
}

export interface NotificationBroadcastItem {
  id: string;
  category: string;
  channel: string;
  recipient_target: string;
  recipient_name?: string | undefined;
  recipient_email?: string | undefined;
  subject: string;
  body: string;
  status: "QUEUED" | "SENT" | "FAILED";
  sent_at?: string | undefined;
  created_at: string;
}

// Global Custom Event Keys for Cross-Panel Real-Time Synchronization
export const UTS_BROADCAST_EVENT_KEY = "uts_broadcast_alerts_sync_event";
export const UTS_DRIVER_ONBOARD_EVENT_KEY = "uts_driver_onboard_sync_event";
export const UTS_STUDENT_EMAIL_EVENT_KEY = "uts_student_email_sync_event";
export const UTS_REVIEWS_EVENT_KEY = "uts_reviews_sync_event";
export const UTS_MAINTENANCE_EVENT_KEY = "uts_maintenance_sync_event";

// Initial Data Fixtures
export const INITIAL_BUSES: BusItem[] = [
  {
    id: "v1",
    vehicle_code: "UTS-CST-104",
    category: "Coaster (29-Seater)",
    manufacturer: "Toyota",
    model_year: "2024",
    registration_no: "ICT-GA-9021",
    capacity: 29,
    status: "ACTIVE",
    assigned_driver_id: "d1",
    assigned_driver_name: "Muhammad Tariq",
    assigned_route_id: "r1",
    assigned_route_name: "NUST Morning Route 01",
    notes: "AC equipped, High-precision GPS receiver",
  },
  {
    id: "v2",
    vehicle_code: "UTS-HIA-201",
    category: "Hiace Grand Cabin (15-Seater)",
    manufacturer: "Toyota",
    model_year: "2023",
    registration_no: "ICT-LE-4412",
    capacity: 15,
    status: "ACTIVE",
    assigned_driver_id: "d2",
    assigned_driver_name: "Rashid Mehmood",
    assigned_route_id: "r2",
    assigned_route_name: "Blue Area Corporate Express",
    notes: "Executive interior, tinted windows",
  },
  {
    id: "v3",
    vehicle_code: "UTS-BUS-301",
    category: "Master Transit Bus (50-Seater)",
    manufacturer: "Hino",
    model_year: "2022",
    registration_no: "RWP-MN-8833",
    capacity: 50,
    status: "UNDER_MAINTENANCE",
    assigned_driver_id: null,
    assigned_driver_name: null,
    assigned_route_id: null,
    assigned_route_name: null,
    notes: "Scheduled transmission & brake pad overhaul",
  },
  {
    id: "v4",
    vehicle_code: "UTS-CST-108",
    category: "Coaster (29-Seater)",
    manufacturer: "Toyota",
    model_year: "2024",
    registration_no: "ICT-GA-9025",
    capacity: 29,
    status: "ACTIVE",
    assigned_driver_id: "d3",
    assigned_driver_name: "Ghulam Abbas",
    assigned_route_id: "r3",
    assigned_route_name: "Rawalpindi – Islamabad Intercity",
    notes: "AC equipped, daily sanitization",
  },
];

export const INITIAL_DRIVERS: DriverItem[] = [
  {
    id: "d1",
    full_name: "Muhammad Tariq",
    phone: "03124567891",
    email: "tariq.driver@uts.com.pk",
    license_no: "ICT-PSV-99214",
    license_expiry: "2028-12-31",
    experience_years: 7,
    status: "ACTIVE",
    assigned_bus_id: "v1",
    assigned_bus_code: "UTS-CST-104",
    assigned_route_id: "r1",
    assigned_route_name: "NUST Morning Route 01",
    rating: 4.9,
    total_trips: 342,
  },
  {
    id: "d2",
    full_name: "Rashid Mehmood",
    phone: "03009876543",
    email: "rashid.mehmood@uts.com.pk",
    license_no: "RWP-LTV-44120",
    license_expiry: "2027-08-15",
    experience_years: 5,
    status: "ACTIVE",
    assigned_bus_id: "v2",
    assigned_bus_code: "UTS-HIA-201",
    assigned_route_id: "r2",
    assigned_route_name: "Blue Area Corporate Express",
    rating: 4.8,
    total_trips: 218,
  },
  {
    id: "d3",
    full_name: "Ghulam Abbas",
    phone: "03335557788",
    email: "ghulam.abbas@uts.com.pk",
    license_no: "ICT-PSV-33109",
    license_expiry: "2026-11-20",
    experience_years: 10,
    status: "ACTIVE",
    assigned_bus_id: "v4",
    assigned_bus_code: "UTS-CST-108",
    assigned_route_id: "r3",
    assigned_route_name: "Rawalpindi – Islamabad Intercity",
    rating: 4.95,
    total_trips: 580,
  },
  {
    id: "d4",
    full_name: "Kamran Siddiqui",
    phone: "03451122334",
    email: "kamran.siddiqui@gmail.com",
    license_no: "FSD-HTV-88210",
    license_expiry: "2027-04-10",
    experience_years: 4,
    status: "PENDING",
    rating: 4.7,
    total_trips: 0,
  },
];

export const INITIAL_ROUTES: RouteItem[] = [
  {
    id: "r1",
    name: "NUST Morning Route 01 (Islamabad West)",
    code: "NUST-01",
    shift: "MORNING",
    driver_id: "d1",
    driver_name: "Muhammad Tariq",
    vehicle_id: "v1",
    vehicle_code: "UTS-CST-104",
    active: true,
    stops_count: 6,
    passengers_count: 24,
    stops: [
      { id: "st-1", name: "G-8 Markaz Roundabout", sequence: 1, pickup_time: "07:15 AM", landmark: "Near Bank Road" },
      { id: "st-2", name: "G-9 Sector Main Stop", sequence: 2, pickup_time: "07:22 AM", landmark: "Opposite Post Office" },
      { id: "st-3", name: "G-10 Markaz Roundabout (PSO)", sequence: 3, pickup_time: "07:30 AM", landmark: "Opposite PSO & Habib Metro" },
      { id: "st-4", name: "F-11 Markaz Shell Stop", sequence: 4, pickup_time: "07:42 AM", landmark: "Shell Petrol Station" },
      { id: "st-5", name: "E-11 Sector Entry", sequence: 5, pickup_time: "07:52 AM", landmark: "Main Gate Checkpost" },
      { id: "st-6", name: "NUST H-12 Campus Central Drop", sequence: 6, pickup_time: "08:25 AM", landmark: "NUST Gate 1" },
    ],
  },
  {
    id: "r2",
    name: "Blue Area Corporate Express",
    code: "CORP-02",
    shift: "MORNING",
    driver_id: "d2",
    driver_name: "Rashid Mehmood",
    vehicle_id: "v2",
    vehicle_code: "UTS-HIA-201",
    active: true,
    stops_count: 4,
    passengers_count: 14,
    stops: [
      { id: "st-201", name: "Saddar Metro Station", sequence: 1, pickup_time: "07:30 AM" },
      { id: "st-202", name: "I-8 Markaz Stop", sequence: 2, pickup_time: "07:50 AM" },
      { id: "st-203", name: "Zero Point Interchange", sequence: 3, pickup_time: "08:10 AM" },
      { id: "st-204", name: "Saudi Pak Tower Blue Area", sequence: 4, pickup_time: "08:30 AM" },
    ],
  },
  {
    id: "r3",
    name: "Rawalpindi – Islamabad Intercity Shuttle",
    code: "ISB-03",
    shift: "EVENING",
    driver_id: "d3",
    driver_name: "Ghulam Abbas",
    vehicle_id: "v4",
    vehicle_code: "UTS-CST-108",
    active: true,
    stops_count: 5,
    passengers_count: 28,
    stops: [
      { id: "st-301", name: "NUST H-12 Central Terminal", sequence: 1, pickup_time: "05:00 PM" },
      { id: "st-302", name: "Faizabad Interchange", sequence: 2, pickup_time: "05:30 PM" },
      { id: "st-303", name: "Commercial Market Satellite Town", sequence: 3, pickup_time: "05:50 PM" },
      { id: "st-304", name: "6th Road Flyover", sequence: 4, pickup_time: "06:05 PM" },
      { id: "st-305", name: "Saddar GPO Rawalpindi", sequence: 5, pickup_time: "06:30 PM" },
    ],
  },
];

export const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: "sch-1",
    route_id: "r1",
    route_name: "NUST Morning Route 01 (Islamabad West)",
    bus_id: "v1",
    bus_code: "UTS-CST-104",
    driver_id: "d1",
    driver_name: "Muhammad Tariq",
    shift: "MORNING",
    departure_time: "07:15",
    arrival_time: "08:30",
    days_of_week: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    status: "IN_PROGRESS",
  },
  {
    id: "sch-2",
    route_id: "r2",
    route_name: "Blue Area Corporate Express",
    bus_id: "v2",
    bus_code: "UTS-HIA-201",
    driver_id: "d2",
    driver_name: "Rashid Mehmood",
    shift: "MORNING",
    departure_time: "07:30",
    arrival_time: "08:35",
    days_of_week: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    status: "COMPLETED",
  },
  {
    id: "sch-3",
    route_id: "r3",
    route_name: "Rawalpindi – Islamabad Intercity Shuttle",
    bus_id: "v4",
    bus_code: "UTS-CST-108",
    driver_id: "d3",
    driver_name: "Ghulam Abbas",
    shift: "EVENING",
    departure_time: "17:00",
    arrival_time: "18:30",
    days_of_week: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    status: "SCHEDULED",
  },
];

export const INITIAL_STUDENTS: StudentTransportRecord[] = [
  {
    id: "std-1",
    full_name: "Ahmed Hussain",
    email: "ahmed.hussain@nust.edu.pk",
    phone: "03124567891",
    institution: "National University of Sciences & Technology (NUST)",
    roll_no: "NUST-SE-88",
    status: "ACTIVE",
    fee_status: "PAID",
    transport_assignment_active: true,
    assigned_route_id: "r1",
    assigned_route_name: "NUST Morning Route 01",
    pickup_stop_id: "st-3",
    pickup_stop_name: "G-10 Markaz Roundabout (PSO)",
    pickup_time: "07:30 AM",
    dropoff_time: "04:45 PM",
  },
  {
    id: "std-2",
    full_name: "Hamza Ali",
    email: "hamza.ali@nust.edu.pk",
    phone: "03019876543",
    institution: "NUST School of Electrical Engineering & Computer Science",
    roll_no: "NUST-CS-45",
    status: "ACTIVE",
    fee_status: "PAID",
    transport_assignment_active: true,
    assigned_route_id: "r1",
    assigned_route_name: "NUST Morning Route 01",
    pickup_stop_id: "st-1",
    pickup_stop_name: "G-8 Markaz Roundabout",
    pickup_time: "07:15 AM",
    dropoff_time: "04:45 PM",
  },
  {
    id: "std-3",
    full_name: "Bilal Farooq",
    email: "bilal.farooq@nust.edu.pk",
    phone: "03227788990",
    institution: "NUST Mechanical Engineering Dept",
    roll_no: "NUST-ME-67",
    status: "ACTIVE",
    fee_status: "OVERDUE",
    transport_assignment_active: true,
    assigned_route_id: "r1",
    assigned_route_name: "NUST Morning Route 01",
    pickup_stop_id: "st-3",
    pickup_stop_name: "G-10 Markaz Roundabout (PSO)",
    pickup_time: "07:30 AM",
    dropoff_time: "04:45 PM",
  },
  {
    id: "std-4",
    full_name: "Daniyal Khan",
    email: "daniyal.khan@nust.edu.pk",
    phone: "03338877665",
    institution: "NUST Business School (NBS)",
    roll_no: "NUST-BBA-19",
    status: "SUSPENDED_DISCIPLINARY",
    fee_status: "PAID",
    transport_assignment_active: false,
    assigned_route_id: "r1",
    assigned_route_name: "NUST Morning Route 01",
    pickup_stop_id: "st-4",
    pickup_stop_name: "F-11 Markaz Shell Stop",
    suspension_reason: "Misbehaviour and altercation with driver on 04 Sep 2026",
    suspension_effective_date: "2026-09-04",
    suspension_expiry_date: "2026-09-18",
    is_temporary_suspension: true,
    disciplinary_notes: "Suspended for 14 calendar days pending apology letter.",
  },
  {
    id: "std-5",
    full_name: "Shahzaib Tariq",
    email: "shahzaib.tariq@nust.edu.pk",
    phone: "03154433221",
    institution: "NUST Civil Engineering",
    roll_no: "NUST-CE-33",
    status: "SUSPENDED_NON_PAYMENT",
    fee_status: "OVERDUE",
    transport_assignment_active: false,
    assigned_route_id: "r1",
    assigned_route_name: "NUST Morning Route 01",
    pickup_stop_id: "st-2",
    pickup_stop_name: "G-9 Sector Main Stop",
    suspension_reason: "Fee unpaid past grace period deadline (August & September 2026)",
    suspension_effective_date: "2026-09-02",
  },
  {
    id: "std-6",
    full_name: "Usman Ghani",
    email: "usman.ghani@nust.edu.pk",
    phone: "03001122445",
    institution: "NUST Chemical Engineering",
    roll_no: "NUST-CH-12",
    status: "EXPELLED",
    fee_status: "SUSPENDED",
    transport_assignment_active: false,
    assigned_route_id: "r1",
    assigned_route_name: "NUST Morning Route 01",
    pickup_stop_id: "st-5",
    pickup_stop_name: "E-11 Sector Entry",
    suspension_reason: "Severe vandalism of vehicle equipment & continuous non-compliance.",
    suspension_effective_date: "2026-08-20",
    is_temporary_suspension: false,
    disciplinary_notes: "Permanent expulsion approved by Central Transport Committee.",
  },
];

export const INITIAL_DISCIPLINARY_LOGS: DisciplinaryActionRecord[] = [
  {
    id: "disc-1",
    student_id: "std-4",
    student_name: "Daniyal Khan",
    complaint_id: "comp-driver-101",
    action_type: "TEMPORARY_SUSPENSION",
    reason: "Verbal altercation and aggressive behavior towards driver Muhammad Tariq",
    notes: "14 days suspension applied. Transport pass disabled on driver manifest.",
    effective_date: "2026-09-04",
    expiry_date: "2026-09-18",
    action_by: "admin-super-1",
    action_by_name: "Super Administrator",
    previous_status: "ACTIVE",
    new_status: "SUSPENDED_DISCIPLINARY",
    created_at: "2026-09-04T10:15:00Z",
  },
  {
    id: "disc-2",
    student_id: "std-6",
    student_name: "Usman Ghani",
    complaint_id: "comp-driver-089",
    action_type: "EXPULSION",
    reason: "Damaging AC louvers and repeated refusal to follow transport safety protocol.",
    notes: "Expulsion permanent. Excluded from all fleet manifests.",
    effective_date: "2026-08-20",
    action_by: "admin-ops-1",
    action_by_name: "Operations Admin",
    previous_status: "SUSPENDED_DISCIPLINARY",
    new_status: "EXPELLED",
    created_at: "2026-08-20T14:30:00Z",
  },
];

export const INITIAL_ADMIN_USERS: AdminUserItem[] = [
  {
    id: "admin-ops-1",
    full_name: "UTS Operations Administrator",
    email: "admin@uts.com.pk",
    phone: "03124567891",
    role: "ADMIN",
    status: "ACTIVE",
    last_login: "Today, 08:30 AM",
    created_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "admin-fleet-1",
    full_name: "Fleet & Dispatch Supervisor",
    email: "fleet.supervisor@uts.com.pk",
    phone: "03001234567",
    role: "ADMIN",
    status: "ACTIVE",
    last_login: "Yesterday",
    created_at: "2026-05-10T00:00:00Z",
  },
];

export const INITIAL_BROADCASTS: BroadcastAlertItem[] = [
  {
    id: "bc-1",
    title: "⚡ Thunderstorm & Heavy Rain Weather Advisory",
    message:
      "Severe rain and lightning expected across Islamabad & Rawalpindi routes today. Drivers are instructed to maintain cautious speeds (max 40 km/h) with headlights on. Estimated 10-minute pickup buffer applied.",
    category: "WEATHER",
    severity: "HIGH",
    targetAudience: "ALL",
    active: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    created_by_name: "Operations Administrator",
  },
  {
    id: "bc-2",
    title: "🔧 Fleet Maintenance Notice — Route 03 Reserve Assigned",
    message:
      "Master Transit Bus UTS-BUS-301 is currently under routine scheduled brake maintenance. Standby luxury Coaster UTS-CST-108 has been deployed on evening shuttle.",
    category: "MAINTENANCE",
    severity: "INFO",
    targetAudience: "STUDENTS",
    active: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    created_by_name: "Fleet Supervisor",
  },
];

export const INITIAL_STUDENT_EMAILS: StudentSimulatedEmail[] = [
  {
    id: "em-1",
    student_email: "ahmed.hussain@nust.edu.pk",
    student_name: "Ahmed Hussain",
    subject: "🧾 UTS Transport Fee Invoice — September 2026 (Due 10 Sep)",
    body: "Dear Ahmed Hussain,\n\nYour monthly transport subscription fee for September 2026 on Route: NUST Morning Route 01 has been generated.\n\nAmount Due: PKR 6,500\nDue Date: 10 September 2026\nStatus: PAID (Thank you for your prompt payment!)\n\nYou can download your computerized digital payment receipt anytime from the Student Dashboard.\n\nUTS Finance Team",
    category: "FEE_INVOICE",
    sent_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    read: true,
    priority: "HIGH",
  },
  {
    id: "em-2",
    student_email: "ahmed.hussain@nust.edu.pk",
    student_name: "Ahmed Hussain",
    subject: "⚡ Weather Advisory: Thunderstorm Operations Update",
    body: "Dear Ahmed Hussain,\n\nPlease be advised that due to morning thunderstorms, vehicle UTS-CST-104 is operating with a 5-10 minute safety margin. Please track live bus location on your interactive stop map.\n\nUTS Dispatch Desk",
    category: "SHIFT_NOTICE",
    sent_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false,
    priority: "HIGH",
  },
  {
    id: "em-3",
    student_email: "bilal.farooq@nust.edu.pk",
    student_name: "Bilal Farooq",
    subject: "⚠️ URGENT: Outstanding Transport Fee Overdue Notice",
    body: "Dear Bilal Farooq,\n\nYour transport fee of PKR 6,500 for August/September remains unpaid past the grace period. Please clear payment via student dashboard immediately to prevent account suspension.\n\nUTS Accounts Dept",
    category: "FEE_OVERDUE",
    sent_at: new Date(Date.now() - 86400000).toISOString(),
    read: false,
    priority: "HIGH",
  },
];

export const INITIAL_STUDENT_REVIEWS: StudentReviewRecord[] = [
  {
    id: "rev-1",
    student_id: "std-1",
    student_name: "Ahmed Hussain",
    driver_id: "d1",
    driver_name: "Muhammad Tariq",
    vehicle_code: "UTS-CST-104",
    overall_rating: 5,
    punctuality_rating: 5,
    driving_rating: 5,
    comfort_rating: 4,
    cleanliness_rating: 5,
    comment:
      "Driver Tariq is exceptionally punctual and courteous. The coaster AC is always cold and driving on Kashmir Highway is very smooth.",
    created_at: "2026-09-08T09:15:00Z",
  },
  {
    id: "rev-2",
    student_id: "std-2",
    student_name: "Hamza Ali",
    driver_id: "d1",
    driver_name: "Muhammad Tariq",
    vehicle_code: "UTS-CST-104",
    overall_rating: 5,
    punctuality_rating: 5,
    driving_rating: 5,
    comfort_rating: 5,
    cleanliness_rating: 5,
    comment: "Always reaches G-8 stop right on time. Great service!",
    created_at: "2026-09-07T14:30:00Z",
  },
];

export const INITIAL_DRIVER_ATTENDANCES: DriverShiftAttendanceRecord[] = [
  {
    id: "dr-att-1",
    driver_id: "d1",
    driver_name: "Muhammad Tariq",
    route_id: "r1",
    route_name: "NUST Morning Route 01 (Islamabad West)",
    vehicle_code: "UTS-CST-104",
    shift: "MORNING",
    date: new Date().toISOString().slice(0, 10),
    start_time: "07:12 AM",
    end_time: null,
    status: "ON_DUTY",
    confirmed_by_admin: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "dr-att-2",
    driver_id: "d2",
    driver_name: "Rashid Mehmood",
    route_id: "r2",
    route_name: "Blue Area Corporate Express",
    vehicle_code: "UTS-HIA-201",
    shift: "MORNING",
    date: new Date().toISOString().slice(0, 10),
    start_time: "07:25 AM",
    end_time: "08:35 AM",
    status: "COMPLETED",
    confirmed_by_admin: true,
    created_at: new Date().toISOString(),
  },
];

// Reactive Storage Helpers
export function getBroadcastAlerts(): BroadcastAlertItem[] {
  if (typeof window === "undefined") return INITIAL_BROADCASTS;
  try {
    const saved = localStorage.getItem("uts_admin_broadcasts_v4");
    return saved ? JSON.parse(saved) : INITIAL_BROADCASTS;
  } catch {
    return INITIAL_BROADCASTS;
  }
}

export function saveBroadcastAlert(alert: Omit<BroadcastAlertItem, "id" | "created_at">): BroadcastAlertItem {
  const current = getBroadcastAlerts();
  const newAlert: BroadcastAlertItem = {
    ...alert,
    id: `bc-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  const updated = [newAlert, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem("uts_admin_broadcasts_v4", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(UTS_BROADCAST_EVENT_KEY, { detail: newAlert }));
  }
  return newAlert;
}

export function getStudentSimulatedEmails(studentEmail?: string | null): StudentSimulatedEmail[] {
  if (typeof window === "undefined") return INITIAL_STUDENT_EMAILS;
  try {
    const saved = localStorage.getItem("uts_student_simulated_inbox_v4");
    const list: StudentSimulatedEmail[] = saved ? JSON.parse(saved) : INITIAL_STUDENT_EMAILS;
    if (!studentEmail) return list;
    return list.filter(
      (e) => e.student_email.toLowerCase() === studentEmail.toLowerCase() || e.student_email === "all",
    );
  } catch {
    return INITIAL_STUDENT_EMAILS;
  }
}

export function triggerStudentAbsentEmail(
  studentEmail: string,
  studentName: string,
  routeName: string,
  stopName: string,
  pickupTime: string,
  driverName: string,
): StudentSimulatedEmail {
  const current = getStudentSimulatedEmails();
  const newEmail: StudentSimulatedEmail = {
    id: `em-abs-${Date.now()}`,
    student_email: studentEmail,
    student_name: studentName,
    subject: `🚨 ABSENCE NOTIFICATION: You were marked absent on ${routeName}`,
    body: `Dear ${studentName},\n\nYou have been marked ABSENT for today's shift on Route: ${routeName} at stop: ${stopName} (${pickupTime}) by driver ${driverName}.\n\nIf this was in error or you had an emergency, please notify the UTS Admin desk immediately via the Complaints & Inquiries section in your Student Portal.\n\nUnited Transport Service (UTS) Automated Attendance Dispatch`,
    category: "ABSENCE_ALERT",
    sent_at: new Date().toISOString(),
    read: false,
    priority: "HIGH",
  };
  const updated = [newEmail, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem("uts_student_simulated_inbox_v4", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(UTS_STUDENT_EMAIL_EVENT_KEY, { detail: newEmail }));
  }
  return newEmail;
}

export function getDriverShiftAttendance(): DriverShiftAttendanceRecord[] {
  if (typeof window === "undefined") return INITIAL_DRIVER_ATTENDANCES;
  try {
    const saved = localStorage.getItem("uts_driver_shift_attendance_v4");
    return saved ? JSON.parse(saved) : INITIAL_DRIVER_ATTENDANCES;
  } catch {
    return INITIAL_DRIVER_ATTENDANCES;
  }
}

export function recordDriverShiftStart(
  driverId: string,
  driverName: string,
  routeId: string,
  routeName: string,
  vehicleCode: string,
  shift: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT",
): DriverShiftAttendanceRecord {
  const current = getDriverShiftAttendance();
  const today = new Date().toISOString().slice(0, 10);
  const startTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const record: DriverShiftAttendanceRecord = {
    id: `dr-att-${Date.now()}`,
    driver_id: driverId,
    driver_name: driverName,
    route_id: routeId,
    route_name: routeName,
    vehicle_code: vehicleCode,
    shift,
    date: today,
    start_time: startTime,
    end_time: null,
    status: "ON_DUTY",
    confirmed_by_admin: true,
    created_at: new Date().toISOString(),
  };

  const updated = [record, ...current.filter((r) => !(r.driver_id === driverId && r.date === today))];
  if (typeof window !== "undefined") {
    localStorage.setItem("uts_driver_shift_attendance_v4", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(UTS_DRIVER_ONBOARD_EVENT_KEY, { detail: record }));
  }
  return record;
}

export function recordDriverShiftEnd(driverId: string): void {
  const current = getDriverShiftAttendance();
  const today = new Date().toISOString().slice(0, 10);
  const endTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const updated = current.map((r) => {
    if (r.driver_id === driverId && r.date === today) {
      return { ...r, end_time: endTime, status: "COMPLETED" as const };
    }
    return r;
  });

  if (typeof window !== "undefined") {
    localStorage.setItem("uts_driver_shift_attendance_v4", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(UTS_DRIVER_ONBOARD_EVENT_KEY, { detail: { driverId, status: "COMPLETED" } }));
  }
}

export function getStudentReviews(): StudentReviewRecord[] {
  if (typeof window === "undefined") return INITIAL_STUDENT_REVIEWS;
  try {
    const saved = localStorage.getItem("uts_student_reviews_v4");
    return saved ? JSON.parse(saved) : INITIAL_STUDENT_REVIEWS;
  } catch {
    return INITIAL_STUDENT_REVIEWS;
  }
}

export function submitStudentReview(review: Omit<StudentReviewRecord, "id" | "created_at">): StudentReviewRecord {
  const current = getStudentReviews();
  const newRev: StudentReviewRecord = {
    ...review,
    id: `rev-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  const updated = [newRev, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem("uts_student_reviews_v4", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(UTS_REVIEWS_EVENT_KEY, { detail: newRev }));
  }
  return newRev;
}

export function deleteBroadcastAlert(alertId: string): void {
  const current = getBroadcastAlerts();
  const updated = current.filter((a) => a.id !== alertId);
  if (typeof window !== "undefined") {
    localStorage.setItem("uts_admin_broadcasts_v4", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(UTS_BROADCAST_EVENT_KEY, { detail: { action: "DELETE", alertId } }));
  }
}

export function toggleBroadcastAlertStatus(alertId: string, active: boolean): void {
  const current = getBroadcastAlerts();
  const updated = current.map((a) => (a.id === alertId ? { ...a, active } : a));
  if (typeof window !== "undefined") {
    localStorage.setItem("uts_admin_broadcasts_v4", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(UTS_BROADCAST_EVENT_KEY, { detail: { action: "UPDATE", alertId, active } }));
  }
}

export function markStudentEmailRead(emailId: string): void {
  const current = getStudentSimulatedEmails();
  const updated = current.map((e) => (e.id === emailId ? { ...e, read: true } : e));
  if (typeof window !== "undefined") {
    localStorage.setItem("uts_student_simulated_inbox_v4", JSON.stringify(updated));
  }
}

export function addStudentSimulatedEmail(email: Omit<StudentSimulatedEmail, "id" | "sent_at" | "read">): StudentSimulatedEmail {
  const current = getStudentSimulatedEmails();
  const newEmail: StudentSimulatedEmail = {
    ...email,
    id: `em-${Date.now()}`,
    sent_at: new Date().toISOString(),
    read: false,
  };
  const updated = [newEmail, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem("uts_student_simulated_inbox_v4", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(UTS_STUDENT_EMAIL_EVENT_KEY, { detail: newEmail }));
  }
  return newEmail;
}

export function setBusMaintenanceStatus(
  busIdOrCode: string,
  status: "ACTIVE" | "UNDER_MAINTENANCE" | "INACTIVE",
  notes?: string,
): void {
  try {
    const saved = localStorage.getItem("uts_admin_buses_v4");
    const list: BusItem[] = saved ? JSON.parse(saved) : INITIAL_BUSES;
    const updated = list.map((b) => {
      if (b.id === busIdOrCode || b.vehicle_code.toLowerCase() === busIdOrCode.toLowerCase()) {
        return {
          ...b,
          status,
          notes: notes ? `${b.notes || ""}${b.notes ? " | " : ""}${notes}` : b.notes,
        };
      }
      return b;
    });
    localStorage.setItem("uts_admin_buses_v4", JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent(UTS_MAINTENANCE_EVENT_KEY, {
        detail: { busIdOrCode, status, notes, timestamp: new Date().toISOString() },
      }),
    );
  } catch (e) {
    console.warn("setBusMaintenanceStatus error:", e);
  }
}

export function triggerDriverDelayAlert(
  driverName: string,
  routeName: string,
  delayMinutes: number,
  reason: string,
): void {
  // Broadcast alert to students and admin
  saveBroadcastAlert({
    title: `⏱️ Route Delay Notice: ${routeName}`,
    message: `Driver ${driverName} reported an estimated ${delayMinutes}-minute delay on ${routeName}. Reason: ${reason}. Please track live ETA on your student map.`,
    category: "SCHEDULE",
    severity: "HIGH",
    targetAudience: "ALL",
    active: true,
    created_by_name: driverName,
  });
}

