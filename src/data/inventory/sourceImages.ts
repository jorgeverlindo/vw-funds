// ─── Source Images data ───────────────────────────────────────────────────────
// Seed records for the Source Images tab in the VIN Detail View.
// Represents individual source photo uploads for a specific VIN, grouped by
// angle (3/4 L, Front, 3/4 R, Right) — matches Figma CP-12009 node 4073:450941.

export type SourceImageFormat = 'JPG' | 'PNG' | 'RAW' | 'TIFF';
export type SourceImageSource = 'Manual' | 'JDP' | 'MarketCheck' | 'vAuto';

export interface AngleCard {
  id: string;
  src: string | null;
  filename: string;
  source: SourceImageSource;
  /** Display string e.g. "2025-08-15 14:23" */
  date: string;
}

export interface AngleGroup {
  key: string;
  /** Display label e.g. "3/4 L" */
  label: string;
  cards: AngleCard[];
  activeCardId: string | null;
}

export interface SourceImageRecord {
  id: string;
  /** Primary thumbnail URL — displayed in StackedThumbnail */
  thumbnail: string;
  /** Total number of images represented by this row — drives stacking depth */
  imageCount: number;
  name: string;
  format: SourceImageFormat;
  /** e.g. "4032×3024" */
  dimensions: string;
  status: 'Active' | 'Paused';
  tags: string[];
  source: SourceImageSource;
  subtype?: string;
  date: string;
  /** Vehicle name shown in the drawer header (e.g. "2026 Yamaha Raptor 700R SE") */
  vehicleName?: string;
  /** Per-angle card data for the expansion drawer */
  angleGroups?: AngleGroup[];
  /** Generated (AI-processed) images per angle key — for "Check Generated Image" modal */
  generatedAngles?: Record<string, string | null>;
}

const raptorThumb =
  'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071266/vw-funds/inventory/vehicles/vehicle-raptor-700r.png';

