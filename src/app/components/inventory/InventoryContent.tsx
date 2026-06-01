// ─── InventoryContent ─────────────────────────────────────────────────────────
// RideNow-only Inventory → Vehicles page.
// Figma: node 3556:990943 "Yamaha VIN List / AI Config"
//
// Structure:
//   BreadcrumbBar → Page Title → Tabs → Toolbar → VehicleInventoryGrid

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { AnimatePresence, motion, LayoutGroup } from 'motion/react';
import { cn } from '../../../lib/utils';
import {
  Search,
  MoreVertical,
  Download,
  BarChart2,
  Columns2,
} from 'lucide-react';
import { VehicleCardGrid }       from './VehicleCardGrid';
import { VehicleCardList }       from './VehicleCardList';
import { VehicleTableCondensed } from './VehicleTableCondensed';
const filtersIcon = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071149/vw-funds/icons/Filters.svg';
const chainLinkIcon = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071178/vw-funds/icons/Yamaha_VIN_List/Card___Row/Main_Pane_Header_2_0/chain-link-3_url.svg';
import { BreadcrumbBar } from '../BreadcrumbBar';
import { CommentsButton, useComments } from '../comments';
import { VehicleInventoryGrid } from './VehicleInventoryGrid';
import { VinDetailContent }     from './VinDetailContent';
import { useClient }            from '../../contexts/ClientContext';
import { useInventory }         from '../../contexts/InventoryContext';
import { buildVinSlug, extractVinFromSlug } from '../../utils/routing';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { AnglePreviewModal }     from './AnglePreviewModal';
import { ANGLES }                from './AngleBar';
import { VEHICLE_INVENTORY }    from '../../../data/inventory/vehicleInventory';
import type { SyndicationStatus, AIGenerationStatus } from '../../../data/inventory/vehicleInventory';
import type { AngleKey }         from '../../../data/inventory/types';
const emptyStateSrc = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071197/vw-funds/inventory/empty-state.svg';
// Canonical angle key order, aligned with ANGLES in AngleBar (index-safe)
const ANGLE_KEYS: AngleKey[] = ['34l', 'front', '34r', 'right', 'left', 'rear'];

// Channel brand logos
const metaLogo = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071126/vw-funds/channels/Brand_Logo/Meta.svg';
const googleLogo = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071130/vw-funds/channels/google.png';
const vinIqLogo = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071287/vw-funds/logos/channels/Yamaha_VIN_List/VinIQ.svg';
const aiEnabledLogo = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071281/vw-funds/logos/channels/Yamaha_VIN_List/AI_enabled.svg';
const optymizrLogo = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071286/vw-funds/logos/channels/Yamaha_VIN_List/Optymizr.png';
const fluencyLogo = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071289/vw-funds/logos/channels/Yamaha_VIN_List/fluency.png';
// ─── Typography ───────────────────────────────────────────────────────────────
const CAPTION = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";

// ─── Toolbar icon button ──────────────────────────────────────────────────────
// ─── Toolbar icon button — with slide-up tooltip ──────────────────────────
function ToolbarIconBtn({
  children,
  title,
  active,
  onClick,
}: {
  children: React.ReactNode;
  title?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {title && (
        <div
          className="absolute bottom-full left-1/2 z-50 pointer-events-none"
          style={{
            marginBottom: 6,
            transform: `translateX(-50%) translateY(${hovered ? '0px' : '6px'})`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 200ms ease, transform 200ms ease',
          }}
        >
          <div
            className="bg-[#1f1d25]/90 backdrop-blur-[2px] text-white rounded-[6px] px-[10px] py-[5px] whitespace-nowrap"
            style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, fontWeight: 500, lineHeight: 1.5, letterSpacing: '0.15px', boxShadow: '0 2px 8px rgba(0,0,0,0.28)' }}
          >
            {title}
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
            style={{ top: '100%', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid rgba(31,29,37,0.9)' }}
          />
        </div>
      )}
      <button
        onClick={onClick}
        className={[
          'p-[5px] rounded-[100px] flex items-center justify-center transition-colors shrink-0',
          active
            ? 'text-[#473bab] bg-[rgba(71,59,171,0.08)]'
            : 'text-[rgba(17,16,20,0.56)] hover:bg-[rgba(17,16,20,0.04)]',
        ].join(' ')}
      >
        <span className="size-[20px] flex items-center justify-center">
          {children}
        </span>
      </button>
    </div>
  );
}


