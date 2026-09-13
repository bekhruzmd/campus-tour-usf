import { useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Footprints,
  Plus,
  X,
  MapPin,
  Flag,
} from "lucide-react";
import { searchablePlaces, type Place } from "../data/explorer";
import { CAMPUS_DIRECTORY_SOURCE } from "../data/usfBuildings";
import { walkingUrl } from "../lib/search";
export default function BuildingCard({
  place,
  onClose,
  onAddClass,
  origin,
  onLocate,
  explore,
  onExploreHere,
}: {
  place: Place;
  onClose: () => void;
  onAddClass: () => void;
  origin?: { x: number; z: number };
  onLocate: () => void;
  explore: boolean;
  onExploreHere: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [from, setFrom] = useState("current");
  const start =
    from === "current" ? origin : searchablePlaces.find((p) => p.id === from);
  return (
    <article
      className={`destination-sheet ${expanded ? "expanded" : ""}`}
      aria-label={`${place.short} details`}
    >
      <div className="sheet-grip" aria-hidden="true" />
      <div className="destination-heading">
        <span className="code-badge">{place.code || <MapPin size={20} />}</span>
        <div>
          <span className="eyebrow">{place.category}</span>
          <h2>{place.short}</h2>
          {place.requestedRoom && (
            <p className="room-label">Room {place.requestedRoom}</p>
          )}
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close building details"
        >
          <X size={20} />
        </button>
      </div>
      <div className="destination-actions">
        <a
          className="primary"
          href={walkingUrl(place, start)}
          target="_blank"
          rel="noreferrer"
        >
          <Footprints size={18} />
          Walking directions
          <ArrowUpRight size={16} />
        </a>
        {
          <button
            className="icon-button secondary"
            onClick={onAddClass}
            aria-label="Add this class to My Day"
          >
            <Plus size={20} />
          </button>
        }
      </div>
      <button
        className="sheet-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Less detail" : "Starting point & building details"}
        {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      {expanded && (
        <div className="destination-more">
          <label className="field">
            Walk from
            <select
              aria-label="Walk from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              <option value="current">
                {origin ? "My located position" : "My location in Google Maps"}
              </option>
              {searchablePlaces
                .filter((p) => p.codeVerified)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.short}
                  </option>
                ))}
            </select>
          </label>
          <p className="quiet">
            Opens Google Maps in walking mode. The destination is the building,
            not a verified entrance.
          </p>
          {!origin && (
            <button className="text-button" onClick={onLocate}>
              Use my location on this map
            </button>
          )}
          {place.photo && !photoFailed && (
            <img
              className="building-photo"
              src={place.photo}
              onError={() => setPhotoFailed(true)}
              alt={`${place.name} exterior`}
              loading="lazy"
            />
          )}
          <div className="info-note">
            <strong>
              {place.requestedRoom
                ? `Room ${place.requestedRoom}: indoor location unverified`
                : "Before your first class"}
            </strong>
            <p>
              Entrance, room directions, and step-free access haven’t been
              verified here. Check the building directory when you arrive and
              allow time to find your room.
            </p>
          </div>
          <div className="link-list">
            <a href={CAMPUS_DIRECTORY_SOURCE} target="_blank" rel="noreferrer">
              Official campus directory
              <ArrowUpRight size={16} />
            </a>
            <a href={place.source} target="_blank" rel="noreferrer">
              Building information & current hours
              <ArrowUpRight size={16} />
            </a>
          </div>
          <a
            className="resource-link"
            href={`https://github.com/bekhruzmd/campus-tour-usf/issues/new?${new URLSearchParams({ title: `Map correction: ${place.code || place.short}`, body: `Place: ${place.name}\nRoom: ${place.requestedRoom || "n/a"}\n\nWhat needs correcting?\n\nSource or details:\n` })}`}
            target="_blank"
            rel="noreferrer"
          >
            Report a map correction
            <ArrowUpRight size={16} />
          </a>
          {
            <p className="quiet">
              {place.codeVerified
                ? "Building code checked against USF’s directory · Sep 12, 2026."
                : "Official building code not yet verified."}{" "}
              Map position: OpenStreetMap.
            </p>
          }
          {explore && (
            <button className="secondary" onClick={onExploreHere}>
              <Flag size={16} />
              Move virtual car here
            </button>
          )}
        </div>
      )}
    </article>
  );
}
