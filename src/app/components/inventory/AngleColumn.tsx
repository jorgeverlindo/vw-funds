// ─── AngleColumn ───────────────────────────────────────────────────────────────
// One angle column in the Source Images drawer.
// Cards stack vertically using the existing HorizontalCard (320×90px).
// Overflow-x scrolls if card width exceeds column bounds.

import React from 'react';
import { HorizontalCard } from './HorizontalCard';
import type { AngleCard, SourceImageSource } from '../../../data/inventory/sourceImages';

interface AngleColumnProps {
  angleName: string;
  cards: AngleCard[];
  activeCardId: string | null;
  onActivate: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
}

export function AngleColumn({ angleName, cards, activeCardId, onActivate, onDelete }: AngleColumnProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: '#f4f5f6',
        borderRadius: 8,
        padding: 8,
        minWidth: 0,
        flexShrink: 0,
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 18 }}>
        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, lineHeight: '18px', letterSpacing: '0.4px', color: '#1f1d25' }}>
          {angleName}
        </span>
        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, lineHeight: '18px', letterSpacing: '0.4px', color: 'rgba(17,16,20,0.56)' }}>
          {cards.length} {cards.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {/* ── Vertical card list — horizontal scroll if cards overflow column width ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
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
          <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(17,16,20,0.38)', padding: '4px 2px' }}>
            No images
          </span>
        )}
      </div>
    </div>
  );
}
