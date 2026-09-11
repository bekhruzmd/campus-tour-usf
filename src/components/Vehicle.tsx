import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils, Vector3 } from "three";
import { keys, sim } from "../lib/store";
import { insideCampus } from "../lib/geo";
import { nearestLandmark, roadAt } from "../data/campus";
import type { Physics } from "../lib/physics";
export const vehiclePose = {
  position: new Vector3(),
  forward: new Vector3(0, 0, -1),
  speed: 0,
};
export function Vehicle({ physics }: { physics: Physics }) {
  const body = useRef<Group>(null),
    wheels = useRef<(Group | null)[]>([]),
    steering = useRef(0),
    elapsed = useRef(0),
    resetId = useRef(0),
    last = useRef(new Vector3());
  useEffect(() => {
    if (!physics.vehicle.world) physics.vehicle.addToWorld(physics.world);
    return () => physics.dispose();
  }, [physics]);
  useFrame((_, delta) => {
    const state = sim.get(),
      { vehicle, chassis, world } = physics;
    if (state.reset !== resetId.current) {
      physics.reset(state.destination);
      if (state.tileStatus === "live") physics.terrainReady = false;
      resetId.current = state.reset;
      last.current.set(
        chassis.position.x,
        chassis.position.y,
        chassis.position.z,
      );
    }
    const stopped =
      state.paused ||
      state.help ||
      state.settings ||
      state.mapOpen ||
      !physics.terrainReady;
    if (!stopped) {
      const forward = keys.has("KeyW") || keys.has("ArrowUp"),
        back = keys.has("KeyS") || keys.has("ArrowDown");
      const left = keys.has("KeyA") || keys.has("ArrowLeft"),
        right = keys.has("KeyD") || keys.has("ArrowRight");
      const speed = chassis.velocity.dot(
        chassis.vectorToWorldFrame({
          x: 0,
          y: 0,
          z: -1,
        } as import("cannon-es").Vec3),
      );
      const handbrake = keys.has("Space");
      const braking = (back && speed > 1) || (forward && speed < -1);
      const force = braking
        ? 0
        : forward
          ? speed < 25
            ? 2800
            : 0
          : back
            ? speed > -8
              ? -1900
              : 0
            : 0;
      steering.current = MathUtils.damp(
        steering.current,
        ((Number(left) - Number(right)) * 0.48) / (1 + Math.abs(speed) * 0.035),
        9,
        Math.min(delta, 0.1),
      );
      for (let i = 0; i < 4; i++) {
        vehicle.setBrake(
          braking
            ? 65
            : handbrake && i >= 2
              ? 110
              : !forward && !back
                ? 1.7
                : 0,
          i,
        );
        vehicle.applyEngineForce(i >= 2 ? force : 0, i);
        vehicle.wheelInfos[i].frictionSlip = handbrake && i >= 2 ? 1.3 : 3.8;
      }
      vehicle.setSteeringValue(steering.current, 0);
      vehicle.setSteeringValue(steering.current, 1);
      world.step(1 / 60, Math.min(delta, 0.1), 5);
      if (
        !insideCampus(chassis.position.x, chassis.position.z, 2) ||
        chassis.position.y < -45
      )
        physics.reset(state.destination);
    }
    body.current?.position.copy(chassis.position);
    body.current?.quaternion.copy(chassis.quaternion);
    for (let i = 0; i < 4; i++) {
      vehicle.updateWheelTransform(i);
      const t = vehicle.wheelInfos[i].worldTransform;
      wheels.current[i]?.position.copy(t.position);
      wheels.current[i]?.quaternion.copy(t.quaternion);
    }
    vehiclePose.position.copy(chassis.position);
    vehiclePose.forward.set(0, 0, -1).applyQuaternion(body.current!.quaternion);
    vehiclePose.speed = chassis.velocity.length();
    elapsed.current += delta;
    if (elapsed.current > 0.1) {
      elapsed.current = 0;
      const { x, z } = chassis.position;
      const d = last.current.distanceTo(vehiclePose.position);
      sim.set({
        elevation: chassis.position.y,
        groundedWheels: vehicle.wheelInfos.filter((w) => w.raycastResult.hasHit)
          .length,
        x,
        z,
        speed: Math.hypot(chassis.velocity.x, chassis.velocity.z) * 2.236936,
        gear:
          chassis.velocity.x * vehiclePose.forward.x +
            chassis.velocity.z * vehiclePose.forward.z <
          -0.2
            ? "R"
            : "D",
        heading: Math.atan2(vehiclePose.forward.x, -vehiclePose.forward.z),
        zone: nearestLandmark(x, z).name,
        road: roadAt(x, z).name,
        distance: state.distance + (d < 15 ? d : 0),
      });
      last.current.copy(vehiclePose.position);
    }
  }, -2);
  return (
    <>
      <group ref={body}>
        <mesh castShadow>
          <boxGeometry args={[1.78, 0.49, 3.9]} />
          <meshStandardMaterial
            color="#006b52"
            metalness={0.48}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.39, 0.12]} castShadow>
          <boxGeometry args={[1.48, 0.62, 1.9]} />
          <meshStandardMaterial
            color="#075747"
            metalness={0.45}
            roughness={0.28}
          />
        </mesh>
        <mesh position={[0, 0.49, -0.85]} rotation={[-0.23, 0, 0]}>
          <boxGeometry args={[1.37, 0.42, 0.045]} />
          <meshStandardMaterial
            color="#91b8bd"
            metalness={0.6}
            roughness={0.15}
          />
        </mesh>
        <mesh position={[0, 0.5, 1.08]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[1.37, 0.39, 0.045]} />
          <meshStandardMaterial
            color="#243e43"
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.754, 0.48, 0.09]}>
              <boxGeometry args={[0.025, 0.39, 1.55]} />
              <meshStandardMaterial
                color="#244649"
                metalness={0.45}
                roughness={0.18}
              />
            </mesh>
            <mesh position={[side * 0.64, 0.04, 1.97]}>
              <boxGeometry args={[0.46, 0.13, 0.03]} />
              <meshStandardMaterial
                color="#e15647"
                emissive="#d73219"
                emissiveIntensity={0.8}
              />
            </mesh>
            <mesh position={[side * 0.61, 0.08, -1.97]}>
              <boxGeometry args={[0.48, 0.16, 0.03]} />
              <meshStandardMaterial
                color="#fff1ce"
                emissive="#fff1ce"
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.2, 1.99]}>
          <boxGeometry args={[1.58, 0.13, 0.08]} />
          <meshStandardMaterial color="#243330" />
        </mesh>
        <mesh position={[0, -0.03, 1.98]}>
          <boxGeometry args={[0.38, 0.14, 0.025]} />
          <meshStandardMaterial color="#ecebdc" />
        </mesh>
      </group>
      {[0, 1, 2, 3].map((i) => (
        <group
          key={i}
          ref={(el) => {
            wheels.current[i] = el;
          }}
        >
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.24, 16]} />
            <meshStandardMaterial color="#222a29" roughness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.19, 0.19, 0.25, 8]} />
            <meshStandardMaterial
              color="#b8c4bf"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
