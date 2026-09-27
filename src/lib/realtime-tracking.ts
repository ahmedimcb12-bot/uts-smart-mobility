/**
 * Real-time Live Bus Tracking & Telemetry via Supabase Realtime Broadcast (v2)
 *
 * Architecture:
 * - Driver Broadcaster: Emits high-accuracy GPS coordinates via Supabase Realtime Broadcast (Zero DB writes)
 * - Student Listener: Listens on specific route channel and updates Leaflet bus marker
 * - Admin Fleet Listener: Listens on fleet-wide broadcast channel to monitor all buses concurrently
 */

import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface BusLocationPayload {
  busId: string;
  busCode: string;
  driverId?: string;
  driverName: string;
  routeId: string;
  routeName: string;
  shiftId: string;
  lat: number;
  lng: number;
  speed: number; // in km/h
  heading: number | null; // heading in degrees (0-360)
  accuracy: number; // in meters
  timestamp: number;
  isSimulated?: boolean;
}

export type GeolocationStatus =
  | "IDLE"
  | "REQUESTING_PERMISSION"
  | "BROADCASTING"
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "ERROR";

export type ChannelStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "SUBSCRIBED"
  | "CHANNEL_ERROR"
  | "TIMED_OUT"
  | "CLOSED";

// Default route simulation waypoints for fallback/demo
export const ISLAMABAD_ROUTE_01_WAYPOINTS: [number, number][] = [
  [33.68, 73.023], // I-10 / G-10 Border
  [33.6844, 73.0187], // Stop 1: G-10 Markaz Roundabout
  [33.689, 73.013], // Stop 2: G-10/4 Main Boulevard
  [33.6995, 73.0035], // Stop 3: F-11 Markaz Shell
  [33.711, 72.992], // Stop 4: E-11 Sector Entry
  [33.675, 72.995], // Kashmir Highway Transit Corridor
  [33.652, 72.998], // Stop 5: NUST Gate 1
  [33.6425, 72.9905], // Destination: NUST H-12 Campus
];

export const ISLAMABAD_ROUTE_02_WAYPOINTS: [number, number][] = [
  [33.598, 73.045], // Rawalpindi Saddar
  [33.612, 73.054], // Murree Road Chandni Chowk
  [33.648, 73.076], // Faizabad Interchange
  [33.684, 73.048], // Zero Point Islamabad
  [33.692, 73.024], // G-9 Sector Stop
  [33.6425, 72.9905], // NUST H-12 Campus
];

export const ISLAMABAD_ROUTE_03_WAYPOINTS: [number, number][] = [
  [33.729, 73.093], // F-6 Super Market
  [33.721, 73.072], // F-7 Jinnah Super
  [33.712, 73.052], // F-8 Markaz
  [33.702, 73.031], // G-9 Karachi Company
  [33.6844, 73.0187], // G-10 Markaz
  [33.6425, 72.9905], // NUST H-12 Campus
];

export const ROUTE_WAYPOINTS_MAP: Record<string, [number, number][]> = {
  r1: ISLAMABAD_ROUTE_01_WAYPOINTS,
  r2: ISLAMABAD_ROUTE_02_WAYPOINTS,
  r3: ISLAMABAD_ROUTE_03_WAYPOINTS,
  "route-1": ISLAMABAD_ROUTE_01_WAYPOINTS,
  "route-2": ISLAMABAD_ROUTE_02_WAYPOINTS,
  "route-3": ISLAMABAD_ROUTE_03_WAYPOINTS,
};

/**
 * 1. DRIVER SIDE BROADCASTER
 * Captures GPS coordinates using navigator.geolocation.watchPosition
 * and broadcasts them over Supabase Realtime channel.
 */
export class DriverGpsBroadcaster {
  private watchId: number | null = null;
  private channel: RealtimeChannel | null = null;
  private fleetChannel: RealtimeChannel | null = null;
  private simulationTimer: any = null;
  private simulationIndex: number = 0;
  private routeId: string;
  private busId: string;
  private busCode: string;
  private driverName: string;
  private routeName: string;
  private shiftId: string;
  private onLocationCallback?: (payload: BusLocationPayload) => void;
  private onErrorCallback?: (err: Error | GeolocationPositionError) => void;
  private onStatusChangeCallback?: (status: GeolocationStatus, channelStatus: ChannelStatus) => void;

  constructor(config: {
    routeId: string;
    busId: string;
    busCode: string;
    driverName: string;
    routeName?: string;
    shiftId?: string;
    onLocation?: (payload: BusLocationPayload) => void;
    onError?: (err: Error | GeolocationPositionError) => void;
    onStatusChange?: (status: GeolocationStatus, channelStatus: ChannelStatus) => void;
  }) {
    this.routeId = config.routeId || "r1";
    this.busId = config.busId || "v1";
    this.busCode = config.busCode || "UTS-CST-104";
    this.driverName = config.driverName || "Muhammad Tariq";
    this.routeName = config.routeName || "NUST Morning Route 01";
    this.shiftId = config.shiftId || "MORNING";
    this.onLocationCallback = config.onLocation;
    this.onErrorCallback = config.onError;
    this.onStatusChangeCallback = config.onStatusChange;
  }

