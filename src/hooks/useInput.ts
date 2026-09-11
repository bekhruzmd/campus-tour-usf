import { useEffect } from "react";
import { keys, sim } from "../lib/store";
export function useInput() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,select,textarea")) return;
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      keys.add(e.code);
      if (e.repeat) return;
      const s = sim.get();
      if (s.help || s.settings || s.mapOpen) {
        if (e.code === "Escape")
          sim.set({ help: false, settings: false, mapOpen: false });
        return;
      }
      if (e.code === "KeyP" || e.code === "Escape")
        sim.set({ paused: !s.paused });
      if (e.code === "KeyR") sim.set({ reset: s.reset + 1 });
      if (e.code === "KeyM") sim.set({ mapOpen: !s.mapOpen });
      if (e.code === "KeyC")
        sim.set({ camera: s.camera === "chase" ? "wide" : "chase" });
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    const blur = () => {
      keys.clear();
      sim.set({ paused: true });
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      keys.clear();
    };
  }, []);
}
