import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Camera,
  ChevronRight,
  Compass,
  Flag,
  LocateFixed,
  Map,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import ExplorerMap, {
  held,
  type MapCommand,
  type Telemetry,
} from "./ExplorerMap";
import { places, type Place } from "./data/explorer";
export default function App() {
  const [selected, setSelected] = useState<Place | null>(places[0]),
    [paused, setPaused] = useState(false),
    [help, setHelp] = useState(false),
    [building, setBuilding] = useState(""),
    [photoFailed, setPhotoFailed] = useState(false),
    [command, setCommand] = useState<MapCommand>({ kind: "follow", id: 0 }),
    [telemetry, setTelemetry] = useState<Telemetry>({
      speed: 0,
      distance: 0,
      nearby: places[0],
      overview: false,
    });
  const act = (kind: MapCommand["kind"], place?: Place) =>
    setCommand((c) => ({ kind, place, id: c.id + 1 }));
  const select = (p: Place) => {
    setSelected(p);
    setPhotoFailed(false);
    setBuilding("");
  };
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,select,textarea")) return;
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      held.add(e.code);
      if (e.repeat) return;
      if (e.code === "KeyP") setPaused((p) => !p);
      if (e.code === "KeyR") act("reset");
      if (e.code === "KeyM") act("overview");
      if (e.code === "Escape") setHelp(false);
    };
    const up = (e: KeyboardEvent) => held.delete(e.code);
    const blur = () => held.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      held.clear();
    };
  }, []);
  return (
    <main>
      <ExplorerMap
        command={command}
        paused={paused || help}
        onTelemetry={setTelemetry}
        onSelect={select}
        onBuilding={(name) => {
          setBuilding(name);
          setSelected(null);
        }}
      />
      <header>
        <a className="brand" href="/" aria-label="USF Campus Tour home">
          <span className="brand-mark">
            U<span>↗</span>
          </span>
          <div>
            <strong>
              campus<span>tour</span>
            </strong>
            <small>UNIVERSITY OF SOUTH FLORIDA</small>
          </div>
        </a>
        <div className="header-center">
          <span className="status-dot" /> TAMPA CAMPUS{" "}
          <span className="header-divider">/</span> DRONE VIEW
        </div>
        <button className="help-button" onClick={() => setHelp(true)}>
          How to drive <span>?</span>
        </button>
      </header>
      <aside className="tour-panel">
        <span className="eyebrow">A LITTLE CAMPUS ADVENTURE</span>
        <h1>
          Take the
          <br />
          scenic route.
        </h1>
        <p>
          Four wheels. A bird’s-eye view.
          <br />
          Make yourself at home.
        </p>
        <div className="panel-divider" />
        <div className="stops-heading">
          <span>PLACES TO DISCOVER</span>
          <span>0{places.length}</span>
        </div>
        <nav aria-label="Campus landmarks">
          {places.map((p, i) => (
            <button
              className={`stop ${selected?.id === p.id ? "selected" : ""}`}
              key={p.id}
              onClick={() => select(p)}
            >
              <span className="stop-number">0{i + 1}</span>
              <span>
                <strong>{p.short}</strong>
                <small>{p.category}</small>
              </span>
              <ChevronRight size={15} />
            </button>
          ))}
        </nav>
        <button className="overview-button" onClick={() => act("overview")}>
          <Map size={17} /> See the whole campus <ArrowUpRight size={16} />
        </button>
        <div className="tiny-note">Built for wandering, not rushing.</div>
      </aside>
      <div className="compass">
        <Compass size={24} />
        <span>NORTH UP</span>
      </div>
      <div className="map-tools">
        <button aria-label="Zoom in" onClick={() => act("zoomIn")}>
          <Plus size={19} />
        </button>
        <button aria-label="Zoom out" onClick={() => act("zoomOut")}>
          <Minus size={19} />
        </button>
        <span />
        <button
          aria-label="Follow my car"
          title="Follow my car"
          onClick={() => act("follow")}
        >
          <LocateFixed size={19} />
        </button>
      </div>
      <div className="drive-hud">
        <div className="speed">
          <strong>
            {Math.round(telemetry.speed).toString().padStart(2, "0")}
          </strong>
          <span>MPH</span>
        </div>
        <div className="hud-divider" />
        <div className="drive-status">
          <span>
            {paused
              ? "TAKING A BREAK"
              : telemetry.overview
                ? "EXPLORING THE MAP"
                : "FREE ROAM"}
          </span>
          <strong>{telemetry.nearby.short}</strong>
        </div>
        <button
          aria-label={paused ? "Resume driving" : "Pause driving"}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <Play size={17} /> : <Pause size={17} />}
        </button>
        <button aria-label="Reset car" onClick={() => act("reset")}>
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="keyboard-hint">
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd>
        <span>drive</span>
        <i />
        <kbd>SPACE</kbd>
        <span>brake</span>
        <i />
        <span>drag map to look around</span>
      </div>
      {selected && (
        <article className="photo-card">
          <div className="photo-wrap">
            {!photoFailed ? (
              <img
                key={selected.id}
                src={selected.photo}
                alt={`${selected.name} — official USF photograph`}
                loading="lazy"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div className="photo-fallback">
                <Camera />
                <span>Photo unavailable</span>
                <a href={selected.source} target="_blank" rel="noreferrer">
                  View on USF’s website ↗
                </a>
              </div>
            )}
            <span className="photo-badge">
              <Camera size={12} /> A CLOSER LOOK
            </span>
            <button
              className="close-photo"
              aria-label="Close building card"
              onClick={() => setSelected(null)}
            >
              <X size={15} />
            </button>
          </div>
          <div className="photo-content">
            <span className="eyebrow">{selected.category}</span>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <div className="card-actions">
              <button
                onClick={() => {
                  act("jump", selected);
                  setPaused(false);
                }}
              >
                <Flag size={15} /> Start here <ArrowUpRight size={15} />
              </button>
              <a href={selected.source} target="_blank" rel="noreferrer">
                Photo: USF ↗
              </a>
            </div>
          </div>
        </article>
      )}
      {building && (
        <article className="building-card">
          <button
            aria-label="Close building information"
            onClick={() => setBuilding("")}
          >
            <X size={16} />
          </button>
          <span className="eyebrow">CAMPUS FOOTPRINT</span>
          <h2>{building}</h2>
          <p>
            {building.startsWith("Building ")
              ? "This footprint has no name in our map data yet."
              : "Building name from OpenStreetMap."}{" "}
            Photo cards are available for the highlighted tour stops.
          </p>
        </article>
      )}
      <footer>
        <span>
          <span className="status-dot" /> LIGHTWEIGHT EXPLORER <i /> No live 3D
          streaming
        </span>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          Map © OpenStreetMap contributors
        </a>
      </footer>
      <div className="touch-controls">
        {[
          ["KeyA", "←"],
          ["KeyW", "↑"],
          ["KeyS", "↓"],
          ["KeyD", "→"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-label={
              key === "KeyW"
                ? "Accelerate"
                : key === "KeyS"
                  ? "Reverse"
                  : "Steer " + label
            }
            onPointerDown={(e) => {
              held.add(key);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerUp={() => held.delete(key)}
            onPointerCancel={() => held.delete(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Driving controls"
            className="help-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close controls"
              onClick={() => setHelp(false)}
              autoFocus
            >
              <X />
            </button>
            <span className="eyebrow">THE CAMPUS IS YOURS</span>
            <h2>Just a little joyride.</h2>
            <p>
              Use WASD or the arrow keys to drive. S slows you down, then
              reverses. Space brakes, P pauses, and R brings you back to the
              library.
            </p>
            <p>
              Drag to explore the map. Click a building tag to learn more, or
              choose <strong>Start here</strong> to jump to a tour stop. The
              target button brings the camera back to your car.
            </p>
            <small>
              Prototype: roads and footprints are real; driving is playful.
              Building collisions and precise routing are intentionally omitted.
            </small>
          </section>
        </div>
      )}
    </main>
  );
}
