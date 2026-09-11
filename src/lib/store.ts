import { useSyncExternalStore } from "react";
export type TileStatus = "demo" | "loading" | "live" | "error";
export type State = {
  speed: number;
  gear: "D" | "R";
  x: number;
  z: number;
  heading: number;
  road: string;
  zone: string;
  paused: boolean;
  reset: number;
  destination: string;
  mapOpen: boolean;
  help: boolean;
  settings: boolean;
  tileStatus: TileStatus;
  credits: string;
  quality: "balanced" | "high";
  camera: "chase" | "wide";
  distance: number;
};
let state: State = {
  speed: 0,
  gear: "D",
  x: 0,
  z: 0,
  heading: 0,
  road: "Leroy Collins Boulevard",
  zone: "USF Library",
  paused: false,
  reset: 0,
  destination: "library",
  mapOpen: false,
  help: false,
  settings: false,
  tileStatus: "demo",
  credits: "",
  quality: "balanced",
  camera: "chase",
  distance: 0,
};
const listeners = new Set<() => void>();
export const sim = {
  get: () => state,
  set: (patch: Partial<State>) => {
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  },
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
export const useSim = () => useSyncExternalStore(sim.subscribe, sim.get);
export const keys = new Set<string>();
