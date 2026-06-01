// ─── AngleStripVin ─────────────────────────────────────────────────────────────
// Compact 64×64 angle strip for the VIN Details page.
// Variant of AnglesSource (Global AI Config) — same drag, star/hero, Eye+Pencil
// rover, and AnglePreviewModal, scaled down to 64px thumbnails with 16px gaps.
//
// Differences from AnglesSource:
//   • No "Angles N items" header
//   • 64×64 thumbnails (vs 90×90)
//   • CARD_STEP = 80 px (64 + 16 gap)
//   • `activeKey` / `onActiveChange` for hero-preview sync with parent
//   • `showSource` controls which image set the thumbnails display

import { useState, useMemo } from 'react';
import { Eye, Pencil } from 'lucide-react';
import type { AngleKey, VehicleGroup } from '../../../data/inventory/types';
import { AnglePreviewModal } from './AnglePreviewModal';

// ─── Default angle placeholder images (same mapping as AnglesSource) ──────────
const angle34L = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071184/vw-funds/inventory/angles/angle-34-l.png';
const angleFront = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071191/vw-funds/inventory/angles/angle-right.png';
const angle34R = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071186/vw-funds/inventory/angles/angle-34-r.png';
const angleRight = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071189/vw-funds/inventory/angles/angle-left.png';
const angleRear = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071190/vw-funds/inventory/angles/angle-rear.png';
const angleLeft = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071187/vw-funds/inventory/angles/angle-34-rear.png';
// ─── Card geometry ─────────────────────────────────────────────────────────────
const CARD_W    = 64;
const CARD_GAP  = 16;
const CARD_STEP = CARD_W + CARD_GAP; // 80
const CHIP_H    = 24;
const CHIP_GAP  = 4;
const ROW_H     = CARD_W + CHIP_GAP + CHIP_H; // 92
const ROW_W     = 6 * CARD_STEP - CARD_GAP;    // 464

// elevation/2 shadow (same as AngleCard)
const ELEV2 =
  'shadow-[0px_1px_5px_0px_rgba(0,0,0,0.12),0px_2px_2px_0px_rgba(0,0,0,0.14),0px_3px_1px_-2px_rgba(0,0,0,0.2)]';

// ─── Angle config ──────────────────────────────────────────────────────────────
interface AngleCfg { key: AngleKey; label: string; defaultSrc: string; }
const ANGLE_CONFIGS: AngleCfg[] = [
  { key: '34l',   label: '3/4 L',  defaultSrc: angle34L   },
  { key: 'front', label: 'Front',  defaultSrc: angleFront },
  { key: '34r',   label: '3/4 R',  defaultSrc: angle34R   },
  { key: 'right', label: 'Right',  defaultSrc: angleRight },
  { key: 'rear',  label: 'Rear',   defaultSrc: angleRear  },
  { key: 'left',  label: 'Left',   defaultSrc: angleLeft  },
];

// ─── AngleCardSm ──────────────────────────────────────────────────────────────
// 64×64 inline card — self-contained so AnglesSource/AngleCard stay untouched.
interface AngleCardSmProps {
  label: string;
  src: string | null;
  defaultSrc: string;
  isHero: boolean;
  isGhost: boolean;
  isActive: boolean;
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver:  (e: React.DragEvent) => void;
  onDrop:      (e: React.DragEvent) => void;
  onDragEnd:   (e: React.DragEvent) => void;
  onPreview:   () => void;
  onSelect:    () => void;
}

