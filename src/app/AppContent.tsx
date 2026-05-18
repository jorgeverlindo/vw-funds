import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { AppSidebar } from './components/AppSidebar';
import { TopNavBar } from './components/TopNavBar';
import { TabNavigation } from './components/TabNavigation';
import { FundsOverviewContent } from './components/FundsOverviewContent';
import { FundsOverviewOEMContent } from './components/FundsOverviewOEMContent';
import { FundsPreApprovalsContent, MOCK_DATA as PRE_APPROVALS_MOCK_DATA } from './components/FundsPreApprovalsContent';
import { FundsClaimsContent, CLAIMS_MOCK_DATA } from './components/FundsClaimsContent';
import { CasesTab } from './components/CasesTab';
import { PlannerContent, INITIAL_CAMPAIGNS as PLANNER_INITIAL_CAMPAIGNS, Campaign as PlannerCampaign, GANTT_COLORS } from './components/planner/PlannerContent';
import { PlannerPanel } from './components/planner/PlannerPanel';
import { PreApprovalPanel } from './components/PreApprovalPanel';
import { ClaimsPanel } from './components/ClaimsPanel';
import { MainPane, RightPane } from './components/LayoutWrappers';
import { DateRange } from 'react-day-picker';
import { PortalContent } from './components/portal/PortalContent';
import { ProjectsModule } from './components/projects/ProjectsModule';
import { DrawerOEM } from './components/pre-approval/DrawerOEM';
import { GuidelinesContent } from './components/GuidelinesContent';
import { AgentPane } from './components/AgentPane';
import { ProjectAgentPane } from './components/projects/ProjectAgentPane';
import { WebMonitoringContent, WCM_DATA } from './components/WebMonitoringContent';
import { WebMonitoringPanel } from './components/WebMonitoringPanel';
import { WebMonitoringModal } from './components/WebMonitoringModal';
import { WebMonitoringConfigModal } from './components/WebMonitoringConfigModal'; // [FV]
import { useTranslation } from './contexts/LanguageContext';
import { ClientSwitcher } from './components/ClientSwitcher';
import { emitSnackbar } from './components/Snackbar';
import { useClient } from './contexts/ClientContext';
import { useFilters } from './contexts/FilterContext';
import { BreadcrumbBar } from './components/BreadcrumbBar';
import { useWorkflow, WORKFLOW_DEALER, WORKFLOW_CAMPAIGN } from './contexts/WorkflowContext';
import { useCompliance, getDealerIdentity } from './contexts/ComplianceContext'; // [FV]
import type { Claim } from './components/ClaimsPanel';
import type { PreApproval } from './components/FundsPreApprovalsContent';
import imgMalloryManning from 'figma:asset/f0494d5017440bdc302141d9ab01c7c81e4a339a.png';

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

const TAB_SLUGS: Record<string, string> = {
  'overview':        'Overview',
  'pre-approvals':   'Pre-Approvals',
  'claims':          'Claims',
  'cases':           'Cases',
  'planner':         'Planner',
  'guidelines':      'Guidelines',
  'web-monitoring':  'Web-Monitoring',
};

const SLUG_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_SLUGS).map(([k, v]) => [v, k]),
);

function buildUrl(role: UserType, clientId: string, tabId: string): string {
  const slug = TAB_SLUGS[tabId] ?? tabId;
  if (role === 'oem') {
    return clientId === 'vw' ? `/OEM/${slug}` : `/Audi/OEM/${slug}`;
  }
  const brand = clientId === 'audi' ? 'Audi' : 'Volkswagen';
  if (role === 'dealer-singular') return `/${brand}/dealership-singular/${slug}`;
  if (role === 'dealer-emich')    return `/${brand}/dealership-emich/${slug}`; // [FV]
  return `/${brand}/dealership/${slug}`;
}

// ─────────────────────────────────────────────────────────────────────────────

