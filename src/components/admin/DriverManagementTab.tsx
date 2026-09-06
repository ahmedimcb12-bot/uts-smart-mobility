import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Route as RouteIcon,
  ShieldAlert,
  Star,
  UserCheck,
  UserX,
  Edit,
  Eye,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  History,
  Check,
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
import type { DriverItem, BusItem, RouteItem } from "@/lib/admin-operations-store";
import { toast } from "sonner";

interface DriverManagementTabProps {
  drivers: DriverItem[];
  buses: BusItem[];
  routes: RouteItem[];
  onApproveDriver: (driverId: string, notes?: string) => Promise<void>;
  onRejectDriver: (driverId: string, reason: string) => Promise<void>;
  onSuspendDriver: (driverId: string, reason: string) => Promise<void>;
  onReactivateDriver: (driverId: string) => Promise<void>;
  onUpdateDriver: (driverId: string, updates: Partial<DriverItem>) => Promise<void>;
}

export function DriverManagementTab({
  drivers,
  buses,
  routes,
  onApproveDriver,
  onRejectDriver,
  onSuspendDriver,
  onReactivateDriver,
  onUpdateDriver,
}: DriverManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected Driver for View / Edit / Approval Modal
  const [selectedDriver, setSelectedDriver] = useState<DriverItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  // Form State
  const [editPhone, setEditPhone] = useState("");
  const [editLicense, setEditLicense] = useState("");
  const [editAssignedBus, setEditAssignedBus] = useState("");
  const [editAssignedRoute, setEditAssignedRoute] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter drivers
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      d.license_no.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = drivers.filter((d) => d.status === "PENDING").length;

  const handleOpenEdit = (driver: DriverItem) => {
    setSelectedDriver(driver);
    setEditPhone(driver.phone || "");
    setEditLicense(driver.license_no || "");
    setEditAssignedBus(driver.assigned_bus_id || "none");
    setEditAssignedRoute(driver.assigned_route_id || "none");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setSubmitting(true);
    try {
      const bus = buses.find((b) => b.id === editAssignedBus);
      const route = routes.find((r) => r.id === editAssignedRoute);

      await onUpdateDriver(selectedDriver.id, {
        phone: editPhone,
        license_no: editLicense,
        assigned_bus_id: editAssignedBus === "none" ? null : editAssignedBus,
        assigned_bus_code: bus ? bus.vehicle_code : null,
        assigned_route_id: editAssignedRoute === "none" ? null : editAssignedRoute,
        assigned_route_name: route ? route.name : null,
      });

      setIsEditModalOpen(false);
      toast.success("Driver details and assignments updated successfully.");
    } catch (err) {
      toast.error("Failed to update driver details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedDriver || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejecting the driver application.");
      return;
    }
    setSubmitting(true);
    try {
      await onRejectDriver(selectedDriver.id, rejectionReason.trim());
      setIsRejectModalOpen(false);
      setRejectionReason("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSuspend = async () => {
    if (!selectedDriver || !suspensionReason.trim()) {
      toast.error("Please specify reason for suspension.");
      return;
    }
    setSubmitting(true);
    try {
      await onSuspendDriver(selectedDriver.id, suspensionReason.trim());
      setIsSuspendModalOpen(false);
      setSuspensionReason("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search/Filters */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Driver Lifecycle & Fleet Assignments
            </h2>
            <p className="text-xs text-muted-foreground">
              Review driver applications, manage licenses, assign vehicles and routes, and monitor compliance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 text-white font-bold text-xs py-1 px-3">
                {pendingCount} Pending Applications
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search driver by name, phone, or license..."
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
                <SelectItem value="ALL">All Statuses ({drivers.length})</SelectItem>
                <SelectItem value="ACTIVE">Active Only</SelectItem>
                <SelectItem value="PENDING">Pending Review ({pendingCount})</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Drivers Data Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Driver Profile</th>
                <th className="px-6 py-3.5">License & Exp</th>
                <th className="px-6 py-3.5">Assigned Bus</th>
                <th className="px-6 py-3.5">Assigned Route</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Rating / Trips</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                      {driver.full_name}
                      {driver.status === "PENDING" && (
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{driver.phone}</span>
                      {driver.email && <span>• {driver.email}</span>}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-foreground block">
                      {driver.license_no}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {driver.experience_years ? `${driver.experience_years} Years Exp` : "N/A"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {driver.assigned_bus_code ? (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-foreground">
                        <Car className="h-3.5 w-3.5 text-primary" /> {driver.assigned_bus_code}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {driver.assigned_route_name ? (
                      <span className="text-xs font-medium text-foreground block max-w-[200px] truncate">
                        {driver.assigned_route_name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        driver.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : driver.status === "PENDING"
                            ? "bg-amber-500/15 text-amber-600"
                            : driver.status === "SUSPENDED"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {driver.status === "ACTIVE" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : driver.status === "PENDING" ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {driver.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>{driver.rating || "4.9"}</span>
                      <span className="text-muted-foreground font-normal text-[11px] ml-1">
                        ({driver.total_trips || 0} trips)
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {driver.status === "PENDING" ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5"
                            onClick={() => onApproveDriver(driver.id)}
                          >
                            <UserCheck className="mr-1 h-3 w-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10 text-xs h-7 px-2.5"
                            onClick={() => {
                              setSelectedDriver(driver);
                              setIsRejectModalOpen(true);
                            }}
                          >
                            <UserX className="mr-1 h-3 w-3" /> Reject
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setSelectedDriver(driver);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs"
                            onClick={() => handleOpenEdit(driver)}
                          >
                            <Edit className="mr-1 h-3 w-3" /> Edit
                          </Button>

                          {driver.status === "ACTIVE" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setSelectedDriver(driver);
                                setIsSuspendModalOpen(true);
                              }}
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-500/10"
                              onClick={() => onReactivateDriver(driver.id)}
                            >
                              Reactivate
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Driver & Fleet Assignment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Edit Driver Profile & Assignments
            </DialogTitle>
            <DialogDescription>
              Update contact info, driver license number, and assign a dedicated bus and transit route.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Driver Full Name</Label>
              <Input value={selectedDriver?.full_name || ""} disabled className="bg-muted text-xs font-semibold" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Contact Phone *</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required className="text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">License No *</Label>
                <Input value={editLicense} onChange={(e) => setEditLicense(e.target.value)} required className="text-xs font-mono" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Assigned Fleet Bus</Label>
              <Select value={editAssignedBus} onValueChange={setEditAssignedBus}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None (Unassigned) --</SelectItem>
                  {buses.map((b) => (
                    <SelectItem key={b.id} value={b.id} disabled={b.status === "UNDER_MAINTENANCE"}>
                      {b.vehicle_code} — {b.category} {b.status === "UNDER_MAINTENANCE" ? "(Under Maint)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Assigned Route</Label>
              <Select value={editAssignedRoute} onValueChange={setEditAssignedRoute}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None (Unassigned) --</SelectItem>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.code} — {r.name} ({r.shift})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Reject Application Dialog */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" /> Reject Driver Application
            </DialogTitle>
            <DialogDescription>
              Please record the official reason for declining applicant: {selectedDriver?.full_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs">Rejection Reason *</Label>
            <Input
              placeholder="e.g. Expired PSV license / Inadequate driving experience..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject} disabled={submitting}>
              {submitting ? "Processing..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Driver Dialog */}
      <Dialog open={isSuspendModalOpen} onOpenChange={setIsSuspendModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Suspend Driver Account
            </DialogTitle>
            <DialogDescription>
              Suspending this driver will immediately revoke Driver Mobile Console access and unassign them from active routes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs">Reason for Account Suspension *</Label>
            <Input
              placeholder="e.g. Passenger safety violation / License verification pending..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmSuspend} disabled={submitting}>
              {submitting ? "Suspending..." : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
