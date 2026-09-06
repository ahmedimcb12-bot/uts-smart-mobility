import { useState } from "react";
import {
  Car,
  Plus,
  Search,
  Filter,
  Wrench,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Route as RouteIcon,
  ShieldAlert,
  Info,
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
import type { BusItem, DriverItem, RouteItem } from "@/lib/admin-operations-store";
import { toast } from "sonner";

interface BusManagementTabProps {
  buses: BusItem[];
  drivers: DriverItem[];
  routes: RouteItem[];
  onAddBus: (bus: Omit<BusItem, "id" | "created_at">) => Promise<void>;
  onUpdateBus: (busId: string, updates: Partial<BusItem>) => Promise<void>;
  onDeleteBus: (busId: string) => Promise<void>;
  onToggleMaintenance: (busId: string, isMaintenance: boolean) => Promise<void>;
}

export function BusManagementTab({
  buses,
  drivers,
  routes,
  onAddBus,
  onUpdateBus,
  onDeleteBus,
  onToggleMaintenance,
}: BusManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusItem | null>(null);

  // Form State
  const [vehicleCode, setVehicleCode] = useState("");
  const [category, setCategory] = useState("Coaster (29-Seater)");
  const [manufacturer, setManufacturer] = useState("Toyota");
  const [modelYear, setModelYear] = useState("2024");
  const [registrationNo, setRegistrationNo] = useState("");
  const [capacity, setCapacity] = useState(29);
  const [status, setStatus] = useState<"ACTIVE" | "UNDER_MAINTENANCE" | "INACTIVE">("ACTIVE");
  const [assignedDriverId, setAssignedDriverId] = useState("none");
  const [assignedRouteId, setAssignedRouteId] = useState("none");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredBuses = buses.filter((b) => {
    const matchesSearch =
      b.vehicle_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.registration_no && b.registration_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setVehicleCode(`UTS-CST-${Math.floor(100 + Math.random() * 900)}`);
    setCategory("Coaster (29-Seater)");
    setManufacturer("Toyota");
    setModelYear("2024");
    setRegistrationNo("ICT-GA-");
    setCapacity(29);
    setStatus("ACTIVE");
    setAssignedDriverId("none");
    setAssignedRouteId("none");
    setNotes("AC equipped, GPS tracking unit installed");
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleCode.trim()) {
      toast.error("Please enter a vehicle code.");
      return;
    }

    setSubmitting(true);
    try {
      const driver = drivers.find((d) => d.id === assignedDriverId);
      const route = routes.find((r) => r.id === assignedRouteId);

      await onAddBus({
        vehicle_code: vehicleCode.trim(),
        category,
        manufacturer,
        model_year: modelYear,
        registration_no: registrationNo.trim(),
        capacity: Number(capacity) || 29,
        status,
        assigned_driver_id: assignedDriverId === "none" ? null : assignedDriverId,
        assigned_driver_name: driver ? driver.full_name : null,
        assigned_route_id: assignedRouteId === "none" ? null : assignedRouteId,
        assigned_route_name: route ? route.name : null,
        notes,
      });

      setIsAddModalOpen(false);
      toast.success(`Bus ${vehicleCode} added to fleet registry!`);
    } catch (err) {
      toast.error("Failed to add new bus.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (bus: BusItem) => {
    setSelectedBus(bus);
    setVehicleCode(bus.vehicle_code);
    setCategory(bus.category);
    setManufacturer(bus.manufacturer || "Toyota");
    setModelYear(bus.model_year || "2024");
    setRegistrationNo(bus.registration_no || "");
    setCapacity(bus.capacity || 29);
    setStatus(bus.status);
    setAssignedDriverId(bus.assigned_driver_id || "none");
    setAssignedRouteId(bus.assigned_route_id || "none");
    setNotes(bus.notes || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;

    setSubmitting(true);
    try {
      const driver = drivers.find((d) => d.id === assignedDriverId);
      const route = routes.find((r) => r.id === assignedRouteId);

      await onUpdateBus(selectedBus.id, {
        vehicle_code: vehicleCode.trim(),
        category,
        manufacturer,
        model_year: modelYear,
        registration_no: registrationNo.trim(),
        capacity: Number(capacity) || 29,
        status,
        assigned_driver_id: assignedDriverId === "none" ? null : assignedDriverId,
        assigned_driver_name: driver ? driver.full_name : null,
        assigned_route_id: assignedRouteId === "none" ? null : assignedRouteId,
        assigned_route_name: route ? route.name : null,
        notes,
      });

      setIsEditModalOpen(false);
      toast.success(`Vehicle ${vehicleCode} updated successfully.`);
    } catch (err) {
      toast.error("Failed to update vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBus) return;
    setSubmitting(true);
    try {
      await onDeleteBus(selectedBus.id);
      setIsDeleteModalOpen(false);
      toast.success("Vehicle deleted from fleet registry.");
    } catch (err) {
      toast.error("Failed to delete vehicle.");
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
              <Car className="h-5 w-5 text-primary" /> Bus Fleet Management & Allocation
            </h2>
            <p className="text-xs text-muted-foreground">
              Register vehicles, assign dedicated drivers and routes, and track vehicle maintenance status.
            </p>
          </div>

          <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground text-xs h-9">
            <Plus className="mr-1.5 h-4 w-4" /> Add New Vehicle
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bus by code, registration number, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] text-xs">
                <SelectValue placeholder="All Fleet Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Fleet ({buses.length})</SelectItem>
                <SelectItem value="ACTIVE">Active in Service</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                <SelectItem value="INACTIVE">Inactive / Standby</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Buses Data Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Bus Code / Reg</th>
                <th className="px-6 py-3.5">Category & Capacity</th>
                <th className="px-6 py-3.5">Assigned Driver</th>
                <th className="px-6 py-3.5">Assigned Route</th>
                <th className="px-6 py-3.5">Operational Status</th>
                <th className="px-6 py-3.5">Maintenance Lock</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBuses.map((bus) => (
                <tr key={bus.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Car className="h-4 w-4 text-primary" /> {bus.vehicle_code}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {bus.registration_no || "Reg. Pending"} • {bus.manufacturer || "Toyota"} ({bus.model_year || "2024"})
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-medium text-xs text-foreground block">{bus.category}</span>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      {bus.capacity} Passenger Seats
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {bus.assigned_driver_name ? (
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" /> {bus.assigned_driver_name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {bus.assigned_route_name ? (
                      <span className="text-xs font-medium text-foreground block max-w-[180px] truncate">
                        {bus.assigned_route_name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        bus.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : bus.status === "UNDER_MAINTENANCE"
                            ? "bg-amber-500/15 text-amber-600"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {bus.status === "ACTIVE" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : bus.status === "UNDER_MAINTENANCE" ? (
                        <Wrench className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {bus.status === "UNDER_MAINTENANCE" ? "UNDER MAINT." : bus.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`text-xs h-7 px-2.5 ${
                        bus.status === "UNDER_MAINTENANCE"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                      }`}
                      onClick={() => onToggleMaintenance(bus.id, bus.status !== "UNDER_MAINTENANCE")}
                    >
                      <Wrench className="mr-1 h-3 w-3" />
                      {bus.status === "UNDER_MAINTENANCE" ? "Mark Available" : "Send to Maint."}
                    </Button>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => handleOpenEdit(bus)}>
                        <Edit className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedBus(bus);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Bus Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              {isAddModalOpen ? "Register New Fleet Vehicle" : `Edit Vehicle: ${selectedBus?.vehicle_code}`}
            </DialogTitle>
            <DialogDescription>
              Specify registration identifiers, seating capacity, operational status, and assignments.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Vehicle Code *</Label>
                <Input value={vehicleCode} onChange={(e) => setVehicleCode(e.target.value)} required className="text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Registration No *</Label>
                <Input value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} required className="text-xs font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Manufacturer</Label>
                <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} className="text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Model Year</Label>
                <Input value={modelYear} onChange={(e) => setModelYear(e.target.value)} className="text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Capacity (Seats) *</Label>
                <Input type="number" min={4} max={80} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required className="text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Vehicle Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coaster (29-Seater)">Coaster (29-Seater)</SelectItem>
                    <SelectItem value="Hiace Grand Cabin (15-Seater)">Hiace Grand Cabin (15-Seater)</SelectItem>
                    <SelectItem value="Master Transit Bus (50-Seater)">Master Transit Bus (50-Seater)</SelectItem>
                    <SelectItem value="Executive Sedan (4-Seater)">Executive Sedan (4-Seater)</SelectItem>
                    <SelectItem value="Special Purpose Van">Special Purpose Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Operational Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active in Service</SelectItem>
                    <SelectItem value="UNDER_MAINTENANCE">Under Maintenance (Locked)</SelectItem>
                    <SelectItem value="INACTIVE">Inactive / Standby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Assigned Driver</Label>
                <Select value={assignedDriverId} onValueChange={setAssignedDriverId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- None (Unassigned) --</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id} disabled={d.status !== "ACTIVE"}>
                        {d.full_name} ({d.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Assigned Route</Label>
                <Select value={assignedRouteId} onValueChange={setAssignedRouteId}>
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
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Vehicle Notes & Equipment</Label>
              <Input
                placeholder="e.g. AC equipped, First Aid box, Fire extinguisher inspected"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Saving..." : isAddModalOpen ? "Register Vehicle" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Bus Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Delete Vehicle from Registry
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete vehicle <strong>{selectedBus?.vehicle_code}</strong>? This action will remove all route and driver assignments.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={submitting}>
              {submitting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
