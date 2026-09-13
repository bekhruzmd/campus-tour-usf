import { useState } from "react";
import { ArrowUpRight, Check, Plus, Trash2 } from "lucide-react";
import { searchablePlaces, type Place } from "../data/explorer";
import { DAYS, minuteOfDay, tampaDay, type SavedClass } from "../lib/student";
import { walkingUrl } from "../lib/search";
import Dialog from "./Dialog";
export default function MyDay({
  classes,
  onChange,
  onSelect,
  onClose,
  initialPlace,
}: {
  classes: SavedClass[];
  onChange: (c: SavedClass[]) => void;
  onSelect: (p: Place) => void;
  onClose: () => void;
  initialPlace?: Place;
}) {
  const [day, setDay] = useState(tampaDay());
  const [adding, setAdding] = useState(!!initialPlace);
  const [placeId, setPlaceId] = useState(initialPlace?.id || "");
  const [room, setRoom] = useState(initialPlace?.requestedRoom || "");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("09:50");
  const [error, setError] = useState("");
  const entries = classes
    .filter((c) => c.day === day)
    .sort((a, b) => a.start.localeCompare(b.start));
  return (
    <Dialog title="My Day" onClose={onClose}>
      <p className="quiet">
        Your weekly classes, saved on this device. Times are for Tampa.
      </p>
      <div className="day-picker">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <button
            key={d}
            aria-pressed={day === d}
            onClick={() => setDay(d)}
            className={day === d ? "active" : ""}
          >
            {DAYS[d]}
          </button>
        ))}
      </div>
      {entries.length === 0 && !adding && (
        <div className="empty-state">
          <span className="empty-icon">↗</span>
          <h3>A little less first-day stress.</h3>
          <p>
            Add the buildings and rooms from your schedule. Keep your next class
            one tap away.
          </p>
        </div>
      )}
      <div className="day-list">
        {entries.map((c, i) => {
          const place = searchablePlaces.find((p) => p.id === c.placeId);
          if (!place) return null;
          const previous = entries[i - 1];
          const prevPlace =
            previous && searchablePlaces.find((p) => p.id === previous.placeId);
          const gap = previous
            ? minuteOfDay(c.start) - minuteOfDay(previous.end)
            : null;
          return (
            <div key={c.id}>
              {gap !== null && (
                <div className={`class-gap ${gap < 15 ? "tight" : ""}`}>
                  {gap < 0 ? "Classes overlap" : `${gap} min between classes`}
                  {prevPlace && (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={walkingUrl(place, prevPlace)}
                    >
                      Check the walk
                      <ArrowUpRight size={13} />
                    </a>
                  )}
                </div>
              )}
              <div className="class-row">
                <span className="class-time">
                  {c.start}
                  <small>{c.end}</small>
                </span>
                <button
                  className="class-place"
                  onClick={() => {
                    onSelect({ ...place, requestedRoom: c.room || undefined });
                    onClose();
                  }}
                >
                  <strong>
                    {place.code || place.short}
                    {c.room && ` ${c.room}`}
                  </strong>
                  <small>{place.short}</small>
                </button>
                <button
                  className="icon-button"
                  aria-label={`Remove ${place.code || place.short} ${c.room}`}
                  onClick={() => onChange(classes.filter((x) => x.id !== c.id))}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <button
                className={`rehearsal-check ${c.found ? "done" : ""}`}
                aria-pressed={c.found}
                onClick={() =>
                  onChange(
                    classes.map((x) =>
                      x.id === c.id ? { ...x, found: !x.found } : x,
                    ),
                  )
                }
              >
                <span>{c.found && <Check size={13} />}</span>
                {c.found
                  ? "I’ve found this room"
                  : "Mark room found on your practice walk"}
              </button>
            </div>
          );
        })}
      </div>
      {!adding ? (
        <button className="primary full" onClick={() => setAdding(true)}>
          <Plus size={18} />
          Add a class
        </button>
      ) : (
        <form
          className="class-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!placeId || minuteOfDay(end) <= minuteOfDay(start)) {
              setError("Choose a building and an end time after the start.");
              return;
            }
            onChange([
              ...classes,
              {
                id: crypto.randomUUID(),
                placeId,
                room: room.trim(),
                day,
                start,
                end,
                found: false,
              },
            ]);
            setAdding(false);
            setRoom("");
            setError("");
          }}
        >
          <h3>Add a class · {DAYS[day]}</h3>
          <label className="field">
            Building
            <select
              aria-label="Building"
              required
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
            >
              <option value="">Choose a building</option>
              {searchablePlaces
                .filter((p) => p.codeVerified || p.id === initialPlace?.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.short}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            Room <span className="quiet">optional</span>
            <input
              maxLength={20}
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. 2102"
            />
          </label>
          <div className="field-pair">
            <label className="field">
              Starts
              <input
                required
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label className="field">
              Ends
              <input
                required
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="button-row">
            <button className="primary" type="submit">
              Save class
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => setAdding(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {entries.length > 0 && (
        <p className="quiet">
          Practice walk: open each class for walking directions, then mark its
          room found. Walking times and indoor access must be checked; a short
          gap isn’t a route estimate.
        </p>
      )}
    </Dialog>
  );
}
