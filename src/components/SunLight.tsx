import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { DirectionalLight, Object3D, Vector3 } from "three";
import { vehiclePose } from "./Vehicle";
export function SunLight({ sun }: { sun: [number, number, number] }) {
  const light = useRef<DirectionalLight>(null),
    target = useMemo(() => new Object3D(), []),
    offset = useMemo(
      () => new Vector3(...sun).normalize().multiplyScalar(300),
      [sun],
    );
  useFrame(() => {
    if (!light.current) return;
    light.current.position.copy(vehiclePose.position).add(offset);
    target.position.copy(vehiclePose.position);
    target.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        target={target}
        position={sun}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-85}
        shadow-camera-right={85}
        shadow-camera-top={85}
        shadow-camera-bottom={-85}
        shadow-camera-near={1}
        shadow-camera-far={700}
        shadow-normalBias={0.16}
        shadow-bias={-0.0001}
      />
    </>
  );
}
