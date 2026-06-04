import React from "react";
import { ActionButton } from "../ActionButton";
import { StatusChip, SeverityChip } from "../StatusChip";
import { KPICard } from "../KPICard";
import { MetricCard } from "../MetricCard";
import { ChannelChip } from "../ui/ChannelChip";
import { AvatarInitials } from "../ui/AvatarInitials";
import { CheckboxOEM } from "../ui/CheckboxOEM";
import { KeyValueRow } from "../ui/KeyValueRow";
import { TabNavigation } from "../TabNavigation";
import { BreadcrumbBar } from "../BreadcrumbBar";
import { FilterSelect } from "../FilterSelect";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ComponentEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  path: string;
  tags: string[];
  preview: React.ReactNode;
  usage: string;
}

// ─── Preview helpers ────────────────────────────────────────────────────────

/** Placeholder for components that need deep app context to render */
function ContextPreview({ label, note }: { label: string; note?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
      <div className="w-10 h-10 rounded-full bg-[rgba(71,59,171,0.08)] flex items-center justify-center">
        <svg
          className="w-5 h-5 text-[#473bab]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm0 8.625c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm8.625-8.625c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm0 8.625c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75z"
          />
        </svg>
      </div>
      <p className="text-[13px] font-medium text-[#1f1d25]">{label}</p>
      <p className="text-[12px] text-[#9c99a9] max-w-[260px] leading-relaxed">
        {note ?? "This component requires app data context. View it live in the application."}
      </p>
    </div>
  );
}

/** TabNavigation with its own internal state for the preview */
function TabPreview() {
  const [active, setActive] = React.useState("overview");
  return (
    <TabNavigation
      tabs={[
        { id: "overview",  label: "Overview" },
        { id: "approvals", label: "Pre-Approvals" },
        { id: "claims",    label: "Claims" },
      ]}
      activeTab={active}
      onTabChange={setActive}
    />
  );
}

/** CheckboxOEM with togglable state */
function CheckboxPreview() {
  const [checked, setChecked] = React.useState(false);
  return (
    <div className="flex items-center gap-3">
      <CheckboxOEM
        checked={checked}
        onCheckedChange={(v) => setChecked(!!v)}
        id="lib-check-preview"
      />
      <label
        htmlFor="lib-check-preview"
        className="text-[13px] text-[#1f1d25] cursor-pointer select-none"
      >
        {checked ? "Checked" : "Unchecked"}
      </label>
    </div>
  );
}

/** FilterSelect with its own internal state */
function FilterSelectPreview() {
  const [val, setVal] = React.useState<string | null>(null);
  return (
    <FilterSelect
      label="Status"
      value={val}
      options={[
        { value: null,        label: "All" },
        { value: "Approved",  label: "Approved" },
        { value: "In Review", label: "In Review" },
        { value: "Denied",    label: "Denied" },
      ]}
      onChange={setVal}
    />
  );
}

// ─── Snackbar mock preview (no state needed) ────────────────────────────────

function SnackbarPreview() {
  return (
    <div className="flex flex-col gap-3 items-start">
      <div className="flex items-center gap-3 bg-[#1f1d25] text-white rounded-xl px-4 py-3 text-[13px] shadow-lg min-w-[240px]">
        <svg className="w-4 h-4 text-[#7cfc84] shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
        Pre-Approval submitted successfully
      </div>
      <div className="flex items-center gap-3 bg-[#1f1d25] text-white rounded-xl px-4 py-3 text-[13px] shadow-lg min-w-[240px]">
        <svg
          className="w-4 h-4 text-[#ACABFF] shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        Claim sent for review
      </div>
    </div>
  );
}

// ─── Registry ───────────────────────────────────────────────────────────────

