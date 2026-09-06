/**
 * Unified Student Transport Eligibility & Conflict Detection Engine
 * Enforces business rules across Admin, Driver Console, and Student Portal.
 */

export type StudentAccountStatus =
  | "ACTIVE"
  | "PENDING"
  | "SUSPENDED_DISCIPLINARY"
  | "SUSPENDED_NON_PAYMENT"
  | "EXPELLED"
  | "INACTIVE";

export type FeePaymentStatus = "PAID" | "PENDING" | "OVERDUE" | "SUSPENDED";

export interface StudentTransportRecord {
  id: string;
  profile_id?: string | null | undefined;
  full_name: string;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  institution?: string | null | undefined;
  roll_no?: string | null | undefined;
  status: StudentAccountStatus;
  fee_status: FeePaymentStatus;
  transport_assignment_active: boolean;
  assigned_route_id?: string | null | undefined;
  assigned_route_name?: string | null | undefined;
  pickup_stop_id?: string | null | undefined;
  pickup_stop_name?: string | null | undefined;
  pickup_time?: string | null | undefined;
  dropoff_time?: string | null | undefined;
  suspension_reason?: string | null | undefined;
  suspension_effective_date?: string | null | undefined;
  suspension_expiry_date?: string | null | undefined;
  is_temporary_suspension?: boolean | undefined;
  disciplinary_notes?: string | null | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export interface DisciplinaryActionRecord {
  id: string;
  student_id: string;
  student_name: string;
  complaint_id?: string | null | undefined;
  action_type:
    | "FORMAL_WARNING"
    | "TEMPORARY_SUSPENSION"
    | "PERMANENT_SUSPENSION"
    | "EXPULSION"
    | "REINSTATED";
  reason: string;
  notes?: string | null | undefined;
  effective_date: string;
  expiry_date?: string | null | undefined;
  action_by: string;
  action_by_name: string;
  previous_status: StudentAccountStatus;
  new_status: StudentAccountStatus;
  created_at: string;
}

export interface ScheduleItem {
  id: string;
  route_id: string;
  route_name: string;
  bus_id: string;
  bus_code: string;
  driver_id: string;
  driver_name: string;
  shift: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
  departure_time: string; // e.g. "07:15"
  arrival_time: string; // e.g. "08:30"
  service_date?: string | undefined;
  days_of_week?: string[] | undefined; // e.g. ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DELAYED";
  cancellation_reason?: string | null | undefined;
  notes?: string | null | undefined;
  created_at?: string | undefined;
}

export interface ScheduleConflictCheckResult {
  hasConflict: boolean;
  conflicts: string[];
}

/**
 * Section 24: Unified Student Transport Eligibility Check
 * A student is eligible for transport & pickup ONLY if:
 * 1. Account status is strictly ACTIVE
 * 2. Fee status is strictly PAID (or valid within approved grace period)
 * 3. Transport assignment is active
 * 4. Not suspended or expelled
 */
export function isStudentEligibleForTransport(student: Partial<StudentTransportRecord>): {
  isEligible: boolean;
  ineligibilityReason?: string;
} {
  if (!student) {
    return { isEligible: false, ineligibilityReason: "Student record not found" };
  }

  if (student.status === "EXPELLED") {
    return {
      isEligible: false,
      ineligibilityReason: "Student is Expelled from UTS Transport Service.",
    };
  }

  if (student.status === "SUSPENDED_DISCIPLINARY") {
    return {
      isEligible: false,
      ineligibilityReason: `Student account is Suspended for Disciplinary reasons (${student.suspension_reason || "Violation of Conduct"}).`,
    };
  }

  if (student.status === "SUSPENDED_NON_PAYMENT") {
    return {
      isEligible: false,
      ineligibilityReason: "Transport service suspended due to outstanding overdue fee.",
    };
  }

  if (student.status === "INACTIVE" || student.status === "PENDING") {
    return {
      isEligible: false,
      ineligibilityReason: `Student account is currently ${student.status}.`,
    };
  }

  if (student.fee_status === "OVERDUE" || student.fee_status === "SUSPENDED") {
    return {
      isEligible: false,
      ineligibilityReason: "Transport fee payment is Overdue/Suspended.",
    };
  }

  if (student.transport_assignment_active === false) {
    return {
      isEligible: false,
      ineligibilityReason: "Active transport assignment has been disabled by Operations Admin.",
    };
  }

  return { isEligible: true };
}

/**
 * Filter daily pickup manifest for driver console and trip attendance.
 * Excludes all ineligible (suspended, expelled, non-payment) students.
 */
export function filterEligiblePickupManifest(
  students: StudentTransportRecord[],
  routeId?: string,
  stopId?: string,
): StudentTransportRecord[] {
  return students.filter((student) => {
    // 1. Route match (if routeId specified)
    if (routeId && student.assigned_route_id && student.assigned_route_id !== routeId) {
      return false;
    }

    // 2. Stop match (if stopId specified)
    if (stopId && student.pickup_stop_id && student.pickup_stop_id !== stopId) {
      return false;
    }

    // 3. Strict eligibility check
    const { isEligible } = isStudentEligibleForTransport(student);
    return isEligible;
  });
}

/**
 * Section 5: Schedule Conflict Detection
 * Validates that bus & driver are not double-booked and bus is not under maintenance.
 */
export function checkScheduleConflicts(
  newSchedule: {
    id?: string;
    route_id: string;
    bus_id: string;
    driver_id: string;
    departure_time: string;
    arrival_time: string;
    shift: string;
  },
  existingSchedules: ScheduleItem[],
  busMaintenanceStatus?: Record<string, string>, // bus_id -> status ('ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE')
): ScheduleConflictCheckResult {
  const conflicts: string[] = [];

  // 1. Check Bus Maintenance Status
  if (busMaintenanceStatus && busMaintenanceStatus[newSchedule.bus_id]) {
    const bStatus = busMaintenanceStatus[newSchedule.bus_id];
    if (bStatus === "UNDER_MAINTENANCE") {
      conflicts.push(
        `Selected Bus is currently UNDER MAINTENANCE and cannot be scheduled for trips.`,
      );
    } else if (bStatus === "INACTIVE") {
      conflicts.push(`Selected Bus is marked INACTIVE in fleet registry.`);
    }
  }

  // Helper to convert "HH:MM" to minutes from midnight
  function toMinutes(t: string): number {
    if (!t) return 0;
    const parts = t.split(":");
    return parseInt(parts[0] || "0", 10) * 60 + parseInt(parts[1] || "0", 10);
  }

  const newStart = toMinutes(newSchedule.departure_time);
  const newEnd = toMinutes(newSchedule.arrival_time);

  // 2. Check for Driver & Bus Overlapping Conflicts
  for (const existing of existingSchedules) {
    if (existing.id === newSchedule.id) continue;
    if (existing.status === "CANCELLED" || existing.status === "COMPLETED") continue;

    // If shift matches or times overlap
    const exStart = toMinutes(existing.departure_time);
    const exEnd = toMinutes(existing.arrival_time);

    // Overlap condition: startA < endB && endA > startB
    const timesOverlap =
      (newStart < exEnd && newEnd > exStart) ||
      (newSchedule.shift && existing.shift && newSchedule.shift === existing.shift);

    if (timesOverlap) {
      if (existing.bus_id === newSchedule.bus_id) {
        conflicts.push(
          `Bus [${existing.bus_code}] is already assigned to Schedule for "${existing.route_name}" (${existing.departure_time} - ${existing.arrival_time}).`,
        );
      }
      if (existing.driver_id === newSchedule.driver_id) {
        conflicts.push(
          `Driver [${existing.driver_name}] is already assigned to active schedule for "${existing.route_name}" (${existing.departure_time} - ${existing.arrival_time}).`,
        );
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}