function AngleCardSm({
  label, src, defaultSrc,
  isHero, isGhost, isActive,
  draggable, onDragStart, onDragOver, onDrop, onDragEnd,
  onPreview, onSelect,
}: AngleCardSmProps) {
  const [chipHovered, setChipHovered] = useState(false);

  return (
    <div
      className={[
        'flex flex-col items-center gap-[4px] cursor-grab active:cursor-grabbing group/angle select-none transition-opacity duration-150',
        isGhost ? 'opacity-40 scale-95' : 'opacity-100',
      ].join(' ')}
      style={{ width: CARD_W }}
      onClick={onSelect}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* ── Image container ── */}
      <div
        className={[
          `relative w-full rounded-[6px] bg-[#f4f5f6] overflow-visible shrink-0`,
          'border transition-all duration-150',
          isActive
            ? 'border-[#473bab] ring-[2px] ring-[#473bab]/30'
            : 'border-transparent group-hover/angle:border-[rgba(0,0,0,0.12)]',
        ].join(' ')}
        style={{ height: CARD_W }}
      >
        <div className="absolute inset-0 rounded-[6px] overflow-hidden">
          <img
            src={src ?? defaultSrc}
            alt={label}
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).src = defaultSrc; }}
          />
        </div>


        {/* ── Hover rover: Eye + Pencil ── */}
        <div className="absolute inset-0 flex flex-wrap gap-[3px] items-start justify-end p-[4px] opacity-0 group-hover/angle:opacity-100 transition-opacity rounded-[6px] overflow-hidden">
          <button
            onClick={e => { e.stopPropagation(); onPreview(); }}
            title="Preview"
            className={`bg-white p-[4px] rounded-full flex items-center justify-center shrink-0 ${ELEV2} hover:bg-[rgba(17,16,20,0.04)] transition-colors cursor-pointer`}
          >
            <Eye size={12} className="text-[rgba(17,16,20,0.72)]" />
          </button>
          <button
            onClick={e => e.stopPropagation()}
            title="Edit"
            className={`bg-white p-[4px] rounded-full flex items-center justify-center shrink-0 ${ELEV2} hover:bg-[rgba(17,16,20,0.04)] transition-colors cursor-pointer`}
          >
            <Pencil size={12} className="text-[rgba(17,16,20,0.72)]" />
          </button>
        </div>
      </div>

      {/* ── Label chip ── */}
      <div
        className="relative h-[24px] rounded-[8px] bg-[rgba(17,16,20,0.04)] flex items-center justify-center gap-[3px] px-[5px] shrink-0 overflow-visible min-w-[38px]"
        onMouseEnter={() => setChipHovered(true)}
        onMouseLeave={() => setChipHovered(false)}
      >
        {/* Slide-up tooltip */}
        <div
          className="absolute left-1/2 z-30 pointer-events-none"
          style={{
            bottom: 'calc(100% + 6px)',
            transform: `translateX(-50%) translateY(${chipHovered ? '0px' : '8px'})`,
            opacity: chipHovered ? 1 : 0,
            transition: 'opacity 450ms ease, transform 450ms ease',
          }}
        >
          <div
            className="bg-[#1f1d25]/90 backdrop-blur-[2px] text-white rounded-[6px] px-[10px] py-[6px] whitespace-nowrap"
            style={{ fontFamily: "'Roboto', sans-serif", fontSize: '11px', fontWeight: 500, lineHeight: '1.5', letterSpacing: '0.15px', boxShadow: '0 2px 8px rgba(0,0,0,0.28)' }}
          >
            {isHero ? (
              <span className="flex items-center gap-[5px]">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="#f9c74f">
                  <path d="M6 0.5l1.545 3.13 3.455.502-2.5 2.436.59 3.44L6 8.38 2.91 9.998l.59-3.44-2.5-2.43 3.455-.503L6 0.5z" />
                </svg>
                Hero angle · drag to reorder
              </span>
            ) : 'Drag to reorder'}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 w-0 h-0" style={{ bottom: '-4px', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid rgba(31,29,37,0.9)' }} />
        </div>

        <span className="font-['Roboto',sans-serif] font-normal text-[11px] leading-[18px] tracking-[0.16px] text-[#1f1d25] whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── AngleStripVin ─────────────────────────────────────────────────────────────
interface AngleStripVinProps {
  angles: VehicleGroup['angles'];
  sourceAngles?: VehicleGroup['sourceAngles'];
  previousAngles?: VehicleGroup['previousAngles'];
  vehicleName?: string;
  /** When true, thumbnails show source (cutout) images instead of generated */
  showSource?: boolean;
  initialOrder?: AngleKey[];
  onOrderChange?: (order: AngleKey[]) => void;
  /** Currently selected angle key — shows active ring */
  activeKey?: AngleKey;
  /** Called when user clicks a card */
  onActiveChange?: (key: AngleKey) => void;
}

