// ─── VehicleInventoryGrid ─────────────────────────────────────────────────────
// Data grid for the Inventory > Vehicles tab (RideNow).
// Mirrors Figma node 3556:990943 — columns, chips, disabled-row styling,
// AI-config badge on thumbnail, and drag-to-resize column headers.

import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { MoreVertical, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { emitSnackbar } from '../Snackbar';
import { VehiclesMenu, type VehiclesMenuAnchor, type VehiclesMenuAction } from './VehiclesMenu';
import { useInventory } from '../../contexts/InventoryContext';
import type {
  VinInventoryRecord,
  AIGenerationStatus,
  SyndicationStatus,
  PriceToMarket,
} from '../../../data/inventory/vehicleInventory';

// ─── Typography constants (from Figma) ───────────────────────────────────────
const BODY2 = "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.43] tracking-[0.17px]";
const CAPTION = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";
const HEADER_LABEL = "font-['Roboto',sans-serif] font-medium text-[14px] leading-[24px] tracking-[0.17px] text-[#1f1d25] whitespace-nowrap";

// ─── Sort Icon ────────────────────────────────────────────────────────────────
function ArrowDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"
      className="shrink-0 text-[rgba(17,16,20,0.56)]">
      <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
    </svg>
  );
}

// ─── Chevron expand icon ──────────────────────────────────────────────────────
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="rgba(17,16,20,0.56)" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={cn('transition-transform duration-300 ease-out', className)}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ─── Header Divider ─── drag-to-resize previous column ────────────────────────
function HeaderDivider({
  prevWidth,
  onPrevWidthChange,
}: {
  prevWidth: number;
  onPrevWidthChange: (w: number) => void;
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startW = prevWidth;
    const onMove = (ev: MouseEvent) =>
      onPrevWidthChange(Math.max(40, startW + (ev.clientX - startX)));
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  return (
    <div className="w-[8px] h-full shrink-0 flex items-center justify-center cursor-col-resize group/dv"
      onMouseDown={handleMouseDown}>
      <div className="w-[1px] h-[24px] bg-[rgba(0,0,0,0.12)] group-hover/dv:bg-[#6356e1] transition-colors" />
    </div>
  );
}

// ─── AI Generation Chip ───────────────────────────────────────────────────────
// Enabled → green; Disabled → muted gray (from Figma component "Status")
export function AIGenerationChip({ status }: { status: AIGenerationStatus }) {
  if (status === 'enabled') {
    return (
      <span className="inline-flex items-center gap-[4px] rounded-[8px] pl-[6px] pr-[8px] py-[3px] bg-[rgb(232,245,233)] whitespace-nowrap select-none">
        {/* Checkmark SVG — Figma: checkmark 14×14 */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <path d="M8.75065 5.54183L6.12565 8.75016L4.95898 7.5835M12.5423 7.00016C12.5423 10.0607 10.0612 12.5418 7.00065 12.5418C3.94007 12.5418 1.45898 10.0607 1.45898 7.00016C1.45898 3.93958 3.94007 1.4585 7.00065 1.4585C10.0612 1.4585 12.5423 3.93958 12.5423 7.00016Z"
            stroke="#4CAF50" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={cn(CAPTION, 'text-[#1b5e20]')}>Enabled</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[4px] rounded-[8px] pl-[6px] pr-[8px] py-[3px] bg-[rgba(17,16,20,0.08)] whitespace-nowrap select-none">
      {/* Pause bars — Figma: pause icon 14×14 */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
        <path d="M2.625 2.625H5.25V11.375H2.625V2.625ZM8.75 2.625H11.375V11.375H8.75V2.625Z"
          stroke="#686576" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      <span className={cn(CAPTION, 'text-[#686576]')}>Disabled</span>
    </span>
  );
}

// ─── Syndication Chip ─────────────────────────────────────────────────────────
// Icon: live-full, signal.svg — concentric arcs + center dot
export function SyndicationChip({ status }: { status: SyndicationStatus }) {
  const fill = status === 'syndicated' ? '#6356E1' : '#686576';
  const icon = (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M3.49401 2.8757C3.66486 3.04655 3.66486 3.32356 3.49401 3.49442C2.59625 4.39218 2.04175 5.63116 2.04175 7.00049C2.04175 8.36982 2.59625 9.6088 3.49401 10.5066C3.66486 10.6774 3.66486 10.9544 3.49401 11.1253C3.32316 11.2961 3.04615 11.2961 2.87529 11.1253C1.82015 10.0701 1.16675 8.6112 1.16675 7.00049C1.16675 5.38978 1.82015 3.93085 2.87529 2.8757C3.04615 2.70485 3.32316 2.70485 3.49401 2.8757ZM10.5062 2.8757C10.677 2.70485 10.954 2.70484 11.1249 2.8757C12.18 3.93085 12.8334 5.38978 12.8334 7.00049C12.8334 8.6112 12.18 10.0701 11.1249 11.1253C10.954 11.2961 10.677 11.2961 10.5062 11.1253C10.3353 10.9544 10.3353 10.6774 10.5062 10.5066C11.4039 9.6088 11.9584 8.36982 11.9584 7.00049C11.9584 5.63116 11.4039 4.39218 10.5062 3.49442C10.3353 3.32356 10.3353 3.04655 10.5062 2.8757ZM5.18976 4.57145C5.36061 4.7423 5.36061 5.01931 5.18976 5.19016C4.72598 5.65395 4.4399 6.29339 4.4399 7.00049C4.4399 7.70759 4.72598 8.34703 5.18976 8.81081C5.36061 8.98167 5.36061 9.25868 5.18976 9.42953C5.0189 9.60039 4.74189 9.60039 4.57104 9.42953C3.94987 8.80836 3.5649 7.94897 3.5649 7.00049C3.5649 6.05201 3.94987 5.19261 4.57104 4.57145C4.74189 4.40059 5.0189 4.40059 5.18976 4.57145ZM8.81041 4.57145C8.98126 4.40059 9.25827 4.40059 9.42912 4.57145C10.0503 5.19261 10.4353 6.05201 10.4353 7.00049C10.4353 7.94897 10.0503 8.80836 9.42912 9.42953C9.25827 9.60039 8.98126 9.60039 8.81041 9.42953C8.63955 9.25868 8.63955 8.98167 8.81041 8.81081C9.27419 8.34703 9.56027 7.70759 9.56027 7.00049C9.56027 6.29339 9.27419 5.65395 8.81041 5.19016C8.63955 5.01931 8.63955 4.7423 8.81041 4.57145ZM6.12508 7.00006C6.12508 6.51681 6.51683 6.12506 7.00008 6.12506C7.48333 6.12506 7.87508 6.51681 7.87508 7.00006C7.87508 7.48331 7.48333 7.87506 7.00008 7.87506C6.51683 7.87506 6.12508 7.48331 6.12508 7.00006Z"
        fill={fill}
      />
    </svg>
  );
  if (status === 'syndicated') {
    return (
      <span className="inline-flex items-center gap-[4px] rounded-[8px] pl-[6px] pr-[8px] py-[3px] bg-[rgba(99,86,225,0.12)] whitespace-nowrap select-none">
        {icon}
        <span className={cn(CAPTION, 'text-[#6356e1]')}>Syndicated</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[4px] rounded-[8px] pl-[6px] pr-[8px] py-[3px] bg-[rgba(17,16,20,0.08)] whitespace-nowrap select-none">
      {icon}
      <span className={cn(CAPTION, 'text-[#686576]')}>Not syndicated</span>
    </span>
  );
}

// ─── Price to Market Chip ─────────────────────────────────────────────────────
// Outlined chip (border, no fill). Icon + muted label.
// Figma border colors per tier:
//   well-above → #02292c  above → #0a7870  close → #616161  below → #d43b2f  well-below → #640808

const PTM_CONFIG: Record<PriceToMarket, { label: string; border: string; icon: React.ReactNode }> = {
  'well-above': {
    label: 'Well above market',
    border: '#02292c',
    icon: (
      // double chevron up
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#686576"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M17 11l-5-5-5 5M17 18l-5-5-5 5" />
      </svg>
    ),
  },
  'above': {
    label: 'Above Market',
    border: '#0a7870',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#686576"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    ),
  },
  'close': {
    label: 'Close to Market',
    border: '#616161',
    icon: (
      // equals sign
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M5 9h14M5 15h14" stroke="#686576" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  'below': {
    label: 'Below Market',
    border: '#d43b2f',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#686576"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M6 9l6 6 6-6" />
      </svg>
    ),
  },
  'well-below': {
    label: 'Well below market',
    border: '#640808',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#686576"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M17 6l-5 5-5-5M17 13l-5 5-5-5" />
      </svg>
    ),
  },
};

export function PriceToMarketChip({ value }: { value: PriceToMarket }) {
  const { label, border, icon } = PTM_CONFIG[value];
  return (
    <span
      className="inline-flex items-center gap-[4px] rounded-[8px] pl-[6px] pr-[8px] py-[3px] border border-solid whitespace-nowrap select-none"
      style={{ borderColor: border }}
    >
      {icon}
      <span className={cn(CAPTION, 'text-[#686576]')}>{label}</span>
    </span>
  );
}

// ─── Priority Score Chip ──────────────────────────────────────────────────────
// Figma: colored rectangle chip (rounded-8px) with white number.
// Score → color mapping (divergent dataviz palette):
const PRIORITY_COLORS: Record<number, string> = {
  1: '#640808', // Maximize Spending — dark red
  2: '#b52520', // Increase Spending — red
  3: '#e55e50', // Boost Spending    — orange-red
  4: '#616161', // Maintain Spending — gray
  5: '#109890', // Decrease Spending — teal
  6: '#065c56', // Minimize Spending — dark teal
  7: '#02292c', // Cease Spending    — very dark teal
};

export function PriorityScoreChip({ score }: { score: number }) {
  const bg = PRIORITY_COLORS[score] ?? '#616161';
  return (
    <span
      className="inline-flex items-center justify-center p-[2px] rounded-[8px] select-none"
      style={{ backgroundColor: bg }}
    >
      <span className="px-[6px] font-['Roboto',sans-serif] font-normal text-[13px] leading-[18px] tracking-[0.16px] text-white whitespace-nowrap">
        {score}
      </span>
    </span>
  );
}

// ─── Thumbnail image ─────────────────────────────────────────────────────────
// Two variants:
//
//  cover=true  (AI-generated image WITH background scene):
//    img fills the full 76×76 cell edge-to-edge — object-cover, no padding.
//
//  cover=false (plain vehicle photo — transparent PNG):
//    outer div  76×76  bg-[#f0f2f4]  p-[8px]  — shows the grey bg + padding
//    inner div  60×60  overflow-hidden          — clips the scaled image
//    img        60×60  object-contain + dynamic scale so short side fills box
//    Scale = (long/short) × 0.80 — normalises any aspect ratio without hard-coding.
function ThumbnailImg({ src, alt, cover, fallbackSrc }: { src: string; alt: string; cover?: boolean; fallbackSrc?: string }) {
  const [scale,      setScale]      = useState(1);
  const [imgSrc,     setImgSrc]     = useState(src);
  const [isFallback, setIsFallback] = useState(false);

  // Reset when the intended src changes (e.g. different row re-uses the component)
  React.useEffect(() => { setImgSrc(src); setIsFallback(false); }, [src]);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (cover && !isFallback) return;           // cover mode shows full-bleed — no scale calc
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (!w || !h) return;
    setScale((Math.max(w, h) / Math.min(w, h)) * 0.80);
  }, [cover, isFallback]);

  const handleError = useCallback(() => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setIsFallback(true);      // switch to contain mode so jellybean shows on gray bg
    }
  }, [fallbackSrc, imgSrc]);

  // Show cover only when we have the real AI-generated image (not the fallback jellybean)
  if (cover && !isFallback) {
    return (
      <div className="size-[76px] overflow-hidden">
        <img src={imgSrc} alt={alt} onError={handleError} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="size-[76px] bg-[#f0f2f4] flex items-center justify-center p-[8px]">
      <div className="size-[60px] overflow-hidden flex items-center justify-center">
        <img
          src={imgSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className="w-full h-full object-contain"
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}

// ─── AI Config Badge ──────────────────────────────────────────────────────────
// 24×24 circular white button with elevation shadow, shown when aiConfigApplied=true.
// Icon: sparkle (AI) from _Icon_.svg — 16×16 inside 4px padding.
// Shadow matches Figma CommentsIcon/Small elevation:
//   0px 0.8px 4px rgba(0,0,0,0.12) | 0px 1.6px 1.6px rgba(0,0,0,0.14) | 0px 2.4px 0.8px -2px rgba(0,0,0,0.20)
function AIConfigBadge() {
  return (
    <div className="absolute bottom-[-4px] right-[-8px] z-[1] size-[24px]">
      <div className="size-[24px] bg-white flex items-center justify-center overflow-clip p-[4px] rounded-[100px] shadow-[0px_0.8px_4px_0px_rgba(0,0,0,0.12),0px_1.6px_1.6px_0px_rgba(0,0,0,0.14),0px_2.4px_0.8px_-2px_rgba(0,0,0,0.20)]">
        {/* Sparkle / AI icon — _Icon_.svg */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M7.83008 3.11023C7.80147 2.85767 7.58794 2.66676 7.33376 2.6665C7.07959 2.66624 6.86567 2.85672 6.83655 3.10921C6.64717 4.75111 6.15627 5.90564 5.36433 6.69758C4.57239 7.48952 3.41786 7.98042 1.77596 8.1698C1.52346 8.19892 1.33299 8.41284 1.33325 8.66702C1.33351 8.92119 1.52442 9.13472 1.77698 9.16333C3.39174 9.34623 4.57081 9.83693 5.38155 10.633C6.18924 11.4261 6.69039 12.5804 6.83521 14.2107C6.85815 14.4689 7.0746 14.6668 7.33381 14.6665C7.59303 14.6662 7.80903 14.4679 7.83139 14.2096C7.9702 12.6061 8.47087 11.4275 9.28257 10.6158C10.0943 9.80412 11.2728 9.30345 12.8764 9.16464C13.1346 9.14229 13.333 8.92628 13.3333 8.66707C13.3335 8.40785 13.1357 8.1914 12.8775 8.16846C11.2471 8.02364 10.0928 7.5225 9.29976 6.7148C8.50367 5.90406 8.01298 4.72499 7.83008 3.11023Z" fill="#473BAB"/>
          <path d="M13.1931 0.839064C13.182 0.740847 13.099 0.666605 13.0001 0.666504C12.9013 0.666403 12.8181 0.740475 12.8068 0.838669C12.7331 1.47718 12.5422 1.92617 12.2342 2.23415C11.9263 2.54212 11.4773 2.73303 10.8388 2.80667C10.7406 2.818 10.6665 2.90119 10.6666 3.00004C10.6667 3.09888 10.7409 3.18192 10.8391 3.19305C11.4671 3.26418 11.9256 3.455 12.2409 3.76459C12.555 4.07301 12.7499 4.5219 12.8062 5.15593C12.8152 5.25634 12.8993 5.33328 13.0001 5.33317C13.1009 5.33306 13.1849 5.25592 13.1936 5.1555C13.2476 4.5319 13.4423 4.07357 13.758 3.75791C14.0736 3.44225 14.532 3.24754 15.1556 3.19356C15.256 3.18486 15.3331 3.10086 15.3333 3.00006C15.3334 2.89925 15.2564 2.81507 15.156 2.80616C14.522 2.74983 14.0731 2.55495 13.7647 2.24084C13.4551 1.92555 13.2643 1.46703 13.1931 0.839064Z" fill="#473BAB"/>
          <path d="M7.33325 2.86084C7.48858 2.861 7.61948 2.97798 7.63696 3.13232C7.82292 4.77374 8.32511 5.9994 9.16138 6.85107C9.99584 7.70079 11.1989 8.21421 12.8606 8.36182C13.0181 8.37595 13.1389 8.50834 13.1389 8.6665C13.1387 8.82491 13.0174 8.95753 12.8596 8.97119C11.2244 9.11274 9.99753 9.62528 9.14478 10.478C8.29203 11.3308 7.77949 12.5577 7.63794 14.1929C7.62428 14.3507 7.49166 14.472 7.33325 14.4722C7.17509 14.4722 7.0427 14.3514 7.02856 14.1938C6.88096 12.5322 6.36754 11.3291 5.51782 10.4946C4.66615 9.65836 3.44048 9.15617 1.79907 8.97021C1.64473 8.95273 1.52775 8.82183 1.52759 8.6665C1.52759 8.51135 1.64396 8.38063 1.7981 8.36279C3.46655 8.17035 4.66897 7.66868 5.5022 6.83545C6.33543 6.00222 6.8371 4.7998 7.02954 3.13135C7.04738 2.97721 7.1781 2.86084 7.33325 2.86084ZM13.0002 0.86084C13.0744 1.51556 13.2764 2.02119 13.6262 2.37744C13.976 2.73348 14.4737 2.94042 15.1389 2.99951C14.4837 3.05623 13.9771 3.26389 13.6204 3.62061C13.2637 3.97731 13.057 4.484 13.0002 5.13916C12.9411 4.47371 12.7334 3.97529 12.3772 3.62549C12.021 3.27577 11.5152 3.07366 10.8606 2.99951C11.5256 2.92281 12.0221 2.72075 12.3713 2.37158C12.7206 2.02232 12.9235 1.52592 13.0002 0.86084Z" stroke="#111014" strokeOpacity="0.56" strokeWidth="0.388889"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Column widths ────────────────────────────────────────────────────────────
interface ColWidths {
  expand:        number;
  checkbox:      number;
  thumbnail:     number;
  vin:           number;
  condition:     number;
  year:          number;
  make:          number;
  model:         number;
  trim:          number;
  price:         number;
  aiGeneration:  number;
  syndication:   number;
  exteriorColor: number;
  vehicleStatus: number;
  dol:           number;
  priceToMarket: number;
  priorityScore: number;
}

const DEFAULT_WIDTHS: ColWidths = {
  expand:        24,
  checkbox:      42,
  thumbnail:     76,
  vin:           190,
  condition:     90,
  year:          80,
  make:          100,
  model:         110,
  trim:          120,
  price:         100,
  aiGeneration:  140,
  syndication:   145,
  exteriorColor: 155,
  vehicleStatus: 130,
  dol:           80,
  priceToMarket: 175,
  priorityScore: 130,
};

// ─── VehicleInventoryGrid ─────────────────────────────────────────────────────
interface VehicleInventoryGridProps {
  records:               VinInventoryRecord[];
  selected:              Set<string>;
  onToggleRow:           (id: string, checked: boolean) => void;
  onToggleAll:           (checked: boolean) => void;
  /** Opens the VIN Detail view for the given record id */
  onVinClick?:           (id: string) => void;
  /** Toggles syndication on/off for the given record id */
  onSyndicationToggle?:    (id: string) => void;
  /** Toggles AI generation on/off for the given record id */
  onAiGenerationToggle?:   (id: string) => void;
  /** Opens the source images lightbox for the given record id */
  onViewSourceImages?:     (id: string) => void;
  /** Opens the comments panel with the vehicle attached */
  onAttachComment?:        (id: string) => void;
}

export function VehicleInventoryGrid({
  records,
  selected,
  onToggleRow,
  onToggleAll,
  onVinClick,
  onSyndicationToggle,
  onAiGenerationToggle,
  onViewSourceImages,
  onAttachComment,
}: VehicleInventoryGridProps) {
  const { removeConfigFromVin } = useInventory();
  const allSelected = records.length > 0 && records.every(r => selected.has(r.id));
  const [widths, setWidths] = useState<ColWidths>(DEFAULT_WIDTHS);

  // ── Kebab menu state ───────────────────────────────────────────────────────
  const [openMenu, setOpenMenu] = useState<{
    recordId: string;
    anchor: VehiclesMenuAnchor;
    syndicationStatus: SyndicationStatus;
    aiGenerationStatus: AIGenerationStatus;
    aiConfigApplied: boolean;
  } | null>(null);

  const handleMenuAction = useCallback((action: VehiclesMenuAction) => {
    if (!openMenu) return;
    const { recordId, syndicationStatus, aiGenerationStatus } = openMenu;
    if (action === 'removeAiConfig') {
      removeConfigFromVin(recordId);
      emitSnackbar('AI Config removed from VIN');
      setOpenMenu(null);
      return;
    }
    if (action === 'vinDetails')       { onVinClick?.(recordId); }
    if (action === 'syndicate')        {
      onSyndicationToggle?.(recordId);
      emitSnackbar(syndicationStatus === 'syndicated' ? 'Syndication disabled' : 'Syndication enabled');
    }
    if (action === 'disableAiImage')   {
      onAiGenerationToggle?.(recordId);
      emitSnackbar(aiGenerationStatus === 'enabled' ? 'AI Image disabled' : 'AI Image enabled');
    }
    if (action === 'viewSourceImages') { onViewSourceImages?.(recordId); }
    if (action === 'attachComment')    { onAttachComment?.(recordId); }
  }, [openMenu, onVinClick, onSyndicationToggle, onAiGenerationToggle, onViewSourceImages, onAttachComment]);

  const setW = (key: keyof ColWidths) => (val: number) =>
    setWidths(prev => ({ ...prev, [key]: val }));

  const w = (key: keyof ColWidths): React.CSSProperties => ({
    width:    widths[key],
    minWidth: widths[key],
  });

  // ── Header cell helper ────────────────────────────────────────────────────
  const Th = ({
    label,
    colKey,
    prevKey,
  }: {
    label:   string;
    colKey:  keyof ColWidths;
    prevKey: keyof ColWidths;
  }) => (
    <th className="text-left h-[52px] p-0" style={w(colKey)}>
      <div className="flex items-center h-full">
        <HeaderDivider prevWidth={widths[prevKey]} onPrevWidthChange={setW(prevKey)} />
        <div className="flex items-center gap-1 pr-[16px] py-[16px] flex-1 min-w-0">
          <span className={HEADER_LABEL}>{label}</span>
          <ArrowDownIcon />
        </div>
      </div>
    </th>
  );

  return (
    <>
    <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
      <table
        className="border-collapse"
        style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}
      >
        {/* ── Sticky Header ── */}
        <thead className="sticky top-0 z-10 bg-white border-b border-[rgba(0,0,0,0.12)]">
          <tr className="h-[52px]">

            {/* Expand — no label */}
            <th className="shrink-0 pl-2" style={w('expand')} />

            {/* Checkbox — select-all */}
            <th className="px-1" style={w('checkbox')}>
              <div className="p-[9px]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => onToggleAll(e.target.checked)}
                  className="w-[14px] h-[14px] accent-[#473bab] cursor-pointer"
                />
              </div>
            </th>

            {/* Thumbnail — invisible per Figma spec */}
            <th style={{ ...w('thumbnail'), opacity: 0 }} />

            {/* VIN */}
            <Th label="VIN"            colKey="vin"           prevKey="thumbnail" />
            <Th label="Condition"      colKey="condition"     prevKey="vin" />
            <Th label="Year"           colKey="year"          prevKey="condition" />
            <Th label="Make"           colKey="make"          prevKey="year" />
            <Th label="Model"          colKey="model"         prevKey="make" />
            <Th label="Trim"           colKey="trim"          prevKey="model" />
            <Th label="Price"          colKey="price"         prevKey="trim" />
            <Th label="AI Generation"  colKey="aiGeneration"  prevKey="price" />
            <Th label="Syndication"    colKey="syndication"   prevKey="aiGeneration" />
            <Th label="Exterior Color" colKey="exteriorColor" prevKey="syndication" />
            <Th label="Vehicle Status" colKey="vehicleStatus" prevKey="exteriorColor" />
            <Th label="DOL"            colKey="dol"           prevKey="vehicleStatus" />

            {/* Price to Market */}
            <th className="text-left h-[52px] p-0" style={w('priceToMarket')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.dol} onPrevWidthChange={setW('dol')} />
                <div className="flex items-center gap-1 pr-[16px] py-[16px] flex-1 min-w-0 justify-center">
                  <span className={HEADER_LABEL}>Price to Market</span>
                  <ArrowDownIcon />
                </div>
              </div>
            </th>

            {/* Priority Score — includes info icon per Figma */}
            <th className="text-left h-[52px] p-0" style={w('priorityScore')}>
              <div className="flex items-center h-full">
                <HeaderDivider prevWidth={widths.priceToMarket} onPrevWidthChange={setW('priceToMarket')} />
                <div className="flex items-center gap-1 pr-[16px] py-[16px] flex-1 min-w-0">
                  <span className={HEADER_LABEL}>Priority Score</span>
                  <ArrowDownIcon />
                  {/* Info icon per Figma (InfoOutlined 12×12) */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    className="shrink-0 text-[rgba(17,16,20,0.38)]" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
              </div>
            </th>

            {/* Sticky kebab column — zero-width, no label */}
            <th className="sticky right-0 z-[11] bg-white p-0" style={{ width: 0, minWidth: 0 }} />

          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {records.map(record => {
            const isSelected = selected.has(record.id);
            const isDisabled = record.aiGeneration === 'disabled';

            return (
              <tr
                key={record.id}
                className={cn(
                  'group h-[90px] transition-colors border-b border-[rgba(0,0,0,0.12)]',
                  // Disabled rows: muted bg (matches Figma: rgba(31,29,37,0.04))
                  isDisabled && !isSelected
                    ? 'bg-[rgba(31,29,37,0.04)] hover:bg-[rgba(31,29,37,0.06)]'
                    : isSelected
                      ? 'bg-[rgba(99,86,225,0.08)] hover:bg-[rgba(99,86,225,0.12)]'
                      : 'bg-white hover:bg-[rgba(31,29,37,0.04)]',
                )}
              >
                {/* Expand chevron — no children yet, muted */}
                <td className="pl-2 pr-0" style={w('expand')}>
                  <ChevronRightIcon className={cn(isDisabled && 'opacity-50')} />
                </td>

                {/* Checkbox */}
                <td className="px-1" style={w('checkbox')}>
                  <div className="p-[9px]">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => { e.stopPropagation(); onToggleRow(record.id, e.target.checked); }}
                      className="w-[14px] h-[14px] accent-[#473bab] cursor-pointer"
                    />
                  </div>
                </td>

                {/* Thumbnail — 76×76; opacity-50 if disabled */}
                {/* motion.div carries layoutId so the thumbnail morphs to the card image when switching views */}
                <td style={w('thumbnail')}>
                  <motion.div
                    layoutId={`thumb-${record.id}`}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
                    className={cn('relative size-[76px]', isDisabled && 'opacity-50')}
                  >
                    <ThumbnailImg
                      src={
                        record.aiConfigApplied && record.vehicleGroup?.angles?.['34l']
                          ? record.vehicleGroup.angles['34l'] as string
                          : record.thumbnail
                      }
                      alt={`${record.make} ${record.model}`}
                      cover={!!(record.aiConfigApplied && record.vehicleGroup?.angles?.['34l'])}
                      fallbackSrc={record.thumbnail}
                    />
                    {record.aiGeneration === 'enabled' && <AIConfigBadge />}
                  </motion.div>
                </td>

                {/* VIN — always primary purple, always clickable → opens VIN Detail page */}
                <td className="px-4" style={w('vin')}>
                  <div className={cn(isDisabled && 'opacity-50')}>
                    <motion.button
                      layoutId={`vin-${record.id}`}
                      transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
                      onClick={() => onVinClick?.(record.id)}
                      className={cn(
                        BODY2,
                        'overflow-hidden text-ellipsis whitespace-nowrap text-left',
                        'text-[#473bab] hover:underline cursor-pointer bg-transparent border-none p-0',
                      )}
                    >
                      {record.vin}
                    </motion.button>
                  </div>
                </td>

                {/* Condition — shares layoutId with card subtitle so it morphs during view transition */}
                <td className="px-4" style={w('condition')}>
                  <motion.p
                    layoutId={`subtitle-${record.id}`}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
                    className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap', isDisabled && 'opacity-50')}
                  >
                    {record.condition}
                  </motion.p>
                </td>

                {/* Year */}
                <td className="px-4" style={w('year')}>
                  <p className={cn(BODY2, 'text-[#1f1d25]', isDisabled && 'opacity-50')}>
                    {record.year}
                  </p>
                </td>

                {/* Make */}
                <td className="px-4" style={w('make')}>
                  <p className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap', isDisabled && 'opacity-50')}>
                    {record.make}
                  </p>
                </td>

                {/* Model */}
                <td className="px-4" style={w('model')}>
                  <p className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap', isDisabled && 'opacity-50')}>
                    {record.model}
                  </p>
                </td>

                {/* Trim */}
                <td className="px-4" style={w('trim')}>
                  <p className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap', isDisabled && 'opacity-50')}>
                    {record.trim}
                  </p>
                </td>

                {/* Price */}
                <td className="px-4" style={w('price')}>
                  <p className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap', isDisabled && 'opacity-50')}>
                    ${record.price.toLocaleString()}
                  </p>
                </td>

                {/* AI Generation chip — always full opacity (shows status) */}
                <td className="px-4" style={w('aiGeneration')}>
                  <AIGenerationChip status={record.aiGeneration} />
                </td>

                {/* Syndication chip — always full opacity */}
                <td className="px-4" style={w('syndication')}>
                  <SyndicationChip status={record.syndication} />
                </td>

                {/* Exterior Color */}
                <td className="px-4" style={w('exteriorColor')}>
                  <p className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap', isDisabled && 'opacity-50')}>
                    {record.exteriorColor}
                  </p>
                </td>

                {/* Vehicle Status */}
                <td className="px-4" style={w('vehicleStatus')}>
                  <p className={cn(BODY2, 'text-[#1f1d25] whitespace-nowrap', isDisabled && 'opacity-50')}>
                    {record.vehicleStatus}
                  </p>
                </td>

                {/* DOL */}
                <td className="px-4" style={w('dol')}>
                  <p className={cn(BODY2, 'text-[#1f1d25]', isDisabled && 'opacity-50')}>
                    {record.dol}
                  </p>
                </td>

                {/* Price to Market chip — always full opacity */}
                <td className="px-4" style={w('priceToMarket')}>
                  <div className={cn('flex items-center justify-center', isDisabled && 'opacity-50')}>
                    <PriceToMarketChip value={record.priceToMarket} />
                  </div>
                </td>

                {/* Priority Score chip */}
                <td className="px-4" style={w('priorityScore')}>
                  <div className={cn(isDisabled && 'opacity-50')}>
                    <PriorityScoreChip score={record.priorityScore} />
                  </div>
                </td>

                {/* Sticky kebab overlay — sticks to right edge of the visible pane */}
                {(() => {
                  const hoverBg = isSelected
                    ? 'rgba(99,86,225,0.12)'
                    : isDisabled
                      ? 'rgba(31,29,37,0.06)'
                      : 'rgba(31,29,37,0.04)';
                  return (
                    <td className="sticky right-0 z-[2] p-0 border-0" style={{ width: 0, minWidth: 0 }}>
                      <div className="invisible group-hover:visible absolute right-0 top-0 bottom-0 flex items-center pointer-events-none">
                        {/* Gradient fade */}
                        <div
                          className="h-full w-[80px] flex-none"
                          style={{ background: `linear-gradient(to right, transparent, ${hoverBg})` }}
                        />
                        {/* Solid bg + kebab button */}
                        <div
                          className="h-full flex items-center pr-2 flex-none pointer-events-auto"
                          style={{ backgroundColor: hoverBg }}
                        >
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                              setOpenMenu({
                                recordId: record.id,
                                syndicationStatus: record.syndication,
                                aiGenerationStatus: record.aiGeneration,
                                // Show "Remove AI Config" whenever there's a vehicleGroup
                                // (covers static-seed VINs where aiConfigApplied=false but vehicleGroup exists)
                                aiConfigApplied: !!(record.aiConfigApplied || record.vehicleGroup),
                                anchor: {
                                  top:   rect.bottom + 4,
                                  right: window.innerWidth - rect.right,
                                },
                              });
                            }}
                            className="w-8 h-8 flex items-center justify-center text-[rgba(17,16,20,0.56)] bg-white hover:bg-[rgba(255,255,255,0.92)] active:bg-[rgba(255,255,255,0.9)] transition-colors cursor-pointer"
                            style={{ borderRadius: 200 }}
                          >
                            {openMenu?.recordId === record.id
                              ? <X size={16} />
                              : <MoreVertical size={16} />
                            }
                          </button>
                        </div>
                      </div>
                    </td>
                  );
                })()}

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* Kebab menu portal — renders above everything, anchored to the clicked button */}
    {openMenu && (
      <VehiclesMenu
        anchor={openMenu.anchor}
        syndicationStatus={openMenu.syndicationStatus}
        aiGenerationStatus={openMenu.aiGenerationStatus}
        aiConfigApplied={openMenu.aiConfigApplied}
        onAction={handleMenuAction}
        onClose={() => setOpenMenu(null)}
      />
    )}
    </>
  );
}
