export type BuildingCategory =
  | "Academics"
  | "Student Life & Dining"
  | "Housing & Dorms"
  | "Athletics & Rec"
  | "Health & Medicine"
  | "Arts & Performance"
  | "Services & Admin"
  | "Parking";

export type USFBuilding = {
  id: string;
  osmName: string;
  code: string;
  name: string;
  shortName: string;
  category: BuildingCategory;
  description: string;
  freshmanTip: string;
  roomsAndServices: {
    name: string;
    floor?: string;
    type: "office" | "dining" | "classroom" | "service" | "amenity" | "study";
    details?: string;
  }[];
  photo?: string;
  sourceUrl?: string;
  hours?: string;
  aliases?: string[];
};

export const USF_BUILDINGS_CATALOG: USFBuilding[] = [
  {
    id: "lib",
    osmName: "University Library",
    code: "LIB",
    name: "USF Tampa Library",
    shortName: "Tampa Library",
    category: "Academics",
    description:
      "The academic heartbeat of campus. 6 floors ranging from collaborative group hubs on the lower floors to absolute silence on the 5th floor.",
    freshmanTip:
      "Floor 1 has Starbucks and IT support. Floor 2 has the Writing Center and Math Tutoring. Floor 5 is dead silent—great for finals week.",
    photo: "/images/buildings/lib.jpg",
    sourceUrl: "https://lib.usf.edu/",
    hours: "24/5 during semesters (Opens Sunday 10am, 24hrs through Friday 6pm)",
    aliases: ["library", "tampa library", "starbucks", "tutoring", "writing center", "dmc", "digital media commons"],
    roomsAndServices: [
      { name: "Starbucks Cafe", floor: "1st Floor", type: "dining", details: "Mobile ordering available via Grubhub" },
      { name: "Digital Media Commons (DMC)", floor: "1st Floor", type: "amenity", details: "Free 3D printing, podcast studios, VR lab, and audio gear checkout" },
      { name: "IT Help Desk & Tech Support", floor: "1st Floor", type: "service", details: "Walk-in laptop, WiFi, and NetID assistance" },
      { name: "Academic Success Center (ASC)", floor: "2nd Floor", type: "service", details: "Free peer tutoring in STEM, business, and writing" },
      { name: "The Writing Studio", floor: "2nd Floor", type: "service", details: "1-on-1 essay and resume feedback" },
      { name: "Quiet Study Hall", floor: "3rd & 4th Floors", type: "study", details: "Desks with charging outlets and study pods" },
      { name: "Silent Study Zone", floor: "5th Floor", type: "study", details: "Strictly silent floor with sweeping campus views" },
      { name: "Special Collections & Archives", floor: "4th Floor", type: "office", details: "Florida history, rare manuscripts, and USF yearbooks" },
    ],
  },
  {
    id: "msc",
    osmName: "Phyllis P Marshall Center",
    code: "MSC",
    name: "Phyllis P. Marshall Student Center",
    shortName: "Marshall Center",
    category: "Student Life & Dining",
    description:
      "The epicenter of student activity, dining, entertainment, and campus events. Always bustling with clubs and student organizations.",
    freshmanTip:
      "The 1st floor food court gets busy around 12:30 PM. Use the Grubhub campus dining app to skip the lines for Chick-fil-A and Panda Express.",
    photo: "/images/buildings/msc.jpg",
    sourceUrl: "https://www.usf.edu/student-affairs/msc/",
    hours: "Mon-Sat 7:00 AM - 11:00 PM, Sun 10:00 AM - 11:00 PM",
    aliases: ["msc", "student center", "marshall", "chick-fil-a", "panda express", "subway", "bulls bistro", "ballroom"],
    roomsAndServices: [
      { name: "MSC Food Court (Chick-fil-A, Panda Express, Subway, Moe's)", floor: "1st Floor", type: "dining", details: "Accepts Bull Bucks, Dining Dollars, and credit cards" },
      { name: "Panera Bread", floor: "1st Floor", type: "dining", details: "Breakfast, coffee, pastries, and lunch" },
      { name: "USF Federal Credit Union", floor: "1st Floor", type: "service", details: "Full-service student banking and ATMs" },
      { name: "USF Card Center", floor: "1st Floor (MSC 1504)", type: "service", details: "Get your official USF Student ID card" },
      { name: "MSC Information & Help Desk", floor: "1st Floor", type: "service", details: "Campus maps, lost and found, and general directions" },
      { name: "Center for Student Involvement (CSI)", floor: "2nd Floor (MSC 2300)", type: "office", details: "Join 700+ student organizations, Greek life, and campus events" },
      { name: "USF Student Government (SG)", floor: "4th Floor (MSC 4300)", type: "office", details: "Student Senate, executive cabinet, and free legal aid" },
      { name: "MSC Ballrooms (A-C)", floor: "2nd Floor", type: "amenity", details: "Major campus lectures, concerts, orientations, and banquets" },
      { name: "Bulls Country Pharmacy", floor: "1st Floor", type: "service", details: "Prescription pickup and over-the-counter medicine" },
      { name: "Oval Theater", floor: "1st & 2nd Floors", type: "amenity", details: "700-seat auditorium for movie nights, comedy, and keynotes" },
      { name: "Beef 'O' Brady's Sports Bar & Grill", floor: "1st Floor", type: "dining", details: "Casual dining with wings, burgers, and sports TV screens" },
    ],
  },
  {
    id: "honors",
    osmName: "Judy Genshaft Honors College",
    code: "GHC",
    name: "Judy Genshaft Honors College",
    shortName: "Honors College",
    category: "Academics",
    description:
      "A stunning five-story modern architectural gem featuring learning lofts, an open sunlit atrium, design studios, and music practice spaces.",
    freshmanTip:
      "Even if you are not an honors student, the ground-floor outdoor cafe terrace and open public events are welcoming to all students.",
    photo: "/images/buildings/honors.jpg",
    sourceUrl: "https://www.usf.edu/honors/about-us/tampa.aspx",
    hours: "Mon-Fri 8:00 AM - 9:00 PM",
    aliases: ["honors", "ghc", "judy genshaft", "learning lofts"],
    roomsAndServices: [
      { name: "Central Honors Atrium", floor: "1st Floor", type: "amenity", details: "Open social space and campus gathering hub" },
      { name: "Honors Advising Suite", floor: "2nd Floor", type: "office", details: "Specialized honors academic advising and fellowship coaching" },
      { name: "Food & Culture Lab Studio", floor: "3rd Floor", type: "classroom", details: "Hands-on experiential culinary and cultural learning" },
      { name: "Design & Technology Lofts", floor: "4th Floor", type: "study", details: "Collaborative computing, design pods, and study areas" },
      { name: "Acoustic Music Practice Rooms", floor: "2nd Floor", type: "amenity", details: "Sound-isolated practice rooms for musicians" },
    ],
  },
  {
    id: "rec",
    osmName: "Campus Recreation Center",
    code: "REC",
    name: "Campus Recreation Center",
    shortName: "Campus Rec",
    category: "Athletics & Rec",
    description:
      "A massive multi-level fitness complex equipped with cardio machinery, Olympic weightlifting racks, indoor basketball courts, and an indoor track.",
    freshmanTip:
      "Admission is 100% free with your active USF student ID card! Peak crowd times are 4:00 PM – 7:30 PM.",
    photo: "/images/buildings/rec.jpg",
    sourceUrl: "https://www.usf.edu/student-affairs/campus-rec/",
    hours: "Mon-Thu 6:00 AM - 11:00 PM, Fri 6:00 AM - 9:00 PM, Weekends 9:00 AM - 8:00 PM",
    aliases: ["rec", "gym", "fitness", "campus rec", "pool", "basketball courts", "indoor track", "weights"],
    roomsAndServices: [
      { name: "Cardio & Weight Training Deck", floor: "1st & 2nd Floors", type: "amenity", details: "150+ weight machines, squat racks, free weights, and treadmills" },
      { name: "Indoor Basketball & Volleyball Courts", floor: "1st Floor", type: "amenity", details: "4 full hardwood courts for pickup basketball and intramurals" },
      { name: "Suspended Indoor Running Track", floor: "2nd Floor", type: "amenity", details: "1/8th mile cushioned running and walking track" },
      { name: "Indoor Heated Lap Pool", floor: "1st Floor", type: "amenity", details: "25-meter lap lanes and aquatic fitness classes" },
      { name: "Group Fitness Studios (A & B)", floor: "2nd Floor", type: "classroom", details: "Free yoga, Zumba, spin cycling, and HIIT sessions" },
      { name: "Outdoor Equipment Rental Desk (OEP)", floor: "1st Floor", type: "service", details: "Rent tents, kayaks, paddleboards, and camping gear" },
      { name: "Locker Rooms & Saunas", floor: "1st Floor", type: "amenity", details: "Full day lockers, showers, and dry sauna" },
    ],
  },
  {
    id: "bsn",
    osmName: "USF Muma College of Business",
    code: "BSN",
    name: "USF Muma College of Business",
    shortName: "Muma Business",
    category: "Academics",
    description:
      "Home to undergraduate and graduate business programs, finance trading labs, corporate networking suites, and faculty offices.",
    freshmanTip:
      "The building features the Student Managed Investment Fund trading room equipped with live Bloomberg terminals.",
    sourceUrl: "https://www.usf.edu/business/",
    hours: "Mon-Fri 7:30 AM - 9:00 PM",
    aliases: ["bsn", "muma", "business", "bloomberg", "finance", "marketing", "accounting", "mba"],
    roomsAndServices: [
      { name: "Financial Markets Trading Room", floor: "1st Floor", type: "classroom", details: "Equipped with dual-screen Bloomberg Terminals and stock tickers" },
      { name: "Muma Undergraduate Advising Center", floor: "BSN 2102", type: "office", details: "Academic advisors for Finance, Marketing, Management, and Analytics" },
      { name: "Muma Corporate Mentorship Suite", floor: "1st Floor", type: "office", details: "Career fairs, internship coaching, and employer interview rooms" },
      { name: "Business Dean's Executive Suite", floor: "3rd Floor", type: "office", details: "Dean's office and college leadership" },
      { name: "BSN Auditoriums (BSN 1200 & 1300)", floor: "1st Floor", type: "classroom", details: "Large lecture auditoriums for core business courses" },
    ],
  },
  {
    id: "svc",
    osmName: "Student Services Building",
    code: "SVC",
    name: "Student Services Building",
    shortName: "Student Services",
    category: "Services & Admin",
    description:
      "The administrative powerhouse every student visits. Houses Financial Aid, the Registrar, Cashier's Office, and Admissions.",
    freshmanTip:
      "Check in online using OASIS or the USF QLess app before walking into Financial Aid or Admissions to save hours of waiting in line.",
    sourceUrl: "https://www.usf.edu/admissions/",
    hours: "Mon-Fri 8:00 AM - 5:00 PM",
    aliases: ["svc", "financial aid", "registrar", "cashier", "admissions", "bursar", "scholarships", "transcripts"],
    roomsAndServices: [
      { name: "University Financial Aid & Scholarships", floor: "1st Floor (SVC 1027)", type: "service", details: "FAFSA questions, Bright Futures, loans, and aid disbursements" },
      { name: "Office of the Registrar", floor: "1st Floor (SVC 1034)", type: "service", details: "Class registration, graduation certification, and official transcripts" },
      { name: "University Cashier's Office", floor: "1st Floor (SVC 1038)", type: "service", details: "Tuition payments, Florida Prepaid billing, and fees" },
      { name: "Undergraduate Admissions", floor: "1st Floor (SVC 1036)", type: "service", details: "Admissions counseling and document drop-off" },
      { name: "Center for Career & Professional Development", floor: "2nd Floor (SVC 2088)", type: "service", details: "Resume reviews, Handshake job portal, and career fairs" },
      { name: "Student Accessibility Services (SAS)", floor: "1st Floor (SVC 1133)", type: "service", details: "Classroom and exam accommodations for students with disabilities" },
    ],
  },
  {
    id: "cpr",
    osmName: "Cooper Hall Arts and Sciences Building",
    code: "CPR",
    name: "Cooper Hall Arts & Sciences Building",
    shortName: "Cooper Hall",
    category: "Academics",
    description:
      "One of USF's classic flagship academic buildings. Nearly every undergraduate takes English, composition, or humanities classes here.",
    freshmanTip:
      "Cooper Hall is famous for its courtyard breezes and shaded breezeways. Classrooms are numbered logically: 100s on 1st floor, 400s on top.",
    sourceUrl: "https://www.usf.edu/arts-sciences/",
    hours: "Mon-Fri 7:00 AM - 9:30 PM",
    aliases: ["cpr", "cooper", "english", "humanities", "languages", "composition", "arts and sciences"],
    roomsAndServices: [
      { name: "Department of English", floor: "3rd Floor (CPR 358)", type: "office", details: "Faculty offices and undergraduate advising" },
      { name: "World Languages & Cultures", floor: "4th Floor (CPR 419)", type: "office", details: "Spanish, French, German, Japanese, and linguistics" },
      { name: "CPR 103 & 104 Main Auditoriums", floor: "1st Floor", type: "classroom", details: "High-capacity lecture halls for general education courses" },
      { name: "Humanities Computer Laboratory", floor: "2nd Floor", type: "study", details: "Equipped with software for translation and digital humanities" },
    ],
  },
  {
    id: "eng_kopp",
    osmName: "Edgar W Kopp Engineering Building",
    code: "ENG",
    name: "Edgar W. Kopp Engineering Building",
    shortName: "Kopp Engineering",
    category: "Academics",
    description:
      "The historic cornerstone of the College of Engineering. Houses civil, mechanical, and industrial engineering departments and machine shops.",
    freshmanTip:
      "Look for the Hall of Flags connecting the engineering complex. Kopp has computer labs on the 2nd floor with specialized CAD/MATLAB licenses.",
    sourceUrl: "https://www.usf.edu/engineering/",
    hours: "Mon-Fri 7:30 AM - 9:00 PM (24/7 keycard access for engineering majors)",
    aliases: ["eng", "enb", "kopp", "engineering", "mechanical", "civil", "cad", "hall of flags", "makerspace"],
    roomsAndServices: [
      { name: "College of Engineering Student Success Center", floor: "1st Floor", type: "office", details: "Dedicated engineering academic advisors and tutoring" },
      { name: "Engineering Design & Prototyping Machine Shop", floor: "Ground Floor", type: "amenity", details: "Laser cutters, CNC routers, lathes, and fabrication tools" },
      { name: "Civil & Environmental Engineering Dept.", floor: "ENG 118", type: "office", details: "Department chair, advising, and graduate research" },
      { name: "Industrial & Management Systems Engineering", floor: "ENG 215", type: "office", details: "Operations research, ergonomics labs, and faculty offices" },
      { name: "Kopp Open Computing Lab", floor: "ENG 202", type: "study", details: "High-power CAD/SolidWorks/MATLAB workstations" },
    ],
  },
  {
    id: "eng_two",
    osmName: "Engineering Building II",
    code: "ENB",
    name: "Engineering Building II",
    shortName: "Engineering II",
    category: "Academics",
    description:
      "Home to Computer Science & Engineering, Electrical Engineering, and cutting-edge robotics and cyber-security research centers.",
    freshmanTip:
      "If you're studying CS, IT, or cybersecurity, you will spend late nights in the ENB computing and hardware laboratories.",
    sourceUrl: "https://www.usf.edu/engineering/cse/",
    hours: "Mon-Fri 7:30 AM - 9:00 PM (24/7 keycard access for majors)",
    aliases: ["enb", "cs", "computer science", "electrical engineering", "cybersecurity", "robotics", "software"],
    roomsAndServices: [
      { name: "Department of Computer Science & Engineering (CSE)", floor: "3rd Floor (ENB 342)", type: "office", details: "CSE faculty, advisors, and student labs" },
      { name: "Electrical Engineering Department", floor: "ENB 240", type: "office", details: "Power systems, circuits, and nanotechnology" },
      { name: "Cyber Florida (Florida Center for Cybersecurity)", floor: "1st Floor", type: "office", details: "Statewide cybersecurity operations and defense labs" },
      { name: "Autonomous Systems & Robotics Lab", floor: "1st Floor", type: "classroom", details: "Drone navigation and autonomous vehicle research" },
    ],
  },
  {
    id: "isa",
    osmName: "Interdisciplinary Sciences",
    code: "ISA",
    name: "Interdisciplinary Sciences Building (ISA)",
    shortName: "ISA Sciences",
    category: "Academics",
    description:
      "USF's flagship $91-million seven-story natural sciences research facility. Houses state-of-the-art physics, biology, and chemistry labs.",
    freshmanTip:
      "The ISA lobby has comfortable modern study booths and an Einstein Bros. Bagels right around the breezeway.",
    sourceUrl: "https://www.usf.edu/arts-sciences/",
    hours: "Mon-Fri 7:30 AM - 8:30 PM",
    aliases: ["isa", "sciences", "physics", "biology labs", "chemistry labs", "stem", "bagels"],
    roomsAndServices: [
      { name: "ISA 1051 & 1061 Giant Auditorium Theaters", floor: "1st Floor", type: "classroom", details: "300-seat tech-enabled lecture halls for General Chemistry & Biology" },
      { name: "Department of Physics", floor: "ISA 5102 (5th Floor)", type: "office", details: "Physics faculty, condensed matter research, and optics" },
      { name: "Department of Chemistry Research Floors", floor: "Floors 6 & 7", type: "office", details: "Organic chemistry and biochemistry synthesis research labs" },
      { name: "Interdisciplinary Student Study Lounges", floor: "Floors 2-5 (Atrium Overlook)", type: "study", details: "Glass-walled study lofts with whiteboards and campus views" },
    ],
  },
  {
    id: "che",
    osmName: "Chemistry",
    code: "CHE",
    name: "Chemistry Building",
    shortName: "Chemistry",
    category: "Academics",
    description:
      "Houses undergraduate chemistry instructional laboratories, organic chemistry teaching labs, and chemistry faculty suites.",
    freshmanTip:
      "Remember: safety goggles and closed-toe shoes are mandatory before entering any laboratory on the 2nd or 3rd floor!",
    sourceUrl: "https://www.usf.edu/arts-sciences/chemistry/",
    hours: "Mon-Fri 8:00 AM - 6:00 PM",
    aliases: ["che", "chemistry", "chem lab", "goggles", "organic chemistry"],
    roomsAndServices: [
      { name: "Undergraduate Chemistry Lab Stockroom", floor: "1st Floor", type: "service", details: "Pick up lab coats, splash goggles, and glassware kits" },
      { name: "General Chemistry Teaching Labs", floor: "2nd Floor", type: "classroom", details: "Fume-hood equipped stations for Chem 2045L & 2046L" },
      { name: "Organic Chemistry Teaching Labs", floor: "3rd Floor", type: "classroom", details: "Distillation and synthesis stations for Org Chem labs" },
    ],
  },
  {
    id: "shs",
    osmName: "Student Health & Wellness Center",
    code: "SHS",
    name: "Student Health & Wellness Center",
    shortName: "Student Health Center",
    category: "Health & Medicine",
    description:
      "A modern 47,000-sq-ft health facility providing primary medical care, mental health counseling, immunizations, and a full pharmacy.",
    freshmanTip:
      "Most primary care physician visits are covered by your student health fee included in your tuition. Schedule online via BullCheckIn.",
    sourceUrl: "https://www.usf.edu/student-affairs/student-health-services/",
    hours: "Mon-Fri 8:00 AM - 5:00 PM",
    aliases: ["shs", "health", "doctor", "clinic", "wellness", "counseling", "pharmacy", "vaccines", "mental health"],
    roomsAndServices: [
      { name: "Outpatient Medical Clinic & Urgent Care", floor: "1st Floor", type: "service", details: "Treatment for illness, flu, minor injuries, and preventative care" },
      { name: "Student Health Pharmacy", floor: "1st Floor", type: "service", details: "Discounted student prescriptions and over-the-counter medicine" },
      { name: "Counseling Center & Psychological Services", floor: "2nd Floor", type: "service", details: "Free confidential individual therapy, crisis support, and workshops" },
      { name: "Immunization Compliance Office", floor: "1st Floor", type: "office", details: "Submit MMR and immunization records to clear registration holds" },
      { name: "Center for Student Well-Being", floor: "2nd Floor", type: "amenity", details: "Stress relief lounge, relaxation pods, and nutrition counseling" },
    ],
  },
  {
    id: "bks",
    osmName: "USF Bookstore",
    code: "BKS",
    name: "USF Campus Bookstore & Cafe",
    shortName: "USF Bookstore",
    category: "Student Life & Dining",
    description:
      "The official campus bookstore. Buy and rent textbooks, get USF Bulls green & gold gear, and visit the in-store Starbucks cafe.",
    freshmanTip:
      "Price-match your textbooks against Amazon here, and pick up your commencement regalia and football gameday shirts!",
    sourceUrl: "https://www.bkstr.com/usftampastore/home",
    hours: "Mon-Fri 9:00 AM - 6:00 PM, Sat 10:00 AM - 4:00 PM",
    aliases: ["bookstore", "bks", "textbooks", "merch", "bulls gear", "hoodies", "starbucks cafe"],
    roomsAndServices: [
      { name: "Course Materials & Textbook Desk", floor: "2nd Floor", type: "service", details: "Rent, buy new/used, or pick up online book orders" },
      { name: "Official USF Apparel & Spirit Shop", floor: "1st Floor", type: "amenity", details: "Jerseys, hats, tailgate supplies, and USF alumni gear" },
      { name: "Apple & Dell Tech Store", floor: "1st Floor", type: "service", details: "Educational discounts on MacBooks, iPads, and accessories" },
      { name: "Bookstore Starbucks Express", floor: "1st Floor", type: "dining", details: "Coffee, iced tea, and pastries" },
    ],
  },
  {
    id: "yuengling",
    osmName: "Yuengling Center",
    code: "YNG",
    name: "Yuengling Center (USF Sun Dome)",
    shortName: "Yuengling Center",
    category: "Athletics & Rec",
    description:
      "The premier 10,500-seat multi-purpose arena on campus. Home of USF Men’s & Women’s Basketball, Volleyball, concerts, and Commencement.",
    freshmanTip:
      "USF students get FREE admission to all home Bulls basketball games and volleyball matches through the Herd perks app!",
    photo: "/images/buildings/sundome.jpg",
    sourceUrl: "https://www.yuenglingcenter.com/",
    hours: "Event-based & Gamedays (Box office Mon-Fri 10:00 AM - 4:00 PM)",
    aliases: ["yuengling", "sun dome", "yng", "basketball", "arena", "concerts", "commencement", "athletics"],
    roomsAndServices: [
      { name: "Main Arena Bowl & Court", floor: "Main Concourse", type: "amenity", details: "10,500 capacity arena for Bulls basketball and major concert tours" },
      { name: "USF Athletics Ticket Box Office", floor: "Gate A", type: "service", details: "Student student-section claim and general event tickets" },
      { name: "Arena Concessions & Team Store", floor: "Concourses Gates A-D", type: "dining", details: "Game day food, snacks, and official Bull gear" },
    ],
  },
  {
    id: "hub",
    osmName: "The Hub",
    code: "HUB",
    name: "The Hub Residential Dining",
    shortName: "The Hub Dining",
    category: "Student Life & Dining",
    description:
      "All-you-care-to-eat dining facility located in the heart of The Village residential community. Fresh stations rotate daily.",
    freshmanTip:
      "Open until late night for midnight study cravings. Features a Mongolian stir-fry grill, custom pizza ovens, and vegan/gluten-free stations.",
    sourceUrl: "https://usf.campusdish.com/",
    hours: "Daily 7:00 AM - 11:00 PM (Continuous service)",
    aliases: ["hub", "the hub", "dining hall", "village dining", "buffet", "all you can eat", "meal plan"],
    roomsAndServices: [
      { name: "Global Fare & Mongolian Grill Station", floor: "1st Floor", type: "dining", details: "Custom stir-fry made to order with fresh veggies and noodles" },
      { name: "True Balance Allergen-Friendly Station", floor: "1st Floor", type: "dining", details: "Free from the top 9 common food allergens" },
      { name: "Brick Oven Pizza & Italian Pasta", floor: "1st Floor", type: "dining", details: "Fresh baked artisan pizzas, strombolis, and pasta" },
      { name: "Fresh Salad & Deli Bar", floor: "1st Floor", type: "dining", details: "Build your own wraps, sandwiches, and crisp greens" },
      { name: "Dessert & Soft-Serve Ice Cream Bar", floor: "1st Floor", type: "dining", details: "Fresh baked cookies, pastries, and frozen yogurt" },
    ],
  },
  {
    id: "the_fit",
    osmName: "The Fit Health & Wellness Center",
    code: "FIT",
    name: "The Fit Wellness Center (The Village)",
    shortName: "The Fit",
    category: "Athletics & Rec",
    description:
      "A modern satellite recreation center situated inside The Village residential community, complete with an outdoor resort-style pool.",
    freshmanTip:
      "If you live in Pinnacle, Endeavor, Horizon, Summit, or Beacon, this gym is right outside your doorstep!",
    photo: "/images/buildings/fit.jpg",
    sourceUrl: "https://www.usf.edu/student-affairs/campus-rec/facilities/the-fit.aspx",
    hours: "Mon-Thu 7:00 AM - 10:00 PM, Fri 7:00 AM - 8:00 PM, Weekends 10:00 AM - 6:00 PM",
    aliases: ["the fit", "fit", "village gym", "resort pool", "village pool", "cardio"],
    roomsAndServices: [
      { name: "Cardio & Free Weight Floor", floor: "1st & 2nd Floors", type: "amenity", details: "Dumbbells, barbells, cable machines, and rowers" },
      { name: "Resort-Style Outdoor Swimming Pool", floor: "Outdoor Patio", type: "amenity", details: "Loungers, sun deck, and leisure swimming" },
      { name: "Spin & Cycling Studio", floor: "2nd Floor", type: "classroom", details: "Virtual cycling classes and open workout studio" },
    ],
  },
  {
    id: "publix",
    osmName: "Publix",
    code: "PUB",
    name: "Publix on Campus at USF",
    shortName: "USF Publix",
    category: "Student Life & Dining",
    description:
      "The first full-scale grocery store built on a university campus in Florida. 28,000 sq ft of fresh produce, deli subs, and essentials.",
    freshmanTip:
      "Grab a world-famous 'Pub Sub' (Publix Sub) between classes! Order on the Publix app 20 minutes before to bypass the deli line.",
    sourceUrl: "https://www.publix.com/",
    hours: "Daily 7:00 AM - 10:00 PM",
    aliases: ["publix", "pub sub", "grocery", "deli", "food", "snacks", "groceries", "supermarket"],
    roomsAndServices: [
      { name: "Publix Deli & Sub Counter", floor: "Front of Store", type: "dining", details: "Custom made hot & cold subs, chicken tenders, and grab-and-go meals" },
      { name: "Full-Service Grocery & Produce Aisles", floor: "Main Floor", type: "amenity", details: "Fresh fruit, dorm snacks, dairy, frozen foods, and toiletries" },
      { name: "Publix Pharmacy", floor: "Front Corner", type: "service", details: "Prescription refills, vaccines, and wellness items" },
      { name: "Presto! ATM", floor: "Vestibule", type: "service", details: "Surcharge-free ATM for most regional bank cards" },
    ],
  },
  {
    id: "jph",
    osmName: "Juniper-Poplar Hall",
    code: "JPH",
    name: "Juniper-Poplar Residence Hall",
    shortName: "Juniper-Poplar",
    category: "Housing & Dorms",
    description:
      "A massive 9-story residential community housing over 1,000 freshman and upperclass students with an in-building dining hall and pod-style suites.",
    freshmanTip:
      "Juniper Dining and Starbucks are on the 1st floor inside the lobby, meaning you don't even have to step outside in the rain for coffee or food!",
    sourceUrl: "https://www.usf.edu/housing/residential-experience/hall-information/juniper-poplar.aspx",
    hours: "24/7 keycard security access for residents",
    aliases: ["jph", "juniper", "poplar", "dorm", "housing", "dining", "freshman housing"],
    roomsAndServices: [
      { name: "Juniper Dining Hall", floor: "1st Floor Lobby", type: "dining", details: "Full residential dining hall with salad bar, grill, and home cooked meals" },
      { name: "JPH Starbucks Express", floor: "1st Floor", type: "dining", details: "Coffee, iced teas, and pastries right in the residence hall lobby" },
      { name: "JPH 24/7 Reception & Mail Desk", floor: "1st Floor", type: "service", details: "Package pickup and resident assistant lock-out support" },
      { name: "Floor Lounges & Laundry Rooms", floor: "Floors 2-9", type: "amenity", details: "Study lounges with Smart TVs and free app-monitored laundry" },
    ],
  },
  {
    id: "argos",
    osmName: "Argos Center",
    code: "ARG",
    name: "Argos Student Center & Dining",
    shortName: "Argos Center",
    category: "Student Life & Dining",
    description:
      "The activity and dining hub for the central residence communities (Castor, Beta, Kosove). Features Flip Kitchen and student study lounges.",
    freshmanTip:
      "Castor Beach and the Castor reflection pond are right outside Argos Center—a prime outdoor sunbathing and hammock spot.",
    sourceUrl: "https://www.usf.edu/housing/",
    hours: "Daily 8:00 AM - 10:00 PM",
    aliases: ["argos", "flip kitchen", "castor beach", "dining", "halls"],
    roomsAndServices: [
      { name: "Flip Kitchen / Argos Eats", floor: "1st Floor", type: "dining", details: "Rotational artisan flatbreads, burgers, and bowls" },
      { name: "Central Housing Package & Mail Center", floor: "1st Floor", type: "service", details: "Package locker pickup for Castor, Beta, and Kosove residents" },
      { name: "Argos Student Study Lounge", floor: "2nd Floor", type: "study", details: "Quiet tables and collaborative couches" },
    ],
  },
  {
    id: "castor",
    osmName: "Castor Hall",
    code: "CAS",
    name: "Castor Residence Hall",
    shortName: "Castor Hall",
    category: "Housing & Dorms",
    description:
      "USF's traditional freshman residence hall located adjacent to Castor Beach, offering double occupancy rooms and close proximity to MSC.",
    freshmanTip:
      "Castor Hall is only a 3-minute walk to the Library and Marshall Student Center, making it one of the most convenient dorms on campus.",
    sourceUrl: "https://www.usf.edu/housing/",
    hours: "24/7 keycard access for residents",
    aliases: ["castor", "castor beach", "dorm", "freshman dorm", "housing"],
    roomsAndServices: [
      { name: "Castor Living-Learning Communities (LLC)", floor: "Multiple Floors", type: "study", details: "First-generation and honors cohort floors" },
      { name: "Castor Hall Recreation Lounge", floor: "1st Floor", type: "amenity", details: "Billiards, ping pong, community kitchen, and TV lounge" },
    ],
  },
  {
    id: "village_pinnacle",
    osmName: "Pinnacle Hall",
    code: "PIN",
    name: "Pinnacle Hall (The Village)",
    shortName: "Pinnacle Hall",
    category: "Housing & Dorms",
    description:
      "One of the flagship modern residence halls in The Village, featuring contemporary pod and suite style student living.",
    freshmanTip:
      "Directly next to The Hub dining and The Fit gym. Has full floor-to-ceiling glass study lounges on every floor.",
    sourceUrl: "https://www.usf.edu/housing/",
    hours: "24/7 resident keycard access",
    aliases: ["pinnacle", "village", "housing", "dorm"],
    roomsAndServices: [
      { name: "Pinnacle Community Lounge", floor: "1st Floor", type: "amenity", details: "Gaming area, collaborative study booths, and community kitchen" },
      { name: "Floor Study Lounges", floor: "Floors 2-6", type: "study", details: "Quiet study spaces with whiteboard walls" },
    ],
  },
  {
    id: "botanical",
    osmName: "Botanical Gardens Office",
    code: "BOT",
    name: "USF Botanical Gardens",
    shortName: "Botanical Gardens",
    category: "Student Life & Dining",
    description:
      "A lush 16-acre paradise on the southwest corner of campus featuring subtropical plant collections, butterfly gardens, orchid houses, and nature trails.",
    freshmanTip:
      "Free admission for USF students with ID! The perfect place for mindfulness, reading outdoors, and escaping the buzz of campus.",
    photo: "/images/buildings/botanical.jpg",
    sourceUrl: "https://www.usf.edu/arts-sciences/botanical-gardens/",
    hours: "Mon-Sat 9:00 AM - 4:00 PM",
    aliases: ["botanical", "gardens", "bot", "plants", "butterflies", "nature", "trails", "lake"],
    roomsAndServices: [
      { name: "Botanical Gardens Welcome Center & Gift Shop", floor: "Entrance", type: "service", details: "Garden maps, local honey produced on-site, and succulent plants" },
      { name: "Orchid Greenhouse & Bromeliad Collection", floor: "Central Gardens", type: "amenity", details: "World-class collection of exotic and native Florida orchids" },
      { name: "Lake & Wetland Boardwalk Trail", floor: "Nature Preserve", type: "amenity", details: "Observation deck for turtles, herons, and water lilies" },
    ],
  },
  {
    id: "cam",
    osmName: "University Of South Florida Contemporary Art Museum;Contemporary Art Museum",
    code: "CAM",
    name: "USF Contemporary Art Museum (CAM)",
    shortName: "Art Museum (CAM)",
    category: "Arts & Performance",
    description:
      "Nationally accredited contemporary museum presenting dynamic exhibitions by international artists and student curated showcases.",
    freshmanTip:
      "Free admission for everyone! Great spot between classes to get inspired and view world-class modern contemporary artwork.",
    sourceUrl: "https://cam.usf.edu/",
    hours: "Mon-Fri 10:00 AM - 5:00 PM, Thu until 8:00 PM, Sat 1:00 PM - 4:00 PM",
    aliases: ["cam", "museum", "contemporary art", "gallery", "exhibitions", "fine arts"],
    roomsAndServices: [
      { name: "Main Exhibition Galleries (Galleries 1-3)", floor: "1st Floor", type: "amenity", details: "Rotating international and national contemporary art exhibitions" },
      { name: "Graphicstudio Print Archive & Display", floor: "1st Floor", type: "office", details: "Limited-edition prints and sculptures by world-renowned artists" },
    ],
  },
  {
    id: "cwy",
    osmName: "CW Bill Young Hall",
    code: "CWY",
    name: "C.W. Bill Young Hall (ROTC & Veterans)",
    shortName: "CW Bill Young Hall",
    category: "Services & Admin",
    description:
      "Joint military leadership and veterans center housing USF Army, Navy, Marine, and Air Force ROTC programs and the Office of Veteran Success.",
    freshmanTip:
      "Ranked among the top institutions nationwide for student veterans. Features dedicated study labs, leadership classrooms, and an outdoor courtyard.",
    sourceUrl: "https://www.usf.edu/undergrad/veterans/",
    hours: "Mon-Fri 8:00 AM - 5:00 PM",
    aliases: ["cwy", "rotc", "veterans", "military", "air force", "army", "navy", "marines"],
    roomsAndServices: [
      { name: "Office of Veteran Success (OVS)", floor: "1st Floor", type: "service", details: "GI Bill benefits, VA certifying officials, and transition advising" },
      { name: "Veterans Computer & Study Lounge", floor: "1st Floor", type: "study", details: "Free printing, study stations, and coffee for military-connected students" },
      { name: "USF Joint ROTC Command Offices", floor: "2nd Floor", type: "office", details: "Army, Naval, and Air Force ROTC cadet advising and uniform issue" },
    ],
  },
  {
    id: "morsani",
    osmName: "USF Health Morsani College of Medicine",
    code: "MDC",
    name: "USF Health Morsani College of Medicine",
    shortName: "Morsani Medicine",
    category: "Health & Medicine",
    description:
      "The academic hub of USF Health on the Tampa campus, housing medical science classrooms, anatomy labs, and health research facilities.",
    freshmanTip:
      "Pre-med and health sciences students often visit the Shimberg Health Sciences Library located adjacent in this health complex.",
    sourceUrl: "https://health.usf.edu/medicine",
    hours: "Mon-Fri 7:30 AM - 7:00 PM",
    aliases: ["mdc", "medicine", "morsani", "health", "pre-med", "anatomy", "medical school"],
    roomsAndServices: [
      { name: "Shimberg Health Sciences Library", floor: "Health Quad", type: "study", details: "Medical journals, quiet study suites, and health informatics labs" },
      { name: "USF Health Learning & Lecture Auditoriums", floor: "1st Floor", type: "classroom", details: "Tiered multi-media classrooms for medical and PA cohorts" },
      { name: "Clinical Simulation & Skills Training Center", floor: "2nd Floor", type: "classroom", details: "High-fidelity clinical mannequin patient simulation rooms" },
    ],
  },
  {
    id: "police",
    osmName: "University Police",
    code: "UP",
    name: "USF University Police Department (UP)",
    shortName: "University Police",
    category: "Services & Admin",
    description:
      "Dedicated 24/7 law enforcement and campus safety headquarters. Operating emergency response, safety escorts, and blue-light security.",
    freshmanTip:
      "Save the USF Police 24/7 number in your phone: (813) 974-2628. Download the USF Safe App for instant emergency contact and mobile blue lights.",
    photo: "/images/buildings/police.jpg",
    sourceUrl: "https://www.usf.edu/administrative-services/university-police/",
    hours: "24/7 Emergency Dispatch & Patrol",
    aliases: ["police", "up", "safety", "emergency", "security", "lost and found", "blue light", "safe walk"],
    roomsAndServices: [
      { name: "24/7 Police Dispatch & Lobby", floor: "1st Floor", type: "service", details: "Emergency walk-ins, crime reports, and safety inquiries" },
      { name: "USF SafeWalk Escort Service", floor: "Dispatch", type: "service", details: "Call anytime at night for a uniformed safety escort anywhere on campus" },
      { name: "Campus Lost & Found Central", floor: "1st Floor", type: "service", details: "Register lost keys, wallets, laptops, and IDs" },
    ],
  },
];