const defaultDateRange: DateRange = {
  from: new Date(2025, 0, 1),
  to: new Date(2026, 11, 31),
};

export type UserType = 'dealer' | 'dealer-singular' | 'dealer-emich' | 'oem';

export default function AppContent() {
  const { t } = useTranslation();
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

  const [activeAppSection, setActiveAppSection] = useState('campaigns'); // 'campaigns' | 'portal'
  const [activeTab, setActiveTab] = useState(_initTab);
  const [userType, setUserType] = useState<UserType>(_initRole);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [clientSwitcherOpen, setClientSwitcherOpen] = useState(false);

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
  const cssMode = (userType === 'dealer-singular' || userType === 'dealer-emich') ? 'dealer' : userType;

  // [FV] current dealer identity (own dealership name + user) — drives Compliance scope, AI auto-fill, and labels
  const currentDealerIdentity = getDealerIdentity(userType);
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', cssMode);
  }, [cssMode]);

  // Keyboard shortcuts: e → OEM  |  a → Agency (multi-dealer)  |  d → Dealer singular
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'e') {
        const nextTab = activeTab === 'guidelines' ? 'overview' : activeTab;
        unlockDealership();
        setUserType('oem');
        setActiveTab(nextTab);
        navigate(buildUrl('oem', client.clientId, nextTab), { replace: true });
        emitSnackbar('OEM view (e)');
      }
      if (e.key === 'a') {
        unlockDealership();
        setUserType('dealer');
        navigate(buildUrl('dealer', client.clientId, activeTab), { replace: true });
        emitSnackbar('Agency view (a)');
      }
      if (e.key === 'd') {
        lockDealership(WORKFLOW_DEALER.code);
        setUserType('dealer-singular');
        navigate(buildUrl('dealer-singular', client.clientId, activeTab), { replace: true });
        emitSnackbar('Jack Daniels Volkswagen (d)'); // [FV] toast label decoupled from WORKFLOW_DEALER.name
      }
      // [FV] 's' → Emich Volkswagen dealer view (used to demo cross-dealer compliance reports)
      if (e.key === 's') {
        unlockDealership();
        setUserType('dealer-emich');
        navigate(buildUrl('dealer-emich', client.clientId, activeTab), { replace: true });
        emitSnackbar('Emich Volkswagen (s)');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab, client.clientId, navigate, lockDealership, unlockDealership]);
  
  // Pre-Approvals Specific State
  const [preApprovalSearchQuery, setPreApprovalSearchQuery] = useState('');
  const [selectedPreApprovalId, setSelectedPreApprovalId] = useState<string | null>(null);

  const selectedPreApproval = useMemo((): PreApproval | null | undefined => {
    if (!selectedPreApprovalId) return null;

    // ── Active workflow PA (ID changes each cycle after archiveAndReset) ──────
    if (selectedPreApprovalId === workflow.preApproval.id) {
      const wfPA = workflow.preApproval;
      return {
        id: wfPA.id,
        title: wfPA.title,
        date: new Date(),
        dealershipCode: WORKFLOW_DEALER.code,
        dealershipName: WORKFLOW_DEALER.name,
        dealershipCity: WORKFLOW_DEALER.city,
        status: (() => {
          switch (wfPA.status) {
            case 'Approved':           return 'Approved';
            case 'Revision Requested': return 'Revision Requested';
            case 'In Review':
            case 'Resubmitted':        return 'In Review';
            default:                   return 'Pending';
          }
        })() as PreApproval['status'],
        timeInPreApproval: 1,
        submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: '' },
        mediaType: WORKFLOW_CAMPAIGN.mediaType,
        details: wfPA.details || 'Digital Ad Campaign',
        lastUpdated: new Date(),
        submittedAt: wfPA.submittedAt ? new Date(wfPA.submittedAt) : new Date('2026-04-20'),
        initiativeType: WORKFLOW_CAMPAIGN.initiativeType,
        claimsCount: wfPA.claimsCount,
        contactEmail: wfPA.contactEmail || WORKFLOW_DEALER.email,
        description: wfPA.details || WORKFLOW_CAMPAIGN.description,
        documents: wfPA.documents,
      };
    }

    // ── Archived workflow cycles (shown in the list after archiveAndReset) ────
    const archived = workflow.archivedCycles.find(c => c.preApproval.id === selectedPreApprovalId);
    if (archived) {
      const pa = archived.preApproval;
      return {
        id: pa.id,
        title: pa.title,
        date: new Date(archived.archivedAt),
        dealershipCode: WORKFLOW_DEALER.code,
        dealershipName: WORKFLOW_DEALER.name,
        dealershipCity: WORKFLOW_DEALER.city,
        status: (() => {
          switch (pa.status) {
            case 'Approved':           return 'Approved';
            case 'Revision Requested': return 'Revision Requested';
            case 'In Review':
            case 'Resubmitted':        return 'In Review';
            default:                   return 'Pending';
          }
        })() as PreApproval['status'],
        timeInPreApproval: 0,
        submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: '' },
        mediaType: WORKFLOW_CAMPAIGN.mediaType,
        details: pa.details || 'Digital Ad Campaign',
        lastUpdated: new Date(archived.archivedAt),
        submittedAt: pa.submittedAt ? new Date(pa.submittedAt) : new Date(archived.archivedAt),
        initiativeType: WORKFLOW_CAMPAIGN.initiativeType,
        claimsCount: pa.claimsCount,
        contactEmail: pa.contactEmail || WORKFLOW_DEALER.email,
        description: pa.details || WORKFLOW_CAMPAIGN.description,
        documents: pa.documents,
      };
    }

    // ── Portal submissions ────────────────────────────────────────────────────
    const portalSub = workflow.portalSubmissions.find(s => s.id === selectedPreApprovalId);
    if (portalSub) {
      return {
        id: portalSub.id,
        title: portalSub.title || undefined,
        date: new Date(portalSub.submittedAt),
        dealershipCode: WORKFLOW_DEALER.code,
        dealershipName: WORKFLOW_DEALER.name,
        dealershipCity: WORKFLOW_DEALER.city,
        status: (portalSub.status ?? 'Pending') as PreApproval['status'],
        timeInPreApproval: 0,
        submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: '' },
        mediaType: portalSub.mediaType || WORKFLOW_CAMPAIGN.mediaType,
        details: portalSub.title || 'Portal Pre-Approval',
        lastUpdated: new Date(portalSub.submittedAt),
        submittedAt: new Date(portalSub.submittedAt),
        initiativeType: portalSub.initiativeType || WORKFLOW_CAMPAIGN.initiativeType,
        claimsCount: 0,
        contactEmail: WORKFLOW_DEALER.email,
        description: portalSub.title || 'Submitted via portal',
        documents: [],
      };
    }

    // ── Static mock data ─────────────────────────────────────────────────────
    return PRE_APPROVALS_MOCK_DATA.find(i => i.id === selectedPreApprovalId);
  }, [selectedPreApprovalId, workflow.preApproval, workflow.archivedCycles, workflow.portalSubmissions]);

  // Claims Specific State
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  const selectedClaim = useMemo((): Claim | null | undefined => {
    if (!selectedClaimId) return null;

    // ── Active workflow claim (ID changes each cycle after archiveAndReset) ──
    if (selectedClaimId === workflow.claim.id) {
      const wfCL = workflow.claim;
      return {
        id: wfCL.id,
        uid: wfCL.id,
        date: wfCL.submittedAt ? new Date(wfCL.submittedAt) : new Date(),
        amount: WORKFLOW_CAMPAIGN.totalAmount,
        status: (wfCL.status ?? 'Draft') as Claim['status'],
        timeInClaim: 0,
        timeInPayment: 0,
        dealershipCode: WORKFLOW_DEALER.code,
        dealershipName: WORKFLOW_DEALER.name,
        dealershipCity: WORKFLOW_DEALER.city,
        fund: 'VW Coop Fund 2026',
        submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: imgMalloryManning },
        type: WORKFLOW_CAMPAIGN.initiativeType,
        lastUpdated: new Date().toLocaleDateString(),
        details: WORKFLOW_CAMPAIGN.description,
      };
    }

    // ── Archived workflow claims ──────────────────────────────────────────────
    const archivedCl = workflow.archivedCycles.find(c => c.claim.id === selectedClaimId);
    if (archivedCl) {
      const cl = archivedCl.claim;
      return {
        id: cl.id,
        uid: cl.id,
        date: cl.submittedAt ? new Date(cl.submittedAt) : new Date(archivedCl.archivedAt),
        amount: WORKFLOW_CAMPAIGN.totalAmount,
        status: (cl.status ?? 'Paid') as Claim['status'],
        timeInClaim: 0,
        timeInPayment: 0,
        dealershipCode: WORKFLOW_DEALER.code,
        dealershipName: WORKFLOW_DEALER.name,
        dealershipCity: WORKFLOW_DEALER.city,
        fund: 'VW Coop Fund 2026',
        submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: imgMalloryManning },
        type: WORKFLOW_CAMPAIGN.initiativeType,
        lastUpdated: new Date(archivedCl.archivedAt).toLocaleDateString(),
        details: WORKFLOW_CAMPAIGN.description,
      };
    }

    // ── Static mock data ─────────────────────────────────────────────────────
    return CLAIMS_MOCK_DATA.find(i => i.id === selectedClaimId);
  }, [selectedClaimId, workflow.claim, workflow.archivedCycles]);

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

  // Handle Navigation from Sidebar
  const handleNavigate = (route: string) => {
    setActiveAppSection(route);
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
      if (next === 'dealer') unlockDealership(); else unlockDealership();
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
    const brandId = brandParam === 'audi' ? 'audi' : 'vw';
    setUserType(role);
    setActiveTab(tabId);
    if (brandId !== client.clientId) switchClient(brandId);
    // Re-sync the lock state when navigating back/forward
    if (role === 'dealer-singular') lockDealership(WORKFLOW_DEALER.code);
    else unlockDealership();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // OEM Drawer State
  const [isOEMDrawerOpen, setIsOEMDrawerOpen] = useState(false);

  // Agent Pane State — dealer-only
  const [isAgentPaneOpen, setIsAgentPaneOpen] = useState(false);

  const [selectedWebMonitoringId, setSelectedWebMonitoringId] = useState<string | null>(null);
  const [isWebMonitoringModalOpen, setIsWebMonitoringModalOpen] = useState(false);
  const [isWebMonitoringConfigOpen, setIsWebMonitoringConfigOpen] = useState(false); // [FV]
  const [isCreatingInfraction, setIsCreatingInfraction] = useState(false); // [FV]

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
        onOpenAgentPane={() => setIsAgentPaneOpen(open => !open)}
        isAgentPaneOpen={isAgentPaneOpen}
        // [FV] início — dealer-side infraction notifications driven by OEM-added rows
        dealerInfractionNotifs={userType !== 'oem' ? dealerInfractionNotifs(currentDealerIdentity.dealership) : undefined}
        dealerSeenInfractionIds={userType !== 'oem' ? seenInfractionIds : undefined}
        dealerInfractionUnread={userType !== 'oem' ? dealerInfractionUnread(currentDealerIdentity.dealership) : 0}
        onOpenInfractionFromNotif={(id) => {
          markSeenInfraction(id);
          setActiveTab('web-monitoring');
          setSelectedWebMonitoringId(id);
          setIsCreatingInfraction(false);
          navigate(buildUrl(userType, client.clientId, 'web-monitoring'), { replace: true });
        }}
        dealerSubmittedNotifs={undefined}
        dealerSeenSubmittedIds={undefined}
        dealerSubmittedUnread={0}
        onOpenSubmittedFromNotif={undefined}
        dealerCaseUpdateNotifs={userType !== 'oem' ? dealerCaseUpdateNotifs(currentDealerIdentity.dealership) : undefined}
        seenCaseUpdateIds={userType !== 'oem' ? seenCaseUpdateIds : undefined}
        dealerCaseUpdateUnread={userType !== 'oem' ? dealerCaseUpdateUnread(currentDealerIdentity.dealership) : 0}
        onOpenCaseUpdateFromNotif={(id) => {
          markSeenCaseUpdate(id);
          setActiveTab('web-monitoring');
          const update = caseUpdates.find(u => u.id === id);
          if (update) setSelectedWebMonitoringId(update.itemId);
          setIsCreatingInfraction(false);
          navigate(buildUrl(userType, client.clientId, 'web-monitoring'), { replace: true });
        }}
        // OEM-side: solutions submitted by dealers
        oemSolutionNotifs={userType === 'oem' ? oemSolutionNotifs : undefined}
        oemSeenSolutionIds={userType === 'oem' ? oemSeenSolutionIds : undefined}
        oemSolutionUnread={userType === 'oem' ? oemSolutionUnread : 0}
        onOpenSolutionFromNotif={(id) => {
          markOemSeenSolution(id);
          setActiveTab('web-monitoring');
          setSelectedWebMonitoringId(id);
          setIsCreatingInfraction(false);
          navigate(buildUrl(userType, client.clientId, 'web-monitoring'), { replace: true });
        }}
        // OEM-side: dealer-reported infractions
        oemReportedNotifs={userType === 'oem' ? oemReportedNotifs : undefined}
        oemSeenReportedIds={userType === 'oem' ? oemSeenReportedIds : undefined}
        oemReportedUnread={userType === 'oem' ? oemReportedUnread : 0}
        onOpenReportedFromNotif={(id) => {
          markOemSeenReported(id);
          setActiveTab('web-monitoring');
          setSelectedWebMonitoringId(id);
          setIsCreatingInfraction(false);
          navigate(buildUrl(userType, client.clientId, 'web-monitoring'), { replace: true });
        }}
        // [FV] fim
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
      />

      {/* Main Layout Container - Fixed offsets for sidebar/navbar */}
      <main className="ml-[72px] mt-[32px] h-[calc(100vh-48px)] flex p-6 gap-6 overflow-hidden mr-[0px] mb-[0px]">
        
        {/* Main Content Pane */}
        <MainPane className="flex-1 flex flex-col min-w-0 bg-white">
          
          {/* CAMPAIGNS (FUNDS) SECTION */}
          {activeAppSection === 'campaigns' && (
            <>
              {/* Header Section inside Card */}
              <div className="flex-none px-6 pt-4 pb-0">
                {/* Breadcrumbs — driven by active tab, all tabs covered */}
                <div className="mb-2">
                  <BreadcrumbBar
                    items={[
                      { label: 'Campaigns' },
                      { label: 'Funds' },
                    ]}
                    activeLabel={translatedTabs.find(t => t.id === activeTab)?.label ?? activeTab}
                  />
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
             <PortalContent onPreApproval={handlePortalPreApproval} />
          )}

          {/* PROJECTS SECTION */}
          {activeAppSection === 'projects' && (
             <div className="h-full overflow-hidden">
               <ProjectsModule />
             </div>
          )}

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
          />
        )}

        {/* All other sections: generic AgentPane — dealer-only */}
        {activeAppSection !== 'projects' && (userType === 'dealer' || userType === 'dealer-singular' || userType === 'dealer-emich') && (
          <AgentPane
            isOpen={isAgentPaneOpen}
            onClose={() => setIsAgentPaneOpen(false)}
          />
        )}
      </main>

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