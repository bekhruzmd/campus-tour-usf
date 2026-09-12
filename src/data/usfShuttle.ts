import { project } from "./explorer";

export type ShuttleStop = {
  id: string;
  name: string;
  code: string;
  x: number;
  z: number;
};

export type ShuttleRoute = {
  id: string;
  name: string;
  color: string;
  textColor: string;
  description: string;
  stops: ShuttleStop[];
  waypoints: { x: number; z: number }[];
};

export type ActiveShuttleBus = {
  id: string;
  routeId: string;
  busNumber: string;
  progress: number; // 0 to 1 along waypoints
  speedMps: number;
  nextStopName: string;
  x: number;
  z: number;
  heading: number;
  isLive?: boolean;
  latitude?: number;
  longitude?: number;
  occupancyStatus?: string;
  lastUpdated?: string;
};

export type BullRunnerFeedStatus = {
  isConnected: boolean;
  isLiveFeed: boolean;
  lastPolled: Date | null;
  activeVehiclesCount: number;
  feedLatencyMs: number;
  feedSource: string;
  statusText: string;
};

export const SHUTTLE_STOPS: ShuttleStop[] = [
  { id: "msc_stop", name: "Marshall Student Center Loop", code: "MSC-STOP", ...project(28.0642, -82.4140) },
  { id: "lib_stop", name: "USF Library Transit Hub", code: "LIB-STOP", ...project(28.0598, -82.4132) },
  { id: "beard_stop", name: "Beard Garage & Engineering", code: "ENG-STOP", ...project(28.0585, -82.4168) },
  { id: "collins_stop", name: "Collins Garage & Business", code: "BSN-STOP", ...project(28.0615, -82.4092) },
  { id: "crescent_stop", name: "Crescent Hill & Cooper", code: "CPR-STOP", ...project(28.0628, -82.4158) },
  { id: "yng_stop", name: "Yuengling Center Park-n-Ride", code: "YNG-STOP", ...project(28.0585, -82.4052) },
  { id: "village_stop", name: "The Village (The Hub & Fit)", code: "VIL-STOP", ...project(28.0672, -82.4120) },
  { id: "health_stop", name: "USF Health Clinics & Medicine", code: "MED-STOP", ...project(28.0605, -82.4215) },
];

export const SHUTTLE_ROUTES: ShuttleRoute[] = [
  {
    id: "route_a",
    name: "Route A — Campus Core Circulator",
    color: "#006747", // USF Green
    textColor: "#ffffff",
    description: "Connects Library, Marshall Center, The Village, and Beard Garage every 7-10 minutes.",
    stops: [
      SHUTTLE_STOPS[1], // Library
      SHUTTLE_STOPS[0], // MSC
      SHUTTLE_STOPS[6], // The Village
      SHUTTLE_STOPS[2], // Beard Garage
    ],
    waypoints: [
      project(28.0598, -82.4132),
      project(28.0615, -82.4135),
      project(28.0642, -82.4140),
      project(28.0670, -82.4138),
      project(28.0672, -82.4120),
      project(28.0650, -82.4155),
      project(28.0615, -82.4165),
      project(28.0585, -82.4168),
      project(28.0582, -82.4145),
      project(28.0598, -82.4132),
    ],
  },
  {
    id: "route_b",
    name: "Route B — Commuter Park-n-Ride Express",
    color: "#cfc096", // USF Gold
    textColor: "#123828",
    description: "Direct shuttle from Yuengling Center outer parking lots to Collins Garage, Business, and Library.",
    stops: [
      SHUTTLE_STOPS[5], // Yuengling Outer Lots
      SHUTTLE_STOPS[3], // Collins Garage / Business
      SHUTTLE_STOPS[1], // Library
      SHUTTLE_STOPS[0], // MSC
    ],
    waypoints: [
      project(28.0585, -82.4052),
      project(28.0605, -82.4060),
      project(28.0615, -82.4092),
      project(28.0620, -82.4120),
      project(28.0642, -82.4140),
      project(28.0615, -82.4135),
      project(28.0598, -82.4132),
      project(28.0585, -82.4100),
      project(28.0585, -82.4052),
    ],
  },
  {
    id: "route_c",
    name: "Route C — USF Health & Medical Express",
    color: "#1d70b8", // Blue
    textColor: "#ffffff",
    description: "Serves Morsani College of Medicine, Moffitt Cancer Center, and Nursing.",
    stops: [
      SHUTTLE_STOPS[7], // USF Health
      SHUTTLE_STOPS[2], // Beard Garage
      SHUTTLE_STOPS[1], // Library
    ],
    waypoints: [
      project(28.0605, -82.4215),
      project(28.0585, -82.4210),
      project(28.0585, -82.4168),
      project(28.0598, -82.4132),
      project(28.0610, -82.4170),
      project(28.0605, -82.4215),
    ],
  },
  {
    id: "route_d",
    name: "Route D — Crescent Hill & Athletics",
    color: "#5b2c6f", // USF Purple Route
    textColor: "#ffffff",
    description: "Circulates through Crescent Hill, Athletic District, Rec Center, and Marshall Center.",
    stops: [
      SHUTTLE_STOPS[4], // Crescent Hill
      SHUTTLE_STOPS[0], // MSC
      SHUTTLE_STOPS[5], // Yuengling
    ],
    waypoints: [
      project(28.0628, -82.4158),
      project(28.0642, -82.4140),
      project(28.0620, -82.4100),
      project(28.0585, -82.4052),
      project(28.0585, -82.4120),
      project(28.0628, -82.4158),
    ],
  },
];

