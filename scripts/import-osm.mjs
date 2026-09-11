import fs from "node:fs";
// Reproducible import of OSM Overpass `out geom` JSON. Source is never Google imagery.
const input = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const inBounds = (p) =>
  p.lat >= 28.05465 &&
  p.lat <= 28.069 &&
  p.lon >= -82.42585 &&
  p.lon <= -82.4056;
const roads = [],
  buildings = [];
for (const e of input.elements) {
  if (!e.geometry?.length || !e.geometry.some(inBounds)) continue;
  const t = e.tags || {};
  const points = e.geometry.map((p) => [p.lat, p.lon]);
  if (
    t.highway &&
    ![
      "footway",
      "path",
      "steps",
      "cycleway",
      "construction",
      "proposed",
    ].includes(t.highway)
  )
    roads.push({
      id: e.id,
      name: t.name || "Campus access road",
      width: Number(t.width) || (t.highway === "service" ? 6 : 11),
      points,
    });
  if (t.building && e.geometry.every(inBounds))
    buildings.push({
      id: e.id,
      name: t.name || "",
      height: parseFloat(t.height) || (Number(t["building:levels"]) || 2) * 3.6,
      points,
    });
}
fs.writeFileSync(
  "src/data/osm.json",
  JSON.stringify({
    source: "© OpenStreetMap contributors, ODbL 1.0",
    retrieved: new Date().toISOString(),
    roads,
    buildings,
  }),
);
console.log({
  roads: roads.length,
  buildings: buildings.length,
  namedRoads: [...new Set(roads.map((r) => r.name))].filter((n) =>
    /Collins|Holly|Alumni|Genshaft|Bull Run/.test(n),
  ),
});
