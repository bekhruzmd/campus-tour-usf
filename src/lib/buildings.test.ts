import test from "node:test";
import assert from "node:assert/strict";
import { getBuildingProfile } from "../data/usfBuildings";
import { places, buildings, searchablePlaces } from "../data/explorer";
import { searchPlaces, walkingUrl } from "./search";

test("classroom search normalizes spacing, punctuation and case and retains unknown rooms", () => {
  for (const q of ["BSN 2102", "bsn2102", "BSN-2102", "BSN room 2102"]) {
    const results = searchPlaces(q);
    assert.equal(results.length, 1, q);
    assert.equal(results[0].place.code, "BSN");
    assert.equal(results[0].place.requestedRoom, "2102");
  }
  for (const q of ["CPR103", "CPR 103", "cpr-103"])
    assert.equal(searchPlaces(q)[0].place.code, "CPR");
  assert.equal(searchPlaces("NES 323")[0].place.code, "NES");
  assert.equal(searchPlaces("NES 9999")[0].place.requestedRoom, "9999");
  assert.ok(
    searchPlaces("2102").some((r) => r.place.code === "BSN"),
    "searches room floor field",
  );
});
test("common official codes resolve and lecture halls stay academic", () => {
  for (const code of [
    "BSN",
    "CPR",
    "CIS",
    "NES",
    "EDU",
    "SOC",
    "ULH",
    "CHE",
    "ISA",
    "ENG",
    "ENB",
    "ENC",
    "HON",
  ]) {
    assert.equal(searchPlaces(code).length, 1, code);
    assert.equal(searchPlaces(code)[0].place.code, code);
  }
  assert.equal(searchPlaces("ULH")[0].place.category, "Academics");
  assert.equal(
    searchPlaces("GHC")[0].place.code,
    "HON",
    "old app alias still works",
  );
  assert.equal(
    searchPlaces("CHM 2045").length,
    0,
    "course prefix is not a building",
  );
});
test("unknown buildings never receive invented codes, hours, rooms or advice", () => {
  const unknown = getBuildingProfile("Imaginary Lecture Hall");
  assert.equal(unknown.code, "");
  assert.equal(unknown.category, "Other places");
  assert.equal(unknown.hours, undefined);
  assert.deepEqual(unknown.roomsAndServices, []);
  assert.equal(unknown.freshmanTip, "");
  assert.equal(getBuildingProfile("Building 1547").name, "");
});
test("all displayed catalog pins use an exact matching footprint and unique IDs", () => {
  assert.equal(new Set(places.map((p) => p.id)).size, places.length);
  for (const p of places) {
    const b = buildings.find((b) => b.id === p.buildingId);
    assert.ok(b, p.name);
    assert.equal(p.x, b.x);
    assert.equal(p.z, b.z);
  }
  assert.equal(
    new Set(searchablePlaces.map((p) => p.id)).size,
    searchablePlaces.length,
  );
  assert.equal(
    searchPlaces("CIS")[0].place.photo,
    "",
    "no unrelated library photo",
  );
});
test("walking handoff includes correct coordinate direction and optional manual origin", () => {
  const target = searchPlaces("CIS")[0].place;
  const origin = searchPlaces("LIB")[0].place;
  const url = new URL(walkingUrl(target, origin));
  assert.equal(url.searchParams.get("travelmode"), "walking");
  assert.ok(url.searchParams.get("destination")?.startsWith("28."));
  assert.ok(url.searchParams.get("origin")?.includes("-82."));
  assert.equal(new URL(walkingUrl(target)).searchParams.has("origin"), false);
});
