import type { BackgroundCollection } from "@projects/logos-backgrounds/BackgroundCollectionCard";

// ─── Vehicle tag → offer model+trim fragments to match against ────────────────
// Each entry lists substrings checked against the normalized "model trim" string
// of an offer. Using trim-specific tags (e.g. "CRV-Trailsport") ensures lifestyle
// images are matched only to the correct variant.

const VEHICLE_TAG_MODELS: Record<string, string[]> = {
  // CR-V variants
  "CRV-Trailsport": ["CR-V TrailSport"],
  "CRV-LX":         ["CR-V LX"],
  // Generic (matches any CR-V, useful if no trim specificity needed)
  CRV:              ["CR-V"],
  // Other models
  HRV:              ["HR-V"],
  Civic:            ["Civic Sport", "Civic"],
};

const norm = (s: string) => s.toLowerCase().replace(/[-\s]/g, "");

/**
 * Returns true when a single-vehicle lifestyle background is compatible with a given offer.
 * Accepts the offer's model and (optionally) its trim for trim-specific matching.
 * Non-lifestyle backgrounds (or multi-vehicle lifestyle images) always return true.
 */
export function matchesLifestyle(
  bg: BackgroundCollection,
  offerModel: string,
  offerTrim?: string
): boolean {
  if (!bg.isLifestyle || !bg.vehicleTag) return true;
  const models = VEHICLE_TAG_MODELS[bg.vehicleTag] ?? [];
  // Build the full normalized string (model + trim when available)
  const offerFull = norm(offerTrim ? `${offerModel} ${offerTrim}` : offerModel);
  return models.some((m) => {
    const mNorm = norm(m);
    return offerFull.includes(mNorm) || mNorm.includes(offerFull);
  });
}

/**
 * Returns true when a multi-vehicle lifestyle background matches a set of combo slot offers.
 * Every vehicleTag in bg.vehicleTags must be matched by at least one offer in vehicleFilters.
 * vehicleFilters is an array of "model trim" strings (e.g. ["CR-V TrailSport AWD", "HR-V Sport 2WD"]).
 */
export function matchesMultiLifestyle(
  bg: BackgroundCollection,
  vehicleFilters: string[]
): boolean {
  if (!bg.isLifestyle || !bg.vehicleTags?.length) return false;
  return bg.vehicleTags.every((tag) => {
    const models = VEHICLE_TAG_MODELS[tag] ?? [];
    return vehicleFilters.some((vf) => {
      const vfNorm = norm(vf);
      return models.some((m) => {
        const mNorm = norm(m);
        return vfNorm.includes(mNorm) || mNorm.includes(vfNorm);
      });
    });
  });
}

/**
 * Reverse-lookup: given a model + optional trim string (from AI detection),
 * returns the best matching vehicleTag key, or null if no match found.
 */
export function suggestVehicleTag(model: string, trim?: string | null): string | null {
  const query = norm(trim ? `${model} ${trim}` : model);
  // Try most specific (longest) matches first to prefer trim-specific tags
  const entries = Object.entries(VEHICLE_TAG_MODELS).sort(
    (a, b) => b[1].join("").length - a[1].join("").length
  );
  for (const [tag, models] of entries) {
    for (const m of models) {
      const mNorm = norm(m);
      if (query.includes(mNorm) || mNorm.includes(query)) return tag;
    }
  }
  return null;
}

// ─── Lifestyle image definitions ──────────────────────────────────────────────
// Each file is a standalone background — one size, one vehicle/trim.

