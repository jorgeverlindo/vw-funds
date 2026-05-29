/**
 * Mock VehicleGroup data for the first 4 AI Config records.
 * Angles are pre-populated with null (→ default placeholder images will be used)
 * unless specific images have been provided for a vehicle group.
 */

import type { VehicleGroup } from './types';

const vehicleRaptor = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071266/vw-funds/inventory/vehicles/vehicle-raptor-700r.png';
const vehicleGrizzly = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071264/vw-funds/inventory/vehicles/vehicle-grizzly-700.png';
const vehicleKodiak = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071265/vw-funds/inventory/vehicles/vehicle-kodiak-450.png';
const vehicleYfz = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071267/vw-funds/inventory/vehicles/vehicle-yfz450r.png';
// ─── Config 2 / vg2-1 — TW200T moto: generated (urban background) ────────────
const motoFront = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071260/vw-funds/inventory/vehicles/Moto/tmprv4lhply.jpg';
const motoRear = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071257/vw-funds/inventory/vehicles/Moto/tmp1ts9anhr.jpg';
const moto34R = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071259/vw-funds/inventory/vehicles/Moto/tmpkdcwhe7g.jpg';
const motoRight = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071258/vw-funds/inventory/vehicles/Moto/tmp4xdrgwjh.jpg';
const moto34L = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071261/vw-funds/inventory/vehicles/Moto/tmpwi0rykgt.jpg';
const motoLeft = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071263/vw-funds/inventory/vehicles/Moto/tmpyi8d77_m.jpg';
// ─── Config 2 / vg2-1 — TW200T moto: source cutouts (no background) ──────────
const motoSrc34L = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071254/vw-funds/inventory/vehicles/Moto/11_2026_TW200T2_MLNM4_US_06_YY_11_RGB_1_3_4_L.png';
const motoSrcFront = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071249/vw-funds/inventory/vehicles/Moto/11_2026_TW200T2_MLNM4_US_01_YY_07_RGB_-_Front.png';
const motoSrc34R = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071252/vw-funds/inventory/vehicles/Moto/11_2026_TW200T2_MLNM4_US_04_YY_09_RGB_1_3_4_R.png';
const motoSrcRight = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071251/vw-funds/inventory/vehicles/Moto/11_2026_TW200T2_MLNM4_US_03_YY_08_RGB_1_-_Right.png';
const motoSrcRear = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071253/vw-funds/inventory/vehicles/Moto/11_2026_TW200T2_MLNM4_US_05_YY_10_RGB_1_Rear.png';
const motoSrcLeft = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071254/vw-funds/inventory/vehicles/Moto/11_2026_TW200T2_MLNM4_US_07_YY_12_RGB_1_Left.png';
// Thumbnail: use the 3/4 L cutout (no background) — clean for small sizes
const motoThumb = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071254/vw-funds/inventory/vehicles/Moto/11_2026_TW200T2_MLNM4_US_06_YY_11_RGB_1_3_4_L.png';
// Convenience: all-null angles record
const NULL_ANGLES: Record<string, null> = {
  '34l': null,
  'front': null,
  '34r': null,
  'right': null,
  'rear': null,
  'left': null,
};

// ─── Config 1 — January_05_final ─────────────────────────────────────────────
export const VEHICLE_GROUPS_1: VehicleGroup[] = [
  {
    id: 'vg1-1',
    year: 2024,
    make: 'Yamaha',
    model: 'Raptor 700R',
    trim: 'SE',
    color: 'Bluish Blue',
    vin: 'JY4AM03RNRA001247',
    source: 'OEM Assets',
    thumbnail: vehicleRaptor,
    status: 'Active',
    angles: { ...NULL_ANGLES } as VehicleGroup['angles'],
  },
  {
    id: 'vg1-2',
    year: 2024,
    make: 'Yamaha',
    model: 'Raptor 700R',
    trim: 'SE',
    color: 'Bluish Gray',
    vin: 'JY4AM03RNRA004583',
    source: 'OEM Assets',
    thumbnail: vehicleRaptor,
    status: 'Active',
    angles: { ...NULL_ANGLES } as VehicleGroup['angles'],
  },
];

