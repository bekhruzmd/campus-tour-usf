import { useEffect, useRef, useState } from "react";
import { Marker, Popup, type Map } from "maplibre-gl";
import {
  fetchLiveBullRunnerPositions,
  SHUTTLE_ROUTES,
  SHUTTLE_STOPS,
} from "../data/usfShuttle";
import { unproject } from "../data/explorer";

export default function LiveBusLayer({
  map,
  trackingEnabled = false,
}: {
  map: Map;
  trackingEnabled?: boolean;
}) {
  const [tracked, setTracked] = useState("");
  const trackedRef = useRef("");
  const enabled = useRef(trackingEnabled);
  enabled.current = trackingEnabled;
  useEffect(() => {
    if (!trackingEnabled) {
      trackedRef.current = "";
      setTracked("");
    }
  }, [trackingEnabled]);
  useEffect(() => {
    const stop = () => {
      trackedRef.current = "";
      setTracked("");
    };
    map.on("dragstart", stop);
    return () => {
      map.off("dragstart", stop);
    };
  }, [map]);
  const [status, setStatus] = useState("Checking bus locations…");
  useEffect(() => {
    let mounted = true;
    let polling = false;
    const markers = new globalThis.Map<string, Marker>();
    const popups: Popup[] = [];
    const xy = (p: { x: number; z: number }) => {
      const { lat, lon } = unproject(p.x, p.z);
      return [lon, lat];
    };
    map.addSource("bull-runner-routes", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: SHUTTLE_ROUTES.map((route) => ({
          type: "Feature",
          properties: { color: route.color },
          geometry: {
            type: "LineString",
            coordinates: route.waypoints.map(xy),
          },
        })),
      },
    });
    map.addLayer({
      id: "bull-runner-routes",
      type: "line",
      source: "bull-runner-routes",
      paint: {
        "line-color": ["get", "color"],
        "line-width": 3,
        "line-opacity": 0.65,
      },
      layout: { "line-join": "round", "line-cap": "round" },
    });
    map.addSource("bull-runner-stops", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: SHUTTLE_STOPS.map((stop) => ({
          type: "Feature",
          properties: { name: stop.name },
          geometry: {
            type: "Point",
            coordinates: [stop.longitude, stop.latitude],
          },
        })),
      },
    });
    map.addLayer({
      id: "bull-runner-stops",
      type: "circle",
      source: "bull-runner-stops",
      paint: {
        "circle-radius": 4,
        "circle-color": "#fff",
        "circle-stroke-color": "#006747",
        "circle-stroke-width": 2,
      },
    });
    const poll = async () => {
      if (!mounted || polling || document.hidden) return;
      polling = true;
      try {
        const result = await fetchLiveBullRunnerPositions();
        if (!mounted) return;
        setStatus(result.status.statusText);
        if (
          trackedRef.current &&
          !result.buses.some((b) => b.id === trackedRef.current)
        ) {
          trackedRef.current = "";
          setTracked("");
        }
        const ids = new Set(result.buses.map((bus) => bus.id));
        for (const [id, marker] of markers)
          if (!ids.has(id)) {
            marker.remove();
            markers.delete(id);
          }
        for (const bus of result.buses) {
          const route = SHUTTLE_ROUTES.find((r) => r.id === bus.routeId);
          const label = `Bus ${bus.busNumber} · ${route?.name || "Route unavailable"}`;
          let marker = markers.get(bus.id);
          if (!marker) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "live-bus-pin";
            button.addEventListener("click", () => {
              if (!enabled.current) return;
              trackedRef.current = bus.id;
              setTracked(bus.busNumber);
              const current = markers.get(bus.id)?.getLngLat();
              if (current)
                map.easeTo({
                  center: current,
                  duration: matchMedia("(prefers-reduced-motion: reduce)")
                    .matches
                    ? 0
                    : 400,
                });
            });
            marker = new Marker({ element: button })
              .setLngLat(xy(bus) as [number, number])
              .addTo(map);
            const popup = new Popup({ offset: 26 }).setText(label);
            popups.push(popup);
            marker.setPopup(popup);
            markers.set(bus.id, marker);
          }
          const button = marker.getElement();
          button.textContent = "BUS " + bus.busNumber;
          button.setAttribute("aria-label", label);
          button.title = label;
          marker
            .getPopup()
            ?.setText(
              label +
                (bus.lastUpdated
                  ? " · Feed timestamp: " + bus.lastUpdated
                  : " · Feed timestamp unavailable"),
            );
          marker.setLngLat(xy(bus) as [number, number]);
          if (enabled.current && trackedRef.current === bus.id)
            map.easeTo({
              center: xy(bus) as [number, number],
              duration: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? 0
                : 500,
            });
        }
      } finally {
        polling = false;
      }
    };
    void poll();
    const interval = setInterval(() => void poll(), 12000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", poll);
      markers.forEach((m) => m.remove());
      popups.forEach((p) => p.remove());
      for (const id of ["bull-runner-stops", "bull-runner-routes"]) {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
      }
    };
  }, [map]);
  return (
    <div className="live-bus-status" role="status">
      <span className="eyebrow">BULL RUNNER · PASSIO GO</span>
      <span>{status}</span>
      {tracked && (
        <button
          onClick={() => {
            trackedRef.current = "";
            setTracked("");
          }}
        >
          Following bus {tracked} · Stop
        </button>
      )}
    </div>
  );
}
