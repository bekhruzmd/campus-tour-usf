import { Matrix4, Vector3 } from "three";
export const ORIGIN = {
  lat: 28.0587,
  lon: -82.4139,
  height: Number(import.meta.env?.VITE_ORIGIN_HEIGHT || 0),
};
export const DEG = Math.PI / 180;
export type GeoPoint = { lat: number; lon: number };
// WGS84 Earth-centered Earth-fixed -> east/up/south, measured in metres.
export function ecef(lat: number, lon: number, height = 0): Vector3 {
  const p = lat * DEG,
    l = lon * DEG,
    n = 6378137 / Math.sqrt(1 - 0.00669437999014 * Math.sin(p) ** 2);
  return new Vector3(
    (n + height) * Math.cos(p) * Math.cos(l),
    (n + height) * Math.cos(p) * Math.sin(l),
    (n * (1 - 0.00669437999014) + height) * Math.sin(p),
  );
}
const p = ORIGIN.lat * DEG,
  l = ORIGIN.lon * DEG;
const east = new Vector3(-Math.sin(l), Math.cos(l), 0);
const up = new Vector3(
  Math.cos(p) * Math.cos(l),
  Math.cos(p) * Math.sin(l),
  Math.sin(p),
);
const south = new Vector3(
  Math.sin(p) * Math.cos(l),
  Math.sin(p) * Math.sin(l),
  -Math.cos(p),
);
export const LOCAL_TO_ECEF = new Matrix4()
  .makeBasis(east, up, south)
  .setPosition(ecef(ORIGIN.lat, ORIGIN.lon, ORIGIN.height));
export const ECEF_TO_LOCAL = LOCAL_TO_ECEF.clone().invert();
export function toLocal(point: GeoPoint, height = ORIGIN.height): Vector3 {
  return ecef(point.lat, point.lon, height).applyMatrix4(ECEF_TO_LOCAL);
}
export function toGeo(x: number, z: number): GeoPoint {
  return {
    lat: ORIGIN.lat - z / 110820,
    lon: ORIGIN.lon + x / (111320 * Math.cos(p)),
  };
}
// Approximate campus bounds at the named perimeter roads; no off-campus driving.
export const GEO_BOUNDS = {
  south: 28.05465,
  north: 28.069,
  west: -82.42585,
  east: -82.4056,
};
const nw = toLocal({ lat: GEO_BOUNDS.north, lon: GEO_BOUNDS.west });
const se = toLocal({ lat: GEO_BOUNDS.south, lon: GEO_BOUNDS.east });
export const BOUNDS = { minX: nw.x, maxX: se.x, minZ: nw.z, maxZ: se.z };
export const insideCampus = (x: number, z: number, margin = 0) =>
  x >= BOUNDS.minX + margin &&
  x <= BOUNDS.maxX - margin &&
  z >= BOUNDS.minZ + margin &&
  z <= BOUNDS.maxZ - margin;
export function segmentDistance(
  x: number,
  z: number,
  a: number[],
  b: number[],
) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
  );
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
}
