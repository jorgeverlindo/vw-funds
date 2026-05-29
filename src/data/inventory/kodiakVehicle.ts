// ─── Kodiak 450 Demo Vehicle ──────────────────────────────────────────────────
// Source cutout images for the 2026 Yamaha Kodiak 450 demo vehicle.
// Used in two ways:
//   1. Preview panel — shows the vehicle cutouts while the user configures the config
//   2. Flux Kontext generation — each angle's cutout is passed as inputImage so
//      Flux composites the vehicle into the generated background scene.
//
// Yamaha angle numbering (same convention as Blue vehicle):
//   _01_ = Front     _03_ = (driver's right = viewer's left)     _04_ = 3/4 Right
//   _05_ = Rear      _06_ = 3/4 Left  _07_ = (driver's left = viewer's right)
//
// NOTE: Yamaha uses driver-perspective naming. The app uses viewer-perspective.
//   App "Right" = viewer's right = Yamaha _07_  |  App "Left" = viewer's left = Yamaha _03_
//
// App angle order: [34l=0, front=1, 34r=2, right=3, left=4, rear=5]

import type { VehicleGroup } from './types';

// Source cutout images (PNG, neutral/white background) — one per angle
const src34L = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071246/vw-funds/inventory/vehicles/Kodiak_450/72_2025_YFM45KPHSF_DNYS1_US_06_YY_11_RGB_1.png';
const srcFront = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071240/vw-funds/inventory/vehicles/Kodiak_450/72_2025_YFM45KPHSF_DNYS1_US_01_YY_07_RGB_1.png';
const src34R = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071243/vw-funds/inventory/vehicles/Kodiak_450/72_2025_YFM45KPHSF_DNYS1_US_04_YY_09_RGB_1.png';
// Convention: "Right" chip = vehicle heading right = LEFT panel visible = Yamaha _03_
//             "Left"  chip = vehicle heading left  = RIGHT panel visible = Yamaha _07_
const srcRight = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071242/vw-funds/inventory/vehicles/Kodiak_450/72_2025_YFM45KPHSF_DNYS1_US_03_YY_08_RGB_1.png';
const srcLeft = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071248/vw-funds/inventory/vehicles/Kodiak_450/72_2025_YFM45KPHSF_DNYS1_US_07_YY_12_RGB_1.png';
const srcRear = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071245/vw-funds/inventory/vehicles/Kodiak_450/72_2025_YFM45KPHSF_DNYS1_US_05_YY_10_RGB_1.png';

/**
 * Source cutout images ordered [34l, front, 34r, right, left, rear].
 * These are the vehicle-only PNGs used as:
 *   - Preview thumbnails in the angle bar
 *   - Per-angle inputImage sent to Flux Kontext for background compositing
 */
export const KODIAK_SOURCE_ANGLES: string[] = [
  src34L, srcFront, src34R, srcRight, srcLeft, srcRear,
];

/** VIN metadata for the 2026 Kodiak 450 demo vehicle */
export const KODIAK_VIN_META = {
  vin:   'JY4AK05XRRA010001',
  year:  2026,
  make:  'Yamaha',
  model: 'Kodiak 450',
  trim:  'EPS',
  color: 'Dark Grayish Yellow Solid',
} as const;

/**
 * Pre-built VehicleGroup for the Kodiak 450 demo vehicle.
 * sourceAngles are the vehicle cutouts; angles will be populated after
 * Flux Kontext generation completes.
 */
export const KODIAK_VEHICLE_GROUP: VehicleGroup = {
  id:        'kodiak-demo-vg1',
  year:      KODIAK_VIN_META.year,
  make:      KODIAK_VIN_META.make,
  model:     KODIAK_VIN_META.model,
  trim:      KODIAK_VIN_META.trim,
  color:     KODIAK_VIN_META.color,
  vin:       KODIAK_VIN_META.vin,
  source:    'Global AI Config',
  thumbnail: src34L,
  status:    'Active',
  // Generated composites filled in at runtime after Flux completes
  angles: {
    '34l':   src34L,
    'front': srcFront,
    '34r':   src34R,
    'right': srcRight,
    'left':  srcLeft,
    'rear':  srcRear,
  },
  sourceAngles: {
    '34l':   src34L,
    'front': srcFront,
    '34r':   src34R,
    'right': srcRight,
    'left':  srcLeft,
    'rear':  srcRear,
  },
};
