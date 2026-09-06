import { useState } from "react";
import {
  Car,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Receipt,
  FileText,
  Calendar as CalendarIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface VehicleItem {
  id: string;
  vehicle_code: string;
  category: string;
  capacity: number | null;
  status: string;
  notes: string | null;
}

export interface VehicleIssueItem {
  id: string;
  vehicle_id: string;
  issue_category: string;
  priority: string;
  description: string;
  status: string;
  resolution_notes?: string | null;
  created_at: string;
  vehicle?: { vehicle_code: string };
}

export interface MaintenanceRecordItem {
  id: string;
  vehicle_id: string;
  service_type: string;
  cost: number;
  odometer_reading: number | null;
  service_date: string;
  next_service_due: string | null;
  performed_by: string | null;
  notes: string | null;
  vehicle?: { vehicle_code: string };
}

interface FleetMaintenanceTabProps {
  vehicles: VehicleItem[];
  issues: VehicleIssueItem[];
  maintenanceLogs: MaintenanceRecordItem[];
  onRefresh: () => void;
  onAddMaintenance: (data: any) => Promise<void>;
  onResolveIssue: (issueId: string, notes: string) => Promise<void>;
}

export function FleetMaintenanceTab({
  vehicles,
  issues,
  maintenanceLogs,
  onRefresh,
  onAddMaintenance,
  onResolveIssue,
}: FleetMaintenanceTabProps) {
  const [activeSubtab, setActiveSubtab] = useState<"fleet" | "issues" | "maintenance">("fleet");
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);
  const [isResolveIssueOpen, setIsResolveIssueOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // New Maintenance Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("Engine Oil & Filter Replacement");
  const [serviceCost, setServiceCost] = useState("18500");
  const [odometer, setOdometer] = useState("45200");
  const [nextDue, setNextDue] = useState("2026-12-05");
  const [performedBy, setPerformedBy] = useState("Toyota Authorized Service Center");
  const [maintenanceNotes, setMaintenanceNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      toast.error("Please select a vehicle.");
      return;
    }

    setSubmitting(true);
    try {
      await onAddMaintenance({
        vehicle_id: selectedVehicleId,
        service_type: serviceType,
        cost: parseFloat(serviceCost) || 0,
        odometer_reading: parseInt(odometer, 10) || null,
        next_service_due: nextDue || null,
        performed_by: performedBy,
        notes: maintenanceNotes,
      });
      setIsAddMaintenanceOpen(false);
      toast.success("Maintenance record logged successfully!");
    } catch (e) {
      toast.error("Failed to log maintenance record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmResolveIssue = async () => {
    if (!selectedIssueId) return;
    setSubmitting(true);
    try {
      await onResolveIssue(
        selectedIssueId,
        resolutionNotes.trim() || "Issue inspected and resolved by fleet workshop.",
      );
      setIsResolveIssueOpen(false);
      setSelectedIssueId(null);
      setResolutionNotes("");
      toast.success("Vehicle issue marked as RESOLVED.");
    } catch (e) {
      toast.error("Failed to resolve issue.");
    } finally {
      setSubmitting(false);
    }
  };

  const openIssuesCount = issues.filter((i) => i.status === "OPEN").length;

  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">
                Fleet Management & Maintenance Logs
              </h3>
              {openIssuesCount > 0 && (
                <Badge className="bg-destructive text-white">{openIssuesCount} Open Issues</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitor commercial fleet assets, track scheduled preventative service, and triage
              driver-reported defects.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsAddMaintenanceOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Log Service Record
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Subtab selection */}
        <div className="mt-4 flex gap-2">
          <Button
            variant={activeSubtab === "fleet" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubtab("fleet")}
            className="text-xs"
          >
            Fleet Registry ({vehicles.length})
          </Button>
          <Button
            variant={activeSubtab === "issues" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubtab("issues")}
            className="text-xs"
          >
            Driver Reported Issues ({issues.length})
          </Button>
          <Button
            variant={activeSubtab === "maintenance" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubtab("maintenance")}
            className="text-xs"
          >
            Maintenance Service History ({maintenanceLogs.length})
          </Button>
        </div>
      </div>

      {/* 1. FLEET REGISTRY TABLE */}
      {activeSubtab === "fleet" && (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Vehicle Code</th>
                  <th className="px-6 py-3">Category & Model</th>
                  <th className="px-6 py-3">Passenger Capacity</th>
                  <th className="px-6 py-3">Operating Status</th>
                  <th className="px-6 py-3">Notes & Amenities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-mono font-bold text-primary">{v.vehicle_code}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">{v.category}</td>
                    <td className="px-6 py-4 text-xs font-mono">{v.capacity || 29} Seats</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          v.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : v.status === "MAINTENANCE"
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {v.notes || "Dual AC, GPS Tracker, Speed Governor"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DRIVER REPORTED ISSUES TABLE */}
      {activeSubtab === "issues" && (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Category & Priority</th>
                  <th className="px-6 py-3">Issue Description</th>
                  <th className="px-6 py-3">Reported Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {issues.map((i) => (
                  <tr key={i.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-mono font-bold text-primary">
                      {i.vehicle?.vehicle_code || "UTS-CST-104"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{i.issue_category}</div>
                      <Badge
                        variant={
                          i.priority === "HIGH" || i.priority === "CRITICAL"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] mt-0.5"
                      >
                        {i.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-foreground max-w-sm">
                      {i.description}
                      {i.resolution_notes && (
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                          Resolution: {i.resolution_notes}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                      {new Date(i.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          i.status === "OPEN"
                            ? "bg-amber-500/15 text-amber-600"
                            : "bg-emerald-500/15 text-emerald-600"
                        }`}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {i.status === "OPEN" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-emerald-600"
                          onClick={() => {
                            setSelectedIssueId(i.id);
                            setIsResolveIssueOpen(true);
                          }}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark Resolved
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MAINTENANCE SERVICE HISTORY */}
      {activeSubtab === "maintenance" && (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Service Type</th>
                  <th className="px-6 py-3">Cost (PKR)</th>
                  <th className="px-6 py-3">Odometer</th>
                  <th className="px-6 py-3">Service Date</th>
                  <th className="px-6 py-3">Next Due</th>
                  <th className="px-6 py-3">Workshop / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {maintenanceLogs.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-mono font-bold text-primary">
                      {m.vehicle?.vehicle_code || "UTS-CST-104"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{m.service_type}</td>
                    <td className="px-6 py-4 font-mono font-bold text-foreground">
                      PKR {m.cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {m.odometer_reading?.toLocaleString() || "—"} km
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{m.service_date}</td>
                    <td className="px-6 py-4 text-xs font-mono text-amber-600 font-semibold">
                      {m.next_service_due || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {m.performed_by || m.notes || "UTS Workshop"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      <Dialog open={isAddMaintenanceOpen} onOpenChange={setIsAddMaintenanceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" /> Log Vehicle Maintenance Service
            </DialogTitle>
            <DialogDescription>
              Record routine service, repairs, costs, and scheduled due dates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMaintenance} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Vehicle *</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select fleet vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vehicle_code} — {v.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Input
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="e.g. Engine Oil, Brake Pads, AC Gas Refill"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cost (PKR) *</Label>
                <Input
                  type="number"
                  value={serviceCost}
                  onChange={(e) => setServiceCost(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Odometer Reading (KM)</Label>
                <Input
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Service Date</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Next Service Due Date</Label>
                <Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service Workshop / Provider</Label>
              <Input
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                placeholder="e.g. Toyota Capital Islamabad"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddMaintenanceOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Maintenance Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resolve Issue Dialog */}
      <Dialog open={isResolveIssueOpen} onOpenChange={setIsResolveIssueOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" /> Resolve Reported Vehicle Issue
            </DialogTitle>
            <DialogDescription>
              Add resolution notes for the driver and operations record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Resolution Notes *</Label>
              <Textarea
                placeholder="e.g. AC refrigerant refilled and compressor belt tensioned. Checked and approved for service."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveIssueOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmResolveIssue}
              disabled={submitting}
            >
              {submitting ? "Resolving..." : "Confirm Resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
