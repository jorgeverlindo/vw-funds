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

  // ── Navigation ─────────────────────────────────────────────────────────────

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
