import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import svgPaths from '@/imports/svg-kh2cdc4deu';
const imgBrandLogo = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071093/vw-funds/92831320399bbc5ee6848b8f47ee2c2fdc72780d.png';
import { useTranslation } from '../contexts/LanguageContext';
import { useClient } from '../contexts/ClientContext';
const audiLogoOEM = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071269/vw-funds/logos/Audi.png';
const audiLogoPacific = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071269/vw-funds/logos/Audi-Pacific.png';
const vwLogoDealer = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071276/vw-funds/logos/JackDanielsVW.png';
const vwLogoOEM = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071278/vw-funds/logos/VW-Logo.jpg';
const vwLogoEmich = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071272/vw-funds/logos/Emich.png';
const constellationLogo = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071277/vw-funds/logos/Projects___Website_Campaigns/Brand_Logo/Constellation.png';
const rideNowLogo    = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071277/vw-funds/logos/RideNow.png';
const rideNowOEMLogo = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780073800/vw-funds/logos/RideNow-OEM2.png';

// ─── Sub-menu data ────────────────────────────────────────────────────────────
// Only for items that have children. Feeds / Portal / Inventory / AI Tools
// navigate directly without opening the flyout.

interface SubItem {
  id: string;
  label: string;
  children?: SubItem[];
  externalUrl?: string;
}

interface NavItemDef {
  id: string;
  label: string;
  children?: SubItem[];
}

