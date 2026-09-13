import { project } from "./explorer";
import rawPassioData from "./passioGoData.json";

export type ShuttleStop = {
  id: string;
  name: string;
  code: string;
  x: number;
  z: number;
  latitude: number;
  longitude: number;
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
  speedMph?: number;
  nextStopName: string;
  x: number;
  z: number;
  heading: number;
  isLive?: boolean;
  latitude?: number;
  longitude?: number;
  paxLoad?: number; // 0-100% load from Passio GO
  occupancyStatus?: string;
  lastUpdated?: string;
  routeColor?: string;
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

// Build official Passio GO Stop lookup table
const stopMap = new Map<string, ShuttleStop>();
for (const s of rawPassioData.stops) {
  const projected = project(s.lat, s.lng);
  const stopObj: ShuttleStop = {
    id: s.id,
    name: s.name,
    code: `ST-${s.id}`,
    x: projected.x,
    z: projected.z,
    latitude: s.lat,
    longitude: s.lng,
  };
  stopMap.set(s.id, stopObj);
}

// All official Passio GO stops
export const SHUTTLE_STOPS: ShuttleStop[] = Array.from(stopMap.values());

// Helper for contrast text color
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#102a23" : "#ffffff";
}

// Convert Passio GO routes with real waypoints & real stops
export const SHUTTLE_ROUTES: ShuttleRoute[] = rawPassioData.routes
  .filter((r) => r.id !== "74822" && r.points.length > 0) // Filter out redundant detour route
  .map((r) => {
    // Map waypoint lat/lng into 2D canvas coordinates
    const waypoints = r.points.map((pt) => project(pt.lat, pt.lng));

    // Map stop IDs into actual ShuttleStop objects
    const stops: ShuttleStop[] = [];
    for (const sid of r.stopIds) {
      const found = stopMap.get(sid);
      if (found && !stops.some((existing) => existing.id === found.id)) {
        stops.push(found);
      }
    }

    return {
      id: r.id,
      name: `Bull Runner ${r.name}`,
      color: r.color,
      textColor: getContrastColor(r.color),
      description: `Official USF Passio GO Route (${stops.length} campus stops, ${waypoints.length} GPS checkpoints)`,
      stops,
      waypoints,
    };
  });

// Interpolate position along waypoint polylines
export function getPositionOnRoute(
  waypoints: { x: number; z: number }[],
  progress: number,
): { x: number; z: number; heading: number } {
  if (waypoints.length === 0) return { x: 0, z: 0, heading: 0 };
  if (waypoints.length === 1)
    return { x: waypoints[0].x, z: waypoints[0].z, heading: 0 };

  const segments: {
    a: { x: number; z: number };
    b: { x: number; z: number };
    len: number;
  }[] = [];
  let totalLen = 0;

  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1];
    const b = waypoints[i];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    segments.push({ a, b, len });
    totalLen += len;
  }

  if (totalLen === 0)
    return { x: waypoints[0].x, z: waypoints[0].z, heading: 0 };

  let targetDist = (progress % 1) * totalLen;
  if (targetDist < 0) targetDist += totalLen;

  let currentDist = 0;
  for (const seg of segments) {
    if (
      currentDist + seg.len >= targetDist ||
      seg === segments[segments.length - 1]
    ) {
      const segFraction =
        seg.len > 0 ? (targetDist - currentDist) / seg.len : 0;
      const x = seg.a.x + (seg.b.x - seg.a.x) * segFraction;
      const z = seg.a.z + (seg.b.z - seg.a.z) * segFraction;
      const heading = Math.atan2(seg.b.x - seg.a.x, -(seg.b.z - seg.a.z));
      return { x, z, heading };
    }
    currentDist += seg.len;
  }

  return { x: waypoints[0].x, z: waypoints[0].z, heading: 0 };
}

/**
 * Official Passio GO API Endpoints
 * Documentation: https://passiogo.readthedocs.io/en/main/
 * Agency System ID: 2343 (Bull Runner at USF)
 */
export const PASSIO_GO_SYSTEM_ID = "2343";
export const PASSIO_GO_BUSES_URL =
  "https://passiogo.com/mapGetData.php?getBuses=2";
export const PASSIO_GTFS_FALLBACK_URL =
  "https://passio3.com/usf/passioTransit/gtfs/realtime/vehiclePositions.json";

/**
 * Connects directly to the live Passio GO API for USF Bull Runner (System #2343).
 * Fetches real-time bus locations, speeds, courses, routes, and passenger loads.
 */
export async function fetchLiveBullRunnerPositions(): Promise<{
  buses: ActiveShuttleBus[];
  status: BullRunnerFeedStatus;
}> {
  const start = Date.now();
  const status = (connected: boolean, count: number): BullRunnerFeedStatus => ({
    isConnected: connected,
    isLiveFeed: connected && count > 0,
    lastPolled: new Date(),
    activeVehiclesCount: count,
    feedLatencyMs: Date.now() - start,
    feedSource: "Passio GO",
    statusText: !connected
      ? "Vehicle locations unavailable"
      : count
        ? `${count} vehicle locations reported`
        : "No vehicle locations reported",
  });
  try {
    const res = await fetch(PASSIO_GO_BUSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ s0: PASSIO_GO_SYSTEM_ID, sA: 1 }),
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error("Feed unavailable");
    const data = await res.json();
    if (!data?.buses || typeof data.buses !== "object")
      throw new Error("Invalid feed");
    const buses: ActiveShuttleBus[] = [];
    for (const [key, list] of Object.entries(data.buses)) {
      if (key === "-1" || !Array.isArray(list)) continue;
      for (const b of list) {
        const lat = parseFloat(b.latitude),
          lon = parseFloat(b.longitude);
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          Math.abs(lat) > 90 ||
          Math.abs(lon) > 180
        )
          continue;
        const route = SHUTTLE_ROUTES.find((r) => r.id === String(b.routeId));
        const occupancy = parseFloat(b.paxLoad100);
        const speed = parseFloat(b.speed);
        buses.push({
          id: String(b.busId || key),
          routeId: String(b.routeId || ""),
          busNumber: String(b.busName || b.busId || "Bull Runner"),
          progress: 0,
          speedMps: Number.isFinite(speed) ? speed * 0.44704 : 0,
          nextStopName: "",
          ...project(lat, lon),
          heading: ((parseFloat(b.calculatedCourse) || 0) * Math.PI) / 180,
          isLive: true,
          latitude: lat,
          longitude: lon,
          paxLoad: Number.isFinite(occupancy) ? occupancy : undefined,
          occupancyStatus: Number.isFinite(occupancy)
            ? `${Math.round(occupancy)}% reported load`
            : undefined,
          lastUpdated: b.created ? String(b.created) : undefined,
          routeColor: route?.color,
        });
      }
    }
    return { buses, status: status(true, buses.length) };
  } catch {
    return { buses: [], status: status(false, 0) };
  }
}
