import { project } from "./explorer";

export type CampusAmenity = {
  id: string;
  name: string;
  category: "caffeine" | "outlets" | "printing";
  buildingCode: string;
  buildingName: string;
  floor: string;
  description: string;
  status: string; // e.g. "Open • 4 min wait", "12 desks open", "Free printing"
  x: number;
  z: number;
};

export const CAMPUS_AMENITIES: CampusAmenity[] = [
  // Caffeine Hotspots
  {
    id: "starbucks_lib",
    name: "Starbucks (Library 1st Floor)",
    category: "caffeine",
    buildingCode: "LIB",
    buildingName: "USF Tampa Library",
    floor: "1st Floor Lobby",
    description: "Full-service Starbucks cafe with mobile Grubhub pickup. Prime study fuel station.",
    status: "Open • ~5 min wait",
    ...project(28.0595, -82.4122),
  },
  {
    id: "starbucks_msc",
    name: "Panera Bread & Coffee (MSC)",
    category: "caffeine",
    buildingCode: "MSC",
    buildingName: "Phyllis P. Marshall Student Center",
    floor: "1st Floor Food Court",
    description: "Unlimited Sip Club friendly, iced coffees, espresso, and breakfast bagels.",
    status: "Open • ~3 min wait",
    ...project(28.0638, -82.4134),
  },
  {
    id: "starbucks_bks",
    name: "Starbucks Express (USF Bookstore)",
    category: "caffeine",
    buildingCode: "BKS",
    buildingName: "USF Campus Bookstore",
    floor: "1st Floor Front Corner",
    description: "Often has the shortest lines on central campus compared to the Library.",
    status: "Open • ~2 min wait",
    ...project(28.0630, -82.4148),
  },
  {
    id: "einstein_isa",
    name: "Einstein Bros. Bagels (ISA Breezeway)",
    category: "caffeine",
    buildingCode: "ISA",
    buildingName: "Interdisciplinary Sciences",
    floor: "Ground Floor Breezeway",
    description: "Fresh brewed dark roasts, cold brew, and hot breakfast egg sandwiches.",
    status: "Open • ~4 min wait",
    ...project(28.0602, -82.4152),
  },
  {
    id: "starbucks_jph",
    name: "Starbucks Cafe (Juniper-Poplar)",
    category: "caffeine",
    buildingCode: "JPH",
    buildingName: "Juniper-Poplar Hall",
    floor: "1st Floor Residential Lobby",
    description: "Cozy cafe with study tables and late afternoon hours.",
    status: "Open • Short line",
    ...project(28.0675, -82.4085),
  },

  // Dead Battery Radar: Outlets & Workstations
  {
    id: "outlets_lib_2",
    name: "ASC Tutoring & Tech Lofts",
    category: "outlets",
    buildingCode: "LIB",
    buildingName: "USF Tampa Library",
    floor: "2nd Floor",
    description: "Every desk features dual AC wall plugs and USB fast-charge ports. High-speed WiFi.",
    status: "Plentiful Outlets • 25+ desks",
    ...project(28.0596, -82.4124),
  },
  {
    id: "outlets_honors",
    name: "Honors Atrium Collaborative Lofts",
    category: "outlets",
    buildingCode: "GHC",
    buildingName: "Judy Genshaft Honors College",
    floor: "2nd & 3rd Floors",
    description: "Ultra-modern study pods with built-in desk power strips and daylight sunlit lofts.",
    status: "Power Pods Available",
    ...project(28.0596, -82.4093),
  },
  {
    id: "outlets_msc_lofts",
    name: "MSC 2nd Floor Sky Lofts",
    category: "outlets",
    buildingCode: "MSC",
    buildingName: "Phyllis P. Marshall Student Center",
    floor: "2nd Floor Overlook",
    description: "Cushioned armchairs and study banquettes with wall outlets and overlooking the atrium.",
    status: "Active Study Space",
    ...project(28.0639, -82.4132),
  },
  {
    id: "outlets_bsn_atrium",
    name: "Muma Business Trading Atrium",
    category: "outlets",
    buildingCode: "BSN",
    buildingName: "USF Muma College of Business",
    floor: "1st Floor Atrium",
    description: "High-top cafe tables with under-table power strips and quiet air conditioning.",
    status: "Open Desks Available",
    ...project(28.0624, -82.4098),
  },

  // Free Student Printing Labs
  {
    id: "print_lib_dmc",
    name: "Digital Media Commons Free Printing",
    category: "printing",
    buildingCode: "LIB",
    buildingName: "USF Tampa Library",
    floor: "1st Floor DMC",
    description: "Free student printing allocation per semester. High-speed laser duplex printers.",
    status: "Printers Online • Paper stocked",
    ...project(28.0594, -82.4120),
  },
  {
    id: "print_msc_lab",
    name: "SG Computer Lab Printing",
    category: "printing",
    buildingCode: "MSC",
    buildingName: "Phyllis P. Marshall Student Center",
    floor: "2nd Floor (MSC 2308)",
    description: "Student Government funded free student printing stations with PC and Mac desktops.",
    status: "Printers Ready",
    ...project(28.0637, -82.4136),
  },
  {
    id: "print_edu_lab",
    name: "College of Education Tech Lab",
    category: "printing",
    buildingCode: "EDU",
    buildingName: "College of Education",
    floor: "2nd Floor Lab",
    description: "Quiet computing lab with color and black-and-white printing stations.",
    status: "Printers Ready",
    ...project(28.0610, -82.4112),
  },
];
