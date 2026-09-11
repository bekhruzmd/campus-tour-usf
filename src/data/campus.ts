import { toLocal } from "../lib/geo";
export type Road = {
  id: number;
  name: string;
  width: number;
  points: number[][];
};
export type Building = {
  id: number;
  name: string;
  height: number;
  points: number[][];
};
export const landmarks = [
  {
    id: "library",
    name: "USF Library",
    category: "Academic core",
    lat: 28.0593,
    lon: -82.4128,
  },
  {
    id: "marshall",
    name: "Marshall Student Center",
    category: "Student life",
    lat: 28.0635,
    lon: -82.4133,
  },
  {
    id: "engineering",
    name: "Engineering Complex",
    category: "Research & innovation",
    lat: 28.058,
    lon: -82.4155,
  },
  {
    id: "honors",
    name: "Judy Genshaft Honors College",
    category: "Academic core",
    lat: 28.0606,
    lon: -82.4189,
  },
].map((l) => ({ ...l, position: toLocal(l) }));
export function nearestLandmark(x: number, z: number) {
  return landmarks.reduce((a, b) =>
    Math.hypot(a.position.x - x, a.position.z - z) <
    Math.hypot(b.position.x - x, b.position.z - z)
      ? a
      : b,
  );
}
import osm from "./osm.json";
import { insideCampus, segmentDistance } from "../lib/geo";
const project = (pts: number[][]) =>
  pts.map(([lat, lon]) => {
    const p = toLocal({ lat, lon });
    return [p.x, p.z];
  });
export const roads: Road[] = osm.roads.map((r) => ({
  ...r,
  points: project(r.points),
}));
export const buildings: Building[] = osm.buildings.map((b) => ({
  ...b,
  points: project(b.points),
}));
export const primaryRoads = roads.filter((r) =>
  /Collins|Alumni|Holly|Genshaft|Bull Run/.test(r.name),
);
export function roadAt(x: number, z: number) {
  let distance = Infinity,
    name = "Campus grounds";
  for (const road of roads)
    for (let i = 1; i < road.points.length; i++) {
      const d = segmentDistance(x, z, road.points[i - 1], road.points[i]);
      if (d < distance) {
        distance = d;
        name = road.name;
      }
    }
  return { name: distance < 20 ? name : "Campus grounds", distance };
}
export function spawnFor(id: string) {
  const target = landmarks.find((l) => l.id === id) || landmarks[0];
  let best = Infinity,
    result = { x: 0, z: 0, yaw: 0 };
  for (const r of primaryRoads)
    for (let i = 1; i < r.points.length; i++) {
      const a = r.points[i - 1],
        b = r.points[i];
      const dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = Math.max(
        0.05,
        Math.min(
          0.95,
          ((target.position.x - a[0]) * dx + (target.position.z - a[1]) * dz) /
            (dx * dx + dz * dz || 1),
        ),
      );
      const x = a[0] + t * dx,
        z = a[1] + t * dz;
      const d = Math.hypot(x - target.position.x, z - target.position.z);
      if (d < best && insideCampus(x, z, 20)) {
        best = d;
        result = { x, z, yaw: Math.atan2(-dx, -dz) };
      }
    }
  return result;
}
