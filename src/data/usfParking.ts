import { project } from "./explorer";

export type USFParkingGarage = {
  id: string;
  code: string;
  name: string;
  shortName: string;
  totalSpaces: number;
  levels: number;
  permits: ("S" | "E" | "D" | "Y" | "Visitor")[];
  coordinates: { lat: number; lon: number };
  x: number;
  z: number;
  bestFor: string[]; // Building codes this garage serves best
  tips: string;
};

export const USF_PARKING_FACILITIES: USFParkingGarage[] = [
  {
    id: "beard",
    code: "BEARD",
    name: "Richard A. Beard Parking Facility",
    shortName: "Beard Garage",
    totalSpaces: 1980,
    levels: 6,
    permits: ["S", "E", "Visitor"],
    coordinates: { lat: 28.0583, lon: -82.4172 },
    x: project(28.0583, -82.4172).x,
    z: project(28.0583, -82.4172).z,
    bestFor: ["LIB", "ENG", "ENB", "ENC", "ISA", "CHE", "SCA", "NES"],
    tips: "Floor 1 is Employee/Visitor. Student (S) parking starts on Floor 2. Fills quickly between 10:00 AM - 1:00 PM; head directly to Floors 5-6.",
  },
  {
    id: "collins",
    code: "COLLINS",
    name: "Collins Boulevard Parking Facility",
    shortName: "Collins Garage",
    totalSpaces: 1450,
    levels: 5,
    permits: ["S", "E", "Visitor"],
    coordinates: { lat: 28.0618, lon: -82.4087 },
    x: project(28.0618, -82.4087).x,
    z: project(28.0618, -82.4087).z,
    bestFor: ["BSN", "EDU", "CIS", "BEH", "SOC", "GHC", "MUS"],
    tips: "Best for Business, Education, and Honors classes. Level 4 and roof almost always have open spots even during lunch rush.",
  },
  {
    id: "crescent",
    code: "CRESCENT",
    name: "Crescent Hill Parking Garage",
    shortName: "Crescent Garage",
    totalSpaces: 1100,
    levels: 4,
    permits: ["S", "E", "Visitor"],
    coordinates: { lat: 28.0632, lon: -82.4162 },
    x: project(28.0632, -82.4162).x,
    z: project(28.0632, -82.4162).z,
    bestFor: ["MSC", "CPR", "SVC", "BKS", "CAS"],
    tips: "Right next to Cooper Hall and Marshall Center. Highest demand on campus; arrive before 9:30 AM or after 2:30 PM for easy parking.",
  },
  {
    id: "laurel",
    code: "LAUREL",
    name: "Laurel Drive Parking Facility",
    shortName: "Laurel Garage",
    totalSpaces: 1250,
    levels: 5,
    permits: ["S", "E"],
    coordinates: { lat: 28.0664, lon: -82.4158 },
    x: project(28.0664, -82.4158).x,
    z: project(28.0664, -82.4158).z,
    bestFor: ["REC", "SHS", "HUB", "FIT", "PIN", "PUB"],
    tips: "Ideal for Campus Rec gym workouts, Student Health Center appointments, and northern campus dorms.",
  },
  {
    id: "yuengling_lots",
    code: "YNG-LOTS",
    name: "Yuengling Center Outer Lots (Lots 22A-E)",
    shortName: "Yuengling Outer Lots",
    totalSpaces: 2600,
    levels: 1,
    permits: ["S", "Y", "D"],
    coordinates: { lat: 28.0581, lon: -82.4045 },
    x: project(28.0581, -82.4045).x,
    z: project(28.0581, -82.4045).z,
    bestFor: ["YNG", "BOT", "JPH", "REC"],
    tips: "Massive surface lots with guaranteed spots all day long! Hop directly onto Bull Runner Route A or B for a quick 3-minute ride into campus core.",
  },
];

