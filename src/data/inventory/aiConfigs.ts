const bg8 = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071197/vw-funds/inventory/backgrounds/image_8.jpg';
const bg14 = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071256/vw-funds/inventory/vehicles/Moto/genai-generic-3.png';
const bg15 = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071193/vw-funds/inventory/backgrounds/image_15.jpg';
const bg16 = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071194/vw-funds/inventory/backgrounds/image_16.jpg';
const bg171 = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071195/vw-funds/inventory/backgrounds/image_17-1.jpg';
const bg17 = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071196/vw-funds/inventory/backgrounds/image_17.jpg';
import {
  VEHICLE_GROUPS_1,
  VEHICLE_GROUPS_2,
  VEHICLE_GROUPS_3,
  VEHICLE_GROUPS_4,
} from './vehicleGroups';
import type { VehicleGroup, VinFilters } from './types';

/** Saved form state for round-trip editing of configs created via the form */
export interface SavedFormState {
  configName:      string;
  aiConfigActive:  boolean;
  aiModel:         string;
  seed:            string;
  prompt:          string;
  productPosition: { x: number; y: number; width: number };
  bgUrl:           string | null;
  overlayUrl:      string | null;
  vinsCount:       number;
  /** Restored filter groups for VINs Applied tab */
  filterGroups?:   Array<{ filters: VinFilters }>;
  /**
   * True only for static (pre-seeded) AI config records that are opened via a
   * synthetic formState built in handleRowClick. Form-created records leave this
   * undefined / false so the preview still shows the vehicle composite.
   */
  isStaticRecord?: boolean;
  /**
   * Ordered array of generated image URLs (one per angle, matching ANGLES index order).
   * Populated for static records that have vehicleGroup angle data (e.g. March_20_correction).
   * null entries mean that angle has no image.
   */
  genAngles?: Array<string | null>;
  /**
   * Ordered array of source cutout image URLs (same index order as genAngles).
   * Enables the Generated / Source toggle in the preview modal.
   */
  sourceAngles?: Array<string | null>;
  /**
   * Ordered array of previous-version image URLs (one per angle, same index order).
   * Populated when individual angles have been re-generated via the Angle Edit flow.
   * Enables the "Previous Version" tab in the preview modal.
   */
  previousAngles?: Array<string | null>;
}

export interface AIConfigRecord {
  id: string;
  name: string;
  thumbnail: string;
  dimensions: string;
  vinsApplied: string;
  vins: number;
  status: 'Active' | 'Paused';
  createdAt: string;
  model: string;
  /** Expandable YMMTC vehicle groups — only first 4 configs have data */
  vehicleGroups?: VehicleGroup[];
  /** Form state for round-trip editing (only present on configs created via form) */
  formState?: SavedFormState;
  /**
   * Structured filter groups — when present, DataGrid renders one chip per group
   * instead of the plain `vinsApplied` string.
   */
  filterGroups?: Array<{ filters: VinFilters }>;
}

// Parent rows always use landscape background thumbnails (cycling through 6 images).
// Vehicle cutout images live inside the YMMTC VehicleRow sub-rows.
const BKGS = [bg8, bg14, bg15, bg16, bg171, bg17];

