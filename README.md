# USF Campus Companion

A mobile-first Tampa campus map for classroom lookup, a weekly class plan, saved parking, and walking-direction handoffs. React + TypeScript + Vite with Canvas 2D; no paid map key or persistent backend.

## Run

```sh
npm ci
npm run dev
npm test
npm run build
```

## Student workflows

- Search official building codes, names, aliases, and building-room combinations such as `BSN2102` or `NES 323`. Unknown rooms retain the building and are explicitly unverified. CRNs and course prefixes are not treated as classroom locations.
- Open a compact destination sheet. Expand it to choose a starting building or use a requested geolocation fix. Walking directions open Google Maps, targeting the building centroid. Verified entrances, indoor routing, step-free paths and route times are not yet available.
- Add weekly classes to **My Day**, compare the available gap, check the walk in Google Maps, and mark rooms found during a practice walk. Classes and checklist state are saved locally.
- Choose the garage where you actually parked and save a floor/section note. View mapped permit-designated garage areas and official Y/visitor resources. Availability is unknown; individual space signs and current USF rules take precedence. The departure planner uses only the student's own time estimates.
- Browse named Bull Runner routes and boarding/destination stops. Reported vehicle locations and unknown occupancy are labeled explicitly. The official tracker is linked for arrivals, direction and service changes. No simulated fallback buses are shown.
- Weather uses Open-Meteo; request failures produce an unavailable state. No generated forecasts or warnings.
- Optional **Explore mode** enables the virtual car with WASD/arrows or touch controls. Space brakes unless a control has focus. This is a simulation, not road navigation.

## Data and limitations

Selected official building codes and garage designations were checked against the [USF campus directory](https://www.usf.edu/parking/documents/campus-map-directory.pdf) and [permit rules](https://www.usf.edu/parking/permits/permit-types.aspx) on September 12, 2026. Unverified codes are hidden. Exact OSM footprint matches are required for featured pins; missing buildings are not silently placed at the library. Unknown profiles have no generated room, hours or access claims. Legacy room/service mentions remain searchable but are not verified indoor directions or current opening-hour data.

Geometry © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL 1.0. The background has decorative vegetation. This is an independent, unofficial USF guide. Building photos are shown only where a specific photo exists; USF retains rights to its photographs.

Local storage holds only manually entered classes and parking notes. Storage failures are reported, and location permission denial supports choosing a starting building. New parking records use a v2 key; older records from the recommendation-based save flow are intentionally not reused.

## Accessibility and performance

The phone layout uses a compact destination sheet, persistent bottom navigation, safe-area padding and dynamic viewport heights. Native modal dialogs provide focus containment, Escape dismissal and focus return. Search results and controls are keyboard accessible. Browser page zoom remains enabled; touch map pan/pinch and zoom buttons are available. Reduced-motion preferences remove interaction transforms. Real-device Safari, screen-reader and on-campus route validation are still needed.

Map rendering is cached; passive views redraw on state changes. Shuttle code/data loads when requested. The bundled OSM geometry remains the largest asset.

## Validation

`npm test` covers code/room lookup, alias collisions, unknown data, exact footprint positions, walking links, parking persistence, malformed saved state, feed failures and departure date rollover.

The implementation was also exercised in Chromium at 320, 375, 390, 430, 768 and 1440 px widths. See [student audit](docs/student-audit/review.md) and [implementation screenshots](docs/student-audit/implemented/).

## Deploy

The existing Vercel configuration builds to `dist`. No environment variables are required. `.env.local` is ignored and excluded from deployment uploads.

### OpenFreeMap

The default map uses MapLibre GL JS with OpenFreeMap’s Liberty basemap.
No API key, account, or billing configuration is required. Existing Google Maps
environment variables are unused and can be removed.

Campus-directory pins show verified USF codes. Basemap POI labels are hidden to
avoid competing place names; road labels remain. Search runs locally, including
building + room queries. Directions open externally in Google Maps without an API.

OpenFreeMap requires an internet connection. A campus-map fallback is available
if the map service or WebGL is unavailable. Bull Runner routes, stops, and live vehicle positions appear automatically on
the main map; positions refresh every 12 seconds while the page is visible.
Unavailable feeds clear vehicle pins and show a status message. Explore mode
uses the custom campus map, also with buses enabled. Native map attribution stays visible on mobile.
See https://openfreemap.org/quick_start/ for provider documentation.

### God’s eye campus view

Select **3D view** in the map controls for a campus-focused mode inspired by
https://github.com/bilawalsidhu/gods-eye-view. This is an independent MapLibre
implementation, not an embedded copy of that Cesium globe application.
It adds extruded OSM footprints (heights are approximate), camera telemetry,
optional orbit, a cosmetic night style, and click-to-follow Bull Runner buses.
Bus following updates with the feed every 12 seconds and stops when a bus is no
longer reported, when you drag the map, or when you leave 3D mode. Orbit respects
reduced-motion preferences and stops on map interaction. Mobile camera controls
start collapsed. There are no added paid services, satellite imagery, thermal
sensor data, aircraft feeds, or surveillance cameras.