  public async startBroadcasting(options?: { simulate?: boolean }): Promise<void> {
    const channelName = `shift-route-${this.routeId}`;
    const fleetChannelName = "uts-fleet-broadcast";

    // 1. Initialize Supabase Realtime Channels
    this.onStatusChangeCallback?.("REQUESTING_PERMISSION", "CONNECTING");

    try {
      this.channel = supabase.channel(channelName, {
        config: {
          broadcast: { ack: false, self: true },
        },
      });

      this.fleetChannel = supabase.channel(fleetChannelName, {
        config: {
          broadcast: { ack: false, self: true },
        },
      });

      this.channel.subscribe((status) => {
        console.log(`[DriverBroadcaster] Route channel '${channelName}' status:`, status);
        if (status === "SUBSCRIBED") {
          this.onStatusChangeCallback?.("BROADCASTING", "SUBSCRIBED");
        } else if (status === "CHANNEL_ERROR") {
          this.onStatusChangeCallback?.("ERROR", "CHANNEL_ERROR");
        } else if (status === "TIMED_OUT") {
          this.onStatusChangeCallback?.("TIMEOUT", "TIMED_OUT");
        } else if (status === "CLOSED") {
          this.onStatusChangeCallback?.("IDLE", "CLOSED");
        }
      });

      this.fleetChannel.subscribe((status) => {
        console.log(`[DriverBroadcaster] Fleet channel status:`, status);
      });
    } catch (err) {
      console.error("[DriverBroadcaster] Channel connection error:", err);
      this.onStatusChangeCallback?.("ERROR", "CHANNEL_ERROR");
    }

    // 2. Simulation Mode (Fallback when testing in browser without GPS hardware)
    if (options?.simulate) {
      this.startSimulation();
      return;
    }

    // 3. Physical Geolocation Watcher
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.warn("[DriverBroadcaster] Geolocation API not supported, falling back to simulated telemetry.");
      this.startSimulation();
      return;
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const speedKmh = position.coords.speed !== null ? Math.round(position.coords.speed * 3.6) : 38;
        const payload: BusLocationPayload = {
          busId: this.busId,
          busCode: this.busCode,
          driverName: this.driverName,
          routeId: this.routeId,
          routeName: this.routeName,
          shiftId: this.shiftId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: speedKmh,
          heading: position.coords.heading || null,
          accuracy: Math.round(position.coords.accuracy),
          timestamp: position.timestamp || Date.now(),
          isSimulated: false,
        };

        this.broadcastPayload(payload);
      },
      (error) => {
        console.warn("[DriverBroadcaster] Geolocation error:", error.code, error.message);
        let geoStatus: GeolocationStatus = "ERROR";
        if (error.code === error.PERMISSION_DENIED) {
          geoStatus = "PERMISSION_DENIED";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          geoStatus = "POSITION_UNAVAILABLE";
        } else if (error.code === error.TIMEOUT) {
          geoStatus = "TIMEOUT";
        }
        this.onStatusChangeCallback?.(geoStatus, "SUBSCRIBED");
        this.onErrorCallback?.(error);

        // If permission denied or position unavailable on laptop/desktop, auto-fallback to simulation
        if (error.code === error.PERMISSION_DENIED || error.code === error.POSITION_UNAVAILABLE) {
          console.info("[DriverBroadcaster] Switching to high-fidelity route waypoint simulation.");
          this.startSimulation();
        }
      },
      geoOptions,
    );
  }

  private broadcastPayload(payload: BusLocationPayload) {
    // 1. Emit to route-specific channel for student app
    if (this.channel) {
      this.channel.send({
        type: "broadcast",
        event: "location",
        payload,
      });
    }

    // 2. Emit to fleet-wide channel for admin console
    if (this.fleetChannel) {
      this.fleetChannel.send({
        type: "broadcast",
        event: "location",
        payload,
      });
    }

    // 3. Trigger local callback
    this.onLocationCallback?.(payload);
  }

  private startSimulation() {
    if (this.simulationTimer) clearInterval(this.simulationTimer);
    const waypoints = ROUTE_WAYPOINTS_MAP[this.routeId] || ISLAMABAD_ROUTE_01_WAYPOINTS;

    this.simulationTimer = setInterval(() => {
      const coord = waypoints[this.simulationIndex % waypoints.length];
      const randomJitterLat = (Math.random() - 0.5) * 0.0004;
      const randomJitterLng = (Math.random() - 0.5) * 0.0004;

      const payload: BusLocationPayload = {
        busId: this.busId,
        busCode: this.busCode,
        driverName: this.driverName,
        routeId: this.routeId,
        routeName: this.routeName,
        shiftId: this.shiftId,
        lat: coord[0] + randomJitterLat,
        lng: coord[1] + randomJitterLng,
        speed: Math.floor(35 + Math.random() * 15),
        heading: Math.floor(Math.random() * 360),
        accuracy: 8,
        timestamp: Date.now(),
        isSimulated: true,
      };

      this.broadcastPayload(payload);
      this.simulationIndex = (this.simulationIndex + 1) % waypoints.length;
    }, 3500);
  }

  public stopBroadcasting(): void {
    if (this.watchId !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }

    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    if (this.fleetChannel) {
      supabase.removeChannel(this.fleetChannel);
      this.fleetChannel = null;
    }

    this.onStatusChangeCallback?.("IDLE", "DISCONNECTED");
  }
}

