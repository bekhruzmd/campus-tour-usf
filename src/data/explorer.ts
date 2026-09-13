import osm from "./osm.json";
import {
  USF_BUILDINGS_CATALOG,
  getBuildingProfile,
  type USFBuilding,
} from "./usfBuildings";

const origin = { lat: 28.0587, lon: -82.4139 };

export const project = (lat: number, lon: number) => ({
  x: (lon - origin.lon) * 98230,
  z: (origin.lat - lat) * 110820,
});

export const unproject = (x: number, z: number) => ({
  lon: x / 98230 + origin.lon,
  lat: origin.lat - z / 110820,
});

export const bounds = {
  minX: project(28.0587, -82.438).x,
  maxX: project(28.0587, -82.398).x,
  minZ: project(28.085, -82.4139).z,
  maxZ: project(28.04, -82.4139).z,
};

export const roads = osm.roads.map((r) => ({
  ...r,
  points: r.points.map(([lat, lon]) => project(lat, lon)),
}));

export type ProjectedBuilding = {
  id: number;
  name: string;
  label: string;
  height: number;
  points: { x: number; z: number }[];
  x: number;
  z: number;
  profile: USFBuilding;
};

export const buildings: ProjectedBuilding[] = osm.buildings.map((b) => {
  const points = b.points.map(([lat, lon]) => project(lat, lon));
  const rawName = b.name ? b.name.trim() : "";
  const profile = rawName
    ? getBuildingProfile(rawName)
    : {
        id: `bld_${b.id}`,
        osmName: "",
        code: "",
        name: "",
        shortName: "",
        category: "Academics" as const,
        description: "",
        freshmanTip: "",
        roomsAndServices: [],
      };

  return {
    id: b.id,
    name: rawName,
    label: rawName,
    height: b.height || 8,
    points,
    x: points.reduce((s, p) => s + p.x, 0) / points.length,
    z: points.reduce((s, p) => s + p.z, 0) / points.length,
    profile,
  };
});

export type Place = {
  id: string;
  code: string;
  name: string;
  short: string;
  category: string;
  description: string;
  freshmanTip: string;
  photo: string;
  source: string;
  x: number;
  z: number;
  buildingId?: number;
  roomsAndServices: USFBuilding["roomsAndServices"];
  hours?: string;
  aliases?: string[];
  codeVerified?: boolean;
  requestedRoom?: string;
};

// Generate featured tour stops from USF_BUILDINGS_CATALOG matched with building centroids
export const places: Place[] = USF_BUILDINGS_CATALOG.map((cat) => {
  // Find matching building footprint
  const b = buildings.find((b) => b.name === cat.osmName);

  const fallbackPos = project(28.0587, -82.4139);
  const x = b ? b.x : fallbackPos.x;
  const z = b ? b.z : fallbackPos.z;

  return {
    id: cat.id,
    code: cat.code,
    name: cat.name,
    short: cat.shortName,
    category: cat.category,
    description: cat.description,
    freshmanTip: cat.freshmanTip,
    photo: cat.photo || "",
    source: cat.sourceUrl || "https://www.usf.edu/",
    x,
    z,
    buildingId: b?.id,
    roomsAndServices: cat.roomsAndServices,
    hours: cat.hours,
    aliases: cat.aliases,
    codeVerified: cat.codeVerified,
  };
}).filter((p) => p.buildingId !== undefined);

// Snap car near a primary road
export function spawnNear(p: { x: number; z: number }) {
  let best = Infinity;
  let result = { x: p.x, z: p.z, heading: 0 };

  for (const r of roads) {
    for (let i = 1; i < r.points.length; i++) {
      const a = r.points[i - 1],
        b = r.points[i],
        dx = b.x - a.x,
        dz = b.z - a.z,
        t = Math.max(
          0,
          Math.min(
            1,
            ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1),
          ),
        ),
        x = a.x + t * dx,
        z = a.z + t * dz,
        d = Math.hypot(x - p.x, z - p.z);

      if (d < best) {
        best = d;
        result = { x, z, heading: Math.atan2(dx, -dz) };
      }
    }
  }
  return result;
}

// Convert any building into a Place for the card
export function buildingToPlace(b: ProjectedBuilding): Place {
  return {
    id: b.profile.id,
    code: b.profile.code,
    name: b.profile.name,
    short: b.profile.shortName,
    category: b.profile.category,
    description: b.profile.description,
    freshmanTip: b.profile.freshmanTip,
    photo: b.profile.photo || "",
    source: b.profile.sourceUrl || "https://www.usf.edu/",
    x: b.x,
    z: b.z,
    buildingId: b.id,
    roomsAndServices: b.profile.roomsAndServices,
    hours: b.profile.hours,
    aliases: b.profile.aliases,
    codeVerified: b.profile.codeVerified,
  };
}

// Named footprints without a catalog match remain searchable without made-up codes.
export const searchablePlaces: Place[] = [
  ...places,
  ...buildings
    .filter(
      (b) =>
        b.name &&
        !places.some((p) => p.buildingId === b.id || p.id === b.profile.id),
    )
    .filter(
      (b, i, all) =>
        all.findIndex((other) => other.profile.id === b.profile.id) === i,
    )
    .map(buildingToPlace),
];
