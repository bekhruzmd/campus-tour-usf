import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { vehiclePose } from "./Vehicle";
import { sim } from "../lib/store";
const target = new Vector3(),
  eye = new Vector3(),
  offset = new Vector3();
export function ChaseCamera() {
  const { gl, camera } = useThree(),
    orbit = useRef({ yaw: 0, pitch: 0.23, drag: false, x: 0, y: 0 }),
    ready = useRef(false),
    look = useRef(new Vector3());
  useEffect(() => {
    const down = (e: PointerEvent) => {
      orbit.current.drag = true;
      orbit.current.x = e.clientX;
      orbit.current.y = e.clientY;
      gl.domElement.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const o = orbit.current;
      if (!o.drag) return;
      o.yaw -= (e.clientX - o.x) * 0.005;
      o.pitch = MathUtils.clamp(
        o.pitch + (e.clientY - o.y) * 0.003,
        -0.05,
        0.95,
      );
      o.x = e.clientX;
      o.y = e.clientY;
    };
    const up = () => {
      orbit.current.drag = false;
    };
    const el = gl.domElement;
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("lostpointercapture", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("lostpointercapture", up);
    };
  }, [gl]);
  useFrame((_, dt) => {
    const o = orbit.current;
    if (!o.drag) {
      o.yaw = MathUtils.damp(o.yaw, 0, 1.4, dt);
      o.pitch = MathUtils.damp(o.pitch, 0.23, 1.4, dt);
    }
    const wide = sim.get().camera === "wide",
      distance = wide ? 17 : 10,
      forward = vehiclePose.forward;
    const angle = Math.atan2(forward.x, forward.z) + o.yaw;
    offset.set(
      -Math.sin(angle) * distance,
      3.5 + o.pitch * distance,
      -Math.cos(angle) * distance,
    );
    eye.copy(vehiclePose.position).add(offset);
    target
      .copy(vehiclePose.position)
      .addScaledVector(forward, 4)
      .add(new Vector3(0, 1, 0));
    if (!ready.current || camera.position.distanceTo(eye) > 100) {
      camera.position.copy(eye);
      look.current.copy(target);
      ready.current = true;
    }
    camera.position.lerp(eye, 1 - Math.exp(-5 * dt));
    look.current.lerp(target, 1 - Math.exp(-8 * dt));
    camera.lookAt(look.current);
    const c = camera as PerspectiveCamera;
    c.fov = MathUtils.damp(
      c.fov,
      56 + Math.min(vehiclePose.speed / 25, 1) * 11,
      3,
      dt,
    );
    c.updateProjectionMatrix();
  }, -1);
  return null;
}
