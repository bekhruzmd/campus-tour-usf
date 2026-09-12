import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Compass,
  LocateFixed,
  Map,
  Minus,
  Navigation,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
  ChevronRight,
  Car,
  CloudRain,
  Sun,
  ShieldAlert,
  Clock,
  Zap,
} from "lucide-react";
import ExplorerMap, {
  held,
  type MapCommand,
  type Telemetry,
} from "./ExplorerMap";
import {
  places,
  buildingToPlace,
  type Place,
  type ProjectedBuilding,
} from "./data/explorer";
import type { BuildingCategory } from "./data/usfBuildings";
import { loadParkedCar, type ParkedCarRecord } from "./data/usfParking";
import { fetchTampaCampusWeather, getTampaDefaultWeather, type USFWeatherData } from "./data/usfWeather";
import SearchOverlay from "./components/SearchOverlay";
import BuildingCard from "./components/BuildingCard";
import CommuterCommandCenter from "./components/CommuterCommandCenter";

const SIDEBAR_CATEGORIES: { label: string; value: BuildingCategory | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Academics", value: "Academics" },
  { label: "Dining", value: "Student Life & Dining" },
  { label: "Housing", value: "Housing & Dorms" },
  { label: "Athletics", value: "Athletics & Rec" },
  { label: "Health", value: "Health & Medicine" },
  { label: "Services", value: "Services & Admin" },
];

