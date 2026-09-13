import { useEffect, useState } from "react";
import type { Map } from "maplibre-gl";
import { buildings, unproject } from "../data/explorer";

export default function GodsEyeView({ map }: { map: Map }) {
  const [expanded, setExpanded] = useState(
    () => !matchMedia("(max-width: 700px)").matches,
  );
  const [orbit, setOrbit] = useState(false);
  const [night, setNight] = useState(false);
  const [telemetry, setTelemetry] = useState("");
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setReduced(media.matches);
      if (media.matches) setOrbit(false);
    };
    media.addEventListener("change", change);
    const previous = {
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      zoom: map.getZoom(),
      center: map.getCenter(),
    };
    map.addSource("gods-eye-buildings", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: buildings
          .filter((b) => b.points.length >= 3)
          .map((b) => {
            const ring = b.points.map((p) => {
              const { lat, lon } = unproject(p.x, p.z);
              return [lon, lat];
            });
            if (
              ring[0][0] !== ring[ring.length - 1][0] ||
              ring[0][1] !== ring[ring.length - 1][1]
            )
              ring.push(ring[0]);
            return {
              type: "Feature",
              properties: { height: b.height },
              geometry: { type: "Polygon", coordinates: [ring] },
            };
          }),
      },
    });
    map.addLayer({
      id: "gods-eye-buildings",
      type: "fill-extrusion",
      source: "gods-eye-buildings",
      paint: {
        "fill-extrusion-color": "#8da99d",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-opacity": 0.88,
      },
    });
    map.easeTo({
      pitch: 60,
      bearing: -25,
      zoom: Math.max(map.getZoom(), 16),
      duration: media.matches ? 0 : 700,
    });
    const update = () => {
      const c = map.getCenter();
      setTelemetry(
        c.lat.toFixed(4) +
          "° N · " +
          Math.abs(c.lng).toFixed(4) +
          "° W · " +
          Math.round(map.getBearing()) +
          "° heading",
      );
    };
    update();
    map.on("moveend", update);
    return () => {
      media.removeEventListener("change", change);
      map.off("moveend", update);
      if (map.getLayer("gods-eye-buildings"))
        map.removeLayer("gods-eye-buildings");
      if (map.getSource("gods-eye-buildings"))
        map.removeSource("gods-eye-buildings");
      map.getContainer().classList.remove("night-map");
      map.stop();
      map.jumpTo(previous);
    };
  }, [map]);
  useEffect(() => {
    const layer = map.getLayer("gods-eye-buildings");
    if (layer)
      map.setPaintProperty(
        layer.id,
        "fill-extrusion-color",
        night ? "#50bbaa" : "#8da99d",
      );
  }, [night, map]);
  useEffect(() => {
    if (!orbit || reduced) return;
    let frame = 0,
      previous = 0;
    const step = (time: number) => {
      if (!document.hidden && previous)
        map.rotateTo(map.getBearing() + Math.min(time - previous, 50) * 0.004, {
          duration: 0,
        });
      previous = time;
      frame = requestAnimationFrame(step);
    };
    const stop = () => setOrbit(false);
    frame = requestAnimationFrame(step);
    map.on("dragstart", stop);
    map.on("zoomstart", stop);
    // Selecting a building or bus interrupts the automatic camera.
    map.getContainer().addEventListener("pointerdown", stop);
    return () => {
      cancelAnimationFrame(frame);
      map.off("dragstart", stop);
      map.off("zoomstart", stop);
      map.getContainer().removeEventListener("pointerdown", stop);
    };
  }, [orbit, reduced, map]);
  return (
    <section
      className={"gods-eye-hud" + (night ? " night-active" : "")}
      aria-label="God’s eye controls"
    >
      <div>
        <span className="eyebrow">GOD’S EYE · USF TAMPA</span>
        <p className="gods-eye-telemetry">{telemetry}</p>
      </div>
      <button
        className="hud-disclosure"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Hide camera controls" : "Camera controls"}
      </button>
      {expanded && (
        <>
          <div className="gods-eye-actions">
            <button
              aria-pressed={orbit}
              disabled={reduced}
              onClick={() => setOrbit(!orbit)}
            >
              {orbit ? "Stop orbit" : "Orbit campus"}
            </button>
            <button
              aria-pressed={night}
              onClick={() => {
                setNight(!night);
                map.getContainer().classList.toggle("night-map", !night);
              }}
            >
              Night style
            </button>
            <button
              onClick={() => {
                setOrbit(false);
                map.easeTo({
                  bearing: 0,
                  pitch: 60,
                  duration: reduced ? 0 : 300,
                });
              }}
            >
              North up
            </button>
          </div>
          <p className="gods-eye-note">
            3D footprint view · heights approximate. Tap a bus to follow it.
          </p>
          <a
            href="https://github.com/bilawalsidhu/gods-eye-view"
            target="_blank"
            rel="noreferrer"
          >
            Inspired by God’s Eye View ↗
          </a>
        </>
      )}
    </section>
  );
}
