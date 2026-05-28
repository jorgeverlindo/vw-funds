// ─── VinDetailContent ─────────────────────────────────────────────────────────
// VIN Detail page — opened when the user clicks a VIN name in the data grid.
// Figma: CP-12009 – Multi-Angle – VIN Detail View, node 3556:41747
//
// Layout: sticky header (breadcrumb + AI toggle + tabs) → body (two columns)
//   Left  480px : hero image (480×360) + angle thumbnail strip (48px each)
//   Right flex-1: two sub-columns of detail rows side by side

import React, { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import type { VinInventoryRecord } from '../../../data/inventory/vehicleInventory';
import { AI_CONFIGS } from '../../../data/inventory/aiConfigs';
import type { AngleKey } from '../../../data/inventory/types';
import { BreadcrumbBar }  from '../BreadcrumbBar';
import { CommentsButton } from '../comments';
import { PriceToMarketChip, PriorityScoreChip } from './VehicleInventoryGrid';
import { AngleStripVin } from './AngleStripVin';

// ─── Typography ────────────────────────────────────────────────────────────────
const BODY1   = "font-['Roboto',sans-serif] font-normal text-[14px] leading-[1.5] tracking-[0.15px]";
const CAPTION = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";
const SUB2    = "font-['Roboto',sans-serif] font-medium text-[14px] leading-[1.57] tracking-[0.1px]";

// ─── Left-pane icon — cropped viewBox (same as ProjectsModule) ───────────────
function LeftPaneIcon() {
  return (
    <svg width="16" height="13" viewBox="6 8 18 14" fill="none">
      <path
        d="M7.29102 9.79183C7.29102 9.33159 7.66411 8.9585 8.12435 8.9585H21.8743C22.3346 8.9585 22.7077 9.33159 22.7077 9.79183V20.2085C22.7077 20.6687 22.3346 21.0418 21.8743 21.0418H8.12435C7.66411 21.0418 7.29102 20.6687 7.29102 20.2085V9.79183Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path
        d="M11.875 9.1665V14.9998V20.8332"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
    </svg>
  );
}

// AngleKey type imported — no local angle config needed (handled by AngleStripVin)

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({
  label, children, noBorder,
}: {
  label: string; children: React.ReactNode; noBorder?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-start gap-[34px] py-[8px]',
      !noBorder && 'border-b border-[rgba(0,0,0,0.12)]',
    )}>
      <span className={cn(CAPTION, 'text-[rgba(0,0,0,0.6)] shrink-0')} style={{ minWidth: 60, width: 80 }}>
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function DetailText({ children, primary }: { children: React.ReactNode; primary?: boolean }) {
  return (
    <span className={cn(BODY1, primary ? 'text-[#473bab] cursor-pointer hover:underline' : 'text-[#1f1d25]')}>
      {children}
    </span>
  );
}

// ─── Transit chip ─────────────────────────────────────────────────────────────
function TransitChip({ inTransit }: { inTransit: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] px-[8px] h-[22px] rounded-[11px] text-[12px] font-['Roboto'] font-medium tracking-[0.15px]",
        inTransit
          ? 'bg-[#e8f5e9] text-[#1b5e20]'
          : 'bg-[rgba(17,16,20,0.06)] text-[rgba(17,16,20,0.6)]',
      )}
    >
      <span
        className="inline-block size-[6px] rounded-full shrink-0"
        style={{ background: inTransit ? '#388e3c' : 'rgba(17,16,20,0.38)' }}
      />
      {inTransit ? 'In Transit' : 'Not In Transit'}
    </span>
  );
}

// ─── VinDetailContent ─────────────────────────────────────────────────────────
interface VinDetailContentProps {
  record: VinInventoryRecord;
  onBack: () => void;
  /** 'auto' = full detail view (default). 'sport' = compact listing layout matching export screenshot. */
  variant?: 'auto' | 'sport';
}

