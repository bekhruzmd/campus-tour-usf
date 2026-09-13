// A planning aid with explicit, user-provided buffers, not a traffic prediction.
export function departurePlan(
  classTime: string,
  travel: number,
  parking: number,
  walk: number,
  arrival: number,
) {
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(classTime) ||
    [travel, parking, walk, arrival].some(
      (n) => !Number.isFinite(n) || n < 0 || n > 240,
    )
  )
    return null;
  const total = travel + parking + walk + arrival;
  const minutes =
    Number(classTime.slice(0, 2)) * 60 + Number(classTime.slice(3)) - total;
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return {
    time: `${Math.floor(normalized / 60)
      .toString()
      .padStart(2, "0")}:${Math.floor(normalized % 60)
      .toString()
      .padStart(2, "0")}`,
    previousDay: minutes < 0,
    total,
  };
}
