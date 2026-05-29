import { generatedBackgroundCollections } from "./backgrounds-data";
import { lifestyleImages } from "./lifestyle-data";

// ─── Offer Library ────────────────────────────────────────────────────────────
// Global pool of offers. In the future, this grows via CSV upload.

export const offerLibrary = [
  {
    id: "crv-trailsport",
    year: "2026",
    make: "Honda",
    model: "CR-V",
    trim: "TrailSport AWD",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071654/vw-funds/public/cars/CR-V.png",
    stock: 16,
    offerType: "Lease",
    tags: ["Regional"],
    pvi: 92,
    aging: 27,
    sales: 10,
    inventory: 16,
    monthlyPayment: 529,
    term: 36,
    totalDueAtSigning: 4999,
  },
  {
    id: "hrv-sport",
    year: "2026",
    make: "Honda",
    model: "HR-V",
    trim: "Sport 2WD",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071657/vw-funds/public/cars/HR-V.png",
    stock: 24,
    offerType: "Lease",
    tags: ["Regional"],
    pvi: 93,
    aging: 70,
    sales: 9,
    inventory: 24,
    monthlyPayment: 699,
    term: 36,
    totalDueAtSigning: 5259,
  },
  {
    id: "crv-lx",
    year: "2026",
    make: "Honda",
    model: "CR-V",
    trim: "LX AWD",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071655/vw-funds/public/cars/CR-V2.png",
    stock: 6,
    offerType: "Lease",
    tags: ["Regional"],
    pvi: 92,
    aging: 91,
    sales: 3,
    inventory: 6,
    monthlyPayment: 999,
    term: 36,
    totalDueAtSigning: 8419,
  },
  {
    id: "odyssey-exl",
    year: "2026",
    make: "Honda",
    model: "Odyssey",
    trim: "EX-L",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071663/vw-funds/public/cars/Odyssey.png",
    stock: 25,
    offerType: "Lease",
    tags: ["Regional"],
    pvi: 96,
    aging: 77,
    sales: 33,
    inventory: 25,
    monthlyPayment: 999,
    term: 39,
    totalDueAtSigning: 7199,
  },
  {
    id: "civic-hybrid",
    year: "2026",
    make: "Honda",
    model: "Civic Sport",
    trim: "Touring Hybrid",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071656/vw-funds/public/cars/Civic.png",
    stock: 10,
    offerType: "Lease",
    tags: ["Regional"],
    pvi: 92,
    aging: 71,
    sales: 6,
    inventory: 10,
    monthlyPayment: 799,
    term: 36,
    totalDueAtSigning: 7099,
  },

  // ── BMW ──────────────────────────────────────────────────────────────────────
  {
    id: "bmw-m5-touring",
    year: "2026",
    make: "BMW",
    model: "M5",
    trim: "M5 Touring",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071658/vw-funds/public/cars/M5_Touring.png",
    stock: 4,
    offerType: "Lease",
    tags: ["National"],
    pvi: 88,
    aging: 12,
    sales: 2,
    inventory: 4,
    monthlyPayment: 1689,
    term: 36,
    totalDueAtSigning: 13408,
  },
  {
    id: "bmw-x2-xdrive28i",
    year: "2026",
    make: "BMW",
    model: "X2",
    trim: "xDrive28i",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071664/vw-funds/public/cars/X2.png",
    stock: 18,
    offerType: "Lease",
    tags: ["National"],
    pvi: 94,
    aging: 34,
    sales: 11,
    inventory: 18,
    monthlyPayment: 609,
    term: 36,
    totalDueAtSigning: 5289,
  },
  {
    id: "bmw-x5-m60i",
    year: "2026",
    make: "BMW",
    model: "X5",
    trim: "M60i",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071667/vw-funds/public/cars/X5_M60i.png",
    stock: 9,
    offerType: "Lease",
    tags: ["National"],
    pvi: 91,
    aging: 22,
    sales: 7,
    inventory: 9,
    monthlyPayment: 1159,
    term: 39,
    totalDueAtSigning: 8619,
  },
  {
    id: "bmw-x5m-competition",
    year: "2026",
    make: "BMW",
    model: "X5 M",
    trim: "Competition",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071665/vw-funds/public/cars/X5_-_Competition.png",
    stock: 3,
    offerType: "Lease",
    tags: ["National"],
    pvi: 85,
    aging: 8,
    sales: 1,
    inventory: 3,
    monthlyPayment: 2079,
    term: 36,
    totalDueAtSigning: 10999,
  },
  {
    id: "bmw-x5m-competition-apr",
    year: "2026",
    make: "BMW",
    model: "X5 M",
    trim: "Competition",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071666/vw-funds/public/cars/X5_-_Competition2.png",
    stock: 3,
    offerType: "APR",
    tags: ["National"],
    pvi: 87,
    aging: 8,
    sales: 1,
    inventory: 3,
    monthlyPayment: 1710,
    term: 60,
    totalDueAtSigning: 0,
  },
  {
    id: "bmw-x6-m60i",
    year: "2026",
    make: "BMW",
    model: "X6",
    trim: "M60i",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071668/vw-funds/public/cars/X6.png",
    stock: 6,
    offerType: "Lease",
    tags: ["National"],
    pvi: 90,
    aging: 19,
    sales: 4,
    inventory: 6,
    monthlyPayment: 1319,
    term: 39,
    totalDueAtSigning: 8979,
  },

  // ── Mercedes-Benz ─────────────────────────────────────────────────────────────
  {
    id: "mercedes-e350-4matic",
    year: "2026",
    make: "Mercedes-Benz",
    model: "E-Class",
    trim: "E350 4MATIC",
    image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071660/vw-funds/public/cars/Mercedes_C.png",
    stock: 14,
    offerType: "Lease",
    tags: ["National"],
    pvi: 93,
    aging: 41,
    sales: 9,
    inventory: 14,
    monthlyPayment: 729,
    term: 24,
    totalDueAtSigning: 6623,
  },
];

