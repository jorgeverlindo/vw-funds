import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { ProjectsScreen } from './components/projects/ProjectsScreen';
import { DrawerOEM } from './components/pre-approval/DrawerOEM';
import { GuidelinesContent } from './components/GuidelinesContent';
import { AgentPane } from './components/AgentPane';
import { WebMonitoringContent, WCM_DATA } from './components/WebMonitoringContent';
import { WebMonitoringPanel } from './components/WebMonitoringPanel';
import { WebMonitoringModal } from './components/WebMonitoringModal';
import { useTranslation } from './contexts/LanguageContext';
import { ClientSwitcher } from './components/ClientSwitcher';
import { Snackbar } from './components/pre-approval/Snackbar';
import { useClient } from './contexts/ClientContext';
import { BreadcrumbBar } from './components/BreadcrumbBar';

const DEALER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pre-approvals', label: 'Pre-Approvals' },
  { id: 'claims', label: 'Claims' },
  { id: 'cases', label: 'Cases' },
  { id: 'planner', label: 'Planner' },
  { id: 'guidelines', label: 'Guidelines & Assets' },
];

const OEM_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pre-approvals', label: 'Pre-Approvals' },
  { id: 'claims', label: 'Claims' },
  { id: 'cases', label: 'Cases' },
  { id: 'planner', label: 'Planner' },
  { id: 'web-monitoring', label: 'Web Monitoring' },
];

const defaultDateRange: DateRange = {
  from: new Date(2025, 0, 1),
  to: new Date(2025, 11, 31),
};

export type UserType = 'dealer' | 'oem';

export default function AppContent() {
  const { t } = useTranslation();
  const [activeAppSection, setActiveAppSection] = useState('campaigns'); // 'campaigns' | 'portal'
  const [activeTab, setActiveTab] = useState('overview');
  const [userType, setUserType] = useState<UserType>('dealer');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);

  // Client switcher
  const { client, switchClient } = useClient();
  const [clientSwitcherOpen, setClientSwitcherOpen] = useState(false);

  // View snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showViewSnackbar = useCallback((msg: string) => {
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    setSnackbarMsg(msg);
    setSnackbarOpen(true);
    snackbarTimer.current = setTimeout(() => setSnackbarOpen(false), 2500);
  }, []);

  // Keyboard shortcuts: e → OEM view, d → Dealer view
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'e') {
        setUserType('oem');
        showViewSnackbar('OEM view (e)');
      }
      if (e.key === 'd') {
        setUserType('dealer');
        showViewSnackbar('Dealer view (d)');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showViewSnackbar]);
  
  // Pre-Approvals Specific State
  const [preApprovalSearchQuery, setPreApprovalSearchQuery] = useState('');
  const [selectedPreApprovalId, setSelectedPreApprovalId] = useState<string | null>(null);

  const selectedPreApproval = useMemo(() => 
    selectedPreApprovalId ? PRE_APPROVALS_MOCK_DATA.find(i => i.id === selectedPreApprovalId) : null
  , [selectedPreApprovalId]);

  // Claims Specific State
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  const selectedClaim = useMemo(() => 
    selectedClaimId ? CLAIMS_MOCK_DATA.find(i => i.id === selectedClaimId) : null
  , [selectedClaimId]);

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
  };

  // Handle Navigation from Sidebar
  const handleNavigate = (route: string) => {
    setActiveAppSection(route);
  };

  // Handle Portal Pre-Approval Action (Go to Pre-Approvals tab in Campaigns)
  const handlePortalPreApproval = () => {
    setActiveAppSection('campaigns');
    setActiveTab('pre-approvals');
  };

  const toggleUserType = () => {
    setUserType(prev => {
      const next = prev === 'dealer' ? 'oem' : 'dealer';
      // Reset to overview if current tab doesn't exist in the new user type's tab set
      if (next === 'oem' && activeTab === 'guidelines') {
        setActiveTab('overview');
      }
      return next;
    });
  };

  // OEM Drawer State
  const [isOEMDrawerOpen, setIsOEMDrawerOpen] = useState(false);

  // Agent Pane State — dealer-only
  const [isAgentPaneOpen, setIsAgentPaneOpen] = useState(false);

  const [selectedWebMonitoringId, setSelectedWebMonitoringId] = useState<string | null>(null);
  const [isWebMonitoringModalOpen, setIsWebMonitoringModalOpen] = useState(false);

  const selectedWCMItem = useMemo(() =>
    selectedWebMonitoringId ? WCM_DATA.find(i => i.id === selectedWebMonitoringId) ?? null : null
  , [selectedWebMonitoringId]);

  const showLanguageToggle = activeAppSection === 'campaigns';

  // userType added to dep array so tabs recompute when switching Dealer ↔ OEM
  const translatedTabs = useMemo(() => (userType === 'dealer' ? DEALER_TABS : OEM_TABS).map(tab => ({
    ...tab,
    label: showLanguageToggle ? t(tab.label) : tab.label
  })), [t, showLanguageToggle, userType]);

  return (
    <div className="min-h-screen bg-[#F9FAFA] overflow-hidden">
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
        onSelect={(id) => { switchClient(id); setClientSwitcherOpen(false); }}
      />
      <Snackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
        actionLabel=""
      />
      <TopNavBar 
        userType={userType} 
        onOpenOEMDrawer={() => setIsOEMDrawerOpen(true)} 
        languageToggleActive={showLanguageToggle}
        onOpenAgentPane={() => setIsAgentPaneOpen(open => !open)}
        isAgentPaneOpen={isAgentPaneOpen}
        onOpenWebMonitoring={(id) => {
          setActiveTab('web-monitoring');
          setSelectedWebMonitoringId(id);
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
                     {userType === 'dealer' ? (
                       <FundsOverviewContent />
                     ) : (
                       <FundsOverviewOEMContent />
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
                    onSelectItem={setSelectedWebMonitoringId}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
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
               <ProjectsScreen />
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
            {activeTab === 'web-monitoring' && selectedWCMItem && (
              <div className="flex-none h-full overflow-hidden w-[716px]">
                <RightPane>
                  <WebMonitoringPanel
                    item={selectedWCMItem}
                    onClose={() => setSelectedWebMonitoringId(null)}
                    onOpenModal={() => setIsWebMonitoringModalOpen(true)}
                  />
                </RightPane>
              </div>
            )}
          </>
        )}

        {/* Agent Pane — dealer-only, global (any tab / section) */}
        {userType === 'dealer' && (
          <AgentPane
            isOpen={isAgentPaneOpen}
            onClose={() => setIsAgentPaneOpen(false)}
          />
        )}
      </main>

      <DrawerOEM open={isOEMDrawerOpen} onClose={() => setIsOEMDrawerOpen(false)} />

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