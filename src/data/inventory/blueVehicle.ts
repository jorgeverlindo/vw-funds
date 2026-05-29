// ─── Blue Demo Vehicle ────────────────────────────────────────────────────────
// Hardcoded assets for the Global AI Config prototype demo.
// These are always used regardless of which VIN is selected from the filter.
//
// Yamaha angle numbering convention:
//   _01_ = Front     _03_ = right panel visible (vehicle faces left)   _04_ = 3/4 Right
//   _05_ = Rear      _06_ = 3/4 Left  _07_ = left panel visible (vehicle faces right)
//
// Generated JPG mapping (corrected — Right/Left were visually swapped):
//   tmp2coklyh1 = 3/4 Left   tmpvd_o8zbd = Front    tmpyg1cshq6 = 3/4 Right
//   tmpu0wusk2o = Right       tmpfm5pqrl6 = Left      tmp49gm0km_ = Rear
//
// App angle order: [34l=0, front=1, 34r=2, right=3, left=4, rear=5]

import type { VehicleGroup } from './types';

// Source cutout images (no background) — keyed by confirmed visual angle
const src34L = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071228/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_06_YY_11_RGB_1.png';
const srcFront = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071221/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_01_YY_07_RGB_1.png';
const src34R = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071224/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_04_YY_09_RGB_1.png';
const srcRight = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071223/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_03_YY_08_RGB_1.png';
const srcLeft = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071230/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_07_YY_12_RGB_1.png';
const srcRear = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071227/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_05_YY_10_RGB_1.png';

// Generated composite images (with background) — keyed by confirmed visual angle
const gen34L = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071231/vw-funds/inventory/vehicles/Blue/tmp2coklyh1.jpg';
const genFront = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071238/vw-funds/inventory/vehicles/Blue/tmpvd_o8zbd.jpg';
const gen34R = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071239/vw-funds/inventory/vehicles/Blue/tmpyg1cshq6.jpg';
const genRight = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071238/vw-funds/inventory/vehicles/Blue/tmpu0wusk2o.jpg';
const genLeft = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071233/vw-funds/inventory/vehicles/Blue/tmpfm5pqrl6.jpg';
const genRear = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071232/vw-funds/inventory/vehicles/Blue/tmp49gm0km_.jpg';

// Background image uploaded for demo
const blueBg = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071236/vw-funds/inventory/vehicles/Blue/tmpnytbck9c.png';
/** Source cutout images ordered [34l, front, 34r, right, left, rear] */
export const BLUE_SOURCE_ANGLES: string[] = [
  src34L, srcFront, src34R, srcRight, srcLeft, srcRear,
];

/** Generated composite images (with background) ordered [34l, front, 34r, right, left, rear] */
export const BLUE_GEN_ANGLES: string[] = [
  gen34L, genFront, gen34R, genRight, genLeft, genRear,
];

/** Thumbnail used in the DataGrid after Save — jelly bean 3/4 Left cutout */
export const BLUE_THUMBNAIL = src34L;

/** Demo background reference (shown in UploadBlock thumbnail after upload) */
export const BLUE_BG_REFERENCE = blueBg;

/** VIN metadata for the demo vehicle */
export const BLUE_VIN_META = {
  vin:   'JY4AM03XRRA012826',
  year:  2026,
  make:  'Yamaha',
  model: 'Raptor 700R',
  trim:  'SE (Special Edition)',
  color: 'Dynamic Purplish Blue SE',
} as const;

/** Pre-built VehicleGroup for the Blue demo vehicle.
 *  Used in AIConfigRecord.vehicleGroups so the DataGrid expand row
 *  shows the 6 generated angles + 6 source cutouts. */
export const BLUE_VEHICLE_GROUP: VehicleGroup = {
  id:        'blue-demo-vg1',
  year:      BLUE_VIN_META.year,
  make:      BLUE_VIN_META.make,
  model:     BLUE_VIN_META.model,
  trim:      BLUE_VIN_META.trim,
  color:     BLUE_VIN_META.color,
  vin:       BLUE_VIN_META.vin,
  source:    'Global AI Config',
  thumbnail: src34L,   // jelly-bean 3/4 L cutout — same as BLUE_THUMBNAIL
  status:    'Active',
  // Generated composites (with background) — keyed by AngleKey
  angles: {
    '34l':   gen34L,
    'front': genFront,
    '34r':   gen34R,
    'right': genRight,
    'left':  genLeft,
    'rear':  genRear,
  },
  // Source cutouts (no background) — keyed by AngleKey
  sourceAngles: {
    '34l':   src34L,
    'front': srcFront,
    '34r':   src34R,
    'right': srcRight,
    'left':  srcLeft,
    'rear':  srcRear,
  },
};
