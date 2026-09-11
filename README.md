# USF Campus Drive

A functional Vite + TypeScript + React Three Fiber driving simulation of the USF Tampa campus. Cannon-es supplies a four-wheel raycast vehicle. NASA AMMOS `3d-tiles-renderer` streams Google Photorealistic 3D Tiles, directly or through Cesium ion.

## Run

Requires Node.js 22 and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

The app runs without credentials in **OSM schematic mode**. The checked-in data contains 804 road ways and 260 building footprints downloaded from OpenStreetMap on September 11, 2026. These are real geographic outlines; fallback building heights, vegetation, pavement widths, and flat elevations are approximate. The fallback is explicitly labeled and is not photorealistic Google imagery.

For Google imagery, configure one provider in `.env.local` and restart Vite:

```dotenv
VITE_GOOGLE_MAPS_API_KEY=your_browser_key
# Or:
VITE_CESIUM_ION_TOKEN=your_scoped_public_token
VITE_CESIUM_ION_ASSET_ID=2275207
VITE_ORIGIN_HEIGHT=0
```

Enable Google Map Tiles API and billing for the direct key. Restrict the key by website referrers and API. All `VITE_` values are visible to the browser; never put server secrets in them. Cesium ion access must include a Google Photorealistic 3D Tiles asset. The default asset ID is configurable. Production builds bake these values into JavaScript; configure them before `npm run build`.

**Authenticated Google Photorealistic 3D Tiles are configured through Cesium ion asset 2275207.** Local browser validation confirmed imagery, attribution, and four-wheel ground contact at campus landmark spawns. The supplied token is stored only in ignored `.env.local` and is embedded in the browser bundle at build time. Live rendering does not establish surveyed accuracy or guarantee artifact-free coverage. A failed initial request retains the usable schematic environment. Partial failures after live imagery starts retain the live terrain and existing road colliders.

## Controls

| Input              | Action                                  |
| ------------------ | --------------------------------------- |
| W / Up             | Accelerate                              |
| S / Down           | Brake until stopped, then reverse       |
| A, D / Left, Right | Steer                                   |
| Space              | Rear-wheel handbrake                    |
| Mouse drag         | Orbit, with damped return to chase view |
| C                  | Change chase distance                   |
| R                  | Reset at the selected landmark          |
| M                  | Open campus map                         |
| P / Escape         | Pause / resume                          |

The landmark selector and expanded map jump to the nearest primary-road segment. Mobile includes basic touch driving buttons. Focus loss releases held inputs and pauses the simulation. Settings and modal dialogs suspend physics.

## Modules