// ─── Template Library ─────────────────────────────────────────────────────────
// Global pool of templates.
// tags.makes: empty array = universal (works with any OEM);
//             non-empty = restricted to listed makes only.
// products: number of offer slots the template renders simultaneously.

export const templateLibrary = [
  // ── Single-product, Honda-specific ──
  {
    id: "website-2000x500",
    name: "Honda_Lease_Website_2000x500",
    format: "Website Banner",
    width: 2000,
    height: 500,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "display-970x250",
    name: "Honda_Lease_Display_970x250",
    format: "Display Leaderboard",
    width: 970,
    height: 250,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "display-300x250",
    name: "Honda_Lease_Display_300x250",
    format: "Display Medium Rectangle",
    width: 300,
    height: 250,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "social-1080x1080",
    name: "Honda_Lease_Social_1080x1080",
    format: "Social Square",
    width: 1080,
    height: 1080,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "website-600x450",
    name: "Honda_Lease_Website_600x450",
    format: "Website Medium Banner",
    width: 600,
    height: 450,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "website-600x1067",
    name: "Honda_Lease_Website_600x1067",
    format: "Website Tall Banner",
    width: 600,
    height: 1067,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  // ── Spiriva (pharma — ISI-split layout, no product slots) ──
  {
    id: "spiriva-300x600",
    name: "Spiriva_300x600",
    format: "Display Half Page",
    width: 300,
    height: 600,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },
  {
    id: "spiriva-160x600",
    name: "Spiriva_160x600",
    format: "Display Wide Skyscraper",
    width: 160,
    height: 600,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },
  {
    id: "spiriva-300x250",
    name: "Spiriva_300x250",
    format: "Display Medium Rectangle",
    width: 300,
    height: 250,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },
  {
    id: "spiriva-728x90",
    name: "Spiriva_728x90",
    format: "Display Leaderboard",
    width: 728,
    height: 90,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },
  {
    id: "spiriva-320x50",
    name: "Spiriva_320x50",
    format: "Mobile Banner",
    width: 320,
    height: 50,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },
  {
    id: "spiriva-300x50",
    name: "Spiriva_300x50",
    format: "Mobile Banner Wide",
    width: 300,
    height: 50,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },

  // ── Multi-product, universal (no OEM restriction) ──
  {
    id: "website-1969x1080-3prod",
    name: "Honda_3_Images_1969x1080",
    format: "Website Wide Banner 3-Up",
    width: 1969,
    height: 1080,
    brand: "",
    products: 3,
    tags: { makes: [] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "social-1080x1080-3prod",
    name: "Honda_3_Images_1080x1080",
    format: "Social Square 3-Up",
    width: 1080,
    height: 1080,
    brand: "",
    products: 3,
    tags: { makes: [] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "social-1080x1080-keymsg",
    name: "Honda_3_Images_KeyMessage_1080x1080",
    format: "Social Square Key Message 3-Up",
    width: 1080,
    height: 1080,
    brand: "",
    products: 3,
    tags: { makes: [] },
    logoSlots: ["primary-square", "event-square"],
  },
];

export type Template = typeof templateLibrary[0];
export type Offer = typeof offerLibrary[0];

// ─── Compatibility ────────────────────────────────────────────────────────────
// A template is compatible with an offer when either:
//  a) the template has no make restriction (universal), or
//  b) the offer's make is in the template's make tag list.

export function isCompatible(template: Template, offer: Offer): boolean {
  if (!template.tags.makes.length) return true;
  return template.tags.makes.includes(offer.make);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "Template"
  | "In Progress"
  | "Awaiting Approval"
  | "Needs Edits"
  | "Approved"
  | "Assets Created"
  | "Changes Made"
  | "Done"
  | "Expired"
  | "Archived";

export const projects = [
  {
    id: "honda-demo",
    dealerName: "Honda of Anywhere",
    name: "Single Products",
    code: "WF58329_HNDANY_SingleProducts_Jan26",
    status: "In Progress" as ProjectStatus,
    dateRange: "Jan 1, 2026 - Jan 31, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Honda",
    templateIds: [
      "website-2000x500",
      "display-970x250",
      "display-300x250",
      "social-1080x1080",
      "website-600x450",
      "website-600x1067",
    ],
    offerIds: [
      "crv-trailsport",
      "hrv-sport",
      "crv-lx",
      "odyssey-exl",
      "civic-hybrid",
    ],
  },
  {
    id: "honda-multi-demo",
    dealerName: "Honda of Anywhere",
    name: "Multi-Product",
    code: "WF58330_HNDANY_MultiProduct_Jan26",
    status: "In Progress" as ProjectStatus,
    dateRange: "Jan 1, 2026 - Jan 31, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Honda",
    templateIds: [
      "website-1969x1080-3prod",
      "social-1080x1080-3prod",
      "social-1080x1080-keymsg",
    ],
    offerIds: [
      "crv-trailsport",
      "hrv-sport",
      "crv-lx",
      "odyssey-exl",
      "civic-hybrid",
    ],
  },
  {
    id: "honda-mixed-demo",
    dealerName: "Honda of Anywhere",
    name: "Mixed Templates",
    code: "WF58331_HNDANY_MixedTemplates_Jan26",
    status: "In Progress" as ProjectStatus,
    dateRange: "Jan 1, 2026 - Jan 31, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Honda",
    templateIds: [
      "website-2000x500",
      "display-970x250",
      "display-300x250",
      "social-1080x1080",
      "website-600x450",
      "website-1969x1080-3prod",
      "social-1080x1080-3prod",
      "social-1080x1080-keymsg",
    ],
    offerIds: [
      "crv-trailsport",
      "hrv-sport",
      "crv-lx",
      "odyssey-exl",
      "civic-hybrid",
    ],
  },
  {
    id: "multi-brands-demo",
    dealerName: "Multiple Brands",
    name: "Multiple Brands",
    code: "WF61240_MULTIBR_MultiOffers_May26",
    status: "Assets Created" as ProjectStatus,
    dateRange: "May 1, 2026 - May 31, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Multi",
    templateIds: [
      "website-2000x500",
      "display-970x250",
      "display-300x250",
      "social-1080x1080",
      "website-600x450",
      "website-600x1067",
    ],
    offerIds: [
      "bmw-m5-touring",
      "bmw-x2-xdrive28i",
      "bmw-x5-m60i",
      "bmw-x5m-competition",
      "bmw-x5m-competition-apr",
      "bmw-x6-m60i",
      "mercedes-e350-4matic",
      "crv-trailsport",
      "hrv-sport",
      "crv-lx",
      "odyssey-exl",
      "civic-hybrid",
    ],
  },
  {
    id: "spiriva-april2026",
    dealerName: "Spiriva",
    name: "Spiriva_April2026",
    code: "WF63012_SPIRIVA_April2026_Pharma",
    status: "Assets Created" as ProjectStatus,
    dateRange: "Apr 1, 2026 - Apr 30, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Spiriva",
    templateIds: [] as string[],
    offerIds: [] as string[],
  },
  {
    id: "bmw-spring2026",
    dealerName: "BMW Seattle",
    name: "WASEABMW Spring Offers",
    code: "WF66948_WASEABMW_SpringOffers_Mar26",
    status: "Awaiting Approval" as ProjectStatus,
    dateRange: "Mar 1, 2026 - Mar 31, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "BMW",
    templateIds: [
      "website-2000x500",
      "display-970x250",
      "display-300x250",
      "social-1080x1080",
      "website-600x450",
      "website-600x1067",
    ],
    offerIds: [
      "bmw-m5-touring",
      "bmw-x2-xdrive28i",
      "bmw-x5-m60i",
    ],
  },
  {
    id: "honda-citylifestyle",
    dealerName: "Honda of Anywhere",
    name: "CityLifeStyle Magazine",
    code: "WF63239_HNDANY_CityLifeStyleMagazine",
    status: "Approved" as ProjectStatus,
    dateRange: "Feb 1, 2026 - Feb 28, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Honda",
    templateIds: [
      "website-2000x500",
      "social-1080x1080",
      "website-600x450",
    ],
    offerIds: [
      "crv-trailsport",
      "hrv-sport",
    ],
  },

  // ── Improvers showcase ────────────────────────────────────────────────────────
  {
    id: "honda-city-improvers",
    dealerName: "Honda City",
    name: "Improvers Summer Campaign",
    code: "WF72501_HNDCTY_ImpSummer_Jun26",
    status: "Approved" as ProjectStatus,
    dateRange: "Jun 1, 2026 - Jun 30, 2026",
    assignee: { name: "Jorge Verlindo", avatar: "" },
    oem: "Honda",
    templateIds: [
      "website-2000x500",
      "display-970x250",
      "display-300x250",
      "social-1080x1080",
      "website-600x450",
      "website-600x1067",
    ],
    offerIds: [
      "crv-trailsport",
      "hrv-sport",
      "crv-lx",
      "odyssey-exl",
      "civic-hybrid",
    ],
  },
];

export type Project = typeof projects[0];

// ─── Per-project helpers ──────────────────────────────────────────────────────

export function getProjectById(id: string): Project {
  return projects.find((p) => p.id === id) ?? projects[0];
}

export function getProjectTemplates(projectId: string): Template[] {
  const proj = getProjectById(projectId);
  return proj.templateIds
    .map((id) => templateLibrary.find((t) => t.id === id))
    .filter((t): t is Template => !!t);
}

export function getProjectOffers(projectId: string): Offer[] {
  const proj = getProjectById(projectId);
  return proj.offerIds
    .map((id) => offerLibrary.find((o) => o.id === id))
    .filter((o): o is Offer => !!o);
}

// ─── Static data (shared across all projects) ─────────────────────────────────

/** All possible tasks — used as a registry for ID lookups. */
export const taskRegistry = [
  { id: "offers",          label: "Offers",       count: 5,   href: "offers" },
  { id: "data",            label: "Data",                     href: "data" },
  { id: "templates",       label: "Templates",    count: 6,   href: "templates" },
  { id: "logos-backgrounds", label: "Styles",                 href: "logos-backgrounds" },
  { id: "preview",         label: "Preview",      count: 180, href: "preview" },
  { id: "assets",          label: "Assets",                   href: "assets" },
  { id: "ad-shells",       label: "Ad Shells",                href: "ad-shells" },
  { id: "pre-approval",    label: "Pre-Approval",             href: "pre-approval" },
  { id: "legal-review",    label: "Legal Review",             href: "legal-review" },
  { id: "campaigns",       label: "Campaigns",                href: "campaigns" },
];

/** Default task order for automotive projects (no Data task). */
export const tasks = taskRegistry.filter((t) =>
  ["offers", "templates", "logos-backgrounds", "preview", "assets", "ad-shells", "pre-approval", "legal-review", "campaigns"].includes(t.id)
);

// ─── Per-project overrides ────────────────────────────────────────────────────
// Use this to customize logo and task list per project without touching the
// shared Project type or adding optional fields to every project object.

export const PROJECT_OVERRIDES: Record<string, { logoUrl?: string; taskIds?: string[] }> = {
  "honda-city-improvers": {
    logoUrl: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071713/vw-funds/public/logos/Honda-Logo.png",
  },
  "spiriva-april2026": {
    logoUrl: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071714/vw-funds/public/logos/Spiriva.png",
    taskIds: [
      "data",
      "templates",
      "logos-backgrounds",
      "preview",
      "assets",
      "ad-shells",
      "pre-approval",
      "legal-review",
      "campaigns",
    ],
  },
};

/** Returns the ordered task list for a given project (falls back to global `tasks`). */
export function getProjectTasks(projectId: string): typeof tasks {
  const override = PROJECT_OVERRIDES[projectId];
  if (override?.taskIds) {
    return override.taskIds
      .map((id) => taskRegistry.find((t) => t.id === id))
      .filter((t): t is (typeof taskRegistry)[0] => !!t);
  }
  return tasks;
}

/** Returns the sidebar logo URL for a given project. */
export function getProjectLogoUrl(projectId: string): string {
  return PROJECT_OVERRIDES[projectId]?.logoUrl ?? "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071713/vw-funds/public/logos/Honda-Logo.png";
}

export type BrandKitLogo = {
  id: string;
  label: string;
  sublabel: string;
  image: string;
};

export type BrandKit = {
  id: string;
  name: string;
  oem: string;
  colors: string[];
  logos: BrandKitLogo[];
};

export const brandKits: BrandKit[] = [
  {
    id: "honda",
    name: "Honda",
    oem: "Honda",
    colors: ["#000000", "#CC0000"],
    logos: [
      { id: "primary-square-positive",  label: "Primary Square",     sublabel: "Positive",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071648/vw-funds/public/brand-kits/honda/primary-square-positive.png" },
      { id: "primary-square-positive2", label: "Primary Square",     sublabel: "Positive 2", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071649/vw-funds/public/brand-kits/honda/primary-square-positive2.png" },
      { id: "primary-square-negative",  label: "Primary Square",     sublabel: "Negative",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071647/vw-funds/public/brand-kits/honda/primary-square-negative.png" },
      { id: "event-square-positive",    label: "Event Square",       sublabel: "Positive",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071647/vw-funds/public/brand-kits/honda/event-square-positive.png" },
      { id: "event-square-negative",    label: "Event Square",       sublabel: "Negative",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071646/vw-funds/public/brand-kits/honda/event-square-negative.png" },
      { id: "event-horizontal-positive",  label: "Event Horizontal", sublabel: "Positive",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071641/vw-funds/public/brand-kits/honda/event-horizontal-positive.png" },
      { id: "event-horizontal-positive2", label: "Event Horizontal", sublabel: "Positive 2", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071642/vw-funds/public/brand-kits/honda/event-horizontal-positive2.png" },
      { id: "event-horizontal-positive3", label: "Event Horizontal", sublabel: "Positive 3", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071643/vw-funds/public/brand-kits/honda/event-horizontal-positive3.png" },
      { id: "event-horizontal-positive4", label: "Event Horizontal", sublabel: "Positive 4", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071644/vw-funds/public/brand-kits/honda/event-horizontal-positive4.png" },
      { id: "event-horizontal-positive5", label: "Event Horizontal", sublabel: "Positive 5", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071645/vw-funds/public/brand-kits/honda/event-horizontal-positive5.png" },
      { id: "event-horizontal-negative",  label: "Event Horizontal", sublabel: "Negative",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071639/vw-funds/public/brand-kits/honda/event-horizontal-negative.png" },
      { id: "event-horizontal-negative2", label: "Event Horizontal", sublabel: "Negative 2", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071640/vw-funds/public/brand-kits/honda/event-horizontal-negative2.png" },
    ],
  },
  {
    id: "bmw",
    name: "BMW",
    oem: "BMW",
    colors: ["#000000", "#1C69D4"],
    logos: [
      { id: "primary-square-positive", label: "Primary Square", sublabel: "Positive", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071638/vw-funds/public/brand-kits/bmw/primary-square-positive.png" },
      { id: "primary-square-negative", label: "Primary Square", sublabel: "Negative", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071638/vw-funds/public/brand-kits/bmw/primary-square-negative.png" },
    ],
  },
  {
    id: "spiriva",
    name: "Spiriva",
    oem: "Spiriva",
    colors: ["#000000", "#16a34a"],
    logos: [
      { id: "primary-logo", label: "Primary Logo", sublabel: "Main", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071714/vw-funds/public/logos/Spiriva.png" },
    ],
  },
  {
    id: "mercedes",
    name: "Mercedes-Benz",
    oem: "Mercedes-Benz",
    colors: ["#000000", "#000000"],
    logos: [
      { id: "primary-square-positive",   label: "Primary Square",    sublabel: "Positive", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071651/vw-funds/public/brand-kits/mercedes/primary-square-positive.png" },
      { id: "primary-square-negative",   label: "Primary Square",    sublabel: "Negative", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071651/vw-funds/public/brand-kits/mercedes/primary-square-negative.png" },
      { id: "event-square-negative",     label: "Event Square",      sublabel: "Negative", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071650/vw-funds/public/brand-kits/mercedes/event-square-negative.png" },
      { id: "event-horizontal-negative", label: "Event Horizontal",  sublabel: "Negative", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071649/vw-funds/public/brand-kits/mercedes/event-horizontal-negative.png" },
    ],
  },
];

export const backgroundCollections = [
  {
    id: "dirt-road",
    name: "Dirt Road",
    type: "Background Collection",
    sizes: 6,
    folder: "Background Collections",
    color: "#c8a86b",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071536/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Display_300x250_1.png",
    images: {
      "website-2000x500": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071542/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Website_2000x500_1.png",
      "display-970x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071539/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Display_970x250_1.png",
      "display-300x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071536/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Display_300x250_1.png",
      "social-1080x1080": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071540/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Social_1080x1080_1.png",
      "website-600x450":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071544/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Website_600x540_1.png",
      "website-600x1067": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071543/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Website_600x1067_1.png",
    },
  },
  {
    id: "gold-flare",
    name: "Gold Flare",
    type: "Background Collection",
    sizes: 6,
    folder: "Background Collections",
    color: "#e8a020",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071581/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Display_300x250_1.png",
    images: {
      "website-2000x500": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071586/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Website_2000x500_1.png",
      "display-970x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071584/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Display_970x250_1.png",
      "display-300x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071581/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Display_300x250_1.png",
      "social-1080x1080": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071585/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Social_1080x1080_1.png",
      "website-600x450":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071588/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Website_600x540_1.png",
      "website-600x1067": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071587/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Website_600x1067_1.png",
    },
  },
  {
    id: "purple-city",
    name: "Purple City",
    type: "Background Collection",
    sizes: 6,
    folder: "Background Collections",
    color: "#7060a0",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071599/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Display_300x250_1.png",
    images: {
      "website-2000x500": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071607/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Website_2000x500_1.png",
      "display-970x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071602/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Display_970x250_1.png",
      "display-300x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071599/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Display_300x250_1.png",
      "social-1080x1080": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071603/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Social_1080x1080_1.png",
      "website-600x450":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071609/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Website_600x450_1.png",
      "website-600x1067": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071608/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Website_600x1067_1.png",
    },
  },
  {
    id: "snow-house",
    name: "Snow House",
    type: "Background Collection",
    sizes: 6,
    folder: "Background Collections",
    color: "#b8cce0",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071611/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Display_300x250_1.png",
    images: {
      "website-2000x500": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071619/vw-funds/public/backgrounds/Snow-House-HO_251120_3_Website_2000x500_1.png",
      "display-970x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071613/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Display_970x250_1.png",
      "display-300x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071611/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Display_300x250_1.png",
      "social-1080x1080": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071615/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Social_1080x1080_1.png",
      "website-600x450":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071618/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Website_600x540_1.png",
      "website-600x1067": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071617/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Website_600x1067_1.png",
    },
  },
  ...lifestyleImages,
  ...generatedBackgroundCollections,
];

// ─── Backward-compat aliases ──────────────────────────────────────────────────
// Pages that haven't been updated yet can keep importing these.
// Gradually migrate each page to use getProjectTemplates/getProjectOffers.

export const project = projects[0];
export const offers = offerLibrary;
export const templates = getProjectTemplates("honda-demo");
