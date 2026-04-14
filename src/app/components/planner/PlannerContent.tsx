import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DateRangeInput } from '../DateRangeInput';
import { DateRangePicker } from '../DateRangePicker';
import { DateRange } from 'react-day-picker';
import { ActionButton } from '../ActionButton';
import { cn } from '../../../lib/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { StatusChip } from '../StatusChip';
import { FilterSelect } from '../FilterSelect';

// Assets
import imgTiguan from "figma:asset/974b27e56590a74d3b517b836efbfb505eb10a20.png";
import imgAtlas from "figma:asset/5b760d55d2388a38009c20fbc7474decb0d7b3fe.png";
import imgMeta from "figma:asset/e67775d65913cad5ff67c8c775bb9fcaee7b8d74.png";
import imgDynamic from "figma:asset/dcd4a062f63eda60d1f2ae0b47f935693f998f44.png";
import imgAsset1 from "figma:asset/5dc24ae6f6828e22eaa3e6548f18373b4b398b01.png";
import imgAsset2 from "figma:asset/f925b175d9f45ba629bdedc9c27563c3216090ba.png";
import imgAsset3 from "figma:asset/dcd4a062f63eda60d1f2ae0b47f935693f998f44.png";
import imgAsset4 from "figma:asset/5b760d55d2388a38009c20fbc7474decb0d7b3fe.png";
import imgAsset5 from "figma:asset/974b27e56590a74d3b517b836efbfb505eb10a20.png";

import svgPathsPlanner from '../../../imports/svg-1e0o7zpcna';
import svgPathsView from '../../../imports/svg-rfznq86uvs';
import svgPathsBans from '../../../imports/svg-e6acmaei7k';

// ─── Color System ────────────────────────────────────────────────────────────
/** Strict sequential 9-color palette — index % 9 gives the assigned color.
 *  Cycle 1 (items 1–4): Lilac → Mint → Salmon → Sand
 *  Cycle 2 (items 5–9): Periwinkle → Dusty Pink → Sage → Peach → Sky Blue
 *  After item 9: restart from Lilac.
 */
export const GANTT_COLORS = [
  '#C5C3E8', // 1 Lilac
  '#8ED5BC', // 2 Mint
  '#F5B4AB', // 3 Salmon
  '#E8D4A0', // 4 Sand
  '#A9C4E8', // 5 Periwinkle
  '#E8B8CE', // 6 Dusty Pink
  '#B8D4A8', // 7 Sage
  '#F0C9A0', // 8 Peach
  '#B0D8E0', // 9 Sky Blue
] as const;
export const APPROVED_BUDGET = 1_450_000;

// ─── Types ───────────────────────────────────────────────────────────────────
const DragTypes = { MOVE: 'move', RESIZE: 'resize' } as const;

export interface Campaign {
  id: string;
  name: string;
  campaignGroup: string;
  quarter: string;
  mediaType: string[];
  startDate: string;
  endDate: string;
  budget: number;
  thumbnail: string;
  color: string;
  startDayIndex: number;
  durationDays: number;
  assetCount: number;
  assets: string[];
  status: 'Approved' | 'Pending' | 'Revision Requested';
}

interface HierarchyGroup {
  id: string;
  name: string;
  items: (Campaign | HierarchyGroup)[];
  isGroup: true;
}

type TimelineItem = Campaign | HierarchyGroup;

