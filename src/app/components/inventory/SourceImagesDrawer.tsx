// ─── SourceImagesDrawer ───────────────────────────────────────────────────────
// Expansion drawer content for a Source Images row.
// Figma: node 4071:428981 "Multi-Angle Source Images"
//
// Specs (exact from Figma):
//   Container  — bg #f7f7f7, padding t:16 b:24 r:12, border rgba(0,0,0,0.12)
//   Header     — 30px tall, SPACE_BETWEEN
//   itemSpacing between all children: 16px
//   Dividers   — 1px rgba(0,0,0,0.12), centered in the 16px gap between rows

import React, { useState } from 'react';
import { AngleColumn } from './AngleColumn';
import { AnglePreviewModal } from './AnglePreviewModal';
import type { SourceImageRecord, AngleGroup } from '../../../data/inventory/sourceImages';

const ANGLE_ORDER = ['34l', 'front', '34r', 'right', 'rear', 'left'];

interface SourceImagesDrawerProps {
  record: SourceImageRecord;
  containerWidth?: number;
}

export function SourceImagesDrawer({ record, containerWidth }: SourceImagesDrawerProps) {
  const angleGroups: AngleGroup[] = record.angleGroups ?? [];
  const generatedAngles           = record.generatedAngles ?? {};

  const orderedGroups = ANGLE_ORDER
    .map(k => angleGroups.find(g => g.key === k))
    .filter((g): g is AngleGroup => !!g);

  const [activeCardIds, setActiveCardIds] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    orderedGroups.forEach(g => { init[g.key] = g.activeCardId; });
    return init;
  });

  const anglesWithGenerated = orderedGroups.filter(g => generatedAngles[g.key]);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const currentAngle = anglesWithGenerated[modalIndex] ?? null;

  return (
    <div className="bg-[#f7f7f7]" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {/* ── Header — sticky to left viewport edge so it stays visible when table scrolls ── */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{
          height: 30,
          marginBottom: 16,
          paddingLeft: 62,
          paddingRight: 12,
          position: 'sticky',
          left: 0,
        }}
      >
        <span className="font-['Roboto',sans-serif] font-medium text-[14px] leading-[1.57] tracking-[0.1px] text-[#1f1d25]">
          Source Images
        </span>

        {anglesWithGenerated.length > 0 && (
          <button
            onClick={() => { setModalIndex(0); setModalOpen(true); }}
            className="flex items-center gap-[4px] font-['Roboto',sans-serif] text-[12px] leading-[1.43] tracking-[0.17px] text-[#473bab] hover:underline"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Check Generated Image
          </button>
        )}
      </div>

      {/* ── Angle columns — constrained to scroll container width → own horizontal scroll ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          paddingLeft: 62,
          paddingRight: 12,
          ...(containerWidth ? { width: containerWidth } : {}),
        } as React.CSSProperties}
      >
        {orderedGroups.map(group => (
          <AngleColumn
            key={group.key}
            angleName={group.label}
            cards={group.cards}
            activeCardId={activeCardIds[group.key] ?? null}
            onActivate={cardId =>
              setActiveCardIds(prev => ({ ...prev, [group.key]: cardId }))
            }
          />
        ))}
      </div>

      {/* ── AnglePreviewModal — generated images only ── */}
      {currentAngle && (
        <AnglePreviewModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          angleLabel={currentAngle.label}
          vehicleName={record.vehicleName ?? record.name}
          generatedSrc={generatedAngles[currentAngle.key] ?? null}
          sourceSrc={null}
          defaultSrc={record.thumbnail}
          defaultTab="generated"
          hideSourceTab
          onPrev={modalIndex > 0 ? () => setModalIndex(i => i - 1) : undefined}
          onNext={modalIndex < anglesWithGenerated.length - 1 ? () => setModalIndex(i => i + 1) : undefined}
        />
      )}
    </div>
  );
}
