import test from "node:test";
import assert from "node:assert/strict";
import {
  USF_BUILDINGS_CATALOG,
  getBuildingProfile,
} from "../data/usfBuildings.js";
import { places, buildings, buildingToPlace } from "../data/explorer.js";

test("USF Buildings Catalog contains major university landmarks with codes and rooms", () => {
  assert.ok(USF_BUILDINGS_CATALOG.length >= 25, "Catalog should have 25+ iconic landmarks");

  const lib = USF_BUILDINGS_CATALOG.find((b) => b.code === "LIB");
  assert.ok(lib, "Library should exist with code LIB");
  assert.equal(lib?.category, "Academics");
  assert.ok(
    lib?.roomsAndServices.some((r) => r.name.toLowerCase().includes("starbucks")),
    "Library should list Starbucks in rooms"
  );
  assert.ok(
    lib?.roomsAndServices.some((r) => r.name.toLowerCase().includes("writing")),
    "Library should list Writing Center in rooms"
  );

  const msc = USF_BUILDINGS_CATALOG.find((b) => b.code === "MSC");
  assert.ok(msc, "Marshall Center should exist with code MSC");
  assert.equal(msc?.category, "Student Life & Dining");
  assert.ok(
    msc?.roomsAndServices.some((r) => r.name.toLowerCase().includes("food court")),
    "MSC should list Food Court"
  );

  const rec = USF_BUILDINGS_CATALOG.find((b) => b.code === "REC");
  assert.ok(rec, "Campus Rec should exist with code REC");
  assert.equal(rec?.category, "Athletics & Rec");

  const svc = USF_BUILDINGS_CATALOG.find((b) => b.code === "SVC");
  assert.ok(svc, "Student Services should exist with code SVC");
  assert.ok(
    svc?.roomsAndServices.some((r) => r.name.toLowerCase().includes("financial aid")),
    "SVC should list Financial Aid"
  );
});

test("Building profile generator correctly derives codes and categories for any campus footprint", () => {
  const profile = getBuildingProfile("Center for Urban Transportation Research");
  assert.ok(profile.code.length >= 2, "Code should be at least 2 chars");
  assert.ok(profile.name.includes("Transportation"), "Name should match");

  const dormProfile = getBuildingProfile("Holly Housing Building D");
  assert.equal(dormProfile.category, "Housing & Dorms");

  const garageProfile = getBuildingProfile("Collins Boulevard Parking Facility");
  assert.equal(garageProfile.category, "Parking");
});

test("Places array has accurate positions and valid building profiles", () => {
  assert.ok(places.length >= 25, "Places array should have 25+ tour stops");
  for (const p of places) {
    assert.ok(typeof p.x === "number" && !isNaN(p.x), `Place ${p.name} has invalid x`);
    assert.ok(typeof p.z === "number" && !isNaN(p.z), `Place ${p.name} has invalid z`);
    assert.ok(p.code, `Place ${p.name} must have a code`);
  }
});

test("buildingToPlace converts a projected building into a complete Place", () => {
  const b = buildings.find((b) => b.name === "University Library");
  assert.ok(b, "University Library building should exist in projected buildings");
  const place = buildingToPlace(b!);
  assert.equal(place.code, "LIB");
  assert.ok(place.roomsAndServices.length > 0);
});
