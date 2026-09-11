import { useEffect, useRef } from "react";
import {
  buildings,
  roads,
  places,
  bounds,
  spawnNear,
  type Place,
} from "./data/explorer";
import { stepCar, type Car } from "./lib/drive";
export type MapCommand = {
  kind: "zoomIn" | "zoomOut" | "overview" | "follow" | "reset" | "jump";
  id: number;
  place?: Place;
};
export type Telemetry = {
  speed: number;
  distance: number;
  nearby: Place;
  overview: boolean;
};
export const held = new Set<string>();
const W = bounds.maxX - bounds.minX,
  H = bounds.maxZ - bounds.minZ;
const polygon = (
  c: CanvasRenderingContext2D,
  points: { x: number; z: number }[],
) => {
  c.beginPath();
  points.forEach((p, i) => (i ? c.lineTo(p.x, p.z) : c.moveTo(p.x, p.z)));
  c.closePath();
};
const inPolygon = (x: number, z: number, p: { x: number; z: number }[]) => {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if (
      p[i].z > z !== p[j].z > z &&
      x < ((p[j].x - p[i].x) * (z - p[i].z)) / (p[j].z - p[i].z) + p[i].x
    )
      inside = !inside;
  }
  return inside;
};
function bake() {
  const canvas = document.createElement("canvas"),
    k = 1.5;
  canvas.width = Math.ceil(W * k);
  canvas.height = Math.ceil(H * k);
  const c = canvas.getContext("2d")!;
  c.scale(k, k);
  c.translate(-bounds.minX, -bounds.minZ);
  c.fillStyle = "#dfe8d5";
  c.fillRect(bounds.minX, bounds.minZ, W, H);
  c.strokeStyle = "#d5e0cb";
  c.lineWidth = 0.7;
  for (let x = bounds.minX; x < bounds.maxX; x += 50) {
    c.beginPath();
    c.moveTo(x, bounds.minZ);
    c.lineTo(x, bounds.maxZ);
    c.stroke();
  }
  for (let z = bounds.minZ; z < bounds.maxZ; z += 50) {
    c.beginPath();
    c.moveTo(bounds.minX, z);
    c.lineTo(bounds.maxX, z);
    c.stroke();
  }
  // One locally cached map image. No map servers, WebGL context, or streamed assets.
  for (const layer of [0, 1]) {
    c.strokeStyle = layer ? "#fcfcf4" : "#c5d0bf";
    c.lineCap = "round";
    c.lineJoin = "round";
    for (const r of roads) {
      c.lineWidth = r.width + (layer ? 0 : 2);
      c.beginPath();
      r.points.forEach((p, i) => (i ? c.lineTo(p.x, p.z) : c.moveTo(p.x, p.z)));
      c.stroke();
    }
  }
  for (const b of buildings) {
    c.save();
    c.translate(3, 5);
    polygon(c, b.points);
    c.fillStyle = "#b9c8b3";
    c.fill();
    c.restore();
    polygon(c, b.points);
    c.fillStyle = b.name ? "#e7dfc9" : "#eeeadc";
    c.fill();
    c.strokeStyle = "#b7bea8";
    c.lineWidth = 0.8;
    c.stroke();
  }
  let seed = 82;
  for (let i = 0; i < 550; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const x = bounds.minX + (seed / 4294967296) * W;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const z = bounds.minZ + (seed / 4294967296) * H;
    if (buildings.some((b) => Math.abs(b.x - x) < 40 && Math.abs(b.z - z) < 35))
      continue;
    if (
      roads.some((r) => r.points.some((p) => Math.hypot(p.x - x, p.z - z) < 15))
    )
      continue;
    c.beginPath();
    c.arc(x, z, 3 + (i % 4), 0, Math.PI * 2);
    c.fillStyle = ["#bbd0aa", "#a6c19a", "#c5d7b6"][i % 3];
    c.fill();
  }
  return canvas;
}
export default function ExplorerMap({
  command,
  paused,
  onTelemetry,
  onSelect,
  onBuilding,
}: {
  command: MapCommand;
  paused: boolean;
  onTelemetry: (t: Telemetry) => void;
  onSelect: (p: Place) => void;
  onBuilding: (name: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    callbacks = useRef({ onTelemetry, onSelect, onBuilding }),
    pause = useRef(paused),
    control = useRef(command);
  callbacks.current = { onTelemetry, onSelect, onBuilding };
  pause.current = paused;
  control.current = command;
  useEffect(() => {
    const canvas = ref.current!,
      ctx = canvas.getContext("2d")!,
      map = bake();
    let size = { w: innerWidth, h: innerHeight };
    let car: Car = { ...spawnNear(places[0]), speed: 0 };
    let camera = { x: car.x, z: car.z, scale: 1.05 },
      zoom = 1.05,
      overview = false,
      seen = -1,
      raf = 0,
      last = performance.now(),
      lastDraw = 0,
      lastReport = 0,
      distance = 0,
      dirty = true,
      drag: { x: number; y: number; startX: number; startY: number } | null =
        null;
    let tags: { x: number; y: number; w: number; h: number; place: Place }[] =
      [];
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      size = { w: box.width, h: box.height };
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = box.width * dpr;
      canvas.height = box.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const screen = (x: number, z: number) => ({
      x: (x - camera.x) * camera.scale + size.w * 0.53,
      y: (z - camera.z) * camera.scale * 0.78 + size.h * 0.51,
    });
    const point = (x: number, y: number) => ({
      x: (x - size.w * 0.53) / camera.scale + camera.x,
      z: (y - size.h * 0.51) / (camera.scale * 0.78) + camera.z,
    });
    const draw = () => {
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.fillStyle = "#edf0e4";
      ctx.fillRect(0, 0, size.w, size.h);
      const corner = screen(bounds.minX, bounds.minZ);
      ctx.drawImage(
        map,
        corner.x,
        corner.y,
        W * camera.scale,
        H * camera.scale * 0.78,
      );
      // Nearby building tags remain legible; anonymous OSM footprints get honest numbered labels.
      if (camera.scale > 0.78) {
        ctx.font = '500 10px "DM Sans",sans-serif';
        ctx.textAlign = "center";
        for (const b of buildings) {
          const p = screen(b.x, b.z);
          if (p.x < 10 || p.x > size.w - 10 || p.y < 85 || p.y > size.h - 50)
            continue;
          if (places.some((l) => Math.hypot(l.x - b.x, l.z - b.z) < 75))
            continue;
          const text =
            b.label.length > 29 ? b.label.slice(0, 27) + "…" : b.label;
          ctx.fillStyle = "#fafbf0e8";
          ctx.fillRect(
            p.x - ctx.measureText(text).width / 2 - 4,
            p.y - 8,
            ctx.measureText(text).width + 8,
            15,
          );
          ctx.fillStyle = "#6c7967";
          ctx.fillText(text, p.x, p.y + 3);
        }
      }
      tags = [];
      for (const place of places) {
        const p = screen(place.x, place.z);
        if (p.x < -150 || p.x > size.w + 150 || p.y < -40 || p.y > size.h + 40)
          continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#006747";
        ctx.fill();
        ctx.strokeStyle = "#fffdf0";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = '600 12px "DM Sans",sans-serif';
        const w = ctx.measureText(place.short).width + 32,
          x = p.x - w / 2,
          y = p.y - 41;
        ctx.fillStyle = "#fffef7";
        ctx.shadowColor = "#25483320";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(x, y, w, 27, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#174c37";
        ctx.textAlign = "center";
        ctx.fillText(place.short, p.x, y + 18);
        tags.push({ x, y, w, h: 50, place });
      }
      const p = screen(car.x, car.z);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(car.heading);
      ctx.shadowColor = "#153c3460";
      ctx.shadowBlur = 7;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "#17352c";
      ctx.beginPath();
      ctx.roundRect(-9, -16, 18, 32, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = "#017855";
      ctx.beginPath();
      ctx.roundRect(-7, -15, 14, 29, 4);
      ctx.fill();
      ctx.fillStyle = "#afded0";
      ctx.fillRect(-5, -8, 10, 6);
      ctx.fillStyle = "#123e36";
      ctx.fillRect(-5, 5, 10, 5);
      ctx.fillStyle = "#f4d79a";
      ctx.fillRect(-6, -14, 3, 2);
      ctx.fillRect(3, -14, 3, 2);
      ctx.fillStyle = "#e9a481";
      ctx.fillRect(-6, 12, 3, 2);
      ctx.fillRect(3, 12, 3, 2);
      ctx.restore();
      ctx.fillStyle = "#637762";
      ctx.font = '500 10px "DM Sans",sans-serif';
      ctx.textAlign = "left";
      const length = 100 * camera.scale;
      ctx.fillRect(size.w - 35 - length, size.h - 36, length, 2);
      ctx.fillText("100 m", size.w - 35 - length, size.h - 43);
    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) {
        last = now;
        return;
      }
      if (now - lastDraw < 1000 / 30) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      lastDraw = now;
      const cmd = control.current;
      if (cmd.id !== seen) {
        seen = cmd.id;
        dirty = true;
        if (cmd.kind === "zoomIn") zoom = Math.min(2.8, zoom * 1.3);
        if (cmd.kind === "zoomOut") zoom = Math.max(0.35, zoom / 1.3);
        if (cmd.kind === "overview") {
          overview = true;
          zoom = Math.min((size.w - 80) / W, (size.h - 130) / (H * 0.78));
          camera.x = (bounds.minX + bounds.maxX) / 2;
          camera.z = (bounds.minZ + bounds.maxZ) / 2;
        }
        if (cmd.kind === "follow") {
          overview = false;
          zoom = 1.05;
        }
        if (cmd.kind === "reset" || cmd.kind === "jump") {
          car = { ...spawnNear(cmd.place || places[0]), speed: 0 };
          overview = false;
          zoom = 1.05;
          camera.x = car.x;
          camera.z = car.z;
        }
      }
      const throttle =
          Number(held.has("KeyW") || held.has("ArrowUp")) -
          Number(held.has("KeyS") || held.has("ArrowDown")),
        steer =
          Number(held.has("KeyD") || held.has("ArrowRight")) -
          Number(held.has("KeyA") || held.has("ArrowLeft"));
      if (!pause.current) {
        const next = stepCar(
          car,
          { throttle, steer, brake: held.has("Space") },
          dt,
          bounds,
        );
        const travelled = Math.hypot(next.x - car.x, next.z - car.z);
        distance += travelled;
        dirty ||= travelled > 0;
        car = next;
      }
      const tx = overview ? camera.x : car.x,
        tz = overview ? camera.z : car.z,
        alpha = 1 - Math.exp(-6 * dt);
      if (
        Math.abs(camera.x - tx) +
          Math.abs(camera.z - tz) +
          Math.abs(camera.scale - zoom) >
        0.003
      ) {
        camera.x += (tx - camera.x) * alpha;
        camera.z += (tz - camera.z) * alpha;
        camera.scale += (zoom - camera.scale) * alpha;
        dirty = true;
      }
      if (dirty) {
        draw();
        dirty = false;
      }
      if (now - lastReport > 150) {
        lastReport = now;
        callbacks.current.onTelemetry({
          speed: Math.abs(car.speed) * 2.23694,
          distance,
          overview,
          nearby: places.reduce((a, b) =>
            Math.hypot(a.x - car.x, a.z - car.z) <
            Math.hypot(b.x - car.x, b.z - car.z)
              ? a
              : b,
          ),
        });
      }
    };
    const down = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      drag = {
        x: e.offsetX,
        y: e.offsetY,
        startX: e.offsetX,
        startY: e.offsetY,
      };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      if (Math.hypot(e.offsetX - drag.startX, e.offsetY - drag.startY) > 5) {
        overview = true;
        camera.x -= (e.offsetX - drag.x) / camera.scale;
        camera.z -= (e.offsetY - drag.y) / (camera.scale * 0.78);
        dirty = true;
      }
      drag.x = e.offsetX;
      drag.y = e.offsetY;
    };
    const up = (e: PointerEvent) => {
      if (!drag) return;
      const click =
        Math.hypot(e.offsetX - drag.startX, e.offsetY - drag.startY) < 6;
      drag = null;
      if (!click) return;
      const tag = tags.find(
        (t) =>
          e.offsetX >= t.x &&
          e.offsetX <= t.x + t.w &&
          e.offsetY >= t.y &&
          e.offsetY <= t.y + t.h,
      );
      if (tag) {
        callbacks.current.onSelect(tag.place);
        return;
      }
      const p = point(e.offsetX, e.offsetY);
      const b = buildings.find((b) => inPolygon(p.x, p.z, b.points));
      if (b) callbacks.current.onBuilding(b.label);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      held.clear();
      map.width = 0;
      map.height = 0;
    };
  }, []);
  return (
    <canvas
      ref={ref}
      className="campus-map"
      aria-label="Interactive north-up campus map. Drive with WASD or arrow keys, drag to pan, and click a labeled landmark to see its photo."
    />
  );
}