// 11 records matching the angle breakdown visible in Figma node 4073:450941:
//   3/4 L → 4 items  |  Front → 3 items  |  3/4 R → 2 items  |  Right → 2 items
export const SOURCE_IMAGES_RAPTOR_002817: SourceImageRecord[] = [
  // ── 3/4 L ────────────────────────────────────────────────────────────────────
  {
    id: 'si-001',
    thumbnail: raptorThumb,
    imageCount: 4,
    name: 'YFM700RSPF_34L_20250815_001.jpg',
    format: 'JPG',
    dimensions: '4032×3024',
    status: 'Active',
    tags: ['3/4 L', 'Raptor 700R SE', 'Sport ATV', '2024'],
    source: 'vAuto',
    subtype: 'StockPhotos',
    date: '2025-08-15',
  },
  {
    id: 'si-002',
    thumbnail: raptorThumb,
    imageCount: 2,
    name: 'YFM700RSPF_34L_JDP_20250815_001.jpg',
    format: 'JPG',
    dimensions: '4032×3024',
    status: 'Active',
    tags: ['3/4 L', 'JDP Feed', 'Raptor 700R SE'],
    source: 'JDP',
    subtype: 'StockPhotos',
    date: '2025-08-15',
  },
  {
    id: 'si-003',
    thumbnail: raptorThumb,
    imageCount: 1,
    name: 'YFM700RSPF_34L_JDP_20250815_002.jpg',
    format: 'JPG',
    dimensions: '3840×2160',
    status: 'Active',
    tags: ['3/4 L', 'JDP Feed', 'Wide'],
    source: 'JDP',
    subtype: 'StockPhotos',
    date: '2025-08-15',
  },
  {
    id: 'si-004',
    thumbnail: raptorThumb,
    imageCount: 3,
    name: 'YFM700RSPF_34L_MC_20250815.jpg',
    format: 'JPG',
    dimensions: '1920×1080',
    status: 'Paused',
    tags: ['3/4 L', 'MarketCheck', 'Sport ATV'],
    source: 'vAuto',
    subtype: 'StockPhotos',
    date: '2025-08-15',
  },
  // ── Front ─────────────────────────────────────────────────────────────────────
  {
    id: 'si-005',
    thumbnail: raptorThumb,
    imageCount: 3,
    name: 'YFM700RSPF_FRONT_20250815_001.jpg',
    format: 'JPG',
    dimensions: '4032×3024',
    status: 'Active',
    tags: ['Front', 'Raptor 700R SE', 'Sport ATV', '2024'],
    source: 'MarketCheck',
    subtype: 'StockPhotos',
    date: '2025-08-15',
  },
  {
    id: 'si-006',
    thumbnail: raptorThumb,
    imageCount: 2,
    name: 'YFM700RSPF_FRONT_JDP_20250815_001.jpg',
    format: 'JPG',
    dimensions: '4032×3024',
    status: 'Active',
    tags: ['Front', 'JDP Feed'],
    source: 'MarketCheck',
    subtype: 'StockPhotos',
    date: '2025-08-15',
  },
  {
    id: 'si-007',
    thumbnail: raptorThumb,
    imageCount: 1,
    name: 'YFM700RSPF_FRONT_JDP_20250815_002.png',
    format: 'PNG',
    dimensions: '2048×1536',
    status: 'Active',
    tags: ['Front', 'JDP Feed', 'Transparent BG'],
    source: 'JDP',
    subtype: 'StockPhotos',
    date: '2025-08-15',
  },
  // ── 3/4 R ─────────────────────────────────────────────────────────────────────
  {
    id: 'si-008',
    thumbnail: raptorThumb,
    imageCount: 2,
    name: 'YFM700RSPF_34R_20250815_001.jpg',
    format: 'JPG',
    dimensions: '4032×3024',
    status: 'Active',
    tags: ['3/4 R', 'Raptor 700R SE', '2024'],
    source: 'vAuto',
    subtype: 'StockPhotos',
    date: '2025-08-15',
  },
  {
    id: 'si-009',
    thumbnail: raptorThumb,
    imageCount: 1,
    name: 'YFM700RSPF_34R_JDP_20250815.jpg',
    format: 'JPG',
    dimensions: '1920×1080',
    status: 'Active',
    tags: ['3/4 R', 'JDP Feed'],
    source: 'vAuto',
    subtype: 'StockPhotos',
    date: '2025-08-15',
  },
  // ── Right ─────────────────────────────────────────────────────────────────────
  {
    id: 'si-010',
    thumbnail: raptorThumb,
    imageCount: 2,
    name: 'YFM700RSPF_RIGHT_20250815_001.jpg',
    format: 'JPG',
    dimensions: '4032×3024',
    status: 'Active',
    tags: ['Right', 'Raptor 700R SE', 'Sport ATV'],
    source: 'MarketCheck',
    subtype: 'StockPhotos',
    date: '2025-08-15',
  },
  {
    id: 'si-011',
    thumbnail: raptorThumb,
    imageCount: 1,
    name: 'YFM700RSPF_RIGHT_MC_20250815.jpg',
    format: 'JPG',
    dimensions: '1920×1080',
    status: 'Paused',
    tags: ['Right', 'MarketCheck'],
    source: 'JDP',
    subtype: 'StockPhotos',
    date: '2025-08-15',
  },
];

// ─── VIN-specific full source-image records ───────────────────────────────────
// Pre-built SourceImageRecord keyed by VIN string.
// VinDetailContent checks this map first; if found, uses it directly instead of
// building a single-card-per-angle record from vehicleGroup.sourceAngles.

const R_34L   = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071228/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_06_YY_11_RGB_1.png';
const R_FRONT = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071221/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_01_YY_07_RGB_1.png';
const R_34R   = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071224/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_04_YY_09_RGB_1.png';
const R_RIGHT = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071223/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_03_YY_08_RGB_1.png';
const R_REAR  = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071227/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_05_YY_10_RGB_1.png';
const R_LEFT  = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071230/vw-funds/inventory/vehicles/Blue/72_2026_YFM70RSCTL_DPBSE_US_07_YY_12_RGB_1.png';

