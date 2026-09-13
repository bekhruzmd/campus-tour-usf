# USF student navigation audit

Date: September 12, 2026. Scope: the current local Tampa campus application. No application source changes were made.

## Method and limits

This is a student-persona walkthrough informed by public student accounts, not interviews or an on-campus walking study. Reviewed r/USF discussions from 2021–2026 and official USF pages. Reddit accounts reveal problems to investigate; they are not verified campus directions or a representative survey.

Ran the app in local Chromium through Playwright at 1440 × 900 and 390 × 844. Tested building and classroom queries, opened parking and shuttle panels, checked the initial mobile screen and the map after closing its card, and deliberately blocked the weather API. No page exceptions occurred during the first walkthrough. Reviewed source for routing, parking estimates, saving parking, search matching, building fallbacks, shuttle fallbacks, and weather behavior. These checks do not establish physical route accuracy, screen-reader accessibility, or real-device GPS performance.

## Student evidence

- [Class Locations, August 22, 2025](https://www.reddit.com/r/USF/comments/1mxfr2p): an incoming commuter cannot visit campus beforehand; replies distinguish finding buildings from finding confusing rooms inside them.
- [Finding classes, August 21, 2021](https://www.reddit.com/r/USF/comments/p90boj): confusion about BSN; accounts of difficult building layouts and lecture halls entered from outside. Treat specific directions in old comments as leads requiring verification.
- [Connecting a schedule to a map, August 22, 2023](https://www.reddit.com/r/USF/comments/15xribo): a student confuses CRNs with physical location identifiers. The product needs to explain course code versus building code and room.
- [Parking, July 4, 2026](https://www.reddit.com/r/USF/comments/1umvx6n/parking/): students discuss arriving early, remote parking, and extra time for transit. This supports planning uncertainty, not a reliable occupancy model.
- [CHE 111 to BSN 118 in fifteen minutes, August 2026](https://www.reddit.com/r/USF/comments/1vu319a/is_it_possible_to_go_from_che_111_to_bsn_118_in/): an exact example of a schedule-gap task; comments also discuss heat.
- [Bull Runner, August 2022](https://www.reddit.com/r/USF/comments/wuaec1): a student asks which route gets from the Village to CIS. Old route-color advice must not be copied as current directions.
- [Mandatory attendance and rain, September 2022](https://www.reddit.com/r/USF/comments/x9cd91): accounts include soaked belongings while walking to class. Weather matters because of exposure along the journey.
- [Official Find Your Classes event](https://bullsconnect.usf.edu/web/rsvp_boot?id=2005319): USF offers tours and individual help finding classes, supporting the relevance of this problem beyond Reddit.
- [Official USF permit types](https://www.usf.edu/parking/permits/permit-types.aspx): eligibility and time restrictions matter; the Y permit section identifies Park-N-Ride lots 18 and 43. The app currently labels its Yuengling Lots 22A–E entry S/Y/D, requiring correction against official lot-level records.
- [Official Bull Runner information](https://www.usf.edu/parking/bull-runner/): retain a university-maintained transit link as an escape hatch when feed data or planning is unavailable.

## Verdict

The visual identity is cohesive and the app offers a promising campus explorer. It is not yet dependable as a daily student navigator. The main work is establishing trustworthy building identity and real walking tasks. More panels will not compensate for incorrect codes, unavailable classroom search, simulated positioning, or unsupported availability claims.

A student-oriented product promise: “Find your class, reach the right entrance, and know when to leave.” Keep the virtual driving experience as an optional Explore mode.

## Reproduced findings

| Priority | Task | Evidence | Recommended change |
|---|---|---|---|
| P0 | Search a classroom | BSN succeeds; BSN 2102 and 2102 return zero results even though BSN 2102 is stored in a room's floor field. CPR 103 succeeds; CPR103 fails. NES 323 fails. | Parse building and room separately; normalize punctuation/spacing; search floor and aliases; return the building even when the room is unverified. |
| P0 | Find common academic buildings | CIS returns zero. NES returns irrelevant matches headed by Business, rather than its intended building. EDU returns College of Education under generated code COL. ULH is classified Housing & Dorms. | Use an authoritative building-code table, verified identity mapping to footprints, and explicit unknown values. |
| P0 | Navigate to a destination | Source draws the GPS line directly from virtual car to destination. No real student geolocation is used. Walking times in garage ranking use straight-line distance divided by 80 m/min. | Rename existing guidance to a simulation/preview. Provide external walking directions as an interim step; build pedestrian routing with entrances, crossings, and accessibility information. |
| P0 | Determine parking availability | Browser shows Beard at 16% full and approximately 1,663 open spots. Source calculates these from hardcoded capacities and time-of-day rules, with no observed occupancy feed. | Remove spot counts and occupancy percentages until supported. Use sourced qualitative planning guidance with its limitations. |
| P0 | Save where I actually parked | Source binds the generic I Parked Here action to the garage recommended for the selected class, rather than an actual location selected by the user. | Ask for garage/lot selection or a GPS/map pin, then floor, section, and optional photo. Save only the location the student chose. |
| P0 | Check unavailable weather | Blocking Open-Meteo still displays 84°F and Storm Risk. Source generates afternoon weather on failure. | Display unavailable or timestamped last-known data. Keep simulated weather within Explore mode. |
| P1 | Use on a phone | Initial library card covers roughly two-thirds of the 390 × 844 viewport and hides the bottom navigation. Closing it restores the map and navigation. Header search is visibly clipped. | Start with no selected building and a compact, collapsible bottom sheet. Keep navigation visible and search on its own row. |
| P1 | Decide which bus to take | Feed returned five vehicles. UI shows numeric route IDs, speed, endpoint/system metadata and route lists; it does not complete an origin-to-destination boarding decision. | Show named route, boarding stop, direction, exit stop, remaining walk, and timestamped arrival information when available. |
| P1 | Handle missing transit data | Source animates fallback buses when real vehicles are absent, labeled SCHED • 14 MPH. It defaults unknown occupancy to Seats Available. | Show unavailable locations/occupancy honestly. Do not imply a scheduled vehicle position from a moving illustration. |

Source areas: `src/data/usfBuildings.ts` (generated codes/categories/hours/advice), `src/components/SearchOverlay.tsx` (matching and virtual-car distances), `src/ExplorerMap.tsx` (straight lines and fallback vehicles), `src/data/usfParking.ts` (capacity/time model), `src/components/CommuterCommandCenter.tsx` (parking save and presentation), `src/data/usfWeather.ts` (simulated weather fallback).

The generator also creates general room entries, access advice and opening hours for unknown facilities. These must not appear as verified building facts. A building-level homepage link does not substantiate every field in the card.

## Keep, remove, and add

Keep the USF green/cream palette, building photos, code badges, local campus geometry, search, place cards, saved parking concept, and working transit integration. The selected place and route should dominate map labels.

Move driving controls, MPH, Drive Me, teleport-style Park Here, and simulated rain into an explicitly optional Explore mode. Remove fabricated building codes and unsupported room/hours/access details. Replace “Find Any Building or Room” with a claim matching actual coverage. Rename Storm Shield to Weather; a shelter/route feature can earn a more specific label later. Put API endpoints, system IDs and feed latency in development diagnostics.

Build next, in this order:

1. Reliable class lookup. Support BSN2102, BSN 2102, lowercase, hyphens, names and aliases. Distinguish building-room references from CRNs and course identifiers. Confirm Tampa scope. If a room is unknown, show the known building with “Room location not yet verified.”
2. Entrance-first destination cards. Verified entrance photo, map pin, room/floor when known, concise indoor landmark directions, step-free access where verified, source and last-checked date. Begin with buildings appearing in student complaints and actual schedules. Do not infer floor solely from room digits.
3. Walking from a real or manually selected starting point. Request GPS when the student chooses My location; support denial and off-campus planning. Use real pedestrian paths; distinguish route duration from indoor and crossing buffer. Offer a verified external navigation link while this is being built.
4. My Day. Let students manually add building, room, day and time. Show the next class and compare class gaps against route time plus configurable buffers. Save locally initially. Add schedule import only after the location model works.
5. Permit-aware parking and a reliable saved-car pin. Filter by permit, day/time and lot restrictions before ranking. Include applicable remote lots and official permit information. No guaranteed availability claims.
6. First-week rehearsal. Make a route through a student's actual classes, with entrance photos and a “found this room” checklist. This aligns the existing exploration concept with a concrete student outcome.
7. Nearby essentials. Verified restrooms, refill stations, printing, outlets and study spaces; only show Open now when hours are maintained. Add visible report-a-problem controls and a review queue.
8. Bus decisions and weather-aware options. Integrate start/end stop selection and live freshness. Map verified shelter/shade segments and accessibility features; avoid claiming a route is safe, dry or step-free without evidence.

Defer a chatbot, social feed, achievements, broad apartment directory expansion, and full indoor turn-by-turn navigation. They add maintenance and interface cost before the core task is dependable.

## Proposed appearance and behavior

Mobile home: small USF Tampa branding; full-width “Building, room, or place” search; compact Today / Parking / Food / Study shortcuts; mostly unobstructed map; a 100–160 px bottom sheet with the next useful action. No building auto-opens.

Search result: large official code and familiar building name, requested room beneath, verification status, and one primary action. Unknown room results preserve the destination building.

Destination sheet: title and room first, walking action next, then entrance photo and actionable arrival instructions. Put general descriptions and broader services under expandable details. During routing, reserve the sheet for the next direction, remaining walk and destination entrance.

Desktop: keep one approximately 320–360 px panel that changes between search/results/details, with the map filling the rest. Avoid having a landmark sidebar, large information card, driving HUD and commuter overlay compete for attention.

Use stronger contrast for pedestrian paths and selected destinations, fewer persistent labels, and thumb-sized controls. Separate official building codes from names; never display generated initials as equivalent identifiers. Preserve the palette and typography rather than undertaking a purely cosmetic rewrite.

## Release checks and field validation

Before describing the product as a student navigator, require: common academic building codes resolve correctly; room queries never discard a known building; unknown room data is stated; no synthetic live parking/weather/bus claims; saved parking matches an explicitly chosen place; mobile search and navigation remain usable with a card open; GPS denial supports a manual origin.

After fixes, recruit 5–8 current USF students, including a freshman commuter, resident and a student with mobility access needs. Ask them to find two scheduled classes, locate the correct entrance, plan a short class transition, identify permit-eligible parking, save/retrieve their car and choose a bus. Observe time to a correct decision, backtracking, wrong entrances, assistance needed and confidence. Walk representative routes on campus to validate physical accuracy; a browser test cannot establish it.

Screenshots: [desktop](desktop.png), [mobile initial](mobile.png), [mobile with card closed](mobile-map.png), [parking](parking.png).
