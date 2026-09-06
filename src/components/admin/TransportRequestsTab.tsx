import { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  Building,
  Calendar,
  Users,
  MapPin,
  Edit,
  ArrowRight,
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

interface TransportRequestsTabProps {
  requests: any[];
  onUpdateRequestStatus: (requestId: string, status: string, notes?: string) => Promise<void>;
}

export function TransportRequestsTab({
  requests,
  onUpdateRequestStatus,
}: TransportRequestsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("QUOTED");
  const [submitting, setSubmitting] = useState(false);

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      (r.full_name && r.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.organization && r.organization.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.city && r.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.service_type && r.service_type.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetail = (req: any) => {
    setSelectedRequest(req);
    setNewStatus(req.status || "NEW");
    setAdminNotes(req.notes || "");
    setIsDetailModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await onUpdateRequestStatus(selectedRequest.id, newStatus, adminNotes);
      setIsDetailModalOpen(false);
      toast.success(`Request for ${selectedRequest.full_name} updated to ${newStatus}.`);
    } catch (err) {
      toast.error("Failed to update transport request.");
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
              <FileText className="h-5 w-5 text-primary" /> Transport Charters & Custom Route Requests
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage incoming commercial quote requests, corporate bookings, tourism charters, and special route inquiries.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search request by client name, organization, city, or service type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses ({requests.length})</SelectItem>
                <SelectItem value="NEW">New Inquiries</SelectItem>
                <SelectItem value="QUOTED">Quoted</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Requests Data Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Client / Organization</th>
                <th className="px-6 py-3.5">Service Type & City</th>
                <th className="px-6 py-3.5">Passengers</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground text-sm flex items-center gap-2">
                      {req.full_name}
                      {req.organization && <Badge variant="secondary" className="text-[10px]">{req.organization}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Phone: <a href={`tel:${req.phone}`} className="underline text-foreground">{req.phone}</a>
                      {req.email && <span> • {req.email}</span>}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-semibold text-xs text-primary block">{req.service_type}</span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" /> {req.city || "Islamabad"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" /> {req.passengers || 1} Pax
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        req.status === "APPROVED" || req.status === "COMPLETED"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : req.status === "NEW"
                            ? "bg-primary/15 text-primary animate-pulse"
                            : req.status === "QUOTED"
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => handleOpenDetail(req)}>
                      <Edit className="mr-1 h-3 w-3" /> Manage Quote
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Request & Quote Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Manage Transport Quote: {selectedRequest?.full_name}
            </DialogTitle>
            <DialogDescription>
              Review custom route charter requirements and administer quotation status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-1">
              <p><strong>Service:</strong> {selectedRequest?.service_type} ({selectedRequest?.passengers} Passengers)</p>
              <p><strong>Location:</strong> {selectedRequest?.city} {selectedRequest?.pickup_location ? `• ${selectedRequest.pickup_location}` : ""}</p>
              <p><strong>Contact:</strong> {selectedRequest?.phone} ({selectedRequest?.email || "No email"})</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Update Status *</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New Request</SelectItem>
                  <SelectItem value="QUOTED">Quotation Sent</SelectItem>
                  <SelectItem value="APPROVED">Approved & Booked</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress / Assigned</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Declined / Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Admin Response / Quotation Notes</Label>
              <Textarea
                placeholder="e.g. Quoted PKR 45,000 for 29-seater Coaster / Vehicle assigned..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStatus} disabled={submitting} className="bg-primary text-primary-foreground">
              {submitting ? "Saving..." : "Save Request Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
