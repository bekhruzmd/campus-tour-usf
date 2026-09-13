export type SavedClass = {
  id: string;
  placeId: string;
  room: string;
  day: number;
  start: string;
  end: string;
  found: boolean;
};
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const minuteOfDay = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export function validClass(c: unknown): c is SavedClass {
  if (!c || typeof c !== "object") return false;
  const x = c as SavedClass;
  return (
    typeof x.id === "string" &&
    typeof x.placeId === "string" &&
    typeof x.room === "string" &&
    x.room.length <= 20 &&
    Number.isInteger(x.day) &&
    x.day >= 0 &&
    x.day <= 6 &&
    typeof x.start === "string" &&
    typeof x.end === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(x.start) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(x.end) &&
    minuteOfDay(x.end) > minuteOfDay(x.start) &&
    typeof x.found === "boolean"
  );
}
export function loadClasses(): SavedClass[] {
  try {
    const value = JSON.parse(localStorage.getItem("usf_classes_v1") || "[]");
    return Array.isArray(value) ? value.filter(validClass) : [];
  } catch {
    return [];
  }
}
export function tampaDay() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
  ).getDay();
}
export function saveClasses(value: SavedClass[]) {
  try {
    localStorage.setItem("usf_classes_v1", JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
