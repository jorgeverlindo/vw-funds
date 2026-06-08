import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import svgPaths from '@/imports/svg-kh2cdc4deu';
import { useTranslation } from '../contexts/LanguageContext';
import { useClient } from '../contexts/ClientContext';

// ─── Icon imports (local SVG files) ──────────────────────────────────────────
import projectsIcon   from '@/assets/icons/side-rail/Projects.svg';
import feedsIcon      from '@/assets/icons/side-rail/Feeds.svg';
import designIcon     from '@/assets/icons/side-rail/Design.svg';
import portalIcon     from '@/assets/icons/side-rail/Portal.svg';
import campaignsIcon  from '@/assets/icons/side-rail/megaphone.svg';
import inventoryIcon  from '@/assets/icons/side-rail/Inventory.svg';
import insightsIcon   from '@/assets/icons/side-rail/Insights.svg';
import aiToolsIcon    from '@/assets/icons/side-rail/Constellation AI.svg';
import chatsIcon      from '@/assets/icons/side-rail/Chats.svg';
import helpIcon       from '@/assets/icons/side-rail/circle-questionmark, faq, help, questionaire.svg';

// ─── Logo URLs ────────────────────────────────────────────────────────────────
const imgBrandLogo    = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071093/vw-funds/92831320399bbc5ee6848b8f47ee2c2fdc72780d.png';
const audiLogoOEM     = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071269/vw-funds/logos/Audi.png';
const audiLogoPacific = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071269/vw-funds/logos/Audi-Pacific.png';
const vwLogoDealer    = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071276/vw-funds/logos/JackDanielsVW.png';
const vwLogoOEM       = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071278/vw-funds/logos/VW-Logo.jpg';
const vwLogoEmich     = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071272/vw-funds/logos/Emich.png';
const constellationLogo = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071277/vw-funds/logos/Projects___Website_Campaigns/Brand_Logo/Constellation.png';
const rideNowLogo     = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071277/vw-funds/logos/RideNow.png';
const rideNowOEMLogo  = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780073800/vw-funds/logos/RideNow-OEM2.png';

// ─── Sub-menu data ────────────────────────────────────────────────────────────

interface SubItem {
  id: string;
  label: string;
  children?: SubItem[];
  externalUrl?: string;
}

const NAV_SUBMENU: Partial<Record<string, SubItem[]>> = {
  projects: [
    { id: 'projects-tasks', label: 'Projects & Tasks' },
    { id: 'asset-builder',  label: 'Asset Builder' },
    { id: 'compliance',     label: 'Compliance' },
  ],
  design: [
    { id: 'design-workspace', label: 'Design Workspace', externalUrl: 'https://v3-poc-dw-design.preview.constech.io/' },
    { id: 'templates',        label: 'Templates' },
    { id: 'design-studio',   label: 'Design Studio' },
  ],
  campaigns: [
    { id: 'campaign-templates', label: 'Campaign Templates' },
    { id: 'meta',               label: 'Meta', children: [
      { id: 'campaign-planner', label: 'Campaign Planner' },
      { id: 'ads',              label: 'Ads' },
      { id: 'ad-review',        label: 'Ad Review' },
    ]},
    { id: 'google-pmax',        label: 'Google PMax' },
  ],
  insights: [
    { id: 'ai-reports',   label: 'AI Reports' },
    { id: 'dashboards',   label: 'Dashboards' },
    { id: 'shared-links', label: 'Shared Links' },
  ],
};

// ─── Nav items definition ─────────────────────────────────────────────────────

interface NavItemDef {
  id: string;
  label: string;
  icon: string;
  hasChildren: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'projects',  label: 'Projects',  icon: projectsIcon,  hasChildren: true  },
  { id: 'feeds',     label: 'Feeds',     icon: feedsIcon,     hasChildren: false },
  { id: 'design',    label: 'Design',    icon: designIcon,    hasChildren: true  },
  { id: 'portal',    label: 'Portal',    icon: portalIcon,    hasChildren: false },
  { id: 'campaigns', label: 'Campaigns', icon: campaignsIcon, hasChildren: true  },
  { id: 'inventory', label: 'Inventory', icon: inventoryIcon, hasChildren: false },
  { id: 'insights',  label: 'Insights',  icon: insightsIcon,  hasChildren: true  },
  { id: 'ai-tools',  label: 'AI Tools',  icon: aiToolsIcon,   hasChildren: false },
  { id: 'chats',     label: 'Chats',     icon: chatsIcon,     hasChildren: false },
];

