import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { searchPlaces } from "../lib/search";
import type { Place } from "../data/explorer";
import Dialog from "./Dialog";
export default function SearchOverlay({
  onSelectPlace,
  onClose,
  initialCategory = "All",
}: {
  onSelectPlace: (p: Place) => void;
  onClose: () => void;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const results = searchPlaces(query, category);
  return (
    <Dialog title="Find a building or place" onClose={onClose}>
      <label className="search-field">
        <Search size={20} />
        <input
          data-autofocus
          aria-label="Building, room, or place"
          placeholder="Try BSN 2102, library, or coffee"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="chips" aria-label="Search categories">
        {[
          ["All", "All"],
          ["Academics", "Classes"],
          ["Student Life & Dining", "Food & places"],
          ["Housing & Dorms", "Housing"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={category === value}
            className={category === value ? "active" : ""}
            onClick={() => setCategory(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="quiet search-help">
        Use the building + room from your schedule. A course number (like CHM
        2045) or CRN doesn’t identify a classroom.
      </p>
      {results.length > 60 && (
        <p className="quiet">
          Showing the first 60 places. Type a name to narrow the list.
        </p>
      )}
      <div className="search-results" aria-live="polite">
        <span className="eyebrow">
          {results.length} CAMPUS DIRECTORY{" "}
          {results.length === 1 ? "PLACE" : "PLACES"}
        </span>
        {!results.length && (
          <div className="empty-state">
            <h3>No match yet</h3>
            <p>
              Try just the building code, or clear the category filter. Your
              detailed class schedule has the building and room.
            </p>
            <button
              className="secondary"
              onClick={() => {
                setCategory("All");
                setQuery("");
              }}
            >
              Show all places
            </button>
          </div>
        )}
        {results.slice(0, 60).map(({ place, matchedRooms }) => (
          <button
            key={place.id}
            className="place-result"
            onClick={() => {
              onSelectPlace(place);
              onClose();
            }}
          >
            <span className="code-badge">{place.code || "•"}</span>
            <span className="result-copy">
              <strong>{place.short}</strong>
              <small>
                {place.requestedRoom
                  ? `Room ${place.requestedRoom} · indoor location unverified`
                  : place.category}
              </small>
              {matchedRooms.length > 0 && (
                <small>Unverified directory mention: {matchedRooms[0]}</small>
              )}
            </span>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
      <p className="quiet">
        <a href="/privacy.html" target="_blank" rel="noreferrer">
          Privacy
        </a>{" "}
        ·{" "}
        <a href="/terms.html" target="_blank" rel="noreferrer">
          Terms
        </a>
      </p>
    </Dialog>
  );
}
