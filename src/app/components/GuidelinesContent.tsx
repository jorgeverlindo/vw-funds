import { useTranslation } from '../contexts/LanguageContext';

// Card images from the Figma design — exact asset references, do not substitute
import imgCoop   from 'figma:asset/85a0c71df6a4fdf6c8713a2ec4063036ceb6ee23.png';
import imgBrand  from 'figma:asset/c24d45a1c65f1ce9c23d8dafd2787f4fa397aa92.png';
import imgJetta  from 'figma:asset/c45369b25447b6fa84f02227e98c3db81b9de3da.png';
import imgTiguan from 'figma:asset/4a61db968612064253430d01cb62b28422ad7a74.png';
import imgApril  from 'figma:asset/990a5c560985c278f9d761d79cebaff821f02f52.png';

// ─── GuidelinesCard ──────────────────────────────────────────────────────────
interface GuidelinesCardProps {
  image: string;
  title: string;
  ctaLabel?: string;
  size?: 'large' | 'small';
}

function GuidelinesCard({
  image,
  title,
  ctaLabel = 'Access Documents',
  size = 'large',
}: GuidelinesCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`
        relative overflow-hidden rounded-[12px] cursor-pointer group
        ${size === 'large' ? 'h-[280px]' : 'h-[190px]'}
      `}
    >
      {/* Background image */}
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />

      {/* Gradient overlay — darkens bottom 60% for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0) 75%)',
        }}
      />

      {/* Content — pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-5 pb-5 gap-3">
        {/* Title */}
        <span
          className="text-white leading-snug tracking-[0.15px]"
          style={{ fontSize: size === 'large' ? '20px' : '16px', fontWeight: 500 }}
        >
          {t(title)}
        </span>

        {/* CTA button */}
        <button
          className="shrink-0 px-4 py-1.5 bg-white text-[#1f1d25] rounded-full border border-white/80 text-[13px] font-medium hover:bg-white/90 transition-colors whitespace-nowrap shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {t(ctaLabel)}
        </button>
      </div>
    </div>
  );
}

// ─── GuidelinesContent ────────────────────────────────────────────────────────
export function GuidelinesContent() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-6">

        {/* Row 1 — 2 large cards, 50/50, 24px gap */}
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <GuidelinesCard
              image={imgCoop}
              title="COOP Guidelines"
              size="large"
            />
          </div>
          <div className="flex-1 min-w-0">
            <GuidelinesCard
              image={imgBrand}
              title="Brand Guidelines"
              size="large"
            />
          </div>
        </div>

        {/* Row 2 — 3 smaller cards, equal width, 24px gap */}
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <GuidelinesCard
              image={imgJetta}
              title="Jetta Assets"
              size="small"
            />
          </div>
          <div className="flex-1 min-w-0">
            <GuidelinesCard
              image={imgTiguan}
              title="Tiguan Assets"
              size="small"
            />
          </div>
          <div className="flex-1 min-w-0">
            <GuidelinesCard
              image={imgApril}
              title="April Campaign"
              size="small"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
