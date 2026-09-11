import { test } from "node:test";
import assert from "node:assert/strict";
import { stepCar } from "./drive";
const bounds = { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };
test("car accelerates north, brakes, reverses, and stays inside campus", () => {
  let c = { x: 0, z: 0, heading: 0, speed: 0 };
  for (let i = 0; i < 60; i++)
    c = stepCar(c, { throttle: 1, steer: 0, brake: false }, 1 / 60, bounds);
  assert.ok(c.z < -5 && c.speed > 10);
  for (let i = 0; i < 60; i++)
    c = stepCar(c, { throttle: 0, steer: 0, brake: true }, 1 / 60, bounds);
  assert.ok(c.speed < 0.1);
  for (let i = 0; i < 60; i++)
    c = stepCar(c, { throttle: -1, steer: 0, brake: false }, 1 / 60, bounds);
  assert.ok(c.speed < 0);
  for (let i = 0; i < 1000; i++)
    c = stepCar(c, { throttle: 1, steer: 0, brake: false }, 1 / 60, bounds);
  assert.ok(c.z >= bounds.minZ + 6);
});
