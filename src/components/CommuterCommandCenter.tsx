import { useState, useEffect } from "react";
import {
  X,
  Compass,
  Navigation,
  Car,
  Clock,
  CloudRain,
  Sun,
  Bus,
  Coffee,
  Zap,
  Printer,
  MapPin,
  Sparkles,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Radio,
  RefreshCw,
  Activity,
} from "lucide-react";
import {
  USF_PARKING_FACILITIES,
  getGarageOccupancy,
  matchBestGarage,
  saveParkedCar,
  loadParkedCar,
  clearParkedCar,
  type ParkedCarRecord,
  type USFParkingGarage,
} from "../data/usfParking";
import {
  fetchTampaCampusWeather,
  getTampaDefaultWeather,
  type USFWeatherData,
} from "../data/usfWeather";
import {
  SHUTTLE_ROUTES,
  SHUTTLE_STOPS,
  fetchLiveBullRunnerPositions,
  type ActiveShuttleBus,
  type BullRunnerFeedStatus,
} from "../data/usfShuttle";
import { CAMPUS_AMENITIES, type CampusAmenity } from "../data/usfAmenities";
import {
  COMMUTER_ORIGINS,
  calculateDepartureTime,
} from "../data/commuterCalc";
import { places, type Place } from "../data/explorer";

interface CommuterCommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  carPosition: { x: number; z: number };
  onNavigateToTarget: (target: { x: number; z: number; name: string; code: string }) => void;
  onJumpToTarget: (target: { x: number; z: number; name: string }) => void;
  showShuttles: boolean;
  onToggleShuttles: (val: boolean) => void;
  rainMode: boolean;
  onToggleRainMode: (val: boolean) => void;
  parkedCar: ParkedCarRecord | null;
  onSetParkedCar: (record: ParkedCarRecord | null) => void;
}

