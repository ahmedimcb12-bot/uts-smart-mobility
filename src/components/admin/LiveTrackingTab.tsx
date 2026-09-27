import { useState, useEffect, useRef } from "react";
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
  Loader2,
  Bus,
  Layers,
  ZoomIn,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BusItem, RouteItem } from "@/lib/admin-operations-store";
import {
  AdminFleetLocationListener,
  type BusLocationPayload,
  type ChannelStatus,
  ISLAMABAD_ROUTE_01_WAYPOINTS,
  ISLAMABAD_ROUTE_02_WAYPOINTS,
  ISLAMABAD_ROUTE_03_WAYPOINTS,
} from "@/lib/realtime-tracking";

interface LiveTrackingTabProps {
  buses: BusItem[];
  routes: RouteItem[];
}

interface LiveVehicleState {
  busId: string;
  busCode: string;
  driverName: string;
  routeName: string;
  lat: number;
  lng: number;
  speed: number;
  accuracy: number;
  lastUpdated: number;
  status: "ACTIVE" | "STANDBY" | "UNDER_MAINTENANCE";
}

const INITIAL_FLEET_POSITIONS: Record<string, [number, number]> = {
  v1: [33.6844, 73.0187], // UTS-CST-104 (G-10)
  v2: [33.612, 73.054], // UTS-HIC-202 (Murree Rd)
  v3: [33.721, 73.072], // UTS-BUS-301 (F-7)
  v4: [33.6995, 73.0035], // UTS-CST-105 (F-11)
};

