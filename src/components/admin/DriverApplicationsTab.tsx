import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  UserCheck,
  UserX,
  FileText,
  Phone,
  Mail,
  Car,
  AlertTriangle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DriverAppItem {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  cnic_no: string;
  license_no: string;
  experience_years: number | null;
  vehicle_preference: string | null;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED" | "ACTIVE";
  rejection_reason?: string | null;
  created_at: string;
  notes?: string | null;
}

interface DriverApplicationsTabProps {
  applications: DriverAppItem[];
  onRefresh: () => void;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onSuspend: (driverId: string, reason: string) => Promise<void>;
  onReactivate: (driverId: string) => Promise<void>;
}

export function DriverApplicationsTab({
  applications,
  onRefresh,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
}: DriverApplicationsTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Rejection Dialog State
  const [rejectAppId, setRejectAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal State
  const [selectedApp, setSelectedApp] = useState<DriverAppItem | null>(null);

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      app.applicant_email.toLowerCase().includes(search.toLowerCase()) ||
      app.license_no.toLowerCase().includes(search.toLowerCase()) ||
      app.cnic_no.includes(search);

    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleConfirmReject = async () => {
    if (!rejectAppId) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(rejectAppId, rejectionReason.trim());
      setRejectAppId(null);
      setRejectionReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: DriverAppItem["status"]) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
            Pending Review
          </Badge>
        );
      case "APPROVED":
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
            Approved / Active
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "SUSPENDED":
        return <Badge className="bg-red-500/15 text-red-600 border-red-500/30">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = applications.filter((a) => a.status === "PENDING_APPROVAL").length;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="card-elevated p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">
                Driver Applications & Verification
              </h3>
              {pendingCount > 0 && (
                <Badge className="bg-amber-500 text-white font-bold">
                  {pendingCount} Pending Review
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review applicant credentials, verify driving licenses, approve active driver accounts,
              or record rejection reasons.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh List
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by applicant name, license number, CNIC, or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED"].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className="text-xs"
              >
                {st === "ALL" ? "All" : st.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Applicant Name</th>
                <th className="px-6 py-3">Contact & CNIC</th>
                <th className="px-6 py-3">License & Experience</th>
                <th className="px-6 py-3">Vehicle Preference</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">
                    No driver applications matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{app.applicant_name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" /> {app.applicant_email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-mono">{app.applicant_phone}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        CNIC: {app.cnic_no}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-bold text-primary">
                        {app.license_no}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {app.experience_years || 2} Years Experience
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {app.vehicle_preference || "Toyota Coaster"}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedApp(app)}
                          className="h-8 px-2 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>

                        {app.status === "PENDING_APPROVAL" && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                              onClick={() => onApprove(app.id)}
                            >
                              <UserCheck className="mr-1 h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() => setRejectAppId(app.id)}
                            >
                              <UserX className="mr-1 h-3.5 w-3.5" /> Reject
                            </Button>
                          </>
                        )}

                        {(app.status === "APPROVED" || app.status === "ACTIVE") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => onSuspend(app.id, "Administrative review")}
                          >
                            <ShieldAlert className="mr-1 h-3.5 w-3.5" /> Suspend
                          </Button>
                        )}

                        {app.status === "SUSPENDED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs text-emerald-600 hover:bg-emerald-50"
                            onClick={() => onReactivate(app.id)}
                          >
                            <UserCheck className="mr-1 h-3.5 w-3.5" /> Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Reason Dialog */}
      <Dialog open={!!rejectAppId} onOpenChange={(open) => !open && setRejectAppId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserX className="h-5 w-5" /> Reject Driver Application
            </DialogTitle>
            <DialogDescription>
              Provide an official operational reason for rejecting this application. This note will
              be recorded in the audit logs and visible to the applicant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason for Rejection *</Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g. Expired PSV driving license / Insufficient commercial driving experience / Incomplete verification documents"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectAppId(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject} disabled={isSubmitting}>
              {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        {selectedApp && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Driver Application Dossier</span>
                {getStatusBadge(selectedApp.status)}
              </DialogTitle>
              <DialogDescription>
                Submitted on {new Date(selectedApp.created_at).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-secondary/30">
                <div>
                  <span className="text-xs text-muted-foreground block">Full Name</span>
                  <strong className="text-foreground">{selectedApp.applicant_name}</strong>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">CNIC Number</span>
                  <strong className="font-mono text-foreground">{selectedApp.cnic_no}</strong>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Email Address</span>
                  <span className="text-muted-foreground">{selectedApp.applicant_email}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Phone Number</span>
                  <span className="font-mono text-muted-foreground">
                    {selectedApp.applicant_phone}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Driving License No</span>
                  <strong className="font-mono text-primary">{selectedApp.license_no}</strong>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Experience</span>
                  <span className="text-foreground">{selectedApp.experience_years || 2} Years</span>
                </div>
              </div>

              {selectedApp.rejection_reason && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <strong>Rejection Reason:</strong> {selectedApp.rejection_reason}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedApp(null)}>
                Close Dossier
              </Button>
              {selectedApp.status === "PENDING_APPROVAL" && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    const id = selectedApp.id;
                    setSelectedApp(null);
                    onApprove(id);
                  }}
                >
                  <UserCheck className="mr-1.5 h-4 w-4" /> Approve Application
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
