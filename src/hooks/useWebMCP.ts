import { useEffect } from "react";
import { sim } from "../lib/store";
import { landmarks } from "../data/campus";
type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
};
export function useWebMCP() {
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      {
        name: "read_drive_state",
        description: "Read speed, selected landmark, and paused state.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: () => {
          const s = sim.get();
          return {
            speedMph: s.speed,
            zone: s.zone,
            paused: s.paused,
            mode: s.tileStatus,
            localPosition: { x: s.x, y: s.elevation, z: s.z },
            surfaceElevation: s.surfaceElevation,
            groundedWheels: s.groundedWheels,
            tiles: s.tileDiagnostics,
          };
        },
      },
      {
        name: "jump_to_campus_landmark",
        description:
          "Reset the vehicle at a named campus landmark and resume driving.",
        inputSchema: {
          type: "object",
          properties: {
            landmark: { type: "string", enum: landmarks.map((l) => l.id) },
          },
          required: ["landmark"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input) => {
          if (
            !input ||
            typeof input !== "object" ||
            !("landmark" in input) ||
            typeof input.landmark !== "string" ||
            !landmarks.some((l) => l.id === input.landmark)
          )
            throw new Error("Choose a valid campus landmark.");
          sim.set({
            destination: input.landmark,
            reset: sim.get().reset + 1,
            paused: false,
            help: false,
            settings: false,
            mapOpen: false,
          });
          return { landmark: input.landmark, status: "reset_requested" };
        },
      },
    ];
    for (const tool of tools) {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser capability. */
      }
    }
    return () => lifecycle.abort();
  }, []);
}
