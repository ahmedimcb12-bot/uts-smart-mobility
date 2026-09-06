import { useState } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Car,
  Route as RouteIcon,
  Check,
  Edit,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";

interface ComplaintsManagementTabProps {
  complaints: any[];
  onResolveComplaint: (complaintId: string, notes: string) => Promise<void>;
  onUpdateStatus: (complaintId: string, status: string) => Promise<void>;
}

export function ComplaintsManagementTab({
  complaints,
  onResolveComplaint,
  onUpdateStatus,
}: ComplaintsManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      (c.reference && c.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.customer_name && c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleOpenResolve = (comp: any) => {
    setSelectedComplaint(comp);
    setResolutionNotes(comp.resolution_notes || "");
    setIsResolveModalOpen(true);
  };

  const handleConfirmResolve = async () => {
    if (!selectedComplaint) return;
    if (!resolutionNotes.trim()) {
      toast.error("Please enter resolution notes describing actions taken.");
      return;
    }

    setSubmitting(true);
    try {
      await onResolveComplaint(selectedComplaint.id, resolutionNotes.trim());
      setIsResolveModalOpen(false);
      setResolutionNotes("");
      toast.success(`Complaint ${selectedComplaint.reference || "Ticket"} marked as RESOLVED.`);
    } catch (err) {
      toast.error("Failed to resolve complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-destructive" /> Complaints, Feedback & Incident Triage
            </h2>
            <p className="text-xs text-muted-foreground">
              Investigate passenger & driver complaints, verify vehicle telemetry, and log official resolutions.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search complaints by reference ticket, description, or complainant name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open Only</SelectItem>
                <SelectItem value="IN REVIEW">In Review</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="AC / Comfort">AC / Comfort</SelectItem>
                <SelectItem value="Pickup Location">Pickup Location</SelectItem>
                <SelectItem value="Late Pickup">Late Pickup</SelectItem>
                <SelectItem value="Driver Behaviour">Driver Behaviour</SelectItem>
                <SelectItem value="Student Misconduct">Student Misconduct</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Complaints List Cards */}
      <div className="space-y-4">
        {filteredComplaints.map((c) => (
          <div key={c.id} className="card-elevated p-6 space-y-4 hover:border-primary/40 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-sm text-primary">{c.reference || "UTS-C-100"}</span>
                <Badge variant="secondary" className="text-xs">{c.category}</Badge>
                <Badge
                  className={
                    c.priority === "HIGH" || c.priority === "URGENT"
                      ? "bg-destructive/15 text-destructive text-[10px] font-bold"
                      : "bg-amber-500/15 text-amber-600 text-[10px]"
                  }
                >
                  {c.priority} PRIORITY
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    c.status === "RESOLVED"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-amber-500/15 text-amber-600"
                  }`}
                >
                  {c.status}
                </span>

                {c.status !== "RESOLVED" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7"
                    onClick={() => handleOpenResolve(c)}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Resolve Ticket
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{c.description}</p>

              {c.resolution_notes && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 space-y-0.5">
                  <strong className="flex items-center gap-1 font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" /> Resolution Record:
                  </strong>
                  <p>{c.resolution_notes}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2">
                <span>Complainant: <strong>{c.customer_name || "Anonymous / Passenger"}</strong></span>
                {c.customer_phone && <span>• Phone: {c.customer_phone}</span>}
                {c.created_at && <span>• Logged: {new Date(c.created_at).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resolve Complaint Modal */}
      <Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" /> Resolve Complaint {selectedComplaint?.reference}
            </DialogTitle>
            <DialogDescription>
              Record the operational investigation findings and corrective action taken.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs">Official Resolution Notes *</Label>
            <Textarea
              placeholder="e.g. AC cooling gas refilled by fleet workshop / Driver counseled regarding schedule punctuality."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
              className="text-xs"
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmResolve} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? "Saving..." : "Confirm Resolved & Log Audit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
