// ─── AngleRow ─────────────────────────────────────────────────────────────────
// One angle section inside the Source Images drawer.
// Figma: node 4074:494192 "Angle Row" component
//
// Layout: VERTICAL, padding L:8 R:8, gap 8px
//   Header — angle label (left) + "N Items" count (right), 11px
//   Cards  — horizontal scroll, HorizontalCard components, gap 16px

import { useState } from 'react';
import { HorizontalCard } from './HorizontalCard';
import type { AngleCard, SourceImageSource } from '../../../data/inventory/sourceImages';

interface AngleRowProps {
  angleName: string;
  cards: AngleCard[];
  activeCardId: string | null;
  onActivate: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
}

export function AngleRow({
  angleName,
  cards,
  activeCardId,
  onActivate,
  onDelete,
}: AngleRowProps) {
  return (
    <div className="flex flex-col" style={{ paddingLeft: 8, paddingRight: 8, gap: 8 }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between" style={{ height: 18 }}>
        <span className="font-['Roboto',sans-serif] text-[11px] leading-[18px] tracking-[0.4px] text-[#1f1d25]">
          {angleName}
        </span>
        <span className="font-['Roboto',sans-serif] text-[11px] leading-[18px] tracking-[0.4px] text-[rgba(17,16,20,0.56)]">
          {cards.length} {cards.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {/* ── Cards — horizontal scroll ── */}
      <div
        className="flex overflow-x-auto"
        style={{
          gap: 16,
          height: 90,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      >
        {cards.length > 0 ? (
          cards.map(card => (
            <HorizontalCard
              key={card.id}
              src={card.src}
              filename={card.filename}
              source={card.source as SourceImageSource}
              date={card.date}
              isActive={card.id === activeCardId}
              onActivate={() => onActivate(card.id)}
              onDelete={onDelete ? () => onDelete(card.id) : undefined}
            />
          ))
        ) : (
          <div className="flex items-center">
            <span className="font-['Roboto',sans-serif] text-[12px] text-[rgba(17,16,20,0.38)]">
              No source images for this angle
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
