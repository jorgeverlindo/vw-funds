import { useState, useMemo, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { AppSidebar } from './components/AppSidebar';
import { TopNavBar } from './components/TopNavBar';
import { TabNavigation } from './components/TabNavigation';
import { FundsOverviewContent } from './components/FundsOverviewContent';
import { FundsOverviewOEMContent } from './components/FundsOverviewOEMContent';
import { FundsPreApprovalsContent } from './components/FundsPreApprovalsContent';
import { FundsClaimsContent } from './components/FundsClaimsContent';
import { CasesTab } from './components/CasesTab';
import { PlannerContent, INITIAL_CAMPAIGNS as PLANNER_INITIAL_CAMPAIGNS, Campaign as PlannerCampaign, GANTT_COLORS } from './components/planner/PlannerContent';
import { PlannerPanel } from './components/planner/PlannerPanel';
import { PreApprovalPanel } from './components/PreApprovalPanel';
import { ClaimsPanel } from './components/ClaimsPanel';
import { MainPane, RightPane } from './components/LayoutWrappers';
import { DateRange } from 'react-day-picker';
const PortalContent = lazy(() => import('./components/portal/PortalContent').then(m => ({ default: m.PortalContent })));
const ProjectsModule = lazy(() => import('./components/projects/ProjectsModule').then(m => ({ default: m.ProjectsModule })));
import { DrawerOEM } from './components/pre-approval/DrawerOEM';
import { GuidelinesContent } from './components/GuidelinesContent';
import { AgentPane } from './components/AgentPane';
import { ProjectAgentPane } from './components/projects/ProjectAgentPane';
import { WebMonitoringContent, WCM_DATA } from './components/WebMonitoringContent';
import { WebMonitoringPanel } from './components/WebMonitoringPanel';
import { WebMonitoringModal } from './components/WebMonitoringModal';
import { WebMonitoringConfigModal } from './components/WebMonitoringConfigModal'; // [FV]
import { ComponentLibraryDialog } from './components/component-library/ComponentLibraryDialog';
import { useTranslation } from './contexts/LanguageContext';
import { useUsabilityTesting } from './contexts/UsabilityTestingContext';
import { ClientSwitcher } from './components/ClientSwitcher';
import { emitSnackbar } from './components/Snackbar';
import { useClient } from './contexts/ClientContext';
import { useFilters } from './contexts/FilterContext';
import { BreadcrumbBar } from './components/BreadcrumbBar';
import { useWorkflow, WORKFLOW_DEALER, WORKFLOW_CAMPAIGN } from './contexts/WorkflowContext';
import { buildUrl, TAB_SLUGS, SLUG_TO_TAB } from './utils/routing';
import { useSelectedPreApproval } from './hooks/useSelectedPreApproval';
import { useSelectedClaim } from './hooks/useSelectedClaim';
import { useCompliance, getDealerIdentity } from './contexts/ComplianceContext'; // [FV]
import type { Claim } from './components/ClaimsPanel';
import type { PreApproval } from './components/FundsPreApprovalsContent';
import { CommentsProvider, CommentsSidePanel, CommentsButton } from './components/comments';
import type { NotifItem } from './components/comments/types';
import { ClientSettingsContent } from './components/client-settings/ClientSettingsContent';
const InventoryContent = lazy(() => import('./components/inventory/InventoryContent').then(m => ({ default: m.InventoryContent })));

const DEALER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pre-approvals', label: 'Pre-Approvals' },
  { id: 'claims', label: 'Claims' },
  { id: 'cases', label: 'Cases' },
  { id: 'planner', label: 'Planner' },
  { id: 'web-monitoring', label: 'Compliance' }, // [FV] dealer-view scoped subselection (renamed from Web Monitoring)
  { id: 'guidelines', label: 'Guidelines & Assets' },
];

const OEM_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pre-approvals', label: 'Pre-Approvals' },
  { id: 'claims', label: 'Claims' },
  { id: 'cases', label: 'Cases' },
  { id: 'planner', label: 'Planner' },
  { id: 'web-monitoring', label: 'Compliance' }, // [FV] renamed from Web Monitoring
];

// ── URL routing helpers ───────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────

const defaultDateRange: DateRange = {
  from: new Date(2025, 0, 1),
  to: new Date(2026, 11, 31),
};

export type { UserType } from './utils/routing';