export const lifestyleImages: BackgroundCollection[] = [
  // ── CR-V TrailSport ──
  {
    id: "lifestyle-crv-trailsport-2000x500",
    name: "CR-V TrailSport — 2000×500",
    type: "Lifestyle",
    isLifestyle: true,
    vehicleTag: "CRV-Trailsport",
    sizes: 1,
    folder: "Lifestyle Images",
    color: "#6b7a8d",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071501/vw-funds/public/backgrounds/2000x500-CRV-Trailsport.png",
    images: { "website-2000x500": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071501/vw-funds/public/backgrounds/2000x500-CRV-Trailsport.png" },
  },
  {
    id: "lifestyle-crv-trailsport-600x450",
    name: "CR-V TrailSport — 600×450",
    type: "Lifestyle",
    isLifestyle: true,
    vehicleTag: "CRV-Trailsport",
    sizes: 1,
    folder: "Lifestyle Images",
    color: "#6b7a8d",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071503/vw-funds/public/backgrounds/600x450-CRV-Trailsport.png",
    images: { "website-600x450": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071503/vw-funds/public/backgrounds/600x450-CRV-Trailsport.png" },
  },

  // ── CR-V LX ──
  {
    id: "lifestyle-crv-lx-300x250",
    name: "CR-V LX — 300×250",
    type: "Lifestyle",
    isLifestyle: true,
    vehicleTag: "CRV-LX",
    sizes: 1,
    folder: "Lifestyle Images",
    color: "#6b7a8d",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071502/vw-funds/public/backgrounds/300x250-CRV-LX.png",
    images: { "display-300x250": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071502/vw-funds/public/backgrounds/300x250-CRV-LX.png" },
  },

  // ── Civic ──
  {
    id: "lifestyle-civic-600x450",
    name: "Civic — 600×450",
    type: "Lifestyle",
    isLifestyle: true,
    vehicleTag: "Civic",
    sizes: 1,
    folder: "Lifestyle Images",
    color: "#5a6a7a",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071504/vw-funds/public/backgrounds/600x450-Civic.png",
    images: { "website-600x450": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071504/vw-funds/public/backgrounds/600x450-Civic.png" },
  },

  // ── CR-V TrailSport + HR-V + CR-V LX (multi-vehicle, 3-up template) ──
  {
    id: "lifestyle-multi-crv-ts-hrv-crv-lx-1969x1080",
    name: "CR-V TrailSport + HR-V + CR-V LX — 1969×1080",
    type: "Lifestyle",
    isLifestyle: true,
    vehicleTags: ["CRV-Trailsport", "HRV", "CRV-LX"],
    sizes: 1,
    folder: "Lifestyle Images",
    color: "#6b7a8d",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071500/vw-funds/public/backgrounds/1969x1080-CRV-Trailsport-HRV-CRV-LX.png",
    images: { "website-1969x1080-3prod": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071500/vw-funds/public/backgrounds/1969x1080-CRV-Trailsport-HRV-CRV-LX.png" },
  },

  // ── HR-V ──
  {
    id: "lifestyle-hrv-600x450-1",
    name: "HR-V — 600×450 #1",
    type: "Lifestyle",
    isLifestyle: true,
    vehicleTag: "HRV",
    sizes: 1,
    folder: "Lifestyle Images",
    color: "#7a8a6b",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071505/vw-funds/public/backgrounds/600x450-HRV-1.png",
    images: { "website-600x450": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071505/vw-funds/public/backgrounds/600x450-HRV-1.png" },
  },
  {
    id: "lifestyle-hrv-600x450-2",
    name: "HR-V — 600×450 #2",
    type: "Lifestyle",
    isLifestyle: true,
    vehicleTag: "HRV",
    sizes: 1,
    folder: "Lifestyle Images",
    color: "#7a8a6b",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071506/vw-funds/public/backgrounds/600x450-HRV-2.png",
    images: { "website-600x450": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071506/vw-funds/public/backgrounds/600x450-HRV-2.png" },
  },
  {
    id: "lifestyle-hrv-600x450-3",
    name: "HR-V — 600×450 #3",
    type: "Lifestyle",
    isLifestyle: true,
    vehicleTag: "HRV",
    sizes: 1,
    folder: "Lifestyle Images",
    color: "#7a8a6b",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071507/vw-funds/public/backgrounds/600x450-HRV-3.png",
    images: { "website-600x450": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071507/vw-funds/public/backgrounds/600x450-HRV-3.png" },
  },
  {
    id: "lifestyle-hrv-600x450-4",
    name: "HR-V — 600×450 #4",
    type: "Lifestyle",
    isLifestyle: true,
    vehicleTag: "HRV",
    sizes: 1,
    folder: "Lifestyle Images",
    color: "#7a8a6b",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071508/vw-funds/public/backgrounds/600x450-HRV-4.png",
    images: { "website-600x450": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071508/vw-funds/public/backgrounds/600x450-HRV-4.png" },
  },
];
