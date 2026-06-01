// ─── Vehicle Inventory VIN List data ────────────────────────────────────────
// Mock data for the RideNow Inventory > Vehicles tab.
// Mirrors the rows visible in Figma node 3556:990943.
//
// vin-01 & vin-02  → original records with generated AI images (VehicleGroup)
// vin-03 – vin-05  → 3 specific VINs requested by user
// vin-06 – vin-55  → Yamaha 2025/2026 lineup from jellybean export CSV
//                    thumbnails served from /inventory/jellybeans/<model>/

const raptorThumb = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071266/vw-funds/inventory/vehicles/vehicle-raptor-700r.png';
const grizzlyThumb = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071264/vw-funds/inventory/vehicles/vehicle-grizzly-700.png';
const kodiakThumb = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071246/vw-funds/inventory/vehicles/Kodiak_450/72_2025_YFM45KPHSF_DNYS1_US_06_YY_11_RGB_1.png';
const yfzThumb = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071267/vw-funds/inventory/vehicles/vehicle-yfz450r.png';
const motoThumb = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071251/vw-funds/inventory/vehicles/Moto/11_2026_TW200T2_MLNM4_US_03_YY_08_RGB_1_-_Right.png';
import type { VehicleGroup } from './types';
import { BLUE_VEHICLE_GROUP }  from './blueVehicle';
import { VEHICLE_GROUPS_2 }    from './vehicleGroups';
import { KODIAK_VEHICLE_GROUP } from './kodiakVehicle';

export type PriceToMarket = 'well-above' | 'above' | 'close' | 'below' | 'well-below';
export type AIGenerationStatus = 'enabled' | 'disabled';
export type SyndicationStatus  = 'syndicated' | 'not-syndicated';

export interface VinInventoryRecord {
  id:             string;
  vin:            string;
  condition:      'New' | 'Used';
  year:           number;
  make:           string;
  model:          string;
  trim:           string;
  price:          number;
  /** Whether AI Generation is enabled for this VIN */
  aiGeneration:   AIGenerationStatus;
  /** True when an AI Config has been applied — shows badge on thumbnail + hero image */
  aiConfigApplied: boolean;
  /** ID of the AIConfigRecord applied to this VIN (from AI_CONFIGS) */
  aiConfigId?: string;
  /**
   * VehicleGroup with generated & source angle images.
   * When present and aiConfigApplied=true, the grid shows the hero angle
   * (angles['34l']) as the thumbnail instead of the plain vehicle photo.
   */
  vehicleGroup?: VehicleGroup;
  syndication:    SyndicationStatus;
  exteriorColor:  string;
  vehicleStatus:  'On the lot' | 'In Transit';
  /** Days on lot */
  dol:            number;
  priceToMarket:  PriceToMarket;
  /** 1–7 → Maximize / Increase / Boost / Maintain / Decrease / Minimize / Cease */
  priorityScore:  number;
  thumbnail:      string;
}

// ─── Jellybean thumbnail helper ───────────────────────────────────────────────
// Images are hosted on Cloudinary under vw-funds/public/inventory/jellybeans/
function jb(model: string, uuid: string): string {
  return `https://res.cloudinary.com/dvq75cqna/image/upload/vw-funds/public/inventory/jellybeans/${model}/jellybean-${uuid}.png`;
}

