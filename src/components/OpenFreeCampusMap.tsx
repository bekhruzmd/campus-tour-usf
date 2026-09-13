import { lazy, Suspense, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
maplibregl.setWorkerUrl(workerUrl);
import { searchablePlaces, unproject, type Place } from "../data/explorer";
import type { MapCommand } from "../ExplorerMap";
import type { ParkedCarRecord } from "../data/usfParking";

const GodsEyeView = lazy(() => import("./GodsEyeView"));
const LiveBusLayer = lazy(() => import("./LiveBusLayer"));

type XY = { x: number; z: number };
const coordinates = (p: XY): [number, number] => {
  const { lat, lon } = unproject(p.x, p.z);
  return [lon, lat];
};
export default function OpenFreeCampusMap({
  godsEye = false,
  command,
  selectedPlace,
  userPosition,
  parkedCar,
  onSelect,
  onFallback,
}: {
  godsEye?: boolean;
  command: MapCommand;
  selectedPlace: Place | null;
  userPosition?: XY;
  parkedCar: ParkedCarRecord | null;
  onSelect: (p: Place) => void;
  onFallback: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const callback = useRef(onSelect);
  callback.current = onSelect;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let instance: maplibregl.Map;
    let loaded = false;
    const markers: maplibregl.Marker[] = [];
    let observer: ResizeObserver | undefined;
    const timeout = setTimeout(() => {
      if (!loaded) setError("The map is taking too long to load.");
    }, 15000);
    try {
      instance = new maplibregl.Map({
        container: container.current!,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [-82.4139, 28.0618],
        zoom: 15.6,
        maxBounds: [
          [-82.45, 28.025],
          [-82.38, 28.095],
        ],
        minZoom: 13,
        maxZoom: 20,
        attributionControl: { compact: true },
      });
      map.current = instance;
      instance.on("load", () => {
        loaded = true;
        clearTimeout(timeout);
        setError("");
        setReady(true);
        // Use our campus-directory pins for place labels; retain road and geographic labels.
        for (const layer of instance.getStyle().layers) {
          if (layer.type === "symbol" && layer["source-layer"] === "poi")
            instance.setLayoutProperty(layer.id, "visibility", "none");
        }
        for (const place of searchablePlaces.filter((p) => p.codeVerified)) {
          const button = document.createElement("button");
          button.className = "campus-map-pin";
          button.type = "button";
          button.textContent = place.code;
          button.setAttribute("aria-label", place.code + " · " + place.name);
          button.title = place.name;
          button.addEventListener("click", () => callback.current(place));
          markers.push(
            new maplibregl.Marker({ element: button })
              .setLngLat(coordinates(place))
              .addTo(instance),
          );
        }
      });
      instance.on("error", () =>
        setError(
          "Some map content couldn’t load. Check your connection or use the campus map.",
        ),
      );
      observer = new ResizeObserver(() => instance.resize());
      observer.observe(container.current!);
    } catch {
      clearTimeout(timeout);
      setError(
        "This browser couldn’t open the interactive map. Use the campus map instead.",
      );
    }
    return () => {
      clearTimeout(timeout);
      observer?.disconnect();
      markers.forEach((m) => m.remove());
      instance?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 300;
    if (command.kind === "zoomIn") m.zoomIn({ duration });
    if (command.kind === "zoomOut") m.zoomOut({ duration });
    if (command.kind === "overview")
      m.fitBounds(
        [
          [-82.428, 28.054],
          [-82.401, 28.07],
        ],
        { padding: 45, duration },
      );
    if (["focus", "jump", "follow"].includes(command.kind)) {
      const point = command.place || command.targetCoords;
      m.easeTo({
        center: point ? coordinates(point) : [-82.4139, 28.0618],
        zoom: point ? 17.8 : 15.6,
        duration,
      });
    }
  }, [command, ready]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const markers: maplibregl.Marker[] = [];
    for (const [point, label, color] of [
      [selectedPlace, selectedPlace?.name, "#006747"],
      [userPosition, "Your located position", "#2875e8"],
      [parkedCar, "Your saved car", "#ad6516"],
    ] as const) {
      if (!point) continue;
      const marker = new maplibregl.Marker({ color })
        .setLngLat(coordinates(point))
        .addTo(map.current);
      marker.getElement().setAttribute("aria-label", label || "Selected place");
      marker.getElement().setAttribute("title", label || "Selected place");
      markers.push(marker);
    }
    return () => markers.forEach((m) => m.remove());
  }, [ready, selectedPlace, userPosition, parkedCar]);
  return (
    <div className={"free-map-shell" + (godsEye ? " gods-eye-map" : "")}>
      <div
        className="free-map-canvas"
        ref={container}
        aria-label="USF Tampa map powered by OpenFreeMap"
      />
      {ready && map.current && (
        <Suspense fallback={null}>
          <LiveBusLayer map={map.current} trackingEnabled={godsEye} />
          {godsEye && <GodsEyeView map={map.current} />}
        </Suspense>
      )}
      {(error || !ready) && (
        <div className="map-unavailable" role="status">
          <h3>{error || "Opening campus map…"}</h3>
          <button className="secondary" onClick={onFallback}>
            Use campus map
          </button>
        </div>
      )}
    </div>
  );
}