const NAV_SUBMENU: Partial<Record<string, SubItem[]>> = {
  projects: [
    { id: 'projects-tasks',  label: 'Projects & Tasks' },
    { id: 'asset-builder',   label: 'Asset Builder' },
    { id: 'compliance',      label: 'Compliance' },
  ],
  design: [
    { id: 'design-workspace', label: 'Design Workspace', externalUrl: 'https://v3-poc-dw-design.preview.constech.io/' },
    { id: 'templates',        label: 'Templates' },
    { id: 'design-studio',    label: 'Design Studio' },
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  iconColor?: string;
}

const VOLKS_LOGO_PATH = "M20 32.3229C13.2414 32.3229 7.70429 26.7586 7.70429 20C7.70429 18.48 7.97571 17.0414 8.49143 15.6843L15.6843 30.1514C15.7657 30.3414 15.9014 30.5043 16.1186 30.5043C16.3357 30.5043 16.4714 30.3414 16.5529 30.1514L19.8643 22.7414C19.8914 22.66 19.9457 22.5786 20.0271 22.5786C20.1086 22.5786 20.1357 22.66 20.19 22.7414L23.5014 30.1514C23.5829 30.3414 23.7186 30.5043 23.9357 30.5043C24.1529 30.5043 24.2886 30.3414 24.37 30.1514L31.5629 15.6843C32.0786 17.0414 32.35 18.48 32.35 20C32.2957 26.7586 26.7586 32.3229 20 32.3229ZM20 17.2043C19.9186 17.2043 19.8914 17.1229 19.8371 17.0414L15.9829 8.35571C17.2314 7.89428 18.5886 7.65 20 7.65C21.4114 7.65 22.7686 7.89428 24.0171 8.35571L20.1629 17.0414C20.1086 17.15 20.0814 17.2043 20 17.2043ZM16.0643 26.1343C15.9829 26.1343 15.9557 26.0529 15.9014 25.9714L9.65857 13.3771C10.7714 11.6671 12.2643 10.2286 14.0829 9.22429L18.5886 19.24C18.6429 19.4029 18.7786 19.4571 18.9143 19.4571H21.0857C21.2486 19.4571 21.3571 19.43 21.4386 19.24L25.9443 9.22429C27.7357 10.2286 29.2557 11.6671 30.3686 13.3771L24.0714 25.9714C24.0443 26.0529 23.99 26.1343 23.9086 26.1343C23.8271 26.1343 23.8 26.0529 23.7457 25.9714L21.3843 20.5971C21.3029 20.4071 21.1943 20.38 21.0314 20.38H18.86C18.6971 20.38 18.5886 20.4071 18.5071 20.5971L16.2271 25.9714C16.2 26.0529 16.1457 26.1343 16.0643 26.1343ZM20 33.5714C27.5186 33.5714 33.5714 27.5186 33.5714 20C33.5714 12.4814 27.5186 6.42857 20 6.42857C12.4814 6.42857 6.42857 12.4814 6.42857 20C6.42857 27.5186 12.4814 33.5714 20 33.5714Z";

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

function NavItem({ icon, label, isActive = false, onClick, iconColor = '#ACABFF' }: NavItemProps) {
  return (
    <div className="relative w-full rounded-xl shrink-0 cursor-pointer group" onClick={onClick}>
      <div className="flex flex-col items-center justify-end size-full">
        <div className="content-stretch flex flex-col gap-2 items-center justify-end pb-[3px] pt-[7px] px-4 relative w-full">
          {isActive ? (
            <motion.div
              layoutId="nav-pill"
              className="absolute flex h-8 items-center justify-center left-1/2 top-[calc(50%-9px)] translate-x-[-50%] translate-y-[-50%] w-14 z-0"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="h-8 rounded-full w-14" style={{ backgroundColor: 'var(--rail-active)' }} />
            </motion.div>
          ) : (
            <div className="absolute flex h-8 items-center justify-center left-1/2 top-[calc(50%-9px)] translate-x-[-50%] translate-y-[-50%] w-14 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="h-8 rounded-full w-14" style={{ backgroundColor: 'color-mix(in srgb, var(--rail-active) 10%, transparent)' }} />
            </div>
          )}
          <div className="relative z-10 size-6" style={{ color: iconColor }}>{icon}</div>
          <div className="h-3.5 relative shrink-0 w-full z-10">
            <div className={`absolute flex flex-col font-['Roboto'] ${isActive ? 'font-medium' : 'font-normal'} justify-center leading-[0] left-1/2 text-[#f9fafa] text-[11px] text-center top-[7px] tracking-[0.4px] translate-x-[-50%] translate-y-[-50%]`}>
              <p className="leading-[1.66] whitespace-nowrap">{label}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Nav items definition for the flyout (icon + label per item) ─────────────
// The flyout renders ALL nav items with their icons — this list drives that.
// Icons reuse the same svgPaths so they are pixel-identical to the rail icons.

const NAV_ITEMS_DEF: Array<{ id: string; label: string; icon: React.ReactNode }> = [
  {
    id: 'projects', label: 'Projects',
    icon: <svg className="block size-full" fill="none" viewBox="0 0 24 24"><path d={svgPaths.p1f93db00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>,
  },
  {
    id: 'feeds', label: 'Feeds',
    icon: <svg className="block size-full" fill="none" viewBox="0 0 24 24"><path clipRule="evenodd" d={svgPaths.p290cdd00} fill="currentColor" fillRule="evenodd" /><path clipRule="evenodd" d={svgPaths.p3286e280} fill="currentColor" fillRule="evenodd" /><path d={svgPaths.p3dd0de00} fill="currentColor" /></svg>,
  },
  {
    id: 'design', label: 'Design',
    icon: <svg className="block size-full" fill="none" viewBox="0 0 24 24"><path d={svgPaths.p8b9ee80} stroke="currentColor" strokeWidth="1.5" /><path d={svgPaths.p2fd4e00} fill="currentColor" /><path d={svgPaths.p23bcec00} fill="currentColor" /><path d={svgPaths.p1ed05480} fill="currentColor" /></svg>,
  },
  {
    id: 'portal', label: 'Portal',
    icon: <svg className="block size-full" fill="none" viewBox="0 0 24 24"><path d={svgPaths.p33b0c580} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>,
  },
  {
    id: 'campaigns', label: 'Campaigns',
    icon: <svg className="block size-full" fill="none" viewBox="0 0 24 24"><path d={svgPaths.p6a9aff2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><path d={svgPaths.p1ff36380} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><path d={svgPaths.p25f77780} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>,
  },
  {
    id: 'inventory', label: 'Inventory',
    icon: <svg className="block size-full" fill="none" viewBox="0 0 24 24"><path d={svgPaths.pdab3700} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>,
  },
  {
    id: 'insights', label: 'Insights',
    icon: <svg className="block size-full" fill="none" viewBox="0 0 24 24"><path d={svgPaths.p3aea4280} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg>,
  },
  {
    id: 'ai-tools', label: 'AI Tools',
    icon: <svg className="block size-full" fill="none" viewBox="0 0 24 24"><path clipRule="evenodd" d={svgPaths.pa564600} fill="currentColor" fillRule="evenodd" /><path d={svgPaths.p317531f0} fill="currentColor" /><path d={svgPaths.pd4a3b80} fill="currentColor" /></svg>,
  },
];

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
            className={`text-[#acabff]/50 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      {hasChildren && isOpen && (
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
      )}
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

  // ── Flyout state ─────────────────────────────────────────────────────────────
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

  const getIconColor = (_route: string) => '#ACABFF';

  // ── Client logo ───────────────────────────────────────────────────────────────
  const clientLogo = client.clientId === 'ride-now' ? (
    userType === 'oem'
      ? <ClientLogoImg src={rideNowOEMLogo} alt="RideNow Group" noPadding />
      : <ClientLogoImg src={rideNowLogo} alt="RideNow Powersports Weatherford" noPadding />
  ) : client.clientId === 'audi' ? (
    userType === 'oem'
      ? <ClientLogoImg src={audiLogoOEM}    alt="Audi" />
      : <ClientLogoImg src={audiLogoPacific} alt="Audi Pacific" />
  ) : client.clientId === 'vw' ? (
    userType === 'oem'
      ? <ClientLogoImg src={vwLogoOEM}    alt="Volkswagen" noPadding />
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
  const clientName = client.clientId === 'ride-now'  ? 'RideNow Powersports'
    : client.clientId === 'audi'                      ? 'Audi'
    : client.clientId === 'vw'                        ? 'Volkswagen'
    : 'Constellation';

  // ── Helper: build a NavItem that opens flyout if it has sub-items ─────────────
  const makeNavItem = (
    id: string,
    label: string,
    icon: React.ReactNode,
  ) => {
    const hasChildren = !!NAV_SUBMENU[id];
    return (
      <NavItem
        key={id}
        icon={icon}
        label={label}
        isActive={activeRoute === id}
        iconColor={getIconColor(id)}
        onClick={() => {
          if (hasChildren) {
            expandedSection === id ? closeFlyout() : openFlyout(id);
          } else {
            onNavigate?.(id);
          }
        }}
      />
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Collapsed rail (always visible, 72px) ── */}
      <div
        className="fixed left-0 top-0 bottom-0 w-[72px] flex flex-col items-center z-50 isolate"
        style={{ backgroundColor: 'var(--rail-bg)' }}
      >
        {/* Logo — click opens Client Switcher */}
        <div className="h-[60px] relative shrink-0 w-full z-[4]">
          <div className="flex flex-row items-center justify-center size-full">
            <div className="content-stretch flex items-center justify-center px-[11px] py-1 relative size-full">
              <div
                className={`relative cursor-pointer transition-transform active:scale-95 size-10 ${clientSwitcherOpen ? 'ring-2 ring-offset-2 rounded-[4px]' : ''}`}
                style={clientSwitcherOpen ? { '--tw-ring-color': 'var(--rail-icon)', '--tw-ring-offset-color': 'var(--rail-bg)' } as React.CSSProperties : undefined}
                onClick={onOpenClientSwitcher}
                title="Switch Client"
              >
                {clientLogo}
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 min-h-px min-w-px relative w-full z-[2]">
          <div className="flex flex-col items-center size-full">
            <div className="content-stretch flex flex-col gap-3 items-center pb-0 pt-4 px-[3px] relative size-full">

              {makeNavItem('projects', t('Projects'),
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path d={svgPaths.p1f93db00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              )}

              {makeNavItem('feeds', t('Feeds'),
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d={svgPaths.p290cdd00} fill="currentColor" fillRule="evenodd" />
                  <path clipRule="evenodd" d={svgPaths.p3286e280} fill="currentColor" fillRule="evenodd" />
                  <path d={svgPaths.p3dd0de00} fill="currentColor" />
                </svg>
              )}

              {makeNavItem('design', t('Design'),
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path d={svgPaths.p8b9ee80} stroke="currentColor" strokeWidth="1.5" />
                  <path d={svgPaths.p2fd4e00} fill="currentColor" />
                  <path d={svgPaths.p23bcec00} fill="currentColor" />
                  <path d={svgPaths.p1ed05480} fill="currentColor" />
                </svg>
              )}

              {makeNavItem('portal', 'Portal',
                <div className="absolute inset-[4.17%_4.86%_6.94%_6.25%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.3333 21.3333">
                    <path d={svgPaths.p33b0c580} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </svg>
                </div>
              )}

              {makeNavItem('campaigns', t('Campaigns'),
                <div className="absolute inset-[20.83%_0_17.66%_8.33%]">
                  <div className="absolute inset-[-5.08%_-3.41%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.5 16.2634">
                      <path d={svgPaths.p6a9aff2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d={svgPaths.p1ff36380} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d="M19.911 7.62518H22.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d={svgPaths.p25f77780} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              )}

              {makeNavItem('inventory', t('Inventory'),
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path d={svgPaths.pdab3700} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              )}

              {makeNavItem('insights', t('Insights'),
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path d={svgPaths.p3aea4280} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
                </svg>
              )}

              {makeNavItem('ai-tools', t('AI Tools'),
                <div className="absolute left-1/2 size-6 top-1/2 translate-x-[-50%] translate-y-[-50%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                    <path clipRule="evenodd" d={svgPaths.pa564600} fill="currentColor" fillRule="evenodd" />
                    <path d={svgPaths.p317531f0} fill="currentColor" />
                    <path d={svgPaths.pd4a3b80} fill="currentColor" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Component Library button */}
        <div className="content-stretch flex flex-col gap-4 items-center justify-center relative shrink-0 w-full z-[1] pb-6">
          <button
            onClick={onOpenLibrary}
            title="Component Library"
            className="group relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:bg-[color-mix(in_srgb,var(--rail-active)_12%,transparent)] cursor-pointer"
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
           Starts at left-0, covers the rail (same as PortalLeftRail).
           z-[51] puts it above the TopNavBar (z-[49]) and the rail (z-50).
           All nav items are shown with icon + label; the clicked section
           is pre-expanded so its sub-items appear directly below its row.
      ── */}
      {expandedSection && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[50]"
            onMouseDown={closeFlyout}
          />

          {/* Panel — slides in from left, starts at left-0 covering the rail */}
          <div
            className="fixed left-0 top-0 h-full flex flex-col z-[51]"
            style={{
              width: 272,
              backgroundColor: 'var(--rail-bg)',
              boxShadow: '5px 0 24px rgba(0,0,0,0.35)',
              transform: flyoutVisible ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 260ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Header: client logo + name + Switch Client */}
            <div className="flex items-center gap-3 px-4 pt-[10px] pb-[8px] shrink-0">
              <div className="shrink-0">{clientLogo}</div>
              <div className="flex flex-col min-w-0">
                <span className="font-['Roboto'] text-[14px] text-[#f9fafa] tracking-[0.15px] leading-[1.5] truncate">
                  {clientName}
                </span>
                <button
                  className="font-['Roboto'] text-[12px] text-[#acabff] tracking-[0.17px] text-left leading-[1.43] hover:opacity-80 transition-opacity"
                  onClick={() => { closeFlyout(); onOpenClientSwitcher?.(); }}
                >
                  Switch Client
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px mx-2 shrink-0" style={{ background: 'rgba(255,255,255,0.10)' }} />

            {/* All nav items — icon + label + optional sub-items below */}
            <div className="flex flex-col flex-1 overflow-y-auto py-2 px-2 gap-1">
              {NAV_ITEMS_DEF.map(({ id, label, icon }) => {
                const subItems  = NAV_SUBMENU[id];
                const hasChildren = !!subItems?.length;
                const isOpen    = openSubSections.has(id);
                const isActive  = activeRoute === id;

                return (
                  <div key={id} className="flex flex-col gap-[2px]">
                    {/* Parent row */}
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
                      style={{ backgroundColor: isActive ? 'var(--rail-active)' : undefined }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                    >
                      <div className="size-6 shrink-0" style={{ color: '#ACABFF' }}>{icon}</div>
                      <span className="flex-1 text-left font-['Roboto'] text-[16px] text-[#f9fafa] tracking-[0.15px] leading-[1.75]">
                        {label}
                      </span>
                      {hasChildren && (
                        <ChevronDown
                          size={16}
                          className="shrink-0 transition-transform duration-200"
                          style={{ color: 'rgba(172,171,255,0.5)', transform: isOpen ? 'rotate(180deg)' : undefined }}
                        />
                      )}
                    </button>

                    {/* Sub-items — appear below the parent row when expanded */}
                    {hasChildren && isOpen && (
                      <div className="flex flex-col gap-[2px]">
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
                    )}
                  </div>
                );
              })}
            </div>

            {/* Component Library at bottom */}
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
                <span className="font-['Roboto'] text-[16px] text-[#f9fafa] tracking-[0.15px] leading-[1.75]">
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
