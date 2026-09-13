import { buildings } from "./explorer";
export type ParkingPermit = "S" | "R" | "E" | "Y" | "Visitor";
export const PARKING_SOURCE =
  "https://www.usf.edu/parking/permits/permit-types.aspx";
// Designations from USF campus directory (2026-09-12); map points from OSM footprints.
const facilities: { name: string; short: string; permits: ParkingPermit[] }[] =
  [
    {
      name: "Richard A. Beard Parking Facility",
      short: "Beard Garage",
      permits: ["S", "R"],
    },
    {
      name: "Collins Boulevard Parking Facility",
      short: "Collins Garage",
      permits: ["S"],
    },
    {
      name: "Crescent Hill Parking Garage",
      short: "Crescent Garage",
      permits: ["S", "R", "E"],
    },
    {
      name: "Laurel Drive Parking Facility",
      short: "Laurel Garage",
      permits: ["S", "E"],
    },
  ];
export const USF_PARKING_FACILITIES = facilities.flatMap((f) => {
  const building = buildings.find((b) => b.name === f.name);
  return building
    ? [
        {
          id: String(building.id),
          name: f.name,
          shortName: f.short,
          permits: f.permits,
          x: building.x,
          z: building.z,
        },
      ]
    : [];
});
export type ParkedCarRecord = {
  garageName: string;
  floor?: string;
  note?: string;
  timestamp: string;
  x: number;
  z: number;
};
// v2 ignores old records that may have saved a recommendation rather than an actual selection.
const STORAGE_KEY = "usf_parked_car_v2";
export function saveParkedCar(record: ParkedCarRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}
export function loadParkedCar(): ParkedCarRecord | null {
  try {
    const r = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return r &&
      typeof r.garageName === "string" &&
      typeof r.timestamp === "string" &&
      Number.isFinite(Date.parse(r.timestamp)) &&
      (r.floor === undefined || typeof r.floor === "string") &&
      (r.note === undefined || typeof r.note === "string") &&
      Number.isFinite(r.x) &&
      Number.isFinite(r.z)
      ? r
      : null;
  } catch {
    return null;
  }
}
export function clearParkedCar() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