export const AI_CONFIGS: AIConfigRecord[] = [
  {
    id: '1',
    name: 'January_05_final',
    thumbnail: BKGS[0],
    model: 'Flux',
    dimensions: '1600 × 1200',
    vinsApplied: '2024 · Yamaha · Raptor 700R · SE · Brown',
    vins: 105,
    status: 'Active',
    createdAt: '30 minutes ago',
    vehicleGroups: VEHICLE_GROUPS_1,
  },
  {
    id: '2',
    name: 'March_20_correction',
    thumbnail: BKGS[1],
    model: 'Flux',
    dimensions: '1600 × 1200',
    vinsApplied: '2024 · Yamaha · Raptor 700R · SE · Blush Gray',
    vins: 38,
    status: 'Active',
    createdAt: '10 hours ago',
    vehicleGroups: VEHICLE_GROUPS_2,
  },
  {
    id: '3',
    name: 'April_08_final',
    thumbnail: BKGS[2],
    model: 'Flux',
    dimensions: '1600 × 1200',
    vinsApplied: '2024 · Yamaha · Raptor 700R · Premium Line · Blush White',
    vins: 0,
    status: 'Paused',
    createdAt: '12 hours ago',
    vehicleGroups: VEHICLE_GROUPS_3,
  },
  {
    id: '4',
    name: '13_extra',
    thumbnail: BKGS[3],
    model: 'Midjourney V8',
    dimensions: '1600 × 1200',
    vinsApplied: '2024 · Yamaha · Raptor 700R · Premium Line · Dark Grayish Yellow',
    vins: 0,
    status: 'Paused',
    createdAt: '1 day ago',
    vehicleGroups: VEHICLE_GROUPS_4,
  },
  {
    id: '5',
    name: 'June_30_correction',
    thumbnail: BKGS[4],
    model: 'Stable Diffusion 3.5',
    dimensions: '1600 × 1200',
    vinsApplied: '2024 · Yamaha · Raptor 700R · Base · Dark Gray Metallic',
    vins: 35,
    status: 'Active',
    createdAt: '2 days ago',
  },
  {
    id: '6',
    name: '04_final',
    thumbnail: BKGS[5],
    model: 'DALL·E 3',
    dimensions: '1600 × 1200',
    vinsApplied: '2024 · Yamaha · Grizzly 700 · EPS XT-R · Blush White Pearl',
    vins: 19,
    status: 'Active',
    createdAt: '3 days ago',
  },
  {
    id: '7',
    name: 'January_25_final',
    thumbnail: BKGS[0],
    model: 'Ideogram 3.0',
    dimensions: '1600 × 1200',
    vinsApplied: '2024 · Yamaha · Grizzly 700 · EPS XT-R · Dark Purplish Blue Metallic',
    vins: 0,
    status: 'Paused',
    createdAt: '15 days ago',
  },
  {
    id: '8',
    name: 'February_12_wide',
    thumbnail: BKGS[1],
    model: 'Recraft V4',
    dimensions: '1920 × 1080',
    vinsApplied: '2024 · Yamaha · MT-07 · ABS · Midnight Black',
    vins: 72,
    status: 'Active',
    createdAt: '18 days ago',
  },
  {
    id: '9',
    name: 'March_01_square',
    thumbnail: BKGS[2],
    model: 'Flux',
    dimensions: '1080 × 1080',
    vinsApplied: '2024 · Yamaha · MT-09 · SP · Cyan Storm',
    vins: 44,
    status: 'Active',
    createdAt: '20 days ago',
  },
  {
    id: '10',
    name: 'April_22_tall',
    thumbnail: BKGS[3],
    model: 'Midjourney V8',
    dimensions: '1080 × 1920',
    vinsApplied: '2024 · Yamaha · YZF-R1 · M · Yamaha Blue',
    vins: 0,
    status: 'Paused',
    createdAt: '22 days ago',
  },
  {
    id: '11',
    name: 'May_03_banner',
    thumbnail: BKGS[4],
    model: 'Stable Diffusion 3.5',
    dimensions: '1600 × 500',
    vinsApplied: '2024 · Yamaha · TMAX 560 · Tech Max · Gunmetal Gray',
    vins: 28,
    status: 'Active',
    createdAt: '25 days ago',
  },
  {
    id: '12',
    name: 'May_17_landscape',
    thumbnail: BKGS[5],
    model: 'DALL·E 3',
    dimensions: '1600 × 1200',
    vinsApplied: '2024 · Yamaha · NMAX 125 · Base · Metallic Blue',
    vins: 60,
    status: 'Active',
    createdAt: '28 days ago',
  },
  {
    id: '13',
    name: 'June_06_studio',
    thumbnail: BKGS[0],
    model: 'Ideogram 3.0',
    dimensions: '2048 × 1536',
    vinsApplied: '2024 · Yamaha · Ténéré 700 · World Raid · Rally Green',
    vins: 15,
    status: 'Active',
    createdAt: '1 month ago',
  },
  {
    id: '14',
    name: 'June_14_reel',
    thumbnail: BKGS[1],
    model: 'Recraft V4',
    dimensions: '1080 × 1350',
    vinsApplied: '2024 · Yamaha · Ténéré 700 · Base · Mineral Gray',
    vins: 0,
    status: 'Paused',
    createdAt: '1 month ago',
  },
  {
    id: '15',
    name: 'July_01_promo',
    thumbnail: BKGS[2],
    model: 'Flux',
    dimensions: '1600 × 1200',
    vinsApplied: '2024 · Yamaha · XSR900 · GP · Midnight Black',
    vins: 33,
    status: 'Active',
    createdAt: '2 months ago',
  },
  {
    id: '16',
    name: 'July_19_season',
    thumbnail: BKGS[3],
    model: 'Midjourney V8',
    dimensions: '1920 × 1080',
    vinsApplied: '2024 · Yamaha · XSR700 · Base · Vintage White',
    vins: 51,
    status: 'Active',
    createdAt: '2 months ago',
  },
  {
    id: '17',
    name: 'August_05_offroad',
    thumbnail: BKGS[4],
    model: 'Stable Diffusion 3.5',
    dimensions: '1600 × 1200',
    vinsApplied: '2024 · Yamaha · WR250F · Base · Yamaha Blue',
    vins: 0,
    status: 'Paused',
    createdAt: '2 months ago',
  },
  {
    id: '18',
    name: 'September_12_fall',
    thumbnail: BKGS[5],
    model: 'DALL·E 3',
    dimensions: '1600 × 1200',
    vinsApplied: '2024 · Yamaha · YZ450F · Monster Energy · White',
    vins: 22,
    status: 'Active',
    createdAt: '3 months ago',
  },
  {
    id: '19',
    name: 'October_01_event',
    thumbnail: BKGS[0],
    model: 'Ideogram 3.0',
    dimensions: '2048 × 1536',
    vinsApplied: '2024 · Yamaha · R3 · ABS · Cyan Storm',
    vins: 88,
    status: 'Active',
    createdAt: '3 months ago',
  },
];