export function AngleStripVin({
  angles,
  sourceAngles,
  previousAngles,
  vehicleName = '',
  showSource = false,
  initialOrder,
  onOrderChange,
  activeKey,
  onActiveChange,
}: AngleStripVinProps) {
  // ── Ordered display indices (same logic as AnglesSource) ─────────────────────
  const [orderedIndices, setOrderedIndices] = useState<number[]>(() => {
    if (initialOrder && initialOrder.length === ANGLE_CONFIGS.length) {
      return initialOrder.map(k => ANGLE_CONFIGS.findIndex(c => c.key === k)).filter(i => i !== -1);
    }
    return [0, 1, 2, 3, 4, 5];
  });

  // ── Drag state ───────────────────────────────────────────────────────────────
  const [dragSrcDisplayIdx, setDragSrcDisplayIdx] = useState<number | null>(null);
  const [insertAtIdx,       setInsertAtIdx]        = useState<number | null>(null);
  const [hoveredCfgIdx,     setHoveredCfgIdx]      = useState<number | null>(null);

  const liveOrder = useMemo(() => {
    if (dragSrcDisplayIdx === null || insertAtIdx === null || dragSrcDisplayIdx === insertAtIdx) {
      return orderedIndices;
    }
    const next = [...orderedIndices];
    const [moved] = next.splice(dragSrcDisplayIdx, 1);
    const insertPos = insertAtIdx > dragSrcDisplayIdx ? insertAtIdx - 1 : insertAtIdx;
    next.splice(insertPos, 0, moved);
    return next;
  }, [dragSrcDisplayIdx, insertAtIdx, orderedIndices]);

  const handleDragStart = (displayIdx: number) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragSrcDisplayIdx(displayIdx);
    setInsertAtIdx(displayIdx);
  };
  const handleDragOver = (liveIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setInsertAtIdx(liveIdx);
  };
  const handleDrop = (_liveIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragSrcDisplayIdx === null) return;
    setOrderedIndices(liveOrder);
    onOrderChange?.(liveOrder.map(i => ANGLE_CONFIGS[i].key));
    setDragSrcDisplayIdx(null);
    setInsertAtIdx(null);
  };
  const handleDragEnd = () => {
    setDragSrcDisplayIdx(null);
    setInsertAtIdx(null);
  };

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [previewDisplayIdx, setPreviewDisplayIdx] = useState<number | null>(null);

  const handlePrev = () =>
    setPreviewDisplayIdx(i => i === null ? null : (i - 1 + orderedIndices.length) % orderedIndices.length);
  const handleNext = () =>
    setPreviewDisplayIdx(i => i === null ? null : (i + 1) % orderedIndices.length);

  const previewConfigIdx = previewDisplayIdx !== null ? orderedIndices[previewDisplayIdx] : null;
  const previewCfg = previewConfigIdx !== null ? ANGLE_CONFIGS[previewConfigIdx] : null;

  return (
    <>
      {/* ── Card strip — flex-wrap so cards reflow on narrow containers ── */}
      <div
        className="flex flex-wrap"
        style={{ gap: CARD_GAP, width: '100%' }}
      >
        {orderedIndices.map((cfgIdx, originalDisplayIdx) => {
          const { key, label, defaultSrc } = ANGLE_CONFIGS[cfgIdx];
          const livePos        = liveOrder.indexOf(cfgIdx);
          const isBeingDragged = dragSrcDisplayIdx !== null && originalDisplayIdx === dragSrcDisplayIdx;
          const isHovered      = hoveredCfgIdx === cfgIdx;
          const src = showSource
            ? (sourceAngles?.[key] ?? null)
            : (angles[key] ?? null);

          return (
            <div
              key={cfgIdx}
              onMouseEnter={() => setHoveredCfgIdx(cfgIdx)}
              onMouseLeave={() => setHoveredCfgIdx(null)}
              style={{
                order:  livePos,
                width:  CARD_W,
                flexShrink: 0,
                zIndex: isBeingDragged ? 20 : isHovered ? 10 : undefined,
              }}
            >
              <AngleCardSm
                label={label}
                src={src}
                defaultSrc={defaultSrc}
                isHero={liveOrder[0] === cfgIdx}
                isGhost={isBeingDragged}
                isActive={activeKey === key}
                draggable
                onDragStart={handleDragStart(originalDisplayIdx)}
                onDragOver={handleDragOver(livePos)}
                onDrop={handleDrop(livePos)}
                onDragEnd={handleDragEnd}
                onPreview={() => setPreviewDisplayIdx(originalDisplayIdx)}
                onSelect={() => onActiveChange?.(key)}
              />
            </div>
          );
        })}
      </div>

      {/* ── Preview modal ── */}
      <AnglePreviewModal
        isOpen={previewDisplayIdx !== null}
        onClose={() => setPreviewDisplayIdx(null)}
        angleLabel={previewCfg?.label ?? ''}
        vehicleName={vehicleName}
        generatedSrc={previewCfg ? angles[previewCfg.key] : null}
        sourceSrc={previewCfg ? (sourceAngles?.[previewCfg.key] ?? null) : null}
        previousSrc={previewCfg ? (previousAngles?.[previewCfg.key] ?? null) : null}
        defaultSrc={previewCfg?.defaultSrc ?? ''}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </>
  );
}