// Calculate interpolated position along a route's waypoints
export function getPositionOnRoute(
  waypoints: { x: number; z: number }[],
  progress: number
): { x: number; z: number; heading: number } {
  if (waypoints.length === 0) return { x: 0, z: 0, heading: 0 };
  if (waypoints.length === 1) return { x: waypoints[0].x, z: waypoints[0].z, heading: 0 };

  const segments: { a: { x: number; z: number }; b: { x: number; z: number }; len: number }[] = [];
  let totalLen = 0;

  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1];
    const b = waypoints[i];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    segments.push({ a, b, len });
    totalLen += len;
  }

  let targetDist = (progress % 1) * totalLen;
  if (targetDist < 0) targetDist += totalLen;

  let currentDist = 0;
  for (const seg of segments) {
    if (currentDist + seg.len >= targetDist || seg === segments[segments.length - 1]) {
      const segFraction = seg.len > 0 ? (targetDist - currentDist) / seg.len : 0;
      const x = seg.a.x + (seg.b.x - seg.a.x) * segFraction;
      const z = seg.a.z + (seg.b.z - seg.a.z) * segFraction;
      const heading = Math.atan2(seg.b.x - seg.a.x, -(seg.b.z - seg.a.z));
      return { x, z, heading };
    }
    currentDist += seg.len;
  }

  return { x: waypoints[0].x, z: waypoints[0].z, heading: 0 };
}

export const PASSIO_GTFS_VEHICLE_POSITIONS_URL =
  "https://passio3.com/usf/passioTransit/gtfs/realtime/vehiclePositions.json";

/**
 * Connects directly to the live GTFS-RT feed deployed by CUTR / Passio GO for USF Bull Runner.
 * Endpoint: https://passio3.com/usf/passioTransit/gtfs/realtime/vehiclePositions.json
 */
export async function fetchLiveBullRunnerPositions(): Promise<{
  buses: ActiveShuttleBus[];
  status: BullRunnerFeedStatus;
}> {
  const startTime = Date.now();
  try {
    const res = await fetch(PASSIO_GTFS_VEHICLE_POSITIONS_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const latency = Date.now() - startTime;
    const entities = Array.isArray(data?.entity) ? data.entity : [];

    if (entities.length > 0) {
      const liveBuses: ActiveShuttleBus[] = entities.map((item: any) => {
        const vp = item.vehicle || {};
        const pos = vp.position || {};
        const trip = vp.trip || {};
        const veh = vp.vehicle || {};

        const lat = typeof pos.latitude === "number" ? pos.latitude : 28.0642;
        const lon = typeof pos.longitude === "number" ? pos.longitude : -82.4140;
        const projected = project(lat, lon);

        // Heading in radians (Passio supplies bearing in degrees 0-360)
        const bearingDeg = typeof pos.bearing === "number" ? pos.bearing : 0;
        const headingRad = (bearingDeg * Math.PI) / 180;

        let routeId = "route_a";
        const rawRoute = String(trip.route_id || "").toLowerCase();
        if (rawRoute.includes("b")) routeId = "route_b";
        else if (rawRoute.includes("c")) routeId = "route_c";
        else if (rawRoute.includes("d")) routeId = "route_d";

        return {
          id: String(item.id || veh.id || Math.random()),
          routeId,
          busNumber: veh.label || veh.id || `Bull Runner #${item.id}`,
          progress: 0,
          speedMps: typeof pos.speed === "number" ? pos.speed : 0,
          nextStopName: "Active Route",
          x: projected.x,
          z: projected.z,
          heading: headingRad,
          isLive: true,
          latitude: lat,
          longitude: lon,
          occupancyStatus: vp.occupancy_status || "MANY_SEATS_AVAILABLE",
          lastUpdated: new Date().toLocaleTimeString(),
        };
      });

      return {
        buses: liveBuses,
        status: {
          isConnected: true,
          isLiveFeed: true,
          lastPolled: new Date(),
          activeVehiclesCount: liveBuses.length,
          feedLatencyMs: latency,
          feedSource: "Passio GO AVL (CUTR GTFS-RT Realtime Feed)",
          statusText: `Live Feed Online • ${liveBuses.length} Active Shuttles on Campus`,
        },
      };
    }

    // Off-peak / night / weekend hours (0 buses dispatched right now)
    return {
      buses: [],
      status: {
        isConnected: true,
        isLiveFeed: false,
        lastPolled: new Date(),
        activeVehiclesCount: 0,
        feedLatencyMs: latency,
        feedSource: "Passio GO AVL (CUTR GTFS-RT Realtime Feed)",
        statusText: "Live Feed Online • Off-Peak Schedule Active (Night/Weekend)",
      },
    };
  } catch (err: any) {
    return {
      buses: [],
      status: {
        isConnected: false,
        isLiveFeed: false,
        lastPolled: new Date(),
        activeVehiclesCount: 0,
        feedLatencyMs: Date.now() - startTime,
        feedSource: "Passio GO AVL (Offline)",
        statusText: `Live Feed Sync: Fallback Circulators Active (${err?.message || "Network"})`,
      },
    };
  }
}
