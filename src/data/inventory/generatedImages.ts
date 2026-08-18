// ─── Generated Images data ────────────────────────────────────────────────────
// Seed records for the Generated Images tab in the VIN Detail View.
// Figma: CP-12009 node 4297:801317

import type { AngleGroup } from './sourceImages';
import type { AngleKey } from './types';

// Per-angle generated composites for January_05_final (mountain/sunset background)
import jan05Front from '../../assets/multi-angle-backgrounds/different-angles/ef0a8414-b4d8-4df4-975e-124df0873746.jpeg';
import jan0534R   from '../../assets/multi-angle-backgrounds/different-angles/watermarked_img_13890091125634444171.jpg';
import jan05Right from '../../assets/multi-angle-backgrounds/different-angles/40c4f031-abd3-4a57-8f06-23914682fee0.jpeg';
import jan05Left  from '../../assets/multi-angle-backgrounds/different-angles/a9f7960f-86be-43b5-8524-98b672b4c93c.jpeg';
import jan05Rear  from '../../assets/multi-angle-backgrounds/different-angles/e7257cbd-42ab-486e-96ef-f431886dcaa3.jpeg';

export type GeneratedImageStatus = 'Main';
export type GeneratedImageType   = 'Real Image' | 'Jelly Bean';

export interface GeneratedImageConfig {
  id: string;
  name: string;
  thumbnail: string | null;
  /** e.g. "1080 x 1080" */
  dimensions: string;
  status: GeneratedImageStatus;
  /** Filter tags applied to this config */
  filters: string[];
  imageType: GeneratedImageType;
  /** ISO date string — rendered as relative time */
  lastUpdate: string;
  /** Angle groups for the Generated Images drawer */
  angleGroups?: AngleGroup[];
  /** If true, this config is the initial Main selection in the grid */
  isDefaultMain?: boolean;
  /** The vehicle cover image shown in Vehicles list and VIN Detail when this config is Main (3/4 L) */
  coverImage?: string;
  /** Per-angle generated composites — when this config is Main these replace VIN Detail angle images */
  angleImages?: Partial<Record<AngleKey, string>>;
}

const CDN = 'https://res.cloudinary.com/dvq75cqna/image/upload';

const IMG = {
  january_05_final:    `${CDN}/v1784570901/January_05_final_wm5wff.jpg`,
  february_12_extra:   `${CDN}/v1784570902/Raptop_fix_yn4o7r.jpg`,
  march_20_correction: `${CDN}/v1784570902/March_20_correction_jpc7cr.jpg`,
  april_08_final:      `${CDN}/v1784570902/April_08_final_ewdt9s.jpg`,
  extra_15:            `${CDN}/v1784570901/15_extra_ve1zf6.jpg`,
  june_30_correction:  `${CDN}/v1784570902/June_30_correction_hp0hm6.jpg`,
  final_04:            `${CDN}/v1784570901/04_final_tvplok.jpg`,
};

// Blue vehicle output image — shown as vehicle cover when gi-001 is Main
const BLUE_IMAGE = `${CDN}/v1784574051/generated-image-vehicle-blue-2_oclzpc.jpg`;

// Landscape images shared across Generated Images drawer cards
const GI = {
  img1: `${CDN}/v1784570901/January_05_final_wm5wff.jpg`,
  img2: `${CDN}/v1784571373/generated-image-2_ko5dbe.jpg`,
  img3: `${CDN}/v1784571554/generated-image-3_ztticn.jpg`,
};

// Angle groups for the gi-001 drawer (Figma node 4300:1269036)
// 3/4 L: 4 cards, active = first; Front: 3 cards, active = second; 3/4 R: 1; Right: 1
const GI_001_ANGLE_GROUPS: AngleGroup[] = [
  {
    key: '34l', label: '3/4 L', activeCardId: 'gi-001-34l-1',
    cards: [
      { id: 'gi-001-34l-1', src: GI.img1, filename: 'January_05_final_34L_a.jpg',    source: 'Manual', date: '2025-08-15 14:23' },
      { id: 'gi-001-34l-2', src: GI.img2, filename: 'generated_image_2_34L_a.jpg',   source: 'JDP',    date: '2025-08-15 14:23' },
      { id: 'gi-001-34l-3', src: GI.img3, filename: 'generated_image_3_34L_a.jpg',   source: 'JDP',    date: '2025-08-15 14:23' },
      { id: 'gi-001-34l-4', src: GI.img1, filename: 'January_05_final_34L_b.jpg',    source: 'Manual', date: '2025-08-15 14:23' },
    ],
  },
  {
    key: 'front', label: 'Front', activeCardId: 'gi-001-front-2',
    cards: [
      { id: 'gi-001-front-1', src: GI.img1, filename: 'January_05_final_front.jpg',    source: 'Manual', date: '2025-08-15 14:23' },
      { id: 'gi-001-front-2', src: GI.img2, filename: 'generated_image_2_front.jpg',   source: 'JDP',    date: '2025-08-15 14:23' },
      { id: 'gi-001-front-3', src: GI.img3, filename: 'generated_image_3_front.jpg',   source: 'JDP',    date: '2025-08-15 14:23' },
    ],
  },
  {
    key: '34r', label: '3/4 R', activeCardId: 'gi-001-34r-1',
    cards: [
      { id: 'gi-001-34r-1', src: GI.img2, filename: 'generated_image_2_34R.jpg', source: 'JDP', date: '2025-08-15 14:23' },
    ],
  },
  {
    key: 'right', label: 'Right', activeCardId: 'gi-001-right-1',
    cards: [
      { id: 'gi-001-right-1', src: GI.img2, filename: 'generated_image_2_right.jpg', source: 'JDP', date: '2025-08-15 14:23' },
    ],
  },
];

