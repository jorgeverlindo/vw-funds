// ─── AnglesSource ─────────────────────────────────────────────────────────────
// Displays the 6 angle cards for a vehicle group.
// Angle order: 3/4 L → Front → 3/4 R → Right → Rear → Left  (Figma default)
//
// Drag-to-reorder: HTML5 drag API.  First card is always the Hero angle.
// Modal state is hoisted here so a single AnglePreviewModal can navigate
// across all 6 angles via left/right keyboard arrows.

import { useState, useMemo } from 'react';
import type { AngleKey, VehicleGroup } from '../../../data/inventory/types';
import { AngleCard } from './AngleCard';
import { AnglePreviewModal } from './AnglePreviewModal';

// ─── Angle placeholder images ─────────────────────────────────────────────────
// NOTE: file names ≠ actual content. Mapped to correct visual after inspection:
//   angle-right.png   → front-facing ATV  (labelled "Front")
//   angle-left.png    → right-side ATV    (labelled "Right")
//   angle-rear.png    → rear ATV          (labelled "Rear")  ✓
//   angle-34-l.png    → 3/4 left ATV      (labelled "3/4 L") ✓
//   angle-34-r.png    → 3/4 right ATV     (labelled "3/4 R") ✓
//   angle-34-rear.png → 3/4 rear ATV      (labelled "Left"  — best available)
//   angle-front.png   → empty landscape   → not used as angle default
const angle34L = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071184/vw-funds/inventory/angles/angle-34-l.png';
const angleFront = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071191/vw-funds/inventory/angles/angle-right.png';
const angle34R = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071186/vw-funds/inventory/angles/angle-34-r.png';
const angleRight = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071189/vw-funds/inventory/angles/angle-left.png';
const angleRear = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071190/vw-funds/inventory/angles/angle-rear.png';
const angleLeft = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071187/vw-funds/inventory/angles/angle-34-rear.png';

interface AngleConfig {
  key: AngleKey;
  label: string;
  defaultSrc: string;
}

// Canonical order — used as the default (index 0 = Hero)
const ANGLE_CONFIGS: AngleConfig[] = [
  { key: '34l',   label: '3/4 L',  defaultSrc: angle34L   },
  { key: 'front', label: 'Front',  defaultSrc: angleFront },
  { key: '34r',   label: '3/4 R',  defaultSrc: angle34R   },
  { key: 'right', label: 'Right',  defaultSrc: angleRight },
  { key: 'rear',  label: 'Rear',   defaultSrc: angleRear  },
  { key: 'left',  label: 'Left',   defaultSrc: angleLeft  },
];

interface AnglesSourceProps {
  angles: VehicleGroup['angles'];
  sourceAngles?: VehicleGroup['sourceAngles'];
  /** Previous version of each angle (before last edit) — enables "Previous Version" tab */
  previousAngles?: VehicleGroup['previousAngles'];
  /** Vehicle model name passed to the preview modal header */
  vehicleName?: string;
  /** Initial custom order (from saved vehicleGroup.angleOrder) */
  initialOrder?: AngleKey[];
  /** Called whenever the user drag-reorders the angles — first key is new Hero */
  onOrderChange?: (order: AngleKey[]) => void;
}

