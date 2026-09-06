import { useState } from "react";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Clock,
  Car,
  Users,
  Route as RouteIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Play,
  Check,
  Send,
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
import type { RouteItem, BusItem, DriverItem } from "@/lib/admin-operations-store";
import {
  checkScheduleConflicts,
  type ScheduleItem,
} from "@/lib/transport-eligibility";
import { toast } from "sonner";

interface ScheduleManagementTabProps {
  schedules: ScheduleItem[];
  routes: RouteItem[];
  buses: BusItem[];
  drivers: DriverItem[];
  onAddSchedule: (schedule: Omit<ScheduleItem, "id" | "created_at">) => Promise<void>;
  onUpdateSchedule: (scheduleId: string, updates: Partial<ScheduleItem>) => Promise<void>;
  onCancelSchedule: (scheduleId: string, reason: string) => Promise<void>;
}

export function ScheduleManagementTab({
  schedules,
  routes,
  buses,
  drivers,
  onAddSchedule,
  onUpdateSchedule,
  onCancelSchedule,
}: ScheduleManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [shiftFilter, setShiftFilter] = useState<string>("ALL");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);

  // Form State
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedBusId, setSelectedBusId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedShift, setSelectedShift] = useState<"MORNING" | "AFTERNOON" | "EVENING" | "NIGHT">("MORNING");
  const [departureTime, setDepartureTime] = useState("07:15");
  const [arrivalTime, setArrivalTime] = useState("08:30");
  const [cancellationReason, setCancellationReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [conflictErrors, setConflictErrors] = useState<string[]>([]);

  // Filter schedules
  const filteredSchedules = schedules.filter((s) => {
    const matchesSearch =
      s.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.bus_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.driver_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchesShift = shiftFilter === "ALL" || s.shift === shiftFilter;
    return matchesSearch && matchesStatus && matchesShift;
  });

  const handleOpenAdd = () => {
    const defaultRoute = routes[0];
    setSelectedRouteId(defaultRoute ? defaultRoute.id : "");
    setSelectedBusId(defaultRoute?.vehicle_id || buses[0]?.id || "");
    setSelectedDriverId(defaultRoute?.driver_id || drivers[0]?.id || "");
    setSelectedShift("MORNING");
    setDepartureTime("07:15");
    setArrivalTime("08:30");
    setConflictErrors([]);
    setIsAddModalOpen(true);
  };

  const handleRouteSelectionChange = (routeId: string) => {
    setSelectedRouteId(routeId);
    const foundRoute = routes.find((r) => r.id === routeId);
    if (foundRoute) {
      if (foundRoute.vehicle_id) setSelectedBusId(foundRoute.vehicle_id);
      if (foundRoute.driver_id) setSelectedDriverId(foundRoute.driver_id);
      if (foundRoute.shift) setSelectedShift(foundRoute.shift as any);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId || !selectedBusId || !selectedDriverId) {
      toast.error("Please select a Route, Bus, and Driver.");
      return;
    }

    const busStatusMap: Record<string, string> = {};
    buses.forEach((b) => {
      busStatusMap[b.id] = b.status;
    });

    // 1. Conflict Detection Validation Check
    const conflictResult = checkScheduleConflicts(
      {
        route_id: selectedRouteId,
        bus_id: selectedBusId,
        driver_id: selectedDriverId,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        shift: selectedShift,
      },
      schedules,
      busStatusMap,
    );

    if (conflictResult.hasConflict) {
      setConflictErrors(conflictResult.conflicts);
      toast.error("Schedule Conflict Detected! Please review warnings.");
      return;
    }

    setSubmitting(true);
    try {
      const route = routes.find((r) => r.id === selectedRouteId);
      const bus = buses.find((b) => b.id === selectedBusId);
      const driver = drivers.find((d) => d.id === selectedDriverId);

      await onAddSchedule({
        route_id: selectedRouteId,
        route_name: route ? route.name : "Scheduled Route",
        bus_id: selectedBusId,
        bus_code: bus ? bus.vehicle_code : "UTS-BUS",
        driver_id: selectedDriverId,
        driver_name: driver ? driver.full_name : "Driver",
        shift: selectedShift,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        days_of_week: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        status: "SCHEDULED",
      });

      setIsAddModalOpen(false);
      toast.success("New operational trip schedule created with conflict-free validation!");
    } catch (err) {
      toast.error("Failed to create schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedSchedule || !cancellationReason.trim()) {
      toast.error("Please specify a cancellation reason.");
      return;
    }

    setSubmitting(true);
    try {
      await onCancelSchedule(selectedSchedule.id, cancellationReason.trim());
      setIsCancelModalOpen(false);
      setCancellationReason("");
      toast.success(
        `Trip cancelled. Automated notification dispatched to all passengers on "${selectedSchedule.route_name}".`,
      );
    } catch (err) {
      toast.error("Failed to cancel trip schedule.");
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
              <Calendar className="h-5 w-5 text-primary" /> Trip Dispatch & Schedule Management
            </h2>
            <p className="text-xs text-muted-foreground">
              Generate daily and recurring operational shifts with real-time bus availability and driver conflict detection.
            </p>
          </div>

          <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground text-xs h-9">
            <Plus className="mr-1.5 h-4 w-4" /> Create Shift Schedule
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schedule by route name, vehicle code, or driver..."
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
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Shifts</SelectItem>
                <SelectItem value="MORNING">Morning Shift</SelectItem>
                <SelectItem value="AFTERNOON">Afternoon Shift</SelectItem>
                <SelectItem value="EVENING">Evening Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Schedules Data Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Route & Shift</th>
                <th className="px-6 py-3.5">Assigned Bus</th>
                <th className="px-6 py-3.5">Assigned Driver</th>
                <th className="px-6 py-3.5">Departure – Arrival</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground text-sm">{schedule.route_name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                        {schedule.shift}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-mono">Mon–Fri</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-primary" /> {schedule.bus_code}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" /> {schedule.driver_name}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-accent" /> {schedule.departure_time} – {schedule.arrival_time}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        schedule.status === "IN_PROGRESS"
                          ? "bg-emerald-500/15 text-emerald-600 animate-pulse"
                          : schedule.status === "COMPLETED"
                            ? "bg-blue-500/15 text-blue-600"
                            : schedule.status === "CANCELLED"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {schedule.status === "IN_PROGRESS" ? (
                        <Play className="h-3 w-3 fill-emerald-600" />
                      ) : schedule.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : schedule.status === "CANCELLED" ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {schedule.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {schedule.status !== "CANCELLED" && schedule.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setIsCancelModalOpen(true);
                          }}
                        >
                          Cancel Shift
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Shift Schedule Dialog with Conflict Validation */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Create Shift Schedule
            </DialogTitle>
            <DialogDescription>
              Assign route, vehicle, driver, and departure timings with conflict detection.
            </DialogDescription>
          </DialogHeader>

          {conflictErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 space-y-1.5 text-xs text-destructive">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Schedule Conflict Detected</span>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {conflictErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSaveSchedule} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Transit Route *</Label>
              <Select value={selectedRouteId} onValueChange={handleRouteSelectionChange}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Route" />
                </SelectTrigger>
                <SelectContent>
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
                <Label className="text-xs">Shift Timing</Label>
                <Select value={selectedShift} onValueChange={(val: any) => setSelectedShift(val)}>
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

              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-1">
                  <Label className="text-xs">Departure</Label>
                  <Input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required className="text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Arrival</Label>
                  <Input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} required className="text-xs font-mono" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Assigned Bus *</Label>
                <Select value={selectedBusId} onValueChange={setSelectedBusId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map((b) => (
                      <SelectItem key={b.id} value={b.id} disabled={b.status === "UNDER_MAINTENANCE"}>
                        {b.vehicle_code} {b.status === "UNDER_MAINTENANCE" ? "(Maint. Lock)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Assigned Driver *</Label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Driver" />
                  </SelectTrigger>
                  <SelectContent>
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
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Checking Conflicts..." : "Confirm & Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Shift & Notify Passengers Dialog */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" /> Cancel Scheduled Shift
            </DialogTitle>
            <DialogDescription>
              Cancelling "{selectedSchedule?.route_name}" will automatically dispatch an emergency cancellation alert to all affected passengers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs">Reason for Shift Cancellation *</Label>
            <Input
              placeholder="e.g. Unforeseen road closure on Islamabad Highway / Vehicle mechanical fault"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Back
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel} disabled={submitting}>
              {submitting ? "Cancelling & Notifying..." : "Confirm Cancellation & Notify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
