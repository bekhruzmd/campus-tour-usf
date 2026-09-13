import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bus,
  CalendarDays,
  Car,
  ChevronRight,
  Coffee,
  Compass,
  Footprints,
  Gamepad2,
  LocateFixed,
  Map,
  Minus,
  Plus,
  Search,
  X,
  CloudSun,
  BookOpen,
} from "lucide-react";
const OpenFreeCampusMap = lazy(() => import("./components/OpenFreeCampusMap"));
import ExplorerMap, { held, type MapCommand } from "./ExplorerMap";
import {
  places,
  searchablePlaces,
  buildingToPlace,
  project,
  bounds,
  type Place,
} from "./data/explorer";
import { loadParkedCar, type ParkedCarRecord } from "./data/usfParking";
import {
  loadClasses,
  saveClasses,
  tampaDay,
  type SavedClass,
} from "./lib/student";
import SearchOverlay from "./components/SearchOverlay";
import BuildingCard from "./components/BuildingCard";
import MyDay from "./components/MyDay";
const CommuterCommandCenter = lazy(
  () => import("./components/CommuterCommandCenter"),
);

type Panel = "search" | "day" | "parking" | "shuttle" | "weather" | null;
export default function App() {
  const [selected, setSelected] = useState<Place | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [category, setCategory] = useState("All");
  const [mapProvider, setMapProvider] = useState<"free" | "campus">("free");
  const freeMapMode = mapProvider === "free";
  const useCampusMap = () => {
    setGodsEye(false);
    setMapProvider("campus");
    act("overview");
  };
  const [godsEye, setGodsEye] = useState(false);
  const [explore, setExplore] = useState(false);
  const [command, setCommand] = useState<MapCommand>({
    kind: "focus",
    id: 0,
  });
  const [origin, setOrigin] = useState<{ x: number; z: number }>();
  const [locationMessage, setLocationMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [parkedCar, setParkedCar] = useState<ParkedCarRecord | null>(
    loadParkedCar,
  );
  const [classes, setClasses] = useState<SavedClass[]>(() =>
    loadClasses().filter((c) =>
      searchablePlaces.some((p) => p.id === c.placeId),
    ),
  );
  const [storageMessage, setStorageMessage] = useState("");
  const [classPlace, setClassPlace] = useState<Place>();
  const [speed, setSpeed] = useState(0);
  const act = (
    kind: MapCommand["kind"],
    place?: Place,
    targetCoords?: { x: number; z: number },
  ) => setCommand((c) => ({ kind, place, targetCoords, id: c.id + 1 }));
  const select = (place: Place) => {
    setSelected(place);
    act("focus", place);
  };
  const open = (p: Panel) => {
    held.clear();
    setPanel(p);
    if (p === "day") setClassPlace(undefined);
  };
  const openSearch = (cat = "All") => {
    setCategory(cat);
    open("search");
  };
  const updateClasses = (value: SavedClass[]) => {
    setClasses(value);
    setStorageMessage(
      saveClasses(value)
        ? ""
        : "Browser storage is unavailable. Your classes will last for this visit only.",
    );
  };
  const locate = () => {
    if (!navigator.geolocation) {
      setLocationMessage(
        "Location is unavailable. Choose a starting building in destination details.",
      );
      return;
    }
    setLocating(true);
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = project(pos.coords.latitude, pos.coords.longitude);
        setOrigin(point);
        setLocating(false);
        if (
          point.x < bounds.minX ||
          point.x > bounds.maxX ||
          point.z < bounds.minZ ||
          point.z > bounds.maxZ
        ) {
          setLocationMessage(
            "You’re outside this campus map. Walking directions will still use your location.",
          );
          return;
        }
        act("focus", undefined, point);
        setLocationMessage(
          `Location found (approximately ${Math.round(pos.coords.accuracy)} m accuracy).`,
        );
      },
      () => {
        setLocating(false);
        setLocationMessage(
          "Location wasn’t available. Choose a starting building in destination details, or let Google Maps locate you.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyK") {
        e.preventDefault();
        setCategory("All");
        setPanel("search");
        return;
      }
      if (
        !explore ||
        panel ||
        (e.target as HTMLElement)?.closest("input,select,textarea,dialog")
      )
        return;
      if (e.code === "Space" && (e.target as HTMLElement)?.closest("button,a"))
        return;
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      held.add(e.code);
    };
    const up = (e: KeyboardEvent) => held.delete(e.code);
    const clear = () => held.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
      clear();
    };
  }, [explore, panel]);
  const today = classes
    .filter((c) => c.day === tampaDay())
    .sort((a, b) => a.start.localeCompare(b.start));
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const now = clock.toLocaleTimeString("en-GB", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const next = today.find((c) => c.end > now);
  const nextPlace = next && searchablePlaces.find((p) => p.id === next.placeId);
  return (
    <main
      className={`student-app ${freeMapMode ? "free-map-provider" : ""} ${explore ? "explore-mode" : ""} ${selected ? "has-destination" : ""}`}
    >
      <a className="skip-link" href="#student-content">
        Skip map to campus tools
      </a>
      <header className="app-header">
        <a className="brand" href="/" aria-label="USF Campus home">
          <span className="brand-mark">
            U<span>↗</span>
          </span>
          <span>
            <strong>
              campus<span>companion</span>
            </strong>
            <small>UNIVERSITY OF SOUTH FLORIDA · TAMPA</small>
          </span>
        </a>
        <button className="header-search" onClick={() => openSearch()}>
          <Search size={19} />
          <span>Building, room, or place</span>
          <kbd>⌘K</kbd>
        </button>
        <button
          className={`mode-button ${explore ? "active" : ""}`}
          aria-pressed={explore}
          onClick={() => {
            held.clear();
            if (!explore) useCampusMap();
            else setMapProvider("free");
            setExplore(!explore);
            act(explore ? "focus" : "follow", selected || places[0]);
          }}
        >
          {explore ? <Map size={17} /> : <Gamepad2 size={17} />}
          <span>{explore ? "Back to map" : "Explore mode"}</span>
        </button>
      </header>
      <div className="map-stage">
        {freeMapMode ? (
          <Suspense
            fallback={
              <p className="map-unavailable" role="status">
                Opening map…
              </p>
            }
          >
            <OpenFreeCampusMap
              godsEye={godsEye}
              command={command}
              selectedPlace={selected}
              userPosition={origin}
              parkedCar={parkedCar}
              onSelect={select}
              onFallback={useCampusMap}
            />
          </Suspense>
        ) : (
          <ExplorerMap
            command={command}
            paused={!explore || !!panel}
            explore={explore}
            selectedPlace={selected}
            showShuttles={true}
            userPosition={origin}
            parkedCar={parkedCar}
            onTelemetry={(t) => {
              if (explore) setSpeed(Math.round(t.speed));
            }}
            onSelect={select}
            onBuildingSelect={(b) => select(buildingToPlace(b))}
          />
        )}
        {!freeMapMode && !explore && (
          <button
            className="free-map-return secondary"
            onClick={() => {
              setMapProvider("free");
              act("overview");
            }}
          >
            Use OpenFreeMap
          </button>
        )}
      </div>
      <div className="map-controls">
        {freeMapMode && (
          <button
            className="icon-button provider-switch"
            aria-label="God’s eye view"
            aria-pressed={godsEye}
            onClick={() => setGodsEye(!godsEye)}
          >
            <Compass size={19} />
            <span>3D view</span>
          </button>
        )}
        {freeMapMode && (
          <button
            className="icon-button provider-switch"
            aria-label="Switch to campus map"
            onClick={useCampusMap}
          >
            <Map size={18} />
            <span>Campus</span>
          </button>
        )}
        <button
          className="icon-button"
          aria-label="Zoom in"
          onClick={() => act("zoomIn")}
        >
          <Plus size={20} />
        </button>
        <button
          className="icon-button"
          aria-label="Zoom out"
          onClick={() => act("zoomOut")}
        >
          <Minus size={20} />
        </button>
        <button
          className="icon-button"
          aria-label="See whole campus"
          onClick={() => act("overview")}
        >
          <Map size={19} />
        </button>
        <button
          className="icon-button"
          aria-label="Use my location"
          disabled={locating}
          onClick={locate}
        >
          <LocateFixed size={20} />
        </button>
      </div>
      <button
        className="map-context"
        aria-label="Campus weather"
        onClick={() => open("weather")}
      >
        <CloudSun size={16} />
        WEATHER<span>·</span>TAMPA
      </button>
      {(locationMessage || storageMessage) && (
        <div className="status-message" role="status">
          <span>{locationMessage || storageMessage}</span>
          <button
            className="icon-button"
            aria-label="Dismiss message"
            onClick={() => {
              setLocationMessage("");
              setStorageMessage("");
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <aside className="student-panel" id="student-content" tabIndex={-1}>
        {!selected ? (
          <div className="welcome-panel">
            <div className="welcome-copy">
              <span className="eyebrow">A LITTLE LESS LOST.</span>
              <h1>
                Find your way.
                <br />
                <span>Make campus yours.</span>
              </h1>
              <p>From your first class to your favorite spot.</p>
            </div>
            <button
              className="primary full find-class"
              onClick={() => openSearch()}
            >
              <Search size={18} />
              Find a class
              <ArrowUpRight size={18} />
            </button>
            <div className="quick-grid">
              <button onClick={() => open("day")}>
                <CalendarDays size={19} />
                <span>My Day</span>
              </button>
              <button onClick={() => open("parking")}>
                <Car size={19} />
                <span>Parking</span>
              </button>
              <button onClick={() => openSearch("Student Life & Dining")}>
                <Coffee size={19} />
                <span>Food & places</span>
              </button>
              <button onClick={() => openSearch("Academics")}>
                <BookOpen size={19} />
                <span>Study & classes</span>
              </button>
            </div>
            <div className="today-preview">
              <span className="eyebrow">
                {next ? "UP NEXT" : "YOUR CAMPUS DAY"}
              </span>
              {next && nextPlace ? (
                <button
                  className="next-class"
                  onClick={() =>
                    select({
                      ...nextPlace,
                      requestedRoom: next.room || undefined,
                    })
                  }
                >
                  <span>
                    <strong>
                      {nextPlace.code} {next.room}
                    </strong>
                    <small>
                      {next.start} · {nextPlace.short}
                    </small>
                  </span>
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button className="next-class" onClick={() => open("day")}>
                  <span>
                    <strong>
                      {classes.length
                        ? "You’re all set for today."
                        : "Your next class, one tap away."}
                    </strong>
                    <small>
                      {classes.length
                        ? "View your weekly classes"
                        : "Add your schedule to My Day"}
                    </small>
                  </span>
                  <Plus size={20} />
                </button>
              )}
            </div>
            <div className="desktop-places">
              <span className="eyebrow">GET TO KNOW CAMPUS</span>
              {["LIB", "MSC", "BSN", "CPR"].map((code) => {
                const p = places.find((p) => p.code === code);
                return (
                  p && (
                    <button
                      key={code}
                      className="mini-place"
                      onClick={() => select(p)}
                    >
                      <span className="code-badge">{code}</span>
                      <span>{p.short}</span>
                      <ChevronRight size={15} />
                    </button>
                  )
                );
              })}
            </div>
            <div className="panel-links">
              <button onClick={() => open("weather")}>
                <CloudSun size={16} />
                Weather
              </button>
              <button onClick={() => open("shuttle")}>
                <Bus size={16} />
                Bus routes & arrivals
              </button>
            </div>
          </div>
        ) : (
          <BuildingCard
            key={`${selected.id}-${selected.requestedRoom || ""}`}
            place={selected}
            origin={origin}
            onLocate={locate}
            onClose={() => setSelected(null)}
            explore={explore}
            onExploreHere={() => act("jump", selected)}
            onAddClass={() => {
              setClassPlace(selected);
              setPanel("day");
            }}
          />
        )}
      </aside>
      {explore && (
        <div className="drive-controls">
          <span>
            <Gamepad2 size={17} />
            Virtual tour · {speed} mph
          </span>
          <small>WASD / arrows to drive. Routes are simulated.</small>
          <div>
            {[
              ["KeyA", "←", "Steer left"],
              ["KeyW", "↑", "Drive forward"],
              ["KeyS", "↓", "Reverse"],
              ["KeyD", "→", "Steer right"],
            ].map(([key, label, name]) => (
              <button
                key={key}
                aria-label={name}
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
        </div>
      )}
      <nav className="bottom-nav" aria-label="Campus navigation">
        {[
          [null, "Map", Map],
          ["search", "Search", Search],
          ["day", "My Day", CalendarDays],
          ["shuttle", "Buses", Bus],
          ["parking", "Parking", Car],
        ].map(([p, label, Icon]) => {
          const Comp = Icon as typeof Map;
          return (
            <button
              key={label as string}
              aria-current={panel === p ? "page" : undefined}
              onClick={() =>
                p === "search"
                  ? openSearch()
                  : p === null
                    ? (setSelected(null), open(null))
                    : open(p as Panel)
              }
            >
              <Comp size={20} />
              <span>{label as string}</span>
            </button>
          );
        })}
      </nav>
      {!freeMapMode && (
        <div className="map-credit">
          Independent USF guide ·{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap
          </a>
        </div>
      )}
      {panel === "search" && (
        <SearchOverlay
          initialCategory={category}
          onSelectPlace={select}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "day" && (
        <MyDay
          initialPlace={classPlace}
          classes={classes}
          onChange={updateClasses}
          onSelect={select}
          onClose={() => setPanel(null)}
        />
      )}
      {(panel === "parking" || panel === "shuttle" || panel === "weather") && (
        <Suspense
          fallback={
            <div className="status-message" role="status">
              Opening campus tools…
            </div>
          }
        >
          <CommuterCommandCenter
            key={panel}
            tab={panel}
            parkedCar={parkedCar}
            onSetParkedCar={setParkedCar}
            onClose={() => setPanel(null)}
            origin={origin}
            onView={(p) => {
              if (panel === "shuttle") {
                setMapProvider("free");
                setExplore(false);
              }
              setSelected(null);
              act("focus", undefined, p);
            }}
          />
        </Suspense>
      )}
    </main>
  );
}