export default function CommuterCommandCenter({
  isOpen,
  onClose,
  carPosition,
  onNavigateToTarget,
  onJumpToTarget,
  showShuttles,
  onToggleShuttles,
  rainMode,
  onToggleRainMode,
  parkedCar,
  onSetParkedCar,
}: CommuterCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<
    "parking" | "departure" | "shuttle" | "amenities" | "weather"
  >("parking");

  // Parking Tab States
  const [selectedDestPlace, setSelectedDestPlace] = useState<Place>(places[0]);
  const [customFloorNote, setCustomFloorNote] = useState("Level 3, near stairs");
  const [parkingSavedBanner, setParkingSavedBanner] = useState(false);

  // Weather States
  const [weather, setWeather] = useState<USFWeatherData>(getTampaDefaultWeather());
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Departure Calculator States
  const [classTime, setClassTime] = useState("11:00");
  const [originId, setOriginId] = useState("new_tampa");

  // Amenities Filter
  const [amenityCategory, setAmenityCategory] = useState<"all" | "caffeine" | "outlets" | "printing">("all");

  // Bull Runner Live GTFS Feed States
  const [shuttleBuses, setShuttleBuses] = useState<ActiveShuttleBus[]>([]);
  const [shuttleFeedStatus, setShuttleFeedStatus] = useState<BullRunnerFeedStatus | null>(null);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);

  const refreshBullRunner = async () => {
    setIsRefreshingFeed(true);
    try {
      const res = await fetchLiveBullRunnerPositions();
      setShuttleBuses(res.buses);
      setShuttleFeedStatus(res.status);
    } catch {
      // Handled inside fetchLiveBullRunnerPositions
    } finally {
      setIsRefreshingFeed(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoadingWeather(true);
      fetchTampaCampusWeather()
        .then((w) => setWeather(w))
        .catch(() => setWeather(getTampaDefaultWeather()))
        .finally(() => setLoadingWeather(false));

      if (activeTab === "shuttle" || !shuttleFeedStatus) {
        refreshBullRunner();
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const bestGarageInfo = matchBestGarage(selectedDestPlace);
  const departureResult = calculateDepartureTime({
    classTimeStr: classTime,
    originId,
    targetPos: selectedDestPlace,
  });

  const filteredAmenities = CAMPUS_AMENITIES.filter(
    (a) => amenityCategory === "all" || a.category === amenityCategory
  );

  const handleSaveParking = (garage: USFParkingGarage) => {
    const record: ParkedCarRecord = {
      garageName: garage.shortName,
      floor: customFloorNote,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      x: garage.x,
      z: garage.z,
    };
    saveParkedCar(record);
    onSetParkedCar(record);
    setParkingSavedBanner(true);
    setTimeout(() => setParkingSavedBanner(false), 3000);
  };

  const handleClearParking = () => {
    clearParkedCar();
    onSetParkedCar(null);
  };

  return (
    <div className="commuter-modal-backdrop" onClick={onClose}>
      <div
        className="commuter-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="USF Commuter Command Center"
      >
        {/* Modal Top Bar */}
        <div className="commuter-header">
          <div className="commuter-brand-title">
            <span className="commuter-badge">DAILY COMMUTER HUB</span>
            <h2>USF Campus Command Center</h2>
          </div>
          <button className="commuter-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="commuter-tabs-bar">
          <button
            className={`c-tab-btn ${activeTab === "parking" ? "active" : ""}`}
            onClick={() => setActiveTab("parking")}
          >
            <Car size={15} />
            <span>Smart Parking</span>
          </button>
          <button
            className={`c-tab-btn ${activeTab === "departure" ? "active" : ""}`}
            onClick={() => setActiveTab("departure")}
          >
            <Clock size={15} />
            <span>When to Leave</span>
          </button>
          <button
            className={`c-tab-btn ${activeTab === "weather" ? "active" : ""}`}
            onClick={() => setActiveTab("weather")}
          >
            <CloudRain size={15} />
            <span>Storm Shield</span>
          </button>
          <button
            className={`c-tab-btn ${activeTab === "shuttle" ? "active" : ""}`}
            onClick={() => setActiveTab("shuttle")}
          >
            <Bus size={15} />
            <span>Bull Runner</span>
          </button>
          <button
            className={`c-tab-btn ${activeTab === "amenities" ? "active" : ""}`}
            onClick={() => setActiveTab("amenities")}
          >
            <Zap size={15} />
            <span>Power & Coffee</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="commuter-body">
          {/* ====================================================================
              TAB 1: SMART PARKING FULLNESS & GARAGE MATCHER
             ==================================================================== */}
          {activeTab === "parking" && (
            <div className="tab-section parking-section">
              {/* Parked Car Status Box */}
              <div className="parked-car-card">
                <div className="parked-car-header">
                  <div className="p-icon-box">
                    <Car size={18} />
                  </div>
                  <div>
                    <strong>{parkedCar ? `Parked at ${parkedCar.garageName}` : "Where is your car right now?"}</strong>
                    <p>
                      {parkedCar
                        ? `${parkedCar.floor || "Location saved"} • Parked at ${parkedCar.timestamp}`
                        : "Tap 'I Parked Here' when you arrive on campus to save your spot."}
                    </p>
                  </div>
                </div>

                {parkedCar ? (
                  <div className="parked-car-actions">
                    <button
                      className="c-action-btn primary"
                      onClick={() => {
                        onNavigateToTarget({
                          x: parkedCar.x,
                          z: parkedCar.z,
                          name: `My Car (${parkedCar.garageName})`,
                          code: "CAR",
                        });
                        onClose();
                      }}
                    >
                      <Navigation size={14} /> Walk to My Car
                    </button>
                    <button className="c-action-btn secondary" onClick={handleClearParking}>
                      Clear Pin
                    </button>
                  </div>
                ) : (
                  <div className="park-current-prompt">
                    <input
                      type="text"
                      className="floor-input"
                      placeholder="e.g. Level 3, Section B"
                      value={customFloorNote}
                      onChange={(e) => setCustomFloorNote(e.target.value)}
                    />
                    <button
                      className="c-action-btn primary"
                      onClick={() => handleSaveParking(bestGarageInfo.recommended)}
                    >
                      <MapPin size={14} /> I Parked Here
                    </button>
                  </div>
                )}

                {parkingSavedBanner && (
                  <div className="save-success-msg">
                    <CheckCircle2 size={15} /> Spot saved! Dotted walking route will lead back to your car.
                  </div>
                )}
              </div>

              {/* Class Destination Matcher */}
              <div className="garage-matcher-box">
                <label className="section-label">
                  <MapPin size={14} /> MATCH BEST GARAGE FOR YOUR CLASS:
                </label>
                <div className="building-select-row">
                  <select
                    className="c-select"
                    value={selectedDestPlace.id}
                    onChange={(e) => {
                      const found = places.find((p) => p.id === e.target.value);
                      if (found) setSelectedDestPlace(found);
                    }}
                  >
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Best Garage Recommendation Card */}
                <div className="best-garage-callout">
                  <div className="recommend-badge">RECOMMENDED FOR THIS BUILDING</div>
                  <div className="rec-details-row">
                    <div>
                      <h3>{bestGarageInfo.recommended.name}</h3>
                      <p className="garage-tip">{bestGarageInfo.recommended.tips}</p>
                    </div>
                    <div className="stat-right">
                      <span className="walk-badge">{bestGarageInfo.walkTimeMins} min walk</span>
                      <small>{bestGarageInfo.walkDistanceMeters} meters away</small>
                    </div>
                  </div>

                  <div className="rec-actions-row">
                    <button
                      className="c-action-btn primary"
                      onClick={() => {
                        onNavigateToTarget({
                          x: bestGarageInfo.recommended.x,
                          z: bestGarageInfo.recommended.z,
                          name: bestGarageInfo.recommended.name,
                          code: bestGarageInfo.recommended.code,
                        });
                        onClose();
                      }}
                    >
                      <Navigation size={14} /> GPS to this Garage
                    </button>
                    <button
                      className="c-action-btn secondary"
                      onClick={() => handleSaveParking(bestGarageInfo.recommended)}
                    >
                      <Car size={14} /> I Parked on this Garage
                    </button>
                  </div>
                </div>
              </div>

              {/* All Garages Live Fullness List */}
              <h4 className="sub-title">ALL CAMPUS GARAGES & PARKING FULLNESS</h4>
              <div className="garages-list">
                {bestGarageInfo.allRanked.map(({ garage, walkTimeMins, occupancy }) => (
                  <div key={garage.id} className="garage-row-card">
                    <div className="garage-info-left">
                      <div className="garage-title-line">
                        <span className="code-pill">{garage.code}</span>
                        <strong>{garage.shortName}</strong>
                        <span className="permits-pill">{garage.permits.join("/")}</span>
                      </div>
                      <div className="fullness-meter">
                        <div
                          className="fullness-fill"
                          style={{
                            width: `${occupancy.occupancyPercent}%`,
                            background: occupancy.color,
                          }}
                        />
                      </div>
                      <div className="fullness-meta">
                        <span style={{ color: occupancy.color, fontWeight: 700 }}>
                          {occupancy.occupancyPercent}% Full ({occupancy.status})
                        </span>
                        <span>~{occupancy.availableSpots} open spots</span>
                      </div>
                    </div>

                    <div className="garage-actions-right">
                      <span className="walk-mins">{walkTimeMins}m walk</span>
                      <button
                        className="c-mini-btn"
                        onClick={() => {
                          onNavigateToTarget({
                            x: garage.x,
                            z: garage.z,
                            name: garage.name,
                            code: garage.code,
                          });
                          onClose();
                        }}
                      >
                        Route
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====================================================================
              TAB 2: WHEN SHOULD I LEAVE HOME? (DEPARTURE CALCULATOR)
             ==================================================================== */}
          {activeTab === "departure" && (
            <div className="tab-section departure-section">
              <div className="dep-intro">
                <Clock size={20} />
                <div>
                  <strong>Commuter Departure Time Calculator</strong>
                  <p>Accounts for Tampa highway congestion, peak garage circling delays, and campus walking time.</p>
                </div>
              </div>

              <div className="calc-inputs-grid">
                <div className="input-field">
                  <label>WHAT TIME DOES YOUR CLASS START?</label>
                  <select
                    className="c-select"
                    value={classTime}
                    onChange={(e) => setClassTime(e.target.value)}
                  >
                    <option value="08:00">8:00 AM</option>
                    <option value="09:30">9:30 AM (Morning Rush)</option>
                    <option value="11:00">11:00 AM (Peak Parking Crunch)</option>
                    <option value="12:30">12:30 PM (Midday Rush)</option>
                    <option value="14:00">2:00 PM (Afternoon)</option>
                    <option value="15:30">3:30 PM</option>
                    <option value="17:00">5:00 PM (Evening Class)</option>
                    <option value="18:30">6:30 PM</option>
                  </select>
                </div>

                <div className="input-field">
                  <label>WHERE DO YOU COMMUTE FROM?</label>
                  <select
                    className="c-select"
                    value={originId}
                    onChange={(e) => setOriginId(e.target.value)}
                  >
                    {COMMUTER_ORIGINS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} (~{o.driveTimeMins}m base drive)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-field full-width">
                  <label>CLASS BUILDING DESTINATION:</label>
                  <select
                    className="c-select"
                    value={selectedDestPlace.id}
                    onChange={(e) => {
                      const found = places.find((p) => p.id === e.target.value);
                      if (found) setSelectedDestPlace(found);
                    }}
                  >
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calculated Result Card */}
              <div className="departure-output-card">
                <div className="departure-hero-clock">
                  <span>LEAVE HOME BY</span>
                  <h1>{departureResult.recommendedDepartureTime}</h1>
                  <span className="arrival-target">for your {classTime} class</span>
                </div>

                <div className="breakdown-timeline">
                  <div className="timeline-item">
                    <span className="dot green" />
                    <div>
                      <strong>{departureResult.driveMinutes} min drive</strong>
                      <small>{departureResult.origin.routeSummary}</small>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <span className="dot orange" />
                    <div>
                      <strong>+{departureResult.garageSearchMinutes} min parking search buffer</strong>
                      <small>
                        Target: {departureResult.recommendedGarage.shortName} (Estimated{" "}
                        {departureResult.garageOccupancy.occupancyPercent}% full)
                      </small>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <span className="dot blue" />
                    <div>
                      <strong>+{departureResult.walkMinutes} min walk to class</strong>
                      <small>From garage to [{selectedDestPlace.code}] {selectedDestPlace.short}</small>
                    </div>
                  </div>
                </div>

                <div className="commuter-tip-box">
                  <AlertTriangle size={15} />
                  <span>{departureResult.summaryAdvice}</span>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================
              TAB 3: TAMPA WEATHER & AFTERNOON STORM SHIELD
             ==================================================================== */}
          {activeTab === "weather" && (
            <div className="tab-section weather-section">
              {/* Weather Banner */}
              <div className="weather-overview-card">
                <div className="weather-main-stat">
                  <div className="temp-big">
                    {weather.temperatureF}°
                    <span className="feels-like">Feels like {weather.feelsLikeF}°</span>
                  </div>
                  <div>
                    <h3 className="condition-title">{weather.conditionText}</h3>
                    <p className="weather-sub">
                      Humidity: {weather.humidityPercent}% • Wind: {weather.windMph} mph
                    </p>
                  </div>
                </div>

                {/* Rain Simulator Button */}
                <button
                  className={`rain-toggle-btn ${rainMode ? "active" : ""}`}
                  onClick={() => onToggleRainMode(!rainMode)}
                >
                  <CloudRain size={16} />
                  <span>{rainMode ? "Turn Off Rain" : "Simulate Tampa Rain on Map"}</span>
                </button>
              </div>

              {/* Storm Alert Callout */}
              {weather.isStormAlert && (
                <div className="storm-alert-banner">
                  <ShieldAlert size={20} />
                  <div>
                    <strong>Tampa Afternoon Storm Alert</strong>
                    <p>{weather.commuterAdvice}</p>
                  </div>
                </div>
              )}

              {/* Hourly Rain Probability Bar Chart */}
              <h4 className="sub-title">TODAY'S RAIN RADAR BY HOUR</h4>
              <div className="hourly-rain-chart">
                {weather.hourlyRainProb.map((h, i) => (
                  <div key={i} className="rain-hour-bar">
                    <span className="prob-pct">{h.prob}%</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          height: `${h.prob}%`,
                          background: h.prob > 60 ? "#1d70b8" : h.prob > 30 ? "#5a98cf" : "#a2c7e8",
                        }}
                      />
                    </div>
                    <span className="hour-label">{h.hour}</span>
                  </div>
                ))}
              </div>

              {/* Covered Walkway Guide */}
              <div className="covered-walkway-box">
                <div className="c-title">
                  <Sparkles size={16} />
                  <strong>Covered Walkways & Rain Bypass Routes</strong>
                </div>
                <p>{weather.coveredWalkwayTip}</p>
                <div className="dry-routes-list">
                  <div className="route-chip">[HALL OF FLAGS] Kopp ⇄ ENG II ⇄ ENG III</div>
                  <div className="route-chip">[COOPER HALL] Covered Breezeway</div>
                  <div className="route-chip">[USF LIBRARY] North Overhang & Cafe Portico</div>
                  <div className="route-chip">[MARSHALL CENTER] Covered Bus Loop</div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================
              TAB 4: BULL RUNNER LIVE SHUTTLE TRACKER
             ==================================================================== */}
          {activeTab === "shuttle" && (
            <div className="tab-section shuttle-section">
              {/* Live GTFS-RT Telemetry Banner */}
              <div className="shuttle-feed-banner">
                <div className="feed-status-header">
                  <div className="feed-status-left">
                    <span className={`live-feed-dot ${shuttleFeedStatus?.isConnected ? "online" : "offline"}`} />
                    <span className="feed-title">USF BULL RUNNER LIVE GTFS-RT</span>
                    <span className="feed-source-pill">Passio GO AVL (CUTR)</span>
                  </div>
                  <button
                    className="feed-refresh-btn"
                    onClick={refreshBullRunner}
                    disabled={isRefreshingFeed}
                    title="Poll latest vehicle positions from GTFS-RT endpoint"
                  >
                    <RefreshCw size={12} className={isRefreshingFeed ? "spinning" : ""} />
                    <span>{isRefreshingFeed ? "Syncing..." : "Refresh Live Feed"}</span>
                  </button>
                </div>

                <div className="feed-status-body">
                  <div className="feed-metric">
                    <span className="metric-label">FEED STATUS</span>
                    <strong>{shuttleFeedStatus?.statusText || "Connecting to Passio GO GTFS realtime..."}</strong>
                  </div>
                  <div className="feed-metric-row">
                    <span>Active Vehicles: <strong>{shuttleFeedStatus?.activeVehiclesCount ?? 0}</strong></span>
                    <span>Feed Latency: <strong>{shuttleFeedStatus ? `${shuttleFeedStatus.feedLatencyMs} ms` : "..."}</strong></span>
                    <span>Source: <code>passio3.com/usf/.../vehiclePositions.json</code></span>
                  </div>
                </div>
              </div>

              <div className="shuttle-header-card">
                <div className="shuttle-title-row">
                  <div>
                    <strong>USF Bull Runner Campus Shuttle</strong>
                    <p>Free student transit connecting remote parking lots to campus core.</p>
                  </div>
                  <button
                    className={`c-action-btn ${showShuttles ? "primary" : "secondary"}`}
                    onClick={() => onToggleShuttles(!showShuttles)}
                  >
                    <Bus size={15} />
                    <span>{showShuttles ? "Buses Shown on Map" : "Show Buses on Map"}</span>
                  </button>
                </div>
              </div>

              {/* If live buses are actively broadcasting */}
              {shuttleBuses.length > 0 && (
                <div className="live-buses-container">
                  <h4 className="sub-title">LIVE ACTIVE BUSES ON CAMPUS</h4>
                  <div className="live-buses-grid">
                    {shuttleBuses.map((bus) => (
                      <div key={bus.id} className="live-bus-card">
                        <div className="live-bus-header">
                          <span className="live-bus-name">{bus.busNumber}</span>
                          <span className="live-bus-speed">{Math.round(bus.speedMps * 2.237)} mph</span>
                        </div>
                        <div className="live-bus-details">
                          <span>Route: {bus.routeId.toUpperCase().replace("_", " ")}</span>
                          <span>Occupancy: {bus.occupancyStatus?.replace(/_/g, " ") || "Seats Available"}</span>
                        </div>
                        <button
                          className="c-action-btn small-btn secondary"
                          onClick={() => {
                            onJumpToTarget({ x: bus.x, z: bus.z, name: bus.busNumber });
                            onClose();
                          }}
                        >
                          <Navigation size={12} /> View on Map
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h4 className="sub-title">OFFICIAL CAMPUS ROUTES & STOPS</h4>
              <div className="routes-list">
                {SHUTTLE_ROUTES.map((route) => (
                  <div key={route.id} className="shuttle-route-card">
                    <div className="route-header-line">
                      <span className="route-badge" style={{ background: route.color, color: route.textColor }}>
                        {route.name.split("—")[0]}
                      </span>
                      <strong>{route.name.split("—")[1] || route.name}</strong>
                    </div>
                    <p className="route-desc">{route.description}</p>
                    <div className="stops-chips-row">
                      {route.stops.map((s) => (
                        <button
                          key={s.id}
                          className="stop-chip"
                          onClick={() => {
                            onJumpToTarget({ x: s.x, z: s.z, name: s.name });
                            onClose();
                          }}
                        >
                          <MapPin size={11} /> {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====================================================================
              TAB 5: DEAD BATTERY & CAFFEINE RADAR
             ==================================================================== */}
          {activeTab === "amenities" && (
            <div className="tab-section amenities-section">
              <div className="amenities-filter-bar">
                <button
                  className={`chip-btn ${amenityCategory === "all" ? "active" : ""}`}
                  onClick={() => setAmenityCategory("all")}
                >
                  All Hubs
                </button>
                <button
                  className={`chip-btn ${amenityCategory === "caffeine" ? "active" : ""}`}
                  onClick={() => setAmenityCategory("caffeine")}
                >
                  <Coffee size={13} /> Coffee & Starbucks
                </button>
                <button
                  className={`chip-btn ${amenityCategory === "outlets" ? "active" : ""}`}
                  onClick={() => setAmenityCategory("outlets")}
                >
                  <Zap size={13} /> Desks & Wall Outlets
                </button>
                <button
                  className={`chip-btn ${amenityCategory === "printing" ? "active" : ""}`}
                  onClick={() => setAmenityCategory("printing")}
                >
                  <Printer size={13} /> Free Printing Labs
                </button>
              </div>

              <div className="amenities-cards-list">
                {filteredAmenities.map((amenity) => {
                  const dist = Math.round(Math.hypot(amenity.x - carPosition.x, amenity.z - carPosition.z));

                  return (
                    <div key={amenity.id} className="amenity-card">
                      <div className="amenity-left">
                        <div className="amenity-title">
                          <span className="code-pill">{amenity.buildingCode}</span>
                          <strong>{amenity.name}</strong>
                        </div>
                        <span className="amenity-floor">{amenity.buildingName} • {amenity.floor}</span>
                        <p className="amenity-desc">{amenity.description}</p>
                        <span className="amenity-status-tag">{amenity.status}</span>
                      </div>

                      <div className="amenity-right">
                        <span className="dist-tag">{dist} m</span>
                        <button
                          className="c-action-btn primary"
                          onClick={() => {
                            onNavigateToTarget({
                              x: amenity.x,
                              z: amenity.z,
                              name: amenity.name,
                              code: amenity.buildingCode,
                            });
                            onClose();
                          }}
                        >
                          <Navigation size={13} /> GPS Guide
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
