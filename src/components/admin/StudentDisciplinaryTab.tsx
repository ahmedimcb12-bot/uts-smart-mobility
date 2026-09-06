import { useState } from "react";
import {
  Scale,
  Search,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  RotateCcw,
  UserX,
  UserCheck,
  MessageSquare,
  History,
  ShieldCheck,
  ArrowRight,
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
import type {
  StudentTransportRecord,
  DisciplinaryActionRecord,
  StudentAccountStatus,
} from "@/lib/transport-eligibility";
import { toast } from "sonner";

interface StudentDisciplinaryTabProps {
  students: StudentTransportRecord[];
  disciplinaryLogs: DisciplinaryActionRecord[];
  complaints: any[];
  onTakeDisciplinaryAction: (
    studentId: string,
    actionType: "FORMAL_WARNING" | "TEMPORARY_SUSPENSION" | "PERMANENT_SUSPENSION" | "EXPULSION" | "REINSTATED",
    reason: string,
    notes?: string,
    expiryDate?: string,
  ) => Promise<void>;
}

export function StudentDisciplinaryTab({
  students,
  disciplinaryLogs,
  complaints,
  onTakeDisciplinaryAction,
}: StudentDisciplinaryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentTransportRecord | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Form State
  const [actionType, setActionType] = useState<
    "FORMAL_WARNING" | "TEMPORARY_SUSPENSION" | "PERMANENT_SUSPENSION" | "EXPULSION" | "REINSTATED"
  >("TEMPORARY_SUSPENSION");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [expiryDate, setExpiryDate] = useState("2026-09-20");
  const [submitting, setSubmitting] = useState(false);

  // Filtered Disciplinary Cases
  const suspendedOrExpelledStudents = students.filter(
    (s) =>
      s.status === "SUSPENDED_DISCIPLINARY" ||
      s.status === "SUSPENDED_NON_PAYMENT" ||
      s.status === "EXPELLED",
  );

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.roll_no && s.roll_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.suspension_reason && s.suspension_reason.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Driver complaints against students
  const driverStudentComplaints = complaints.filter(
    (c) =>
      c.category?.toLowerCase().includes("student") ||
      c.category?.toLowerCase().includes("behaviour") ||
      c.description?.toLowerCase().includes("driver report") ||
      c.description?.toLowerCase().includes("misconduct"),
  );

  const handleOpenActionModal = (student: StudentTransportRecord) => {
    setSelectedStudent(student);
    if (student.status.includes("SUSPENDED") || student.status === "EXPELLED") {
      setActionType("REINSTATED");
    } else {
      setActionType("TEMPORARY_SUSPENSION");
    }
    setReason("");
    setNotes("");
    setIsActionModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedStudent) return;
    if (actionType !== "REINSTATED" && !reason.trim()) {
      toast.error("Please specify an official reason for disciplinary action.");
      return;
    }

    setSubmitting(true);
    try {
      await onTakeDisciplinaryAction(
        selectedStudent.id,
        actionType,
        reason.trim() || "Student case reviewed and reinstated by Operations Authority.",
        notes.trim() || undefined,
        actionType === "TEMPORARY_SUSPENSION" ? expiryDate : undefined,
      );

      setIsActionModalOpen(false);
      if (actionType === "REINSTATED") {
        toast.success(`Student ${selectedStudent.full_name} REINSTATED to active transport service!`);
      } else {
        toast.warning(
          `Disciplinary action applied. Student immediately EXCLUDED from Driver Daily Manifests.`,
        );
      }
    } catch (err) {
      toast.error("Failed to execute disciplinary action.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-destructive" /> Student Disciplinary & Suspension Authority
            </h2>
            <p className="text-xs text-muted-foreground">
              Review driver complaints regarding student misbehavior, enforce temporary suspensions or permanent expulsion, and manage reinstatements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-destructive text-destructive-foreground font-bold text-xs py-1 px-3">
              {suspendedOrExpelledStudents.length} Active Suspensions / Expulsions
            </Badge>
          </div>
        </div>

        {/* Business Rule Guarantee Banner */}
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-foreground space-y-1">
          <strong className="text-destructive flex items-center gap-1.5 font-bold">
            <ShieldAlert className="h-4 w-4 shrink-0" /> Operational Enforcement Business Rule
          </strong>
          <p className="text-muted-foreground">
            Any student whose status is <strong>Suspended (Disciplinary or Non-Payment)</strong> or <strong>Expelled</strong> is immediately locked from the Student Dashboard and <strong>strictly excluded from the driver's daily pickup list</strong> at the backend database query level.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Currently Suspended / Expelled Roster (2 cols) */}
        <div className="lg:col-span-2 card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <UserX className="h-5 w-5 text-destructive" /> Active Suspended & Expelled Students
            </h3>
            <Badge variant="outline">{suspendedOrExpelledStudents.length} Restricted</Badge>
          </div>

          {suspendedOrExpelledStudents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No students are currently suspended or expelled from transport.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {suspendedOrExpelledStudents.map((student) => (
                <div
                  key={student.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{student.full_name}</span>
                      <span className="text-xs font-mono text-muted-foreground">({student.roll_no || "NUST"})</span>
                      <Badge
                        className={
                          student.status === "EXPELLED"
                            ? "bg-destructive text-destructive-foreground text-[10px]"
                            : "bg-destructive/15 text-destructive text-[10px]"
                        }
                      >
                        {student.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="text-xs text-destructive font-medium">
                      Reason: {student.suspension_reason || "Violation of Transport Conduct Code"}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
                      <span>Effective: {student.suspension_effective_date || "Current"}</span>
                      {student.suspension_expiry_date && (
                        <span>• Expiry: {student.suspension_expiry_date} (Temporary)</span>
                      )}
                      <span>• Route: {student.assigned_route_name || "NUST Route 01"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      onClick={() => handleOpenActionModal(student)}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reinstate Student
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Driver Complaints against Students Quick Triage (1 col) */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-500" /> Driver Incident Reports
            </h3>
            <Badge variant="secondary" className="text-[10px]">Triage Queue</Badge>
          </div>

          <div className="space-y-3">
            {driverStudentComplaints.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-muted/40 border border-border">
                <p className="text-xs text-muted-foreground">
                  No unaddressed driver complaints filed against students.
                </p>
              </div>
            ) : (
              driverStudentComplaints.slice(0, 3).map((comp) => (
                <div key={comp.id} className="p-3 rounded-xl border border-border bg-secondary/30 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-foreground">{comp.customer_name || "Driver Report"}</strong>
                    <Badge variant="outline" className="text-[10px]">{comp.priority}</Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{comp.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Disciplinary Audit & Action Log */}
      <div className="card-elevated overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Disciplinary Action & Suspension History
            </h3>
            <p className="text-xs text-muted-foreground">
              Official audit log of warnings, suspensions, expulsions, and reinstatements.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Student Affected</th>
                <th className="px-6 py-3.5">Action Taken</th>
                <th className="px-6 py-3.5">Reason & Case Notes</th>
                <th className="px-6 py-3.5">Authority / Admin</th>
                <th className="px-6 py-3.5">Effective Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {disciplinaryLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground text-xs">
                    {log.student_name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        log.action_type === "REINSTATED"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : log.action_type === "EXPULSION"
                            ? "bg-destructive text-destructive-foreground font-black"
                            : "bg-destructive/15 text-destructive font-bold"
                      }`}
                    >
                      {log.action_type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-foreground">{log.reason}</p>
                    {log.notes && <p className="text-[11px] text-muted-foreground">{log.notes}</p>}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {log.action_by_name || "Super Admin"}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                    {log.effective_date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disciplinary Execution Dialog */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Scale className="h-5 w-5" /> Execute Disciplinary Order: {selectedStudent?.full_name}
            </DialogTitle>
            <DialogDescription>
              Orders will immediately sync with the database and update driver manifest manifests.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Order Type *</Label>
              <Select value={actionType} onValueChange={(val: any) => setActionType(val)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FORMAL_WARNING">Formal Disciplinary Warning</SelectItem>
                  <SelectItem value="TEMPORARY_SUSPENSION">Temporary Suspension (e.g. 14 Days)</SelectItem>
                  <SelectItem value="PERMANENT_SUSPENSION">Permanent Suspension</SelectItem>
                  <SelectItem value="EXPULSION">Expulsion from Service</SelectItem>
                  <SelectItem value="REINSTATED">Reinstate to Active Transport Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {actionType !== "REINSTATED" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Official Justification / Reason *</Label>
                  <Input
                    placeholder="e.g. Physical or verbal altercation with driver / Vandalism..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {actionType === "TEMPORARY_SUSPENSION" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Suspension End Date *</Label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Administrative Investigation & Decision Notes</Label>
                  <Input
                    placeholder="Committee reference or meeting minutes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className={actionType === "REINSTATED" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-destructive text-destructive-foreground"}
              onClick={handleConfirmAction}
              disabled={submitting}
            >
              {submitting ? "Applying..." : actionType === "REINSTATED" ? "Confirm Reinstatement" : "Enforce Disciplinary Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
