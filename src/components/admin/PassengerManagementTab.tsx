import { useState } from "react";
import {
  GraduationCap,
  Search,
  Filter,
  Users,
  Route as RouteIcon,
  MapPin,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Edit,
  DollarSign,
  Receipt,
  Scale,
  RotateCcw,
  Eye,
  AlertTriangle,
  UserCheck,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RouteItem } from "@/lib/admin-operations-store";
import type {
  StudentTransportRecord,
  StudentAccountStatus,
  FeePaymentStatus,
} from "@/lib/transport-eligibility";
import { toast } from "sonner";

interface PassengerManagementTabProps {
  students: StudentTransportRecord[];
  routes: RouteItem[];
  onUpdateStudent: (studentId: string, updates: Partial<StudentTransportRecord>) => Promise<void>;
  onTakeDisciplinaryAction: (
    studentId: string,
    actionType: "FORMAL_WARNING" | "TEMPORARY_SUSPENSION" | "PERMANENT_SUSPENSION" | "EXPULSION" | "REINSTATED",
    reason: string,
    notes?: string,
    expiryDate?: string,
  ) => Promise<void>;
  onUpdateFeeStatus: (studentId: string, status: FeePaymentStatus) => Promise<void>;
}

export function PassengerManagementTab({
  students,
  routes,
  onUpdateStudent,
  onTakeDisciplinaryAction,
  onUpdateFeeStatus,
}: PassengerManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [feeFilter, setFeeFilter] = useState<string>("ALL");

  // Selected Student for Modals
  const [selectedStudent, setSelectedStudent] = useState<StudentTransportRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDisciplinaryModalOpen, setIsDisciplinaryModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Form State
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [editAssignedRouteId, setEditAssignedRouteId] = useState("");
  const [editPickupStopId, setEditPickupStopId] = useState("");
  const [editPickupTime, setEditPickupTime] = useState("");
  const [editStatus, setEditStatus] = useState<StudentAccountStatus>("ACTIVE");

  // Disciplinary Modal Form State
  const [actionType, setActionType] = useState<"FORMAL_WARNING" | "TEMPORARY_SUSPENSION" | "PERMANENT_SUSPENSION" | "EXPULSION" | "REINSTATED">("TEMPORARY_SUSPENSION");
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [actionExpiryDate, setActionExpiryDate] = useState("2026-09-20");

  // Fee Form State
  const [newFeeStatus, setNewFeeStatus] = useState<FeePaymentStatus>("PAID");
  const [submitting, setSubmitting] = useState(false);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.phone && s.phone.includes(searchQuery)) ||
      (s.roll_no && s.roll_no.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchesFee = feeFilter === "ALL" || s.fee_status === feeFilter;

    return matchesSearch && matchesStatus && matchesFee;
  });

  const handleOpenEdit = (student: StudentTransportRecord) => {
    setSelectedStudent(student);
    setEditFullName(student.full_name);
    setEditPhone(student.phone || "");
    setEditInstitution(student.institution || "");
    setEditAssignedRouteId(student.assigned_route_id || "none");
    setEditPickupStopId(student.pickup_stop_id || "none");
    setEditPickupTime(student.pickup_time || "07:30 AM");
    setEditStatus(student.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      const route = routes.find((r) => r.id === editAssignedRouteId);
      const stop = route?.stops?.find((st) => st.id === editPickupStopId);

      await onUpdateStudent(selectedStudent.id, {
        full_name: editFullName.trim(),
        phone: editPhone.trim(),
        institution: editInstitution.trim(),
        assigned_route_id: editAssignedRouteId === "none" ? null : editAssignedRouteId,
        assigned_route_name: route ? route.name : null,
        pickup_stop_id: editPickupStopId === "none" ? null : editPickupStopId,
        pickup_stop_name: stop ? stop.name : null,
        pickup_time: editPickupTime,
        status: editStatus,
        transport_assignment_active: editStatus === "ACTIVE",
      });

      setIsEditModalOpen(false);
      toast.success("Passenger details and transport assignment updated.");
    } catch (err) {
      toast.error("Failed to update student profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDisciplinary = (student: StudentTransportRecord) => {
    setSelectedStudent(student);
    setActionType(student.status.includes("SUSPENDED") || student.status === "EXPELLED" ? "REINSTATED" : "TEMPORARY_SUSPENSION");
    setActionReason("");
    setActionNotes("");
    setIsDisciplinaryModalOpen(true);
  };

  const handleConfirmDisciplinary = async () => {
    if (!selectedStudent) return;
    if (actionType !== "REINSTATED" && !actionReason.trim()) {
      toast.error("Please provide a reason for disciplinary action.");
      return;
    }

    setSubmitting(true);
    try {
      await onTakeDisciplinaryAction(
        selectedStudent.id,
        actionType,
        actionReason.trim() || "Case reviewed and reinstated by Operations Authority.",
        actionNotes.trim() || undefined,
        actionType === "TEMPORARY_SUSPENSION" ? actionExpiryDate : undefined,
      );

      setIsDisciplinaryModalOpen(false);
      if (actionType === "REINSTATED") {
        toast.success(`Student ${selectedStudent.full_name} REINSTATED to active transport service!`);
      } else {
        toast.warning(
          `Disciplinary action applied. Student immediately EXCLUDED from Driver Daily Manifests.`,
        );
      }
    } catch (err) {
      toast.error("Failed to apply disciplinary action.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmFeeUpdate = async () => {
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      await onUpdateFeeStatus(selectedStudent.id, newFeeStatus);
      setIsFeeModalOpen(false);
      toast.success(`Fee status updated to ${newFeeStatus} for ${selectedStudent.full_name}.`);
    } catch (err) {
      toast.error("Failed to update fee status.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" /> Passenger & Student Management
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage student registrations, route and pickup allocations, fee clearance, and disciplinary status.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search student by name, roll no, institution, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses ({students.length})</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending Review</SelectItem>
                <SelectItem value="SUSPENDED_DISCIPLINARY">Suspended (Disciplinary)</SelectItem>
                <SelectItem value="SUSPENDED_NON_PAYMENT">Suspended (Fees)</SelectItem>
                <SelectItem value="EXPELLED">Expelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={feeFilter} onValueChange={setFeeFilter}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="All Fee States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Fees</SelectItem>
                <SelectItem value="PAID">Paid Only</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Passengers Data Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Student / Passenger</th>
                <th className="px-6 py-3.5">Assigned Route & Stop</th>
                <th className="px-6 py-3.5">Pickup Timing</th>
                <th className="px-6 py-3.5">Account Status</th>
                <th className="px-6 py-3.5">Fee Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground text-sm flex items-center gap-2">
                      {student.full_name}
                      {student.roll_no && (
                        <span className="text-[11px] font-mono text-muted-foreground">({student.roll_no})</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {student.institution || "NUST Islamabad"} • {student.phone}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-semibold text-xs text-foreground block max-w-[200px] truncate">
                      {student.assigned_route_name || "Unassigned Route"}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-accent" /> {student.pickup_stop_name || "Stop Not Set"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" /> {student.pickup_time || "07:30 AM"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        student.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : student.status === "EXPELLED"
                            ? "bg-destructive text-destructive-foreground"
                            : student.status.includes("SUSPENDED")
                              ? "bg-destructive/15 text-destructive"
                              : "bg-amber-500/15 text-amber-600"
                      }`}
                    >
                      {student.status === "ACTIVE" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {student.status.replace("_", " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        student.fee_status === "PAID"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : student.fee_status === "OVERDUE"
                            ? "bg-destructive/15 text-destructive font-black"
                            : "bg-amber-500/15 text-amber-600"
                      }`}
                    >
                      {student.fee_status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => handleOpenEdit(student)}
                      >
                        <Edit className="mr-1 h-3 w-3" /> Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-emerald-600 hover:bg-emerald-500/10"
                        onClick={() => {
                          setSelectedStudent(student);
                          setNewFeeStatus(student.fee_status);
                          setIsFeeModalOpen(true);
                        }}
                      >
                        <Receipt className="mr-1 h-3 w-3" /> Fee
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-7 px-2.5 text-xs ${
                          student.status === "ACTIVE"
                            ? "text-destructive hover:bg-destructive/10"
                            : "text-emerald-600 hover:bg-emerald-500/10"
                        }`}
                        onClick={() => handleOpenDisciplinary(student)}
                      >
                        <Scale className="mr-1 h-3 w-3" />
                        {student.status === "ACTIVE" ? "Discipline" : "Reinstate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Passenger Assignment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Edit Passenger & Stop Allocation
            </DialogTitle>
            <DialogDescription>
              Assign route, specific stop waypoint, and pickup timing for {selectedStudent?.full_name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Full Name *</Label>
                <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} required className="text-xs font-semibold" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contact Phone *</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required className="text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Institution / Campus</Label>
              <Input value={editInstitution} onChange={(e) => setEditInstitution(e.target.value)} className="text-xs" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Assigned Route</Label>
              <Select value={editAssignedRouteId} onValueChange={(val) => {
                setEditAssignedRouteId(val);
                const r = routes.find((x) => x.id === val);
                const firstStop = r?.stops?.[0];
                if (firstStop) {
                  setEditPickupStopId(firstStop.id);
                  setEditPickupTime(firstStop.pickup_time || "07:30 AM");
                } else {
                  setEditPickupStopId("none");
                  setEditPickupTime("07:30 AM");
                }
              }}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None (Unassigned) --</SelectItem>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.code} — {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pickup Stop Waypoint</Label>
                <Select value={editPickupStopId} onValueChange={(val) => {
                  setEditPickupStopId(val);
                  const r = routes.find((x) => x.id === editAssignedRouteId);
                  const stop = r?.stops?.find((st) => st.id === val);
                  if (stop?.pickup_time) setEditPickupTime(stop.pickup_time);
                }}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Stop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- None --</SelectItem>
                    {routes
                      .find((r) => r.id === editAssignedRouteId)
                      ?.stops?.map((st) => (
                        <SelectItem key={st.id} value={st.id}>
                          {st.sequence}. {st.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Scheduled Pickup Time</Label>
                <Input value={editPickupTime} onChange={(e) => setEditPickupTime(e.target.value)} className="text-xs font-mono" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Saving..." : "Save Assignments"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Disciplinary & Suspension / Reinstatement Modal */}
      <Dialog open={isDisciplinaryModalOpen} onOpenChange={setIsDisciplinaryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Scale className="h-5 w-5" /> Disciplinary Action: {selectedStudent?.full_name}
            </DialogTitle>
            <DialogDescription>
              Enforce disciplinary actions (warnings, suspensions, expulsion) or reinstate active transport eligibility.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Select Action *</Label>
              <Select value={actionType} onValueChange={(val: any) => setActionType(val)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FORMAL_WARNING">Formal Disciplinary Warning</SelectItem>
                  <SelectItem value="TEMPORARY_SUSPENSION">Temporary Suspension (e.g. 14 Days)</SelectItem>
                  <SelectItem value="PERMANENT_SUSPENSION">Permanent Suspension from Service</SelectItem>
                  <SelectItem value="EXPULSION">Full Expulsion (Blacklist Transport)</SelectItem>
                  <SelectItem value="REINSTATED">Reinstate to Active Transport Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {actionType !== "REINSTATED" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Official Reason *</Label>
                  <Input
                    placeholder="e.g. Altercation with driver / Refusal to follow safety rules..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {actionType === "TEMPORARY_SUSPENSION" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Suspension Expiry Date *</Label>
                    <Input
                      type="date"
                      value={actionExpiryDate}
                      onChange={(e) => setActionExpiryDate(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Administrative Investigation Notes</Label>
                  <Input
                    placeholder="Internal audit / committee decision notes..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </>
            )}

            {actionType === "REINSTATED" && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700">
                Reinstating this student will restore their active account status and re-include them in driver manifests.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisciplinaryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className={actionType === "REINSTATED" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-destructive text-destructive-foreground"}
              onClick={handleConfirmDisciplinary}
              disabled={submitting}
            >
              {submitting ? "Processing..." : actionType === "REINSTATED" ? "Confirm Reinstatement" : "Enforce Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fee Status Management Dialog */}
      <Dialog open={isFeeModalOpen} onOpenChange={setIsFeeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" /> Update Fee Status: {selectedStudent?.full_name}
            </DialogTitle>
            <DialogDescription>
              Record fee payments or mark invoice as overdue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs">Fee Clearance State *</Label>
            <Select value={newFeeStatus} onValueChange={(val: any) => setNewFeeStatus(val)}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAID">PAID (Clear for Transport)</SelectItem>
                <SelectItem value="PENDING">PENDING (Awaiting Invoice Due Date)</SelectItem>
                <SelectItem value="OVERDUE">OVERDUE (Trigger Reminders & Grace Period)</SelectItem>
                <SelectItem value="SUSPENDED">SUSPENDED (Lock Transport for Non-Payment)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmFeeUpdate} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? "Saving..." : "Update Fee Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