// ─── Channel icon entry ───────────────────────────────────────────────────────
interface ChannelIconItem {
  id:       string;
  label:    string;
  enabled:  boolean;
  hasError?: boolean;
  icon:     React.ReactNode;
}

// ─── View-mode cycle icons ────────────────────────────────────────────────────
// Each icon represents the NEXT view in the cycle (what clicking will switch to).
// Paths taken directly from the project SVG assets so colour follows currentColor.

/** 3×2 grid of square tiles — cards-vertical.svg — represents Card Vertical (vertical-cards) */
const IconCardVertical = () => (
  <svg width="20" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.67 8C17.2223 8 17.67 8.44772 17.67 9V13.5C17.67 14.0523 17.2223 14.5 16.67 14.5H13.33C12.7777 14.5 12.33 14.0523 12.33 13.5V9C12.33 8.44772 12.7777 8 13.33 8H16.67ZM18.67 13.5C18.67 14.0523 19.1177 14.5 19.67 14.5H23C23.5523 14.5 24 14.0523 24 13.5V9C24 8.44772 23.5523 8 23 8H19.67C19.1177 8 18.67 8.44772 18.67 9V13.5ZM16.67 22C17.2223 22 17.67 21.5523 17.67 21V16.5C17.67 15.9477 17.2223 15.5 16.67 15.5H13.33C12.7777 15.5 12.33 15.9477 12.33 16.5V21C12.33 21.5523 12.7777 22 13.33 22H16.67ZM19.67 15.5C19.1177 15.5 18.67 15.9477 18.67 16.5V21C18.67 21.5523 19.1177 22 19.67 22H23C23.5523 22 24 21.5523 24 21V16.5C24 15.9477 23.5523 15.5 23 15.5H19.67ZM11.33 16.5C11.33 15.9477 10.8823 15.5 10.33 15.5H7C6.44771 15.5 6 15.9477 6 16.5V21C6 21.5523 6.44772 22 7 22H10.33C10.8823 22 11.33 21.5523 11.33 21V16.5ZM10.33 14.5C10.8823 14.5 11.33 14.0523 11.33 13.5V9C11.33 8.44772 10.8823 8 10.33 8H7C6.44771 8 6 8.44772 6 9V13.5C6 14.0523 6.44772 14.5 7 14.5H10.33Z"
      fill="currentColor"
    />
  </svg>
);

/** 2×3 grid of landscape rects — represents Card Horizontal (horizontal-cards) */
const IconCardHorizontal = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10.8335" y="13.3335" width="5.83333" height="3.33333" rx="1" fill="currentColor"/>
    <rect x="3.3335"  y="13.3335" width="5.83333" height="3.33333" rx="1" fill="currentColor"/>
    <rect x="10.8335" y="8.3335"  width="5.83333" height="3.33333" rx="1" fill="currentColor"/>
    <rect x="3.3335"  y="8.3335"  width="5.83333" height="3.33333" rx="1" fill="currentColor"/>
    <rect x="10.8335" y="3.3335"  width="5.83333" height="3.33333" rx="1" fill="currentColor"/>
    <rect x="3.3335"  y="3.3335"  width="5.83333" height="3.33333" rx="1" fill="currentColor"/>
  </svg>
);

/** 3 full-width rounded bars — View mode icon.svg — represents Table Large */
const IconTableLarge = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 4.16683C2.5 3.70659 2.8731 3.3335 3.33333 3.3335H16.6667C17.1269 3.3335 17.5 3.70659 17.5 4.16683V5.8335C17.5 6.29373 17.1269 6.66683 16.6667 6.66683H3.33333C2.8731 6.66683 2.5 6.29373 2.5 5.8335V4.16683Z" fill="currentColor"/>
    <path d="M2.5 9.16683C2.5 8.70659 2.8731 8.3335 3.33333 8.3335H16.6667C17.1269 8.3335 17.5 8.70659 17.5 9.16683V10.8335C17.5 11.2937 17.1269 11.6668 16.6667 11.6668H3.33333C2.8731 11.6668 2.5 11.2937 2.5 10.8335V9.16683Z" fill="currentColor"/>
    <path d="M2.5 14.1668C2.5 13.7066 2.8731 13.3335 3.33333 13.3335H16.6667C17.1269 13.3335 17.5 13.7066 17.5 14.1668V15.8335C17.5 16.2937 17.1269 16.6668 16.6667 16.6668H3.33333C2.8731 16.6668 2.5 16.2937 2.5 15.8335V14.1668Z" fill="currentColor"/>
  </svg>
);