// ─── Mock Data ───────────────────────────────────────────────────────────────
export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'tiguan-nbc',
    name: '2026 Tiguan NBC Spot On CTV Campaign',
    campaignGroup: 'SUV Launch Campaigns',
    quarter: 'Q1–Q2',
    mediaType: ['SEM', 'CRM'],
    startDate: 'Mar 3, 2026',
    endDate: 'Apr 12, 2026',
    budget: 450_000,
    thumbnail: imgAsset1,
    color: GANTT_COLORS[0],
    startDayIndex: 1,
    durationDays: 28,
    assetCount: 3,
    assets: [imgAsset1, imgAsset2, imgAsset3],
    status: 'Approved',
  },
  {
    id: 'atlas-search-1',
    name: '2026 Atlas Search Campaign',
    campaignGroup: 'SUV Launch Campaigns',
    quarter: 'Q1',
    mediaType: ['SEM'],
    startDate: 'Mar 2, 2026',
    endDate: 'Apr 12, 2026',
    budget: 120_000,
    thumbnail: imgAtlas,
    color: GANTT_COLORS[1],
    startDayIndex: 1,
    durationDays: 42,
    assetCount: 2,
    assets: [imgAtlas, imgTiguan],
    status: 'Pending',
  },
  {
    id: 'meta-suv',
    name: 'Meta New Vehicle Traffic Campaign (SUV Focus)',
    campaignGroup: 'SUV Launch Campaigns',
    quarter: 'Q1–Q2',
    mediaType: ['Email Campaigns'],
    startDate: 'Mar 9, 2026',
    endDate: 'Apr 12, 2026',
    budget: 300_000,
    thumbnail: imgMeta,
    color: GANTT_COLORS[2],
    startDayIndex: 1,
    durationDays: 23,
    assetCount: 10,
    assets: [imgMeta, imgTiguan, imgAtlas, imgDynamic, imgMeta, imgTiguan, imgAtlas, imgDynamic, imgMeta, imgTiguan],
    status: 'Approved',
  },
  {
    id: 'dynamic-inventory',
    name: 'Dynamic Inventory Ad Campaigns (All New Vehicles)',
    campaignGroup: 'Always-On Inventory Ads',
    quarter: 'Q1–Q2',
    mediaType: ['SEM', 'CRM'],
    startDate: 'Mar 16, 2026',
    endDate: 'Apr 12, 2026',
    budget: 150_000,
    thumbnail: imgDynamic,
    color: GANTT_COLORS[3],
    startDayIndex: 1,
    durationDays: 42,
    assetCount: 1,
    assets: [imgDynamic],
    status: 'Approved',
  },
  {
    id: 'dealer-branding',
    name: 'Dealer Branding Search Campaign',
    campaignGroup: 'Dealer Network Awareness',
    quarter: 'Q1–Q2',
    mediaType: ['SEM', 'CRM'],
    startDate: 'Mar 2, 2026',
    endDate: 'Apr 12, 2026',
    budget: 200_000,
    thumbnail: imgAsset5,
    color: GANTT_COLORS[4],
    startDayIndex: 1,
    durationDays: 35,
    assetCount: 12,
    assets: [imgAsset5, imgAsset2, imgAsset3, imgAsset4, imgAsset1, imgAsset2, imgAsset3, imgAsset4, imgAsset1, imgAsset2, imgAsset3, imgAsset4],
    status: 'Revision Requested',
  },
  {
    id: 'website-display',
    name: 'Website Display/Retargeting Campaign',
    campaignGroup: 'Brand & Awareness Campaigns',
    quarter: 'Q1–Q2',
    mediaType: ['Outbound Sales Calls/Call Tracking'],
    startDate: 'Mar 9, 2026',
    endDate: 'Apr 12, 2026',
    budget: 180_000,
    thumbnail: imgAtlas,
    color: GANTT_COLORS[0], // loops back to index 5 % 5 = 0
    startDayIndex: 5,
    durationDays: 20,
    assetCount: 7,
    assets: [imgAtlas, imgTiguan, imgMeta, imgDynamic, imgAtlas, imgTiguan, imgMeta],
    status: 'Pending',
  },
];

// ─── Hierarchy Mapping ───────────────────────────────────────────────────────
const CAMPAIGN_GROUP_MAP: Record<string, { id: string; name: string }> = {
  'SUV Launch Campaigns':         { id: 'suv-launch',       name: 'SUV Launch Campaigns' },
  'Always-On Inventory Ads':      { id: 'model-perf',       name: 'Model-Specific Performance Campaigns' },
  'Dealer Network Awareness':     { id: 'dealer-awareness', name: 'Dealer Network Awareness' },
  'Brand & Awareness Campaigns':  { id: 'brand-awareness',  name: 'Brand & Awareness Campaigns' },
};

const GROUP_ORDER = ['suv-launch', 'model-perf', 'dealer-awareness', 'brand-awareness'];

