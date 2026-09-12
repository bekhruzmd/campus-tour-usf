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

  if (totalLen === 0) return { x: waypoints[0].x, z: waypoints[0].z, heading: 0 };

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

/**
 * Official Passio GO API Endpoints
 * Documentation: https://passiogo.readthedocs.io/en/main/
 * Agency System ID: 2343 (Bull Runner at USF)
 */
export const PASSIO_GO_SYSTEM_ID = "2343";
export const PASSIO_GO_BUSES_URL = "https://passiogo.com/mapGetData.php?getBuses=2";
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
  const startTime = Date.now();

  // 1. Primary: Direct Passio GO API (POST https://passiogo.com/mapGetData.php?getBuses=2)
  try {
    const res = await fetch(PASSIO_GO_BUSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ s0: PASSIO_GO_SYSTEM_ID, sA: 1 }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const latency = Date.now() - startTime;
      const rawBuses = data?.buses;

      const liveBuses: ActiveShuttleBus[] = [];

      if (rawBuses && typeof rawBuses === "object") {
        for (const [busKey, busList] of Object.entries(rawBuses)) {
          if (busKey === "-1" || !Array.isArray(busList)) continue;

          for (const b of busList as any[]) {
            const lat = parseFloat(b.latitude);
            const lng = parseFloat(b.longitude);
            if (isNaN(lat) || isNaN(lng)) continue;

            const projected = project(lat, lng);
            const courseDeg = parseFloat(b.calculatedCourse) || 0;
            const headingRad = (courseDeg * Math.PI) / 180;
            const speedMph = parseFloat(b.speed) || 0;
            const paxLoad = parseFloat(b.paxLoad100) || 0;

            // Find matching route name
            const matchingRoute = SHUTTLE_ROUTES.find(
              (r) => r.id === String(b.routeId) || r.name.toLowerCase().includes(String(b.route || "").toLowerCase())
            );

            liveBuses.push({
              id: String(b.busId || busKey),
              routeId: matchingRoute ? matchingRoute.id : String(b.routeId || "71754"),
              busNumber: String(b.busName || `Bull Runner #${b.busId}`),
              progress: 0,
              speedMps: speedMph * 0.44704,
              speedMph: Math.round(speedMph),
              nextStopName: b.route ? `${b.route} In-Service` : "Campus Transit Loop",
              x: projected.x,
              z: projected.z,
              heading: headingRad,
              isLive: true,
              latitude: lat,
              longitude: lng,
              paxLoad: Math.min(100, Math.max(0, paxLoad)),
              occupancyStatus:
                paxLoad > 80 ? "FULL" : paxLoad > 50 ? "MODERATE_LOAD" : "SEATS_AVAILABLE",
              lastUpdated: b.created || new Date().toLocaleTimeString(),
              routeColor: b.color || matchingRoute?.color || "#006747",
            });
          }
        }
      }

      if (liveBuses.length > 0) {
        return {
          buses: liveBuses,
          status: {
            isConnected: true,
            isLiveFeed: true,
            lastPolled: new Date(),
            activeVehiclesCount: liveBuses.length,
            feedLatencyMs: latency,
            feedSource: "Passio GO Live API (System #2343 • Bull Runner at USF)",
            statusText: `Passio GO Online • ${liveBuses.length} Active Shuttles on Campus`,
          },
        };
      }

      // Live Passio GO responded, but 0 buses currently out on campus (off-peak/night/weekend)
      return {
        buses: [],
        status: {
          isConnected: true,
          isLiveFeed: false,
          lastPolled: new Date(),
          activeVehiclesCount: 0,
          feedLatencyMs: latency,
          feedSource: "Passio GO Live API (System #2343 • Bull Runner at USF)",
          statusText: "Passio GO Online • Off-Peak Schedule Active (Night/Weekend)",
        },
      };
    }
  } catch (err) {
    // Continue to fallback
  }

  // 2. Secondary Fallback: Passio GTFS-RT feed
  try {
    const res = await fetch(PASSIO_GTFS_FALLBACK_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const latency = Date.now() - startTime;
      const entities = Array.isArray(data?.entity) ? data.entity : [];

      if (entities.length > 0) {
        const liveBuses: ActiveShuttleBus[] = entities.map((item: any) => {
          const vp = item.vehicle || {};
          const pos = vp.position || {};
          const veh = vp.vehicle || {};

          const lat = typeof pos.latitude === "number" ? pos.latitude : 28.0642;
          const lon = typeof pos.longitude === "number" ? pos.longitude : -82.4140;
          const projected = project(lat, lon);

          const bearingDeg = typeof pos.bearing === "number" ? pos.bearing : 0;
          const headingRad = (bearingDeg * Math.PI) / 180;
          const speedMph = Math.round((typeof pos.speed === "number" ? pos.speed : 0) * 2.23694);

          return {
            id: String(item.id || veh.id || Math.random()),
            routeId: SHUTTLE_ROUTES[0].id,
            busNumber: veh.label || veh.id || `Bull Runner #${item.id}`,
            progress: 0,
            speedMps: typeof pos.speed === "number" ? pos.speed : 0,
            speedMph,
            nextStopName: "Active Route",
            x: projected.x,
            z: projected.z,
            heading: headingRad,
            isLive: true,
            latitude: lat,
            longitude: lon,
            paxLoad: 25,
            occupancyStatus: vp.occupancy_status || "SEATS_AVAILABLE",
            lastUpdated: new Date().toLocaleTimeString(),
            routeColor: SHUTTLE_ROUTES[0].color,
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
            feedSource: "Passio GO Telemetry (GTFS-RT Gateway)",
            statusText: `Passio GO Online • ${liveBuses.length} Active Shuttles on Campus`,
          },
        };
      }
    }
  } catch (err: any) {
    // Network error
  }

  return {
    buses: [],
    status: {
      isConnected: false,
      isLiveFeed: false,
      lastPolled: new Date(),
      activeVehiclesCount: 0,
      feedLatencyMs: Date.now() - startTime,
      feedSource: "Passio GO Live API (Offline)",
      statusText: "Passio GO Sync: Fallback Circulators Active",
    },
  };
}
