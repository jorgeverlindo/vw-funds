import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import svgPaths from '@/imports/svg-kh2cdc4deu';
import imgAvatar from 'figma:asset/f0494d5017440bdc302141d9ab01c7c81e4a339a.png';
import imgEmichAvatar from '../../assets/Emich_Avatar.jpeg';
import { NotificationOverlay } from './notifications/NotificationOverlay';
import { NotificationOverlayOEM } from './notifications/NotificationOverlayOEM';
import { AvatarInitials } from './ui/AvatarInitials';
import { cn } from '@/lib/utils';
import { LanguageToggleButton } from './LanguageToggleButton';
import { useTranslation } from '../contexts/LanguageContext';
import { useWorkflow } from '../contexts/WorkflowContext';
import type { WCMItem } from './WebMonitoringContent';

// ─── Nav Tooltip ──────────────────────────────────────────────────────────────
// Appears above the trigger, slides down gracefully on enter (350 ms).
function NavTooltip({ label, shortcut, children }: {
  label: string;
  shortcut?: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative flex items-center justify-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute top-full mt-[8px] pointer-events-none z-[9999] px-[8px] py-[5px] bg-[#1f1d25] text-white rounded-[6px] whitespace-nowrap"
            style={{ fontSize: 11, fontFamily: "'Roboto', sans-serif", letterSpacing: '0.17px', lineHeight: '1.43' }}
          >
            {/* Arrow pointing up toward the icon */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-[#1f1d25]" />
            <div className="flex items-center gap-[6px]">
              <span>{label}</span>
              {shortcut && (
                <span className="text-[10px] text-white/60 font-medium bg-white/10 px-[4px] py-[1px] rounded-[3px] tracking-[0.5px]">
                  {shortcut}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import type { CaseUpdateNotif } from '../contexts/ComplianceContext';

interface TopNavBarProps {
  userType?: 'dealer' | 'dealer-singular' | 'dealer-emich' | 'oem';
  onOpenOEMDrawer?: () => void;
  languageToggleActive?: boolean;
  onOpenAgentPane?: () => void;
  isAgentPaneOpen?: boolean;
  onOpenWebMonitoring?: (id: string) => void;
  onOpenPreApprovalFromNotif?: (id: string) => void;
  onOpenClaimFromNotif?: (id: string) => void;
  onOpenProjectFromNotif?: (projectId: string) => void;
  // [FV] início — dealer-side compliance notifications driven by OEM-added infractions
  dealerInfractionNotifs?: WCMItem[];
  dealerSeenInfractionIds?: Set<string>;
  dealerInfractionUnread?: number;
  onOpenInfractionFromNotif?: (id: string) => void;
  // dealer submitted-infraction confirmations
  dealerSubmittedNotifs?: WCMItem[];
  dealerSeenSubmittedIds?: Set<string>;
  dealerSubmittedUnread?: number;
  onOpenSubmittedFromNotif?: (id: string) => void;
  // Dealer case update notifications (OEM changed compliance item status)
  dealerCaseUpdateNotifs?: CaseUpdateNotif[];
  seenCaseUpdateIds?: Set<string>;
  dealerCaseUpdateUnread?: number;
  onOpenCaseUpdateFromNotif?: (id: string) => void;
  // OEM-side: solution submissions by dealers
  oemSolutionNotifs?: { id: string; solution: { submittedBy: string; submittedAtISO: string; comment: string } }[];
  oemSeenSolutionIds?: Set<string>;
  oemSolutionUnread?: number;
  onOpenSolutionFromNotif?: (id: string) => void;
  // OEM-side: dealer-reported infractions
  oemReportedNotifs?: WCMItem[];
  oemSeenReportedIds?: Set<string>;
  oemReportedUnread?: number;
  onOpenReportedFromNotif?: (id: string) => void;
  // [FV] fim
}

export function TopNavBar({
  userType = 'dealer',
  onOpenOEMDrawer,
  languageToggleActive = false,
  onOpenAgentPane,
  isAgentPaneOpen = false,
  onOpenWebMonitoring,
  onOpenPreApprovalFromNotif,
  onOpenClaimFromNotif,
  onOpenProjectFromNotif,
  dealerInfractionNotifs, // [FV]
  dealerSeenInfractionIds, // [FV]
  dealerInfractionUnread = 0, // [FV]
  onOpenInfractionFromNotif, // [FV]
  dealerSubmittedNotifs, // [FV]
  dealerSeenSubmittedIds, // [FV]
  dealerSubmittedUnread = 0, // [FV]
  onOpenSubmittedFromNotif, // [FV]
  dealerCaseUpdateNotifs,
  seenCaseUpdateIds,
  dealerCaseUpdateUnread = 0,
  onOpenCaseUpdateFromNotif,
  oemSolutionNotifs, // [FV]
  oemSeenSolutionIds, // [FV]
  oemSolutionUnread = 0, // [FV]
  onOpenSolutionFromNotif, // [FV]
  oemReportedNotifs, // [FV]
  oemSeenReportedIds, // [FV]
  oemReportedUnread = 0, // [FV]
  onOpenReportedFromNotif, // [FV]
}: TopNavBarProps) {
  const { t } = useTranslation();
  const { oemUnreadCount, dealerUnreadCount } = useWorkflow();
  // [FV] badges sum workflow unread + compliance flow notifs (per role)
  const badgeCount = userType === 'oem'
    ? oemUnreadCount + oemSolutionUnread + oemReportedUnread
    : dealerUnreadCount + dealerInfractionUnread + dealerSubmittedUnread + dealerCaseUpdateUnread;
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isNotificationOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        !bellRef.current?.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    }
    // capture:true fires before React's synthetic event system so clicks inside
    // portals / overlays that call stopPropagation don't block this handler.
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isNotificationOpen]);

  return (
    <div className="fixed top-0 left-[72px] right-0 h-12 bg-[#F9FAFA] flex items-center z-[49] px-[24px] py-[8px] mt-[8px] mr-[0px] mb-[0px] ml-[0px]">
      {/* Left: Logo */}
      <div className="flex items-center h-8">
        <svg viewBox="0 0 176 32" className="h-full w-auto" fill="none">
          <g>
            <path d={svgPaths.p36d5e100} fill="#1F1D25" />
            <path d={svgPaths.p2eb61a80} fill="#1F1D25" />
            <path d={svgPaths.p3330b700} fill="#1F1D25" />
            <path d={svgPaths.p28d792f0} fill="#1F1D25" />
            <path d={svgPaths.p35f3ae00} fill="#1F1D25" />
            <path d={svgPaths.pb0e0800} fill="#1F1D25" />
            <path d={svgPaths.pfffac00} fill="#1F1D25" />
            <path d={svgPaths.p1ad746f0} fill="#1F1D25" />
            <path d={svgPaths.pf690380} fill="#1F1D25" />
            <path d={svgPaths.p2e033100} fill="#1F1D25" />
            <path d={svgPaths.p1139cb00} fill="#1F1D25" />
            <path d={svgPaths.p34a85580} fill="#1F1D25" />
            <path d={svgPaths.pe1644a0} fill="#1F1D25" />
            <path d={svgPaths.p33151180} fill="#1F1D25" />
            <path d={svgPaths.p83d8200} fill="#1F1D25" />
            <path d={svgPaths.p1f753600} fill="#1F1D25" />
          </g>
        </svg>
      </div>

      {/* Center: Global Search */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px]">
        <div className="bg-white h-[34px] rounded-full flex items-center gap-2 border border-[rgba(0,0,0,0.12)] pt-[0px] pr-[0px] pb-[0px] pl-[8px]">
          <svg className="size-6 text-black/56" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path d={svgPaths.p103c0600} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder={t('Search anything')}
            className="flex-1 bg-transparent border-none outline-none text-sm text-[#9c99a9] placeholder:text-[#9c99a9]"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                e.currentTarget.select();
              }
            }}
          />
        </div>
      </div>

      {/* Right: Icons + Avatar */}
      <div className="ml-auto flex items-center gap-2 relative">
        <div className="mr-1">
          <NavTooltip label="Translate">
            <LanguageToggleButton active={languageToggleActive} />
          </NavTooltip>
        </div>

        {/* AI Agent Icon */}
        <NavTooltip label="AI Agent" shortcut="⇧A">
          <button
            onClick={onOpenAgentPane}
            className={cn(
              "p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer relative group",
              isAgentPaneOpen && "bg-[var(--brand-accent)]/10"
            )}
            aria-label="AI Agent"
            aria-expanded={isAgentPaneOpen}
          >
            <div className="size-5">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <path clipRule="evenodd" d={svgPaths.pa564600} fill="#111014" fillOpacity="0.56" fillRule="evenodd" />
                <path d={svgPaths.p317531f0} fill="#111014" fillOpacity="0.56" />
                <path d={svgPaths.pd4a3b80} fill="#111014" fillOpacity="0.56" />
              </svg>
            </div>
            {/* Badge */}
            <div className="absolute top-[2px] right-[2px] size-[18px] bg-[var(--brand-accent)] rounded-full border border-white flex items-center justify-center transform translate-x-[25%] -translate-y-[25%]">
              <span className="text-white text-[10px] font-medium leading-none">1</span>
            </div>
          </button>
        </NavTooltip>

        {/* Comments Icon */}
        <NavTooltip label="Comments">
          <button className="p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer relative group">
            <div className="size-5">
              <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                <path d={svgPaths.p14bf2500} stroke="#111014" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
              </svg>
            </div>
          </button>
        </NavTooltip>

        {/* Notifications Icon */}
        <div className="relative">
          <NavTooltip label="Notifications">
            <button
              ref={bellRef}
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={cn(
                "p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer relative group",
                isNotificationOpen && "bg-black/5"
              )}
            >
              <div className="size-5">
                <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                  <path d={svgPaths.p2d90c980} stroke="#111014" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
                </svg>
              </div>
              {/* Badge — driven by WorkflowContext unread count */}
              {badgeCount > 0 && (
                <div className="absolute top-[2px] right-[2px] size-[18px] bg-[var(--brand-accent)] rounded-full border border-white flex items-center justify-center transform translate-x-[25%] -translate-y-[25%]">
                  <span className="text-white text-[10px] font-medium leading-none">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                </div>
              )}
            </button>
          </NavTooltip>

          {/* Overlay */}
          <div ref={notificationRef} className="absolute top-full right-0 z-[9998] pt-2">
             {userType === 'oem' ? (
                <NotificationOverlayOEM
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                  onOpenDrawer={onOpenOEMDrawer || (() => {})}
                  onOpenWebMonitoring={onOpenWebMonitoring || (() => {})}
                  onOpenPreApproval={onOpenPreApprovalFromNotif}
                  onOpenClaim={onOpenClaimFromNotif}
                  // [FV] início — dealer-submitted solutions appear at the top
                  solutionNotifs={oemSolutionNotifs}
                  seenSolutionIds={oemSeenSolutionIds}
                  onOpenSolution={onOpenSolutionFromNotif}
                  // dealer-reported infractions appear at the top too
                  reportedNotifs={oemReportedNotifs}
                  seenReportedIds={oemSeenReportedIds}
                  onOpenReported={onOpenReportedFromNotif}
                  // [FV] fim
                />
             ) : (
                <NotificationOverlay
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                  onOpenPreApproval={onOpenPreApprovalFromNotif}
                  onOpenClaim={onOpenClaimFromNotif}
                  onOpenProject={onOpenProjectFromNotif}
                  // [FV] início
                  infractionNotifs={dealerInfractionNotifs}
                  seenInfractionIds={dealerSeenInfractionIds}
                  onOpenInfraction={onOpenInfractionFromNotif}
                  submittedNotifs={dealerSubmittedNotifs}
                  seenSubmittedIds={dealerSeenSubmittedIds}
                  onOpenSubmitted={onOpenSubmittedFromNotif}
                  caseUpdateNotifs={dealerCaseUpdateNotifs}
                  seenCaseUpdateIds={seenCaseUpdateIds}
                  onOpenCaseUpdate={onOpenCaseUpdateFromNotif}
                  // [FV] fim
                />
             )}
          </div>
        </div>

        {/* Settings Icon */}
        <NavTooltip label="Settings">
          <button className="p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer group">
            <div className="size-5">
              <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                <path d={svgPaths.p3f764900} stroke="#111014" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
                <path d={svgPaths.p32a6a700} stroke="#111014" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="1.5" />
              </svg>
            </div>
          </button>
        </NavTooltip>

        {/* Avatar */}
        {userType === 'oem' ? (
          <AvatarInitials
            initials="OR"
            size={32}
            shape="circular"
            bgColor="#bcbbc2"
            className="ml-2 cursor-pointer"
          />
        ) : userType === 'dealer-emich' ? (
          <div className="size-8 rounded-full overflow-hidden ml-2 cursor-pointer">
            <img src={imgEmichAvatar} alt="" className="size-full object-cover object-[center_20%]" />
          </div>
        ) : (
          <div className="size-8 rounded-full overflow-hidden ml-2 cursor-pointer">
            <img src={imgAvatar} alt="" className="size-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}