/**
 * 2. STUDENT SIDE LISTENER
 * Subscribes to route broadcast channel and listens for 'location' events
 */
export class StudentLocationListener {
  private channel: RealtimeChannel | null = null;
  private routeId: string;
  private onLocationCallback: (payload: BusLocationPayload) => void;
  private onStatusChangeCallback?: (status: ChannelStatus) => void;

  constructor(config: {
    routeId: string;
    onLocation: (payload: BusLocationPayload) => void;
    onStatusChange?: (status: ChannelStatus) => void;
  }) {
    this.routeId = config.routeId || "r1";
    this.onLocationCallback = config.onLocation;
    this.onStatusChangeCallback = config.onStatusChange;
  }

  public subscribe(): void {
    const channelName = `shift-route-${this.routeId}`;
    this.onStatusChangeCallback?.("CONNECTING");

    try {
      this.channel = supabase.channel(channelName);

      this.channel
        .on("broadcast", { event: "location" }, (event) => {
          if (event.payload) {
            this.onLocationCallback(event.payload as BusLocationPayload);
          }
        })
        .subscribe((status) => {
          console.log(`[StudentListener] Subscribed to '${channelName}':`, status);
          if (status === "SUBSCRIBED") {
            this.onStatusChangeCallback?.("SUBSCRIBED");
          } else if (status === "CHANNEL_ERROR") {
            this.onStatusChangeCallback?.("CHANNEL_ERROR");
          } else if (status === "TIMED_OUT") {
            this.onStatusChangeCallback?.("TIMED_OUT");
          } else if (status === "CLOSED") {
            this.onStatusChangeCallback?.("CLOSED");
          }
        });
    } catch (err) {
      console.error("[StudentListener] Subscription error:", err);
      this.onStatusChangeCallback?.("CHANNEL_ERROR");
    }
  }

  public unsubscribe(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.onStatusChangeCallback?.("DISCONNECTED");
    }
  }
}

/**
 * 3. ADMIN SIDE MULTI-BUS FLEET LISTENER
 * Subscribes to fleet broadcast to track all buses in real time
 */
export class AdminFleetLocationListener {
  private fleetChannel: RealtimeChannel | null = null;
  private routeChannels: RealtimeChannel[] = [];
  private onLocationCallback: (payload: BusLocationPayload) => void;
  private onStatusChangeCallback?: (status: ChannelStatus) => void;

  constructor(config: {
    onLocation: (payload: BusLocationPayload) => void;
    onStatusChange?: (status: ChannelStatus) => void;
    routeIds?: string[];
  }) {
    this.onLocationCallback = config.onLocation;
    this.onStatusChangeCallback = config.onStatusChange;
  }

  public subscribe(routeIds: string[] = ["r1", "r2", "r3"]): void {
    this.onStatusChangeCallback?.("CONNECTING");

    // 1. Subscribe to the global fleet channel
    try {
      this.fleetChannel = supabase.channel("uts-fleet-broadcast");
      this.fleetChannel
        .on("broadcast", { event: "location" }, (event) => {
          if (event.payload) {
            this.onLocationCallback(event.payload as BusLocationPayload);
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            this.onStatusChangeCallback?.("SUBSCRIBED");
          }
        });

      // 2. Also listen to individual route channels for full redundancy
      routeIds.forEach((rid) => {
        const rc = supabase.channel(`shift-route-${rid}`);
        rc.on("broadcast", { event: "location" }, (event) => {
          if (event.payload) {
            this.onLocationCallback(event.payload as BusLocationPayload);
          }
        }).subscribe();
        this.routeChannels.push(rc);
      });
    } catch (err) {
      console.error("[AdminFleetListener] Subscribe error:", err);
      this.onStatusChangeCallback?.("CHANNEL_ERROR");
    }
  }

  public unsubscribe(): void {
    if (this.fleetChannel) {
      supabase.removeChannel(this.fleetChannel);
      this.fleetChannel = null;
    }
    this.routeChannels.forEach((rc) => supabase.removeChannel(rc));
    this.routeChannels = [];
    this.onStatusChangeCallback?.("DISCONNECTED");
  }
}
