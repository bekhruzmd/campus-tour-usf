import test from "node:test";
import assert from "node:assert/strict";
import {
  USF_PARKING_FACILITIES,
  getGarageOccupancy,
  matchBestGarage,
} from "../data/usfParking.js";
import {
  SHUTTLE_ROUTES,
  SHUTTLE_STOPS,
  fetchLiveBullRunnerPositions,
} from "../data/usfShuttle.js";
import { CAMPUS_AMENITIES } from "../data/usfAmenities.js";
import { COMMUTER_ORIGINS, calculateDepartureTime } from "../data/commuterCalc.js";
import { places } from "../data/explorer.js";

test("USF Parking Facilities catalog contains all 5 primary commuter options", () => {
  assert.equal(USF_PARKING_FACILITIES.length, 5);

  const beard = USF_PARKING_FACILITIES.find((g) => g.code === "BEARD");
  assert.ok(beard, "Beard Garage should exist");
  assert.ok(beard.bestFor.includes("LIB"), "Beard should serve Library");
  assert.ok(beard.bestFor.includes("ENG"), "Beard should serve Engineering");

  const collins = USF_PARKING_FACILITIES.find((g) => g.code === "COLLINS");
  assert.ok(collins, "Collins Garage should exist");
  assert.ok(collins.bestFor.includes("BSN"), "Collins should serve Business");
});

test("Garage occupancy simulation reflects realistic peak crunch", () => {
  const morningPeak = getGarageOccupancy("beard", 10.5); // 10:30 AM
  assert.ok(
    morningPeak.occupancyPercent >= 85,
    `10:30 AM should be high occupancy, got ${morningPeak.occupancyPercent}%`
  );

  const earlyMorning = getGarageOccupancy("beard", 6.5); // 6:30 AM
  assert.ok(
    earlyMorning.occupancyPercent <= 30,
    `6:30 AM should be low occupancy, got ${earlyMorning.occupancyPercent}%`
  );
});

test("matchBestGarage selects the optimal facility for campus destinations", () => {
  const bsn = places.find((p) => p.code === "BSN");
  assert.ok(bsn, "BSN should exist in places");

  const bsnMatch = matchBestGarage(bsn!);
  assert.equal(
    bsnMatch.recommended.code,
    "COLLINS",
    "Collins Garage should be recommended for Business building"
  );

  const lib = places.find((p) => p.code === "LIB");
  assert.ok(lib, "LIB should exist in places");

  const libMatch = matchBestGarage(lib!);
  assert.equal(
    libMatch.recommended.code,
    "BEARD",
    "Beard Garage should be recommended for Library"
  );
});

test("calculateDepartureTime correctly computes commute buffers and departure times", () => {
  const bsn = places.find((p) => p.code === "BSN")!;
  const result = calculateDepartureTime({
    classTimeStr: "11:00",
    originId: "new_tampa",
    targetPos: bsn,
  });

  assert.ok(result.recommendedDepartureTime, "Should return a departure time string");
  assert.ok(result.driveMinutes > 15, "Drive time should include traffic buffer");
  assert.ok(result.garageSearchMinutes >= 4, "Garage search delay should be calculated");
  assert.ok(result.walkMinutes > 0, "Walking minutes should be positive");
  assert.equal(result.recommendedGarage.code, "COLLINS");
});

test("Bull Runner routes and stops are well-formed", () => {
  assert.ok(SHUTTLE_ROUTES.length >= 3, "At least 3 routes should be defined");
  assert.ok(SHUTTLE_STOPS.length >= 6, "At least 6 stops should be defined");

  for (const route of SHUTTLE_ROUTES) {
    assert.ok(route.waypoints.length >= 4, `Route ${route.name} should have waypoints`);
    assert.ok(route.stops.length >= 2, `Route ${route.name} should have stops`);
  }
});

test("Campus Amenities catalog covers caffeine, outlets, and printing", () => {
  const caffeine = CAMPUS_AMENITIES.filter((a) => a.category === "caffeine");
  const outlets = CAMPUS_AMENITIES.filter((a) => a.category === "outlets");
  const printing = CAMPUS_AMENITIES.filter((a) => a.category === "printing");

  assert.ok(caffeine.length >= 3, "Should have 3+ caffeine hotspots");
  assert.ok(outlets.length >= 3, "Should have 3+ power outlet study desks");
  assert.ok(printing.length >= 2, "Should have 2+ free student printing labs");
});

test("Live Bull Runner feed fetches or returns structured fallback state", async () => {
  const feed = await fetchLiveBullRunnerPositions();
  assert.ok(feed, "Feed result should be defined");
  assert.ok(Array.isArray(feed.buses), "Feed buses must be an array");
  assert.ok(feed.status, "Feed status should be defined");
  assert.ok(feed.status.feedSource.includes("Passio"), "Feed source should identify Passio GO AVL");
  assert.ok(typeof feed.status.feedLatencyMs === "number", "Latency should be numeric");
});
