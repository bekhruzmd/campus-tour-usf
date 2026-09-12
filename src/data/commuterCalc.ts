import { matchBestGarage, getGarageOccupancy } from "./usfParking";

export type CommuterOrigin = {
  id: string;
  name: string;
  driveTimeMins: number;
  typicalTrafficBonusMins: number;
  routeSummary: string;
};

export const COMMUTER_ORIGINS: CommuterOrigin[] = [
  {
    id: "new_tampa",
    name: "New Tampa / Tampa Palms",
    driveTimeMins: 16,
    typicalTrafficBonusMins: 8,
    routeSummary: "via Bruce B. Downs Blvd (traffic near Fletcher Ave)",
  },
  {
    id: "brandon",
    name: "Brandon / Riverview",
    driveTimeMins: 28,
    typicalTrafficBonusMins: 14,
    routeSummary: "via I-75 North to Fowler Ave Exit 265",
  },
  {
    id: "st_pete",
    name: "St. Petersburg / Pinellas",
    driveTimeMins: 42,
    typicalTrafficBonusMins: 18,
    routeSummary: "via I-275 North over Howard Frankland Bridge to Fowler Ave",
  },
  {
    id: "carrollwood",
    name: "Carrollwood / Citrus Park",
    driveTimeMins: 22,
    typicalTrafficBonusMins: 10,
    routeSummary: "via Fletcher Ave East straight into campus",
  },
  {
    id: "south_tampa",
    name: "South Tampa / Downtown",
    driveTimeMins: 26,
    typicalTrafficBonusMins: 12,
    routeSummary: "via I-275 North or I-4 to I-75",
  },
  {
    id: "wesley_chapel",
    name: "Wesley Chapel / Land O' Lakes",
    driveTimeMins: 25,
    typicalTrafficBonusMins: 12,
    routeSummary: "via I-75 South to Fletcher Ave Exit",
  },
];

export function calculateDepartureTime({
  classTimeStr, // e.g. "11:00"
  originId,
  targetPos,
}: {
  classTimeStr: string;
  originId: string;
  targetPos: { x: number; z: number; code?: string };
}) {
  const origin = COMMUTER_ORIGINS.find((o) => o.id === originId) || COMMUTER_ORIGINS[0];

  // Parse class hour & min
  const [hStr, mStr] = classTimeStr.split(":");
  const classHour = parseInt(hStr || "11", 10);
  const classMin = parseInt(mStr || "00", 10);
  const classTotalMinutes = classHour * 60 + classMin;

  // Best garage recommendation & walk time
  const garageMatch = matchBestGarage(targetPos, classHour);
  const walkMins = garageMatch.walkTimeMins;

  // Parking search delay based on garage occupancy at arrival time
  // Peak rush 9:30 AM to 1:30 PM adds 12-16 mins circling
  const arrivalHourEstimate = (classTotalMinutes - walkMins - 20) / 60;
  const occupancy = getGarageOccupancy(garageMatch.recommended.id, arrivalHourEstimate);

  let garageSearchMins = 4; // minimum time to enter, park, and exit car
  if (occupancy.occupancyPercent >= 90) {
    garageSearchMins = 16; // heavy circling
  } else if (occupancy.occupancyPercent >= 75) {
    garageSearchMins = 11;
  } else if (occupancy.occupancyPercent >= 50) {
    garageSearchMins = 7;
  }

  // Drive time with morning/afternoon traffic buffer
  const isMorningPeak = arrivalHourEstimate >= 7.5 && arrivalHourEstimate <= 10.0;
  const isAfternoonPeak = arrivalHourEstimate >= 14.5 && arrivalHourEstimate <= 18.0;
  const trafficBuffer = (isMorningPeak || isAfternoonPeak) ? origin.typicalTrafficBonusMins : Math.round(origin.typicalTrafficBonusMins * 0.4);
  const totalDriveMins = origin.driveTimeMins + trafficBuffer;

  // Total buffer before class starts
  const totalBufferMins = totalDriveMins + garageSearchMins + walkMins;
  const departureTotalMinutes = classTotalMinutes - totalBufferMins;

  // Format departure time string
  const depHourRaw = Math.floor(departureTotalMinutes / 60);
  const depMinRaw = departureTotalMinutes % 60;

  const depHour = depHourRaw % 12 === 0 ? 12 : depHourRaw % 12;
  const depAmpm = depHourRaw >= 12 && depHourRaw < 24 ? "PM" : "AM";
  const depTimeFormatted = `${depHour}:${depMinRaw.toString().padStart(2, "0")} ${depAmpm}`;

  return {
    recommendedDepartureTime: depTimeFormatted,
    totalBufferMinutes: totalBufferMins,
    driveMinutes: totalDriveMins,
    garageSearchMinutes: garageSearchMins,
    walkMinutes: walkMins,
    recommendedGarage: garageMatch.recommended,
    garageOccupancy: occupancy,
    origin,
    summaryAdvice: `Leave by ${depTimeFormatted} (${totalDriveMins}m drive + ${garageSearchMins}m to park on ${garageMatch.recommended.shortName} + ${walkMins}m walk to class).`,
  };
}
