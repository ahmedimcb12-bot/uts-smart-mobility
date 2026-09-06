import { useEffect, useRef, useState } from "react";
import { Bus, MapPin, Play, Pause, RotateCcw, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface StudentMapStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  time: string;
  isStudentStop?: boolean;
  isDestination?: boolean;
}

interface StudentLiveMapProps {
  customStopName?: string;
  customPickupTime?: string;
}

export function StudentLiveMap({
  customStopName = "G-10 Markaz Stop",
  customPickupTime = "07:30 AM",
}: StudentLiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);
  const leafletModuleRef = useRef<any>(null);

  const [isClient, setIsClient] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);
  const [busProgressIndex, setBusProgressIndex] = useState(1);
  const [speed, setSpeed] = useState(38);
  const [etaMinutes, setEtaMinutes] = useState(6);
  const [distanceKm, setDistanceKm] = useState(2.3);

  // Islamabad Route Coordinates (NUST Morning Route 01)
  const routeWaypoints: [number, number][] = [
    [33.68, 73.023], // Start: I-10 / G-10 Border
    [33.6844, 73.0187], // Stop 1: G-10 Markaz Roundabout (Student pickup)
    [33.689, 73.013], // Stop 2: G-10/4 Main Boulevard
    [33.6995, 73.0035], // Stop 3: F-11 Markaz
    [33.711, 72.992], // Stop 4: E-11 Sector Entry
    [33.675, 72.995], // En route Kashmir Hwy
    [33.652, 72.998], // Stop 5: NUST Gate 1
    [33.6425, 72.9905], // Destination: NUST H-12 Campus Main
  ];

  // Route Stops
  const stops: StudentMapStop[] = [
    {
      id: "s1",
      name: customStopName || "G-10 Markaz Roundabout",
      lat: 33.6844,
      lng: 73.0187,
      time: customPickupTime || "07:30 AM",
      isStudentStop: true,
    },
    { id: "s2", name: "G-10/4 Main Boulevard", lat: 33.689, lng: 73.013, time: "07:38 AM" },
    { id: "s3", name: "F-11 Markaz", lat: 33.6995, lng: 73.0035, time: "07:48 AM" },
    { id: "s4", name: "E-11 Sector Entry", lat: 33.711, lng: 72.992, time: "07:58 AM" },
    { id: "s5", name: "NUST Gate 1 (Kashmir Highway)", lat: 33.652, lng: 72.998, time: "08:15 AM" },
    {
      id: "s6",
      name: "NUST H-12 Campus Central Drop",
      lat: 33.6425,
      lng: 72.9905,
      time: "08:25 AM",
      isDestination: true,
    },
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let isSubscribed = true;

    async function initLeaflet() {
      try {
        // Dynamic import to prevent SSR "window is not defined" error
        const L = (await import("leaflet")).default || (await import("leaflet"));
        leafletModuleRef.current = L;

        if (!isSubscribed || !mapContainerRef.current) return;

        // Clean up any stale container references
        if ((mapContainerRef.current as any)._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null;
        }

        // 1. Initialize Map centered on student stop
        const map = L.map(mapContainerRef.current, {
          center: [33.6844, 73.0187],
          zoom: 13,
          zoomControl: false,
        });

        // 2. OpenStreetMap / CartoDB Voyager TileLayer for clean modern UI
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://openstreetmap.org">OSM</a> | UTS Smart Tracking',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        // 3. Draw Route Polyline
        const routeLine = L.polyline(routeWaypoints, {
          color: "#0094DD",
          weight: 6,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        // Subtle casing line
        L.polyline(routeWaypoints, {
          color: "#1C1565",
          weight: 9,
          opacity: 0.25,
        }).addTo(map);

        // 4. Add Custom Markers for Stops
        stops.forEach((st, idx) => {
          let iconHtml = "";
          if (st.isStudentStop) {
            iconHtml = `
              <div class="relative flex items-center justify-center">
                <span class="absolute h-8 w-8 rounded-full bg-emerald-500/40 animate-ping"></span>
                <div class="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-lg ring-2 ring-white">
                  📍
                </div>
              </div>
            `;
          } else if (st.isDestination) {
            iconHtml = `
              <div class="relative flex items-center justify-center">
                <div class="h-8 w-8 rounded-full bg-[#1C1565] text-white flex items-center justify-center font-bold text-xs shadow-lg ring-2 ring-white">
                  🎓
                </div>
              </div>
            `;
          } else {
            iconHtml = `
              <div class="h-6 w-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[10px] shadow ring-1 ring-white">
                ${idx + 1}
              </div>
            `;
          }

          const markerIcon = L.divIcon({
            html: iconHtml,
            className: "custom-stop-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([st.lat, st.lng], { icon: markerIcon }).addTo(map);

          const popupContent = `
            <div style="font-family: inherit; padding: 4px;">
              <div style="font-weight: 700; font-size: 13px; color: #1C1565; margin-bottom: 2px;">
                ${st.isStudentStop ? "⭐ Your Pickup Stop: " : ""}${st.name}
              </div>
              <div style="font-size: 11px; color: #475569;">
                Scheduled Time: <strong>${st.time}</strong>
              </div>
              ${
                st.isStudentStop
                  ? '<div style="margin-top: 4px; font-size: 10px; color: #059669; font-weight: 600;">Assigned Stop for Ahmed Hussain</div>'
                  : ""
              }
            </div>
          `;

          marker.bindPopup(popupContent);
        });

        // 5. Add Live Bus Marker
        const initialBusPos: [number, number] = routeWaypoints[1] || [33.6844, 73.0187];
        const busIconHtml = `
          <div class="relative flex items-center justify-center">
            <span class="absolute h-10 w-10 rounded-full bg-orange-500/40 animate-ping"></span>
            <div class="h-10 w-10 rounded-2xl bg-[#E77A18] text-white flex items-center justify-center shadow-xl ring-2 ring-white transform transition-transform duration-500 font-bold text-base">
              🚌
            </div>
          </div>
        `;

        const busIcon = L.divIcon({
          html: busIconHtml,
          className: "custom-bus-marker",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const busMarker = L.marker(initialBusPos, { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
        busMarker.bindPopup(`
          <div style="padding: 4px;">
            <div style="font-weight: 700; color: #1C1565; font-size: 13px;">Coaster UTS-CST-104</div>
            <div style="font-size: 11px; color: #475569;">Driver: <strong>Muhammad Tariq</strong></div>
            <div style="font-size: 11px; color: #E77A18; font-weight: 600;">Status: On Route • Speed: 38 km/h</div>
          </div>
        `);

        busMarkerRef.current = busMarker;
        mapInstanceRef.current = map;
        setMapLoaded(true);

        map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
      } catch (err) {
        console.warn("Leaflet initialization notice:", err);
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
  }, [isClient, customStopName, customPickupTime]);

  // Live Vehicle Telemetry Simulation
  useEffect(() => {
    if (!isSimulating || !mapInstanceRef.current || !busMarkerRef.current) return;

    const timer = setInterval(() => {
      setBusProgressIndex((prev) => {
        const nextIdx = (prev + 1) % routeWaypoints.length;
        const targetPos = routeWaypoints[nextIdx];

        if (busMarkerRef.current && targetPos) {
          busMarkerRef.current.setLatLng(targetPos);
        }

        const newSpeed = Math.floor(36 + Math.random() * 14);
        setSpeed(newSpeed);

        const remainingStops = Math.max(
          1,
          (1 - nextIdx + routeWaypoints.length) % routeWaypoints.length,
        );
        setEtaMinutes(remainingStops * 3 + 1);
        setDistanceKm(Number((remainingStops * 1.2).toFixed(1)));

        return nextIdx;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [isSimulating]);

  const recenterBus = () => {
    if (mapInstanceRef.current && busMarkerRef.current) {
      mapInstanceRef.current.flyTo(busMarkerRef.current.getLatLng(), 15, { duration: 1.2 });
      busMarkerRef.current.openPopup();
    }
  };

  const recenterMyStop = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([33.6844, 73.0187], 16, { duration: 1.2 });
    }
  };

  const resetView = () => {
    if (mapInstanceRef.current && leafletModuleRef.current) {
      const L = leafletModuleRef.current;
      const bounds = L.latLngBounds(routeWaypoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  return (
    <div className="card-elevated overflow-hidden border border-border shadow-md">
      {/* Live Map Header Bar */}
      <div className="bg-card p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bus className="h-5 w-5 text-[#0094DD]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Scheduled Route Itinerary & Waypoints
              </h3>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span> Route
                Preview
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Route NUST-01 (Islamabad Sectors &rarr; NUST H-12 Campus) • Telemetry Architecture
              Ready
            </p>
          </div>
        </div>

        {/* Route Metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
              Estimated Arrival at {customStopName}
            </span>
            <span className="font-bold text-[#E77A18] text-sm">
              ~{etaMinutes} mins ({distanceKm} km)
            </span>
          </div>
          <div className="text-right pl-3 border-l border-border">
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
              Average Route Speed
            </span>
            <span className="font-mono font-bold text-foreground text-sm">{speed} km/h</span>
          </div>
        </div>
      </div>

      {/* Map Container with SSR safe fallback */}
      <div className="relative w-full h-[400px] sm:h-[460px] bg-muted">
        {!mapLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-10 gap-3">
            <Loader2 className="h-8 w-8 text-[#0094DD] animate-spin" />
            <p className="text-xs font-semibold text-muted-foreground">
              Loading Scheduled Route Waypoints Map...
            </p>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Quick Controls */}
        {mapLoaded && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-background/90 backdrop-blur-md p-1.5 rounded-xl border border-border/80 shadow-md">
            <Button
              size="sm"
              variant="ghost"
              onClick={recenterBus}
              className="h-8 px-2.5 text-xs font-semibold justify-start hover:bg-orange-500/10 hover:text-[#E77A18]"
              title="Center on Vehicle Waypoint"
            >
              <Bus className="mr-1.5 h-3.5 w-3.5 text-[#E77A18]" /> Vehicle Flow
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={recenterMyStop}
              className="h-8 px-2.5 text-xs font-semibold justify-start hover:bg-emerald-500/10 hover:text-emerald-600"
              title="Center on My Stop"
            >
              <MapPin className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> My Stop
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={resetView}
              className="h-8 px-2.5 text-xs justify-start text-muted-foreground hover:text-[#0094DD]"
              title="Show Full Route"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Full Route
            </Button>
          </div>
        )}

        {/* Simulation Switcher Badge */}
        {mapLoaded && (
          <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/80 shadow text-xs flex items-center gap-2">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className="flex items-center gap-1.5 text-[#0094DD] hover:underline font-semibold"
            >
              {isSimulating ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {isSimulating ? "Pause Route Preview" : "Resume Route Preview"}
            </button>
            <span className="text-[10px] text-muted-foreground">
              • OpenStreetMap Leaflet Engine
            </span>
          </div>
        )}
      </div>

      {/* Route Stops Ribbon */}
      <div className="bg-muted/40 p-3.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <Zap className="h-4 w-4 text-[#E77A18]" />
          <span>
            <strong>Next Stop:</strong> {stops[busProgressIndex % stops.length]?.name} (
            {stops[busProgressIndex % stops.length]?.time})
          </span>
        </div>
        <div className="min-w-max ml-4">
          <span>
            Assigned Vehicle:{" "}
            <strong className="text-foreground">UTS-CST-104 (Toyota Coaster AC)</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