export const VIN_SOURCE_RECORDS: Record<string, SourceImageRecord> = {
  'JY4AM03RNRA019034': {
    id:          'si-vin05',
    thumbnail:   R_34L,
    imageCount:  15,
    name:        'JY4AM03RNRA019034_2024_Yamaha_Raptor_700R_SE_Sources.jpg',
    format:      'JPG',
    dimensions:  '4032×3024',
    status:      'Active',
    tags:        ['Yamaha', 'Raptor', '700R SE'],
    source:      'vAuto',
    subtype:     'StockPhotos',
    date:        '2025-08-15',
    vehicleName: '2024 Yamaha Raptor 700R SE',
    angleGroups: [
      {
        key: '34l', label: '3/4 L', activeCardId: 'vin05-34l-0',
        cards: [
          { id: 'vin05-34l-0', src: R_34L, filename: 'JY4AM03RNRA019034_34L_vAuto_001.jpg',      source: 'vAuto',       date: '2025-08-15 14:23' },
          { id: 'vin05-34l-1', src: R_34L, filename: 'JY4AM03RNRA019034_34L_JDP_001.jpg',        source: 'JDP',         date: '2025-06-10 09:15' },
          { id: 'vin05-34l-2', src: R_34L, filename: 'JY4AM03RNRA019034_34L_MarketCheck_001.jpg', source: 'MarketCheck', date: '2025-04-22 16:40' },
          { id: 'vin05-34l-3', src: R_34L, filename: 'JY4AM03RNRA019034_34L_JDP_002.jpg',        source: 'JDP',         date: '2025-02-01 11:00' },
        ],
      },
      {
        key: 'front', label: 'Front', activeCardId: 'vin05-front-0',
        cards: [
          { id: 'vin05-front-0', src: R_FRONT, filename: 'JY4AM03RNRA019034_Front_vAuto_001.jpg',  source: 'vAuto',       date: '2025-08-15 14:25' },
          { id: 'vin05-front-1', src: R_FRONT, filename: 'JY4AM03RNRA019034_Front_JDP_001.jpg',    source: 'JDP',         date: '2025-06-10 09:18' },
          { id: 'vin05-front-2', src: R_FRONT, filename: 'JY4AM03RNRA019034_Front_Manual_001.jpg', source: 'Manual',      date: '2025-03-14 08:30' },
        ],
      },
      {
        key: '34r', label: '3/4 R', activeCardId: 'vin05-34r-0',
        cards: [
          { id: 'vin05-34r-0', src: R_34R, filename: 'JY4AM03RNRA019034_34R_vAuto_001.jpg', source: 'vAuto', date: '2025-08-15 14:27' },
        ],
      },
      {
        key: 'right', label: 'Right', activeCardId: 'vin05-right-0',
        cards: [
          { id: 'vin05-right-0', src: R_RIGHT, filename: 'JY4AM03RNRA019034_Right_MarketCheck_001.jpg', source: 'MarketCheck', date: '2025-08-15 14:29' },
          { id: 'vin05-right-1', src: R_RIGHT, filename: 'JY4AM03RNRA019034_Right_JDP_001.jpg',         source: 'JDP',         date: '2025-05-20 10:45' },
        ],
      },
      {
        key: 'rear', label: 'Rear', activeCardId: 'vin05-rear-0',
        cards: [
          { id: 'vin05-rear-0', src: R_REAR, filename: 'JY4AM03RNRA019034_Rear_vAuto_001.jpg', source: 'vAuto', date: '2025-08-15 14:31' },
        ],
      },
      {
        key: 'left', label: 'Left', activeCardId: 'vin05-left-0',
        cards: [
          { id: 'vin05-left-0', src: R_LEFT, filename: 'JY4AM03RNRA019034_Left_vAuto_001.jpg',      source: 'vAuto',       date: '2025-08-15 14:33' },
          { id: 'vin05-left-1', src: R_LEFT, filename: 'JY4AM03RNRA019034_Left_JDP_001.jpg',        source: 'JDP',         date: '2025-06-10 09:22' },
          { id: 'vin05-left-2', src: R_LEFT, filename: 'JY4AM03RNRA019034_Left_MarketCheck_001.jpg', source: 'MarketCheck', date: '2025-04-22 17:05' },
          { id: 'vin05-left-3', src: R_LEFT, filename: 'JY4AM03RNRA019034_Left_Manual_001.jpg',     source: 'Manual',      date: '2025-01-08 15:00' },
        ],
      },
    ],
  },
};