/** Builds the Gantt hierarchy tree from the current campaigns array */
export function buildGanttHierarchy(campaigns: Campaign[]): HierarchyGroup[] {
  const grouped = new Map<string, Campaign[]>();

  campaigns.forEach(c => {
    const def = CAMPAIGN_GROUP_MAP[c.campaignGroup];
    if (def) {
      const arr = grouped.get(def.id) ?? [];
      arr.push(c);
      grouped.set(def.id, arr);
    }
  });

  const q1Items: HierarchyGroup[] = GROUP_ORDER
    .filter(id => grouped.has(id))
    .map(id => {
      const def = Object.values(CAMPAIGN_GROUP_MAP).find(g => g.id === id)!;
      return { id, name: def.name, isGroup: true as const, items: grouped.get(id) ?? [] };
    });

  return [
    { id: 'q1', name: 'Q1 Campaigns', isGroup: true, items: q1Items },
    { id: 'q2', name: 'Q2 Campaigns', isGroup: true, items: [] },
  ];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function GanttCampaignItem({
  campaign,
  onSelect,
}: {
  campaign: Campaign;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();

  const [{ isDragging }, drag] = useDrag(() => ({
    type: DragTypes.MOVE,
    item: { id: campaign.id, type: DragTypes.MOVE, startDayIndex: campaign.startDayIndex, durationDays: campaign.durationDays },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }), [campaign]);

  const [{ isResizing }, dragResize] = useDrag(() => ({
    type: DragTypes.RESIZE,
    item: { id: campaign.id, type: DragTypes.RESIZE, startDayIndex: campaign.startDayIndex, durationDays: campaign.durationDays },
    collect: monitor => ({ isResizing: monitor.isDragging() }),
  }), [campaign]);

  const width = campaign.durationDays * 35;
  const left = (campaign.startDayIndex - 1) * 35;

  return (
    <div
      ref={drag}
      onClick={() => onSelect(campaign.id)}
      className={cn(
        'absolute top-[6px] bottom-[6px] rounded-[4px] shadow-sm flex items-center px-2 cursor-move transition-shadow hover:shadow-md',
        isDragging || isResizing ? 'opacity-50' : 'opacity-100',
      )}
      style={{ left: `${left}px`, width: `${width}px`, backgroundColor: campaign.color }}
    >
      <div className="flex items-center gap-2 overflow-hidden w-full h-full">
        <div className="w-9 h-9 rounded-[4px] overflow-hidden shrink-0 border border-white/40 bg-white/20">
          <ImageWithFallback src={campaign.thumbnail} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] font-medium text-[#1f1d25] truncate tracking-[0.17px] leading-[1.43]">
            {t(campaign.name)}
          </span>
          <span className="text-[11px] text-[#1f1d25] font-normal tracking-[0.4px] leading-[1.66]">
            ${campaign.budget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* asset badge */}
      {campaign.assetCount > 0 && (
        <div className="ml-1 shrink-0 bg-white/60 backdrop-blur-sm rounded px-1 text-[9px] font-bold text-[#1f1d25] border border-white/40">
          {campaign.assetCount}
        </div>
      )}

      {/* drag handle dots */}
      <div className="ml-auto shrink-0 flex flex-col gap-[2px] opacity-40">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex gap-[2px]">
            <div className="w-[3px] h-[3px] rounded-full bg-[#1f1d25]" />
            <div className="w-[3px] h-[3px] rounded-full bg-[#1f1d25]" />
          </div>
        ))}
      </div>

      {/* Resize handle */}
      <div
        ref={dragResize}
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 transition-colors z-30"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
export interface PlannerContentProps {
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string | null) => void;
  onNewCampaign?: () => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  /** Campaigns state owned by the parent (AppContent) */
  campaigns: Campaign[];
  onCampaignsChange: (campaigns: Campaign[]) => void;
}