export const VEHICLE_INVENTORY: VinInventoryRecord[] = [

  // ── vin-01: TW200T — AI-generated angles ──────────────────────────────────
  {
    id: 'vin-01', vin: 'WBA8D9C50JK678112',
    condition: 'Used', year: 2026, make: 'Yamaha', model: 'TW200T', trim: 'Base',
    price: 4899, aiGeneration: 'enabled', aiConfigApplied: true,
    aiConfigId: '2',
    vehicleGroup: VEHICLE_GROUPS_2[0],
    syndication: 'syndicated',    exteriorColor: 'Matte Light Gray Metallic',
    vehicleStatus: 'On the lot',  dol: 35, priceToMarket: 'well-above', priorityScore: 4,
    thumbnail: motoThumb,
  },

  // ── vin-02: Raptor 700R SE — Blue AI angles ────────────────────────────────
  {
    id: 'vin-02', vin: '5Y4AM4HL3PJ002817',
    condition: 'New',  year: 2023, make: 'Yamaha', model: 'Raptor', trim: '700R SE',
    price: 10599, aiGeneration: 'enabled', aiConfigApplied: true,
    aiConfigId: '1',
    vehicleGroup: BLUE_VEHICLE_GROUP,
    syndication: 'syndicated',    exteriorColor: 'Acid Green',
    vehicleStatus: 'In Transit',  dol: 60, priceToMarket: 'above',      priorityScore: 5,
    thumbnail: raptorThumb,
  },

  // ── vin-03 – vin-05: 3 specific VINs (user-requested) ─────────────────────
  {
    id: 'vin-03', vin: 'JY4AY45XPRA007634',
    condition: 'New',  year: 2024, make: 'Yamaha', model: 'YFZ450R', trim: 'SE',
    price: 10999, aiGeneration: 'enabled', aiConfigApplied: true,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'In Transit',  dol: 20, priceToMarket: 'above',      priorityScore: 5,
    thumbnail: yfzThumb,
  },
  {
    id: 'vin-04', vin: 'JY4AW10XPRA002567',
    condition: 'New',  year: 2024, make: 'Yamaha', model: 'Wolverine', trim: 'RMAX4 1000 Ltd',
    price: 19999, aiGeneration: 'enabled', aiConfigApplied: false,
    vehicleGroup: { ...KODIAK_VEHICLE_GROUP, id: 'kodiak-vg-04', vin: 'JY4AW10XPRA002567' },
    syndication: 'syndicated',    exteriorColor: 'Dark Bluish Gray',
    vehicleStatus: 'In Transit',  dol: 10, priceToMarket: 'below',      priorityScore: 6,
    thumbnail: kodiakThumb,
  },
  {
    id: 'vin-05', vin: 'JY4AM03RNRA019034',
    condition: 'New',  year: 2024, make: 'Yamaha', model: 'Raptor', trim: '700R SE',
    price: 9499, aiGeneration: 'enabled', aiConfigApplied: true,
    syndication: 'syndicated',    exteriorColor: 'Dark Gray Metallic',
    vehicleStatus: 'In Transit',  dol: 35, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: raptorThumb,
  },

  // ── vin-06 – vin-10: Kodiak 450 (needed for AI Config flows) ────────────────
  {
    id: 'vin-06', vin: 'JY4AK05RNRA003782',
    condition: 'New',  year: 2024, make: 'Yamaha', model: 'Kodiak 450', trim: 'EPS',
    price: 8999, aiGeneration: 'disabled', aiConfigApplied: false,
    vehicleGroup: { ...KODIAK_VEHICLE_GROUP, id: 'kodiak-vg-06', vin: 'JY4AK05RNRA003782' },
    syndication: 'not-syndicated', exteriorColor: 'Dark Yellowish Gray Metallic',
    vehicleStatus: 'On the lot',  dol: 80, priceToMarket: 'well-above', priorityScore: 2,
    thumbnail: kodiakThumb,
  },
  {
    id: 'vin-07', vin: 'JY4AK05RNRA006543',
    condition: 'Used', year: 2023, make: 'Yamaha', model: 'Kodiak 450', trim: 'EPS',
    price: 7500, aiGeneration: 'enabled', aiConfigApplied: false,
    vehicleGroup: { ...KODIAK_VEHICLE_GROUP, id: 'kodiak-vg-07', vin: 'JY4AK05RNRA006543' },
    syndication: 'syndicated',    exteriorColor: 'Camouflage',
    vehicleStatus: 'In Transit',  dol: 30, priceToMarket: 'below',      priorityScore: 5,
    thumbnail: kodiakThumb,
  },
  {
    id: 'vin-08', vin: 'JY4AK05XRRA010003',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'Kodiak 450', trim: 'EPS',
    price: 9299, aiGeneration: 'enabled', aiConfigApplied: false,
    vehicleGroup: { ...KODIAK_VEHICLE_GROUP, id: 'kodiak-vg-08', vin: 'JY4AK05XRRA010003' },
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'On the lot',  dol: 14, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: kodiakThumb,
  },
  {
    id: 'vin-09', vin: 'JY4AK05XRRA010006',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'Kodiak 450', trim: 'EPS XT-R',
    price: 9699, aiGeneration: 'enabled', aiConfigApplied: false,
    vehicleGroup: { ...KODIAK_VEHICLE_GROUP, id: 'kodiak-vg-09', vin: 'JY4AK05XRRA010006' },
    syndication: 'syndicated',    exteriorColor: 'Dark Grayish Yellow Solid',
    vehicleStatus: 'In Transit',  dol: 7,  priceToMarket: 'below',      priorityScore: 6,
    thumbnail: kodiakThumb,
  },
  // ── Grizzly 700 (also used in AI Config flows) ────────────────────────────
  {
    id: 'vin-10', vin: 'JY4AH08RNRA002891',
    condition: 'New',  year: 2024, make: 'Yamaha', model: 'Grizzly 700', trim: 'EPS XT-R',
    price: 13499, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Bluish White Pearl',
    vehicleStatus: 'In Transit',  dol: 15, priceToMarket: 'below',      priorityScore: 6,
    thumbnail: grizzlyThumb,
  },
  {
    id: 'vin-11', vin: 'JY4AH08RNRA005674',
    condition: 'Used', year: 2024, make: 'Yamaha', model: 'Grizzly 700', trim: 'EPS XT-R',
    price: 11200, aiGeneration: 'enabled', aiConfigApplied: true,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue Metallic',
    vehicleStatus: 'On the lot',  dol: 45, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: grizzlyThumb,
  },

  // ── vin-12 onwards: Jellybean CSV lineup (2025–2026 Yamaha) ──────────────
  // CSV order: year, make, model, trim, color_code, url
  // VIN structure: JYA = street/sport, JY4 = off-road/ATV
  //   Pos 10 year code: T=2026, S=2025
  //   Pos 11 plant: A=Iwata (bikes), B=Shizuoka, C=Yamaha Motor Thailand

  // MT-09 SP 2025 — BWM2 Bluish White Metallic
  {
    id: 'vin-12', vin: 'JYARJ18BSJA001847',
    condition: 'New',  year: 2025, make: 'Yamaha', model: 'MT-09', trim: 'SP',
    price: 11199, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Bluish White Metallic',
    vehicleStatus: 'On the lot',  dol: 22, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: jb('mt09', '97242445-74d0-451d-9591-27a13c46d735'),
  },

  // ZUMA 125 2026 — MLB2 Metallic Light Blue
  {
    id: 'vin-13', vin: 'JYASC14BTJA003291',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'ZUMA 125', trim: 'Base',
    price: 3999, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Metallic Light Blue',
    vehicleStatus: 'On the lot',  dol: 8,  priceToMarket: 'close',      priorityScore: 3,
    thumbnail: jb('zuma125', '825f813a-e028-43a8-9f6e-5208227d836f'),
  },

  // ZUMA 125 2026 — MYNS1 Matte Yellow/Nardo Stone
  {
    id: 'vin-14', vin: 'JYASC14BTJA007654',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'ZUMA 125', trim: 'Base',
    price: 3999, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Matte Yellow/Nardo Stone',
    vehicleStatus: 'In Transit',  dol: 3,  priceToMarket: 'below',      priorityScore: 3,
    thumbnail: jb('zuma125', '35516adf-5a98-4801-aaad-f9a099ad6ef7'),
  },

  // YZF-R7 2026 — DPBMC Dark Purplish Blue Metallic/Copper
  {
    id: 'vin-15', vin: 'JYARH08BTJA012083',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R7', trim: 'Base',
    price: 8999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue/Copper',
    vehicleStatus: 'On the lot',  dol: 44, priceToMarket: 'above',      priorityScore: 5,
    thumbnail: jb('yzfr7', '9b60c350-f056-4e49-a62c-be8d4811f146'),
  },

  // YZF-R7 2026 — SMX Sonic Metallic X
  {
    id: 'vin-16', vin: 'JYARH08BTJA018376',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R7', trim: 'Base',
    price: 8999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Sonic Metallic X',
    vehicleStatus: 'In Transit',  dol: 14, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: jb('yzfr7', '24d883e6-9485-485e-8125-3fe0bf2b1d8a'),
  },

  // YZF-R7 2026 — BSA Black/Silver/Ash
  {
    id: 'vin-17', vin: 'JYARH08BTJA025941',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R7', trim: 'Base',
    price: 8999, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Black/Silver Ash',
    vehicleStatus: 'On the lot',  dol: 67, priceToMarket: 'well-above', priorityScore: 2,
    thumbnail: jb('yzfr7', '6f0c8dbb-5ceb-45ed-856e-250830a837aa'),
  },

  // YZF-R3 2026 — DPBMC Dark Purplish Blue Metallic/Copper
  {
    id: 'vin-18', vin: 'JYARJ06BTJA004512',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R3', trim: 'Base',
    price: 5499, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue/Copper',
    vehicleStatus: 'In Transit',  dol: 18, priceToMarket: 'below',      priorityScore: 5,
    thumbnail: jb('yzfr3', 'aa9ae0f8-8125-42d9-8808-ce6513e1bd3c'),
  },

  // YZF-R3 2026 — PBGS2 Pale Bluish Gray Solid
  {
    id: 'vin-19', vin: 'JYARJ06BTJA009834',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R3', trim: 'Base',
    price: 5499, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Pale Bluish Gray Solid',
    vehicleStatus: 'On the lot',  dol: 51, priceToMarket: 'close',      priorityScore: 3,
    thumbnail: jb('yzfr3', 'b05a304b-6247-4861-947a-e75a8440bd98'),
  },

  // YZF-R7 2026 — BWP1 Bluish White Pearl
  {
    id: 'vin-20', vin: 'JYARH08BTJA031267',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R7', trim: 'Base',
    price: 8999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Bluish White Pearl',
    vehicleStatus: 'On the lot',  dol: 29, priceToMarket: 'above',      priorityScore: 5,
    thumbnail: jb('yzfr7', '79d28ecd-3d74-4379-b900-471bda7b16d4'),
  },

  // YZF-R9 2026 — DPBMC Dark Purplish Blue Metallic/Copper
  {
    id: 'vin-21', vin: 'JYARJ10BTJA002198',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R9', trim: 'Base',
    price: 10999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue/Copper',
    vehicleStatus: 'In Transit',  dol: 7,  priceToMarket: 'below',      priorityScore: 6,
    thumbnail: jb('yzfr9', '21a0d1e1-3b85-47c8-9d6f-f8b0e88de27c'),
  },

  // YZF-R3 70th Anniversary 2026 — WM6 White Metallic
  {
    id: 'vin-22', vin: 'JYARJ06BTJA014427',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R3', trim: '70th Anniversary',
    price: 5899, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'White Metallic',
    vehicleStatus: 'On the lot',  dol: 12, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: jb('yzfr3', '95d7918b-4d18-44a1-8548-e91a6d79e23e'),
  },

  // YZF-R3 2026 — WM6 White Metallic
  {
    id: 'vin-23', vin: 'JYARJ06BTJA021503',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R3', trim: 'Base',
    price: 5499, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'White Metallic',
    vehicleStatus: 'In Transit',  dol: 34, priceToMarket: 'above',      priorityScore: 3,
    thumbnail: jb('yzfr3', 'fc70a96c-a65e-45ca-b1d8-c72d1fd921c2'),
  },

  // YZF-R9 2026 — BWP1 Bluish White Pearl
  {
    id: 'vin-24', vin: 'JYARJ10BTJA008764',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R9', trim: 'Base',
    price: 10999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Bluish White Pearl',
    vehicleStatus: 'On the lot',  dol: 41, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: jb('yzfr9', '069c3d0f-98c4-44e4-9cf8-4894eafe5484'),
  },

  // YZF-R3 2026 — SM12 Silver Metallic
  {
    id: 'vin-25', vin: 'JYARJ06BTJA029148',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R3', trim: 'Base',
    price: 5499, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Silver Metallic',
    vehicleStatus: 'On the lot',  dol: 88, priceToMarket: 'well-above', priorityScore: 1,
    thumbnail: jb('yzfr3', 'f9edb414-17bd-4231-a2ae-96fdd63e356d'),
  },

  // YZF-R7 70th Anniversary 2026 — BWP1 Bluish White Pearl
  {
    id: 'vin-26', vin: 'JYARH08BTJA039812',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R7', trim: '70th Anniversary',
    price: 9399, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Bluish White Pearl',
    vehicleStatus: 'In Transit',  dol: 5,  priceToMarket: 'below',      priorityScore: 6,
    thumbnail: jb('yzfr7', 'a122d5b5-22ef-40a0-ad3f-bb406f53d639'),
  },

  // YZF-R1 70th Anniversary 2026 — BWP1 Bluish White Pearl
  {
    id: 'vin-27', vin: 'JYARN15BTJA001056',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R1', trim: '70th Anniversary',
    price: 17999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Bluish White Pearl',
    vehicleStatus: 'In Transit',  dol: 9,  priceToMarket: 'below',      priorityScore: 6,
    thumbnail: jb('yzfr1', '7f621444-3c66-4c67-851d-5d20fcd54018'),
  },

  // YZF-R1 2026 — DPBMC Dark Purplish Blue Metallic/Copper
  {
    id: 'vin-28', vin: 'JYARN15BTJA007293',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R1', trim: 'Base',
    price: 17499, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue/Copper',
    vehicleStatus: 'On the lot',  dol: 26, priceToMarket: 'above',      priorityScore: 5,
    thumbnail: jb('yzfr1', '81bd3d66-7513-4fc6-a892-cea77a1c81c7'),
  },

  // YZF-R1M 2026 — SMX Sonic Metallic X
  {
    id: 'vin-29', vin: 'JYARN15BTJA013748',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R1M', trim: 'Base',
    price: 26999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Sonic Metallic X',
    vehicleStatus: 'In Transit',  dol: 11, priceToMarket: 'close',      priorityScore: 5,
    thumbnail: jb('yzfr1m', '072c583f-5404-4f2c-b16c-b76b707101fd'),
  },

  // YZF-R1 2026 — BWP1 Bluish White Pearl
  {
    id: 'vin-30', vin: 'JYARN15BTJA019517',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZF-R1', trim: 'Base',
    price: 17499, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Bluish White Pearl',
    vehicleStatus: 'On the lot',  dol: 53, priceToMarket: 'well-above', priorityScore: 2,
    thumbnail: jb('yzfr1', '1a1d8dce-ab60-4073-a661-fff783d51bd3'),
  },

  // YZ85LW 2026 — Team Yamaha Blue
  {
    id: 'vin-31', vin: 'JY4RG04BTCA003812',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ85LW', trim: 'Base',
    price: 4899, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Team Yamaha Blue',
    vehicleStatus: 'On the lot',  dol: 16, priceToMarket: 'close',      priorityScore: 3,
    thumbnail: jb('yz85lw', 'f6c409d4-0776-4983-a503-b467c12a0573'),
  },

  // YZ85 2026 — Team Yamaha Blue
  {
    id: 'vin-32', vin: 'JY4RG04BTCA007491',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ85', trim: 'Base',
    price: 4799, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Team Yamaha Blue',
    vehicleStatus: 'In Transit',  dol: 4,  priceToMarket: 'below',      priorityScore: 3,
    thumbnail: jb('yz85', '06fc8039-2869-40e5-8a69-4536604503c0'),
  },

  // YZ450F 2026 — PWS1 Pure White Solid
  {
    id: 'vin-33', vin: 'JY4RN18BTCA002347',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ450F', trim: 'Base',
    price: 9999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Pure White Solid',
    vehicleStatus: 'On the lot',  dol: 33, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: jb('yz450f', '751f2101-e5bf-407b-92a9-e668adae9aa4'),
  },

  // YZ450F 70th Anniversary 2026 — Team Yamaha Blue
  {
    id: 'vin-34', vin: 'JY4RN18BTCA008623',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ450F', trim: '70th Anniversary',
    price: 10399, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Team Yamaha Blue',
    vehicleStatus: 'In Transit',  dol: 6,  priceToMarket: 'below',      priorityScore: 6,
    thumbnail: jb('yz450f', '43562a35-087e-4e2b-96fd-d22fee768b14'),
  },

  // YZ450FX 2026 — DPBSE Dark Purplish Blue Solid Edition
  {
    id: 'vin-35', vin: 'JY4RN18BTCA014901',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ450FX', trim: 'Base',
    price: 10499, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'On the lot',  dol: 48, priceToMarket: 'above',      priorityScore: 4,
    thumbnail: jb('yz450fx', '0f242e18-0a42-4e06-a66c-9d8bebb08fa9'),
  },

  // YZ250X 2026 — DPBSE Dark Purplish Blue Solid Edition
  {
    id: 'vin-36', vin: 'JY4RN14BTCA003187',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ250X', trim: 'Base',
    price: 9299, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'In Transit',  dol: 21, priceToMarket: 'close',      priorityScore: 3,
    thumbnail: jb('yz250x', 'a9571c35-eeda-4ec0-b6bf-590b4b289d71'),
  },

  // YZ450F 70th Anniversary 2026 — PWS1 Pure White Solid
  {
    id: 'vin-37', vin: 'JY4RN18BTCA021456',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ450F', trim: '70th Anniversary',
    price: 10399, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Pure White Solid',
    vehicleStatus: 'On the lot',  dol: 15, priceToMarket: 'close',      priorityScore: 5,
    thumbnail: jb('yz450f', 'daddff44-8287-4ba3-9273-2a2e7b76c809'),
  },

  // YZ65 2026 — Team Yamaha Blue
  {
    id: 'vin-38', vin: 'JY4RG04BTCA011284',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ65', trim: 'Base',
    price: 3899, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Team Yamaha Blue',
    vehicleStatus: 'In Transit',  dol: 2,  priceToMarket: 'below',      priorityScore: 3,
    thumbnail: jb('yz65', 'f1d6aa29-1906-4a18-9874-488e03970328'),
  },

  // YZ450F 2026 — Team Yamaha Blue
  {
    id: 'vin-39', vin: 'JY4RN18BTCA027839',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ450F', trim: 'Base',
    price: 9999, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Team Yamaha Blue',
    vehicleStatus: 'On the lot',  dol: 72, priceToMarket: 'well-above', priorityScore: 2,
    thumbnail: jb('yz450f', '0c2199ac-4507-40b8-b492-52e72a258a93'),
  },

  // YZ250F 70th Anniversary 2026 — DPBSE Dark Purplish Blue Solid
  {
    id: 'vin-40', vin: 'JY4RN14BTCA009462',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ250F', trim: '70th Anniversary',
    price: 9299, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'In Transit',  dol: 13, priceToMarket: 'close',      priorityScore: 5,
    thumbnail: jb('yz250f', 'a92c2ce9-9fa6-47aa-a6a5-0b2dcc9616d0'),
  },

  // YZ250 2026 — DPBSE Dark Purplish Blue Solid
  {
    id: 'vin-41', vin: 'JY4RN14BTCA015718',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ250', trim: 'Base',
    price: 8999, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'On the lot',  dol: 58, priceToMarket: 'above',      priorityScore: 2,
    thumbnail: jb('yz250', 'da6dae8a-f10f-4608-be4c-bcb3955a0736'),
  },

  // YZ250F 70th Anniversary 2026 — YB Yamaha Blue
  {
    id: 'vin-42', vin: 'JY4RN14BTCA022093',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ250F', trim: '70th Anniversary',
    price: 9299, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Yamaha Blue',
    vehicleStatus: 'On the lot',  dol: 28, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: jb('yz250f', '27f71ebd-fd3a-4475-9651-144a355aabc1'),
  },

  // YZ250F 2026 — YB Yamaha Blue
  {
    id: 'vin-43', vin: 'JY4RN14BTCA029347',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ250F', trim: 'Base',
    price: 8999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Yamaha Blue',
    vehicleStatus: 'In Transit',  dol: 19, priceToMarket: 'below',      priorityScore: 5,
    thumbnail: jb('yz250f', 'cf1985d6-e6bf-40a6-94a7-7704524ab60c'),
  },

  // YZ250 70th Anniversary 2026 — DPBSE Dark Purplish Blue Solid
  {
    id: 'vin-44', vin: 'JY4RN14BTCA035802',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ250', trim: '70th Anniversary',
    price: 9399, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'On the lot',  dol: 37, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: jb('yz250', '56cf67a7-9cd4-4ea6-87ba-a8bc6f326895'),
  },

  // YZ250F 2026 — DPBSE Dark Purplish Blue Solid
  {
    id: 'vin-45', vin: 'JY4RN14BTCA042176',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ250F', trim: 'Base',
    price: 8999, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'In Transit',  dol: 46, priceToMarket: 'above',      priorityScore: 2,
    thumbnail: jb('yz250f', 'c03006d0-fd8b-4041-9f3b-bc62a93fdcde'),
  },

  // YZ250 2026 — YB Yamaha Blue
  {
    id: 'vin-46', vin: 'JY4RN14BTCA048531',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ250', trim: 'Base',
    price: 8999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Yamaha Blue',
    vehicleStatus: 'On the lot',  dol: 62, priceToMarket: 'close',      priorityScore: 3,
    thumbnail: jb('yz250', '24c109e3-9f5b-4bb8-bc0f-14051c9ee8f8'),
  },

  // YZ250FX 2026 — DPBSE Dark Purplish Blue Solid
  {
    id: 'vin-47', vin: 'JY4RN14BTCA054897',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ250FX', trim: 'Base',
    price: 9399, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'In Transit',  dol: 24, priceToMarket: 'close',      priorityScore: 3,
    thumbnail: jb('yz250fx', '83c025e2-9110-4703-bc5c-75a7a1f7593f'),
  },

  // YZ250 70th Anniversary 2026 — YB Yamaha Blue
  {
    id: 'vin-48', vin: 'JY4RN14BTCA061243',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ250', trim: '70th Anniversary',
    price: 9399, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Yamaha Blue',
    vehicleStatus: 'On the lot',  dol: 31, priceToMarket: 'above',      priorityScore: 4,
    thumbnail: jb('yz250', '36f2e579-274a-4d05-8f78-be9956709ec0'),
  },

  // YFZ50 2026 — DBPSE Dark Bluish Pearl Solid Edition
  {
    id: 'vin-49', vin: 'JY4AY04BTCA002134',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YFZ50', trim: 'Base',
    price: 2199, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Dark Bluish Pearl Solid',
    vehicleStatus: 'In Transit',  dol: 7,  priceToMarket: 'below',      priorityScore: 3,
    thumbnail: jb('yfz50', '338bf5e7-4466-4683-81a0-fefd6e9dcb3c'),
  },

  // YFZ50 2026 — LGS5 Light Gray Solid
  {
    id: 'vin-50', vin: 'JY4AY04BTCA006891',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YFZ50', trim: 'Base',
    price: 2199, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Light Gray Solid',
    vehicleStatus: 'On the lot',  dol: 40, priceToMarket: 'close',      priorityScore: 2,
    thumbnail: jb('yfz50', '67879de2-d95a-4530-bd67-5aca06ca45d6'),
  },

  // YFZ450R SE 70th Anniversary 2026 — BW1 Bluish White
  {
    id: 'vin-51', vin: 'JY4AY45BTCA003478',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YFZ450R', trim: 'SE 70th Anniversary',
    price: 11799, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Bluish White',
    vehicleStatus: 'In Transit',  dol: 8,  priceToMarket: 'below',      priorityScore: 6,
    thumbnail: jb('yfz450r', 'd70ed851-d3fc-450b-a08e-c19a9a00451d'),
  },

  // YZ125 70th Anniversary 2026 — DPBSE Dark Purplish Blue Solid
  {
    id: 'vin-52', vin: 'JY4RG06BTCA004563',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ125', trim: '70th Anniversary',
    price: 7299, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'On the lot',  dol: 17, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: jb('yz125', '109216b3-1182-4c20-ae23-759306b22cb4'),
  },

  // YZ125 2026 — DPBSE Dark Purplish Blue Solid
  {
    id: 'vin-53', vin: 'JY4RG06BTCA009821',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ125', trim: 'Base',
    price: 6999, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'In Transit',  dol: 39, priceToMarket: 'above',      priorityScore: 2,
    thumbnail: jb('yz125', 'edc4cdd4-5879-476b-a86f-cd21179ddb6b'),
  },

  // YZ125X 2026 — DPBSE Dark Purplish Blue Solid
  {
    id: 'vin-54', vin: 'JY4RG06BTCA015247',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YZ125X', trim: 'Base',
    price: 7499, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'On the lot',  dol: 55, priceToMarket: 'close',      priorityScore: 3,
    thumbnail: jb('yz125x', '2a6b7f1a-f5c0-45e8-9a32-271f7d5ec29a'),
  },

  // YFZ450R SE 2026 — BW1 Bluish White
  {
    id: 'vin-55', vin: 'JY4AY45BTCA009012',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YFZ450R', trim: 'SE',
    price: 11499, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Bluish White',
    vehicleStatus: 'In Transit',  dol: 14, priceToMarket: 'close',      priorityScore: 5,
    thumbnail: jb('yfz450r', '8e05b023-603c-4ce8-8302-b99555845a46'),
  },

  // XSR900 2026 — SW Solid White
  {
    id: 'vin-56', vin: 'JYARN09BTJA005678',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'XSR900', trim: 'Base',
    price: 9999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Solid White',
    vehicleStatus: 'On the lot',  dol: 23, priceToMarket: 'above',      priorityScore: 4,
    thumbnail: jb('xsr900', '897ec542-2dc1-43d8-8744-1ba691806e6f'),
  },

  // XSR900 2026 — SMX Sonic Metallic X
  {
    id: 'vin-57', vin: 'JYARN09BTJA011934',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'XSR900', trim: 'Base',
    price: 9999, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Sonic Metallic X',
    vehicleStatus: 'In Transit',  dol: 36, priceToMarket: 'close',      priorityScore: 3,
    thumbnail: jb('xsr900', '3921e24a-5169-43ff-930f-e01ac79d2bf4'),
  },

  // YFZ450R 2026 — BW1 Bluish White
  {
    id: 'vin-58', vin: 'JY4AY45BTCA014387',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YFZ450R', trim: 'Base',
    price: 10999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Bluish White',
    vehicleStatus: 'On the lot',  dol: 49, priceToMarket: 'above',      priorityScore: 4,
    thumbnail: jb('yfz450r', 'c1482735-7cf1-47a4-a7a5-929b2a4af269'),
  },

  // YFZ450R 2026 — LGS5 Light Gray Solid
  {
    id: 'vin-59', vin: 'JY4AY45BTCA019856',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YFZ450R', trim: 'Base',
    price: 10999, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Light Gray Solid',
    vehicleStatus: 'In Transit',  dol: 63, priceToMarket: 'close',      priorityScore: 2,
    thumbnail: jb('yfz450r', '54290b05-754d-4d72-8641-61afb53e51f9'),
  },

  // YFZ450R SE 2026 — LGS5 Light Gray Solid
  {
    id: 'vin-60', vin: 'JY4AY45BTCA025314',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YFZ450R', trim: 'SE',
    price: 11499, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Light Gray Solid',
    vehicleStatus: 'On the lot',  dol: 27, priceToMarket: 'below',      priorityScore: 5,
    thumbnail: jb('yfz450r', 'b5df0b63-566b-49a9-acaa-68bca8279758'),
  },

  // YFZ450R 2026 — DPBSE Dark Purplish Blue Solid Edition
  {
    id: 'vin-61', vin: 'JY4AY45BTCA030782',
    condition: 'New',  year: 2026, make: 'Yamaha', model: 'YFZ450R', trim: 'Base',
    price: 10999, aiGeneration: 'enabled', aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'In Transit',  dol: 42, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: jb('yfz450r', '1c71cb56-f59d-4a62-9e34-52a1d11cbd67'),
  },
];
