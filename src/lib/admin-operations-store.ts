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
  role: "SUPER_ADMIN" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  last_login?: string | undefined;
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
    id: "admin-super-1",
    full_name: "Super Administrator (Executive Desk)",
    email: "superadmin@uts.com.pk",
    phone: "03124567891",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    last_login: "Just now",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "admin-ops-1",
    full_name: "Operations Administrator",
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
