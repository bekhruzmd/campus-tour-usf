# USF Campus Tour

A small, lightweight campus-exploration prototype: drive a little car around a north-up, drone-style map, click building tags, and explore three photo stops.

## Run

```sh
npm ci
npm run dev
npm test
npm run build
```

React + TypeScript + Vite, using Canvas 2D. **No Three.js, WebGL, Cesium, paid tile streaming, or API key is required.** The old 3D implementation is preserved in Git history.

The campus map is drawn once to an offscreen canvas. The view renders at up to 30 fps while moving and skips redraws when settled; pixel ratio is capped at 1.5. Only the selected landmark’s photo loads. There is no persistent backend.

## Explore

- WASD / arrow keys: accelerate, reverse, and steer.
- Space: brake. P: pause. R: reset to the library. M: campus overview.
- Drag the map to explore, use +/− to zoom, and press the target button to follow your car again.
- Click a map tag or choose a stop from the sidebar to open a photo card. “Start here” moves the car to a nearby primary road.
- Touch controls are provided for smaller screens.

Real OSM road paths and 260 building footprints are bundled locally. Names are shown where available; unnamed footprints get numbered labels, not invented names. Tour-stop positions are derived from the corresponding building footprints. This is a conceptual explorer: vegetation is decorative, car dimensions are exaggerated for visibility, and there are no building collisions, surveyed terrain, or turn-by-turn routes.

## Code

- `src/ExplorerMap.tsx`: cached map rendering, following camera, zoom, picking and animation loop.
- `src/lib/drive.ts`: lightweight driving movement and campus boundaries.
- `src/data/explorer.ts`: local map projection and curated tour stops.
- `src/App.tsx`: sidebar, photo cards, keyboard/touch inputs and HUD.
- `src/data/osm.json`: checked-in campus geometry.
- `vercel.json`: Vite deployment settings.

## Photos and map data

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL 1.0, retrieved September 11, 2026. Building-name coverage is incomplete.

Photos are remotely displayed from official USF pages, with source links in each card:

- [USF Tampa Library](https://lib.usf.edu/)
- [Marshall Student Center](https://www.usf.edu/student-affairs/msc/)
- [Judy Genshaft Honors College](https://www.usf.edu/honors/about-us/tampa.aspx)

USF retains rights to its photographs. This independent, non-commercial prototype is not an official USF website. A unavailable-photo state links to the original source.

## Deployment

Push to `https://github.com/bekhruzmd/campus-tour-usf.git`, then deploy with Vercel (framework: Vite, output: `dist`). No environment variables are needed. `.env.local` from the older prototype is ignored by Git and explicitly excluded from Vercel uploads; it is not read by the new app.
# campus-tour-usf