// ─── Per-VIN map ──────────────────────────────────────────────────────────────
export const VIN_GENERATED_CONFIGS: Record<string, GeneratedImageConfig[]> = {
  'JY4AM03RNRA019034': [
    {
      id:          'gi-001',
      name:        'January_05_final',
      thumbnail:   IMG.january_05_final,
      dimensions:  '1080 x 1080',
      status:      'Main',
      filters: [
        '2024 · Yamaha · Raptor 700R · SE · Brown',
        '2024 · Yamaha · Raptor 700R · SE · Bluish Gray',
      ],
      imageType:   'Real Image',
      lastUpdate:  '2025-07-05T12:00:00Z',
      angleGroups: GI_001_ANGLE_GROUPS,
      coverImage:  BLUE_IMAGE,
      angleImages: {
        '34l':   BLUE_IMAGE,
        front:   jan05Front,
        '34r':   jan0534R,
        right:   jan05Right,
        left:    jan05Left,
        rear:    jan05Rear,
      },
    },
    {
      id:           'gi-002',
      name:         'February_12_extra',
      thumbnail:    IMG.february_12_extra,
      dimensions:   '1080 x 1080',
      status:       'Main',
      isDefaultMain: true,
      filters: [
        '2024 · Yamaha · Raptor 700R · Premium · Line · Bluish White',
        '2024 · Yamaha · Raptor 700R · Premium Line · Bluish White',
      ],
      imageType:    'Jelly Bean',
      lastUpdate:   '2025-07-05T12:00:00Z',
      coverImage:   `${CDN}/v1784575144/generated-image-vehicle-blue-1_o7npez.jpg`,
    },
    {
      id:         'gi-003',
      name:       'March_20_correction',
      thumbnail:  IMG.march_20_correction,
      dimensions: '1080 x 1080',
      status:     'Main',
      filters: [
        '2024 · Yamaha · Raptor 700R · Premium Line · Dark Grayish Yellow',
        '2023 Yamaha Grizzly 700 EPS XT-R Dark Bluish Grey Metallic 7',
      ],
      imageType:  'Real Image',
      lastUpdate: '2025-07-05T12:00:00Z',
    },
    {
      id:         'gi-004',
      name:       'April_08_final',
      thumbnail:  IMG.april_08_final,
      dimensions: '1080 x 1080',
      status:     'Main',
      filters: [
        '2023 · YamahaGrizzly 700EPS XT-R Dark Bluish Grey Metallic 7',
        '2024 · Yamaha · Raptor 700R · Base · Dark Gray Metallic',
      ],
      imageType:  'Jelly Bean',
      lastUpdate: '2025-07-05T12:00:00Z',
    },
    {
      id:         'gi-005',
      name:       '15_extra',
      thumbnail:  IMG.extra_15,
      dimensions: '1080 x 1080',
      status:     'Main',
      filters: [
        '2024 · Yamaha · Grizzly 700 · EPS XT-R · Bluish White Pearl',
        '2024 · Yamaha · Grizzly 700 · EPS XT-R · Dark Purplish Blue Metallic',
      ],
      imageType:  'Real Image',
      lastUpdate: '2025-07-05T12:00:00Z',
    },
    {
      id:         'gi-006',
      name:       'June_30_correction',
      thumbnail:  IMG.june_30_correction,
      dimensions: '1080 x 1080',
      status:     'Main',
      filters: [
        '2024 · Yamaha · Grizzly 700 · EPS · Dark Leaf Green',
        '2022 · Yamaha · Kodiak 450 · EPS · Dark Purplish Blue Solid',
      ],
      imageType:  'Jelly Bean',
      lastUpdate: '2025-07-05T12:00:00Z',
    },
    {
      id:         'gi-007',
      name:       '04_final',
      thumbnail:  IMG.final_04,
      dimensions: '1080 x 1080',
      status:     'Main',
      filters: [
        '2024 · Yamaha · Raptor 700R · SE · Brown',
        '2024 · Yamaha · Raptor 700R · SE · Gray',
      ],
      imageType:  'Real Image',
      lastUpdate: '2025-07-05T12:00:00Z',
    },
  ],
};

// Fallback empty list for VINs without data
export function getGeneratedConfigs(vin: string): GeneratedImageConfig[] {
  return VIN_GENERATED_CONFIGS[vin] ?? [];
}
