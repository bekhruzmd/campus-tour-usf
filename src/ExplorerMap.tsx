import { useEffect, useRef } from "react";
import {
  buildings,
  roads,
  places,
  bounds,
  spawnNear,
  buildingToPlace,
  type Place,
  type ProjectedBuilding,
} from "./data/explorer";
import { stepCar, type Car } from "./lib/drive";
import {
  USF_PARKING_FACILITIES,
  type ParkedCarRecord,
} from "./data/usfParking";
import type {
  ActiveShuttleBus,
  ShuttleRoute,
  ShuttleStop,
} from "./data/usfShuttle";

export type MapCommand = {
  kind:
    | "zoomIn"
    | "zoomOut"
    | "overview"
    | "follow"
    | "reset"
    | "jump"
    | "navigate"
    | "autodrive"
    | "focus";
  id: number;
  place?: Place;
  targetCoords?: { x: number; z: number; name?: string; code?: string };
};

export type Telemetry = {
  speed: number;
  distance: number;
  nearby: Place;
  overview: boolean;
  carPos: { x: number; z: number };
  navDistance?: number;
  navAngle?: number;
  isAutodriving?: boolean;
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
    k = Math.min(1.0, 3200 / Math.max(W, H, 1));
  canvas.width = Math.ceil(W * k);
  canvas.height = Math.ceil(H * k);
  const c = canvas.getContext("2d")!;
  c.scale(k, k);
  c.translate(-bounds.minX, -bounds.minZ);

  // Campus Lawn Base
  c.fillStyle = "#dfe8d5";
  c.fillRect(bounds.minX, bounds.minZ, W, H);

  // Campus Grid & Plaza Accents
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

  // Castor Pond & Botanical Water Accent
  c.fillStyle = "#b8d7df";
  c.beginPath();
  c.ellipse(120, -140, 24, 18, 0.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(400, 260, 36, 22, -0.2, 0, Math.PI * 2);
  c.fill();

  // Road Layers
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

  // Buildings Base Pass
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

  // Campus Trees & Greenery
  let seed = 82;
  for (let i = 0; i < 600; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const x = bounds.minX + (seed / 4294967296) * W;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const z = bounds.minZ + (seed / 4294967296) * H;
    if (buildings.some((b) => Math.abs(b.x - x) < 35 && Math.abs(b.z - z) < 30))
      continue;
    if (
      roads.some((r) => r.points.some((p) => Math.hypot(p.x - x, p.z - z) < 14))
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
  selectedPlace,
  navigatingPlace,
  showShuttles = true,
  rainMode = false,
  explore = false,
  userPosition,
  parkedCar = null,
  onTelemetry,
  onSelect,
  onBuildingSelect,
}: {
  command: MapCommand;
  paused: boolean;
  selectedPlace?: Place | null;
  navigatingPlace?: { x: number; z: number; name: string; code: string } | null;
  showShuttles?: boolean;
  rainMode?: boolean;
  explore?: boolean;
  userPosition?: { x: number; z: number };
  parkedCar?: ParkedCarRecord | null;
  onTelemetry: (t: Telemetry) => void;
  onSelect: (p: Place) => void;
  onBuildingSelect: (b: ProjectedBuilding) => void;
}) {
  const revision = useRef(0);
  const shuttleData = useRef<{ routes: ShuttleRoute[]; stops: ShuttleStop[] }>({
    routes: [],
    stops: [],
  });
  useEffect(() => {
    revision.current++;
  }, [selectedPlace, parkedCar, userPosition, explore, showShuttles]);
  const ref = useRef<HTMLCanvasElement>(null),
    callbacks = useRef({ onTelemetry, onSelect, onBuildingSelect }),
    exploreRef = useRef(explore),
    userRef = useRef(userPosition),
    pause = useRef(paused),
    control = useRef(command),
    targetRef = useRef(navigatingPlace),
    selectedRef = useRef(selectedPlace),
    shuttlesRef = useRef(showShuttles),
    rainRef = useRef(rainMode),
    parkedCarRef = useRef(parkedCar),
    liveBusesRef = useRef<ActiveShuttleBus[]>([]);

  callbacks.current = { onTelemetry, onSelect, onBuildingSelect };
  pause.current = paused;
  exploreRef.current = explore;
  userRef.current = userPosition;
  control.current = command;
  targetRef.current = navigatingPlace;
  selectedRef.current = selectedPlace;
  shuttlesRef.current = showShuttles;
  rainRef.current = rainMode;
  parkedCarRef.current = parkedCar;

  // Background GTFS-RT Live Feed Poller
  useEffect(() => {
    if (!showShuttles) {
      liveBusesRef.current = [];
      return;
    }
    let mounted = true;
    const poll = async () => {
      try {
        const data = await import("./data/usfShuttle");
        const res = await data.fetchLiveBullRunnerPositions();
        if (mounted) {
          shuttleData.current = {
            routes: data.SHUTTLE_ROUTES,
            stops: data.SHUTTLE_STOPS,
          };
          liveBusesRef.current = res.buses;
          revision.current++;
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [showShuttles]);

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
      seenRevision = -1,
      raf = 0,
      last = performance.now(),
      lastDraw = 0,
      lastReport = 0,
      distance = 0,
      dirty = true,
      autoDriving = false,
      autoTarget: { x: number; z: number } | null = null,
      beaconPulse = 0,
      drag: { x: number; y: number; startX: number; startY: number } | null =
        null;
    let tags: {
      x: number;
      y: number;
      w: number;
      h: number;
      label?: boolean;
      place: Place;
    }[] = [];

    // Rain drop particles
    const rainDrops: { x: number; y: number; len: number; speed: number }[] =
      [];
    for (let i = 0; i < 110; i++) {
      rainDrops.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        len: 12 + Math.random() * 16,
        speed: 16 + Math.random() * 12,
      });
    }

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
      const SHUTTLE_ROUTES = shuttleData.current.routes,
        SHUTTLE_STOPS = shuttleData.current.stops;
      const now = performance.now();
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.fillStyle = rainRef.current ? "#d2ded0" : "#edf0e4";
      ctx.fillRect(0, 0, size.w, size.h);
      const corner = screen(bounds.minX, bounds.minZ);

      ctx.drawImage(
        map,
        corner.x,
        corner.y,
        W * camera.scale,
        H * camera.scale * 0.78,
      );

      const navPlace = targetRef.current;
      const selPlace = selectedRef.current;

      // Highlight selected building footprint
      const activePlace =
        selPlace || (navPlace && places.find((p) => p.code === navPlace.code));
      if (activePlace) {
        const matchingB = buildings.find(
          (b) =>
            b.id === activePlace.buildingId ||
            b.name === activePlace.name ||
            (b.profile.code && b.profile.code === activePlace.code),
        );
        if (matchingB) {
          ctx.save();
          ctx.beginPath();
          matchingB.points.forEach((pt, i) => {
            const sp = screen(pt.x, pt.z);
            i === 0 ? ctx.moveTo(sp.x, sp.y) : ctx.lineTo(sp.x, sp.y);
          });
          ctx.closePath();
          ctx.fillStyle = "rgba(207, 192, 150, 0.45)"; // USF Gold tint
          ctx.fill();
          ctx.strokeStyle = "#bc974d";
          ctx.lineWidth = 3.5;
          ctx.shadowColor = "rgba(188, 151, 77, 0.6)";
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Render Parking Garages Fullness Badges
      if (camera.scale > 0.65) {
        for (const garage of USF_PARKING_FACILITIES) {
          const gp = screen(garage.x, garage.z);
          if (
            gp.x < 10 ||
            gp.x > size.w - 10 ||
            gp.y < 80 ||
            gp.y > size.h - 40
          )
            continue;

          ctx.save();
          ctx.font = '700 9px "DM Sans",sans-serif';
          const label = `P  ${garage.shortName.replace(" Parking Facility", "").replace(" Parking Garage", "")}`;
          const textW = ctx.measureText(label).width + 16;

          ctx.fillStyle = "#fffdf7";
          ctx.shadowColor = "rgba(0,0,0,0.15)";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.roundRect(gp.x - textW / 2, gp.y - 12, textW, 20, 5);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Status dot
          ctx.beginPath();
          ctx.arc(gp.x - textW / 2 + 8, gp.y - 2, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#006747";
          ctx.fill();

          ctx.fillStyle = "#163c2c";
          ctx.textAlign = "left";
          ctx.fillText(label, gp.x - textW / 2 + 15, gp.y + 1);
          ctx.restore();
        }
      }

      // Render Bull Runner Shuttles (Passio GO Routes, Stops & Buses)
      if (shuttlesRef.current) {
        // Draw official Passio GO route path polylines
        for (const route of SHUTTLE_ROUTES) {
          if (!route.waypoints || route.waypoints.length < 2) continue;
          ctx.save();
          ctx.beginPath();
          const first = screen(route.waypoints[0].x, route.waypoints[0].z);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < route.waypoints.length; i++) {
            const pt = screen(route.waypoints[i].x, route.waypoints[i].z);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.strokeStyle = route.color;
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.restore();
        }

        // Official Stops
        for (const stop of SHUTTLE_STOPS) {
          const sp = screen(stop.x, stop.z);
          if (
            sp.x < -20 ||
            sp.x > size.w + 20 ||
            sp.y < -20 ||
            sp.y > size.h + 20
          )
            continue;

          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = "#006747";
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Active Buses (Live Passio GO AVL with Route Simulation Fallback)
        const liveBuses = liveBusesRef.current;
        if (liveBuses.length > 0) {
          // Render Real Live GPS Shuttles from Passio GO Live Feed
          liveBuses.forEach((bus) => {
            const bp = screen(bus.x, bus.z);
            if (
              bp.x >= -40 &&
              bp.x <= size.w + 40 &&
              bp.y >= -40 &&
              bp.y <= size.h + 40
            ) {
              ctx.save();
              ctx.translate(bp.x, bp.y);
              ctx.rotate(bus.heading);

              // Live vehicle beacon ring
              ctx.strokeStyle = "rgba(16, 185, 129, 0.45)";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, 22, 0, Math.PI * 2);
              ctx.stroke();

              // Bus shadow
              ctx.shadowColor = "rgba(0,0,0,0.35)";
              ctx.shadowBlur = 8;
              ctx.shadowOffsetY = 3;

              // Bus chassis (Route Color)
              ctx.fillStyle = bus.routeColor || "#006747";
              ctx.beginPath();
              ctx.roundRect(-10, -18, 20, 36, 4);
              ctx.fill();
              ctx.shadowBlur = 0;
              ctx.shadowOffsetY = 0;

              // Roof
              ctx.fillStyle = "#fff";
              ctx.fillRect(-7, -13, 14, 26);

              // Windshield
              ctx.fillStyle = "#26483f";
              ctx.fillRect(-7, -16, 14, 4);

              ctx.restore();

              // Live Bus Label
              ctx.font = '700 8px "DM Sans",sans-serif';
              ctx.fillStyle = "#004d35";
              ctx.textAlign = "center";
              ctx.fillText(bus.busNumber.toUpperCase(), bp.x, bp.y - 20);

              const paxText =
                bus.paxLoad !== undefined && bus.paxLoad > 0
                  ? ` • ${Math.round(bus.paxLoad)}% FULL`
                  : "";
              ctx.font = '800 7px "DM Sans",sans-serif';
              ctx.fillStyle = "#10b981";
              ctx.fillText(`Reported position${paxText}`, bp.x, bp.y - 11);
            }
          });
        }
      }

      // Render "My Parked Car" Pin
      const pCar = parkedCarRef.current;
      if (pCar) {
        const pCarScr = screen(pCar.x, pCar.z);

        // Parked Car Beacon Pin
        ctx.beginPath();
        ctx.arc(pCarScr.x, pCarScr.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#bc974d";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = '800 10px "DM Sans",sans-serif';
        const labelText = `[MY CAR] ${pCar.garageName}`;
        const w = ctx.measureText(labelText).width + 16;
        ctx.fillStyle = "#bc974d";
        ctx.beginPath();
        ctx.roundRect(pCarScr.x - w / 2, pCarScr.y - 30, w, 18, 4);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(labelText, pCarScr.x, pCarScr.y - 17);
      }

      // GPS Route Line & Waypoint Beacon (Navigating)
      if (navPlace && exploreRef.current) {
        const carScr = screen(car.x, car.z);
        const targetScr = screen(navPlace.x, navPlace.z);

        // Glowing GPS Path Line
        ctx.save();
        ctx.strokeStyle = "rgba(0, 103, 71, 0.75)";
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -(now / 25) % 28;
        ctx.beginPath();
        ctx.moveTo(carScr.x, carScr.y);
        ctx.lineTo(targetScr.x, targetScr.y);
        ctx.stroke();
        ctx.restore();

        // Pulsing Target Beacon
        const pulseR = 14 + Math.sin(beaconPulse) * 5;
        ctx.beginPath();
        ctx.arc(targetScr.x, targetScr.y, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(188, 151, 77, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(targetScr.x, targetScr.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#006747";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Target Code Badge
        ctx.font = '700 11px "DM Sans",sans-serif';
        const codeText = `[${navPlace.code}]`;
        const codeW = ctx.measureText(codeText).width + 12;
        ctx.fillStyle = "#006747";
        ctx.beginPath();
        ctx.roundRect(targetScr.x - codeW / 2, targetScr.y - 28, codeW, 19, 4);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(codeText, targetScr.x, targetScr.y - 14);
      }

      // Building labels when zoomed in
      if (camera.scale > 1.6) {
        ctx.font = '500 10px "DM Sans",sans-serif';
        ctx.textAlign = "center";
        for (const b of buildings) {
          const p = screen(b.x, b.z);
          if (p.x < 10 || p.x > size.w - 10 || p.y < 85 || p.y > size.h - 50)
            continue;
          if (places.some((l) => Math.hypot(l.x - b.x, l.z - b.z) < 55))
            continue;

          const hasCode = b.profile.code && b.name;
          const text = hasCode ? `[${b.profile.code}] ${b.label}` : b.label;
          const trimmed = text.length > 28 ? text.slice(0, 26) + "…" : text;

          ctx.fillStyle = "#fafbf0f0";
          ctx.fillRect(
            p.x - ctx.measureText(trimmed).width / 2 - 4,
            p.y - 8,
            ctx.measureText(trimmed).width + 8,
            15,
          );
          ctx.fillStyle = "#556450";
          ctx.fillText(trimmed, p.x, p.y + 3);
        }
      }

      // Curated Landmark Tour Tags
      tags = [];
      for (const place of [...places].sort(
        (a, b) => Number(b.id === selPlace?.id) - Number(a.id === selPlace?.id),
      )) {
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

        tags.push({ x: p.x - 22, y: p.y - 22, w: 44, h: 44, place });
        ctx.font = '600 11px "DM Sans",sans-serif';
        let label = `${place.code ? `[${place.code}] ` : ""}${place.short}`;
        const maxLabelWidth = size.w < 650 ? 180 : 220;
        if (ctx.measureText(label).width > maxLabelWidth) {
          while (ctx.measureText(label + "…").width > maxLabelWidth)
            label = label.slice(0, -1);
          label += "…";
        }
        const w = ctx.measureText(label).width + 24,
          x = p.x - w / 2,
          y = p.y - 38;
        // Keep selected labels first and suppress collisions at every viewport size.
        if (
          tags.some(
            (t) =>
              t.label &&
              x < t.x + t.w + 8 &&
              x + w + 8 > t.x &&
              y < t.y + 32 &&
              y + 32 > t.y,
          )
        )
          continue;

        ctx.fillStyle = "#fffef7";
        ctx.shadowColor = "#25483320";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(x, y, w, 25, 5);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#174c37";
        ctx.textAlign = "center";
        ctx.fillText(label, p.x, y + 16);
        tags.push({ x, y, w, h: 25, place, label: true });
      }

      // Render the Student Tour Car
      if (exploreRef.current) {
        const p = screen(car.x, car.z);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(car.heading);
        ctx.shadowColor = "#153c3460";
        ctx.shadowBlur = 7;
        ctx.shadowOffsetY = 4;

        // Chassis
        ctx.fillStyle = "#17352c";
        ctx.beginPath();
        ctx.roundRect(-9, -16, 18, 32, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // USF Green Body
        ctx.fillStyle = "#006747";
        ctx.beginPath();
        ctx.roundRect(-7, -15, 14, 29, 4);
        ctx.fill();

        // Gold racing roof strip
        ctx.fillStyle = "#cfc096";
        ctx.fillRect(-2, -15, 4, 29);

        // Windshield & Rear Window
        ctx.fillStyle = "#afded0";
        ctx.fillRect(-5, -8, 10, 6);
        ctx.fillStyle = "#123e36";
        ctx.fillRect(-5, 5, 10, 5);

        // Headlights (Warm Gold)
        ctx.fillStyle = "#fcebb6";
        ctx.fillRect(-6, -14, 3, 2);
        ctx.fillRect(3, -14, 3, 2);

        // Taillights
        ctx.fillStyle = "#e9a481";
        ctx.fillRect(-6, 12, 3, 2);
        ctx.fillRect(3, 12, 3, 2);
        ctx.restore();
      }
      if (userRef.current) {
        const pos = screen(userRef.current.x, userRef.current.z);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#2474d8";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      // Dynamic Tropical Florida Rain Streaks
      if (rainRef.current) {
        ctx.save();
        ctx.strokeStyle = "rgba(165, 195, 215, 0.55)";
        ctx.lineWidth = 1.6;
        for (const drop of rainDrops) {
          drop.y += drop.speed;
          drop.x += drop.speed * 0.25; // slanted wind
          if (drop.y > size.h) {
            drop.y = -drop.len;
            drop.x = Math.random() * size.w;
          }
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + drop.len * 0.25, drop.y + drop.len);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Scale bar
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
      if (seenRevision !== revision.current) {
        dirty = true;
        seenRevision = revision.current;
      }
      const cmd = control.current;

      if (cmd.id !== seen) {
        seen = cmd.id;
        dirty = true;
        if (cmd.kind === "zoomIn") zoom = Math.min(2.8, zoom * 1.3);
        if (cmd.kind === "zoomOut") zoom = Math.max(0.18, zoom / 1.3);
        if (cmd.kind === "overview") {
          overview = true;
          zoom = Math.min((size.w - 80) / W, (size.h - 130) / (H * 0.78));
          camera.x = (bounds.minX + bounds.maxX) / 2;
          camera.z = (bounds.minZ + bounds.maxZ) / 2;
        }
        if (cmd.kind === "focus" && (cmd.place || cmd.targetCoords)) {
          const target = cmd.place || cmd.targetCoords!;
          overview = true;
          camera.x = target.x;
          camera.z = target.z;
          zoom = 1.25;
        }
        if (cmd.kind === "follow") {
          overview = false;
          zoom = 1.05;
        }
        if (cmd.kind === "reset" || cmd.kind === "jump") {
          autoDriving = false;
          const targetCoords = cmd.targetCoords || cmd.place || places[0];
          car = { ...spawnNear(targetCoords), speed: 0 };
          overview = false;
          zoom = 1.05;
          camera.x = car.x;
          camera.z = car.z;
        }
        if (cmd.kind === "navigate") {
          overview = false;
          zoom = 1.1;
        }
        if (cmd.kind === "autodrive" && (cmd.place || cmd.targetCoords)) {
          autoDriving = true;
          autoTarget = cmd.targetCoords || cmd.place || null;
          overview = false;
          zoom = 1.1;
        }
      }

      // Autopilot guidance toward target
      let autoThrottle = 0;
      let autoSteer = 0;
      if (autoDriving && autoTarget) {
        const dx = autoTarget.x - car.x;
        const dz = autoTarget.z - car.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 18) {
          autoDriving = false;
          autoTarget = null;
        } else {
          const targetHeading = Math.atan2(dx, -dz);
          let diff = targetHeading - car.heading;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          autoSteer = Math.max(-1, Math.min(1, diff * 2.5));
          autoThrottle = Math.abs(diff) > 0.8 ? 0.35 : 0.75;
        }
      }

      const manualThrottle =
        Number(held.has("KeyW") || held.has("ArrowUp")) -
        Number(held.has("KeyS") || held.has("ArrowDown"));
      const manualSteer =
        Number(held.has("KeyD") || held.has("ArrowRight")) -
        Number(held.has("KeyA") || held.has("ArrowLeft"));

      if (manualThrottle !== 0 || manualSteer !== 0) {
        autoDriving = false;
      }

      const throttle = autoDriving ? autoThrottle : manualThrottle;
      const steer = autoDriving ? autoSteer : manualSteer;

      if (!pause.current && exploreRef.current) {
        const next = stepCar(
          car,
          { throttle, steer, brake: held.has("Space") },
          dt,
          bounds,
        );
        const travelled = Math.hypot(next.x - car.x, next.z - car.z);
        distance += travelled;
        dirty ||=
          travelled > 0 ||
          autoDriving ||
          targetRef.current !== null ||
          shuttlesRef.current ||
          rainRef.current;
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

      if (dirty || rainRef.current) {
        draw();
        dirty = false;
      }

      if (now - lastReport > 120) {
        lastReport = now;

        const navTarget = targetRef.current;
        let navDistance: number | undefined;
        let navAngle: number | undefined;

        if (navTarget) {
          const dx = navTarget.x - car.x;
          const dz = navTarget.z - car.z;
          navDistance = Math.hypot(dx, dz);
          navAngle = Math.atan2(dx, -dz) - car.heading;
        }

        callbacks.current.onTelemetry({
          speed: Math.abs(car.speed) * 2.23694,
          distance,
          overview,
          carPos: { x: car.x, z: car.z },
          navDistance,
          navAngle,
          isAutodriving: autoDriving,
          nearby: places.reduce((a, b) =>
            Math.hypot(a.x - car.x, a.z - car.z) <
            Math.hypot(b.x - car.x, b.z - car.z)
              ? a
              : b,
          ),
        });
      }
    };

    const activePointers = new Map<number, { x: number; y: number }>();
    let initialPinchDist: number | null = null;
    let initialScale: number = camera.scale;

    const down = (e: PointerEvent) => {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
      activePointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });

      if (activePointers.size === 1) {
        drag = {
          x: e.offsetX,
          y: e.offsetY,
          startX: e.offsetX,
          startY: e.offsetY,
        };
      } else if (activePointers.size === 2) {
        // Start two-finger pinch zoom
        const pts = Array.from(activePointers.values());
        initialPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        initialScale = camera.scale;
        drag = null;
      }
    };

    const move = (e: PointerEvent) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });

      // Two-finger pinch-to-zoom
      if (
        activePointers.size === 2 &&
        initialPinchDist &&
        initialPinchDist > 8
      ) {
        const pts = Array.from(activePointers.values());
        const currentDist = Math.hypot(
          pts[1].x - pts[0].x,
          pts[1].y - pts[0].y,
        );
        const factor = currentDist / initialPinchDist;
        const newScale = Math.min(2.8, Math.max(0.18, initialScale * factor));

        if (Math.abs(newScale - camera.scale) > 0.005) {
          overview = true;
          camera.scale = newScale;
          zoom = newScale;
          dirty = true;
        }
        return;
      }

      // Single-finger drag pan
      if (activePointers.size === 1 && drag) {
        if (Math.hypot(e.offsetX - drag.startX, e.offsetY - drag.startY) > 5) {
          overview = true;
          camera.x -= (e.offsetX - drag.x) / camera.scale;
          camera.z -= (e.offsetY - drag.y) / (camera.scale * 0.78);
          dirty = true;
        }
        drag.x = e.offsetX;
        drag.y = e.offsetY;
      }
    };

    const up = (e: PointerEvent) => {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}

      const wasSingle = activePointers.size === 1;
      activePointers.delete(e.pointerId);

      if (activePointers.size < 2) {
        initialPinchDist = null;
      }

      if (wasSingle && drag) {
        const click =
          Math.hypot(e.offsetX - drag.startX, e.offsetY - drag.startY) < 6;
        drag = null;
        if (!click) return;

        // Click on landmark tag
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

        // Click on any building footprint with a genuine real name (no made-up names)
        const p = point(e.offsetX, e.offsetY);
        const b = buildings.find((b) => inPolygon(p.x, p.z, b.points));
        if (
          b &&
          b.name &&
          b.name.trim() !== "" &&
          !/^(Building\s*\d+|Bldg\s*#?\d+|\d+)$/i.test(b.name)
        ) {
          callbacks.current.onBuildingSelect(b);
        }
      } else {
        drag = null;
      }
    };

    // Wheel and trackpad zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const nextScale = Math.min(
        2.8,
        Math.max(0.18, camera.scale * zoomFactor),
      );
      if (Math.abs(nextScale - camera.scale) > 0.005) {
        overview = true;
        camera.scale = nextScale;
        zoom = nextScale;
        dirty = true;
      }
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("wheel", onWheel);
      held.clear();
      map.width = 0;
      map.height = 0;
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="campus-map"
      aria-label="USF Tampa campus map. Drag to pan, pinch to zoom. Use Find a class for an accessible list of places."
      role="img"
    />
  );
}
