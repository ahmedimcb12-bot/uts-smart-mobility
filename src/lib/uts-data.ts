export const COMPANY = {
  name: "United Transport Service",
  short: "UTS",
  tagline: "Safe. Reliable. Smarter Transportation.",
  address: [
    "Office No. 2, Block 20-B",
    "Kashif Blair Plaza",
    "G-8 Markaz",
    "Islamabad, Pakistan",
  ],
  phones: ["051-2251642", "051-2260727"],
  // Email is collected through the contact form; no public email address has been verified.
  email: "",
};

export const OFFICE_LOCATIONS = [
  "Islamabad",
  "Karachi",
  "Lahore",
  "Quetta",
  "Faisalabad",
  "Multan",
  "Sukkur",
  "Peshawar",
  "Saudi Arabia",
];

export const SERVICES = [
  {
    slug: "corporate-booking",
    title: "Corporate Booking",
    description:
      "Contracted transport for organisations, staff movement and executive travel with scheduled pick-up and drop-off.",
  },
  {
    slug: "tourism-booking",
    title: "Tourism Booking",
    description:
      "Vehicles and drivers for tour groups, sightseeing itineraries and inter-city travel across Pakistan.",
  },
  {
    slug: "pick-and-drop",
    title: "Pick & Drop",
    description:
      "Daily pick-up and drop-off arrangements for employees and individuals on fixed routes and timings.",
  },
  {
    slug: "rent-a-car",
    title: "Rent a Car",
    description:
      "Short and long-term vehicle rental, with or without a driver, for business and personal use.",
  },
  {
    slug: "group-transfer",
    title: "Group Transfer",
    description:
      "Coordinated movement of larger groups for events, conferences, airport transfers and site visits.",
  },
  {
    slug: "personal-booking",
    title: "Personal Booking",
    description:
      "On-demand vehicles for personal travel, family trips and one-off journeys.",
  },
  {
    slug: "nust-pick-and-drop",
    title: "NUST Pick & Drop",
    description:
      "Dedicated student pick-up and drop-off arrangements serving NUST routes.",
  },
];

export const FLEET_CATEGORIES = [
  {
    title: "Sedans",
    description: "Comfortable cars for executive travel and small-party movement.",
  },
  {
    title: "SUVs",
    description: "Higher-clearance vehicles for mixed terrain and longer journeys.",
  },
  {
    title: "Vans",
    description: "Shared pick & drop and small group transfers.",
  },
  {
    title: "Coasters",
    description: "Mid-size passenger transport for staff and student routes.",
  },
  {
    title: "Buses",
    description: "Large-capacity transport for organisational and group movement.",
  },
  {
    title: "Luxury Vehicles",
    description: "Premium vehicles for executive, VIP and guest transportation.",
  },
  {
    title: "Special Purpose Vehicles",
    description: "Vehicles arranged for specific operational or project requirements.",
  },
];

export const SMART_FEATURES = [
  {
    key: "attendance",
    title: "Passenger Attendance",
    description:
      "Drivers can digitally record passenger attendance during daily routes.",
  },
  {
    key: "absence",
    title: "Absence Notifications",
    description:
      "When a route ends, unchecked passengers can automatically be marked absent and notifications can be generated.",
  },
  {
    key: "fees",
    title: "Fee Management",
    description:
      "Transport fee records can be monitored with automated overdue reminders.",
  },
  {
    key: "dashboard",
    title: "Operations Dashboard",
    description:
      "Administrators can monitor routes, drivers, passengers, attendance and notifications from one place.",
  },
];

export const COMPLAINT_CATEGORIES = [
  "Late Pickup",
  "Late Drop-off",
  "Driver Behaviour",
  "Cleanliness",
  "AC / Comfort",
  "Overcrowding",
  "Route Issue",
  "Pickup Location",
  "Payment / Fee",
  "Attendance",
  "Other",
];

export const COMPLAINT_STATUSES = ["OPEN", "IN REVIEW", "RESOLVED", "CLOSED"] as const;
export const COMPLAINT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const REVIEW_CRITERIA = [
  { key: "overall_rating", label: "Overall Rating", required: true },
  { key: "driver_rating", label: "Driver" },
  { key: "comfort_rating", label: "Comfort" },
  { key: "punctuality_rating", label: "Punctuality" },
  { key: "cleanliness_rating", label: "Cleanliness" },
  { key: "ac_rating", label: "AC" },
  { key: "pickup_dropoff_rating", label: "Pickup / Drop-off" },
  { key: "communication_rating", label: "Communication" },
] as const;

export const FAQS = [
  {
    q: "Which cities does UTS operate in?",
    a: "UTS lists offices in Islamabad, Karachi, Lahore, Quetta, Faisalabad, Multan, Sukkur, Peshawar and Saudi Arabia. Coverage for a specific route is confirmed when you send a transport request.",
  },
  {
    q: "What services can I book?",
    a: "Corporate booking, tourism booking, pick & drop, rent a car, group transfer, personal booking and NUST pick & drop.",
  },
  {
    q: "Is live GPS tracking available?",
    a: "Live tracking integration is coming soon. The platform preview shown on this site is an interface preview, not live vehicle data.",
  },
  {
    q: "What is the Smart Transport Platform?",
    a: "It is a new digital layer being introduced alongside existing UTS services: digital passenger attendance, absence notifications, fee management and an operations dashboard.",
  },
  {
    q: "How is attendance recorded?",
    a: "Drivers mark passengers on a mobile-first screen during the route. When the route is ended, passengers who were not marked present are recorded as absent and notifications are queued.",
  },
  {
    q: "Does the driver app work without internet?",
    a: "Yes. Attendance changes are stored on the device while offline and synced automatically once connectivity returns.",
  },
  {
    q: "How do I raise a complaint?",
    a: "Submit it through the reviews page or the contact form. Every complaint is given a reference and tracked through review to resolution.",
  },
  {
    q: "How do I request transport?",
    a: "Use the Request Transport form with your route, dates and passenger count. The operations team responds using the contact details you provide.",
  },
];

export const SOCIAL_LINKS = [
  { name: "LinkedIn", url: null },
  { name: "Facebook", url: null },
  { name: "Instagram", url: null },
  { name: "YouTube", url: null },
];