// ─── Config 2 — March_20_correction ──────────────────────────────────────────
export const VEHICLE_GROUPS_2: VehicleGroup[] = [
  {
    id: 'vg2-1',
    year: 2026,
    make: 'Yamaha',
    model: 'TW200T',
    trim: 'Base',
    color: 'Matte Light Gray Metallic',
    vin: 'JY4AM03RNRA007812',
    source: 'OEM Assets',
    thumbnail: motoThumb,
    status: 'Active',
    // Generated — motorcycle in urban environment (AI background applied)
    angles: {
      '34l':  moto34L,
      'front': motoFront,
      '34r':  moto34R,
      'right': motoRight,
      'rear':  motoRear,
      'left':  motoLeft,
    },
    // Source — clean cutouts without background
    sourceAngles: {
      '34l':  motoSrc34L,
      'front': motoSrcFront,
      '34r':  motoSrc34R,
      'right': motoSrcRight,
      'rear':  motoSrcRear,
      'left':  motoSrcLeft,
    },
  },
  {
    id: 'vg2-2',
    year: 2024,
    make: 'Yamaha',
    model: 'Grizzly 700 EPS',
    trim: 'XT-R',
    color: 'Bluish White Pearl',
    vin: 'JY4AH08RNRA002891',
    source: 'OEM Assets',
    thumbnail: vehicleGrizzly,
    status: 'Active',
    angles: { ...NULL_ANGLES } as VehicleGroup['angles'],
  },
  {
    id: 'vg2-3',
    year: 2024,
    make: 'Yamaha',
    model: 'Grizzly 700 EPS',
    trim: 'XT-R',
    color: 'Dark Grayish Leaf Green',
    vin: 'JY4AH08RNRA003712',
    source: 'Stock Images',
    thumbnail: vehicleGrizzly,
    status: 'Inactive',
    angles: { ...NULL_ANGLES } as VehicleGroup['angles'],
  },
];

// ─── Config 3 — April_08_final ────────────────────────────────────────────────
export const VEHICLE_GROUPS_3: VehicleGroup[] = [
  {
    id: 'vg3-1',
    year: 2024,
    make: 'Yamaha',
    model: 'Grizzly 700 EPS',
    trim: 'XT-R',
    color: 'Dark Purplish Blue Metallic',
    vin: 'JY4AH08RNRA005674',
    source: 'OEM Assets',
    thumbnail: vehicleGrizzly,
    status: 'Active',
    angles: { ...NULL_ANGLES } as VehicleGroup['angles'],
  },
  {
    id: 'vg3-2',
    year: 2024,
    make: 'Yamaha',
    model: 'Kodiak 450 EPS',
    trim: 'Base',
    color: 'Dark Yellowish Gray',
    vin: 'JY4AK45RNRA008921',
    source: 'Stock Images',
    thumbnail: vehicleKodiak,
    status: 'Inactive',
    angles: { ...NULL_ANGLES } as VehicleGroup['angles'],
  },
];

// ─── Config 4 — 13_extra ─────────────────────────────────────────────────────
export const VEHICLE_GROUPS_4: VehicleGroup[] = [
  {
    id: 'vg4-1',
    year: 2023,
    make: 'Yamaha',
    model: 'YFZ450R',
    trim: 'SE',
    color: 'Dark Purplish Blue Solid',
    vin: 'JY4AY45XPRA007634',
    source: 'OEM Assets',
    thumbnail: vehicleYfz,
    status: 'Active',
    angles: { ...NULL_ANGLES } as VehicleGroup['angles'],
  },
  {
    id: 'vg4-2',
    year: 2023,
    make: 'Yamaha',
    model: 'YFZ450R',
    trim: 'SE',
    color: 'Vivid Purplish Blue',
    vin: 'JY4AY45XPRA009102',
    source: 'OEM Assets',
    thumbnail: vehicleYfz,
    status: 'Active',
    angles: { ...NULL_ANGLES } as VehicleGroup['angles'],
  },
  {
    id: 'vg4-3',
    year: 2023,
    make: 'Yamaha',
    model: 'Wolverine RMAX 1000',
    trim: 'Limited',
    color: 'Dark Bluish Gray',
    vin: 'JY4AW10XPRA002567',
    source: 'Stock Images',
    thumbnail: vehicleRaptor,
    status: 'Inactive',
    angles: { ...NULL_ANGLES } as VehicleGroup['angles'],
  },
  {
    id: 'vg4-4',
    year: 2023,
    make: 'Yamaha',
    model: 'Wolverine RMAX 1000',
    trim: 'Base',
    color: 'Dark Purplish Blue',
    vin: 'JY4AW10XPRA004890',
    source: 'Stock Images',
    thumbnail: vehicleRaptor,
    status: 'Inactive',
    angles: { ...NULL_ANGLES } as VehicleGroup['angles'],
  },
];