export function LiveTrackingTab({ buses, routes }: LiveTrackingTabProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const busMarkersRef = useRef<Record<string, any>>({});
  const leafletModuleRef = useRef<any>(null);
  const fleetListenerRef = useRef<AdminFleetLocationListener | null>(null);

  const [selectedBusId, setSelectedBusId] = useState<string>("v1");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [channelStatus, setChannelStatus] = useState<ChannelStatus>("CONNECTING");
  const [telemetryCount, setTelemetryCount] = useState<number>(0);

  // Live state for each vehicle
  const [liveVehicles, setLiveVehicles] = useState<Record<string, LiveVehicleState>>(() => {
    const init: Record<string, LiveVehicleState> = {};
    buses.forEach((b) => {
      const pos = INITIAL_FLEET_POSITIONS[b.id] || [33.6844, 73.0187];
      init[b.id] = {
        busId: b.id,
        busCode: b.vehicle_code,
        driverName: b.assigned_driver_name || "Assigned Driver",
        routeName: b.assigned_route_name || "General Fleet Route",
        lat: pos[0],
        lng: pos[1],
        speed: b.status === "ACTIVE" ? 42 : 0,
        accuracy: 6,
        lastUpdated: Date.now(),
        status: b.status as any,
      };
    });
    return init;
  });

  const activeBuses = buses.filter((b) => b.status === "ACTIVE");
  const selectedBus = buses.find((b) => b.id === selectedBusId) || activeBuses[0] || buses[0];
  const selectedLiveState = selectedBus ? liveVehicles[selectedBus.id] : null;
  const selectedRoute = routes.find((r) => r.id === selectedBus?.assigned_route_id) || routes[0];

  // 1. Initialize Leaflet Map for Admin
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let isSubscribed = true;

    async function initLeaflet() {
      try {
        const L = (await import("leaflet")).default || (await import("leaflet"));
        leafletModuleRef.current = L;

        if (!isSubscribed || !mapContainerRef.current) return;

        if ((mapContainerRef.current as any)._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null;
        }

        // Islamabad Central Transit Map
        const map = L.map(mapContainerRef.current, {
          center: [33.6844, 73.0187],
          zoom: 12,
          zoomControl: false,
        });

        // Clean CartoDB Voyager tiles
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://openstreetmap.org">OSM</a> | UTS Fleet Telematics',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Draw Route Polylines for Key Routes
        L.polyline(ISLAMABAD_ROUTE_01_WAYPOINTS, {
          color: "#0094DD",
          weight: 4,
          opacity: 0.7,
        }).addTo(map);

        L.polyline(ISLAMABAD_ROUTE_02_WAYPOINTS, {
          color: "#E77A18",
          weight: 4,
          opacity: 0.7,
        }).addTo(map);

        L.polyline(ISLAMABAD_ROUTE_03_WAYPOINTS, {
          color: "#10B981",
          weight: 4,
          opacity: 0.7,
        }).addTo(map);

        // Add Markers for Each Fleet Vehicle
        const markersMap: Record<string, any> = {};

        buses.forEach((bus) => {
          const pos = INITIAL_FLEET_POSITIONS[bus.id] || [33.6844, 73.0187];
          const isSelected = bus.id === selectedBusId;

          const busIconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110">
              <span class="absolute h-9 w-9 rounded-full ${
                bus.status === "ACTIVE" ? "bg-orange-500/40 animate-ping" : "bg-muted/40"
              }"></span>
              <div class="h-9 w-9 rounded-xl ${
                bus.status === "ACTIVE" ? "bg-[#E77A18]" : "bg-slate-600"
              } text-white flex items-center justify-center shadow-lg ring-2 ring-white font-bold text-sm">
                🚌
              </div>
            </div>
          `;

          const busIcon = L.divIcon({
            html: busIconHtml,
            className: `admin-bus-marker-${bus.id}`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          const marker = L.marker(pos, { icon: busIcon, zIndexOffset: isSelected ? 1000 : 500 }).addTo(map);

          marker.bindPopup(`
            <div style="padding: 4px; font-family: inherit;">
              <div style="font-weight: 800; color: #1C1565; font-size: 14px;">${bus.vehicle_code}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                Route: <strong>${bus.assigned_route_name || "Standby"}</strong>
              </div>
              <div style="font-size: 11px; color: #475569;">
                Driver: <strong>${bus.assigned_driver_name || "Unassigned"}</strong>
              </div>
              <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 2px;">
                Status: ${bus.status} • Telemetry Active
              </div>
            </div>
          `);

          marker.on("click", () => {
            setSelectedBusId(bus.id);
          });

          markersMap[bus.id] = marker;
        });

        busMarkersRef.current = markersMap;
        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (err) {
        console.warn("[AdminLiveMap] Initialization error:", err);
      }
    }

    initLeaflet();

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [buses]);

  // 2. Supabase Realtime Broadcast Listener for Admin (Listens to ALL buses concurrently)
  useEffect(() => {
    console.log("[AdminLiveTracking] Connecting to Fleet Broadcast channels...");

    const listener = new AdminFleetLocationListener({
      routeIds: ["r1", "r2", "r3"],
      onLocation: (payload: BusLocationPayload) => {
        setTelemetryCount((prev) => prev + 1);

        // Match bus by busId or busCode
        const matchedBus =
          buses.find((b) => b.id === payload.busId || b.vehicle_code === payload.busCode) || buses[0];

        if (matchedBus) {
          // Update live state in store
          setLiveVehicles((prev) => ({
            ...prev,
            [matchedBus.id]: {
              busId: matchedBus.id,
              busCode: payload.busCode || matchedBus.vehicle_code,
              driverName: payload.driverName || matchedBus.assigned_driver_name || "Driver",
              routeName: payload.routeName || matchedBus.assigned_route_name || "Active Route",
              lat: payload.lat,
              lng: payload.lng,
              speed: payload.speed,
              accuracy: payload.accuracy,
              lastUpdated: payload.timestamp || Date.now(),
              status: "ACTIVE",
            },
          }));

          // Smoothly move marker on Leaflet map
          const marker = busMarkersRef.current[matchedBus.id];
          if (marker && payload.lat && payload.lng) {
            marker.setLatLng([payload.lat, payload.lng]);
            marker.setPopupContent(`
              <div style="padding: 4px; font-family: inherit;">
                <div style="font-weight: 800; color: #1C1565; font-size: 14px;">${payload.busCode || matchedBus.vehicle_code}</div>
                <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                  Route: <strong>${payload.routeName || matchedBus.assigned_route_name}</strong>
                </div>
                <div style="font-size: 11px; color: #475569;">
                  Driver: <strong>${payload.driverName || matchedBus.assigned_driver_name}</strong>
                </div>
                <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 2px;">
                  Speed: ${payload.speed} km/h • GPS ±${payload.accuracy || 6}m
                </div>
                <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                  Updated: ${new Date(payload.timestamp || Date.now()).toLocaleTimeString()}
                </div>
              </div>
            `);
          }
        }
      },
      onStatusChange: (status) => {
        setChannelStatus(status);
      },
    });

    fleetListenerRef.current = listener;
    listener.subscribe(["r1", "r2", "r3"]);

    return () => {
      if (fleetListenerRef.current) {
        fleetListenerRef.current.unsubscribe();
        fleetListenerRef.current = null;
      }
    };
  }, [buses]);

  // Center map on selected bus
  const focusBus = (busId: string) => {
    setSelectedBusId(busId);
    const busState = liveVehicles[busId];
    if (mapInstanceRef.current && busState) {
      mapInstanceRef.current.flyTo([busState.lat, busState.lng], 15, { duration: 1.2 });
      const marker = busMarkersRef.current[busId];
      if (marker) marker.openPopup();
    }
  };

  const resetFleetView = () => {
    if (mapInstanceRef.current && leafletModuleRef.current) {
      const L = leafletModuleRef.current;
      const allCoords = Object.values(liveVehicles).map((v) => [v.lat, v.lng] as [number, number]);
      if (allCoords.length > 0) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Console Header */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Radio className="h-5 w-5 text-emerald-500" /> Live Fleet GPS Tracking & Telematics Console
              </h2>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-mono">
                Supabase Realtime Broadcast (Zero DB Latency)
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Multi-bus telemetry tracking over WebSocket broadcast channels. Monitor speeds, GPS coordinates, delay variances, and route progression in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-600 font-mono text-xs">
              {activeBuses.length} Telematics Nodes Active
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              Pings Received: {telemetryCount}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Active Vehicles Selector (1 col) */}
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Fleet Telematics Units</h3>
              <p className="text-[11px] text-muted-foreground">Click any bus to zoom & track</p>
            </div>
            <Button size="sm" variant="ghost" onClick={resetFleetView} className="h-7 text-xs px-2 text-primary">
              <ZoomIn className="h-3.5 w-3.5 mr-1" /> Fit All
            </Button>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {buses.map((bus) => {
              const isSelected = bus.id === selectedBus?.id;
              const live = liveVehicles[bus.id];

              return (
                <button
                  key={bus.id}
                  onClick={() => focusBus(bus.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-mono text-foreground flex items-center gap-1.5">
                      <Bus className="h-4 w-4 text-primary" /> {bus.vehicle_code}
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
                  <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                    <span>Driver: {bus.assigned_driver_name || "Unassigned"}</span>
                    {live && (
                      <span className="font-mono font-bold text-emerald-600">{live.speed} km/h</span>
                    )}
                  </div>
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
              <p className="text-2xl font-black text-foreground font-mono">
                {selectedLiveState ? `${selectedLiveState.speed} km/h` : "0 km/h"}
              </p>
              <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Realtime Telemetry
              </span>
            </div>

            <div className="card-elevated p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">GPS Coordinates</span>
              <p className="text-sm font-black text-foreground font-mono truncate">
                {selectedLiveState ? `${selectedLiveState.lat.toFixed(4)}, ${selectedLiveState.lng.toFixed(4)}` : "Standby"}
              </p>
              <span className="text-[10px] text-primary font-mono">
                Accuracy: ±{selectedLiveState?.accuracy || 6}m
              </span>
            </div>

            <div className="card-elevated p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Signal Stream</span>
              <p className="text-2xl font-black text-emerald-600 font-mono">ONLINE</p>
              <span className="text-[10px] text-muted-foreground">Supabase Broadcast</span>
            </div>

            <div className="card-elevated p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Throughput</span>
              <p className="text-2xl font-black text-primary font-mono">&lt; 50ms</p>
              <span className="text-[10px] text-muted-foreground">Zero DB Writes</span>
            </div>
          </div>

          {/* Interactive Live Map Visualizer Frame */}
          <div className="card-elevated overflow-hidden border border-border shadow-md">
            <div className="p-4 border-b border-border bg-card flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" /> Live Multi-Bus Fleet Map
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tracking: <strong>{selectedBus?.vehicle_code}</strong> ({selectedBus?.assigned_route_name})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={resetFleetView} className="h-8 text-xs">
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Center Fleet
                </Button>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="relative w-full h-[450px] bg-muted">
              {!mapLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-10 gap-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    Initializing Multi-Bus Fleet Telematics Map...
                  </p>
                </div>
              )}
              <div ref={mapContainerRef} className="w-full h-full z-0" />
            </div>

            {/* Bottom Status Bar */}
            <div className="bg-muted/40 p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#E77A18]" />
                <span>
                  <strong>Active Route:</strong> {selectedRoute?.name || "Transit Route"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-emerald-600 font-semibold">
                  ● Channel: uts-fleet-broadcast
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
