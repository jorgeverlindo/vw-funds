// ─── Vehicle Inventory VIN List data ────────────────────────────────────────
// Mock data for the RideNow Inventory > Vehicles tab.
// Mirrors the rows visible in Figma node 3556:990943.

import raptorThumb  from '../../assets/inventory/vehicles/vehicle-raptor-700r.png';
import grizzlyThumb from '../../assets/inventory/vehicles/vehicle-grizzly-700.png';
import kodiakThumb  from '../../assets/inventory/vehicles/vehicle-kodiak-450.png';
import yfzThumb     from '../../assets/inventory/vehicles/vehicle-yfz450r.png';
import motoThumb    from '../../assets/inventory/vehicles/Moto/11_2026_TW200T2_MLNM4_US_03_YY_08_RGB 1 - Right.png';

import type { VehicleGroup } from './types';
import { BLUE_VEHICLE_GROUP }  from './blueVehicle';
import { VEHICLE_GROUPS_2 }    from './vehicleGroups';

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

export const VEHICLE_INVENTORY: VinInventoryRecord[] = [
  {
    id: 'vin-01', vin: 'WBA8D9C50JK678112',
    condition: 'Used', year: 2026, make: 'Yamaha', model: 'TW200T', trim: 'Base',
    price: 4899, aiGeneration: 'enabled', aiConfigApplied: true,
    aiConfigId: '2',                       // March_20_correction
    vehicleGroup: VEHICLE_GROUPS_2[0],     // TW200T — 6 generated + 6 source angles
    syndication: 'syndicated',    exteriorColor: 'Matte Light Gray Metallic',
    vehicleStatus: 'On the lot',  dol: 35, priceToMarket: 'well-above', priorityScore: 4,
    thumbnail: motoThumb,
  },
  {
    id: 'vin-02', vin: '5Y4AM4HL3PJ002817',
    condition: 'New',  year: 2023, make: 'Yamaha', model: 'Raptor', trim: '700R SE',
    price: 10599, aiGeneration: 'enabled', aiConfigApplied: true,
    aiConfigId: '1',                       // January_05_final
    vehicleGroup: BLUE_VEHICLE_GROUP,      // Blue Raptor — 6 generated + 6 source angles
    syndication: 'syndicated',    exteriorColor: 'Acid Green',
    vehicleStatus: 'In Transit',  dol: 60, priceToMarket: 'above',      priorityScore: 5,
    thumbnail: raptorThumb,
  },
  {
    id: 'vin-03', vin: '5Y4AM4HL2NJ001423',
    condition: 'Used', year: 2025, make: 'Yamaha', model: 'Raptor', trim: '700R SE',
    price: 10599, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Cyan/Yamaha Black',
    vehicleStatus: 'On the lot',  dol: 30, priceToMarket: 'close',      priorityScore: 2,
    thumbnail: raptorThumb,
  },
  {
    id: 'vin-04', vin: '5Y4AM4HL9RJ004556',
    condition: 'New',  year: 2024, make: 'Yamaha', model: 'Raptor', trim: '700R SE',
    price: 10599, aiGeneration: 'enabled',  aiConfigApplied: true,
    syndication: 'not-syndicated', exteriorColor: 'Red/Black',
    vehicleStatus: 'In Transit',  dol: 45, priceToMarket: 'well-above', priorityScore: 1,
    thumbnail: raptorThumb,
  },
  {
    id: 'vin-05', vin: '5Y4AM4HL4QJ005102',
    condition: 'Used', year: 2025, make: 'Yamaha', model: 'Raptor', trim: '700R',
    price: 8200,  aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Gray Metallic Black',
    vehicleStatus: 'On the lot',  dol: 90, priceToMarket: 'close',      priorityScore: 3,
    thumbnail: raptorThumb,
  },
  {
    id: 'vin-06', vin: '5Y4AM4HL7NJ006384',
    condition: 'New',  year: 2023, make: 'Yamaha', model: 'Raptor', trim: '700R',
    price: 9999,  aiGeneration: 'enabled',  aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Team Yamaha Blue',
    vehicleStatus: 'In Transit',  dol: 40, priceToMarket: 'below',      priorityScore: 4,
    thumbnail: raptorThumb,
  },
  {
    id: 'vin-07', vin: '5Y4AM4HL1PJ007741',
    condition: 'Used', year: 2025, make: 'Yamaha', model: 'Raptor', trim: '700R',
    price: 9100,  aiGeneration: 'enabled',  aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Yamaha Black',
    vehicleStatus: 'On the lot',  dol: 75, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: raptorThumb,
  },
  {
    id: 'vin-08', vin: 'JY4AM03RNRA001247',
    condition: 'New',  year: 2024, make: 'Yamaha', model: 'Raptor', trim: '700R SE',
    price: 11299, aiGeneration: 'enabled',  aiConfigApplied: true,
    syndication: 'syndicated',    exteriorColor: 'Blue (ATV)',
    vehicleStatus: 'In Transit',  dol: 25, priceToMarket: 'above',      priorityScore: 5,
    thumbnail: raptorThumb,
  },
  {
    id: 'vin-09', vin: 'JY4AM03RNRA004583',
    condition: 'Used', year: 2024, make: 'Yamaha', model: 'Raptor', trim: '700R SE',
    price: 9800,  aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Bluish Gray',
    vehicleStatus: 'On the lot',  dol: 55, priceToMarket: 'close',      priorityScore: 3,
    thumbnail: raptorThumb,
  },
  {
    id: 'vin-10', vin: 'JY4AH08RNRA002891',
    condition: 'New',  year: 2024, make: 'Yamaha', model: 'Grizzly', trim: '700 EPS XT-R',
    price: 13499, aiGeneration: 'enabled',  aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Bluish White Pearl',
    vehicleStatus: 'In Transit',  dol: 15, priceToMarket: 'below',      priorityScore: 6,
    thumbnail: grizzlyThumb,
  },
  {
    id: 'vin-11', vin: 'JY4AH08RNRA005674',
    condition: 'Used', year: 2024, make: 'Yamaha', model: 'Grizzly', trim: '700 EPS XT-R',
    price: 11200, aiGeneration: 'enabled',  aiConfigApplied: true,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue',
    vehicleStatus: 'On the lot',  dol: 45, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: grizzlyThumb,
  },
  {
    id: 'vin-12', vin: 'JY4AK05RNRA003782',
    condition: 'New',  year: 2024, make: 'Yamaha', model: 'Kodiak',  trim: '450 EPS',
    price: 8999,  aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Dark Yellowish Gray',
    vehicleStatus: 'On the lot',  dol: 80, priceToMarket: 'well-above', priorityScore: 2,
    thumbnail: kodiakThumb,
  },
  {
    id: 'vin-13', vin: 'JY4AK05RNRA006543',
    condition: 'Used', year: 2023, make: 'Yamaha', model: 'Kodiak',  trim: '450 EPS',
    price: 7500,  aiGeneration: 'enabled',  aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Camouflage',
    vehicleStatus: 'In Transit',  dol: 30, priceToMarket: 'below',      priorityScore: 5,
    thumbnail: kodiakThumb,
  },
  {
    id: 'vin-14', vin: 'JY4AY45XPRA007634',
    condition: 'New',  year: 2023, make: 'Yamaha', model: 'YFZ450R', trim: 'SE',
    price: 10999, aiGeneration: 'enabled',  aiConfigApplied: true,
    syndication: 'syndicated',    exteriorColor: 'Dark Purplish Blue Solid',
    vehicleStatus: 'In Transit',  dol: 20, priceToMarket: 'above',      priorityScore: 5,
    thumbnail: yfzThumb,
  },
  {
    id: 'vin-15', vin: 'JY4AY45XPRA010982',
    condition: 'Used', year: 2023, make: 'Yamaha', model: 'YFZ450R', trim: 'SE',
    price: 9400,  aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Vivid Purplish Blue',
    vehicleStatus: 'On the lot',  dol: 65, priceToMarket: 'well-above', priorityScore: 1,
    thumbnail: yfzThumb,
  },
  {
    id: 'vin-16', vin: 'JY4AW10XPRA002567',
    condition: 'New',  year: 2023, make: 'Yamaha', model: 'Wolverine', trim: 'RMAX 1000 Ltd',
    price: 19999, aiGeneration: 'enabled',  aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Dark Bluish Gray',
    vehicleStatus: 'In Transit',  dol: 10, priceToMarket: 'below',      priorityScore: 6,
    thumbnail: grizzlyThumb,
  },
  {
    id: 'vin-17', vin: 'JY4AW10XPRA005834',
    condition: 'Used', year: 2023, make: 'Yamaha', model: 'Wolverine', trim: 'RMAX 1000 Ltd',
    price: 16500, aiGeneration: 'enabled',  aiConfigApplied: true,
    syndication: 'syndicated',    exteriorColor: 'Matte Titan',
    vehicleStatus: 'On the lot',  dol: 50, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: grizzlyThumb,
  },
  {
    id: 'vin-18', vin: 'JY4AM03RNRA007812',
    condition: 'New',  year: 2024, make: 'Yamaha', model: 'Raptor', trim: '700R Premium',
    price: 11800, aiGeneration: 'enabled',  aiConfigApplied: false,
    syndication: 'syndicated',    exteriorColor: 'Bluish White',
    vehicleStatus: 'In Transit',  dol: 18, priceToMarket: 'above',      priorityScore: 5,
    thumbnail: raptorThumb,
  },
  {
    id: 'vin-19', vin: 'JY4AM03RNRA012345',
    condition: 'Used', year: 2024, make: 'Yamaha', model: 'Raptor', trim: '700R Premium',
    price: 10000, aiGeneration: 'disabled', aiConfigApplied: false,
    syndication: 'not-syndicated', exteriorColor: 'Dark Grayish Yellow',
    vehicleStatus: 'On the lot',  dol: 72, priceToMarket: 'well-above', priorityScore: 2,
    thumbnail: raptorThumb,
  },
  {
    id: 'vin-20', vin: 'JY4AM03RNRA019034',
    condition: 'New',  year: 2024, make: 'Yamaha', model: 'Raptor', trim: '700R Base',
    price: 9499,  aiGeneration: 'enabled',  aiConfigApplied: true,
    syndication: 'syndicated',    exteriorColor: 'Dark Gray Metallic',
    vehicleStatus: 'In Transit',  dol: 35, priceToMarket: 'close',      priorityScore: 4,
    thumbnail: raptorThumb,
  },
];
