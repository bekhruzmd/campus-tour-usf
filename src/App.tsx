import { Component, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Plane, Vector3 } from "three";
import { SunLight } from "./components/SunLight";
import { Sky } from "@react-three/drei";
import SunCalc from "suncalc";
import { Campus } from "./components/Campus";
import { Vehicle } from "./components/Vehicle";
import { ChaseCamera } from "./components/ChaseCamera";
import { Hud } from "./components/Hud";
import { CampusTiles } from "./hooks/useCampusTiles";
import { useWebMCP } from "./hooks/useWebMCP";
import { useInput } from "./hooks/useInput";
import { createPhysics } from "./lib/physics";
import { ORIGIN, BOUNDS } from "./lib/geo";
import { useSim } from "./lib/store";
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="webgl-error">
        <h1>The 3D view couldn’t start.</h1>
        <p>
          Enable hardware acceleration and reload in a WebGL-capable browser.
        </p>
        <button onClick={() => location.reload()}>Reload simulation</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Scene() {
  const physics = useMemo(createPhysics, []);
  const s = useSim();
  const sun = useMemo(() => {
    const p = SunCalc.getPosition(
      new Date("2026-09-11T20:00:00Z"),
      ORIGIN.lat,
      ORIGIN.lon,
    );
    return [
      -Math.sin(p.azimuth) * Math.cos(p.altitude) * 1000,
      Math.sin(p.altitude) * 1000,
      Math.cos(p.azimuth) * Math.cos(p.altitude) * 1000,
    ] as [number, number, number];
  }, []);
  return (
    <>
      <Sky
        distance={450000}
        sunPosition={sun}
        inclination={0}
        turbidity={3.5}
        rayleigh={1.1}
      />
      <fog attach="fog" args={["#c9d9d6", 240, 1300]} />
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#dceaf3", "#788b60", 1.3]} />
      <SunLight sun={sun} />
      <Campus live={s.tileStatus === "live"} />
      <CampusTiles physics={physics} />
      <Vehicle physics={physics} />
      <ChaseCamera />
    </>
  );
}
export default function App() {
  useInput();
  useWebMCP();
  return (
    <main>
      <ErrorBoundary>
        <Canvas
          shadows
          onCreated={({ gl }) => {
            gl.clippingPlanes = [
              new Plane(new Vector3(1, 0, 0), -BOUNDS.minX),
              new Plane(new Vector3(-1, 0, 0), BOUNDS.maxX),
              new Plane(new Vector3(0, 0, 1), -BOUNDS.minZ),
              new Plane(new Vector3(0, 0, -1), BOUNDS.maxZ),
            ];
          }}
          camera={{ position: [0, 7, 12], fov: 56, near: 0.15, far: 1800 }}
          dpr={[1, 1.6]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      <Hud />
    </main>
  );
}
