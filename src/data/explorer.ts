import osm from "./osm.json";
const origin = { lat: 28.0587, lon: -82.4139 };
export const project = (lat: number, lon: number) => ({
  x: (lon - origin.lon) * 98230,
  z: (origin.lat - lat) * 110820,
});
export const bounds = {
  minX: project(28.069, -82.42585).x,
  maxX: project(28.05465, -82.4056).x,
  minZ: project(28.069, -82.42585).z,
  maxZ: project(28.05465, -82.4056).z,
};
export const roads = osm.roads.map((r) => ({
  ...r,
  points: r.points.map(([lat, lon]) => project(lat, lon)),
}));
export const buildings = osm.buildings.map((b, i) => {
  const points = b.points.map(([lat, lon]) => project(lat, lon));
  return {
    ...b,
    points,
    label: b.name || `Building ${i + 1}`,
    x: points.reduce((s, p) => s + p.x, 0) / points.length,
    z: points.reduce((s, p) => s + p.z, 0) / points.length,
  };
});
export type Place = {
  id: string;
  name: string;
  short: string;
  category: string;
  description: string;
  photo: string;
  source: string;
  x: number;
  z: number;
};
export const places: Place[] = [
  {
    id: "library",
    name: "USF Tampa Library",
    short: "USF Library",
    category: "Study & discover",
    description:
      "Your campus home for quiet study, research, and a little inspiration between classes.",
    lat: 28.05955298,
    lon: -82.41221014,
    photo:
      "https://lib.usf.edu/wp-content/uploads/2025/03/20171020-ucm-library-30-md-1.jpg",
    source: "https://lib.usf.edu/",
  },
  {
    id: "marshall",
    name: "Marshall Student Center",
    short: "Marshall Center",
    category: "The heart of campus",
    description:
      "Meet friends, find a bite to eat, and see what’s happening at the center of student life.",
    lat: 28.06379794,
    lon: -82.41343811,
    photo: "https://www.usf.edu/student-affairs/msc/images/heart-of-campus.jpg",
    source: "https://www.usf.edu/student-affairs/msc/",
  },
  {
    id: "honors",
    name: "Judy Genshaft Honors College",
    short: "Honors College",
    category: "A different perspective",
    description:
      "Step inside the Honors College: open gathering spaces, learning lofts, and room to think together.",
    lat: 28.05962258,
    lon: -82.40936467,
    photo:
      "https://www.usf.edu/honors/images/honorsatrium-gallery-halfwidth-920x600px.jpg",
    source: "https://www.usf.edu/honors/about-us/tampa.aspx",
  },
].map((p) => ({ ...p, ...project(p.lat, p.lon) }));
export function spawnNear(p: { x: number; z: number }) {
  let best = Infinity,
    result = { x: p.x, z: p.z, heading: 0 };
  for (const r of roads.filter((r) =>
    /Collins|Alumni|Holly|Genshaft/.test(r.name),
  ))
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
  return result;
}
