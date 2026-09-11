import { useMemo } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Shape,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Matrix4,
  CylinderGeometry,
  ConeGeometry,
  BoxGeometry,
  DoubleSide,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildings, roads } from "../data/campus";
import { BOUNDS, insideCampus, segmentDistance } from "../lib/geo";
function roadGeometry(widthAdd = 0, y = 0.075) {
  const vertices: number[] = [];
  for (const r of roads)
    for (let i = 1; i < r.points.length; i++) {
      const a = r.points[i - 1],
        b = r.points[i];
      const dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz);
      if (!len) continue;
      const w = (r.width + widthAdd) / 2,
        ox = (dz / len) * w,
        oz = (-dx / len) * w;
      vertices.push(
        a[0] + ox,
        y,
        a[1] + oz,
        b[0] + ox,
        y,
        b[1] + oz,
        a[0] - ox,
        y,
        a[1] - oz,
        a[0] - ox,
        y,
        a[1] - oz,
        b[0] + ox,
        y,
        b[1] + oz,
        b[0] - ox,
        y,
        b[1] - oz,
      );
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  g.computeVertexNormals();
  return g;
}
export function Campus({ live }: { live: boolean }) {
  const geometries = useMemo(() => {
    const footprints = buildings.map((b) => {
      const s = new Shape();
      b.points.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
      const g = new ExtrudeGeometry(s, {
        depth: b.height,
        bevelEnabled: false,
      });
      g.rotateX(-Math.PI / 2);
      return g;
    });
    const blocks = mergeGeometries(footprints);
    footprints.forEach((g) => g.dispose());
    const markings: number[] = [];
    for (const r of roads.filter((r) => r.width >= 10))
      for (let i = 1; i < r.points.length; i++) {
        const a = r.points[i - 1],
          b = r.points[i],
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          l = Math.hypot(dx, dz);
        for (let t = 2; t < l - 2; t += 8) {
          const x = a[0] + (dx * t) / l,
            z = a[1] + (dz * t) / l,
            ox = (dz / l) * 0.09,
            oz = (-dx / l) * 0.09,
            ex = (dx / l) * 3,
            ez = (dz / l) * 3;
          markings.push(
            x + ox,
            0.105,
            z + oz,
            x + ex + ox,
            0.105,
            z + ez + oz,
            x - ox,
            0.105,
            z - oz,
            x - ox,
            0.105,
            z - oz,
            x + ex + ox,
            0.105,
            z + ez + oz,
            x + ex - ox,
            0.105,
            z + ez - oz,
          );
        }
      }
    const lines = new BufferGeometry();
    lines.setAttribute("position", new Float32BufferAttribute(markings, 3));
    lines.computeVertexNormals();
    let seed = 417;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const trunks: BufferGeometry[] = [],
      leaves: BufferGeometry[] = [];
    for (let i = 0; i < 850; i++) {
      const x = BOUNDS.minX + random() * (BOUNDS.maxX - BOUNDS.minX),
        z = BOUNDS.minZ + random() * (BOUNDS.maxZ - BOUNDS.minZ);
      if (
        !insideCampus(x, z, 15) ||
        roads.some((r) =>
          r.points.some(
            (b, j) =>
              j > 0 &&
              segmentDistance(x, z, r.points[j - 1], b) < r.width / 2 + 5,
          ),
        )
      )
        continue;
      if (
        buildings.some((b) => {
          const xs = b.points.map((p) => p[0]),
            zs = b.points.map((p) => p[1]);
          return (
            x > Math.min(...xs) - 4 &&
            x < Math.max(...xs) + 4 &&
            z > Math.min(...zs) - 4 &&
            z < Math.max(...zs) + 4
          );
        })
      )
        continue;
      const h = 5 + random() * 5;
      trunks.push(new CylinderGeometry(0.18, 0.3, h, 5).translate(x, h / 2, z));
      for (let j = 0; j < 5; j++) {
        const g = new ConeGeometry(2.7, 0.55, 4);
        g.rotateZ(0.5);
        g.rotateY(j * Math.PI * 0.4);
        g.translate(
          x + Math.sin(j * 1.257) * 1.6,
          h,
          z + Math.cos(j * 1.257) * 1.6,
        );
        leaves.push(g);
      }
    }
    const trunk = mergeGeometries(trunks),
      leaf = mergeGeometries(leaves);
    trunks.forEach((g) => g.dispose());
    leaves.forEach((g) => g.dispose());
    return {
      roads: roadGeometry(),
      curbs: roadGeometry(2, 0.025),
      blocks,
      lines,
      trunk,
      leaf,
    };
  }, []);
  return (
    <group visible={!live}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          (BOUNDS.minX + BOUNDS.maxX) / 2,
          -0.015,
          (BOUNDS.minZ + BOUNDS.maxZ) / 2,
        ]}
        receiveShadow
      >
        <planeGeometry
          args={[BOUNDS.maxX - BOUNDS.minX, BOUNDS.maxZ - BOUNDS.minZ]}
        />
        <meshStandardMaterial color="#829875" roughness={1} />
      </mesh>
      <mesh geometry={geometries.curbs} receiveShadow>
        <meshStandardMaterial side={DoubleSide} color="#c5c6b8" />
      </mesh>
      <mesh geometry={geometries.roads} receiveShadow>
        <meshStandardMaterial
          side={DoubleSide}
          color="#626c6b"
          roughness={0.95}
        />
      </mesh>
      <mesh geometry={geometries.lines}>
        <meshBasicMaterial side={DoubleSide} color="#e0d5a1" />
      </mesh>
      {geometries.blocks && (
        <mesh geometry={geometries.blocks} castShadow receiveShadow>
          <meshStandardMaterial color="#d7cfba" roughness={0.9} />
        </mesh>
      )}
      {geometries.trunk && (
        <mesh geometry={geometries.trunk} castShadow>
          <meshStandardMaterial color="#79765d" />
        </mesh>
      )}
      {geometries.leaf && (
        <mesh geometry={geometries.leaf} castShadow>
          <meshStandardMaterial color="#40664d" roughness={1} />
        </mesh>
      )}
    </group>
  );
}
