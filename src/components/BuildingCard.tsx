import { useState } from "react";
import {
  Camera,
  X,
  Navigation,
  Flag,
  Compass,
  Clock,
  BookOpen,
  MapPin,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
  Landmark,
} from "lucide-react";
import type { Place } from "../data/explorer";

interface BuildingCardProps {
  place: Place;
  isNavigating: boolean;
  onClose: () => void;
  onStartHere: (place: Place) => void;
  onNavigate: (place: Place) => void;
  onAutoDrive?: (place: Place) => void;
}

export default function BuildingCard({
  place,
  isNavigating,
  onClose,
  onStartHere,
  onNavigate,
  onAutoDrive,
}: BuildingCardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "freshman">("overview");
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <article className="enhanced-building-card" aria-label={`${place.name} information card`}>
      {/* Photo Header */}
      <div className="card-photo-wrap">
        {!photoFailed && place.photo ? (
          <img
            key={place.id}
            src={place.photo}
            alt={`${place.name} — USF campus facility`}
            loading="lazy"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <div className="card-photo-placeholder collegiate-plaque">
            <div className="plaque-icon-wrap">
              <Landmark size={24} />
            </div>
            <strong>{place.name}</strong>
            <span>USF TAMPA CAMPUS • [{place.code}]</span>
          </div>
        )}

        <div className="photo-overlay-badges">
          <span className="building-code-badge">{place.code}</span>
          <span className="building-category-badge">{place.category}</span>
        </div>

        <button
          className="close-card-btn"
          aria-label="Close building details"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      {/* Title & Navigation Controls */}
      <div className="card-header-body">
        <span className="eyebrow">{place.category.toUpperCase()}</span>
        <h2>{place.name}</h2>

        {/* Tab Switcher */}
        <div className="card-tabs">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <BookOpen size={13} />
            <span>Overview</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "rooms" ? "active" : ""}`}
            onClick={() => setActiveTab("rooms")}
          >
            <Layers size={13} />
            <span>
              Rooms ({place.roomsAndServices?.length || 0})
            </span>
          </button>
          <button
            className={`tab-btn ${activeTab === "freshman" ? "active" : ""}`}
            onClick={() => setActiveTab("freshman")}
          >
            <Sparkles size={13} />
            <span>Freshman Guide</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="card-scrollable-body">
        {activeTab === "overview" && (
          <div className="tab-pane overview-pane">
            <p className="building-main-desc">{place.description}</p>

            {place.hours && (
              <div className="building-hours-box">
                <Clock size={15} />
                <div>
                  <strong>Operating Hours</strong>
                  <p>{place.hours}</p>
                </div>
              </div>
            )}

            <div className="quick-stats-row">
              <div className="stat-pill">
                <MapPin size={13} />
                <span>Code: <strong>{place.code}</strong></span>
              </div>
              <div className="stat-pill">
                <Compass size={13} />
                <span>North-Up Grid</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "rooms" && (
          <div className="tab-pane rooms-pane">
            {!place.roomsAndServices || place.roomsAndServices.length === 0 ? (
              <p className="no-rooms-msg">General classrooms and offices located across all floors.</p>
            ) : (
              <div className="rooms-directory-list">
                {place.roomsAndServices.map((room, idx) => (
                  <div key={idx} className="room-directory-item">
                    <div className="room-item-header">
                      <strong>{room.name}</strong>
                      {room.floor && <span className="floor-tag">{room.floor}</span>}
                    </div>
                    {room.details && <p className="room-details">{room.details}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "freshman" && (
          <div className="tab-pane freshman-pane">
            <div className="freshman-tip-callout">
              <div className="tip-header">
                <Sparkles size={16} />
                <strong>Freshman Survival Advice</strong>
              </div>
              <p>{place.freshmanTip || "Take advantage of office hours and study rooms here between classes."}</p>
            </div>
            <div className="campus-transit-tip">
              <strong>Getting Here:</strong>
              <p>Catch the USF Bull Runner shuttle or drive your car using the road network. Bicycle racks and scooter hubs are located at the main entrances.</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="card-action-bar">
        <button
          className={`primary-action-btn ${isNavigating ? "navigating" : ""}`}
          onClick={() => onNavigate(place)}
          title="Guide car with a glowing GPS path and compass arrow"
        >
          <Navigation size={15} />
          <span>{isNavigating ? "Route Active" : "GPS Navigate"}</span>
        </button>

        {onAutoDrive && (
          <button
            className="secondary-action-btn"
            onClick={() => onAutoDrive(place)}
            title="Auto-cruise the car along campus roads to this destination"
          >
            <Compass size={15} />
            <span>Drive Me</span>
          </button>
        )}

        <button
          className="secondary-action-btn"
          onClick={() => onStartHere(place)}
          title="Spawn car right by this building"
        >
          <Flag size={15} />
          <span>Park Here</span>
        </button>

        <a
          href={place.source}
          target="_blank"
          rel="noreferrer"
          className="external-link-btn"
          title="Open official USF page"
        >
          <ExternalLink size={15} />
        </a>
      </div>
    </article>
  );
}
