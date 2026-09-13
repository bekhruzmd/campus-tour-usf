# Implemented student navigation changes

September 12, 2026. Local implementation; not deployed.

## Shipped in this change

- Mobile-first map with a full-width search bar, persistent bottom navigation, compact/expandable destination sheet, safe-area handling, dynamic viewport sizing and browser page zoom enabled.
- Official-code lookup for the core academic buildings; normalized room searches (`BSN2102`, `BSN 2102`, `BSN-2102`) with an honest unknown-room state. Official codes take precedence over conflicting aliases. Unknown profiles do not invent codes, hours, rooms or access instructions.
- Exact footprint matching, no default library position for unmatched buildings, no library photo substituted for other buildings, selected-label priority and collision suppression.
- Google Maps walking handoff with a manually chosen origin or requested geolocation. Permission denial has a manual-origin fallback.
- My Day with weekly classes, local persistence, gap comparison, an external walk check and a room-found rehearsal checklist.
- Saved parking records use an explicitly chosen garage and floor/section note. Mapped permit designations and links to current official restrictions replace fabricated availability counts. Y permits direct students to official lots 18 and 43 information.
- A departure planner using explicit user-entered travel, parking, walking and early-arrival buffers.
- Named shuttle routes and boarding/exit stop selection, reported vehicle locations, unknown passenger loads kept unknown, and an official tracker link. No simulated fallback vehicles. Shuttle data loads on demand.
- Weather failures produce an unavailable state. No synthetic weather or alerts.
- Virtual driving moved to optional Explore mode. Native dialogs, labeled controls, keyboard focus containment/return and reduced-motion support.
- Building detail links include a prefilled GitHub correction form. Opening it does not submit a report.

## Verification

- Production build: passed. Vite still warns about the bundled campus geometry size (initial JS approximately 567 KB gzip); it is the main remaining download cost.
- Regression tests: 11/11 passed, including malformed storage, data failures, code collisions and departure-day rollover.
- Chromium workflow tests: passed with no page exceptions. Search, manual walking origin, weekly class save/reload, rehearsal state, parking save/reload, Y-permit information, offline feeds and Explore mode checked.
- Viewport checks: no horizontal overflow at 320, 375, 390, 430, 768 and 1440 px. Dialogs also checked at 320 × 568 and 844 × 390.
- Keyboard checks: search shortcut, initial search focus, modal focus containment, Escape dismissal, focus return and virtual driving after pressing the mode button passed.
- Location checks: both permission failure and granted geolocation passed. Map panning redraws correctly.
- Inspected desktop and mobile screenshots, including the expanded destination, My Day and parking states.

## Still requires verified campus data

Walking directions are handed to Google Maps. Native pedestrian routes, entrance-specific photos/directions, indoor room navigation, step-free access, live parking availability and maintained amenity hours are not implemented as verified features. Legacy directory service mentions are labeled unverified. Physical route accuracy, real-device Safari and screen-reader usability need field testing.

Screenshots: [mobile home](implemented/mobile-home.png), [destination](implemented/mobile-destination.png), [expanded destination](implemented/mobile-details.png), [My Day](implemented/mobile-day.png), [parking](implemented/mobile-parking.png), [desktop](implemented/desktop.png), [320px search](implemented/search-320.png).

### OpenFreeMap replacement

Replaced the Google Maps integration with MapLibre and OpenFreeMap Liberty.
No Google API key or billing is used. Search remains local; walking links open
Google Maps externally. The map displays 37 campus-directory code pins and hides
basemap POI labels to avoid conflicting building names. Other basemap labels
still come from OpenStreetMap and may need upstream corrections.

MapLibre's worker is bundled explicitly through Vite. Verified the live map,
BSN 2102 lookup, external directions, attribution clearance at mobile widths,
Explore switching, and a blocked-network fallback in browser checks. Confirmed
no Google Maps API requests. Build and 11 unit tests pass. The existing large
campus-data bundle still triggers Vite's chunk-size warning.
