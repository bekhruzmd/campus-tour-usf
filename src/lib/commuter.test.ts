import test from "node:test";
import assert from "node:assert/strict";
import {
  USF_PARKING_FACILITIES,
  loadParkedCar,
  saveParkedCar,
  clearParkedCar,
} from "../data/usfParking";
import { buildings } from "../data/explorer";
import { fetchLiveBullRunnerPositions } from "../data/usfShuttle";
import { fetchTampaCampusWeather } from "../data/usfWeather";
import { departurePlan } from "../data/commuterCalc";
import { validClass, loadClasses, saveClasses } from "./student";

test("parking uses actual footprint positions and contains no occupancy claims", () => {
  assert.equal(USF_PARKING_FACILITIES.length, 4);
  for (const garage of USF_PARKING_FACILITIES) {
    const b = buildings.find((b) => String(b.id) === garage.id)!;
    assert.equal(garage.x, b.x);
    assert.equal(garage.z, b.z);
    assert.equal("occupancyPercent" in garage, false);
    assert.equal(garage.permits.includes("Y"), false);
  }
});
test("departure planning uses entered buffers and handles previous-day departure", () => {
  assert.deepEqual(departurePlan("09:00", 30, 15, 15, 10), {
    time: "07:50",
    previousDay: false,
    total: 70,
  });
  assert.deepEqual(departurePlan("00:20", 30, 15, 15, 10), {
    time: "23:10",
    previousDay: true,
    total: 70,
  });
  assert.equal(departurePlan("09:00", NaN, 1, 1, 1), null);
  assert.equal(departurePlan("25:00", 1, 1, 1, 1), null);
});
test("unavailable or malformed weather never produces fake conditions", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  let weather = await fetchTampaCampusWeather();
  assert.equal(weather.available, false);
  assert.equal(weather.temperatureF, null);
  mock.mock.mockImplementation(
    async () => new Response(JSON.stringify({ current: {} })),
  );
  weather = await fetchTampaCampusWeather();
  assert.equal(weather.available, false);
});
test("shuttle fallback returns no simulated vehicles; missing passenger load remains unknown", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  const failed = await fetchLiveBullRunnerPositions();
  assert.deepEqual(failed.buses, []);
  assert.equal(failed.status.isConnected, false);
  mock.mock.mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          buses: {
            1: [
              {
                latitude: "28.06",
                longitude: "-82.41",
                busId: 1,
                routeId: 999,
              },
            ],
          },
        }),
      ),
  );
  const feed = await fetchLiveBullRunnerPositions();
  assert.equal(feed.buses.length, 1);
  assert.equal(feed.buses[0].occupancyStatus, undefined);
  assert.equal(feed.buses[0].routeId, "999");
  mock.mock.mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          buses: { 1: [{ latitude: "garbage", longitude: 1 }] },
        }),
      ),
  );
  assert.deepEqual((await fetchLiveBullRunnerPositions()).buses, []);
});
test("saved state validates corrupt input and preserves the selected garage and class", () => {
  const store = new Map<string, string>();
  const old = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) || null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    },
  });
  try {
    const garage = USF_PARKING_FACILITIES[2];
    const saved = {
      garageName: garage.shortName,
      floor: "Level 2, west stairs",
      x: garage.x,
      z: garage.z,
      timestamp: new Date().toISOString(),
    };
    assert.equal(saveParkedCar(saved), true);
    assert.deepEqual(loadParkedCar(), saved);
    clearParkedCar();
    assert.equal(loadParkedCar(), null);
    store.set("usf_parked_car_v2", '{"garageName":"wrong","x":"no"}');
    assert.equal(loadParkedCar(), null);
    const item = {
      id: "class1",
      placeId: "lib",
      room: "101",
      day: 1,
      start: "09:00",
      end: "09:50",
      found: false,
    };
    assert.equal(validClass(item), true);
    assert.equal(validClass({ ...item, end: "08:00" }), false);
    saveClasses([item]);
    assert.deepEqual(loadClasses(), [item]);
    store.set("usf_classes_v1", "{}");
    assert.deepEqual(loadClasses(), []);
  } finally {
    if (old) Object.defineProperty(globalThis, "localStorage", old);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
