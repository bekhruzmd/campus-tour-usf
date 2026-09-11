import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { TilesRenderer } from "3d-tiles-renderer";
import {
  GoogleCloudAuthPlugin,
  CesiumIonAuthPlugin,
} from "3d-tiles-renderer/plugins";
import { Mesh, Plane, Raycaster, Vector3 } from "three";
import { ECEF_TO_LOCAL, BOUNDS } from "../lib/geo";
import { sim } from "../lib/store";
import type { Physics } from "../lib/physics";
const down = new Vector3(0, -1, 0);
export function useCampusTiles(physics: Physics) {
  const { camera, gl, scene } = useThree();
  const renderer = useRef<TilesRenderer | null>(null);
  const timer = useRef(0),
    ray = useRef(new Raycaster());
  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      token = import.meta.env.VITE_CESIUM_ION_TOKEN;
    if (!key && !token) {
      sim.set({ tileStatus: "demo" });
      return;
    }
    const tiles = new TilesRenderer(
      key ? "https://tile.googleapis.com/v1/3dtiles/root.json" : undefined,
    );
    if (key)
      tiles.registerPlugin(
        new GoogleCloudAuthPlugin({ apiToken: key, autoRefreshToken: true }),
      );
    else
      tiles.registerPlugin(
        new CesiumIonAuthPlugin({
          apiToken: token,
          assetId: import.meta.env.VITE_CESIUM_ION_ASSET_ID || "2275207",
          autoRefreshToken: true,
        }),
      );
    // Exact inverse WGS84 tangent frame: all physics and rendered vertices are local metres.
    tiles.group.matrix.copy(ECEF_TO_LOCAL);
    tiles.group.matrix.decompose(
      tiles.group.position,
      tiles.group.quaternion,
      tiles.group.scale,
    );
    tiles.group.updateMatrixWorld(true);
    tiles.setCamera(camera);
    tiles.errorTarget = 8;
    tiles.lruCache.maxSize = 250;
    tiles.lruCache.minSize = 180;
    tiles.lruCache.maxBytesSize = 256 * 1024 * 1024;
    tiles.lruCache.minBytesSize = 192 * 1024 * 1024;
    tiles.downloadQueue.maxJobs = 6;
    tiles.parseQueue.maxJobs = 2;
    tiles.autoDisableRendererCulling = false;
    // Global clipping applies to streamed imagery and fallback alike, in local world coordinates.
    gl.clippingPlanes = [
      new Plane(new Vector3(1, 0, 0), -BOUNDS.minX),
      new Plane(new Vector3(-1, 0, 0), BOUNDS.maxX),
      new Plane(new Vector3(0, 0, 1), -BOUNDS.minZ),
      new Plane(new Vector3(0, 0, -1), BOUNDS.maxZ),
    ];
    const timeout = window.setTimeout(() => {
      if (sim.get().tileStatus === "loading") sim.set({ tileStatus: "error" });
    }, 25000);
    const loaded = ({ scene: model }: { scene: import("three").Object3D }) => {
      model.traverse((obj) => {
        if (obj instanceof Mesh) {
          obj.castShadow = false;
          obj.receiveShadow = true;
        }
      });
    };
    const failed = () => {
      if (sim.get().tileStatus !== "live") sim.set({ tileStatus: "error" });
    };
    tiles.addEventListener("load-model", loaded);
    tiles.addEventListener("load-error", failed);
    scene.add(tiles.group);
    renderer.current = tiles;
    sim.set({ tileStatus: "loading" });
    return () => {
      window.clearTimeout(timeout);
      renderer.current = null;
      scene.remove(tiles.group);
      tiles.removeEventListener("load-model", loaded);
      tiles.removeEventListener("load-error", failed);
      tiles.dispose();
    };
  }, [camera, gl, scene, physics]);
  useFrame((_, dt) => {
    const tiles = renderer.current;
    if (!tiles) return;
    const s = sim.get();
    tiles.errorTarget = s.quality === "high" ? 3 : 8;
    tiles.setResolutionFromRenderer(camera, gl);
    tiles.update();
    timer.current += dt;
    if (timer.current < 0.3) return;
    timer.current = 0;
    const credits = tiles
      .getAttributions()
      .filter((a) => a.type === "string")
      .map((a) => String(a.value))
      .join(" · ");
    if (credits !== s.credits) sim.set({ credits });
    // Raycasts are transient. Never persist or extract Google's tile geometry.
    const cast = (x: number, z: number) => {
      ray.current.set(new Vector3(x, 100, z), down);
      ray.current.far = 200;
      return ray.current
        .intersectObject(tiles.group, true)
        .find((hit) => hit.face && hit.point.y > -50);
    };
    const hit = cast(physics.chassis.position.x, physics.chassis.position.z);
    if (hit && s.tileStatus !== "live") {
      sim.set({ tileStatus: "live" });
      physics.floor.position.y = -51;
      physics.floor.aabbNeedsUpdate = true;
      physics.chassis.position.y = hit.point.y + 1.2;
      physics.chassis.velocity.setZero();
    }
    if (sim.get().tileStatus !== "live") return;
    physics.terrainReady = !!hit;
    if (hit) {
      physics.support.position.set(
        physics.chassis.position.x,
        hit.point.y - 0.28,
        physics.chassis.position.z,
      );
      physics.support.aabbNeedsUpdate = true;
      if (physics.chassis.position.y < hit.point.y + 0.4) {
        physics.chassis.position.y = hit.point.y + 1.1;
        physics.chassis.velocity.y = 0;
      }
    } else {
      // Never drive into an unloaded surface. Hold position until a ray can resolve it.
      physics.chassis.velocity.setZero();
      physics.chassis.angularVelocity.setZero();
    }
    // A local support collider under the vehicle covers gaps between primary-road patches.
    // It follows the visible surface only; fixed campus road patches remain the stable layer.
    const now = performance.now();
    const nearby = physics.patches
      .filter(
        (p) =>
          Math.hypot(
            p.x - physics.chassis.position.x,
            p.z - physics.chassis.position.z,
          ) < 90 && now - p.sampled > 4000,
      )
      .sort(
        (a, b) =>
          Math.hypot(
            a.x - physics.chassis.position.x,
            a.z - physics.chassis.position.z,
          ) -
          Math.hypot(
            b.x - physics.chassis.position.x,
            b.z - physics.chassis.position.z,
          ),
      )
      .slice(0, 5);
    for (const p of nearby) {
      const terrain = cast(p.x, p.z);
      if (!terrain) continue;
      p.body.position.y = terrain.point.y - 0.26;
      p.body.aabbNeedsUpdate = true;
      p.sampled = now;
    }
  });
  return renderer;
}
export function CampusTiles({ physics }: { physics: Physics }) {
  useCampusTiles(physics);
  return null;
}