export const COMPONENT_REGISTRY: ComponentEntry[] = [

  // ── Primitives ─────────────────────────────────────────────────────────────

  {
    id: "action-button",
    name: "ActionButton",
    category: "Primitives",
    description:
      "Primary CTA button using the brand accent colour. Accepts any label and forwards all native button attributes.",
    path: "src/app/components/ActionButton.tsx",
    tags: ["button", "cta", "primary", "action"],
    preview: (
      <div className="flex gap-3 flex-wrap">
        <ActionButton label="New Project" />
        <ActionButton label="Add Offer" />
      </div>
    ),
    usage: `import { ActionButton } from "@/components/ActionButton";

<ActionButton label="New Project" onClick={handleClick} />`,
  },

  {
    id: "status-chip",
    name: "StatusChip",
    category: "Primitives",
    description:
      "Colour-coded status badge for workflow states: Approved, In Review, Revision Requested, Denied, Paid, and more.",
    path: "src/app/components/StatusChip.tsx",
    tags: ["status", "badge", "workflow", "chip", "label"],
    preview: (
      <div className="flex flex-wrap gap-2">
        <StatusChip status="Approved" />
        <StatusChip status="In Review" />
        <StatusChip status="Revision Requested" />
        <StatusChip status="Denied" />
        <StatusChip status="Paid" />
        <StatusChip status="Ready for Payment" />
      </div>
    ),
    usage: `import { StatusChip } from "@/components/StatusChip";

<StatusChip status="Approved" />
<StatusChip status="In Review" />
<StatusChip status="Denied" />`,
  },

  {
    id: "severity-chip",
    name: "SeverityChip",
    category: "Primitives",
    description:
      "Dot + label chip for web monitoring alert severity levels: High (red), Medium (orange), Low (grey).",
    path: "src/app/components/StatusChip.tsx",
    tags: ["severity", "alert", "web-monitoring", "chip"],
    preview: (
      <div className="flex flex-wrap gap-2">
        <SeverityChip severity="High" />
        <SeverityChip severity="Medium" />
        <SeverityChip severity="Low" />
      </div>
    ),
    usage: `import { SeverityChip } from "@/components/StatusChip";

<SeverityChip severity="High" />
<SeverityChip severity="Medium" />
<SeverityChip severity="Low" />`,
  },

  {
    id: "kpi-card",
    name: "KPICard",
    category: "Primitives",
    description:
      "Compact metric display card with a small label above and a larger value below. Used in metric groups across the dashboard.",
    path: "src/app/components/KPICard.tsx",
    tags: ["kpi", "metric", "card", "number", "data"],
    preview: (
      <div className="flex gap-3 flex-wrap">
        <KPICard label="Total Claims"   value="$142,800" />
        <KPICard label="Pre-Approvals" value="24" />
        <KPICard label="Avg. Cycle"    value="8.3 days" />
      </div>
    ),
    usage: `import { KPICard } from "@/components/KPICard";

<KPICard label="Total Claims" value="$142,800" />`,
  },

  {
    id: "metric-card",
    name: "MetricCard",
    category: "Primitives",
    description:
      "Clickable or static metric card. When onClick is provided it adds hover border and cursor-pointer behaviour for navigation.",
    path: "src/app/components/MetricCard.tsx",
    tags: ["metric", "card", "kpi", "clickable"],
    preview: (
      <div className="flex gap-3 flex-wrap">
        <MetricCard label="Claims Submitted" value="48" />
        <MetricCard label="Compliance Rate"  value="96.2%" onClick={() => {}} />
      </div>
    ),
    usage: `import { MetricCard } from "@/components/MetricCard";

// Static
<MetricCard label="Claims Submitted" value="48" />

// Clickable — navigates to detail view
<MetricCard label="Compliance" value="96%" onClick={handleClick} />`,
  },

  {
    id: "channel-chip",
    name: "ChannelChip",
    category: "Primitives",
    description:
      "Small media-channel tag with optional icon and removable ×. Used to display selected ad channels in offer and claim forms.",
    path: "src/app/components/ui/ChannelChip.tsx",
    tags: ["channel", "chip", "tag", "media", "icon"],
    preview: (
      <div className="flex flex-wrap gap-2">
        <ChannelChip label="Google PMax" />
        <ChannelChip label="Meta Ads"   onRemove={() => {}} />
        <ChannelChip label="Display"    onRemove={() => {}} />
        <ChannelChip label="YouTube"    onRemove={() => {}} />
      </div>
    ),
    usage: `import { ChannelChip } from "@/components/ui/ChannelChip";

<ChannelChip label="Google PMax" icon={googleIconUrl} />
<ChannelChip label="Meta Ads" onRemove={() => removeChannel("meta")} />`,
  },

  {
    id: "avatar-initials",
    name: "AvatarInitials",
    category: "Primitives",
    description:
      "Text-based avatar from initials. Supports circular, rounded, and square shapes. Configurable size, background, and text colour.",
    path: "src/app/components/ui/AvatarInitials.tsx",
    tags: ["avatar", "initials", "user", "identity"],
    preview: (
      <div className="flex items-end gap-4">
        <AvatarInitials initials="MM" size={40} bgColor="#473bab" />
        <AvatarInitials initials="JD" size={32} shape="rounded" bgColor="#cc0000" />
        <AvatarInitials initials="VW" size={32} shape="square"   bgColor="#1c3f7c" />
        <AvatarInitials initials="AB" size={24} bgColor="#bcbbc2" />
      </div>
    ),
    usage: `import { AvatarInitials } from "@/components/ui/AvatarInitials";

<AvatarInitials initials="MM" size={40} bgColor="#473bab" />
<AvatarInitials initials="JD" size={32} shape="rounded" />`,
  },

  {
    id: "checkbox-oem",
    name: "CheckboxOEM",
    category: "Primitives",
    description:
      "Radix-based checkbox following OEM design spec. Unchecked shows a grey border; checked fills with the brand accent colour.",
    path: "src/app/components/ui/CheckboxOEM.tsx",
    tags: ["checkbox", "input", "form", "oem", "radix"],
    preview: <CheckboxPreview />,
    usage: `import { CheckboxOEM } from "@/components/ui/CheckboxOEM";

const [checked, setChecked] = useState(false);

<CheckboxOEM
  checked={checked}
  onCheckedChange={(v) => setChecked(!!v)}
/>`,
  },

  {
    id: "key-value-row",
    name: "KeyValueRow",
    category: "Primitives",
    description:
      "Horizontal label–value pair separated by a bottom border. Stack multiple to form detail lists inside drawers and panels.",
    path: "src/app/components/ui/KeyValueRow.tsx",
    tags: ["key", "value", "row", "list", "detail", "panel"],
    preview: (
      <div className="w-full max-w-xs">
        <KeyValueRow label="Dealer"       value="Jack Daniels VW" />
        <KeyValueRow label="Claim ID"     value="MFC560002" valueClass="font-mono text-[#473bab]" />
        <KeyValueRow label="Status"       value={<StatusChip status="In Review" />} />
        <KeyValueRow label="Total Amount" value="$5,000.00" />
      </div>
    ),
    usage: `import { KeyValueRow } from "@/components/ui/KeyValueRow";

<KeyValueRow label="Dealer" value="Jack Daniels VW" />
<KeyValueRow label="Status" value={<StatusChip status="In Review" />} />`,
  },

  {
    id: "status-icon",
    name: "StatusIcon",
    category: "Primitives",
    description:
      "Small icon-based status indicator used alongside workflow state labels. Maps each status (Approved, Denied, In Review, etc.) to a distinct icon and colour, complementing StatusChip in non-chip contexts.",
    path: "src/app/components/shared/StatusIcon.tsx",
    tags: ["status", "icon", "indicator", "workflow", "shared"],
    preview: (
      <div className="flex items-center gap-4">
        {[
          { color: "#22c55e", label: "Approved" },
          { color: "#f59e0b", label: "In Review" },
          { color: "#ef4444", label: "Denied" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span className="text-[12px] text-[#686576]">{label}</span>
          </div>
        ))}
      </div>
    ),
    usage: `import { StatusIcon } from "@/components/shared/StatusIcon";

<StatusIcon status="Approved" />
<StatusIcon status="Denied" size={16} />`,
  },

  // ── Navigation ─────────────────────────────────────────────────────────────

  {
    id: "app-sidebar",
    name: "AppSidebar",
    category: "Navigation",
    description:
      "Main left-side navigation panel. Renders the app logo, client logo, nav items grouped by section, and the user avatar at the bottom. Adapts between dealer and OEM modes, showing the correct logo and nav items per UserType.",
    path: "src/app/components/AppSidebar.tsx",
    tags: ["sidebar", "navigation", "logo", "user", "oem", "dealer"],
    preview: (
      <ContextPreview
        label="AppSidebar"
        note="Full-height sidebar — rendered once in the app shell. Switch user modes to see OEM vs dealer variants."
      />
    ),
    usage: `import { AppSidebar } from "@/components/AppSidebar";

<AppSidebar
  activeSection={activeSection}
  onSectionChange={setActiveSection}
  userType="dealer"
/>`,
  },

  {
    id: "top-nav-bar",
    name: "TopNavBar",
    category: "Navigation",
    description:
      "Sticky top bar with page title, breadcrumb, and action buttons (notifications bell, agent pane toggle, user avatar). Appears inside main content panes across sections.",
    path: "src/app/components/TopNavBar.tsx",
    tags: ["top-bar", "navigation", "header", "breadcrumb", "notifications"],
    preview: (
      <ContextPreview
        label="TopNavBar"
        note="Fixed top navigation bar. Always visible in the main pane header."
      />
    ),
    usage: `import { TopNavBar } from "@/components/TopNavBar";

<TopNavBar title="Inventory" onNotifClick={openNotif} />`,
  },

  {
    id: "client-switcher",
    name: "ClientSwitcher",
    category: "Navigation",
    description:
      "Dropdown menu for switching between dealer clients (dealer-singular, dealer-emich, dealer-ridenow) and OEM mode. Displayed in the sidebar when the user has multi-client access.",
    path: "src/app/components/ClientSwitcher.tsx",
    tags: ["client", "switcher", "dropdown", "dealer", "oem", "sidebar"],
    preview: (
      <ContextPreview
        label="ClientSwitcher"
        note="Visible in the sidebar when multi-client mode is active."
      />
    ),
    usage: `import { ClientSwitcher } from "@/components/ClientSwitcher";

<ClientSwitcher
  currentClient={clientId}
  onSwitch={handleClientSwitch}
/>`,
  },

  {
    id: "side-sheet",
    name: "SideSheet",
    category: "Navigation",
    description:
      "Animated slide-in drawer panel that appears from the right. Generic container used for detail views, settings, and forms that need to co-exist with the main pane.",
    path: "src/app/components/side-sheet/SideSheet.tsx",
    tags: ["side-sheet", "drawer", "panel", "slide", "overlay"],
    preview: (
      <ContextPreview
        label="SideSheet"
        note="Slide-in panel overlay. Used in Client Settings and other detail flows."
      />
    ),
    usage: `import { SideSheet } from "@/components/side-sheet/SideSheet";

<SideSheet open={open} onClose={() => setOpen(false)} title="Settings">
  {children}
</SideSheet>`,
  },

  {
    id: "side-sheet-nav-item",
    name: "SideSheetNavItem",
    category: "Navigation",
    description:
      "Individual navigation row inside a SideSheet. Shows an icon, label, and active state. Used to build vertical nav lists within side drawers.",
    path: "src/app/components/side-sheet/SideSheetNavItem.tsx",
    tags: ["nav-item", "side-sheet", "list", "icon", "active"],
    preview: (
      <ContextPreview
        label="SideSheetNavItem"
        note="Used inside SideSheet to build section navigation lists."
      />
    ),
    usage: `import { SideSheetNavItem } from "@/components/side-sheet/SideSheetNavItem";

<SideSheetNavItem
  icon={<SettingsIcon />}
  label="General"
  active={activeNav === "general"}
  onClick={() => setActiveNav("general")}
/>`,
  },

  {
    id: "tab-navigation",
    name: "TabNavigation",
    category: "Navigation",
    description:
      "Horizontal tab bar with an animated brand-accent underline on the active tab. Fully controlled via props.",
    path: "src/app/components/TabNavigation.tsx",
    tags: ["tabs", "navigation", "bar", "underline"],
    preview: <TabPreview />,
    usage: `import { TabNavigation } from "@/components/TabNavigation";

<TabNavigation
  tabs={[
    { id: "overview",  label: "Overview" },
    { id: "approvals", label: "Pre-Approvals" },
    { id: "claims",    label: "Claims" },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>`,
  },

  {
    id: "breadcrumb-bar",
    name: "BreadcrumbBar",
    category: "Navigation",
    description:
      "Accessible breadcrumb trail with ancestor segments and an active leaf. Each ancestor can be a link or clickable button.",
    path: "src/app/components/BreadcrumbBar.tsx",
    tags: ["breadcrumb", "navigation", "trail", "path"],
    preview: (
      <BreadcrumbBar
        items={[{ label: "Volkswagen" }, { label: "Dealership" }]}
        activeLabel="Campaigns"
      />
    ),
    usage: `import { BreadcrumbBar } from "@/components/BreadcrumbBar";

<BreadcrumbBar
  items={[{ label: "Volkswagen" }, { label: "Dealership" }]}
  activeLabel="Campaigns"
/>`,
  },

  {
    id: "comments-button",
    name: "CommentsButton",
    category: "Navigation",
    description:
      "Self-contained button that toggles the CommentsSidePanel. Shows an animated tooltip with keyboard shortcut (C) on hover. Returns null outside a CommentsProvider.",
    path: "src/app/components/comments/CommentsButton.tsx",
    tags: ["comments", "button", "panel", "toggle", "tooltip"],
    preview: (
      <ContextPreview
        label="CommentsButton"
        note="Requires CommentsProvider context. Already placed in all main-pane headers across the app."
      />
    ),
    usage: `import { CommentsButton } from "@comments";

// Place at top-right of any main-pane header:
<div className="flex items-center justify-between">
  <BreadcrumbBar ... />
  <CommentsButton />
</div>`,
  },

  // ── Charts & Data ──────────────────────────────────────────────────────────

  {
    id: "dataviz-tooltip",
    name: "DatavizTooltip",
    category: "Charts & Data",
    description:
      "Custom Recharts tooltip component used across all chart cards. Shows a dark-background pill with label and formatted value. Passed as content prop to Recharts Tooltip.",
    path: "src/app/components/DatavizTooltip.tsx",
    tags: ["tooltip", "chart", "recharts", "dataviz"],
    preview: (
      <div className="flex items-center gap-3 bg-[#1f1d25] text-white rounded-xl px-4 py-2.5 text-[12px] shadow-lg w-fit">
        <span className="text-[#9c99a9]">March</span>
        <span className="font-semibold">$24,500</span>
      </div>
    ),
    usage: `import { DatavizTooltip } from "@/components/DatavizTooltip";

// Pass to any Recharts chart:
<Tooltip content={<DatavizTooltip />} />`,
  },

  {
    id: "activity-monitor",
    name: "ActivityMonitor",
    category: "Charts & Data",
    description:
      "Animated progress overlay for long-running AI or export tasks. Shows stage name, progress bar, and cancel/close controls. Supports states: preparing, complete, error, cancelled.",
    path: "src/app/components/ActivityMonitor.tsx",
    tags: ["monitor", "progress", "ai", "loading", "overlay", "task"],
    preview: (
      <ContextPreview
        label="ActivityMonitor"
        note="Appears during AI image generation. Triggered from VehicleInventoryGrid actions."
      />
    ),
    usage: `import { ActivityMonitor } from "@/components/ActivityMonitor";

<ActivityMonitor
  stage="preparing"
  displayName="Generating AI Image"
  onClose={handleClose}
/>`,
  },

  {
    id: "funds-pie-card",
    name: "FundsPieCard",
    category: "Charts & Data",
    description:
      "Donut chart card showing fund allocation by category. Built on Recharts. Adapts between dealer and OEM views.",
    path: "src/app/components/FundsPieCard.tsx",
    tags: ["chart", "pie", "donut", "recharts", "funds"],
    preview: (
      <ContextPreview
        label="FundsPieCard"
        note="Requires dealer/OEM funds data. View in Campaigns → Overview."
      />
    ),
    usage: `import { FundsPieCard } from "@/components/FundsPieCard";

<FundsPieCard />  {/* reads from useOverviewData internally */}`,
  },

  {
    id: "budget-forecast-card",
    name: "BudgetForecastCard",
    category: "Charts & Data",
    description:
      "Bar chart card displaying actual vs. forecasted monthly spend. Includes range tabs (3M, 6M, 1Y) and a year picker.",
    path: "src/app/components/BudgetForecastCard.tsx",
    tags: ["chart", "bar", "budget", "forecast", "recharts"],
    preview: (
      <ContextPreview
        label="BudgetForecastCard"
        note="Requires forecast data hook. View in Campaigns → Overview."
      />
    ),
    usage: `import { BudgetForecastCard } from "@/components/BudgetForecastCard";

<BudgetForecastCard />`,
  },

  {
    id: "payment-status-table-card",
    name: "PaymentStatusTableCard",
    category: "Charts & Data",
    description:
      "Table card listing recent payment transactions with status, amount, and date. Driven by usePaymentTransactions hook.",
    path: "src/app/components/PaymentStatusTableCard.tsx",
    tags: ["table", "payments", "transactions", "card"],
    preview: (
      <ContextPreview
        label="PaymentStatusTableCard"
        note="Driven by payment transaction hook. View in Overview tab."
      />
    ),
    usage: `import { PaymentStatusTableCard } from "@/components/PaymentStatusTableCard";

<PaymentStatusTableCard />`,
  },

  {
    id: "metric-group",
    name: "MetricGroup",
    category: "Charts & Data",
    description:
      "Horizontal row of MetricCard components pulled from the overview data hook. Adapts between dealer and OEM mode.",
    path: "src/app/components/MetricGroup.tsx",
    tags: ["metrics", "group", "dashboard", "kpi"],
    preview: (
      <ContextPreview
        label="MetricGroup"
        note="Reads from useOverviewData. View in Campaigns → Overview."
      />
    ),
    usage: `import { MetricGroup } from "@/components/MetricGroup";

<MetricGroup />  {/* reads useOverviewData internally */}`,
  },

  {
    id: "workflow-history-timeline",
    name: "WorkflowHistoryTimeline",
    category: "Charts & Data",
    description:
      "Vertical step timeline showing the history of a Pre-Approval or Claim through workflow states with timestamps and user attribution.",
    path: "src/app/components/WorkflowHistoryTimeline.tsx",
    tags: ["timeline", "history", "workflow", "steps"],
    preview: (
      <ContextPreview
        label="WorkflowHistoryTimeline"
        note="Requires a workflow history array. View in Pre-Approval or Claim panels."
      />
    ),
    usage: `import { WorkflowHistoryTimeline } from "@/components/WorkflowHistoryTimeline";

<WorkflowHistoryTimeline history={workflow.preApproval.history} />`,
  },

  // ── Comments ───────────────────────────────────────────────────────────────

  {
    id: "comments-provider",
    name: "CommentsProvider",
    category: "Comments",
    description:
      "React context provider that manages all comment state for a given context ID (section + tab or project UUID). Wrap any section that needs comments with it. Exposes full CRUD plus notifications, panel open state, and deep-link rover support.",
    path: "src/app/components/comments/CommentsContext.tsx",
    tags: ["comments", "provider", "context", "state", "notifications"],
    preview: (
      <ContextPreview
        label="CommentsProvider"
        note="Wraps section content — not visually rendered itself. Used at the section level in AppContent."
      />
    ),
    usage: `import { CommentsProvider } from "@comments";

<CommentsProvider contextId={\`\${section}-\${tab}\`}>
  {/* CommentsButton, CommentsSidePanel, NotificationsTray available inside */}
  {children}
</CommentsProvider>`,
  },

  {
    id: "notifications-tray",
    name: "NotificationsTray",
    category: "Comments",
    description:
      "Sliding right-side panel listing @mention and reply notifications for the current user. Animates width (0→400px) in concert with the main pane. Shows unread dot badges and a mark-all-read button.",
    path: "src/app/components/comments/NotificationsTray.tsx",
    tags: ["notifications", "tray", "panel", "mentions", "bell", "unread"],
    preview: (
      <ContextPreview
        label="NotificationsTray"
        note="Opens from the bell icon in the top nav. Managed by CommentsProvider."
      />
    ),
    usage: `// NotificationsTray is rendered automatically by CommentsProvider.
// Toggle it via the BellIcon in the top nav:
const { openNotif } = useCommentsRequired();
<button onClick={openNotif}><BellIcon /></button>`,
  },

  {
    id: "notification-overlay",
    name: "NotificationOverlay",
    category: "Comments",
    description:
      "Dealer-mode notification drop-down overlay. Shows a list of recent system notifications (pre-approval status, payment updates). Appears anchored to the bell button in the top nav.",
    path: "src/app/components/notifications/NotificationOverlay.tsx",
    tags: ["notifications", "overlay", "dropdown", "dealer", "bell"],
    preview: (
      <ContextPreview
        label="NotificationOverlay"
        note="Dealer-specific notifications dropdown. Click the bell icon in dealer mode."
      />
    ),
    usage: `import { NotificationOverlay } from "@/components/notifications/NotificationOverlay";

<NotificationOverlay
  open={notifOpen}
  anchorEl={bellRef.current}
  onClose={() => setNotifOpen(false)}
/>`,
  },

  {
    id: "notification-overlay-oem",
    name: "NotificationOverlayOEM",
    category: "Comments",
    description:
      "OEM-mode notification overlay. Shows system-level alerts (compliance flags, submission deadlines). Same anchor pattern as NotificationOverlay but with OEM-specific content and styling.",
    path: "src/app/components/notifications/NotificationOverlayOEM.tsx",
    tags: ["notifications", "overlay", "oem", "bell", "compliance"],
    preview: (
      <ContextPreview
        label="NotificationOverlayOEM"
        note="OEM-specific notifications dropdown. Switch to OEM mode and click the bell."
      />
    ),
    usage: `import { NotificationOverlayOEM } from "@/components/notifications/NotificationOverlayOEM";

<NotificationOverlayOEM
  open={notifOpen}
  anchorEl={bellRef.current}
  onClose={() => setNotifOpen(false)}
/>`,
  },

  {
    id: "chat-bubble",
    name: "ChatBubble",
    category: "Comments",
    description:
      "Individual comment card with author avatar, rich-text content, timestamp, reactions, and context menu. Supports 'rover' highlight state — purple ring + glow animation triggered by deep-link notification clicks.",
    path: "src/app/components/comments/ChatBubble.tsx",
    tags: ["comment", "chat", "bubble", "message", "rover", "highlight"],
    preview: (
      <ContextPreview
        label="ChatBubble"
        note="Rendered inside CommentsSidePanel from CommentsContext data. Open the Comments panel (C key) to see it live."
      />
    ),
    usage: `// ChatBubble is internal to CommentsSidePanel.
// isRover triggers the deep-link highlight animation:
<ChatBubble
  comment={comment}
  isRover={comment.id === highlightedCommentId}
/>`,
  },

  {
    id: "comments-side-panel",
    name: "CommentsSidePanel",
    category: "Comments",
    description:
      "Full comments panel that slides in from the right. Contains the comment thread, composer, and handles deep-link scroll-to-comment (rover state).",
    path: "src/app/components/comments/CommentsSidePanel.tsx",
    tags: ["comments", "panel", "thread", "sidebar"],
    preview: (
      <ContextPreview
        label="CommentsSidePanel"
        note="Managed by CommentsContext. Toggled by CommentsButton or the C keyboard shortcut."
      />
    ),
    usage: `// CommentsSidePanel is rendered automatically by CommentsProvider.
// No manual instantiation needed — wrap your app once:
<CommentsProvider contextId="my-section">
  {children}
  {/* panel appears here automatically */}
</CommentsProvider>`,
  },

  {
    id: "comment-composer",
    name: "CommentComposer",
    category: "Comments",
    description:
      "Rich-text comment input with @mention overlay, bold/italic/code formatting toolbar, and submit action.",
    path: "src/app/components/comments/CommentComposer.tsx",
    tags: ["comment", "composer", "input", "rich-text", "mention", "toolbar"],
    preview: (
      <ContextPreview
        label="CommentComposer"
        note="Internal to CommentsSidePanel. Uses FormattingToolbar and MentionOverlay."
      />
    ),
    usage: `// CommentComposer is internal to CommentsSidePanel.
// It emits onSubmit(richText) back to CommentsContext.`,
  },

  // ── Workflow ───────────────────────────────────────────────────────────────

  {
    id: "pre-approval-panel",
    name: "PreApprovalPanel",
    category: "Workflow",
    description:
      "Right-side detail panel for a Pre-Approval. Shows visual asset carousel, claim line details, supporting documents, OEM action buttons (Approve / Request Adjustments), and history timeline.",
    path: "src/app/components/PreApprovalPanel.tsx",
    tags: ["pre-approval", "panel", "workflow", "oem", "dealer"],
    preview: (
      <ContextPreview
        label="PreApprovalPanel"
        note="Requires WorkflowContext. View in Campaigns → Pre-Approvals."
      />
    ),
    usage: `// Rendered by AppContent when a PA row is selected.
// Reads from WorkflowContext and CommentsContext automatically.`,
  },

  {
    id: "claims-panel",
    name: "ClaimsPanel",
    category: "Workflow",
    description:
      "Right-side detail panel for a Claim. Contains visual assets, channel breakdown, invoice total, OEM payment controls, and history timeline.",
    path: "src/app/components/ClaimsPanel.tsx",
    tags: ["claim", "panel", "workflow", "payment", "oem"],
    preview: (
      <ContextPreview
        label="ClaimsPanel"
        note="Requires WorkflowContext. View in Campaigns → Claims."
      />
    ),
    usage: `// Rendered by AppContent when a Claim row is selected.
// Reads from WorkflowContext automatically.`,
  },

  {
    id: "share-report-modal",
    name: "ShareReportModal",
    category: "Workflow",
    description:
      "Modal dialog for exporting or emailing a report. Accepts report title and exposes onClose/onSend callbacks.",
    path: "src/app/components/ShareReportModal.tsx",
    tags: ["modal", "report", "export", "email", "share"],
    preview: (
      <ContextPreview
        label="ShareReportModal"
        note="Opens via the Generate Report split button in Campaigns Overview."
      />
    ),
    usage: `import { ShareReportModal } from "@/components/ShareReportModal";

<ShareReportModal
  open={open}
  onClose={() => setOpen(false)}
  reportTitle="March 2026 Campaign"
/>`,
  },

  // ── Forms & Controls ───────────────────────────────────────────────────────

  {
    id: "custom-select",
    name: "CustomSelect",
    category: "Forms & Controls",
    description:
      "Styled single-value select built on Radix Primitive. OEM brand accent on focus. Supports option groups, disabled items, and a clearable value. Replaces native <select> with consistent cross-browser styling.",
    path: "src/app/components/ui/CustomSelect.tsx",
    tags: ["select", "dropdown", "form", "radix", "controlled"],
    preview: (
      <ContextPreview
        label="CustomSelect"
        note="Used in forms across the app (Pre-Approval, Client Settings)."
      />
    ),
    usage: `import { CustomSelect } from "@/components/ui/CustomSelect";

<CustomSelect
  value={value}
  onChange={setValue}
  options={[
    { value: "vw",   label: "Volkswagen" },
    { value: "audi", label: "Audi" },
  ]}
  placeholder="Select OEM…"
/>`,
  },

  {
    id: "single-date-picker",
    name: "SingleDatePicker",
    category: "Forms & Controls",
    description:
      "Single-month calendar popover for selecting a single date. Shares the same calendar UI as DateRangePicker. Renders in a portal above z-index 10001.",
    path: "src/app/components/ui/SingleDatePicker.tsx",
    tags: ["date", "picker", "calendar", "form", "single"],
    preview: (
      <ContextPreview
        label="SingleDatePicker"
        note="Used in form fields requiring a single date selection."
      />
    ),
    usage: `import { SingleDatePicker } from "@/components/ui/SingleDatePicker";

<SingleDatePicker
  value={date}
  onChange={setDate}
  placeholder="Select date…"
/>`,
  },

  {
    id: "split-button",
    name: "SplitButton",
    category: "Forms & Controls",
    description:
      "Two-part button: the left segment fires the primary action, the right chevron opens a dropdown with secondary options. Used for report generation and export flows.",
    path: "src/app/components/ui/SplitButton.tsx",
    tags: ["split-button", "button", "dropdown", "export", "actions"],
    preview: (
      <ContextPreview
        label="SplitButton"
        note="Used in the Campaigns Overview header for report generation."
      />
    ),
    usage: `import { SplitButton } from "@/components/ui/SplitButton";

<SplitButton
  label="Generate Report"
  onPrimary={handleGenerate}
  options={[
    { label: "Export PDF", onClick: handlePDF },
    { label: "Export CSV", onClick: handleCSV },
  ]}
/>`,
  },

  {
    id: "filter-select",
    name: "FilterSelect",
    category: "Forms & Controls",
    description:
      "Compact dropdown for table header filters. Shows the current value as a label. In controlled mode renders an option list on click.",
    path: "src/app/components/FilterSelect.tsx",
    tags: ["filter", "select", "dropdown", "table", "header"],
    preview: <FilterSelectPreview />,
    usage: `import { FilterSelect } from "@/components/FilterSelect";

<FilterSelect
  label="Status"
  value={statusFilter}
  options={[
    { value: null,        label: "All" },
    { value: "Approved",  label: "Approved" },
    { value: "In Review", label: "In Review" },
  ]}
  onChange={setStatusFilter}
/>`,
  },

  {
    id: "date-range-picker",
    name: "DateRangePicker",
    category: "Forms & Controls",
    description:
      "Two-month calendar popover for selecting a date range (from/to). Re-click from-date resets selection. Rendered in a portal above z-index 10001.",
    path: "src/app/components/DateRangePicker.tsx",
    tags: ["date", "range", "picker", "calendar", "form"],
    preview: (
      <ContextPreview
        label="DateRangePicker"
        note="Used in the Pre-Approval form. Open 'New Pre-Approval' in the Campaigns tab to try it."
      />
    ),
    usage: `import { DateRangePicker } from "@/components/DateRangePicker";

<DateRangePicker
  fromDate={from}
  toDate={to}
  onChange={(from, to) => { setFrom(from); setTo(to); }}
/>`,
  },

  {
    id: "generate-report-split-button",
    name: "GenerateReportSplitButton",
    category: "Forms & Controls",
    description:
      "Split button: left side triggers the primary action, right side opens a dropdown with secondary export options.",
    path: "src/app/components/GenerateReportSplitButton.tsx",
    tags: ["split-button", "dropdown", "report", "export"],
    preview: (
      <ContextPreview
        label="GenerateReportSplitButton"
        note="Used in Campaigns Overview header. Triggers ShareReportModal on primary action."
      />
    ),
    usage: `import { GenerateReportSplitButton } from "@/components/GenerateReportSplitButton";

<GenerateReportSplitButton onGenerate={handleGenerate} />`,
  },

  {
    id: "snackbar",
    name: "Snackbar",
    category: "Forms & Controls",
    description:
      "Global toast notification system. Emit a message from anywhere via emitSnackbar(). SnackbarHost must be mounted once at the app root.",
    path: "src/app/components/Snackbar.tsx",
    tags: ["snackbar", "toast", "notification", "global", "event"],
    preview: <SnackbarPreview />,
    usage: `import { emitSnackbar } from "@/components/Snackbar";
import { SnackbarHost }  from "@/components/Snackbar";

// Mount once in App.tsx:
<SnackbarHost />

// Trigger from anywhere:
emitSnackbar("Pre-Approval submitted successfully");`,
  },

  // ── Inventory ──────────────────────────────────────────────────────────────

  {
    id: "inventory-content",
    name: "InventoryContent",
    category: "Inventory",
    description:
      "Root container for the Inventory section. Renders the active view (table, card-grid, card-list, or GlobalAI Config) based on the selected channel/tab. Hides channel labels when the comments panel or AI agent pane is open.",
    path: "src/app/components/inventory/InventoryContent.tsx",
    tags: ["inventory", "container", "view-switcher", "tabs"],
    preview: (
      <ContextPreview
        label="InventoryContent"
        note="Full section container — navigate to the Inventory tab to see it live."
      />
    ),
    usage: `import { InventoryContent } from "@/components/inventory/InventoryContent";

<InventoryContent isAgentPaneOpen={isAgentOpen} />`,
  },

  {
    id: "vehicle-inventory-grid",
    name: "VehicleInventoryGrid",
    category: "Inventory",
    description:
      "Full data table for vehicle inventory. Supports sort, filter, search, syndication toggle, and AI image enable/disable. Each row has a sticky hover-triggered kebab menu with contextual actions. Fires snackbar confirmations for state changes.",
    path: "src/app/components/inventory/VehicleInventoryGrid.tsx",
    tags: ["table", "inventory", "vehicles", "sort", "filter", "kebab"],
    preview: (
      <ContextPreview
        label="VehicleInventoryGrid"
        note="Requires vehicle data. View in Inventory → VIN table tab."
      />
    ),
    usage: `import { VehicleInventoryGrid } from "@/components/inventory/VehicleInventoryGrid";

<VehicleInventoryGrid
  vehicles={vehicles}
  onSyndicationToggle={handleSyndication}
  onAiGenerationToggle={handleAIToggle}
/>`,
  },

  {
    id: "vehicle-card-grid",
    name: "VehicleCardGrid",
    category: "Inventory",
    description:
      "Masonry/grid card layout for vehicle inventory. Each card shows a Thumbnail, VIN, year/make/model, price, and status chips. Supports selection and hover state.",
    path: "src/app/components/inventory/VehicleCardGrid.tsx",
    tags: ["grid", "card", "inventory", "vehicles", "thumbnail"],
    preview: (
      <ContextPreview
        label="VehicleCardGrid"
        note="Requires vehicle data. View in Inventory → Card Grid tab."
      />
    ),
    usage: `import { VehicleCardGrid } from "@/components/inventory/VehicleCardGrid";

<VehicleCardGrid vehicles={vehicles} />`,
  },

  {
    id: "vehicle-card-list",
    name: "VehicleCardList",
    category: "Inventory",
    description:
      "Horizontal list layout for vehicle inventory cards. Wider aspect ratio than card-grid, shows more metadata per item. Alternative layout mode for the Inventory section.",
    path: "src/app/components/inventory/VehicleCardList.tsx",
    tags: ["list", "card", "inventory", "vehicles"],
    preview: (
      <ContextPreview
        label="VehicleCardList"
        note="Requires vehicle data. View in Inventory → Card List tab."
      />
    ),
    usage: `import { VehicleCardList } from "@/components/inventory/VehicleCardList";

<VehicleCardList vehicles={vehicles} />`,
  },

  {
    id: "data-grid",
    name: "DataGrid",
    category: "Inventory",
    description:
      "Generic data table for the GlobalAI Config section. Supports custom column definitions, row hover with sticky kebab menu, and contextual action dispatch via GlobalAIConfigMenu.",
    path: "src/app/components/inventory/DataGrid.tsx",
    tags: ["table", "data-grid", "global-ai", "config", "kebab"],
    preview: (
      <ContextPreview
        label="DataGrid"
        note="Used in Inventory → GlobalAI Config tab."
      />
    ),
    usage: `import { DataGrid } from "@/components/inventory/DataGrid";

<DataGrid columns={columns} rows={rows} />`,
  },

  {
    id: "vehicles-menu",
    name: "VehiclesMenu",
    category: "Inventory",
    description:
      "Portal-mounted context menu for VehicleInventoryGrid rows. Slide-down entry animation. Actions: Syndicate, Edit, View on Site, Disable AI Image, Duplicate, Delete.",
    path: "src/app/components/inventory/VehiclesMenu.tsx",
    tags: ["context-menu", "portal", "vehicles", "kebab", "actions"],
    preview: (
      <ContextPreview
        label="VehiclesMenu"
        note="Appears on row hover in the Vehicle table. Anchored to the kebab button position."
      />
    ),
    usage: `import { VehiclesMenu } from "@/components/inventory/VehiclesMenu";

{openMenu && (
  <VehiclesMenu
    anchor={openMenu.anchor}
    syndicationStatus={row.syndicationStatus}
    aiGenerationStatus={row.aiGenerationStatus}
    onAction={handleMenuAction}
    onClose={() => setOpenMenu(null)}
  />
)}`,
  },

  {
    id: "global-ai-config-menu",
    name: "GlobalAIConfigMenu",
    category: "Inventory",
    description:
      "Portal-mounted context menu for GlobalAI Config DataGrid rows. Same slide-down animation as VehiclesMenu. Actions: Download Background, Duplicate, Enable AI Config, Edit | Remove.",
    path: "src/app/components/inventory/GlobalAIConfigMenu.tsx",
    tags: ["context-menu", "portal", "global-ai", "kebab", "actions"],
    preview: (
      <ContextPreview
        label="GlobalAIConfigMenu"
        note="Appears on row hover in the GlobalAI Config table."
      />
    ),
    usage: `import { GlobalAIConfigMenu } from "@/components/inventory/GlobalAIConfigMenu";

{openMenu && (
  <GlobalAIConfigMenu
    anchor={openMenu.anchor}
    onAction={handleAction}
    onClose={() => setOpenMenu(null)}
  />
)}`,
  },

  {
    id: "thumbnail",
    name: "Thumbnail",
    category: "Inventory",
    description:
      "Vehicle image thumbnail with aspect-ratio container, fallback skeleton, and optional overlay badge. Used in card-grid and card-list inventory views.",
    path: "src/app/components/inventory/Thumbnail.tsx",
    tags: ["thumbnail", "image", "vehicle", "fallback", "aspect-ratio"],
    preview: (
      <ContextPreview
        label="Thumbnail"
        note="Used inside VehicleCardGrid and VehicleCardList."
      />
    ),
    usage: `import { Thumbnail } from "@/components/inventory/Thumbnail";

<Thumbnail src={vehicle.imageUrl} alt={vehicle.vin} />`,
  },

  {
    id: "vin-detail-content",
    name: "VinDetailContent",
    category: "Inventory",
    description:
      "Full-page detail view for a single vehicle VIN. Shows image gallery, spec table, pricing, syndication status, AI generation status, and related offers.",
    path: "src/app/components/inventory/VinDetailContent.tsx",
    tags: ["vin", "vehicle", "detail", "gallery", "spec"],
    preview: (
      <ContextPreview
        label="VinDetailContent"
        note="Rendered when a VIN row is clicked in Inventory."
      />
    ),
    usage: `import { VinDetailContent } from "@/components/inventory/VinDetailContent";

<VinDetailContent vin={selectedVin} onBack={handleBack} />`,
  },

  {
    id: "prompt-library-modal",
    name: "PromptLibraryModal",
    category: "Inventory",
    description:
      "Modal dialog for browsing and selecting AI prompt templates used during vehicle AI image generation. Filterable by category.",
    path: "src/app/components/inventory/PromptLibraryModal.tsx",
    tags: ["modal", "prompt", "library", "ai", "template"],
    preview: (
      <ContextPreview
        label="PromptLibraryModal"
        note="Opened via the AI Image generation flow in Inventory."
      />
    ),
    usage: `import { PromptLibraryModal } from "@/components/inventory/PromptLibraryModal";

<PromptLibraryModal
  open={open}
  onClose={() => setOpen(false)}
  onSelect={handlePromptSelect}
/>`,
  },

  // ── Portal ─────────────────────────────────────────────────────────────────

  {
    id: "portal-card",
    name: "PortalCard",
    category: "Portal",
    description:
      "Selectable media asset card for the Portal grid view. Shows thumbnail, file name, type badge, and selection state.",
    path: "src/app/components/portal/PortalCard.tsx",
    tags: ["portal", "card", "asset", "media", "grid", "selectable"],
    preview: (
      <ContextPreview
        label="PortalCard"
        note="Used in the Portal asset grid. Switch to the Portal section to see the grid live."
      />
    ),
    usage: `import { PortalCard } from "@/components/portal/PortalCard";

<PortalCard
  asset={assetItem}
  selected={selected.has(asset.id)}
  onSelect={(id) => toggleSelect(id)}
/>`,
  },

  {
    id: "portal-header",
    name: "PortalHeader",
    category: "Portal",
    description:
      "Portal section header with folder navigation, search, view-mode toggle (grid/list), selection action bar, and CommentsButton.",
    path: "src/app/components/portal/PortalHeader.tsx",
    tags: ["portal", "header", "search", "view-toggle", "selection"],
    preview: (
      <ContextPreview
        label="PortalHeader"
        note="Full-width header bar — renders best at full width. View in the Portal section."
      />
    ),
    usage: `import { PortalHeader } from "@/components/portal/PortalHeader";

<PortalHeader
  selectionCount={0}
  onClearSelection={() => {}}
  searchQuery={query}
  onSearchChange={setQuery}
  viewMode="grid"
  onViewModeChange={setViewMode}
  onPreApproval={handlePreApproval}
/>`,
  },
];

// ─── Derived exports ─────────────────────────────────────────────────────────

export const CATEGORIES: string[] = Array.from(
  new Set(COMPONENT_REGISTRY.map((c) => c.category))
);
