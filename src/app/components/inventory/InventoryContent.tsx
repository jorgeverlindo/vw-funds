// ─── InventoryContent ─────────────────────────────────────────────────────────
// RideNow-only Inventory → Vehicles page.
// Figma: node 3556:990943 "Yamaha VIN List / AI Config"
//
// Structure:
//   BreadcrumbBar → Page Title → Tabs → Toolbar → VehicleInventoryGrid

import React, { useState, useCallback } from 'react';
import { cn } from '../../../lib/utils';
import {
  Search,
  MoreVertical,
  Download,
  BarChart2,
  Columns2,
} from 'lucide-react';
import changeViewIcon  from '../../../assets/icons/ChangeView_.svg';
import filtersIcon     from '../../../assets/icons/Filters.svg';
import chainLinkIcon   from '../../../assets/icons/Yamaha VIN List/Card & Row/Main Pane Header 2.0/chain-link-3,url.svg';
import { BreadcrumbBar } from '../BreadcrumbBar';
import { CommentsButton } from '../comments';
import { VehicleInventoryGrid } from './VehicleInventoryGrid';
import { VinDetailContent }     from './VinDetailContent';
import { VEHICLE_INVENTORY }    from '../../../data/inventory/vehicleInventory';
import type { SyndicationStatus } from '../../../data/inventory/vehicleInventory';

// Channel brand logos
import metaLogo    from '../../../assets/channels/Brand Logo/Meta.svg';
import googleLogo  from '../../../assets/channels/google.png';
import vinIqLogo   from '../../../assets/logos/channels/Yamaha VIN List/VinIQ.svg';
import aiEnabledLogo  from '../../../assets/logos/channels/Yamaha VIN List/AI_enabled.svg';
import optymizrLogo   from '../../../assets/logos/channels/Yamaha VIN List/Optymizr.png';
import fluencyLogo    from '../../../assets/logos/channels/Yamaha VIN List/fluency.png';

// ─── Typography ───────────────────────────────────────────────────────────────
const CAPTION = "font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px]";

// ─── Toolbar icon button ──────────────────────────────────────────────────────
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
  return (
    <button
      onClick={onClick}
      title={title}
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

// ─── InventoryContent ─────────────────────────────────────────────────────────
export function InventoryContent() {
  const [search,               setSearch]               = useState('');
  const [selected,             setSelected]             = useState<Set<string>>(new Set());
  const [activeTab,            setActiveTab]            = useState<'insights' | 'conquest' | 'vehicles'>('vehicles');
  const [selectedVinId,        setSelectedVinId]        = useState<string | null>(null);
  const [syndicationOverrides, setSyndicationOverrides] = useState<Map<string, SyndicationStatus>>(new Map());

  // Toggle syndication for a record (overrides the static data)
  const handleSyndicationToggle = useCallback((id: string) => {
    setSyndicationOverrides(prev => {
      const base = VEHICLE_INVENTORY.find(r => r.id === id)!.syndication;
      const current = prev.get(id) ?? base;
      const next = new Map(prev);
      next.set(id, current === 'syndicated' ? 'not-syndicated' : 'syndicated');
      return next;
    });
  }, []);

  // Filter records by search and apply syndication overrides
  const records = VEHICLE_INVENTORY
    .filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.vin.toLowerCase().includes(q) ||
        r.make.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.trim.toLowerCase().includes(q) ||
        r.exteriorColor.toLowerCase().includes(q)
      );
    })
    .map(r => syndicationOverrides.has(r.id)
      ? { ...r, syndication: syndicationOverrides.get(r.id)! }
      : r
    );

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
    const record = VEHICLE_INVENTORY.find(r => r.id === selectedVinId);
    if (record) {
      return (
        <VinDetailContent record={record} onBack={() => setSelectedVinId(null)} />
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

        {/* Channel icons wrapper */}
        <div className="flex items-center px-[8px] py-[12px]">
          <div className="flex gap-[12px] items-center px-[4px] bg-white rounded-[12px]">
            {CHANNELS.map(ch => (
              <div key={ch.id} className="relative flex gap-[2px] items-center">
                {/* Error badge */}
                {ch.hasError && (
                  <span className="absolute top-[-1px] right-[24px] size-[8px] bg-[#d2323f] rounded-full z-[1]" />
                )}
                <span className={[
                  'flex items-center justify-center shrink-0',
                  !ch.enabled && 'opacity-40',
                ].join(' ')}>
                  {ch.icon}
                </span>
                <span className={cn(
                  CAPTION,
                  ch.enabled ? 'text-[#1f1d25]' : 'text-[#9c99a9]',
                )}>
                  {ch.label}
                </span>
              </div>
            ))}
          </div>
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
          <ToolbarIconBtn title="Change view">
            <img src={changeViewIcon} alt="Change view" className="size-[20px]" />
          </ToolbarIconBtn>
        </div>
      </div>

      {/* ── Data grid ───────────────────────────────────────────────────── */}
      {activeTab === 'vehicles' ? (
        <VehicleInventoryGrid
          records={records}
          selected={selected}
          onToggleRow={handleToggleRow}
          onToggleAll={handleToggleAll}
          onVinClick={(id) => setSelectedVinId(id)}
          onSyndicationToggle={handleSyndicationToggle}
        />
      ) : (
        /* Placeholder for other tabs */
        <div className="flex-1 flex items-center justify-center text-[rgba(17,16,20,0.38)]">
          <span className="font-['Roboto',sans-serif] text-[14px]">
            {activeTab === 'insights' ? 'On-Brand Insights coming soon' : 'Conquest Insights coming soon'}
          </span>
        </div>
      )}

    </div>
  );
}

