import { useRef, useState, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { SideSheet } from '../side-sheet/SideSheet';
import { SideSheetNavItem } from '../side-sheet/SideSheetNavItem';
import { BreadcrumbBar } from '../BreadcrumbBar';
import { CommentsButton } from '../comments';
import { DataGrid } from '../inventory/DataGrid';
import { NewGlobalAIConfigContent } from './NewGlobalAIConfigContent';
import { Snackbar } from './Snackbar';
import { AI_CONFIGS, type AIConfigRecord, type SavedFormState } from '../../../data/inventory/aiConfigs';
import type { AngleKey } from '../../../data/inventory/types';
import { STORAGE_KEYS } from '../../constants/storageKeys';

// ─── LocalStorage persistence helpers ─────────────────────────────────────────
function loadUserConfigs(): AIConfigRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_CONFIGS_LIST);
    return raw ? (JSON.parse(raw) as AIConfigRecord[]) : [];
  } catch { return []; }
}
function saveUserConfigs(userConfigs: AIConfigRecord[]) {
  // Only persist user-created records (not static seed AI_CONFIGS)
  const seedIds = new Set(AI_CONFIGS.map(c => c.id));
  const toSave = userConfigs.filter(c => !seedIds.has(c.id));
  try { localStorage.setItem(STORAGE_KEYS.AI_CONFIGS_LIST, JSON.stringify(toSave)); } catch { /* noop */ }
}

// ─── Client Settings nav items ─────────────────────────────────────────────────
// Order matches Figma node 3771:68304
const CLIENT_SETTINGS_NAV = [
  { id: 'accounts',               label: 'Accounts' },
  { id: 'ad-shell-configurations',label: 'Ad Shell Configurations' },
  { id: 'brand-kits',             label: 'Brand Kits' },
  { id: 'billing',                label: 'Billing' },
  { id: 'dashboards',             label: 'Dashboards' },
  { id: 'features',               label: 'Features' },
  { id: 'fields',                 label: 'Fields' },
  { id: 'integrations',           label: 'Integrations' },
  { id: 'prompts',                label: 'Prompts' },
  { id: 'tags',                   label: 'Tags' },
  { id: 'users',                  label: 'Users' },
  { id: 'global-ai-configs',      label: 'Global AI Configs' },
  { id: 'settings',               label: 'Settings' },
] as const;

type NavItem = (typeof CLIENT_SETTINGS_NAV)[number]['id'];

// ANGLES order matches AngleBar.tsx: ['34-l','front','34-r','right','left','rear']
// Mapped to AngleKey (no dashes) in the same positional order.
const ANGLE_KEYS_ORDERED: AngleKey[] = ['34l', 'front', '34r', 'right', 'left', 'rear'];

// Maps DataGrid model label → AI_MODELS id used in the form select
const MODEL_ID_MAP: Record<string, string> = {
  'Flux':                 'flux-kontext-max',
  'Flux Kontext Max':     'flux-kontext-max',
  'Flux Kontext Pro':     'flux-kontext-pro',
  'Midjourney V8':        'midjourney-v8',
  'Stable Diffusion 3.5': 'stable-diffusion-35',
  'DALL·E 3':             'dalle-3',
  'Ideogram 3.0':         'ideogram-3',
  'Recraft V4':           'recraft-v4',
};

