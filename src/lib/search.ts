import { searchablePlaces, type Place } from "../data/explorer";
const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

export function searchPlaces(
  query: string,
  category = "All",
): { place: Place; matchedRooms: string[]; score: number }[] {
  const q = query.trim().toLowerCase();
  const compact = normalize(q);
  const roomQuery = q.match(/^([a-z]{2,5})[\s-]*(?:room\s*)?(\d{2,5}[a-z]?)$/i);
  const results = searchablePlaces
    .filter((p) => category === "All" || p.category === category)
    .map((p) => {
      const codes = [
        p.code,
        ...(p.aliases || []).filter((a) => /^[a-z]{2,5}$/i.test(a)),
      ].filter(
        (c) =>
          c &&
          (c === p.code ||
            !searchablePlaces.some(
              (other) => other.code && normalize(other.code) === normalize(c),
            )),
      );
      const matchesBuilding =
        !!roomQuery &&
        codes.some((c) => normalize(c) === normalize(roomQuery[1]));
      const matchedRooms = p.roomsAndServices
        .filter(
          (r) =>
            compact &&
            normalize(`${r.name} ${r.floor || ""} ${r.details || ""}`).includes(
              compact,
            ),
        )
        .map((r) => r.name);
      let score = !q ? (p.codeVerified ? 20 : 1) : 0;
      if (compact && codes.some((c) => normalize(c) === compact)) score = 100;
      if (matchesBuilding) score = 120;
      if (
        !roomQuery &&
        q &&
        [p.name, p.short, ...(p.aliases || [])].some((s) =>
          s.toLowerCase().includes(q),
        )
      )
        score = Math.max(score, 60);
      if (matchedRooms.length) score = Math.max(score, 50);
      return {
        place: {
          ...p,
          requestedRoom: matchesBuilding
            ? roomQuery![2].toUpperCase()
            : undefined,
        },
        matchedRooms,
        score,
      };
    })
    .filter((r) => r.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name),
    );
  // Exact official codes should not be drowned out by incidental text matches.
  return results.some((r) => r.score >= 100)
    ? results.filter((r) => r.score >= 100)
    : results;
}

export function walkingUrl(
  destination: { x: number; z: number },
  origin?: { x: number; z: number },
) {
  const coord = (p: { x: number; z: number }) =>
    `${(28.0587 - p.z / 110820).toFixed(7)},${(-82.4139 + p.x / 98230).toFixed(7)}`;
  const params = new URLSearchParams({
    api: "1",
    destination: coord(destination),
    travelmode: "walking",
  });
  if (origin) params.set("origin", coord(origin));
  return `https://www.google.com/maps/dir/?${params}`;
}
