import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bus,
  Car,
  Check,
  Footprints,
  RefreshCw,
} from "lucide-react";
import { buildings, type Place } from "../data/explorer";
import {
  USF_PARKING_FACILITIES,
  PARKING_SOURCE,
  saveParkedCar,
  clearParkedCar,
  type ParkedCarRecord,
  type ParkingPermit,
} from "../data/usfParking";
import {
  fetchLiveBullRunnerPositions,
  SHUTTLE_ROUTES,
  type ActiveShuttleBus,
  type BullRunnerFeedStatus,
} from "../data/usfShuttle";
import {
  fetchTampaCampusWeather,
  getTampaDefaultWeather,
} from "../data/usfWeather";
import { walkingUrl } from "../lib/search";
import { departurePlan } from "../data/commuterCalc";
import Dialog from "./Dialog";
export default function CommuterCommandCenter({
  tab,
  onClose,
  parkedCar,
  onSetParkedCar,
  onView,
  origin,
}: {
  tab: "parking" | "shuttle" | "weather";
  onClose: () => void;
  parkedCar: ParkedCarRecord | null;
  onSetParkedCar: (p: ParkedCarRecord | null) => void;
  onView: (p: { x: number; z: number }) => void;
  origin?: { x: number; z: number };
}) {
  const [permit, setPermit] = useState<ParkingPermit | "none">("none");
  const [garageId, setGarageId] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [buses, setBuses] = useState<ActiveShuttleBus[]>([]);
  const [feed, setFeed] = useState<BullRunnerFeedStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(getTampaDefaultWeather());
  const [routeId, setRouteId] = useState("");
  const [startStop, setStartStop] = useState("");
  const [endStop, setEndStop] = useState("");
  const [classTime, setClassTime] = useState("09:00");
  const [buffers, setBuffers] = useState([30, 15, 15, 10]);
  const plan = departurePlan(
    classTime,
    ...(buffers as [number, number, number, number]),
  );
  const route = SHUTTLE_ROUTES.find((r) => r.id === routeId);
  const refresh = async () => {
    setLoading(true);
    if (tab === "weather") setWeather(await fetchTampaCampusWeather());
    else {
      const result = await fetchLiveBullRunnerPositions();
      setBuses(result.buses);
      setFeed(result.status);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (tab === "parking") return;
    let active = true;
    const poll = async () => {
      setLoading(true);
      if (tab === "weather") {
        const w = await fetchTampaCampusWeather();
        if (active) setWeather(w);
      } else {
        const result = await fetchLiveBullRunnerPositions();
        if (active) {
          setBuses(result.buses);
          setFeed(result.status);
        }
      }
      if (active) setLoading(false);
    };
    void poll();
    const timer = setInterval(poll, tab === "shuttle" ? 30000 : 300000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tab]);
  const selectedGarage = USF_PARKING_FACILITIES.find((g) => g.id === garageId);
  const title =
    tab === "parking"
      ? "Parking & my car"
      : tab === "shuttle"
        ? "Bull Runner"
        : "Campus weather";
  return (
    <Dialog title={title} onClose={onClose}>
      {tab === "parking" && (
        <>
          {parkedCar && (
            <div className="saved-car">
              <span className="eyebrow">
                <Check size={14} /> CAR LOCATION SAVED
              </span>
              <h3>{parkedCar.garageName}</h3>
              <p>{parkedCar.floor || "No floor or section added"}</p>
              <small>
                {new Date(parkedCar.timestamp).toLocaleString([], {
                  timeZone: "America/New_York",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                · Tampa time
              </small>
              <div className="button-row">
                <a
                  className="primary"
                  target="_blank"
                  rel="noreferrer"
                  href={walkingUrl(parkedCar, origin)}
                >
                  <Footprints size={16} />
                  Walk back
                </a>
                <button
                  className="secondary"
                  onClick={() => {
                    if (clearParkedCar()) {
                      onSetParkedCar(null);
                      setStatus("Saved car removed.");
                    } else setStatus("Could not clear storage. Try again.");
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          <form
            className="parking-save"
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedGarage) return;
              const r = {
                garageName: selectedGarage.shortName,
                floor: note,
                timestamp: new Date().toISOString(),
                x: selectedGarage.x,
                z: selectedGarage.z,
              };
              const saved = saveParkedCar(r);
              onSetParkedCar(r);
              setStatus(
                saved
                  ? "Your selected garage and note are saved on this device."
                  : "Saved for this visit only; browser storage is unavailable.",
              );
            }}
          >
            <h3>
              <Car size={19} />
              Where did you park?
            </h3>
            <label className="field">
              Your actual garage
              <select
                aria-label="Your actual garage"
                required
                value={garageId}
                onChange={(e) => setGarageId(e.target.value)}
              >
                <option value="">Choose where you parked</option>
                {USF_PARKING_FACILITIES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.shortName}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Floor, section, or landmark
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={160}
                placeholder="e.g. Level 3, east stairs"
              />
            </label>
            <button className="primary" disabled={!selectedGarage}>
              <Car size={16} />
              Save my car
            </button>
          </form>
          <p className="quiet" role="status">
            {status}
          </p>
          <div className="section-line" />
          <h3>Find parking for your permit</h3>
          <label className="field">
            Permit
            <select
              aria-label="Permit"
              value={permit}
              onChange={(e) =>
                setPermit(e.target.value as ParkingPermit | "none")
              }
            >
              <option value="none">Choose your permit</option>
              <option value="S">S · Commuter student</option>
              <option value="R">R · Resident student</option>
              <option value="E">E · Employee</option>
              <option value="Y">Y · Park-N-Ride</option>
              <option value="Visitor">Visitor / no permit</option>
            </select>
          </label>
          <p className="quiet">
            No live space counts. These garages contain designated spaces; check
            the sign at your space and current restrictions.
          </p>
          {permit === "Y" ? (
            <div className="info-note">
              <strong>Park-N-Ride: lots 18 and 43</strong>
              <p>
                Use USF’s official map for lot locations and the Bull Runner for
                the next leg. Availability is not guaranteed.
              </p>
            </div>
          ) : permit === "Visitor" ? (
            <p>
              Use USF’s visitor parking information to choose a paid space
              before arriving.
            </p>
          ) : (
            permit !== "none" &&
            USF_PARKING_FACILITIES.filter((g) =>
              g.permits.includes(permit),
            ).map((g) => (
              <div className="parking-option" key={g.id}>
                <div>
                  <strong>{g.shortName}</strong>
                  <small>
                    {permit}-designated spaces · availability unknown
                  </small>
                </div>
                <button
                  className="secondary"
                  onClick={() => {
                    onView(g);
                    onClose();
                  }}
                >
                  Show map
                </button>
              </div>
            ))
          )}
          <a
            className="resource-link"
            href={PARKING_SOURCE}
            target="_blank"
            rel="noreferrer"
          >
            USF permit rules & parking maps
            <ArrowUpRight size={16} />
          </a>
          <details className="departure-details">
            <summary>Plan when to leave</summary>
            <p className="quiet">
              Enter your own travel estimates and buffers. This is a planning
              calculation, not live traffic or a walking-route estimate.
            </p>
            <label className="field">
              Class starts
              <input
                type="time"
                required
                value={classTime}
                onChange={(e) => setClassTime(e.target.value)}
              />
            </label>
            <div className="field-pair">
              {[
                "Travel to campus",
                "Find parking",
                "Walk to class",
                "Arrive early",
              ].map((label, i) => (
                <label className="field" key={label}>
                  {label} (min)
                  <input
                    type="number"
                    min="0"
                    max="240"
                    value={Number.isNaN(buffers[i]) ? "" : buffers[i]}
                    onChange={(e) =>
                      setBuffers(
                        buffers.map((n, j) =>
                          i === j ? e.target.valueAsNumber : n,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            {plan && (
              <div className="info-note">
                <strong>
                  Leave at {plan.time}
                  {plan.previousDay ? " the previous day" : ""}
                </strong>
                <p>{plan.total} minutes before class, using your inputs.</p>
              </div>
            )}
          </details>
        </>
      )}
      {tab === "shuttle" && (
        <>
          <div className="feed-summary">
            <Bus size={24} />
            <div>
              <strong>
                {loading && !feed
                  ? "Checking vehicle locations…"
                  : feed?.statusText || "Vehicle locations unavailable"}
              </strong>
              <small>
                {feed?.lastPolled
                  ? `Checked ${feed.lastPolled.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · positions may be delayed`
                  : "Provided by Passio GO"}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label="Refresh buses"
              disabled={loading}
              onClick={refresh}
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <a
            className="primary full"
            href="https://www.usf.edu/parking/bull-runner/"
            target="_blank"
            rel="noreferrer"
          >
            Open official tracker & service information
            <ArrowUpRight size={17} />
          </a>
          <h3>Explore a route</h3>
          <label className="field">
            Route
            <select
              value={routeId}
              onChange={(e) => {
                setRouteId(e.target.value);
                setStartStop("");
                setEndStop("");
              }}
            >
              <option value="">Choose a named route</option>
              {SHUTTLE_ROUTES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          {route && (
            <>
              <p className="quiet">
                Route and stop snapshot: September 2026. Confirm direction and
                service changes in the official tracker.
              </p>
              <label className="field">
                Board at
                <select
                  value={startStop}
                  onChange={(e) => setStartStop(e.target.value)}
                >
                  <option value="">Choose boarding stop</option>
                  {route.stops.map((s, i) => (
                    <option key={`${s.id}-${i}`} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Get off at
                <select
                  value={endStop}
                  onChange={(e) => setEndStop(e.target.value)}
                >
                  <option value="">Choose destination stop</option>
                  {route.stops
                    .filter((s) => s.id !== startStop)
                    .map((s, i) => (
                      <option key={`${s.id}-${i}`} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              {startStop && (
                <a
                  className="resource-link"
                  href={walkingUrl(
                    route.stops.find((s) => s.id === startStop)!,
                    origin,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Walk to boarding stop
                  <ArrowUpRight size={16} />
                </a>
              )}
              {startStop && endStop && (
                <p className="info-note">
                  Both stops are listed on {route.name}. Confirm their order,
                  boarding side, and the next departure in the official tracker.
                  Arrival predictions aren’t available here.
                </p>
              )}
            </>
          )}
          {buses.length > 0 && <h3>Reported vehicles</h3>}
          {buses.map((b) => (
            <div className="parking-option" key={b.id}>
              <div>
                <strong>
                  {SHUTTLE_ROUTES.find((r) => r.id === b.routeId)?.name ||
                    "Route not identified"}
                </strong>
                <small>
                  Bus {b.busNumber} · {b.occupancyStatus || "Occupancy unknown"}
                </small>
              </div>
              <button
                className="secondary"
                onClick={() => {
                  onView(b);
                  onClose();
                }}
              >
                Show map
              </button>
            </div>
          ))}
        </>
      )}
      {tab === "weather" && (
        <>
          <div className="weather-reading">
            <span>{weather.available ? `${weather.temperatureF}°` : "—"}</span>
            <h3>{loading ? "Checking weather…" : weather.conditionText}</h3>
            {weather.feelsLikeF !== null && (
              <p>Feels like {weather.feelsLikeF}°F</p>
            )}
          </div>
          {weather.available ? (
            <p className="quiet">
              Open-Meteo · fetched{" "}
              {new Date(weather.updatedAt!).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
              . Conditions are for the campus area.
            </p>
          ) : (
            <p className="info-note">
              We couldn’t load current conditions. Check a weather source before
              heading out.
            </p>
          )}
          <button className="secondary" onClick={refresh} disabled={loading}>
            <RefreshCw size={16} />
            Refresh weather
          </button>
          <div className="link-list">
            <a
              href="https://www.usf.edu/weather/"
              target="_blank"
              rel="noreferrer"
            >
              USF weather updates
              <ArrowUpRight size={16} />
            </a>
            <a
              href="https://forecast.weather.gov/MapClick.php?lat=28.0587&lon=-82.4139"
              target="_blank"
              rel="noreferrer"
            >
              National Weather Service forecast
              <ArrowUpRight size={16} />
            </a>
          </div>
          <p className="quiet">
            Covered walking routes and shelter access have not been verified in
            this app.
          </p>
        </>
      )}
    </Dialog>
  );
}