export function AnglesSource({
  angles,
  sourceAngles,
  previousAngles,
  vehicleName = '',
  initialOrder,
  onOrderChange,
}: AnglesSourceProps) {
  // orderedIndices: indices into ANGLE_CONFIGS, in display order
  const [orderedIndices, setOrderedIndices] = useState<number[]>(() => {
    if (initialOrder && initialOrder.length === ANGLE_CONFIGS.length) {
      return initialOrder.map(k => ANGLE_CONFIGS.findIndex(c => c.key === k)).filter(i => i !== -1);
    }
    return [0, 1, 2, 3, 4, 5];
  });

  // ── drag-to-reorder state (push/insert) ─────────────────────────────────────
  const [dragSrcDisplayIdx, setDragSrcDisplayIdx] = useState<number | null>(null);
  const [insertAtIdx, setInsertAtIdx] = useState<number | null>(null);

  // ── hover tracking — elevates hovered card's z-index so its tooltip
  //    (which overflows the card bounds) renders above sibling cards
  const [hoveredCfgIdx, setHoveredCfgIdx] = useState<number | null>(null);

  // Compute live preview order during drag — cards shift to show where item will land
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

  const handleDragOver = (liveDisplayIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setInsertAtIdx(liveDisplayIdx);
  };

  const handleDrop = (_liveDisplayIdx: number) => (e: React.DragEvent) => {
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

  // ── modal state ──────────────────────────────────────────────────────────────
  // null = modal closed; 0–5 = index in orderedIndices (display order)
  const [previewDisplayIdx, setPreviewDisplayIdx] = useState<number | null>(null);

  const handlePrev = () =>
    setPreviewDisplayIdx(i =>
      i === null ? null : (i - 1 + orderedIndices.length) % orderedIndices.length,
    );

  const handleNext = () =>
    setPreviewDisplayIdx(i =>
      i === null ? null : (i + 1) % orderedIndices.length,
    );

  const previewConfigIdx = previewDisplayIdx !== null ? orderedIndices[previewDisplayIdx] : null;
  const previewCfg = previewConfigIdx !== null ? ANGLE_CONFIGS[previewConfigIdx] : null;

  return (
    <div className="pl-[98px] pr-[12px] pt-[16px] pb-[24px] bg-[#f9fafa]">
      {/* Header */}
      <div className="flex items-center gap-[6px] mb-[16px]">
        <span className="font-['Roboto',sans-serif] font-medium text-[12px] leading-[1.43] tracking-[0.17px] text-[#1f1d25]">
          Angles
        </span>
        <span className="font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px] text-[#686576]">
          6 items
        </span>
      </div>

      {/* 6 angle cards — absolutely positioned so CSS `left` transition gives
          a smooth 300 ms slide when drag-reordering pushes other cards.
          CARD_STEP = 90 (card width) + 16 (gap) = 106 px
          Container height = 90 (image) + 4 (gap) + 24 (chip) = 118 px      */}
      <div className="relative" style={{ height: 118, width: 620 }}>
        {orderedIndices.map((cfgIdx, originalDisplayIdx) => {
          const { key, label, defaultSrc } = ANGLE_CONFIGS[cfgIdx];
          const CARD_STEP   = 106;
          const livePos     = liveOrder.indexOf(cfgIdx);
          const isBeingDragged = dragSrcDisplayIdx !== null && originalDisplayIdx === dragSrcDisplayIdx;
          const isHovered      = hoveredCfgIdx === cfgIdx;
          return (
            <div
              key={cfgIdx}
              onMouseEnter={() => setHoveredCfgIdx(cfgIdx)}
              onMouseLeave={() => setHoveredCfgIdx(null)}
              style={{
                position:   'absolute',
                left:        livePos * CARD_STEP,
                top:         0,
                width:       90,
                // Dragged card: highest z. Hovered card: above siblings so
                // its tooltip isn't clipped by the next card's stacking context.
                // Default: no z-index set (avoids creating a stacking context
                // that would trap the tooltip inside it).
                transition:  isBeingDragged ? 'none' : 'left 300ms ease',
                zIndex:      isBeingDragged ? 20 : isHovered ? 10 : undefined,
              }}
            >
              <AngleCard
                label={label}
                src={angles[key]}
                defaultSrc={defaultSrc}
                sourceSrc={sourceAngles?.[key] ?? null}
                hasPreviousVersion={!!(previousAngles?.[key])}
                isHero={liveOrder[0] === cfgIdx}
                isGhost={isBeingDragged}
                draggable
                onDragStart={handleDragStart(originalDisplayIdx)}
                onDragOver={handleDragOver(livePos)}
                onDrop={handleDrop(livePos)}
                onDragEnd={handleDragEnd}
                isDragOver={false}
                onPreview={() => setPreviewDisplayIdx(originalDisplayIdx)}
              />
            </div>
          );
        })}
      </div>

      {/* Single modal instance — receives navigation callbacks */}
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
    </div>
  );
}
