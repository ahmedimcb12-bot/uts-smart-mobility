import { useState, useEffect } from "react";
import {
  Radio,
  MapPin,
  Car,
  Users,
  Route as RouteIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Compass,
  Zap,
  ShieldAlert,
  Flame,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BusItem, RouteItem } from "@/lib/admin-operations-store";

interface LiveTrackingTabProps {
  buses: BusItem[];
  routes: RouteItem[];
}

export function LiveTrackingTab({ buses, routes }: LiveTrackingTabProps) {
  const [selectedBusId, setSelectedBusId] = useState<string>("v1");
  const [isSimulating, setIsSimulating] = useState(true);
  const [speed, setSpeed] = useState(42);

  const activeBuses = buses.filter((b) => b.status === "ACTIVE");
  const selectedBus = buses.find((b) => b.id === selectedBusId) || activeBuses[0] || buses[0];
  const selectedRoute = routes.find((r) => r.id === selectedBus?.assigned_route_id) || routes[0];

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSpeed(Math.floor(35 + Math.random() * 15));
    }, 4000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="space-y-6">
      {/* Top Console Header */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Radio className="h-5 w-5 text-emerald-500" /> Live Fleet GPS Tracking & Telematics
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time monitoring of vehicle coordinates, speed telemetry, waypoint progress, delays, and emergency beacons.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-600 font-mono text-xs">
              {activeBuses.length} Telematics Nodes Active
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Active Vehicles Selector (1 col) */}
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground">Fleet Telematics Units</h3>
            <span className="text-[11px] text-muted-foreground font-mono">10s Polling</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {buses.map((bus) => {
              const isSelected = bus.id === selectedBus?.id;
              return (
                <button
                  key={bus.id}
                  onClick={() => setSelectedBusId(bus.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-mono text-foreground flex items-center gap-1.5">
                      <Car className="h-4 w-4 text-primary" /> {bus.vehicle_code}
                    </strong>
                    <Badge
                      className={
                        bus.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-600 text-[10px]"
                          : bus.status === "UNDER_MAINTENANCE"
                            ? "bg-amber-500/15 text-amber-600 text-[10px]"
                            : "bg-muted text-muted-foreground text-[10px]"
                      }
                    >
                      {bus.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    Route: <strong className="text-foreground">{bus.assigned_route_name || "Standby"}</strong>
                  </p>
                  <p className="text-[11px] text-muted-foreground">Driver: {bus.assigned_driver_name || "Unassigned"}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Map & Telemetry Dashboard (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Telemetry Gauge Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-elevated p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Speed</span>
              <p className="text-2xl font-black text-foreground font-mono">{selectedBus?.status === "ACTIVE" ? `${speed} km/h` : "0 km/h"}</p>
              <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Normal Speed Band
              </span>
            </div>

            <div className="card-elevated p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Schedule Variance</span>
              <p className="text-2xl font-black text-emerald-600 font-mono">+1 min</p>
              <span className="text-[10px] text-muted-foreground">On Schedule</span>
            </div>

            <div className="card-elevated p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Route Progress</span>
              <p className="text-2xl font-black text-primary font-mono">68%</p>
              <span className="text-[10px] text-muted-foreground">4 of 6 Stops Completed</span>
            </div>

            <div className="card-elevated p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Beacon Status</span>
              <p className="text-2xl font-black text-emerald-600 font-mono">ONLINE</p>
              <span className="text-[10px] text-muted-foreground">GPS 4G Telemetry</span>
            </div>
          </div>

          {/* Interactive Live Map Visualizer Frame */}
          <div className="card-elevated p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" /> Live Route Tracking: {selectedRoute?.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Vehicle: <strong>{selectedBus?.vehicle_code}</strong> • Driver: <strong>{selectedBus?.assigned_driver_name}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary font-mono text-xs">Sector H-12 Transit Corridor</Badge>
              </div>
            </div>

            {/* Visual Simulated Route Waypoint Itinerary */}
            <div className="rounded-2xl border border-border bg-muted/40 p-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Live Waypoint Transit Sequence
              </span>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {selectedRoute?.stops?.map((stop, idx) => {
                  const isPassed = idx < 3;
                  const isCurrent = idx === 3;

                  return (
                    <div key={stop.id} className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                            isPassed
                              ? "bg-emerald-500 text-white"
                              : isCurrent
                                ? "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse"
                                : "bg-card border border-border text-muted-foreground"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <strong className={`text-xs block ${isCurrent ? "text-primary font-bold" : "text-foreground"}`}>
                            {stop.name} {isCurrent && "📍 (Current Approach)"}
                          </strong>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            Scheduled: {stop.pickup_time || "07:30 AM"}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant={isPassed ? "secondary" : isCurrent ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {isPassed ? "PASSED" : isCurrent ? "IN TRANSIT" : "UPCOMING"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