/** 4 thin full-width lines — represents Dense Table / back to Data Grid */
const IconTableSmall = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 15H19C19.55 15 20 14.55 20 14C20 13.45 19.55 13 19 13H5C4.45 13 4 13.45 4 14C4 14.55 4.45 15 5 15ZM5 19H19C19.55 19 20 18.55 20 18C20 17.45 19.55 17 19 17H5C4.45 17 4 17.45 4 18C4 18.55 4.45 19 5 19ZM5 11H19C19.55 11 20 10.55 20 10C20 9.45 19.55 9 19 9H5C4.45 9 4 9.45 4 10C4 10.55 4.45 11 5 11ZM4 6C4 6.55 4.45 7 5 7H19C19.55 7 20 6.55 20 6C20 5.45 19.55 5 19 5H5C4.45 5 4 5.45 4 6Z" fill="currentColor"/>
  </svg>
);

// ─── InventoryContent ─────────────────────────────────────────────────────────
export function InventoryContent({ isAgentPaneOpen = false }: { isAgentPaneOpen?: boolean }) {
  const { client } = useClient();
  const { isPanelOpen } = useComments();
  const { vehicles: inventoryVehicles } = useInventory();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { vinSlug } = useParams<{ vinSlug?: string }>();
  // Hide channel labels when either side panel (comments or agent) is open —
  // they overlap the narrow toolbar in that layout.
  const hideChannelLabels = isPanelOpen || isAgentPaneOpen;

  // ── View mode — cycles on each click ──────────────────────────────────────
  // Cycle order: Table Large → Card Vertical → Card Horizontal → Table Small → Table Large
  // The button icon always shows the NEXT view (where clicking takes you).
  type ViewMode = 'table-large' | 'vertical-cards' | 'horizontal-cards' | 'table-small';
  const VIEW_MODES: { id: ViewMode; label: string; NextIcon: React.FC }[] = [
    { id: 'table-large',      label: 'Card Vertical',   NextIcon: IconCardVertical   }, // cards-vertical.svg
    { id: 'vertical-cards',   label: 'Card Horizontal', NextIcon: IconCardHorizontal }, // Yamaha card-list icon
    { id: 'horizontal-cards', label: 'Table Small',     NextIcon: IconTableSmall     }, // 4-line dense icon
    { id: 'table-small',      label: 'Table Large',     NextIcon: IconTableLarge     }, // 3-bar wide icon
  ];
  const [viewMode, setViewMode] = useState<ViewMode>('table-large');
  const cycleView = useCallback(() => {
    setViewMode(prev => {
      const idx = VIEW_MODES.findIndex(m => m.id === prev);
      return VIEW_MODES[(idx + 1) % VIEW_MODES.length].id;
    });
  }, []);
  const [search,               setSearch]               = useState('');
  const [selected,             setSelected]             = useState<Set<string>>(new Set());
  const [activeTab,            setActiveTab]            = useState<'insights' | 'conquest' | 'vehicles'>('vehicles');
  // ── VIN detail URL sync ───────────────────────────────────────────────────
  // Derive initial selectedVinId from URL on first render so that deep-links
  // and page refreshes land directly on the correct VIN detail page.
  const [selectedVinId, setSelectedVinId] = useState<string | null>(() => {
    if (!vinSlug) return null;
    const vin = extractVinFromSlug(vinSlug);
    return VEHICLE_INVENTORY.find(r => r.vin.toUpperCase() === vin)?.id ?? null;
  });
  const [syndicationOverrides,  setSyndicationOverrides]  = useState<Map<string, SyndicationStatus>>(new Map());
  const [aiGenerationOverrides, setAiGenerationOverrides] = useState<Map<string, AIGenerationStatus>>(() => {
    // Persist across page reloads — Disable/Enable should survive navigation
    // without ever touching the vehicleGroup / generated images.
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AI_GENERATION_OVERRIDES);
      const obj: Record<string, AIGenerationStatus> = raw ? JSON.parse(raw) : {};
      return new Map(Object.entries(obj));
    } catch { return new Map(); }
  });

  // Keep URL in sync when vinSlug changes externally (browser back/forward)
  useEffect(() => {
    if (!vinSlug) {
      setSelectedVinId(null);
      return;
    }
    const vin = extractVinFromSlug(vinSlug);
    const record = VEHICLE_INVENTORY.find(r => r.vin.toUpperCase() === vin);
    setSelectedVinId(record?.id ?? null);
  }, [vinSlug]);

  // Navigate to VIN detail URL — base path is the inventory path without any vinSlug
  const baseInventoryPath = vinSlug
    ? location.pathname.slice(0, location.pathname.lastIndexOf('/' + vinSlug))
    : location.pathname;

  const handleVinClick = useCallback((id: string) => {
    const record = inventoryVehicles.find(r => r.id === id);
    if (!record) return;
    const slug = buildVinSlug(record.make, record.model, record.trim, record.exteriorColor, record.vin);
    setSelectedVinId(id);
    navigate(`${baseInventoryPath}/${slug}`);
  }, [baseInventoryPath, navigate]);

  const handleVinBack = useCallback(() => {
    setSelectedVinId(null);
    navigate(baseInventoryPath);
  }, [baseInventoryPath, navigate]);

  // ── Source Images modal ────────────────────────────────────────────────────
  const [sourceImagesVinId,    setSourceImagesVinId]    = useState<string | null>(null);
  const [sourceImagesAngleIdx, setSourceImagesAngleIdx] = useState(0);

  const handleViewSourceImages = useCallback((id: string) => {
    setSourceImagesAngleIdx(0);
    setSourceImagesVinId(id);
  }, []);

  // Toggle syndication for a record (overrides the static data)
  const handleSyndicationToggle = useCallback((id: string) => {
    setSyndicationOverrides(prev => {
      const base = inventoryVehicles.find(r => r.id === id)!.syndication;
      const current = prev.get(id) ?? base;
      const next = new Map(prev);
      next.set(id, current === 'syndicated' ? 'not-syndicated' : 'syndicated');
      return next;
    });
  }, []);

  // Open comments panel with the vehicle attached as entity reference
  const commentsCtx = useComments();
  const handleAttachComment = useCallback((id: string) => {
    const record = inventoryVehicles.find(r => r.id === id);
    if (!record || !commentsCtx) return;
    commentsCtx.openPanelForEntity({
      id:    record.vin,
      label: `${record.year} ${record.make} ${record.model} ${record.trim} — ${record.vin}`,
      type:  'vehicle',
    });
  }, [commentsCtx]);

  // Toggle AI generation for a record — persisted to localStorage so generated
  // images are never affected: only the aiGeneration flag is written.
  const handleAiGenerationToggle = useCallback((id: string) => {
    setAiGenerationOverrides(prev => {
      const base    = inventoryVehicles.find(r => r.id === id)!.aiGeneration;
      const current = prev.get(id) ?? base;
      const next    = new Map(prev);
      next.set(id, current === 'enabled' ? 'disabled' : 'enabled');
      // Persist — convert Map to plain object for JSON serialisation
      try {
        const obj = Object.fromEntries(next.entries());
        localStorage.setItem(STORAGE_KEYS.AI_GENERATION_OVERRIDES, JSON.stringify(obj));
      } catch { /* quota exceeded — fail silently */ }
      return next;
    });
  }, [inventoryVehicles]);

  // Filter records by search and apply overrides
  const records = inventoryVehicles
    .filter(r => {
      if (!search) return true;
      const q     = search.toLowerCase();
      // Strip PT-BR thousand-separator periods and commas so "2.0" matches "2026",
      // "4.899" matches "4899", etc.
      const qNum  = q.replace(/[.,]/g, '');

      return (
        // Text fields — raw query
        r.vin.toLowerCase().includes(q)            ||
        r.make.toLowerCase().includes(q)           ||
        r.model.toLowerCase().includes(q)          ||
        r.trim.toLowerCase().includes(q)           ||
        r.exteriorColor.toLowerCase().includes(q)  ||
        r.condition.toLowerCase().includes(q)      ||
        r.vehicleStatus.toLowerCase().includes(q)  ||
        // Numeric fields — normalised query (strip separators)
        r.year.toString().includes(qNum)           ||
        r.price.toString().includes(qNum)          ||
        r.dol.toString().includes(qNum)
      );
    })
    .map(r => ({
      ...r,
      ...(syndicationOverrides.has(r.id)  && { syndication:  syndicationOverrides.get(r.id)! }),
      ...(aiGenerationOverrides.has(r.id) && { aiGeneration: aiGenerationOverrides.get(r.id)! }),
    }));

  const handleToggleRow = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(records.map(r => r.id)) : new Set());
  };

  // ── Channel icons config ───────────────────────────────────────────────────
  const CHANNELS: ChannelIconItem[] = [
    {
      id: 'ai-gen',
      label: 'AI Generation',
      enabled: true,
      icon: <img src={aiEnabledLogo} alt="AI Generation" className="size-[18px] object-contain" />,
    },
    {
      id: 'vin-iq',
      label: 'VIN IQ',
      enabled: true,
      icon: <img src={vinIqLogo} alt="VIN IQ" className="size-[18px] object-contain" />,
    },
    {
      id: 'meta',
      label: 'Meta',
      enabled: true,
      hasError: true,
      icon: <img src={metaLogo} alt="Meta" className="size-[18px] object-contain" />,
    },
    {
      id: 'google-ads',
      label: 'Google Ads',
      enabled: false,
      icon: <img src={googleLogo} alt="Google Ads" className="size-[18px] object-contain" />,
    },
    {
      id: 'optymizr',
      label: 'Optymyzr',
      enabled: false,
      icon: <img src={optymizrLogo} alt="Optymyzr" className="size-[18px] object-contain" />,
    },
    {
      id: 'fluency',
      label: 'Fluency',
      enabled: true,
      icon: <img src={fluencyLogo} alt="Fluency" className="size-[18px] object-contain" />,
    },
  ];

  const tabs = [
    { id: 'insights' as const,  label: 'On-Brand Insights' },
    { id: 'conquest' as const,  label: 'Conquest Insights' },
    { id: 'vehicles' as const,  label: 'Vehicles' },
  ];

  // ── VIN Detail: replace entire content (no toolbar/tabs overhead) ──────────
  if (selectedVinId) {
    const record = inventoryVehicles.find(r => r.id === selectedVinId);
    if (record) {
      return (
        <VinDetailContent
          record={record}
          onBack={handleVinBack}
          variant={client.clientId === 'ride-now' ? 'sport' : 'auto'}
        />
      );
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ── Header area ─────────────────────────────────────────────────── */}
      <div className="flex-none px-6 pt-4 pb-0">

        {/* Breadcrumb + Comments */}
        <div className="flex items-center justify-between mb-1">
          <BreadcrumbBar
            items={[
              { label: 'Inventory' },
              { label: 'Accounts' },
              { label: 'RideNow Powersports Weatherford' },
            ]}
            activeLabel="Vehicles"
          />
          <CommentsButton />
        </div>

        {/* Page Title — icon + account name */}
        <div className="flex items-center gap-[8px] pb-[2px] pt-[4px]">
          {/* Generic Left Pane icon — cropped viewBox, same as ProjectsModule */}
          <span className="text-[rgba(17,16,20,0.56)] flex items-center justify-center">
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
          </span>
          <h1 className="font-['Roboto',sans-serif] font-medium text-[16px] leading-[1.5] tracking-[0.15px] text-[#1f1d25] whitespace-nowrap">
            RideNow Powersports Weatherford
          </h1>
        </div>

        {/* Tab bar */}
        <div className="flex items-end mt-2 h-[41px] overflow-clip">
          <div className="flex items-start">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'relative px-[16px] py-[9px] font-[\'Roboto\',sans-serif] font-medium text-[14px] leading-[24px] tracking-[0.4px] capitalize whitespace-nowrap transition-colors cursor-pointer border-none bg-transparent',
                    isActive
                      ? 'text-[#473bab]'
                      : 'text-[#686576] hover:text-[#1f1d25]',
                  ].join(' ')}
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

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex-none flex items-center gap-[8px] px-6 py-[10px] border-b border-[rgba(0,0,0,0.08)]">

        {/* Filter icon */}
        <ToolbarIconBtn title="Show filters">
          <img src={filtersIcon} alt="Filters" className="size-[20px]" />
        </ToolbarIconBtn>

        {/* Ad Channels primary button */}
        <button className="flex items-center gap-[8px] bg-[#473bab] hover:bg-[#3D3295] text-white px-[10px] py-[4px] rounded-[100px] shrink-0 transition-colors">
          <img src={chainLinkIcon} alt="" className="size-[16px]" />
          <span className="font-['Roboto',sans-serif] font-medium text-[13px] leading-[22px] tracking-[0.46px] whitespace-nowrap">
            Ad Channels
          </span>
        </button>

        {/* Kebab */}
        <ToolbarIconBtn title="More options">
          <MoreVertical size={18} />
        </ToolbarIconBtn>

        {/* Search */}
        <div className="relative shrink-0">
          <Search
            size={14}
            className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[rgba(17,16,20,0.38)]"
          />
          <input
            type="text"
            placeholder="Find below"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-[200px] h-[34px] pl-[30px] pr-[10px] bg-[#f9fafa] border border-[#cac9cf] rounded-[20px] text-[12px] font-normal text-[#1f1d25] placeholder:text-[rgba(17,16,20,0.38)] outline-none focus:border-[#473bab] transition-colors"
          />
        </div>

        {/* Spacer left — centres channels between search and counter */}
        <div className="flex-1" />

        {/* Channel icons wrapper — fill #f4f5f6, radius 12, p-8 all sides, gap-12 */}
        <div className="flex gap-[12px] items-center px-[8px] py-[6px] rounded-[12px]" style={{ background: '#f4f5f6' }}>
            {CHANNELS.map(ch => (
              <div key={ch.id} className="flex gap-[2px] items-center">
                {/* Icon wrapper — badge anchored here so it moves with the icon */}
                <span className="relative flex items-center justify-center shrink-0" style={{ opacity: !ch.enabled ? 0.4 : 1 }}>
                  {ch.icon}
                  {ch.hasError && (
                    <span className="absolute top-[-2px] right-[-2px] size-[8px] bg-[#d2323f] rounded-full z-[1]" />
                  )}
                </span>
                {/* Label — hidden below lg to avoid wrapping on narrower screens */}
                <span className={cn(
                  CAPTION,
                  hideChannelLabels ? 'hidden' : 'hidden min-[1260px]:inline',
                  ch.enabled ? 'text-[#1f1d25]' : 'text-[#9c99a9]',
                )}>
                  {ch.label}
                </span>
              </div>
            ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Item count */}
        <div className="flex gap-[3px] items-center shrink-0">
          <span className={cn(CAPTION, 'text-[#686576]')}>{records.length}</span>
          <span className={cn(CAPTION, 'text-[#686576]')}>Items</span>
        </div>

        {/* View icons */}
        <div className="flex items-center gap-[8px]">
          <ToolbarIconBtn title="Manage columns">
            <Columns2 size={18} />
          </ToolbarIconBtn>
          <ToolbarIconBtn title="Export">
            <Download size={18} />
          </ToolbarIconBtn>
          <ToolbarIconBtn title="Charts">
            <BarChart2 size={18} />
          </ToolbarIconBtn>
          {(() => {
            // Each mode carries its own NextIcon + label pointing to the next destination.
            // Use the CURRENT mode's data — not nextMode's.
            const cur = VIEW_MODES.find(m => m.id === viewMode)!;
            return (
              <ToolbarIconBtn title={cur.label} onClick={cycleView}>
                <cur.NextIcon />
              </ToolbarIconBtn>
            );
          })()}
        </div>
      </div>

      {/* ── View area ───────────────────────────────────────────────────── */}
      {activeTab !== 'vehicles' ? (
        <div className="flex-1 flex items-center justify-center text-[rgba(17,16,20,0.38)]">
          <span className="font-['Roboto',sans-serif] text-[14px]">
            {activeTab === 'insights' ? 'On-Brand Insights coming soon' : 'Conquest Insights coming soon'}
          </span>
        </div>
      ) : (
        <LayoutGroup id="inventory-views">
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <AnimatePresence mode="sync" initial={false}>
            {viewMode === 'table-large' && (
              <motion.div
                key="table-large"
                className="absolute inset-0 flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <VehicleInventoryGrid
                  records={records}
                  selected={selected}
                  onToggleRow={handleToggleRow}
                  onToggleAll={handleToggleAll}
                  onVinClick={handleVinClick}
                  onSyndicationToggle={handleSyndicationToggle}
                  onAiGenerationToggle={handleAiGenerationToggle}
                  onViewSourceImages={handleViewSourceImages}
                  onAttachComment={handleAttachComment}
                />
              </motion.div>
            )}
            {viewMode === 'vertical-cards' && (
              <motion.div
                key="vertical-cards"
                className="absolute inset-0 flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <VehicleCardGrid
                  records={records}
                  selected={selected}
                  onToggleRow={handleToggleRow}
                  onVinClick={handleVinClick}
                  onSyndicationToggle={handleSyndicationToggle}
                  onAiGenerationToggle={handleAiGenerationToggle}
                  onViewSourceImages={handleViewSourceImages}
                  onAttachComment={handleAttachComment}
                />
              </motion.div>
            )}
            {viewMode === 'horizontal-cards' && (
              <motion.div
                key="horizontal-cards"
                className="absolute inset-0 flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <VehicleCardList
                  records={records}
                  selected={selected}
                  onToggleRow={handleToggleRow}
                  onVinClick={handleVinClick}
                  onSyndicationToggle={handleSyndicationToggle}
                  onAiGenerationToggle={handleAiGenerationToggle}
                  onViewSourceImages={handleViewSourceImages}
                  onAttachComment={handleAttachComment}
                />
              </motion.div>
            )}
            {viewMode === 'table-small' && (
              <motion.div
                key="table-small"
                className="absolute inset-0 flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <VehicleTableCondensed
                  records={records}
                  selected={selected}
                  onToggleRow={handleToggleRow}
                  onToggleAll={handleToggleAll}
                  onVinClick={handleVinClick}
                  onSyndicationToggle={handleSyndicationToggle}
                  onAiGenerationToggle={handleAiGenerationToggle}
                  onViewSourceImages={handleViewSourceImages}
                  onAttachComment={handleAttachComment}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </LayoutGroup>
      )}

      {/* ── Source Images lightbox ─────────────────────────────────────────── */}
      {(() => {
        const sourceRecord = sourceImagesVinId
          ? records.find(r => r.id === sourceImagesVinId) ?? null
          : null;
        const vg = sourceRecord?.vehicleGroup ?? null;
        const angleKey  = ANGLE_KEYS[sourceImagesAngleIdx];
        const angleLabel = ANGLES[sourceImagesAngleIdx]?.label ?? '';
        const vehicleName = sourceRecord
          ? `${sourceRecord.year} ${sourceRecord.make} ${sourceRecord.model}`
          : '';
        return (
          <AnglePreviewModal
            isOpen={!!sourceImagesVinId}
            onClose={() => setSourceImagesVinId(null)}
            angleLabel={angleLabel}
            vehicleName={vehicleName}
            generatedSrc={vg?.angles?.[angleKey] ?? null}
            sourceSrc={vg?.sourceAngles?.[angleKey] ?? null}
            defaultSrc={emptyStateSrc}
            defaultTab="source"
            onPrev={() => setSourceImagesAngleIdx(i => (i - 1 + ANGLE_KEYS.length) % ANGLE_KEYS.length)}
            onNext={() => setSourceImagesAngleIdx(i => (i + 1) % ANGLE_KEYS.length)}
          />
        );
      })()}

    </div>
  );
}

