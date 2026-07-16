// ─── StackedThumbnail ──────────────────────────────────────────────────────────
// 76×76 thumbnail that shows a fanned "stack of photos" affordance.
// Matches Figma node 4071:370618 "Card Image Collection" exactly:
//
//   Front card  → rotation  0°,   3 drop shadows (deepest), borderRadius 12
//   Mid card    → rotation -8°,   1 drop shadow,             borderRadius 12
//   Back card   → rotation -13.9°, 1 drop shadow,            borderRadius 12
//
// Container is overflow:visible so rotated corners can peek outside the bounds.
// count = 1 → front card only (no stacking)
// count = 2 → front + mid card
// count ≥ 3 → front + mid + back card

interface StackedThumbnailProps {
  src?: string;
  alt?: string;
  /** Total images in this collection — drives how many back cards appear */
  count?: number;
}

const RADIUS = 12;

// Material-spec drop shadows matching Figma Card1 (front) effects
const SHADOW_FRONT =
  '0 2px 1px -1px rgba(0,0,0,0.20), 0 1px 1px 0px rgba(0,0,0,0.14), 0 1px 3px 0px rgba(0,0,0,0.12)';

// Figma Card1 (back cards) — single elevation-1 shadow
const SHADOW_BACK =
  '0 1px 3px 0px rgba(0,0,0,0.12)';

function CardLayer({
  src,
  alt = '',
  rotation,
  shadow,
  showImage,
}: {
  src?: string;
  alt?: string;
  rotation: number;
  shadow: string;
  showImage: boolean;
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#f0f2f4]"
      style={{
        borderRadius: RADIUS,
        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center',
        boxShadow: shadow,
      }}
    >
      {showImage && src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover object-center"
          draggable={false}
        />
      ) : !showImage ? null : (
        <div className="w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 40 28" fill="none" className="w-3/5 text-[rgba(17,16,20,0.18)]">
            <path
              d="M6 18l4-8h20l4 8v5H6v-5z"
              stroke="currentColor" strokeWidth="1.2"
              fill="currentColor" fillOpacity="0.3"
            />
            <circle cx="12" cy="23" r="3" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="28" cy="23" r="3" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function StackedThumbnail({ src, alt = '', count = 1 }: StackedThumbnailProps) {
  const layers = Math.min(Math.max(count - 1, 0), 2);

  return (
    // overflow:visible — rotated back cards extend slightly outside 76×76 bounds
    <div className="relative shrink-0" style={{ width: 76, height: 76, overflow: 'visible' }}>

      {/* Back card — deepest, rotation -13.9° */}
      {layers >= 2 && (
        <CardLayer src={src} rotation={-13.924} shadow={SHADOW_BACK} showImage={true} />
      )}

      {/* Mid card — rotation -8° */}
      {layers >= 1 && (
        <CardLayer src={src} rotation={-8.005} shadow={SHADOW_BACK} showImage={true} />
      )}

      {/* Front card — straight, richest shadow, alt text on this one */}
      <CardLayer src={src} alt={alt} rotation={0} shadow={SHADOW_FRONT} showImage={true} />

    </div>
  );
}