// Helper index: maps any OSM building name or catalog ID to a rich USFBuilding record
const catalogByName = new Map<string, USFBuilding>();
for (const b of USF_BUILDINGS_CATALOG) {
  catalogByName.set(b.id.toLowerCase(), b);
  catalogByName.set(b.osmName.toLowerCase(), b);
  catalogByName.set(b.name.toLowerCase(), b);
  catalogByName.set(b.shortName.toLowerCase(), b);
}

// Fallback generator for all other 140+ named OSM buildings so every footprint has rich data
export function getBuildingProfile(osmName: string): USFBuilding {
  const existing = catalogByName.get(osmName.toLowerCase());
  if (existing) return existing;

  // Derive sensible code and category
  let code = osmName
    .split(/\s+/)
    .filter((w) => !/and|of|the|for|in|at/i.test(w))
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  if (code.length < 2) code = osmName.slice(0, 3).toUpperCase();

  let category: BuildingCategory = "Academics";
  let description = `${osmName} is an active facility on the USF Tampa campus.`;
  let tip = "Use the map tag or search to find nearby parking and campus road access.";

  if (/Hall|Housing|Suites|Apartments|Apts|Village/i.test(osmName)) {
    category = "Housing & Dorms";
    description = `Residential community housing USF students with campus living amenities, study rooms, and nearby dining access.`;
    tip = "Residents can access via their USF student ID keycard. Visitors must check in at the reception desk.";
  } else if (/Center|Centre|Union|Bookstore|Dining|Cafe|Food|Market/i.test(osmName)) {
    category = "Student Life & Dining";
    description = `Student hub offering campus dining, meeting rooms, and collaborative spaces.`;
    tip = "Accepts USF Dining Dollars and Bull Bucks at participating service counters.";
  } else if (/Parking|Garage|Facility/i.test(osmName)) {
    category = "Parking";
    description = `Multi-level campus parking facility supporting student (S), staff (E), and visitor parking.`;
    tip = "Permit enforcement is active Monday through Friday. Pay-by-phone visitor spots available via ParkMobile.";
  } else if (/Health|Clinic|Medical|Hospital|Psychiatry|Eye|Nursing|Medicine/i.test(osmName)) {
    category = "Health & Medicine";
    description = `Healthcare, clinical instruction, or health science research facility part of USF Health.`;
    tip = "Patient parking is designated near the main front drop-off entrance.";
  } else if (/Recreation|Gym|Sports|Athletic|Arena|Dome|Stadium|Practice/i.test(osmName)) {
    category = "Athletics & Rec";
    description = `Bulls athletics and campus recreation facility for sports, fitness, and training.`;
    tip = "Bring your valid USF student ID for building access and free entry to athletic home events.";
  } else if (/Engineering|Science|Chemistry|Bio|Physics|Tech|Lab|Research/i.test(osmName)) {
    category = "Academics";
    description = `STEM academic facility featuring state-of-the-art laboratory benches, research suites, and lecture halls.`;
    tip = "Laboratory access may require prerequisite safety training and department authorization.";
  } else if (/Arts|Music|Theatre|Dance|Museum/i.test(osmName)) {
    category = "Arts & Performance";
    description = `Creative arts venue with performance halls, studio workshops, and practice rooms.`;
    tip = "Check the College of the Arts calendar for free student concerts, recitals, and exhibitions.";
  } else if (/Services|Administration|Police|Center|Office|Plant|Operations/i.test(osmName)) {
    category = "Services & Admin";
    description = `Administrative and student support facility serving university operations.`;
    tip = "Open during standard business hours Monday through Friday, 8:00 AM - 5:00 PM.";
  }

  const generated: USFBuilding = {
    id: osmName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    osmName,
    code,
    name: osmName,
    shortName: osmName.length > 26 ? osmName.slice(0, 24) + "…" : osmName,
    category,
    description,
    freshmanTip: tip,
    roomsAndServices: [
      { name: "Main Entry & Lobby", floor: "1st Floor", type: "service", details: "Building directory and elevator access" },
      { name: "Faculty & Staff Offices", floor: "Multiple Floors", type: "office", details: "Department administration and faculty consultation hours" },
    ],
    hours: "Mon-Fri 7:30 AM - 7:00 PM",
  };

  return generated;
}