// ─── Icons (inline — matches Figma specs, same as AIConfigListScreen) ─────────
function IconGenericLeftPane({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 30 30" fill="none" className={className}>
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

function IconShowFilters({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 30 30" fill="none" className={className}>
      <path
        d="M7.29102 8.9585H22.7077M12.291 21.0418H17.7077M9.79102 15.0002H20.2077"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  );
}

function ToolbarIconBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
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

// ─── ClientSettingsContent ─────────────────────────────────────────────────────

interface ClientSettingsContentProps {
  initialSection?: string;
  /**
   * When set, the gallery automatically opens this config in edit view.
   * Used by the "Config Used" link in VinDetailContent (OEM only).
   * Call `onConfigOpened` after consuming so AppContent can clear the value.
   */
  openConfigId?: string | null;
  onConfigOpened?: () => void;
}

export function ClientSettingsContent({ initialSection, openConfigId, onConfigOpened }: ClientSettingsContentProps) {
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(true);
  const [activeNavItem, setActiveNavItem]     = useState<NavItem>((initialSection as NavItem) ?? 'global-ai-configs');
  const [search, setSearch]                   = useState('');
  const [selected, setSelected]               = useState<Set<string>>(new Set());
  const [view, setView]                       = useState<'list' | 'new-config' | 'edit-config'>('list');
  const [configs, setConfigs]                 = useState<AIConfigRecord[]>(() => {
    const user = loadUserConfigs();
    // Prepend user-created configs (most recent first), then static seed
    return [...user, ...AI_CONFIGS];
  });
  const [editData, setEditData]               = useState<SavedFormState | undefined>(undefined);
  const [snackbarOpen, setSnackbarOpen]       = useState(false);
  const snackbarTimerRef                      = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist user-created configs whenever the list changes
  useEffect(() => { saveUserConfigs(configs); }, [configs]);

  // One-time migration: backfill thumbnail for any user config saved without one
  // using the stored formState.bgUrl (background scene, no vehicle).
  // Configs with no bgUrl stored cannot be auto-fixed — they need regeneration.
  useEffect(() => {
    const seedIds = new Set(AI_CONFIGS.map(c => c.id));
    setConfigs(prev => {
      let changed = false;
      const next = prev.map(c => {
        if (seedIds.has(c.id)) return c; // skip static seed
        if (c.thumbnail && !c.thumbnail.includes('empty-state')) return c; // already has real thumb
        const bgUrl = c.formState?.bgUrl ?? null;
        if (!bgUrl) return c; // no stored bg — needs regeneration
        changed = true;
        return { ...c, thumbnail: bgUrl };
      });
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Deep-link: when AppContent passes a specific config id (from "Config Used" link in
  // VinDetailContent), navigate directly to that config's edit view.
  useEffect(() => {
    if (!openConfigId) return;
    const record = configs.find(c => c.id === openConfigId);
    if (record) {
      // Re-use the same logic as handleRowClick to build formState
      if (record.formState) {
        setEditData(record.formState);
      } else {
        const vg = record.vehicleGroups?.[0];
        const effectiveOrder: AngleKey[] = vg?.angleOrder ?? ANGLE_KEYS_ORDERED;
        const genAngles  = vg ? effectiveOrder.map(k => vg.angles[k] ?? null) : undefined;
        const srcAngles  = vg?.sourceAngles
          ? effectiveOrder.map(k => vg.sourceAngles![k] ?? null)
          : undefined;
        setEditData({
          configName:      record.name,
          aiConfigActive:  record.status === 'Active',
          aiModel:         MODEL_ID_MAP[record.model] ?? 'flux-kontext-max',
          seed:            '',
          prompt:          '',
          productPosition: { x: 0, y: -30, width: 480 },
          bgUrl:           record.thumbnail,
          overlayUrl:      null,
          vinsCount:       record.vins,
          filterGroups:    record.vehicleGroups
            ? record.vehicleGroups.map(vg => ({ filters: { models: [vg.model] as string[] } }))
            : [],
          isStaticRecord:  true,
          genAngles,
          sourceAngles:    srcAngles,
        });
      }
      setView('edit-config');
    }
    onConfigOpened?.();
  // configs intentionally excluded — we only react to the id changing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openConfigId]);

  // Prepend newly-saved (or updated) config, show snackbar, return to list
  const handleSaveNewConfig = (record: AIConfigRecord) => {
    setConfigs(prev => {
      // Replace if editing, otherwise prepend
      const exists = prev.find(c => c.id === record.id);
      return exists
        ? prev.map(c => c.id === record.id ? record : c)
        : [record, ...prev];
    });
    setView('list');
    setEditData(undefined);
    // Snackbar — auto-dismiss after 5 s
    setSnackbarOpen(true);
    if (snackbarTimerRef.current) clearTimeout(snackbarTimerRef.current);
    snackbarTimerRef.current = setTimeout(() => setSnackbarOpen(false), 5000);
  };

  // Update angle order for a specific vehicle group (from drag-reorder in DataGrid)
  const handleAngleReorder = (recordId: string, groupId: string, order: AngleKey[]) => {
    setConfigs(prev => prev.map(c => {
      if (c.id !== recordId) return c;
      return {
        ...c,
        vehicleGroups: c.vehicleGroups?.map(vg =>
          vg.id === groupId ? { ...vg, angleOrder: order } : vg,
        ),
      };
    }));
  };

  // Open editor for any row — uses saved formState or builds a synthetic one
  const handleRowClick = (id: string) => {
    const record = configs.find(c => c.id === id);
    if (!record) return;

    if (record.formState) {
      setEditData(record.formState);
    } else {
      // Synthetic formState for static records (no round-trip data saved).
      // isStaticRecord=true tells PreviewPanel to use genAngles / bgUrl instead
      // of the BLUE_GEN_ANGLES demo composite.
      const vg = record.vehicleGroups?.[0];
      // Respect user's drag-reordered angle order (hero is first)
      const effectiveOrder: AngleKey[] = vg?.angleOrder ?? ANGLE_KEYS_ORDERED;
      const genAngles    = vg
        ? effectiveOrder.map(k => vg.angles[k] ?? null)
        : undefined;
      const srcAngles = vg?.sourceAngles
        ? effectiveOrder.map(k => vg.sourceAngles![k] ?? null)
        : undefined;

      const synthetic: SavedFormState = {
        configName:      record.name,
        aiConfigActive:  record.status === 'Active',
        aiModel:         MODEL_ID_MAP[record.model] ?? 'flux-kontext-max',
        seed:            '',
        prompt:          '',
        productPosition: { x: 0, y: -30, width: 480 },
        bgUrl:           record.thumbnail,
        overlayUrl:      null,
        vinsCount:       record.vins,
        filterGroups:    record.vehicleGroups
          ? record.vehicleGroups.map(vg => ({ filters: { models: [vg.model] as string[] } }))
          : [],
        isStaticRecord:  true,
        genAngles,
        sourceAngles:    srcAngles,
      };
      setEditData(synthetic);
    }
    setView('edit-config');
  };

  const filtered = search.trim()
    ? configs.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.vinsApplied.toLowerCase().includes(search.toLowerCase()),
      )
    : configs;

  const handleToggleRow = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map(r => r.id)) : new Set());
  };

  return (
    // Fills the flex container from AppContent's <main>
    <div className="flex-1 flex h-full min-w-0 overflow-hidden relative">

      {/* ── SideSheet — slot-based, animates in/out ── */}
      <SideSheet
        isOpen={isSideSheetOpen}
        onClose={() => setIsSideSheetOpen(false)}
        title="Client Settings"
      >
        {/* Nav items — Client Settings specific slot */}
        {CLIENT_SETTINGS_NAV.map(item => (
          <SideSheetNavItem
            key={item.id}
            label={item.label}
            isSelected={activeNavItem === item.id}
            onClick={() => setActiveNavItem(item.id)}
          />
        ))}
      </SideSheet>

      {/* ── Main content pane ── */}
      {/* Figma: white bg, rounded-[16px], flex-col, flex-1 */}
      <div className="flex-1 min-w-0 h-full bg-white rounded-[16px] overflow-hidden flex flex-col shadow-sm border border-[rgba(0,0,0,0.04)]">

        {view === 'new-config' || view === 'edit-config' ? (
          /* ── New / Edit Global AI Config form ── */
          <NewGlobalAIConfigContent
            onCancel={() => { setView('list'); setEditData(undefined); }}
            onSave={handleSaveNewConfig}
            initialData={editData}
            isSideSheetOpen={isSideSheetOpen}
            onToggleSideSheet={() => setIsSideSheetOpen(v => !v)}
          />
        ) : (
          <>
            {/* ── Header ── */}
            <div className="flex-none px-4 pt-[12px] pb-0">

              {/* Breadcrumb — "Settings > Global AI Configs" */}
              <div className="mb-0">
                <BreadcrumbBar
                  items={[{ label: 'Settings' }]}
                  activeLabel="Global AI Configs"
                />
              </div>

              {/* Title row — same specs as AIConfigListScreen */}
              <div className="flex items-center gap-[8px] h-[34px] pb-[9px] pt-[11px] pr-[8px]">

                {/* Generic (Left Pane) — toggles SideSheet */}
                <ToolbarIconBtn
                  title="Toggle side panel"
                  active={isSideSheetOpen}
                  onClick={() => setIsSideSheetOpen(v => !v)}
                >
                  <IconGenericLeftPane />
                </ToolbarIconBtn>

                {/* Show Filters */}
                <ToolbarIconBtn title="Show filters">
                  <IconShowFilters />
                </ToolbarIconBtn>

                {/* Page title */}
                <span className="font-['Roboto',sans-serif] font-medium text-[16px] leading-[1.5] tracking-[0.15px] text-[#1f1d25] whitespace-nowrap">
                  Global AI Configs
                </span>

                {/* Comments button — same slot as rest of app */}
                <div className="ml-auto">
                  <CommentsButton />
                </div>
              </div>

              {/* ── Toolbar ── */}
              <div className="flex items-center justify-between gap-[8px] pt-[12px] pb-2 bg-white sticky top-0 z-[2]">

                {/* Left */}
                <div className="flex items-center flex-wrap gap-[8px]">

                  {/* New Global AI Config button */}
                  <button
                    onClick={() => setView('new-config')}
                    className={[
                      'flex items-center gap-[8px] rounded-[100px] bg-[#473bab]',
                      'px-[10px] py-[4px]',
                      "font-['Roboto',sans-serif] font-medium text-[13px] leading-[22px] tracking-[0.46px]",
                      'text-white hover:bg-[#3c3192] transition-colors shrink-0',
                    ].join(' ')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    New Global AI Config
                  </button>

                  {/* More options */}
                  <ToolbarIconBtn title="More options">
                    <MoreVertical size={18} />
                  </ToolbarIconBtn>

                  {/* Search — M3Search style */}
                  <div className="flex items-center gap-[8px] h-[34px] w-[200px] bg-[#f9fafa] border border-[#cac9cf] rounded-[20px] px-[8px] shrink-0">
                    <svg
                      className="size-[24px] text-[rgba(17,16,20,0.56)] shrink-0"
                      viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Find below"
                      className={[
                        'flex-1 min-w-0 bg-transparent border-none outline-none',
                        "font-['Roboto',sans-serif] font-normal text-[14px] leading-[1.5] tracking-[0.15px]",
                        'text-[#1f1d25] placeholder:text-[#9c99a9]',
                      ].join(' ')}
                    />
                  </div>
                </div>

                {/* Right — items count */}
                <div className="flex items-center gap-[3px] shrink-0">
                  <span className="font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px] text-[#686576]">
                    {filtered.length}
                  </span>
                  <span className="font-['Roboto',sans-serif] font-normal text-[11px] leading-[1.66] tracking-[0.4px] text-[#686576]">
                    Items
                  </span>
                </div>
              </div>
            </div>

            {/* ── DataGrid — reused directly from Inventory ── */}
            <DataGrid
              records={filtered}
              selected={selected}
              onToggleRow={handleToggleRow}
              onToggleAll={handleToggleAll}
              onRowClick={handleRowClick}
              onAngleReorder={handleAngleReorder}
              onRemoveConfig={configId => {
                // Remove config record from the gallery list; the DataGrid's
                // internal `removeConfig` (InventoryContext) already stripped
                // the override from every VIN that carried it.
                setConfigs(prev => prev.filter(c => c.id !== configId));
              }}
            />
          </>
        )}
      </div>
      {/* ── Snackbar — appears after saving a config ── */}
      <Snackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message="Global AI Config saved successfully."
        actionLabel="Dismiss"
        onAction={() => setSnackbarOpen(false)}
      />
    </div>
  );
}