const HELP_ITEM: NavItemDef = {
  id: 'help', label: 'Help', icon: helpIcon, hasChildren: false,
};

// ─── ClientLogoImg ─────────────────────────────────────────────────────────────

function ClientLogoImg({ src, alt, scale = 1, noPadding = false, fit = 'auto' }: {
  src: string; alt: string; scale?: number; noPadding?: boolean; fit?: 'auto' | 'contain' | 'cover';
}) {
  const objectFit: React.CSSProperties['objectFit'] =
    fit !== 'auto' ? fit : noPadding ? 'cover' : 'contain';
  return (
    <div style={{ width: 40, height: 40, borderRadius: 4, background: noPadding ? 'transparent' : '#fff', padding: noPadding ? 0 : '0 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <img
        src={src}
        alt={alt}
        style={{ width: noPadding ? '100%' : undefined, height: noPadding ? '100%' : undefined, maxWidth: noPadding ? undefined : '100%', maxHeight: noPadding ? undefined : '100%', objectFit, display: 'block', transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: 'center' }}
      />
    </div>
  );
}

// ─── Collapsed rail NavItem ────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, isActive = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-end w-full h-[48px] pb-[3px] pt-[7px] px-4 gap-[8px] shrink-0 group"
    >
      {/* Active spring pill */}
      {isActive ? (
        <motion.div
          layoutId="nav-pill"
          className="absolute flex h-8 items-center justify-center left-1/2 top-[calc(50%-9px)] -translate-x-1/2 -translate-y-1/2 w-14 z-0"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <div className="h-8 rounded-full w-14" style={{ backgroundColor: 'var(--rail-active)' }} />
        </motion.div>
      ) : (
        <div className="absolute flex h-8 items-center justify-center left-1/2 top-[calc(50%-9px)] -translate-x-1/2 -translate-y-1/2 w-14 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="h-8 rounded-full w-14" style={{ backgroundColor: 'color-mix(in srgb, var(--rail-active) 10%, transparent)' }} />
        </div>
      )}
      {/* Icon */}
      <div className="relative z-10 size-6">{icon}</div>
      {/* Label */}
      <span className="relative z-10 font-['Roboto'] font-normal text-[11px] text-[#f9fafa] text-center tracking-[0.4px] leading-none whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

// ─── Flyout sub-item row (recursive) ─────────────────────────────────────────

function FlyoutSubItem({
  item,
  depth,
  isOpen,
  onToggle,
  onAction,
}: {
  item: SubItem;
  depth: number;
  isOpen: boolean;
  onToggle: () => void;
  onAction: (item: SubItem) => void;
}) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const paddingLeft = 40 + (depth - 1) * 16;

  return (
    <>
      <button
        onClick={hasChildren ? onToggle : () => onAction(item)}
        className="flex items-center gap-2 w-full h-[40px] pr-2 rounded-[8px] hover:bg-white/[0.06] transition-colors shrink-0"
        style={{ paddingLeft }}
      >
        <span className="flex-1 text-left font-['Roboto'] text-[12px] text-[#f9fafa]/90 tracking-[0.17px] leading-[1.43] truncate">
          {item.label}
        </span>
        {hasChildren && (
          <ChevronDown
            size={14}
            className={`text-[#acabff]/50 transition-transform duration-[450ms] ease-out shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      <AnimatePresence initial={false}>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="flex flex-col">
              {item.children!.map(child => (
                <FlyoutSubItem
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  isOpen={false}
                  onToggle={() => {}}
                  onAction={onAction}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── AppSidebarProps ──────────────────────────────────────────────────────────

interface AppSidebarProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
  userType?: 'dealer' | 'dealer-singular' | 'dealer-emich' | 'oem';
  onToggleUserType?: () => void;
  onOpenClientSwitcher?: () => void;
  clientSwitcherOpen?: boolean;
  onOpenLibrary?: () => void;
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar({
  activeRoute = 'campaigns',
  onNavigate,
  userType = 'dealer',
  onToggleUserType: _onToggleUserType,
  onOpenClientSwitcher,
  clientSwitcherOpen = false,
  onOpenLibrary,
}: AppSidebarProps) {
  const { t } = useTranslation();
  const { client } = useClient();

  // ── Flyout state ──────────────────────────────────────────────────────────
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [flyoutVisible,   setFlyoutVisible]   = useState(false);
  const [openSubSections, setOpenSubSections] = useState<Set<string>>(new Set());
  const [externalUrl,     setExternalUrl]     = useState<string | null>(null);
  const [iframeVisible,   setIframeVisible]   = useState(false);
  const closingRef = useRef(false);

  // Trigger slide-in on next frame after DOM paints the panel
  useEffect(() => {
    if (!expandedSection) return;
    const raf = requestAnimationFrame(() => setFlyoutVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [expandedSection]);

  useEffect(() => {
    if (!externalUrl) return;
    const raf = requestAnimationFrame(() => setIframeVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [externalUrl]);

  const closeFlyout = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setFlyoutVisible(false);
    setTimeout(() => {
      setExpandedSection(null);
      setOpenSubSections(new Set());
      closingRef.current = false;
    }, 260);
  }, []);

  const openFlyout = (sectionId: string) => {
    setOpenSubSections(new Set([sectionId]));
    setExpandedSection(sectionId);
  };

  const toggleSubSection = (id: string) => {
    setOpenSubSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubItemAction = useCallback((item: SubItem) => {
    if (item.externalUrl) {
      closeFlyout();
      setTimeout(() => setExternalUrl(item.externalUrl!), 270);
    } else {
      onNavigate?.(item.id);
      closeFlyout();
    }
  }, [closeFlyout, onNavigate]);

  const closeIframe = () => {
    setIframeVisible(false);
    setTimeout(() => setExternalUrl(null), 300);
  };

  // ── Client logo ───────────────────────────────────────────────────────────
  const clientLogo = client.clientId === 'ride-now' ? (
    userType === 'oem'
      ? <ClientLogoImg src={rideNowOEMLogo} alt="RideNow Group" noPadding />
      : <ClientLogoImg src={rideNowLogo} alt="RideNow Powersports Weatherford" noPadding />
  ) : client.clientId === 'audi' ? (
    userType === 'oem'
      ? <ClientLogoImg src={audiLogoOEM}     alt="Audi" />
      : <ClientLogoImg src={audiLogoPacific} alt="Audi Pacific" />
  ) : client.clientId === 'vw' ? (
    userType === 'oem'
      ? <ClientLogoImg src={vwLogoOEM}   alt="Volkswagen" noPadding />
      : userType === 'dealer-emich'
        ? <ClientLogoImg src={vwLogoEmich}  alt="Emich Volkswagen" />
        : userType === 'dealer'
          ? <ClientLogoImg src={constellationLogo} alt="Constellation" noPadding />
          : <ClientLogoImg src={vwLogoDealer} alt="Jack Daniels Volkswagen" />
  ) : (
    <div className="bg-white overflow-clip relative rounded size-10">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute bg-[#0c1b44] inset-0" />
        <img alt="" className="absolute max-w-none object-contain size-full" src={imgBrandLogo} />
      </div>
    </div>
  );

  // Client display name for flyout header
  const clientName = client.clientId === 'ride-now' ? 'RideNow Powersports'
    : client.clientId === 'audi'                     ? 'Audi'
    : client.clientId === 'vw'                       ? 'Volkswagen'
    : 'Constellation Internal';

  // ── Translated labels map ─────────────────────────────────────────────────
  const labelMap: Record<string, string> = {
    projects:  t('Projects'),
    feeds:     t('Feeds'),
    design:    t('Design'),
    portal:    'Portal',
    campaigns: t('Campaigns'),
    inventory: t('Inventory'),
    insights:  t('Insights'),
    'ai-tools': t('AI Tools'),
    chats:     'Chats',
    help:      'Help',
  };

  // ── All flyout items (nav + help) ─────────────────────────────────────────
  const ALL_FLYOUT_ITEMS = [...NAV_ITEMS, HELP_ITEM];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Collapsed rail (always visible, 72px) ── */}
      <div
        className="fixed left-0 top-0 bottom-0 w-[72px] flex flex-col items-center z-50 isolate"
        style={{ backgroundColor: 'var(--rail-bg)' }}
      >
        {/* Logo — click opens Client Switcher */}
        <div
          className="flex items-center justify-center w-full shrink-0 cursor-pointer"
          style={{ height: 60, paddingTop: 10 }}
        >
          <div
            className={`relative cursor-pointer transition-transform active:scale-95 size-10 ${clientSwitcherOpen ? 'ring-2 ring-offset-2 rounded-[4px]' : ''}`}
            style={clientSwitcherOpen ? { '--tw-ring-color': 'var(--rail-icon)', '--tw-ring-offset-color': 'var(--rail-bg)' } as React.CSSProperties : undefined}
            onClick={onOpenClientSwitcher}
            title="Switch Client"
          >
            {clientLogo}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 min-h-px w-full flex flex-col items-center pt-3 gap-3">
          {NAV_ITEMS.map(({ id, icon }) => {
            const label = labelMap[id] ?? id;
            const hasChildren = !!NAV_SUBMENU[id];
            return (
              <NavItem
                key={id}
                icon={<img src={icon} alt="" className="size-6 shrink-0" style={{ filter: 'brightness(0) saturate(100%) invert(74%) sepia(53%) saturate(380%) hue-rotate(203deg) brightness(101%) contrast(101%)' }} />}
                label={label}
                isActive={activeRoute === id}
                onClick={() => {
                  if (hasChildren) {
                    expandedSection === id ? closeFlyout() : openFlyout(id);
                  } else {
                    onNavigate?.(id);
                  }
                }}
              />
            );
          })}
        </nav>

        {/* Help / ? icon at bottom — clicking opens flyout */}
        <div className="shrink-0 w-full flex flex-col items-center pb-3 gap-3">
          <NavItem
            icon={<img src={helpIcon} alt="" className="size-6 shrink-0" style={{ filter: 'brightness(0) saturate(100%) invert(74%) sepia(53%) saturate(380%) hue-rotate(203deg) brightness(101%) contrast(101%)' }} />}
            label="Help"
            isActive={activeRoute === 'help'}
            onClick={() => {
              expandedSection === 'help' ? closeFlyout() : openFlyout('help');
            }}
          />

          {/* Component Library button */}
          <button
            onClick={onOpenLibrary}
            title="Component Library"
            className="group relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:bg-[color-mix(in_srgb,var(--rail-active)_12%,transparent)] cursor-pointer mb-3"
            style={{ color: '#ACABFF' }}
          >
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d={svgPaths.p25dcf140} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#1f1d25] text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Component Library
            </span>
          </button>
        </div>
      </div>

      {/* ── Flyout panel ────────────────────────────────────────────────────────
           Width 272px, z-[51] (above TopNavBar z-[49] and rail z-50).
           Slides in from left with CSS transition (not AnimatePresence).
      ── */}
      {expandedSection && (
        <>
          {/* Backdrop — transparent, closes flyout on mousedown */}
          <div
            className="fixed inset-0 z-[50]"
            onMouseDown={closeFlyout}
          />

          {/* Panel */}
          <div
            className="fixed left-0 top-0 h-full flex flex-col z-[51]"
            style={{
              width: 272,
              backgroundColor: '#1e1a42',
              boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.20), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
              transform: flyoutVisible ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 260ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Header: logo + client name + Switch Client */}
            <div className="flex items-center gap-3 shrink-0" style={{ height: 48, paddingTop: 10, paddingLeft: 8, paddingRight: 8 }}>
              <div className="shrink-0">{clientLogo}</div>
              <div className="flex flex-col min-w-0">
                <span className="font-['Roboto'] font-normal text-[14px] text-[#f4f5f6] tracking-[0.15px] leading-[1.5] truncate">
                  {clientName}
                </span>
                <button
                  className="font-['Roboto'] font-normal text-[12px] text-[#acabff] tracking-[0.17px] text-left leading-[1.43] hover:opacity-80 transition-opacity"
                  onClick={() => { closeFlyout(); onOpenClientSwitcher?.(); }}
                >
                  Switch Client
                </button>
              </div>
            </div>

            {/* Divider at y=66 */}
            <div className="shrink-0 h-px mx-2 mt-[8px]" style={{ background: 'rgba(0,0,0,0.12)' }} />

            {/* All nav items — starts at y=75 inside the panel */}
            <div className="flex flex-col flex-1 overflow-y-auto px-2 pt-[9px] gap-[0px]">
              {ALL_FLYOUT_ITEMS.map(({ id, icon }) => {
                const label = labelMap[id] ?? id;
                const subItems    = NAV_SUBMENU[id];
                const hasChildren = !!subItems?.length;
                const isOpen      = openSubSections.has(id);
                const isActive    = activeRoute === id;

                return (
                  <div key={id} className="flex flex-col">
                    {/* Parent row — height 48px, gap 12px between items */}
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          toggleSubSection(id);
                        } else {
                          onNavigate?.(id);
                          closeFlyout();
                        }
                      }}
                      className="flex items-center gap-2 w-full px-2 py-[10px] rounded-[8px] transition-colors shrink-0"
                      style={{ backgroundColor: isActive ? '#2f2673' : undefined }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                    >
                      <img src={icon} alt="" className="size-6 shrink-0" style={{ filter: 'brightness(0) saturate(100%) invert(74%) sepia(53%) saturate(380%) hue-rotate(203deg) brightness(101%) contrast(101%)' }} />
                      <span className="flex-1 text-left font-['Roboto'] font-normal text-[16px] text-[#ffffff] tracking-[0.15px] leading-[1.75]">
                        {label}
                      </span>
                      {hasChildren && (
                        <ChevronDown
                          size={16}
                          className="shrink-0 transition-transform duration-200"
                          style={{ color: 'rgba(172,171,255,0.5)', transform: isOpen ? 'rotate(180deg)' : undefined, transition: 'transform 450ms cubic-bezier(0,0,0.2,1)' }}
                        />
                      )}
                    </button>

                    {/* Sub-items — accordion with 450ms ease-out */}
                    <AnimatePresence initial={false}>
                      {hasChildren && isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col gap-[2px] mb-[2px]">
                            {subItems!.map(sub => {
                              const childKey = `${id}.${sub.id}`;
                              return (
                                <FlyoutSubItem
                                  key={sub.id}
                                  item={sub}
                                  depth={1}
                                  isOpen={openSubSections.has(childKey)}
                                  onToggle={() => toggleSubSection(childKey)}
                                  onAction={handleSubItemAction}
                                />
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Component Library at bottom of flyout */}
            <div className="px-2 pb-4 shrink-0">
              <button
                onClick={() => { closeFlyout(); onOpenLibrary?.(); }}
                className="flex items-center gap-2 w-full px-2 py-[10px] rounded-[8px] transition-colors"
                style={{ color: '#ACABFF' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
              >
                <svg className="size-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d={svgPaths.p25dcf140} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-['Roboto'] font-normal text-[16px] text-[#ffffff] tracking-[0.15px] leading-[1.75]">
                  Component Library
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── External URL iframe overlay ── */}
      <AnimatePresence>
        {externalUrl && (
          <motion.div
            className="fixed inset-0 z-[100] bg-white flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: iframeVisible ? 0 : '100%' }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <button
              onClick={closeIframe}
              className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-[13px] font-['Roboto'] hover:bg-white transition-colors border border-black/[0.08]"
              style={{ color: 'var(--text-1, #1f1d25)' }}
            >
              <ArrowLeft size={14} />
              Back to Portal
            </button>
            <iframe
              src={externalUrl}
              className="w-full h-full border-none"
              title="External workspace"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
