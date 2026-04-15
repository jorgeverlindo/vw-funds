import { useTranslation } from '../contexts/LanguageContext';
import { useClient } from '../contexts/ClientContext';

// VW card images — Figma assets
import imgCoop   from 'figma:asset/85a0c71df6a4fdf6c8713a2ec4063036ceb6ee23.png';
import imgBrand  from 'figma:asset/c24d45a1c65f1ce9c23d8dafd2787f4fa397aa92.png';
import imgJetta  from 'figma:asset/c45369b25447b6fa84f02227e98c3db81b9de3da.png';
import imgTiguan from 'figma:asset/4a61db968612064253430d01cb62b28422ad7a74.png';
import imgApril  from 'figma:asset/990a5c560985c278f9d761d79cebaff821f02f52.png';

// Audi card images
import imgAudiCoop     from '../../assets/audi_images/Guidelines Card.png';
import imgAudiBrand    from '../../assets/audi_images/Guidelines Card-1.png';
import imgAudiA7       from '../../assets/audi_images/Guidelines Card-2.png';
import imgAudiQ5       from '../../assets/audi_images/Guidelines Card-3.png';
import imgAudiApril    from '../../assets/audi_images/Guidelines Card-4.png';

// ─── Per-client card configs ──────────────────────────────────────────────────

interface CardConfig {
  image: string;
  title: string;
}

interface ClientCards {
  row1: [CardConfig, CardConfig];
  row2: [CardConfig, CardConfig, CardConfig];
}

const VW_CARDS: ClientCards = {
  row1: [
    { image: imgCoop,   title: 'COOP Guidelines' },
    { image: imgBrand,  title: 'Brand Guidelines' },
  ],
  row2: [
    { image: imgJetta,  title: 'Jetta Assets' },
    { image: imgTiguan, title: 'Tiguan Assets' },
    { image: imgApril,  title: 'April Campaign' },
  ],
};

const AUDI_CARDS: ClientCards = {
  row1: [
    { image: imgAudiCoop,  title: 'COOP Guidelines' },
    { image: imgAudiBrand, title: 'Brand Guidelines' },
  ],
  row2: [
    { image: imgAudiA7,    title: 'Audi A7 Sportback Assets' },
    { image: imgAudiQ5,    title: 'Audi Q5' },
    { image: imgAudiApril, title: 'April Campaign' },
  ],
};

// ─── GuidelinesCard ──────────────────────────────────────────────────────────

interface GuidelinesCardProps {
  image: string;
  title: string;
  ctaLabel?: string;
}

function GuidelinesCard({
  image,
  title,
  ctaLabel = 'Access Documents',
}: GuidelinesCardProps) {
  const { t } = useTranslation();

  return (
    <div className="relative w-full overflow-hidden rounded-[12px] cursor-pointer group aspect-[16/9]">

      {/* Background image */}
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover scale-[1.06] transition-transform duration-300 group-hover:scale-[1.08]"
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
          style={{ fontSize: '18px', fontWeight: 500 }}
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
  const { client } = useClient();
  const cards = client.clientId === 'audi' ? AUDI_CARDS : VW_CARDS;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-6">

        {/* Row 1 — 2 large cards, 50/50, 24px gap */}
        <div className="flex gap-6">
          {cards.row1.map((card) => (
            <div key={card.title} className="flex-1 min-w-0">
              <GuidelinesCard image={card.image} title={card.title} />
            </div>
          ))}
        </div>

        {/* Row 2 — 3 smaller cards, equal width, 24px gap */}
        <div className="flex gap-6">
          {cards.row2.map((card) => (
            <div key={card.title} className="flex-1 min-w-0">
              <GuidelinesCard image={card.image} title={card.title} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
