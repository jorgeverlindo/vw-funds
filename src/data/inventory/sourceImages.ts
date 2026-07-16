// ─── Source Images data ───────────────────────────────────────────────────────
// Seed records for the Source Images tab in the VIN Detail View.
// Represents individual source photo uploads for a specific VIN, grouped by
// angle (3/4 L, Front, 3/4 R, Right) — matches Figma CP-12009 node 4073:450941.

export type SourceImageFormat = 'JPG' | 'PNG' | 'RAW' | 'TIFF';
export type SourceImageSource = 'Manual' | 'JDP' | 'MarketCheck';

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
    source: 'Manual',
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
    source: 'MarketCheck',
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
    source: 'Manual',
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
    source: 'JDP',
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
    source: 'Manual',
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
    source: 'JDP',
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
    source: 'Manual',
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
    source: 'MarketCheck',
    date: '2025-08-15',
  },
];