| File                                    | Responsibility                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/App.tsx`                           | R3F canvas, scene composition, WebGL error boundary                                     |
| `src/hooks/useCampusTiles.tsx`          | Authentication, tile lifetime, LOD/cache limits, attribution, transient terrain samples |
| `src/lib/geo.ts`                        | WGS84 ECEF conversion, local east/up/south tangent frame, bounds                        |
| `src/lib/physics.ts`                    | Cannon world, suspension, primary road patches, boundary colliders                      |
| `src/components/Vehicle.tsx`            | Fixed-step driving inputs, car and wheel transforms, telemetry                          |
| `src/components/ChaseCamera.tsx`        | Frame-rate independent damping, orbit, speed-sensitive FOV                              |
| `src/components/SunLight.tsx`           | Vehicle-centered sun shadow coverage                                                    |
| `src/components/Campus.tsx`             | Batched OSM fallback geometry and illustrative vegetation                               |
| `src/components/Hud.tsx`, `Minimap.tsx` | Speed, zone, map, landmark jumps, controls and settings                                 |
| `src/data/campus.ts`, `osm.json`        | Projected campus source data, road lookup and landmarks                                 |
| `scripts/import-osm.mjs`                | Reproducible OSM JSON import                                                            |

## Coordinate and terrain model

The origin is **28.0587° N, 82.4139° W**. CPU-side doubles transform WGS84 ECEF positions into local metres: +X east, +Y up, −Z north. Google tiles receive the same ECEF-to-local transform; physics never integrates at Earth-radius magnitudes. `VITE_ORIGIN_HEIGHT` is WGS84 ellipsoid height, **not** orthometric elevation above sea level.

A conservative rectangle stays inside Fowler Avenue (south), Fletcher Avenue (north), Bruce B. Downs Boulevard (west), and the westernmost Bull Run curve (east): south 28.05465, north 28.0690, west −82.42585, east −82.4056. It deliberately omits a narrow eastern strip rather than include off-campus driving. This is a simulation boundary, not a surveyed university property polygon. Physics walls and visual clipping enforce it. Google hierarchy traversal may still request ancestor tiles covering a larger area; clipping does not claim to prevent all out-of-bounds network requests.

Fallback terrain is flat. Leroy Collins Boulevard, Alumni Drive, Holly Drive, and Genshaft Drive have independent static road patches no longer than 16 m. In live mode, five nearby patches are sampled per 300 ms, kept only in RAM, and fitted to visible tile heights. A small support collider follows the visible surface near the car to bridge patch gaps. The broad campus fallback floor and unsampled flat road patches are lowered only once a local tile surface can be resolved. Landmark resets snap to the live surface once it loads; terrain height changes wake the suspension.

The colliders are simplified, horizontal patches. They are suitable for a campus prototype, not a surveyed digital twin or a physically accurate road-slope model. Overhangs, trees, steep slopes, coarse LOD and tile gaps can cause inaccurate ray hits. Production deployment with credentials should calibrate ellipsoid height, audit the four roads, and replace problematic areas with independently sourced surveyed road meshes. Building and vegetation obstacle collisions, traffic, navigation routes, and multiplayer are outside this implementation. Camera geometry occlusion is not implemented.

## Rendering and performance

- Tile traversal uses camera frustum and screen-space error: 8 px balanced / 3 px high.
- 512 MiB tile cache target, 384 MiB low-water target; 1,200 / 900 item limits. In-flight downloads can briefly exceed the byte target. These bound tile resources, not total browser memory.
- Six simultaneous tile downloads and two parse jobs.
- Camera far plane 1,800 m; campus clipping planes and distance fog.
- Fallback roads/buildings/vegetation use merged geometry to reduce draw calls.
- Vehicle physics uses 60 Hz fixed steps, at most five substeps, SAP broadphase.
- Pixel ratio capped at 1.6; one 1,024² local sun shadow map.
- Tile renderer, event listeners, vehicle and input listeners are cleaned up on unmount. StrictMode mount/unmount is supported.
- Solar azimuth and elevation are calculated for Tampa at 2026-09-11 20:00 UTC. The sky is procedural and the time is fixed, not live weather.
- A feature-detected WebMCP adapter exposes the same landmark actions and readable drive state.

## Checks

```sh
npm test
npm run build
```

Tests validate local axes, all landmark spawns, ray-ground contact, forward acceleration, braking and reverse. Browser checks cover rendering, modal controls, map jumps, runtime logs, and WebMCP success/error handling. Authenticated checks additionally cover visible Google imagery, copyright attribution, landmark surface placement, and four-wheel contact. Photogrammetry has visible artifacts around trees and overhangs; full-route terrain validation is still recommended.

## Data and service references

- [USF official campus maps](https://www.usf.edu/facilities/facilities-information-services/maps.aspx)
- [USF Tampa campus map](https://maps.usf.edu/Campus_Maps/Tampa_Campus_11x17.pdf)
- [Google Photorealistic 3D Tiles setup](https://developers.google.com/maps/documentation/tile/3d-tiles)
- [Google Map Tiles policies](https://developers.google.com/maps/documentation/tile/policies)
- [3D Tiles Renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS)
- [OpenStreetMap contributors / ODbL 1.0](https://www.openstreetmap.org/copyright)

OSM source query: `way[highway](28.049,-82.429,28.071,-82.401); way[building](28.049,-82.429,28.071,-82.401); out geom;` through Overpass. Run `node scripts/import-osm.mjs /path/to/overpass.json` to regenerate `src/data/osm.json`. OSM data remains under ODbL; attribution is displayed in the HUD. The fallback map is independently sourced OSM data. Google imagery is streamed directly and is not checked in, exported, or persistently cached. Visible tile copyright strings are displayed in live mode. This is an independent campus exploration prototype, not an official USF application.
