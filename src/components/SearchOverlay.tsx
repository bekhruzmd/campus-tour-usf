import { useState, useMemo } from "react";
import {
  Search,
  X,
  Navigation,
  MapPin,
  Car,
  Compass,
  Building as BuildingIcon,
} from "lucide-react";
import {
  buildings,
  places,
  buildingToPlace,
  type Place,
  type ProjectedBuilding,
} from "../data/explorer";
import type { BuildingCategory } from "../data/usfBuildings";

interface SearchOverlayProps {
  carPosition: { x: number; z: number };
  onSelectPlace: (place: Place, action?: "view" | "navigate" | "teleport") => void;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { label: string; value: BuildingCategory | "All" }[] = [
  { label: "All Buildings", value: "All" },
  { label: "Academics", value: "Academics" },
  { label: "Dining & Student Life", value: "Student Life & Dining" },
  { label: "Dorms & Housing", value: "Housing & Dorms" },
  { label: "Athletics & Rec", value: "Athletics & Rec" },
  { label: "Health & Medicine", value: "Health & Medicine" },
  { label: "Services & Aid", value: "Services & Admin" },
];

export default function SearchOverlay({
  carPosition,
  onSelectPlace,
  isOpen,
  onClose,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<BuildingCategory | "All">("All");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Map all named buildings
    const candidates: {
      place: Place;
      building?: ProjectedBuilding;
      matchedRooms: string[];
      score: number;
    }[] = [];

    // First check curated places
    for (const p of places) {
      if (activeCategory !== "All" && p.category !== activeCategory) continue;

      let score = 0;
      const matchedRooms: string[] = [];

      if (q) {
        if (p.code.toLowerCase() === q) score += 100;
        else if (p.code.toLowerCase().includes(q)) score += 50;

        if (p.name.toLowerCase().includes(q)) score += 40;
        if (p.short.toLowerCase().includes(q)) score += 35;
        if (p.description.toLowerCase().includes(q)) score += 10;

        // Search rooms & services
        for (const r of p.roomsAndServices || []) {
          if (
            r.name.toLowerCase().includes(q) ||
            r.details?.toLowerCase().includes(q)
          ) {
            score += 25;
            matchedRooms.push(r.name);
          }
        }
      } else {
        score = 1;
      }

      if (!q || score > 0) {
        candidates.push({ place: p, matchedRooms, score });
      }
    }

    // Also include other named buildings from OSM that are not in places
    for (const b of buildings) {
      if (!b.name) continue;
      if (candidates.some((c) => c.place.name === b.name || c.place.code === b.profile.code))
        continue;
      if (activeCategory !== "All" && b.profile.category !== activeCategory) continue;

      let score = 0;
      const matchedRooms: string[] = [];

      if (q) {
        if (b.profile.code.toLowerCase() === q) score += 90;
        else if (b.profile.code.toLowerCase().includes(q)) score += 45;

        if (b.name.toLowerCase().includes(q)) score += 35;
        if (b.profile.description.toLowerCase().includes(q)) score += 10;

        for (const r of b.profile.roomsAndServices || []) {
          if (
            r.name.toLowerCase().includes(q) ||
            r.details?.toLowerCase().includes(q)
          ) {
            score += 20;
            matchedRooms.push(r.name);
          }
        }
      } else {
        score = 0.5;
      }

      if (!q || score > 0) {
        candidates.push({
          place: buildingToPlace(b),
          building: b,
          matchedRooms,
          score,
        });
      }
    }

    // Sort by relevance score, then distance
    return candidates.sort((a, b) => {
      if (q && b.score !== a.score) return b.score - a.score;
      const distA = Math.hypot(a.place.x - carPosition.x, a.place.z - carPosition.z);
      const distB = Math.hypot(b.place.x - carPosition.x, b.place.z - carPosition.z);
      return distA - distB;
    });
  }, [query, activeCategory, carPosition]);

  if (!isOpen) return null;

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div
        className="search-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search USF Campus Buildings and Rooms"
      >
        <div className="search-input-header">
          <Search size={22} className="search-icon" />
          <input
            type="text"
            className="search-main-input"
            placeholder="Search code (e.g. LIB, MSC, CPR), room, or service (e.g. Starbucks, Gym)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              className="clear-query-btn"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}
          <button className="close-search-btn" onClick={onClose} aria-label="Close search">
            Esc
          </button>
        </div>

        {/* Category Filters */}
        <div className="search-filter-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`chip-btn ${activeCategory === cat.value ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="search-results-list">
          {results.length === 0 ? (
            <div className="no-results-view">
              <BuildingIcon size={38} />
              <p>No buildings or rooms match "{query}"</p>
              <small>Try searching by 3-letter code like <strong>LIB</strong>, <strong>MSC</strong>, <strong>BSN</strong>, or amenities like <strong>Starbucks</strong>, <strong>Financial Aid</strong>, <strong>Tutoring</strong>.</small>
            </div>
          ) : (
            results.slice(0, 30).map(({ place, matchedRooms }) => {
              const distanceMeters = Math.round(
                Math.hypot(place.x - carPosition.x, place.z - carPosition.z)
              );

              return (
                <div key={place.id + place.code} className="search-result-row">
                  <div
                    className="result-main-info"
                    onClick={() => {
                      onSelectPlace(place, "view");
                      onClose();
                    }}
                  >
                    <div className="result-title-line">
                      <span className="code-pill">{place.code}</span>
                      <strong>{place.name}</strong>
                      <span className="category-tag">{place.category}</span>
                    </div>

                    <p className="result-desc">{place.description}</p>

                    {matchedRooms.length > 0 && (
                      <div className="matched-rooms-badge">
                        <span>Includes:</span>{" "}
                        {matchedRooms.slice(0, 3).join(" • ")}
                        {matchedRooms.length > 3 ? ` +${matchedRooms.length - 3} more` : ""}
                      </div>
                    )}

                    <div className="distance-indicator">
                      <Compass size={13} /> {distanceMeters} m from your car
                    </div>
                  </div>

                  <div className="result-actions">
                    <button
                      className="action-btn nav-btn"
                      title="Navigate to this building with GPS line"
                      onClick={() => {
                        onSelectPlace(place, "navigate");
                        onClose();
                      }}
                    >
                      <Navigation size={15} />
                      <span>GPS Route</span>
                    </button>
                    <button
                      className="action-btn teleport-btn"
                      title="Park car near this building"
                      onClick={() => {
                        onSelectPlace(place, "teleport");
                        onClose();
                      }}
                    >
                      <Car size={15} />
                      <span>Park Here</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="search-footer-hint">
          <span>Pro tip: Click any building footprint on the map to inspect its rooms.</span>
          <span>Showing {results.length} locations</span>
        </div>
      </div>
    </div>
  );
}
