import {
  Body,
  Box,
  Material,
  ContactMaterial,
  RaycastVehicle,
  Vec3,
  World,
  SAPBroadphase,
} from "cannon-es";
import { BOUNDS, insideCampus } from "./geo";
import { primaryRoads, spawnFor } from "../data/campus";
export function createPhysics() {
  const world = new World({ gravity: new Vec3(0, -9.81, 0) });
  world.allowSleep = true;
  world.broadphase = new SAPBroadphase(world);
  const rubber = new Material("rubber"),
    ground = new Material("ground");
  world.addContactMaterial(
    new ContactMaterial(rubber, ground, { friction: 0.5, restitution: 0 }),
  );
  const floor = new Body({
    mass: 0,
    material: ground,
    shape: new Box(
      new Vec3(
        (BOUNDS.maxX - BOUNDS.minX) / 2,
        1,
        (BOUNDS.maxZ - BOUNDS.minZ) / 2,
      ),
    ),
    position: new Vec3(
      (BOUNDS.minX + BOUNDS.maxX) / 2,
      -1,
      (BOUNDS.minZ + BOUNDS.maxZ) / 2,
    ),
  });
  world.addBody(floor);
  const chassis = new Body({
    mass: 1250,
    material: rubber,
    shape: new Box(new Vec3(0.87, 0.36, 1.85)),
    angularDamping: 0.5,
    linearDamping: 0.04,
  });
  const vehicle = new RaycastVehicle({
    chassisBody: chassis,
    indexRightAxis: 0,
    indexUpAxis: 1,
    indexForwardAxis: 2,
  });
  for (const [x, z] of [
    [-0.87, -1.24],
    [0.87, -1.24],
    [-0.87, 1.22],
    [0.87, 1.22],
  ])
    vehicle.addWheel({
      radius: 0.34,
      directionLocal: new Vec3(0, -1, 0),
      axleLocal: new Vec3(-1, 0, 0),
      chassisConnectionPointLocal: new Vec3(x, -0.12, z),
      suspensionStiffness: 32,
      suspensionRestLength: 0.36,
      frictionSlip: 3.8,
      dampingRelaxation: 2.3,
      dampingCompression: 4.4,
      maxSuspensionForce: 100000,
      rollInfluence: 0.025,
      maxSuspensionTravel: 0.25,
      customSlidingRotationalSpeed: -30,
      useCustomSlidingRotationalSpeed: true,
    });
  vehicle.addToWorld(world);
  // Small independent road patches can be fitted to streamed terrain in memory.
  const patches: {
    body: Body;
    x: number;
    z: number;
    yaw: number;
    length: number;
    width: number;
    sampled: number;
  }[] = [];
  for (const r of primaryRoads)
    for (let i = 1; i < r.points.length; i++) {
      const a = r.points[i - 1],
        b = r.points[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        count = Math.ceil(len / 16);
      for (let j = 0; j < count; j++) {
        const t = (j + 0.5) / count,
          x = a[0] + (b[0] - a[0]) * t,
          z = a[1] + (b[1] - a[1]) * t;
        if (!insideCampus(x, z)) continue;
        const yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
        const body = new Body({
          mass: 0,
          material: ground,
          shape: new Box(
            new Vec3(r.width / 2 + 0.5, 0.3, len / count / 2 + 0.15),
          ),
          position: new Vec3(x, -0.25, z),
        });
        body.quaternion.setFromAxisAngle(new Vec3(0, 1, 0), yaw);
        world.addBody(body);
        patches.push({
          body,
          x,
          z,
          yaw,
          length: len / count,
          width: r.width,
          sampled: 0,
        });
      }
    }
  for (const [x, z, hx, hz] of [
    [BOUNDS.minX, 0, 1, 2500],
    [BOUNDS.maxX, 0, 1, 2500],
    [0, BOUNDS.minZ, 2500, 1],
    [0, BOUNDS.maxZ, 2500, 1],
  ])
    world.addBody(
      new Body({
        mass: 0,
        shape: new Box(new Vec3(hx, 50, hz)),
        position: new Vec3(x, 20, z),
      }),
    );
  const support = new Body({
    mass: 0,
    material: ground,
    shape: new Box(new Vec3(6, 0.3, 6)),
    position: new Vec3(0, -100, 0),
  });
  world.addBody(support);
  const reset = (id: string, height = 1.1) => {
    const p = spawnFor(id);
    chassis.position.set(p.x, height, p.z);
    chassis.quaternion.setFromAxisAngle(new Vec3(0, 1, 0), p.yaw);
    chassis.velocity.setZero();
    chassis.angularVelocity.setZero();
    chassis.force.setZero();
    chassis.torque.setZero();
    chassis.wakeUp();
  };
  reset("library");
  return {
    terrainReady: true,
    world,
    chassis,
    vehicle,
    patches,
    floor,
    support,
    reset,
    dispose: () => vehicle.removeFromWorld(world),
  };
}
export type Physics = ReturnType<typeof createPhysics>;