export default function App() {
  const [selected, setSelected] = useState<Place | null>(places[0]);
  const [navigating, setNavigating] = useState<{ x: number; z: number; name: string; code: string } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCommuterOpen, setIsCommuterOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BuildingCategory | "All">("All");
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);

  // Commuter Feature States
  const [showShuttles, setShowShuttles] = useState(true);
  const [rainMode, setRainMode] = useState(false);
  const [parkedCar, setParkedCar] = useState<ParkedCarRecord | null>(() => loadParkedCar());
  const [weather, setWeather] = useState<USFWeatherData>(getTampaDefaultWeather());

  const [command, setCommand] = useState<MapCommand>({ kind: "follow", id: 0 });
  const [telemetry, setTelemetry] = useState<Telemetry>({
    speed: 0,
    distance: 0,
    nearby: places[0],
    overview: false,
    carPos: { x: places[0].x, z: places[0].z },
  });

  const act = (kind: MapCommand["kind"], place?: Place, targetCoords?: { x: number; z: number; name?: string; code?: string }) =>
    setCommand((c) => ({ kind, place, targetCoords, id: c.id + 1 }));

  const selectPlace = (p: Place) => {
    setSelected(p);
  };

  const handleBuildingSelect = (b: ProjectedBuilding) => {
    const place = buildingToPlace(b);
    setSelected(place);
  };

  const handleSearchSelect = (
    place: Place,
    action?: "view" | "navigate" | "teleport"
  ) => {
    setSelected(place);
    if (action === "navigate") {
      setNavigating({ x: place.x, z: place.z, name: place.name, code: place.code });
      act("navigate", place);
      setPaused(false);
    } else if (action === "teleport") {
      act("jump", place);
      setNavigating(null);
      setPaused(false);
    }
  };

  const handleStartHere = (p: Place) => {
    act("jump", p);
    setNavigating(null);
    setPaused(false);
  };

  const handleNavigate = (p: Place) => {
    if (navigating?.code === p.code) {
      setNavigating(null);
    } else {
      setNavigating({ x: p.x, z: p.z, name: p.name, code: p.code });
      act("navigate", p);
      setPaused(false);
    }
  };

  const handleAutoDrive = (p: Place) => {
    setNavigating({ x: p.x, z: p.z, name: p.name, code: p.code });
    act("autodrive", p);
    setPaused(false);
  };

  const handleCommuterNavigate = (target: { x: number; z: number; name: string; code: string }) => {
    setNavigating(target);
    act("navigate", undefined, target);
    setPaused(false);
  };

  const handleCommuterJump = (target: { x: number; z: number; name: string }) => {
    act("jump", undefined, target);
    setNavigating(null);
    setPaused(false);
  };

  const filteredPlaces = places.filter(
    (p) => activeCategory === "All" || p.category === activeCategory
  );

  // Initial weather load
  useEffect(() => {
    fetchTampaCampusWeather()
      .then((w) => {
        setWeather(w);
        if (w.conditionCategory === "rainy" || w.conditionCategory === "stormy") {
          setRainMode(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,select,textarea")) return;
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code
        )
      )
        e.preventDefault();

      held.add(e.code);
      if (e.repeat) return;
      if (e.code === "KeyP") setPaused((p) => !p);
      if (e.code === "KeyR") {
        act("reset");
        setNavigating(null);
      }
      if (e.code === "KeyM") act("overview");
      if (e.code === "KeyC") setIsCommuterOpen(true);
      if (e.code === "KeyF" || (e.metaKey && e.code === "KeyK")) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.code === "Escape") {
        setHelp(false);
        setIsSearchOpen(false);
        setIsCommuterOpen(false);
      }
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
        paused={paused || help || isSearchOpen || isCommuterOpen}
        selectedPlace={selected}
        navigatingPlace={navigating}
        showShuttles={showShuttles}
        rainMode={rainMode}
        parkedCar={parkedCar}
        onTelemetry={setTelemetry}
        onSelect={selectPlace}
        onBuildingSelect={handleBuildingSelect}
      />

      {/* Top Header */}
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

        {/* Search Bar in Header */}
        <button
          className="header-search-trigger"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Search USF buildings, codes, and rooms"
        >
          <Search size={16} />
          <span className="search-placeholder">
            Search buildings, codes (e.g. LIB, MSC, CPR), rooms...
          </span>
          <kbd className="search-shortcut">⌘K</kbd>
        </button>

        <div className="header-right-actions">
          {/* Live Weather Widget Pill */}
          <button
            className={`header-weather-pill ${weather.isStormAlert ? "storm-alert" : ""}`}
            onClick={() => setIsCommuterOpen(true)}
            title="Tampa campus weather & rain alerts. Click for Commuter Hub."
          >
            {weather.isStormAlert ? (
              <CloudRain size={15} className="weather-icon-rain" />
            ) : (
              <Sun size={15} className="weather-icon-sun" />
            )}
            <span className="weather-temp">{weather.temperatureF}°F</span>
            <span className="weather-brief">
              {weather.isStormAlert ? "Storm Risk" : "Tampa"}
            </span>
          </button>

          {/* Commuter Command Center Trigger */}
          <button
            className="commuter-trigger-btn"
            onClick={() => setIsCommuterOpen(true)}
            title="Open USF Commuter Hub: Parking, Departure Calc, Bull Runner, Weather"
          >
            <Car size={15} />
            <span>Commuter Hub</span>
          </button>

          <button className="help-button" onClick={() => setHelp(true)}>
            How to drive <span>?</span>
          </button>
        </div>
      </header>

      {/* Campus Orientation Sidebar */}
      <aside className="tour-panel">
        <span className="eyebrow">STUDENT ORIENTATION & COMMUTER HUB</span>
        <h1>
          Explore the
          <br />
          Tampa Campus.
        </h1>
        <p>
          260 building footprints, smart parking fullness & Bull Runner shuttles.
        </p>

        {/* Quick Hub Buttons */}
        <div className="sidebar-quick-actions">
          <button
            className="quick-hub-btn parking"
            onClick={() => setIsCommuterOpen(true)}
          >
            <Car size={14} /> Smart Parking
          </button>
          <button
            className="quick-hub-btn weather"
            onClick={() => setIsCommuterOpen(true)}
          >
            <CloudRain size={14} /> Storm Shield
          </button>
        </div>

        <button
          className="sidebar-search-btn"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search size={15} /> Find Any Building or Room
        </button>

        <div className="panel-divider" />

        {/* Category Pills */}
        <div className="sidebar-categories">
          {SIDEBAR_CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`cat-pill ${activeCategory === c.value ? "active" : ""}`}
              onClick={() => setActiveCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="stops-heading">
          <span>CAMPUS LANDMARKS</span>
          <span>{filteredPlaces.length} LOCATIONS</span>
        </div>

        <nav aria-label="Campus landmarks" className="sidebar-stops-list">
          {filteredPlaces.map((p) => {
            const isSelected = selected?.id === p.id;
            const isNav = navigating?.code === p.code;

            return (
              <button
                className={`stop ${isSelected ? "selected" : ""} ${isNav ? "nav-active" : ""}`}
                key={p.id}
                onClick={() => selectPlace(p)}
              >
                <span className="stop-code-badge">{p.code}</span>
                <span className="stop-details">
                  <strong>{p.short}</strong>
                  <small>{p.category}</small>
                </span>
                {isNav ? (
                  <Navigation size={14} className="active-nav-icon" />
                ) : (
                  <ChevronRight size={15} />
                )}
              </button>
            );
          })}
        </nav>

        <button className="overview-button" onClick={() => act("overview")}>
          <Map size={17} /> See the whole campus <ArrowUpRight size={16} />
        </button>
      </aside>

      {/* Map Tools */}
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

      {/* GPS Waypoint Banner if Navigating */}
      {navigating && (
        <div className="gps-nav-banner">
          <div className="gps-icon-pulsing">
            <Navigation size={18} />
          </div>
          <div className="gps-info">
            <span className="gps-target-title">
              GUIDING TO [{navigating.code}] {navigating.name}
            </span>
            <span className="gps-distance">
              {telemetry.navDistance !== undefined
                ? `${Math.round(telemetry.navDistance)} m away`
                : "Calculating route..."}
              {telemetry.isAutodriving ? " • Autopilot cruising" : " • Follow the green path"}
            </span>
          </div>
          <button
            className="gps-cancel-btn"
            onClick={() => setNavigating(null)}
            title="Cancel GPS navigation"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Parked Car Reminder Bar */}
      {parkedCar && !navigating && (
        <div className="parked-car-pill-banner">
          <Car size={15} />
          <span>Parked at <strong>{parkedCar.garageName}</strong> ({parkedCar.floor || "Saved"})</span>
          <button
            className="pill-walk-btn"
            onClick={() => {
              handleCommuterNavigate({
                x: parkedCar.x,
                z: parkedCar.z,
                name: `My Car (${parkedCar.garageName})`,
                code: "CAR",
              });
            }}
          >
            Walk to Car
          </button>
        </div>
      )}

      {/* Drive HUD */}
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
              ? "PAUSED"
              : telemetry.isAutodriving
                ? "AUTOPILOT ON"
                : telemetry.overview
                  ? "CAMPUS MAP"
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
        <button
          aria-label="Reset car"
          title="Reset car to library"
          onClick={() => {
            act("reset");
            setNavigating(null);
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Keyboard Driving Hints */}
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
        <kbd>⌘K</kbd>
        <span>search rooms</span>
        <i />
        <kbd>C</kbd>
        <span>commuter hub</span>
      </div>

      {/* Selected Building Photo & Room Directory Card */}
      {selected && (
        <BuildingCard
          place={selected}
          isNavigating={navigating?.code === selected.code}
          onClose={() => setSelected(null)}
          onStartHere={handleStartHere}
          onNavigate={handleNavigate}
          onAutoDrive={handleAutoDrive}
        />
      )}

      {/* Search & Room Directory Overlay */}
      <SearchOverlay
        carPosition={telemetry.carPos}
        onSelectPlace={handleSearchSelect}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Commuter Daily Driver Command Center */}
      <CommuterCommandCenter
        isOpen={isCommuterOpen}
        onClose={() => setIsCommuterOpen(false)}
        carPosition={telemetry.carPos}
        onNavigateToTarget={handleCommuterNavigate}
        onJumpToTarget={handleCommuterJump}
        showShuttles={showShuttles}
        onToggleShuttles={setShowShuttles}
        rainMode={rainMode}
        onToggleRainMode={setRainMode}
        parkedCar={parkedCar}
        onSetParkedCar={setParkedCar}
      />

      {/* Footer */}
      <footer>
        <span>
          <span className="status-dot" /> USF COMMUTER COMPANION <i /> 260 Building
          Footprints • 5 Parking Garages • Bull Runner Shuttles
        </span>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          Map © OpenStreetMap contributors
        </a>
      </footer>

      {/* Touch Controls for Mobile */}
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

      {/* Help Modal */}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Driving and navigation controls"
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
            <span className="eyebrow">WELCOME TO USF TAMPA</span>
            <h2>How to Navigate the Campus</h2>
            <p>
              Use <strong>WASD</strong> or the <strong>Arrow Keys</strong> to
              drive your car around campus roads. <strong>Space</strong> brakes,{" "}
              <strong>P</strong> pauses, and <strong>R</strong> returns to the
              Library.
            </p>
            <p>
              Press <strong>⌘K</strong> or the Search bar to find any building
              by 3-letter code (e.g. <code>LIB</code>, <code>MSC</code>,{" "}
              <code>BSN</code>, <code>CPR</code>) or search for rooms and
              services like <em>Starbucks</em>, <em>Dining</em>,{" "}
              <em>Financial Aid</em>, or <em>Gym</em>.
            </p>
            <p>
              Press <strong>C</strong> or tap <strong>Commuter Hub</strong> in the header
              for live garage fullness, departure calculator, Bull Runner shuttles, and storm radar!
            </p>
            <small>
              Official OpenStreetMap university geometry with 154 named academic,
              residential, dining, and athletic centers.
            </small>
          </section>
        </div>
      )}
    </main>
  );
}