export default function AppContent() {
  const { t } = useTranslation();
  const { triggerEvent } = useUsabilityTesting();
  const { workflow, approvePreApproval, requestPreApprovalRevision } = useWorkflow();
  const { client, switchClient } = useClient();
  const { lockDealership, unlockDealership } = useFilters();

  // ── Router hooks (must be before derived state) ───────────────────────────
  const routeParams = useParams<{ brand?: string; tab?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Derive initial tab/role from URL; useState only uses these once on mount
  const _initPath = location.pathname.toLowerCase();
  const _initRole: UserType = _initPath.includes('/dealership-singular/') ? 'dealer-singular'
    : _initPath.includes('/dealership-emich/') ? 'dealer-emich' // [FV]
    : _initPath.includes('/dealership/') ? 'dealer' : 'oem';
  const _initTab = SLUG_TO_TAB[routeParams.tab ?? ''] ?? 'overview';
  // Derive initial section: 'projects' | 'portal' → that section; anything else → 'campaigns'
  const _initSection = (_initTab === 'projects' || _initTab === 'portal' || _initTab === 'inventory') ? _initTab : 'campaigns';

  const [activeAppSection, setActiveAppSection] = useState(_initSection); // 'campaigns' | 'portal' | 'projects'
  const [activeTab, setActiveTab] = useState(_initSection === 'campaigns' ? _initTab : 'overview');
  const [userType, setUserType] = useState<UserType>(_initRole);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [clientSwitcherOpen, setClientSwitcherOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  // If the URL already has /Client-Settings on mount (e.g. direct link or refresh), restore settings section
  const [settingsSection, setSettingsSection] = useState<string | null>(
    _initTab === 'client-settings' && client.clientId === 'ride-now' ? 'global-ai-configs' : null,
  );
  // Deep-link to a specific config (fired by "Config Used" link in VinDetailContent, OEM only)
  const [pendingConfigId, setPendingConfigId] = useState<string | null>(null);

  // [FV] compliance context — all infraction/solution/notification state
  const {
    userAddedInfractions,
    deletedInfractionIds,
    seenInfractionIds,
    seenSubmittedIds,
    caseSolutions,
    oemSeenSolutionIds,
    oemSolutionNotifs,
    oemSolutionUnread,
    oemReportedNotifs,
    oemSeenReportedIds,
    oemReportedUnread,
    wcmComments,
    addInfraction,
    deleteInfraction,
    updateInfractionStatus,
    markSeenInfraction,
    markSeenSubmitted,
    submitCaseSolution,
    markCaseSolved,
    markOemSeenSolution,
    markOemSeenReported,
    addWcmComment,
    dealerInfractionNotifs,
    dealerInfractionUnread,
    dealerSubmittedNotifs,
    dealerSubmittedUnread,
    caseUpdates,
    seenCaseUpdateIds,
    addDealerCaseUpdate,
    markSeenCaseUpdate,
    dealerCaseUpdateNotifs,
    dealerCaseUpdateUnread,
  } = useCompliance();

  // Sync data-mode to <html> so portals (rendered outside the wrapper div) also inherit CSS vars
  // [FV] dealer-singular and dealer-emich both share the dealer CSS palette
  const cssMode = (userType === 'dealer-singular' || userType === 'dealer-emich' || userType === 'dealer-ridenow') ? 'dealer' : userType;

  // [FV] current dealer identity (own dealership name + user) — drives Compliance scope, AI auto-fill, and labels
  const currentDealerIdentity = getDealerIdentity(userType);
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', cssMode);
  }, [cssMode]);

  // Keyboard shortcuts: e → OEM  |  a → Agency  |  d → Dealer singular  |  ⇧A → toggle AI agent
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      // ⇧A — toggle AI Agent pane (all user types)
      if (e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsAgentPaneOpen(open => {
          if (!open) window.dispatchEvent(new CustomEvent("agent-opened"));
          return !open;
        });
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'e') {
        const nextTab = activeTab === 'guidelines' ? 'overview' : activeTab;
        unlockDealership();
        setUserType('oem');
        setActiveTab(nextTab);
        navigate(buildUrl('oem', client.clientId, nextTab), { replace: true });
        emitSnackbar(client.clientId === 'ride-now' ? 'RideNow OEM (e)' : 'OEM view (e)');
      }
      if (e.key === 'a') {
        unlockDealership();
        setUserType('dealer');
        navigate(buildUrl('dealer', client.clientId, activeTab), { replace: true });
        emitSnackbar('Agency view (a)');
      }
      if (e.key === 'd') {
        if (client.clientId === 'ride-now') {
          // [FV] RideNow dealer: Rachel Hui @ RideNow Powersports Weatherford
          unlockDealership();
          setUserType('dealer-ridenow');
          navigate(buildUrl('dealer-singular', client.clientId, activeTab), { replace: true });
          emitSnackbar('RideNow Powersports Weatherford (d)');
        } else {
          lockDealership(WORKFLOW_DEALER.code);
          setUserType('dealer-singular');
          navigate(buildUrl('dealer-singular', client.clientId, activeTab), { replace: true });
          emitSnackbar('Jack Daniels Volkswagen (d)'); // [FV] toast label decoupled from WORKFLOW_DEALER.name
        }
      }
      // [FV] 's' → Emich Volkswagen dealer view (used to demo cross-dealer compliance reports)
      if (e.key === 's') {
        unlockDealership();
        setUserType('dealer-emich');
        navigate(buildUrl('dealer-emich', client.clientId, activeTab), { replace: true });
        emitSnackbar('Emich Volkswagen (s)');
      }
      if (e.key === 'c') {
        window.dispatchEvent(new CustomEvent("toggle-comments-panel"));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab, client.clientId, navigate, lockDealership, unlockDealership]);

  // Close agent when comments panel opens
  useEffect(() => {
    const handler = () => setIsAgentPaneOpen(false);
    window.addEventListener("comments-opened", handler);
    return () => window.removeEventListener("comments-opened", handler);
  }, []);

  // Pre-Approvals Specific State
  const [preApprovalSearchQuery, setPreApprovalSearchQuery] = useState('');
  const [selectedPreApprovalId, setSelectedPreApprovalId] = useState<string | null>(null);
  const selectedPreApproval = useSelectedPreApproval(selectedPreApprovalId);

  // Claims Specific State
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const selectedClaim = useSelectedClaim(selectedClaimId);

  const handleSettingsClick = useCallback((section: string) => {
    if (client.clientId === 'ride-now' && userType === 'oem') {
      const targetSection = section === 'client-settings' ? 'global-ai-configs' : section;
      setSettingsSection(targetSection);
      navigate(buildUrl(userType, client.clientId, 'client-settings'), { replace: true });
    }
  }, [client.clientId, userType, navigate]);

  // Create Claim handler — called by PreApprovalPanel dealer CTA
  // Uses the current claim ID so it works after archiveAndReset cycles
  const handleCreateClaim = useCallback(() => {
    setActiveTab('claims');
    setSelectedPreApprovalId(null);
    setSelectedClaimId(workflow.claim.id);
    navigate(buildUrl(userType, client.clientId, 'claims'), { replace: true });
  }, [workflow.claim.id, userType, client.clientId, navigate]);

  // Planner Specific State
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  // Normalise initial campaigns: assetCount === assets.length, color from GANTT_COLORS sequence
  const [plannerCampaigns, setPlannerCampaigns] = useState<PlannerCampaign[]>(
    PLANNER_INITIAL_CAMPAIGNS.map((c, i) => ({
      ...c,
      assetCount: c.assets.length,
      color: GANTT_COLORS[i % GANTT_COLORS.length],
    })),
  );

  const selectedCampaign = useMemo(() =>
    selectedCampaignId ? plannerCampaigns.find(i => i.id === selectedCampaignId) : null
  , [selectedCampaignId, plannerCampaigns]);

  const handleSavePlannerCampaign = (data: Partial<PlannerCampaign>) => {
    if (selectedCampaignId) {
      // Editing existing campaign
      setPlannerCampaigns(prev =>
        prev.map(c =>
          c.id === selectedCampaignId
            ? { ...c, ...data, assetCount: data.assets?.length ?? c.assetCount } as PlannerCampaign
            : c,
        ),
      );
    } else {
      // Creating new campaign — color from strict sequence
      const nextColorIndex = plannerCampaigns.length % GANTT_COLORS.length;
      const assets = data.assets ?? [];
      const firstImageUrl = assets.find(url => url.startsWith('blob:') || url.match(/\.(png|jpg|jpeg)$/i));

      const newCampaign: PlannerCampaign = {
        id: `campaign-${Date.now()}`,
        name: data.name || 'New Campaign',
        campaignGroup: data.campaignGroup || 'SUV Launch Campaigns',
        quarter: data.quarter || 'Q1',
        mediaType: data.mediaType || [],
        startDate: data.startDate || 'Mar 20, 2026',
        endDate: data.endDate || 'Apr 5, 2026',
        budget: data.budget || 0,
        thumbnail: data.thumbnail || firstImageUrl || PLANNER_INITIAL_CAMPAIGNS[0].thumbnail,
        color: GANTT_COLORS[nextColorIndex],
        startDayIndex: 5,
        durationDays: 14,
        assetCount: assets.length,
        assets,
        status: 'Pending',
      };
      setPlannerCampaigns(prev => [...prev, newCampaign]);
    }
    setIsAddingCampaign(false);
    setSelectedCampaignId(null);
  };

  // Handle Tab Change (Reset selections if needed, though usually distinct context)
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'pre-approvals') setSelectedPreApprovalId(null);
    if (tabId !== 'claims') setSelectedClaimId(null);
    if (tabId !== 'planner') setSelectedCampaignId(null);
    navigate(buildUrl(userType, client.clientId, tabId), { replace: true });
  };

  // Handle Navigation from Sidebar — also updates the URL
  const handleNavigate = (route: string) => {
    setActiveAppSection(route);
    setSettingsSection(null); // leave Client Settings when navigating elsewhere
    if (route === 'projects') triggerEvent('navigate_to_projects');
    if (route === 'projects' || route === 'portal' || route === 'inventory') {
      navigate(buildUrl(userType, client.clientId, route), { replace: true });
    } else {
      // 'campaigns' → restore the current active tab URL
      navigate(buildUrl(userType, client.clientId, activeTab), { replace: true });
    }
  };

  // Handle Portal Pre-Approval Action (Go to Pre-Approvals tab in Campaigns)
  const handlePortalPreApproval = () => {
    setActiveAppSection('campaigns');
    setActiveTab('pre-approvals');
    navigate(buildUrl(userType, client.clientId, 'pre-approvals'), { replace: true });
  };

  const toggleUserType = () => {
    setUserType(prev => {
      // Sidebar toggle cycles: oem → dealer → oem (dealer-singular stays in dealer territory)
      const next: UserType = prev === 'oem' ? 'dealer' : 'oem';
      const nextTab = next === 'oem' && activeTab === 'guidelines' ? 'overview' : activeTab;
      if (nextTab !== activeTab) setActiveTab(nextTab);
      if (next === 'dealer') unlockDealership(); else lockDealership(WORKFLOW_DEALER.code);
      navigate(buildUrl(next, client.clientId, nextTab), { replace: true });
      return next;
    });
  };

  // Sync URL → state on browser back/forward navigation
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const role: UserType = path.includes('/dealership-singular/') ? 'dealer-singular'
      : path.includes('/dealership-emich/') ? 'dealer-emich' // [FV]
      : path.includes('/dealership/') ? 'dealer' : 'oem';
    const tabId = SLUG_TO_TAB[routeParams.tab ?? ''] ?? 'overview';
    const brandParam = routeParams.brand?.toLowerCase();
    const brandId = brandParam === 'audi' ? 'audi'
      : brandParam === 'ride-now' ? 'ride-now'
      : 'vw';
    setUserType(role);
    // Detect app section from slug ('projects' | 'portal' → section; anything else → campaigns tab)
    if (tabId === 'projects' || tabId === 'portal' || tabId === 'inventory') {
      setActiveAppSection(tabId);
    } else {
      setActiveAppSection('campaigns');
      setActiveTab(tabId);
    }
    if (brandId !== client.clientId) switchClient(brandId);
    // Re-sync the lock state when navigating back/forward
    if (role === 'dealer-singular') lockDealership(WORKFLOW_DEALER.code);
    else unlockDealership();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // OEM Drawer State
  const [isOEMDrawerOpen, setIsOEMDrawerOpen] = useState(false);

  // Agent Pane State — dealer-only
  const [isAgentPaneOpen, setIsAgentPaneOpen] = useState(false);

  // Project to open from a notification tap
  const [notifOpenProjectId, setNotifOpenProjectId] = useState<string | null>(null);

  // Deep-link: ?project=<id> in the URL opens that project directly.
  // Works for both mock projects and agent-created projects stored in localStorage.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const projectId = params.get('project');
    if (projectId) {
      setActiveAppSection('projects');
      setNotifOpenProjectId(projectId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount only

  const [selectedWebMonitoringId, setSelectedWebMonitoringId] = useState<string | null>(null);
  const [isWebMonitoringModalOpen, setIsWebMonitoringModalOpen] = useState(false);
  const [isWebMonitoringConfigOpen, setIsWebMonitoringConfigOpen] = useState(false); // [FV]
  const [isCreatingInfraction, setIsCreatingInfraction] = useState(false); // [FV]

  // ── Comments context state ────────────────────────────────────────────────
  const [commentsContextId, setCommentsContextId]     = useState<string>("campaigns-main");
  const [commentsContextName, setCommentsContextName] = useState<string>("");

  // ── "Config Used" deep-link (OEM only, fired from VinDetailContent) ─────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { configId } = (e as CustomEvent<{ configId: string }>).detail;
      setSettingsSection('global-ai-configs');
      setPendingConfigId(configId);
    };
    window.addEventListener('constellation:open-config', handler);
    return () => window.removeEventListener('constellation:open-config', handler);
  }, []);

  // ── Comment notification bridge (window event from CommentsProvider) ──────
  const [commentNotifs, setCommentNotifs] = useState<NotifItem[]>([]);
  const [commentUnreadCount, setCommentUnreadCount] = useState(0);
  const [pendingCommentNav, setPendingCommentNav] = useState<{ contextId: string; commentId?: string } | null>(null);
  const commentsContextIdRef = useRef(commentsContextId);
  commentsContextIdRef.current = commentsContextId;

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { notifs: NotifItem[]; unreadCount: number };
      setCommentNotifs(detail.notifs);
      setCommentUnreadCount(detail.unreadCount);
    };
    window.addEventListener('comment-notifs-changed', handler);
    return () => window.removeEventListener('comment-notifs-changed', handler);
  }, []);

  // Sync comments context to current section/tab
  useEffect(() => {
    setCommentsContextId(`${activeAppSection}-${activeTab || "main"}`);
    setCommentsContextName("");
  }, [activeAppSection, activeTab]);

  const handleProjectChange = useCallback((id: string | null, name: string) => {
    if (id) {
      setCommentsContextId(id);
      setCommentsContextName(name);
      navigate(buildUrl(userType, client.clientId, 'projects') + `?project=${encodeURIComponent(id)}`, { replace: true });
    } else {
      setCommentsContextId(`projects-main`);
      setCommentsContextName("");
      navigate(buildUrl(userType, client.clientId, 'projects'), { replace: true });
    }
  }, [navigate, userType, client.clientId]);

  const handleCommentNotifNavigate = useCallback((notif: import('./components/comments/types').NotifItem) => {
    const targetCtxId = notif.projectId;
    // Already on the right context → fire immediately
    if (targetCtxId === commentsContextIdRef.current) {
      window.dispatchEvent(new CustomEvent('comment-open-to', {
        detail: { contextId: targetCtxId, commentId: notif.targetCommentId }
      }));
      return;
    }
    // Store pending nav, then navigate
    setPendingCommentNav({ contextId: targetCtxId, commentId: notif.targetCommentId });

    // contextId format:
    //   "section-tab"   → a tab inside a top-level section (campaigns, portal, inventory…)
    //   "projects-main" → projects list with no project open
    //   anything else   → a specific project UUID
    //
    // SECTION_TABS: maps section name → default tab slug used when tabPart is absent.
    // For sections without sub-tabs (inventory, portal) the value equals the section name
    // so buildUrl receives the right slug.
    // To add a new section: add it here and ensure CommentsButton lives in its header.
    const SECTION_TABS: Record<string, string> = {
      campaigns: 'overview',   // default campaigns tab when none specified
      portal:    'portal',     // portal has no sub-tabs
      inventory: 'inventory',  // inventory has no sub-tabs
    };

    const dashIdx = targetCtxId.indexOf('-');
    const sectionKey = dashIdx !== -1 ? targetCtxId.slice(0, dashIdx) : '';
    const tabPart    = dashIdx !== -1 ? targetCtxId.slice(dashIdx + 1) : '';

    if (sectionKey in SECTION_TABS) {
      // Section-based context — navigate to the right page and sync activeTab so that
      // commentsContextId ("section-tab") matches pendingCommentNav.contextId exactly.
      const tab = (tabPart && tabPart !== 'main') ? tabPart : SECTION_TABS[sectionKey];

      setActiveAppSection(sectionKey);
      setActiveTab(tab); // always sync so the commentsContextId effect produces the right key

      // For campaigns each tab has its own URL slug; for other sections the section IS the slug.
      const navSlug = sectionKey === 'campaigns' ? tab : sectionKey;
      navigate(buildUrl(userType, client.clientId, navSlug), { replace: true });
    } else if (targetCtxId === 'projects-main') {
      setActiveAppSection('projects');
      navigate(buildUrl(userType, client.clientId, 'projects'), { replace: true });
    } else {
      // Specific project UUID — open Projects section and request that project
      setActiveAppSection('projects');
      setNotifOpenProjectId(targetCtxId);
      navigate(buildUrl(userType, client.clientId, 'projects'), { replace: true });
    }
  }, [userType, client.clientId, navigate]);

  // Fire comment-open-to once the commentsContextId matches the pending navigation.
  // We retry with increasing delays to survive any mounting/rendering lag in the
  // destination page's CommentsProvider.
  useEffect(() => {
    if (!pendingCommentNav) return;
    if (commentsContextId !== pendingCommentNav.contextId) return;

    const delays = [200, 600, 1200]; // ms — retry up to 3 times
    const timers: ReturnType<typeof setTimeout>[] = [];
    delays.forEach((delay, i) => {
      timers.push(setTimeout(() => {
        window.dispatchEvent(new CustomEvent('comment-open-to', {
          detail: { contextId: pendingCommentNav.contextId, commentId: pendingCommentNav.commentId }
        }));
        if (i === delays.length - 1) setPendingCommentNav(null);
      }, delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [commentsContextId, pendingCommentNav]);

  const selectedWCMItem = useMemo(() => {
    if (!selectedWebMonitoringId) return null;
    // [FV] also search user-added infractions
    return userAddedInfractions.find(i => i.id === selectedWebMonitoringId)
        ?? WCM_DATA.find(i => i.id === selectedWebMonitoringId)
        ?? null;
  }, [selectedWebMonitoringId, userAddedInfractions]);

  const showLanguageToggle = activeAppSection === 'campaigns';

  // userType added to dep array so tabs recompute when switching Dealer ↔ OEM
  const translatedTabs = useMemo(() => (userType !== 'oem' ? DEALER_TABS : OEM_TABS).map(tab => ({
    ...tab,
    label: showLanguageToggle ? t(tab.label) : tab.label
  })), [t, showLanguageToggle, userType]);

  return (
    <div className="min-h-screen bg-[#F9FAFA] overflow-hidden" data-mode={cssMode}>
      <AppSidebar
        activeRoute={activeAppSection}
        onNavigate={handleNavigate}
        userType={userType}
        onToggleUserType={toggleUserType}
        onOpenClientSwitcher={() => setClientSwitcherOpen(o => !o)}
        clientSwitcherOpen={clientSwitcherOpen}
        onOpenLibrary={() => setLibraryOpen(true)}
      />
      <ComponentLibraryDialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
      />
      <ClientSwitcher
        isOpen={clientSwitcherOpen}
        onClose={() => setClientSwitcherOpen(false)}
        currentClientId={client.clientId}
        onSelect={(id) => { switchClient(id); setClientSwitcherOpen(false); navigate(buildUrl(userType, id, activeTab), { replace: true }); }}
      />
      <TopNavBar
        userType={userType}
        onOpenOEMDrawer={() => setIsOEMDrawerOpen(true)}
        languageToggleActive={showLanguageToggle}
        onOpenAgentPane={() => setIsAgentPaneOpen(open => {
          if (!open) {
            window.dispatchEvent(new CustomEvent("agent-opened"));
            triggerEvent('agent_pane_opened');
          }
          return !open;
        })}
        isAgentPaneOpen={isAgentPaneOpen}
        onOpenInfractionFromNotif={(id) => {
          markSeenInfraction(id);
          setActiveTab('web-monitoring');
          setSelectedWebMonitoringId(id);
          setIsCreatingInfraction(false);
          navigate(buildUrl(userType, client.clientId, 'web-monitoring'), { replace: true });
        }}
        onOpenCaseUpdateFromNotif={(id) => {
          markSeenCaseUpdate(id);
          setActiveTab('web-monitoring');
          const update = caseUpdates.find(u => u.id === id);
          if (update) setSelectedWebMonitoringId(update.itemId);
          setIsCreatingInfraction(false);
          navigate(buildUrl(userType, client.clientId, 'web-monitoring'), { replace: true });
        }}
        onOpenSolutionFromNotif={(id) => {
          markOemSeenSolution(id);
          setActiveTab('web-monitoring');
          setSelectedWebMonitoringId(id);
          setIsCreatingInfraction(false);
          navigate(buildUrl(userType, client.clientId, 'web-monitoring'), { replace: true });
        }}
        onOpenReportedFromNotif={(id) => {
          markOemSeenReported(id);
          setActiveTab('web-monitoring');
          setSelectedWebMonitoringId(id);
          setIsCreatingInfraction(false);
          navigate(buildUrl(userType, client.clientId, 'web-monitoring'), { replace: true });
        }}
        onOpenWebMonitoring={(id) => {
          setActiveTab('web-monitoring');
          setSelectedWebMonitoringId(id);
          navigate(buildUrl(userType, client.clientId, 'web-monitoring'), { replace: true });
        }}
        onOpenPreApprovalFromNotif={(id) => {
          setActiveTab('pre-approvals');
          setSelectedPreApprovalId(id);
          navigate(buildUrl(userType, client.clientId, 'pre-approvals'), { replace: true });
        }}
        onOpenClaimFromNotif={(id) => {
          setActiveTab('claims');
          setSelectedClaimId(id);
          navigate(buildUrl(userType, client.clientId, 'claims'), { replace: true });
        }}
        onOpenProjectFromNotif={(projectId) => {
          setActiveAppSection('projects');
          setNotifOpenProjectId(projectId);
          navigate(buildUrl(userType, client.clientId, 'projects'), { replace: true });
        }}
        commentNotifs={commentNotifs}
        commentUnreadCount={commentUnreadCount}
        onMarkCommentNotifRead={(id) => {
          window.dispatchEvent(new CustomEvent('comment-mark-read', { detail: { id } }));
        }}
        onCommentNotifNavigate={handleCommentNotifNavigate}
        onSettingsClick={handleSettingsClick}
      />

      {/* Main Layout Container - Fixed offsets for sidebar/navbar */}
      <CommentsProvider contextId={commentsContextId} contextName={commentsContextName} currentUserId={
        (({
          // RideNow: OEM = Jenny Eckhart | dealer = Rachel Hui
          'ride-now:oem':            'jenny-eckhart',
          'ride-now:dealer-ridenow': 'rachel-hui',
          // VW / Audi
          'vw:dealer':               'mallory-manning',
          'vw:dealer-emich':         'katelyn-gray',
          'vw:oem':                  'jenny-eckhart',
          'vw:dealer-singular':      'zak-flaten',
          'audi:dealer':             'mallory-manning',
          'audi:oem':                'jenny-eckhart',
        } as Record<string, string>)[`${client.clientId}:${userType}`]
          ?? (client.clientId === 'ride-now' ? 'rachel-hui' : 'jorge-verlindo'))
      }>
      <main className="ml-[72px] mt-[32px] h-[calc(100vh-48px)] flex p-6 gap-6 overflow-hidden mr-[0px] mb-[0px] relative">

        {/* ── Client Settings (Ride Now) — fills the whole main flex row ── */}
        {settingsSection && client.clientId === 'ride-now' && userType === 'oem' ? (
          <>
            <ClientSettingsContent
              initialSection={settingsSection}
              openConfigId={pendingConfigId}
              onConfigOpened={() => setPendingConfigId(null)}
            />
            {/* Agent + Comments panes are pervasive — available on every screen */}
            <AgentPane
              isOpen={isAgentPaneOpen}
              onClose={() => setIsAgentPaneOpen(false)}
            />
            <CommentsSidePanel />
          </>
        ) : (
        <>

        {/* Main Content Pane */}
        <MainPane className="flex-1 flex flex-col min-w-0 bg-white">
          <>

          {/* CAMPAIGNS (FUNDS) SECTION */}
          {activeAppSection === 'campaigns' && (
            <>
              {/* Header Section inside Card */}
              <div className="flex-none px-6 pt-4 pb-0">
                {/* Breadcrumbs — driven by active tab, all tabs covered */}
                <div className="mb-2 flex items-center justify-between">
                  <BreadcrumbBar
                    items={[
                      { label: 'Campaigns' },
                      { label: 'Funds' },
                    ]}
                    activeLabel={translatedTabs.find(t => t.id === activeTab)?.label ?? activeTab}
                  />
                  <CommentsButton />
                </div>

                {/* Page Title — always "Funds" per design */}
                <div className="mb-4">
                  <h1 className="text-[20px] font-medium text-[#1f1d25] tracking-[0.15px] leading-6">
                    {showLanguageToggle ? t('Funds') : 'Funds'}
                  </h1>
                </div>

                {/* Tabs */}
                <div className="w-full">
                  <TabNavigation tabs={translatedTabs} activeTab={activeTab} onTabChange={handleTabChange} />
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden relative">
                {activeTab === 'overview' && (
                  <div className="h-full overflow-y-auto custom-scrollbar p-6">
                     {userType !== 'oem' ? (
                       <FundsOverviewContent
                         userType={userType}
                         // [FV] feed live compliance counts (mirrors Compliance tab subselection)
                         userAddedInfractions={userAddedInfractions}
                         caseSolutions={caseSolutions}
                         complianceDealershipFilter={currentDealerIdentity.dealership}
                         complianceReportedByFilter={currentDealerIdentity.userName}
                         onNavigateToCompliance={() => handleTabChange('web-monitoring')}
                       />
                     ) : (
                       <FundsOverviewOEMContent
                         userAddedInfractions={userAddedInfractions}
                         caseSolutions={caseSolutions}
                         onNavigateToCompliance={() => handleTabChange('web-monitoring')}
                       />
                     )}
                  </div>
                )}
                
                {activeTab === 'pre-approvals' && (
                  <FundsPreApprovalsContent
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    searchQuery={preApprovalSearchQuery}
                    onSearchQueryChange={setPreApprovalSearchQuery}
                    selectedPreApprovalId={selectedPreApprovalId}
                    onSelectPreApproval={setSelectedPreApprovalId}
                    userType={userType}
                  />
                )}
                
                {activeTab === 'claims' && (
                  <FundsClaimsContent 
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    selectedClaimId={selectedClaimId}
                    onSelectClaim={setSelectedClaimId}
                    userType={userType}
                  />
                )}
                
                {activeTab === 'cases' && (
                  <CasesTab 
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                  />
                )}
                
                {activeTab === 'planner' && (
                  <PlannerContent
                    selectedCampaignId={selectedCampaignId}
                    onSelectCampaign={(id) => {
                      setSelectedCampaignId(id);
                      if (id) setIsAddingCampaign(false);
                    }}
                    onNewCampaign={() => {
                      setSelectedCampaignId(null);
                      setIsAddingCampaign(true);
                    }}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    campaigns={plannerCampaigns}
                    onCampaignsChange={setPlannerCampaigns}
                  />
                )}
                
                {activeTab === 'guidelines' && (
                  <GuidelinesContent />
                )}

                {activeTab === 'web-monitoring' && (
                  <WebMonitoringContent
                    selectedId={selectedWebMonitoringId}
                    onSelectItem={(id) => {
                      setSelectedWebMonitoringId(id);
                      setIsCreatingInfraction(false);
                    }}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    // [FV] dealer-view sees its own dealership's rows + any rows it reported about other dealerships
                    dealershipFilter={userType !== 'oem' ? currentDealerIdentity.dealership : undefined}
                    reportedByFilter={userType !== 'oem' ? currentDealerIdentity.userName : undefined}
                    // [FV] início — OEM Add Infraction wiring
                    userType={userType}
                    userAddedInfractions={userAddedInfractions}
                    onAddInfraction={() => {
                      setSelectedWebMonitoringId(null);
                      setIsCreatingInfraction(true);
                    }}
                    onOpenWebMonitoringConfig={userType === 'oem' ? () => setIsWebMonitoringConfigOpen(true) : undefined}
                    caseSolutions={caseSolutions}
                    deletedInfractionIds={deletedInfractionIds}
                    onDeleteInfraction={(id) => {
                      deleteInfraction(id);
                      setSelectedWebMonitoringId(prev => (prev === id ? null : prev));
                    }}
                    onReopenInfraction={(id) => updateInfractionStatus(id, 'Open')}
                    // [FV] fim
                  />
                )}
              </div>
            </>
          )}

          {/* PORTAL SECTION */}
          {activeAppSection === 'portal' && (
            <Suspense fallback={<div />}>
              <PortalContent onPreApproval={handlePortalPreApproval} />
            </Suspense>
          )}

          {/* PROJECTS SECTION */}
          {activeAppSection === 'projects' && (
             <div className="h-full overflow-hidden">
               <Suspense fallback={<div />}>
                 <ProjectsModule openProjectId={notifOpenProjectId} onProjectChange={handleProjectChange} />
               </Suspense>
             </div>
          )}

          {/* INVENTORY SECTION — RideNow only */}
          {activeAppSection === 'inventory' && client.clientId === 'ride-now' && (
            <Suspense fallback={<div />}>
              <InventoryContent isAgentPaneOpen={isAgentPaneOpen} />
            </Suspense>
          )}

          </> {/* end of normal sections */}

        </MainPane>

        {/* Right Pane - Side Panel (Only for Campaigns currently) */}
        {activeAppSection === 'campaigns' && (
          <>
            {/* Pre-Approval Panel */}
            {activeTab === 'pre-approvals' && selectedPreApproval && (
              <div className="flex-none h-full overflow-hidden w-[716px]">
                <RightPane>
                  <PreApprovalPanel
                    preApproval={selectedPreApproval}
                    onClose={() => setSelectedPreApprovalId(null)}
                    userType={userType}
                    onCreateClaim={handleCreateClaim}
                    onOpenAIReview={() => setIsOEMDrawerOpen(true)}
                  />
                </RightPane>
              </div>
            )}

            {/* Claims Panel */}
            {activeTab === 'claims' && selectedClaim && (
              <div className="flex-none h-full overflow-hidden w-[716px]">
                <RightPane>
                  <ClaimsPanel
                    claim={selectedClaim}
                    onClose={() => setSelectedClaimId(null)}
                    userType={userType}
                  />
                </RightPane>
              </div>
            )}

            {/* Planner Panel */}
            {activeTab === 'planner' && (selectedCampaign || isAddingCampaign) && (
              <div className="flex-none h-full overflow-hidden w-[440px]">
                <RightPane>
                  <PlannerPanel 
                    campaign={selectedCampaign} 
                    onClose={() => {
                      setSelectedCampaignId(null);
                      setIsAddingCampaign(false);
                    }} 
                    onSave={handleSavePlannerCampaign}
                  />
                </RightPane>
              </div>
            )}

            {/* Web Monitoring Panel */}
            {activeTab === 'web-monitoring' && selectedWCMItem && !isCreatingInfraction && (
              <div className="flex-none h-full overflow-hidden w-[716px]">
                <RightPane>
                  <WebMonitoringPanel
                    item={selectedWCMItem}
                    onClose={() => setSelectedWebMonitoringId(null)}
                    onOpenModal={() => setIsWebMonitoringModalOpen(true)}
                    userType={userType} // [FV] dealer footer hides Assign Penalty/Cancel + adds Issue Solution
                    currentDealerName={currentDealerIdentity.dealership} // [FV] hide reportedBy from target dealer
                    // [FV] início — case solution wiring
                    solution={caseSolutions[selectedWCMItem.id]}
                    onSubmitSolution={(draft) => submitCaseSolution(selectedWCMItem.id, draft, currentDealerIdentity.userName)}
                    onMarkSolved={() => {
                      markCaseSolved(selectedWCMItem.id);
                      if (userType === 'oem' && selectedWCMItem.dealership) {
                        addDealerCaseUpdate(selectedWCMItem.id, `Compliance case resolved · ${selectedWCMItem.violationType ?? 'Infraction'}`, selectedWCMItem.dealership);
                      }
                    }}
                    onAcceptReport={() => {
                      updateInfractionStatus(selectedWCMItem.id, 'Open');
                      if (userType === 'oem' && selectedWCMItem.dealership) {
                        addDealerCaseUpdate(selectedWCMItem.id, `A compliance infraction was accepted against your dealership · ${selectedWCMItem.violationType ?? 'Compliance case'}`, selectedWCMItem.dealership);
                      }
                    }}
                    // [FV] fim
                    // Discussion thread
                    wcmComments={wcmComments[selectedWCMItem.id] ?? []}
                    onAddComment={(text) => {
                      addWcmComment(selectedWCMItem.id, text, userType === 'oem' ? 'OEM' : currentDealerIdentity.userName, userType === 'oem' ? 'oem' : 'dealer');
                      if (userType === 'oem' && selectedWCMItem.dealership) {
                        addDealerCaseUpdate(selectedWCMItem.id, `OEM added a note on your compliance case`, selectedWCMItem.dealership);
                      }
                    }}
                    currentUserName={userType === 'oem' ? 'OEM' : currentDealerIdentity.userName}
                  />
                </RightPane>
              </div>
            )}

            {/* [FV] início — Add Infraction (create mode) panel, OEM + dealer */}
            {activeTab === 'web-monitoring' && isCreatingInfraction && (
              <div className="flex-none h-full overflow-hidden w-[716px]">
                <RightPane>
                  <WebMonitoringPanel
                    mode="create"
                    userType={userType}
                    currentDealerName={currentDealerIdentity.dealership}
                    currentReporterName={currentDealerIdentity.userName}
                    onClose={() => setIsCreatingInfraction(false)}
                    onSave={(infraction) => {
                      addInfraction(infraction);
                      setIsCreatingInfraction(false);
                      emitSnackbar(`Infraction ${infraction.id} added`);
                    }}
                  />
                </RightPane>
              </div>
            )}
            {/* [FV] fim */}
          </>
        )}

        {/* Projects section: AI project builder available for all user types */}
        {activeAppSection === 'projects' && (
          <ProjectAgentPane
            isOpen={isAgentPaneOpen}
            onClose={() => setIsAgentPaneOpen(false)}
            userType={userType}
            activeUserName={currentDealerIdentity.userName}
          />
        )}

        {/* All other sections: generic AgentPane — all user types */}
        {activeAppSection !== 'projects' && (
          <AgentPane
            isOpen={isAgentPaneOpen}
            onClose={() => setIsAgentPaneOpen(false)}
            accountName={userType === 'dealer' ? 'Honda of Anywhere' : undefined}
          />
        )}

        {/* Comments panel — same slot as agent pane */}
        <CommentsSidePanel />

        </> /* end of normal (non-settings) branch */
        )} {/* end settingsSection ternary */}

      </main>
      </CommentsProvider>

      <DrawerOEM
        open={isOEMDrawerOpen}
        onClose={() => setIsOEMDrawerOpen(false)}
        preApproval={selectedPreApproval ?? undefined}
        onApprove={(comment) => {
          approvePreApproval(comment.trim() || undefined);
          setIsOEMDrawerOpen(false);
          setSelectedPreApprovalId(null);
        }}
        onRequestRevision={(comment) => {
          requestPreApprovalRevision(comment.trim());
          setIsOEMDrawerOpen(false);
          setSelectedPreApprovalId(null);
        }}
      />

      {/* [FV] */}
      <WebMonitoringConfigModal
        open={isWebMonitoringConfigOpen}
        onClose={() => setIsWebMonitoringConfigOpen(false)}
      />

      {isWebMonitoringModalOpen && selectedWCMItem && (
        <WebMonitoringModal
          item={selectedWCMItem}
          open={isWebMonitoringModalOpen}
          onClose={() => setIsWebMonitoringModalOpen(false)}
        />
      )}

    </div>
  );
}