// ─── PlannerInner ─────────────────────────────────────────────────────────────
function PlannerInner({
  selectedCampaignId,
  onSelectCampaign,
  onNewCampaign,
  dateRange,
  onDateRangeChange,
  campaigns,
  onCampaignsChange,
}: PlannerContentProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'list' | 'gantt' | 'grid'>('gantt');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(['q1', 'suv-launch', 'model-perf', 'dealer-awareness', 'brand-awareness']),
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Single unified scroll ref — no independent sidebar / header refs needed
  const ganttBodyRef = useRef<HTMLDivElement>(null);

  // Keep a ref so drag handlers always see the latest campaigns/callback
  const campaignsRef = useRef(campaigns);
  useEffect(() => { campaignsRef.current = campaigns; }, [campaigns]);
  const onCampaignsChangeRef = useRef(onCampaignsChange);
  useEffect(() => { onCampaignsChangeRef.current = onCampaignsChange; }, [onCampaignsChange]);

  // Auto-expand groups when a new campaign is added
  const prevLength = useRef(campaigns.length);
  useEffect(() => {
    if (campaigns.length > prevLength.current) {
      const newest = campaigns[campaigns.length - 1];
      const def = CAMPAIGN_GROUP_MAP[newest.campaignGroup];
      if (def) {
        setExpandedIds(prev => {
          const next = new Set(prev);
          next.add('q1');
          next.add(def.id);
          return next;
        });
      }
    }
    prevLength.current = campaigns.length;
  }, [campaigns.length]);

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Drag interaction (uses refs to avoid stale closures)
  const handleDragInteraction = useCallback(
    (id: string, newStart: number, newDuration: number, type: string) => {
      onCampaignsChangeRef.current(
        campaignsRef.current.map(c => {
          if (c.id !== id) return c;
          if (type === DragTypes.MOVE) {
            const clampedStart = Math.max(1, Math.min(newStart, 42 - c.durationDays));
            return { ...c, startDayIndex: clampedStart };
          } else {
            const clampedDuration = Math.max(1, Math.min(newDuration, 42 - c.startDayIndex + 1));
            return { ...c, durationDays: clampedDuration };
          }
        }),
      );
    },
    [],
  );

  // Scroll sync
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (ganttBodyRef.current) ganttBodyRef.current.scrollLeft = e.currentTarget.scrollLeft;
  };

  // Dynamic Gantt hierarchy — rebuilds whenever campaigns change
  const ganttHierarchy = useMemo(() => buildGanttHierarchy(campaigns), [campaigns]);

  // Flatten hierarchy for rendering
  const renderGanttRows = useMemo(() => {
    const rows: { item: TimelineItem; depth: number; isVisible: boolean }[] = [];

    const flatten = (items: (Campaign | HierarchyGroup)[], depth: number, isVisible: boolean) => {
      items.forEach(item => {
        rows.push({ item, depth, isVisible });
        if ('isGroup' in item) {
          const isExpanded = expandedIds.has(item.id);
          flatten(item.items, depth + 1, isVisible && isExpanded);
        }
      });
    };

    flatten(ganttHierarchy, 0, true);
    return rows;
  }, [expandedIds, ganttHierarchy]);

  // Timeline header
  const weeks = [
    { label: 'MAR W9',  days: [1, 2, 3, 4, 5, 6, 7] },
    { label: 'MAR W10', days: [8, 9, 10, 11, 12, 13, 14] },
    { label: 'MAR W11', days: [15, 16, 17, 18, 19, 20, 21] },
    { label: 'MAR W12', days: [22, 23, 24, 25, 26, 27, 28] },
    { label: 'APR W13', days: [29, 30, 31, 1, 2, 3, 4] },
    { label: 'APR W14', days: [5, 6, 7, 8, 9, 10, 11] },
  ];
  const totalDays = weeks.reduce((acc, w) => acc + w.days.length, 0);

  // Drop target for Gantt
  const [, drop] = useDrop(() => ({
    accept: [DragTypes.MOVE, DragTypes.RESIZE],
    hover(item: any, monitor) {
      if (!ganttBodyRef.current) return;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const rect = ganttBodyRef.current.getBoundingClientRect();
      // Subtract 320px for the sticky sidebar — the bars content starts after it
      const x = Math.max(0, clientOffset.x - rect.left + ganttBodyRef.current.scrollLeft - 320);

      if (item.type === DragTypes.MOVE) {
        const newStart = Math.max(1, Math.floor(x / 35) + 1);
        if (newStart !== item.startDayIndex) {
          handleDragInteraction(item.id, newStart, item.durationDays, DragTypes.MOVE);
          item.startDayIndex = newStart;
        }
      } else {
        const left = (item.startDayIndex - 1) * 35;
        const newDuration = Math.max(1, Math.floor((x - left) / 35) + 1);
        if (newDuration !== item.durationDays) {
          handleDragInteraction(item.id, item.startDayIndex, newDuration, DragTypes.RESIZE);
          item.durationDays = newDuration;
        }
      }
    },
  }), [handleDragInteraction]);

  // ── BAN calculations ──────────────────────────────────────────────────────
  const plannedBudget = useMemo(() => campaigns.reduce((s, c) => s + (c.budget || 0), 0), [campaigns]);
  const isOverBudget = plannedBudget > APPROVED_BUDGET;
  const pctExceeded = isOverBudget
    ? (((plannedBudget - APPROVED_BUDGET) / APPROVED_BUDGET) * 100).toFixed(2)
    : '0';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden font-['Roboto'] relative">

      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.12)] shrink-0 z-[100] bg-white">
        <div className="flex items-center gap-3">
          <ActionButton label={t('New Campaign')} onClick={() => onNewCampaign?.()} />
          <div className="relative ml-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#686576]" fill="none" viewBox="0 0 18 18">
              <path d={svgPathsPlanner.p13e4f700} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder={t('Find below')}
              className="pl-9 pr-4 h-10 border border-[rgba(0,0,0,0.12)] rounded-full text-[14px] w-[280px] focus:outline-none focus:ring-2 focus:ring-[#473BAB]/20 shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="flex items-end gap-3">
          <FilterSelect label="Area" value="All Areas" width="w-[110px]" />
          <FilterSelect label="Dealership" value="All Dealerships" width="w-[274px]" />

          <div className="flex flex-col items-end">
            <div className="relative">
              <DateRangeInput
                startDate={dateRange?.from}
                endDate={dateRange?.to}
                onClick={() => setIsDatePickerOpen(p => !p)}
                onReset={e => {
                  e.stopPropagation();
                  onDateRangeChange({ from: new Date(2025, 0, 1), to: new Date(2025, 11, 31) });
                }}
              />
              {isDatePickerOpen && (
                <div className="absolute right-0 top-full mt-2 z-50">
                  <DateRangePicker
                    initialRange={dateRange}
                    onApply={range => { onDateRangeChange(range); setIsDatePickerOpen(false); }}
                    onCancel={() => setIsDatePickerOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'gantt' : 'grid')}
            className="p-1 rounded-lg border border-[rgba(0,0,0,0.12)] hover:bg-gray-50 transition-colors cursor-pointer w-10 h-10 flex items-center justify-center bg-white shadow-sm"
          >
            {viewMode === 'grid' ? (
              <svg className="w-5 h-5 text-[#686576]" fill="none" viewBox="0 0 20 16">
                <path d={svgPathsPlanner.p13f5dfc0} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[#686576]" fill="none" viewBox="0 0 18 16">
                <path d={svgPathsView.p31579000} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Data Grid View ── */}
        {viewMode === 'grid' ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="sticky top-0 bg-white z-10 border-b border-[rgba(0,0,0,0.12)] shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-[#686576] tracking-[0.17px] whitespace-nowrap">{t('Activity')}</th>
                    <th className="px-6 py-4 text-xs font-medium text-[#686576] tracking-[0.17px] whitespace-nowrap">{t('Campaign')}</th>
                    <th className="px-6 py-4 text-xs font-medium text-[#686576] tracking-[0.17px] whitespace-nowrap">{t('Quarter')}</th>
                    <th className="px-6 py-4 text-xs font-medium text-[#686576] tracking-[0.17px] whitespace-nowrap">{t('Media type')}</th>
                    <th className="px-6 py-4 text-xs font-medium text-[#686576] tracking-[0.17px] whitespace-nowrap">{t('Starting Date')}</th>
                    <th className="px-6 py-4 text-xs font-medium text-[#686576] tracking-[0.17px] whitespace-nowrap text-right">{t('Budget')}</th>
                    <th className="px-6 py-4 text-xs font-medium text-[#686576] tracking-[0.17px] whitespace-nowrap">{t('Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(0,0,0,0.06)]">
                  {/* Newest first — reverse insertion order */}
                  {[...campaigns].reverse().map(c => (
                    <tr
                      key={c.id}
                      className={cn(
                        'hover:bg-[#F9FAFA] transition-colors group cursor-pointer',
                        selectedCampaignId === c.id ? 'bg-[#F2F1FF]' : 'bg-white',
                      )}
                      onClick={() => onSelectCampaign(selectedCampaignId === c.id ? null : c.id)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-[rgba(0,0,0,0.12)] shrink-0 relative">
                            <ImageWithFallback src={c.thumbnail} alt="" className="w-full h-full object-cover" />
                            {/* asset count badge — matches assetCount */}
                            <div className="absolute bottom-0 right-0 bg-white px-1.5 py-0.5 rounded-tl-lg text-[10px] font-bold text-[#1f1d25] border-t border-l border-[rgba(0,0,0,0.12)] shadow-sm">
                              {c.assetCount}
                            </div>
                          </div>
                          <span className="text-[14px] text-[#1f1d25] font-medium leading-relaxed max-w-[280px]">{t(c.name)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[13px] text-[#1f1d25] font-normal">{t(c.campaignGroup)}</td>
                      <td className="py-4 px-6 text-[13px] text-[#1f1d25] font-normal">{t(c.quarter)}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {c.mediaType.map(type => (
                            <div key={type} className="px-2 py-0.5 bg-[rgba(17,16,20,0.04)] text-[#1f1d25] rounded-[8px] text-[11px] font-normal">
                              {t(type)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[13px] text-[#1f1d25] font-normal">{t(c.startDate)}</td>
                      <td className="py-4 px-6 text-[13px] text-[#1f1d25] font-bold text-right">${c.budget.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <StatusChip status={c.status} className="rounded-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── Gantt View ── */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 
              Single unified scroll container.
              - Header row: sticky top-0 (sticks when scrolling vertically)
              - "Campaigns" corner cell: sticky left-0 inside the sticky header (corner lock)
              - Each data row's label cell: sticky left-0 (sticks when scrolling horizontally)
              - Everything scrolls together — no independent sidebar or header sync needed.
            */}
            <div
              ref={el => { ganttBodyRef.current = el; drop(el); }}
              className="flex-1 overflow-auto custom-scrollbar"
            >
              {/* Inner wrapper — must be at least wide enough to H-scroll */}
              <div style={{ minWidth: `${320 + totalDays * 35}px` }}>

                {/* ── Sticky Header Row ── */}
                <div className="sticky top-0 z-20 flex flex-row bg-white border-b border-[rgba(0,0,0,0.12)]">
                  {/* Corner cell — sticky-left inside sticky-top row */}
                  <div className="sticky left-0 z-30 w-[320px] shrink-0 bg-white border-r border-[rgba(0,0,0,0.12)] h-[82px] flex items-center px-6">
                    <span className="text-[11px] font-medium text-[#686576] tracking-[1px] leading-[1.66] uppercase">{t('Campaigns')}</span>
                  </div>
                  {/* Timeline week columns */}
                  {weeks.map((week, idx) => (
                    <div key={idx} className="flex flex-col border-r border-[rgba(0,0,0,0.06)] shrink-0" style={{ width: `${week.days.length * 35}px` }}>
                      <div className="h-[38px] flex items-center justify-center bg-white">
                        <span className="text-[11px] font-medium text-[#1f1d25] tracking-[0.4px] leading-[1.66] uppercase">{t(week.label)}</span>
                      </div>
                      <div className="flex h-[44px]">
                        {week.days.map((day, dIdx) => (
                          <div key={dIdx} className="w-[35px] flex items-center justify-center border-r border-[rgba(0,0,0,0.06)] last:border-r-0 shrink-0">
                            <span className="text-[11px] text-[#686576] font-normal tracking-[0.4px] leading-[1.66]">{day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Data Rows — sidebar cell sticky-left, bar cell inline ── */}
                {renderGanttRows.map(({ item, depth, isVisible }) =>
                  isVisible && (
                    <div key={item.id} className="flex flex-row" style={{ height: '52px' }}>

                      {/* Sticky sidebar label */}
                      <div
                        className="sticky left-0 z-10 bg-white border-r border-[rgba(0,0,0,0.12)] flex items-center shrink-0 overflow-hidden"
                        style={{ width: '320px', paddingLeft: `${depth * 20 + 16}px` }}
                      >
                        {'isGroup' in item ? (
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="flex items-center gap-1.5 w-full text-left pr-3 min-w-0"
                          >
                            {expandedIds.has(item.id)
                              ? <ChevronDown className="w-4 h-4 text-[#686576] shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-[#686576] shrink-0" />}
                            <span
                              className={cn(
                                'truncate',
                                depth === 0
                                  ? 'text-[11px] font-medium text-[#686576] uppercase tracking-[0.8px]'
                                  : 'text-[13px] font-medium text-[#1f1d25] tracking-[0.17px]',
                              )}
                            >
                              {t(item.name)}
                            </span>
                          </button>
                        ) : (
                          <div
                            className="flex items-center gap-2 w-full cursor-pointer hover:text-[#473BAB] transition-colors pr-3 min-w-0"
                            onClick={() => onSelectCampaign(item.id)}
                          >
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: (item as Campaign).color }}
                            />
                            <span className="truncate text-[13px] font-normal text-[#1f1d25] leading-[1.43] tracking-[0.17px]">
                              {t(item.name)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bar cell — column grid lines via CSS bg + campaign bar */}
                      <div
                        className="relative shrink-0"
                        style={{
                          width: `${totalDays * 35}px`,
                          backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 34px, rgba(0,0,0,0.06) 34px, rgba(0,0,0,0.06) 35px)',
                        }}
                      >
                        {!('isGroup' in item) && (
                          <GanttCampaignItem campaign={item as Campaign} onSelect={onSelectCampaign} />
                        )}
                      </div>

                    </div>
                  ),
                )}

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer — BAN Aggregates */}
      <div className="flex items-center justify-end px-6 py-4 bg-white border-t border-[rgba(0,0,0,0.12)] shrink-0 z-[100] gap-4">
        <div className="flex items-center gap-[10px]">

          {/* Approved BAN */}
          <div className="bg-white min-w-[100px] relative rounded-[12px] shrink-0 border border-[rgba(0,0,0,0.12)] shadow-sm px-3 py-2">
            <div className="flex flex-col gap-0.5">
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#E8F5E9] text-[#1b5e20] rounded-[8px] text-[11px]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                  <path d={svgPathsBans.p195d2d80} stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{t('Approved')}</span>
              </div>
              <div className="text-[16px] font-normal text-[#686576] tracking-[0.15px] ml-1">
                ${APPROVED_BUDGET.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Planned BAN — error state when over budget */}
          <div
            className={cn(
              'bg-white min-w-[100px] relative rounded-[12px] shrink-0 border shadow-sm px-3 py-2 transition-colors',
              isOverBudget ? 'border-red-300' : 'border-[rgba(0,0,0,0.12)]',
            )}
          >
            <div className="flex flex-col gap-0.5">
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[8px] text-[11px]',
                  isOverBudget
                    ? 'bg-red-50 text-red-700'
                    : 'bg-[rgba(2,136,209,0.08)] text-[#014361]',
                )}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                  {isOverBudget ? (
                    <path d="M6 1v6M6 9.5v1" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
                  ) : (
                    <>
                      <path d={svgPathsBans.p2f8f900} stroke="#03A9F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d={svgPathsBans.p114eb680} stroke="#03A9F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  )}
                </svg>
                <span>{t('Planned')}</span>
                {isOverBudget && (
                  <span className="font-bold text-red-600 ml-0.5">↑{pctExceeded}%</span>
                )}
              </div>
              <div
                className={cn(
                  'text-[16px] font-normal tracking-[0.15px] ml-1',
                  isOverBudget ? 'text-red-600 font-semibold' : 'text-[#686576]',
                )}
              >
                ${plannedBudget.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <button
          className="bg-[#473BAB] text-white px-10 py-3 rounded-full font-bold hover:bg-[#392e8a] transition-all shadow-lg active:scale-95 capitalize tracking-wider text-[14px]"
          onClick={() => {}}
        >
          {t('Submit')}
        </button>
      </div>
    </div>
  );
}

// ─── Public wrapper (DnD provider) ────────────────────────────────────────────
export function PlannerContent(props: PlannerContentProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <PlannerInner {...props} />
    </DndProvider>
  );
}