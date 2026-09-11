import { useEffect, useRef } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  Map,
  SlidersHorizontal,
  CircleHelp,
  ArrowUpRight,
  Navigation,
  Camera,
  X,
  Sun,
  ChevronDown,
  LocateFixed,
} from "lucide-react";
import { useSim, sim, keys } from "../lib/store";
import { landmarks } from "../data/campus";
import { Minimap } from "./Minimap";
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button aria-label="Close" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Hud() {
  const s = useSim();
  const spawn = (id: string) =>
    sim.set({
      destination: id,
      reset: s.reset + 1,
      paused: false,
      mapOpen: false,
    });
  return (
    <div className="hud">
      <header>
        <div className="brand">
          <span className="usf-mark">
            USF
            <span>
              UNIVERSITY OF
              <br />
              SOUTH FLORIDA
            </span>
          </span>
          <i />
          <div>
            <h1>Campus Drive</h1>
            <span>TAMPA, FLORIDA</span>
          </div>
        </div>
        <div className="top-actions">
          <div className="weather">
            <Sun size={18} />
            <span>
              Late afternoon <small>28.0587° N, 82.4139° W</small>
            </span>
          </div>
          <button
            className={s.help ? "active" : ""}
            title="Driving controls"
            aria-label="Driving controls"
            onClick={() => sim.set({ help: true })}
          >
            <CircleHelp size={19} />
          </button>
          <button
            aria-label="Simulation settings"
            title="Simulation settings"
            onClick={() => sim.set({ settings: true })}
          >
            <SlidersHorizontal size={19} />
          </button>
        </div>
      </header>
      <div className="location-card">
        <div className="eyebrow">
          <span className="location-dot" /> EXPLORING CAMPUS
        </div>
        <h2>{s.zone}</h2>
        <div className="location-road">
          <Navigation size={13} />
          {s.road}
        </div>
      </div>
      <div className="view-controls">
        <button
          aria-label="Change camera"
          title="Change camera (C)"
          onClick={() =>
            sim.set({ camera: s.camera === "chase" ? "wide" : "chase" })
          }
        >
          <Camera size={18} />
        </button>
        <button
          aria-label="Reset vehicle"
          title="Reset vehicle (R)"
          onClick={() => sim.set({ reset: s.reset + 1 })}
        >
          <RotateCcw size={18} />
        </button>
        <button
          aria-label={s.paused ? "Resume driving" : "Pause driving"}
          title="Pause (P)"
          onClick={() => sim.set({ paused: !s.paused })}
        >
          {s.paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
      </div>
      <div className="mode-pill">
        <span className={s.tileStatus === "live" ? "live-dot" : "demo-dot"} />
        {s.tileStatus === "live"
          ? "GOOGLE PHOTOREALISTIC 3D"
          : s.tileStatus === "loading"
            ? "CONNECTING TO GOOGLE 3D…"
            : s.tileStatus === "error"
              ? "TILES UNAVAILABLE · SCHEMATIC MODE"
              : "OSM CAMPUS · SCHEMATIC MODE"}
      </div>
      <div className="bottom-left">
        <div className="speed-panel">
          <div className="speed-main">
            <span className="gear">{s.gear}</span>
            <strong>{Math.round(s.speed).toString().padStart(2, "0")}</strong>
            <span className="speed-unit">MPH</span>
            <div className="speed-meter">
              <span
                style={{ height: `${Math.max(5, (s.speed / 60) * 100)}%` }}
              />
            </div>
          </div>
          <div className="speed-bottom">
            <span>FREE DRIVE</span>
            <span>{(s.distance / 1609.344).toFixed(2)} mi</span>
          </div>
        </div>
        <div className="drive-controls">
          <span>
            <kbd>W</kbd>
            <span className="wasd">
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd>
            </span>
          </span>
          <span>Drive</span>
          <i />
          <kbd className="space">SPACE</kbd>
          <span>Handbrake</span>
        </div>
      </div>
      <div className="destination">
        <span className="destination-icon">
          <LocateFixed size={19} />
        </span>
        <div>
          <label htmlFor="destination">JUMP TO A LANDMARK</label>
          <select
            id="destination"
            value={s.destination}
            onChange={(e) => spawn(e.target.value)}
          >
            {landmarks.map((l) => (
              <option value={l.id} key={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <ChevronDown size={16} />
      </div>
      <Minimap />
      <footer>
        <span>
          USF TAMPA CAMPUS <i /> INTERACTIVE EXPLORATION
        </span>
        <div>
          {s.tileStatus === "live" && (
            <>
              <strong>Google Maps</strong>
              <span>{s.credits}</span>
            </>
          )}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors
          </a>
        </div>
      </footer>
      {s.paused && !s.help && !s.settings && !s.mapOpen && (
        <div className="pause-shade">
          <div className="pause-card">
            <span>TAKE A MOMENT</span>
            <h2>Campus can wait.</h2>
            <p>Your drive is paused.</p>
            <button
              className="primary-button"
              onClick={() => sim.set({ paused: false })}
            >
              <Play size={17} /> Resume drive
            </button>
            <small>or press P</small>
          </div>
        </div>
      )}
      {s.help && (
        <Modal
          title="Make yourself at home."
          onClose={() => sim.set({ help: false })}
        >
          <p>Explore the Tampa campus at your own pace.</p>
          <div className="control-list">
            {[
              ["W / ↑", "Accelerate"],
              ["S / ↓", "Brake, then reverse"],
              ["A D / ← →", "Steer"],
              ["Space", "Handbrake"],
              ["Drag mouse", "Look around"],
              ["C", "Change camera distance"],
              ["R", "Reset at selected landmark"],
              ["M", "Campus map"],
              ["P / Esc", "Pause / resume"],
            ].map(([key, label]) => (
              <div key={key}>
                <kbd>{key}</kbd>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <p className="muted">
            Desktop keyboard recommended. Road elevations in schematic mode are
            simplified.
          </p>
        </Modal>
      )}
      {s.settings && (
        <Modal
          title="Your drive, your view."
          onClose={() => sim.set({ settings: false })}
        >
          <label className="setting">
            Tile detail
            <select
              value={s.quality}
              onChange={(e) =>
                sim.set({ quality: e.target.value as "balanced" | "high" })
              }
            >
              <option value="balanced">Balanced · 8 px error</option>
              <option value="high">High · 3 px error</option>
            </select>
          </label>
          <label className="setting">
            Chase camera
            <select
              value={s.camera}
              onChange={(e) =>
                sim.set({ camera: e.target.value as "chase" | "wide" })
              }
            >
              <option value="chase">Close</option>
              <option value="wide">Wide</option>
            </select>
          </label>
          <div className="data-note">
            <h3>
              {s.tileStatus === "live"
                ? "Google 3D connected"
                : "Real geography. Schematic buildings."}
            </h3>
            <p>
              The fallback uses OpenStreetMap footprints and roads. Building
              heights and greenery are illustrative.
            </p>
            <p>
              For photorealistic imagery, set{" "}
              <code>VITE_GOOGLE_MAPS_API_KEY</code> or a Cesium ion token in the
              project environment and restart the app.
            </p>
          </div>
        </Modal>
      )}
      {s.mapOpen && (
        <Modal
          title="Find your next stop."
          onClose={() => sim.set({ mapOpen: false })}
        >
          <Minimap expanded />
          <div className="landmark-list">
            {landmarks.map((l) => (
              <button key={l.id} onClick={() => spawn(l.id)}>
                <span>
                  {l.name}
                  <small>{l.category}</small>
                </span>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      <div className="touch-controls">
        {[
          ["KeyA", "←"],
          ["KeyW", "↑"],
          ["KeyS", "↓"],
          ["KeyD", "→"],
        ].map(([code, label]) => (
          <button
            key={code}
            aria-label={
              code === "KeyW"
                ? "Accelerate"
                : code === "KeyS"
                  ? "Brake or reverse"
                  : code === "KeyA"
                    ? "Steer left"
                    : "Steer right"
            }
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              keys.add(code);
            }}
            onPointerUp={() => keys.delete(code)}
            onPointerCancel={() => keys.delete(code)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
