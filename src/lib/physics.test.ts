import { test } from "node:test";
import assert from "node:assert/strict";
import { createPhysics } from "./physics";
import { ecef, ECEF_TO_LOCAL, ORIGIN, toLocal, insideCampus } from "./geo";
import { landmarks, spawnFor, primaryRoads } from "../data/campus";
test("WGS84 campus origin is local zero and east/north axes are correct", () => {
  assert.ok(
    ecef(ORIGIN.lat, ORIGIN.lon, ORIGIN.height)
      .applyMatrix4(ECEF_TO_LOCAL)
      .length() < 1e-6,
  );
  assert.ok(toLocal({ lat: ORIGIN.lat, lon: ORIGIN.lon + 0.001 }).x > 90);
  assert.ok(toLocal({ lat: ORIGIN.lat + 0.001, lon: ORIGIN.lon }).z < -100);
});
test("All landmarks spawn on a primary road inside campus", () => {
  assert.ok(primaryRoads.length > 0);
  for (const l of landmarks) {
    const p = spawnFor(l.id);
    assert.ok(insideCampus(p.x, p.z, 10));
  }
});
test("Raycast vehicle rests on ground, accelerates forward, brakes and reverses", () => {
  const p = createPhysics();
  for (let i = 0; i < 180; i++) p.world.step(1 / 60);
  assert.ok(
    p.chassis.position.y > 0.3 && p.chassis.position.y < 1.5,
    `settled y ${p.chassis.position.y}`,
  );
  assert.ok(
    p.vehicle.wheelInfos.every((w) => w.isInContact),
    "wheels contact ground",
  );
  const start = p.chassis.position.clone();
  const forward = p.chassis.vectorToWorldFrame(
    new (start.constructor as typeof import("cannon-es").Vec3)(0, 0, -1),
  );
  for (let i = 0; i < 180; i++) {
    p.vehicle.applyEngineForce(2800, 2);
    p.vehicle.applyEngineForce(2800, 3);
    p.world.step(1 / 60);
  }
  assert.ok(
    p.chassis.position.vsub(start).dot(forward) > 4,
    "positive force goes toward vehicle front",
  );
  const fast = p.chassis.velocity.length();
  assert.ok(fast > 3);
  for (let i = 0; i < 180; i++) {
    for (let w = 0; w < 4; w++) {
      p.vehicle.applyEngineForce(0, w);
      p.vehicle.setBrake(65, w);
    }
    p.world.step(1 / 60);
  }
  assert.ok(p.chassis.velocity.length() < fast * 0.2, "braking slows vehicle");
  for (let i = 0; i < 120; i++) {
    for (let w = 0; w < 4; w++) {
      p.vehicle.setBrake(0, w);
      p.vehicle.applyEngineForce(w >= 2 ? -1900 : 0, w);
    }
    p.world.step(1 / 60);
  }
  assert.ok(p.chassis.velocity.dot(forward) < -1, "negative force reverses");
  p.dispose();
});