// Time-of-day parking occupancy model based on historic USF commuter trends
export function getGarageOccupancy(garageId: string, customHour?: number): {
  occupancyPercent: number;
  availableSpots: number;
  status: "Low" | "Moderate" | "Busy" | "Nearly Full";
  color: string;
} {
  const garage = USF_PARKING_FACILITIES.find((g) => g.id === garageId);
  const total = garage?.totalSpaces || 1000;

  const now = new Date();
  const hour = customHour !== undefined ? customHour : now.getHours() + now.getMinutes() / 60;
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  let basePercent = 20;

  if (isWeekend) {
    basePercent = 15;
  } else if (hour < 7.5) {
    basePercent = 12;
  } else if (hour >= 7.5 && hour < 9.0) {
    basePercent = 25 + (hour - 7.5) * 26; // 25% -> 64%
  } else if (hour >= 9.0 && hour < 11.5) {
    basePercent = 64 + (hour - 9.0) * 12; // 64% -> 94% peak
  } else if (hour >= 11.5 && hour < 13.5) {
    basePercent = 94 - (hour - 11.5) * 4; // 94% -> 86%
  } else if (hour >= 13.5 && hour < 16.0) {
    basePercent = 86 - (hour - 13.5) * 16; // 86% -> 46%
  } else if (hour >= 16.0 && hour < 19.0) {
    basePercent = 46 - (hour - 16.0) * 7; // 46% -> 25%
  } else {
    basePercent = 18;
  }

  // Crescent & Beard fill faster than Yuengling lots
  if (garageId === "crescent" || garageId === "beard") basePercent = Math.min(98, basePercent * 1.05);
  if (garageId === "yuengling_lots") basePercent = Math.max(10, basePercent * 0.72);

  const occupancyPercent = Math.round(Math.max(8, Math.min(98, basePercent)));
  const availableSpots = Math.max(10, Math.round(total * (1 - occupancyPercent / 100)));

  let status: "Low" | "Moderate" | "Busy" | "Nearly Full" = "Low";
  let color = "#22a06b"; // Green

  if (occupancyPercent >= 90) {
    status = "Nearly Full";
    color = "#d9383a"; // Red
  } else if (occupancyPercent >= 75) {
    status = "Busy";
    color = "#e68a19"; // Orange
  } else if (occupancyPercent >= 45) {
    status = "Moderate";
    color = "#cca325"; // Yellow/Gold
  }

  return { occupancyPercent, availableSpots, status, color };
}

// Find the best garage for a specific destination building
export function matchBestGarage(
  targetPos: { x: number; z: number; code?: string },
  customHour?: number
): {
  recommended: USFParkingGarage;
  walkTimeMins: number;
  walkDistanceMeters: number;
  occupancy: ReturnType<typeof getGarageOccupancy>;
  allRanked: {
    garage: USFParkingGarage;
    walkTimeMins: number;
    walkDistanceMeters: number;
    occupancy: ReturnType<typeof getGarageOccupancy>;
    score: number;
  }[];
} {
  const ranked = USF_PARKING_FACILITIES.map((garage) => {
    const dist = Math.hypot(garage.x - targetPos.x, garage.z - targetPos.z);
    const walkTimeMins = Math.max(1, Math.round(dist / 80)); // ~80m per min brisk walk
    const occupancy = getGarageOccupancy(garage.id, customHour);

    // Score combines walking time + occupancy penalty
    const isDirectMatch = targetPos.code && garage.bestFor.includes(targetPos.code);
    const score = walkTimeMins + (occupancy.occupancyPercent / 100) * 12 - (isDirectMatch ? 4 : 0);

    return {
      garage,
      walkTimeMins,
      walkDistanceMeters: Math.round(dist),
      occupancy,
      score,
    };
  }).sort((a, b) => a.score - b.score);

  const best = ranked[0];

  return {
    recommended: best.garage,
    walkTimeMins: best.walkTimeMins,
    walkDistanceMeters: best.walkDistanceMeters,
    occupancy: best.occupancy,
    allRanked: ranked,
  };
}

export type ParkedCarRecord = {
  garageName: string;
  floor?: string;
  note?: string;
  timestamp: string;
  x: number;
  z: number;
};

const STORAGE_KEY = "usf_parked_car_location";

export function saveParkedCar(record: ParkedCarRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {}
}

export function loadParkedCar(): ParkedCarRecord | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearParkedCar() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