export function VinDetailContent({ record, onBack, variant = 'auto' }: VinDetailContentProps) {
  const [activeAngle, setActiveAngle] = useState<AngleKey>('34l');
  const [imageMode,   setImageMode]   = useState<'generated' | 'source'>('generated');
  const [activeTab,   setActiveTab]   = useState<'details' | 'generated' | 'source'>('details');

  // ── Responsive breakpoint: below 1200px → 50/50 split ──────────────────────
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 1200
  );
  useEffect(() => {
    const handler = () => setNarrow(window.innerWidth < 1200);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ── AI config lookup ────────────────────────────────────────────────────────
  const aiConfig = record.aiConfigId ? AI_CONFIGS.find(c => c.id === record.aiConfigId) : null;
  const vg       = record.vehicleGroup ?? null;

  // ── Current hero image ──────────────────────────────────────────────────────
  const heroSrc: string | null = (() => {
    if (!vg) return record.thumbnail;
    if (imageMode === 'source') return vg.sourceAngles?.[activeAngle] ?? null;
    return vg.angles[activeAngle] ?? null;
  })();

  const hasSource = !!vg?.sourceAngles;

  // ── Static dummy data (fields not in VinInventoryRecord) ───────────────────
  const stockNo    = `YA${record.vin.slice(-6)}`;
  const hash       = 'a9f3c21e';
  const vdpLink    = `https://www.ridenowweatherford.com/inventory/${record.vin}`;
  const mileage    = record.condition === 'New' ? 0 : 124;
  const drivetrain = record.model.toLowerCase().includes('tw200') ? 'Chain Drive' : 'Chain Drive';
  const fuelType   = 'Gasoline';
  const bodyType   = record.model.toLowerCase().includes('tw200') ? 'Motorcycle' : 'Sport ATV';
  const msrp       = Math.round(record.price * 1.098);
  const inTransit  = record.vehicleStatus?.toLowerCase().includes('transit') ?? false;

  const vehicleLabel = `${record.vin} – ${record.year} ${record.make} ${record.model} ${record.trim}`;

  const tabs = [
    { id: 'details'   as const, label: 'VIN Details'      },
    { id: 'generated' as const, label: 'Generated Images' },
    { id: 'source'    as const, label: 'Source Images'     },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <div className="flex-none px-6 pt-4 pb-0">

        {/* Breadcrumb + Comments */}
        <div className="flex items-center justify-between mb-1">
          <BreadcrumbBar
            items={[
              { label: 'Inventory' },
              { label: 'RideNow Powersports Weatherford' },
              { label: 'Vehicles', onClick: onBack },
            ]}
            activeLabel={vehicleLabel}
          />
          <CommentsButton />
        </div>

        {/* Title row: icon + model name + [switch + AI Generation label] */}
        <div className="flex items-center gap-[8px] pb-[2px] pt-[4px]">
          <span className="text-[rgba(17,16,20,0.56)] flex items-center justify-center">
            <LeftPaneIcon />
          </span>
          <h1 className="font-['Roboto',sans-serif] font-medium text-[16px] leading-[1.5] tracking-[0.15px] text-[#1f1d25] truncate">
            {record.year} {record.make} {record.model} {record.trim}
          </h1>
          {/* AI Generation: switch first, then label — matches Figma */}
          <div className="flex items-center gap-[6px] ml-[8px] shrink-0">
            {/* Switch track — div avoids browser button padding/min-width */}
            <div
              className={cn(
                'relative w-[28px] h-[16px] rounded-full overflow-hidden shrink-0',
                record.aiGeneration === 'enabled' ? 'bg-[#473bab]' : 'bg-[rgba(17,16,20,0.38)]',
              )}
            >
              <span
                className={cn(
                  'absolute top-[2px] w-[12px] h-[12px] bg-white rounded-full shadow-sm transition-transform',
                  record.aiGeneration === 'enabled' ? 'translate-x-[14px]' : 'translate-x-[2px]',
                )}
              />
            </div>
            <span className={cn(SUB2, 'text-[#1f1d25]')}>AI Generation</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-end mt-2 h-[41px] overflow-clip">
          <div className="flex items-start">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative px-[16px] py-[9px] font-['Roboto',sans-serif] font-medium text-[14px] leading-[24px] tracking-[0.4px] whitespace-nowrap transition-colors cursor-pointer border-none bg-transparent",
                    isActive ? 'text-[#473bab]' : 'text-[#686576] hover:text-[#1f1d25]',
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#473bab] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Divider under tabs */}
      <div className="flex-none h-px bg-[rgba(0,0,0,0.12)]" />

      {/* ── Sport variant body ───────────────────────────────────────────── */}
      {variant === 'sport' ? (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-wrap gap-[24px] p-[16px]">

            {/* ── Left: hero image + angle strip (same as auto) ── */}
            <div className="flex flex-col gap-[12px] min-w-[280px]" style={{ flex: '1 1 0%' }}>
              <div
                className={cn(
                  'relative w-full rounded-[4px] overflow-hidden',
                  imageMode === 'source' ? 'bg-[#f0f2f4]' : 'bg-[#1a1a1a]',
                )}
                style={{ aspectRatio: '4/3' }}
              >
                {heroSrc
                  ? <img
                      src={heroSrc}
                      alt={`${record.make} ${record.model}`}
                      className={cn('w-full h-full', imageMode === 'source' ? 'object-contain' : 'object-cover')}
                    />
                  : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                  )
                }
                {vg && (
                  <div className="absolute top-[9px] left-[8px] flex gap-[4px]">
                    <button
                      onClick={() => setImageMode('generated')}
                      className={cn(
                        "h-[24px] px-[8px] rounded-[8px] text-[11px] font-['Roboto'] font-normal tracking-[0.16px] border-none cursor-pointer transition-colors",
                        imageMode === 'generated' ? 'bg-[#dddce0] text-[#1f1d25]' : 'bg-[rgba(244,245,246,0.80)] text-[#9c99a9]',
                      )}
                    >
                      Generated
                    </button>
                    {hasSource && (
                      <button
                        onClick={() => setImageMode('source')}
                        className={cn(
                          "h-[24px] px-[8px] rounded-[8px] text-[11px] font-['Roboto'] font-normal tracking-[0.16px] border-none cursor-pointer transition-colors",
                          imageMode === 'source' ? 'bg-[#dddce0] text-[#1f1d25]' : 'bg-[rgba(244,245,246,0.80)] text-[#9c99a9]',
                        )}
                      >
                        Source
                      </button>
                    )}
                  </div>
                )}
              </div>
              {vg && (
                <AngleStripVin
                  angles={vg.angles}
                  sourceAngles={vg.sourceAngles}
                  vehicleName={`${record.year} ${record.make} ${record.model} ${record.trim}`}
                  showSource={imageMode === 'source'}
                  activeKey={activeAngle}
                  onActiveChange={setActiveAngle}
                />
              )}
            </div>

            {/* ── Right: data columns ── */}
            <div
              className="flex flex-wrap min-w-0"
              style={{
                ...(narrow ? { flex: '1 1 0%' } : { flex: '1 1 360px', maxWidth: 784 }),
                columnGap: 24,
                rowGap: 0,
              }}
            >

            {/* ColA: VIN · Config Used · VDP Link · Stock Number · Condition · Year · Make · Model · Exterior Color */}
            <div className="min-w-0" style={{ flex: '1 1 360px', minWidth: 360 }}>
              <DetailRow label="VIN">
                <DetailText primary>{record.vin}</DetailText>
              </DetailRow>
              {aiConfig && (
                <DetailRow label="Config Used">
                  <DetailText primary>{aiConfig.name}</DetailText>
                </DetailRow>
              )}
              <DetailRow label="VDP Link">
                <a
                  href={vdpLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(BODY1, 'text-[#473bab] hover:underline truncate block')}
                >
                  {vdpLink}
                </a>
              </DetailRow>
              <DetailRow label="Stock nº">
                <DetailText>{stockNo}</DetailText>
              </DetailRow>
              <DetailRow label="Condition">
                <DetailText>{record.condition}</DetailText>
              </DetailRow>
              <DetailRow label="Year">
                <DetailText>{record.year}</DetailText>
              </DetailRow>
              <DetailRow label="Make">
                <DetailText>{record.make}</DetailText>
              </DetailRow>
              <DetailRow label="Model">
                <DetailText>{record.model}</DetailText>
              </DetailRow>
              <DetailRow label="Exterior Color">
                <DetailText>{record.exteriorColor}</DetailText>
              </DetailRow>
            </div>

            {/* ColB: Price · MSRP · Transit */}
            <div className="min-w-0" style={{ flex: '1 1 360px', minWidth: 360 }}>
              <DetailRow label="Price">
                <DetailText>${record.price.toLocaleString()}</DetailText>
              </DetailRow>
              <DetailRow label="MSRP">
                <DetailText>${msrp.toLocaleString()}</DetailText>
              </DetailRow>
              <DetailRow label="Transit" noBorder>
                <TransitChip inTransit={inTransit} />
              </DetailRow>
            </div>

            </div>{/* end right data columns */}
          </div>
        </div>
      ) : activeTab !== 'details' ? (
        <div className="flex-1 flex items-center justify-center text-[rgba(17,16,20,0.38)]">
          <span className="font-['Roboto',sans-serif] text-[14px]">
            {activeTab === 'generated' ? 'Generated Images coming soon' : 'Source Images coming soon'}
          </span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Responsive 3-col layout:
               Wide   → [Image flex-2] [ColA 360px] [ColB 360px]
               Medium → [Image flex-2] [ColA 360px / ColB below ColA]
               Narrow → [Image full] / [ColA 360px] [ColB wraps]
               Mobile → fully stacked                                    */}
          <div className="flex flex-wrap gap-[24px] p-[16px]">

            {/* ── Left: hero + thumbnail strip
                 ≥1200px: flex 1 1 0% — takes space left after right block (max 784px)
                 <1200px: flex 1 1 0% equally — 50/50 split with right block       */}
            <div className="flex flex-col gap-[12px] min-w-[280px]" style={{ flex: '1 1 0%' }}>

              {/* Hero — fills parent width, 4:3 aspect ratio */}
              {/* Generated mode: dark bg + object-cover (full scene).       */}
              {/* Source mode:    grey bg + object-contain (no cropping).    */}
              <div
                className={cn(
                  'relative w-full rounded-[4px] overflow-hidden',
                  imageMode === 'source' ? 'bg-[#f0f2f4]' : 'bg-[#1a1a1a]',
                )}
                style={{ aspectRatio: '4/3' }}
              >
                {heroSrc
                  ? <img
                      src={heroSrc}
                      alt={`${record.make} ${record.model}`}
                      className={cn('w-full h-full', imageMode === 'source' ? 'object-contain' : 'object-cover')}
                    />
                  : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                  )
                }
                {/* Generated / Source toggle chips */}
                {vg && (
                  <div className="absolute top-[9px] left-[8px] flex gap-[4px]">
                    <button
                      onClick={() => setImageMode('generated')}
                      className={cn(
                        "h-[24px] px-[8px] rounded-[8px] text-[11px] font-['Roboto'] font-normal tracking-[0.16px] border-none cursor-pointer transition-colors",
                        imageMode === 'generated' ? 'bg-[#dddce0] text-[#1f1d25]' : 'bg-[rgba(244,245,246,0.80)] text-[#9c99a9]',
                      )}
                    >
                      Generated
                    </button>
                    {hasSource && (
                      <button
                        onClick={() => setImageMode('source')}
                        className={cn(
                          "h-[24px] px-[8px] rounded-[8px] text-[11px] font-['Roboto'] font-normal tracking-[0.16px] border-none cursor-pointer transition-colors",
                          imageMode === 'source' ? 'bg-[#dddce0] text-[#1f1d25]' : 'bg-[rgba(244,245,246,0.80)] text-[#9c99a9]',
                        )}
                      >
                        Source
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Angle thumbnail strip — 64×64 variant with drag, rover, modal */}
              {vg && (
                <AngleStripVin
                  angles={vg.angles}
                  sourceAngles={vg.sourceAngles}
                  vehicleName={`${record.year} ${record.make} ${record.model} ${record.trim}`}
                  showSource={imageMode === 'source'}
                  activeKey={activeAngle}
                  onActiveChange={setActiveAngle}
                />
              )}
            </div>

            {/* ── Right: ColA + ColB — each 360px min.
                 ≥1200px: flex 1 1 360px + max-width 784px → image takes the rest
                 <1200px: flex 1 1 0% → equal 50/50 with image; ColB stacked under ColA */}
            <div
              className="flex flex-wrap gap-[24px] min-w-0"
              style={narrow
                ? { flex: '1 1 0%' }
                : { flex: '1 1 360px', maxWidth: 784 }
              }
            >

              {/* Sub-column A — VIN info + Physical attributes */}
              <div className="min-w-0" style={{ flex: '1 1 360px', minWidth: 360 }}>
                <DetailRow label="VIN">
                  <DetailText primary>{record.vin}</DetailText>
                </DetailRow>
                {aiConfig && (
                  <DetailRow label="Config Used">
                    <DetailText primary>{aiConfig.name}</DetailText>
                  </DetailRow>
                )}
                <DetailRow label="Stock nº">
                  <DetailText>{stockNo}</DetailText>
                </DetailRow>
                <DetailRow label="Hash">
                  <DetailText>{hash}</DetailText>
                </DetailRow>
                <DetailRow label="VDP Link">
                  <a href={vdpLink} target="_blank" rel="noopener noreferrer"
                    className={cn(BODY1, 'text-[#473bab] hover:underline truncate block')}>
                    {vdpLink}
                  </a>
                </DetailRow>
                <DetailRow label="Mileage">
                  <DetailText>{mileage.toLocaleString()} mi</DetailText>
                </DetailRow>
                <DetailRow label="Condition">
                  <DetailText>{record.condition}</DetailText>
                </DetailRow>

                {/* Divider between groups */}
                <div className="h-[8px]" />

                <DetailRow label="Year">
                  <DetailText>{record.year}</DetailText>
                </DetailRow>
                <DetailRow label="Make">
                  <DetailText>{record.make}</DetailText>
                </DetailRow>
                <DetailRow label="Model">
                  <DetailText>{record.model}</DetailText>
                </DetailRow>
                <DetailRow label="Trim">
                  <DetailText>{record.trim}</DetailText>
                </DetailRow>
                <DetailRow label="Drivetrain">
                  <DetailText>{drivetrain}</DetailText>
                </DetailRow>
                <DetailRow label="Color">
                  <DetailText>{record.exteriorColor}</DetailText>
                </DetailRow>
                <DetailRow label="Fuel Type">
                  <DetailText>{fuelType}</DetailText>
                </DetailRow>
                <DetailRow label="Body Type" noBorder>
                  <DetailText>{bodyType}</DetailText>
                </DetailRow>
              </div>

              {/* Sub-column B — Location + Market */}
              <div className="min-w-0" style={{ flex: '1 1 360px', minWidth: 360 }}>
                <DetailRow label="State">
                  <DetailText>Texas</DetailText>
                </DetailRow>
                <DetailRow label="City">
                  <DetailText>Hudson Oaks</DetailText>
                </DetailRow>
                <DetailRow label="Street">
                  <DetailText>3202 E Interstate Hwy 20</DetailText>
                </DetailRow>
                <DetailRow label="Zip">
                  <DetailText>76087</DetailText>
                </DetailRow>

                <div className="h-[8px]" />

                <DetailRow label="Dealer">
                  <DetailText>Authorized Dealer</DetailText>
                </DetailRow>
                <DetailRow label="Price">
                  <DetailText>${record.price.toLocaleString()}</DetailText>
                </DetailRow>
                <DetailRow label="Days on Lot">
                  <DetailText>{record.dol} days</DetailText>
                </DetailRow>
                <DetailRow label="Days to Sell">
                  <DetailText>30</DetailText>
                </DetailRow>
                <DetailRow label="Price to Mkt">
                  <PriceToMarketChip value={record.priceToMarket} />
                </DetailRow>
                <DetailRow label="Priority">
                  <PriorityScoreChip score={record.priorityScore} />
                </DetailRow>
                <DetailRow label="Status" noBorder>
                  <DetailText>{record.vehicleStatus}</DetailText>
                </DetailRow>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
