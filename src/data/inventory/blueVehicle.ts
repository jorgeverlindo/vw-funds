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
import src34L   from '../../assets/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_06_YY_11_RGB 1.png'; // 3/4 Left
import srcFront from '../../assets/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_01_YY_07_RGB 1.png'; // Front
import src34R   from '../../assets/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_04_YY_09_RGB 1.png'; // 3/4 Right
import srcRight from '../../assets/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_03_YY_08_RGB 1.png'; // Right (_03_)
import srcLeft  from '../../assets/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_07_YY_12_RGB 1.png'; // Left
import srcRear  from '../../assets/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_05_YY_10_RGB 1.png'; // Rear (_05_)

// Generated composite images (with background) — keyed by confirmed visual angle
import gen34L   from '../../assets/inventory/vehicles/Blue/tmp2coklyh1.JPG';  // 3/4 Left  (confirmed first)
import genFront from '../../assets/inventory/vehicles/Blue/tmpvd_o8zbd.JPG';  // Front
import gen34R   from '../../assets/inventory/vehicles/Blue/tmpyg1cshq6.JPG';  // 3/4 Right
import genRight from '../../assets/inventory/vehicles/Blue/tmpu0wusk2o.JPG';  // Right (corrected)
import genLeft  from '../../assets/inventory/vehicles/Blue/tmpfm5pqrl6.JPG';  // Left  (corrected)
import genRear  from '../../assets/inventory/vehicles/Blue/tmp49gm0km_.JPG';  // Rear

// Background image uploaded for demo
import blueBg from '../../assets/inventory/vehicles/Blue/tmpnytbck9c.png';

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
