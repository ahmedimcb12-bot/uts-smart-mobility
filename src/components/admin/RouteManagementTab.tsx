import { useState } from "react";
import {
  Route as RouteIcon,
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  Car,
  Users,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
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
import type { RouteItem, RouteStopItem, BusItem, DriverItem } from "@/lib/admin-operations-store";
import type { StudentTransportRecord } from "@/lib/transport-eligibility";
import { toast } from "sonner";

interface RouteManagementTabProps {
  routes: RouteItem[];
  buses: BusItem[];
  drivers: DriverItem[];
  students: StudentTransportRecord[];
  onAddRoute: (route: Omit<RouteItem, "id" | "created_at">) => Promise<void>;
  onUpdateRoute: (routeId: string, updates: Partial<RouteItem>) => Promise<void>;
  onDeleteRoute: (routeId: string) => Promise<void>;
}

export function RouteManagementTab({
  routes,
  buses,
  drivers,
  students,
  onAddRoute,
  onUpdateRoute,
  onDeleteRoute,
}: RouteManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStopsModalOpen, setIsStopsModalOpen] = useState(false);
  const [isPassengersModalOpen, setIsPassengersModalOpen] = useState(false);

  // Form State for Add / Edit Route
  const [routeName, setRouteName] = useState("");
  const [routeCode, setRouteCode] = useState("");
  const [shift, setShift] = useState<"MORNING" | "AFTERNOON" | "EVENING" | "NIGHT">("MORNING");
  const [assignedBusId, setAssignedBusId] = useState("none");
  const [assignedDriverId, setAssignedDriverId] = useState("none");
  const [isActive, setIsActive] = useState(true);

  // Stops State for Stop Sequencer
  const [editingStops, setEditingStops] = useState<RouteStopItem[]>([]);
  const [newStopName, setNewStopName] = useState("");
  const [newStopTime, setNewStopTime] = useState("07:30 AM");
  const [newStopLandmark, setNewStopLandmark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredRoutes = routes.filter((r) => {
    return (
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.driver_name && r.driver_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleOpenAdd = () => {
    setRouteName("");
    setRouteCode(`R-${Math.floor(10 + Math.random() * 90)}`);
    setShift("MORNING");
    setAssignedBusId("none");
    setAssignedDriverId("none");
    setIsActive(true);
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim() || !routeCode.trim()) {
      toast.error("Please enter route name and code.");
      return;
    }

    setSubmitting(true);
    try {
      const bus = buses.find((b) => b.id === assignedBusId);
      const driver = drivers.find((d) => d.id === assignedDriverId);

      await onAddRoute({
        name: routeName.trim(),
        code: routeCode.trim(),
        shift,
        vehicle_id: assignedBusId === "none" ? null : assignedBusId,
        vehicle_code: bus ? bus.vehicle_code : null,
        driver_id: assignedDriverId === "none" ? null : assignedDriverId,
        driver_name: driver ? driver.full_name : null,
        active: isActive,
        stops_count: 2,
        passengers_count: 0,
        stops: [
          { id: `st-${Date.now()}-1`, name: "Starting Pickup Point", sequence: 1, pickup_time: "07:15 AM" },
          { id: `st-${Date.now()}-2`, name: "Destination Campus Drop", sequence: 2, pickup_time: "08:15 AM" },
        ],
      });

      setIsAddModalOpen(false);
      toast.success(`Route "${routeName}" created successfully!`);
    } catch (err) {
      toast.error("Failed to create route.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (route: RouteItem) => {
    setSelectedRoute(route);
    setRouteName(route.name);
    setRouteCode(route.code);
    setShift(route.shift);
    setAssignedBusId(route.vehicle_id || "none");
    setAssignedDriverId(route.driver_id || "none");
    setIsActive(route.active);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;

    setSubmitting(true);
    try {
      const bus = buses.find((b) => b.id === assignedBusId);
      const driver = drivers.find((d) => d.id === assignedDriverId);

      await onUpdateRoute(selectedRoute.id, {
        name: routeName.trim(),
        code: routeCode.trim(),
        shift,
        vehicle_id: assignedBusId === "none" ? null : assignedBusId,
        vehicle_code: bus ? bus.vehicle_code : null,
        driver_id: assignedDriverId === "none" ? null : assignedDriverId,
        driver_name: driver ? driver.full_name : null,
        active: isActive,
      });

      setIsEditModalOpen(false);
      toast.success("Route details updated successfully.");
    } catch (err) {
      toast.error("Failed to update route.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Stops Sequencer
  const handleOpenStops = (route: RouteItem) => {
    setSelectedRoute(route);
    setEditingStops(route.stops ? [...route.stops] : []);
    setIsStopsModalOpen(true);
  };

  const handleAddStop = () => {
    if (!newStopName.trim()) {
      toast.error("Please enter a stop name.");
      return;
    }

    const newStop: RouteStopItem = {
      id: `st-${Date.now()}`,
      name: newStopName.trim(),
      sequence: editingStops.length + 1,
      pickup_time: newStopTime,
      ...(newStopLandmark.trim() ? { landmark: newStopLandmark.trim() } : {}),
    };

    setEditingStops((prev) => [...prev, newStop]);
    setNewStopName("");
    setNewStopLandmark("");
    toast.success("Stop waypoint added to sequence.");
  };

  const handleMoveStop = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === editingStops.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...editingStops];
    const moved = reordered[index];
    if (!moved) return;

    reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Re-index sequences
    const updated = reordered.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setEditingStops(updated);
  };

  const handleRemoveStop = (stopId: string) => {
    const remaining = editingStops.filter((s) => s.id !== stopId);
    const updated = remaining.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setEditingStops(updated);
  };

  const handleSaveStopsSequence = async () => {
    if (!selectedRoute) return;
    setSubmitting(true);
    try {
      await onUpdateRoute(selectedRoute.id, {
        stops: editingStops,
        stops_count: editingStops.length,
      });

      setIsStopsModalOpen(false);
      toast.success("Stop sequencing updated & synchronized with Driver Itinerary.");
    } catch (err) {
      toast.error("Failed to save stop sequence.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPassengers = (route: RouteItem) => {
    setSelectedRoute(route);
    setIsPassengersModalOpen(true);
  };

  const routePassengers = selectedRoute
    ? students.filter((s) => s.assigned_route_id === selectedRoute.id || s.assigned_route_name === selectedRoute.name)
    : [];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <RouteIcon className="h-5 w-5 text-primary" /> Route Itineraries & Stop Sequencer
            </h2>
            <p className="text-xs text-muted-foreground">
              Define transit lines, configure waypoint ordering and pickup timings, and assign dedicated vehicles.
            </p>
          </div>

          <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground text-xs h-9">
            <Plus className="mr-1.5 h-4 w-4" /> Create New Route
          </Button>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search route by name, code, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Routes Grid / Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoutes.map((route) => (
          <div key={route.id} className="card-elevated p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs uppercase">
                  {route.code}
                </Badge>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {route.shift}
                  </Badge>
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      route.active ? "bg-emerald-500" : "bg-muted-foreground"
                    }`}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground line-clamp-1">{route.name}</h3>
                <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Car className="h-3.5 w-3.5 text-primary" />
                    <span>Bus: <strong>{route.vehicle_code || "Unassigned"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Driver: <strong>{route.driver_name || "Unassigned"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    <span>{route.stops_count || route.stops?.length || 0} Waypoints / Stops</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => handleOpenStops(route)}>
                  <MapPin className="mr-1 h-3 w-3 text-primary" /> Stops ({route.stops?.length || 0})
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => handleOpenPassengers(route)}>
                  <Users className="mr-1 h-3 w-3" /> Passengers
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs text-primary" onClick={() => handleOpenEdit(route)}>
                  <Edit className="mr-1 h-3 w-3" /> Edit Details
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setSelectedRoute(route);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stop Sequencer Dialog */}
      <Dialog open={isStopsModalOpen} onOpenChange={setIsStopsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Stop Sequencer: {selectedRoute?.name}
            </DialogTitle>
            <DialogDescription>
              Define the ordered sequence of pickup waypoints and scheduled times for the driver console.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Add Stop Inline Form */}
            <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-2">
              <span className="text-xs font-bold text-foreground">Add Waypoint Stop</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Stop Name (e.g. G-10 Markaz)"
                  value={newStopName}
                  onChange={(e) => setNewStopName(e.target.value)}
                  className="sm:col-span-2 text-xs"
                />
                <Input
                  placeholder="Time (07:30 AM)"
                  value={newStopTime}
                  onChange={(e) => setNewStopTime(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Landmark (e.g. Opposite PSO Petrol Station)"
                  value={newStopLandmark}
                  onChange={(e) => setNewStopLandmark(e.target.value)}
                  className="text-xs flex-1"
                />
                <Button size="sm" onClick={handleAddStop} className="text-xs">
                  <Plus className="mr-1 h-3 w-3" /> Add Stop
                </Button>
              </div>
            </div>

            {/* Stops Ordered List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Waypoints Sequence ({editingStops.length} Stops)
              </span>

              {editingStops.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No stops defined yet.</p>
              ) : (
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {editingStops.map((stop, idx) => (
                    <div key={stop.id} className="p-3 flex items-center justify-between bg-card hover:bg-muted/20 gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {stop.sequence}
                        </span>
                        <div>
                          <p className="font-semibold text-xs text-foreground">{stop.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 font-mono text-primary">
                              <Clock className="h-3 w-3" /> {stop.pickup_time || "07:30 AM"}
                            </span>
                            {stop.landmark && <span>• {stop.landmark}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          disabled={idx === 0}
                          onClick={() => handleMoveStop(idx, "up")}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          disabled={idx === editingStops.length - 1}
                          onClick={() => handleMoveStop(idx, "down")}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => handleRemoveStop(stop.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStopsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStopsSequence} disabled={submitting} className="bg-primary text-primary-foreground">
              {submitting ? "Saving..." : "Save Waypoints Sequence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrolled Passengers Modal */}
      <Dialog open={isPassengersModalOpen} onOpenChange={setIsPassengersModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Passengers Assigned: {selectedRoute?.name}
            </DialogTitle>
            <DialogDescription>
              Enrolled students and passenger roster assigned to this route.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-96 overflow-y-auto">
            {routePassengers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No students currently assigned to this route.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {routePassengers.map((student) => (
                  <div key={student.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-foreground block">{student.full_name}</strong>
                      <span className="text-muted-foreground">
                        Stop: {student.pickup_stop_name || "Central Stop"} • Roll: {student.roll_no || "NUST"}
                      </span>
                    </div>
                    <Badge
                      className={
                        student.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-600 text-[10px]"
                          : "bg-destructive/15 text-destructive text-[10px]"
                      }
                    >
                      {student.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPassengersModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Route Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5 text-primary" />
              {isAddModalOpen ? "Create New Route Itinerary" : `Edit Route: ${selectedRoute?.name}`}
            </DialogTitle>
            <DialogDescription>
              Configure route name, code, operating shift, and assigned fleet assets.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Route Name *</Label>
              <Input
                placeholder="e.g. NUST Morning Route 01 (Islamabad West)"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Route Code *</Label>
                <Input
                  placeholder="e.g. NUST-01"
                  value={routeCode}
                  onChange={(e) => setRouteCode(e.target.value)}
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Operating Shift</Label>
                <Select value={shift} onValueChange={(val: any) => setShift(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING">Morning (07:00 – 09:00)</SelectItem>
                    <SelectItem value="AFTERNOON">Afternoon (13:00 – 15:00)</SelectItem>
                    <SelectItem value="EVENING">Evening (16:30 – 18:30)</SelectItem>
                    <SelectItem value="NIGHT">Night Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Assigned Bus</Label>
                <Select value={assignedBusId} onValueChange={setAssignedBusId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- None (Unassigned) --</SelectItem>
                    {buses.map((b) => (
                      <SelectItem key={b.id} value={b.id} disabled={b.status === "UNDER_MAINTENANCE"}>
                        {b.vehicle_code} ({b.capacity} seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Saving..." : isAddModalOpen ? "Create Route" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Route Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Delete Route
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete route <strong>{selectedRoute?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={async () => {
              if (selectedRoute) {
                await onDeleteRoute(selectedRoute.id);
                setIsDeleteModalOpen(false);
                toast.success("Route removed from registry.");
              }
            }}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
