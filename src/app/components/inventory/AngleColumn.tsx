// ─── AngleColumn ───────────────────────────────────────────────────────────────
// One angle column in the Source Images drawer — replaces the old AngleRow.
// Figma: column layout with gray rounded wrapper, vertical item list, radio select.

import type { AngleCard, SourceImageSource } from '../../../data/inventory/sourceImages';

interface AngleColumnProps {
  angleName: string;
  cards: AngleCard[];
  activeCardId: string | null;
  onActivate: (cardId: string) => void;
}

export function AngleColumn({ angleName, cards, activeCardId, onActivate }: AngleColumnProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: '#f4f5f6',
        borderRadius: 8,
        padding: 8,
        minWidth: 190,
        flex: '1 1 190px',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 18 }}>
        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, lineHeight: '18px', letterSpacing: '0.4px', color: '#1f1d25', fontWeight: 500 }}>
          {angleName}
        </span>
        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, lineHeight: '18px', letterSpacing: '0.4px', color: 'rgba(17,16,20,0.56)' }}>
          {cards.length} {cards.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {/* ── Vertical card list ── */}
      {cards.length > 0 ? (
        cards.map(card => {
          const isActive = card.id === activeCardId;
          return (
            <button
              key={card.id}
              onClick={() => onActivate(card.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'white',
                borderRadius: 6,
                padding: '6px 8px',
                border: `1.5px solid ${isActive ? '#473bab' : 'transparent'}`,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            >
              {/* Radio button */}
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: `2px solid ${isActive ? '#473bab' : 'rgba(0,0,0,0.38)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: 'white',
                  boxSizing: 'border-box',
                }}
              >
                {isActive && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#473bab' }} />
                )}
              </div>

              {/* Thumbnail */}
              {card.src ? (
                <img
                  src={card.src}
                  alt={card.filename}
                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0, background: '#f0f2f4' }}
                />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 4, background: '#f0f2f4', flexShrink: 0 }} />
              )}

              {/* Filename + meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: 11,
                    lineHeight: '14px',
                    color: '#1f1d25',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-all',
                  } as React.CSSProperties}
                >
                  {card.filename}
                </span>
                <span
                  style={{
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: 10,
                    color: 'rgba(17,16,20,0.56)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {card.source} · {card.date}
                </span>
              </div>
            </button>
          );
        })
      ) : (
        <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: 'rgba(17,16,20,0.38)', padding: '4px 2px' }}>
          No images
        </span>
      )}
    </div>
  );
}
