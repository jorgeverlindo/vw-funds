import { useState } from "react";
import {
  Plus, Search, Megaphone, Globe, Calendar,
  MoreVertical, Trash2, ExternalLink, PanelLeft,
} from "lucide-react";
import { useSidebar } from "@projects/lib/sidebar-context";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "../ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = "Draft" | "Scheduled" | "Active" | "Ended";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  adShellIds: string[];
}

// ─── Status chip ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<CampaignStatus, { bg: string; text: string }> = {
  Draft:     { bg: "bg-[#F3F4F6]",               text: "text-[var(--ink-secondary)]" },
  Scheduled: { bg: "bg-[rgba(225,118,19,0.08)]",  text: "text-[#613f02]" },
  Active:    { bg: "bg-[#E8F5E9]",               text: "text-[#1b5e20]" },
  Ended:     { bg: "bg-[#F3F4F6]",               text: "text-[var(--ink-tertiary)]" },
};

function StatusChip({ status }: { status: CampaignStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
}

// ─── Campaign card ────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  onDelete,
}: {
  campaign: Campaign;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--border)] bg-white overflow-hidden hover:shadow-sm transition-shadow group">
      {/* Header band */}
      <div
        className="h-2 w-full"
        style={{ background: "linear-gradient(90deg, var(--brand-accent), var(--brand-mid))" }}
      />

      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[13px] font-semibold text-[var(--ink)] leading-tight truncate">{campaign.name}</span>
            <div className="flex items-center gap-1.5">
              <Globe size={11} className="text-[var(--ink-tertiary)]" />
              <span className="text-[11px] text-[var(--ink-secondary)]">{campaign.platform}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusChip status={campaign.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-[#F4F5F6] transition cursor-pointer">
                  <MoreVertical size={13} className="text-[var(--ink-secondary)]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <ExternalLink size={13} className="mr-2" /> View Campaign
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                  <Trash2 size={13} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-secondary)]">
          <Calendar size={11} className="shrink-0" />
          <span>{campaign.startDate} – {campaign.endDate}</span>
        </div>

        {/* Ad shells count */}
        <div className="text-[11px] text-[var(--ink-tertiary)]">
          {campaign.adShellIds.length} ad shell{campaign.adShellIds.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

// ─── New campaign dialog ──────────────────────────────────────────────────────

function NewCampaignDialog({
  projectName,
  onSave,
  onCancel,
}: {
  projectName: string;
  onSave: (c: Omit<Campaign, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName]           = useState(`${projectName} Campaign`);
  const [platform, setPlatform]   = useState("Facebook");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] mx-4 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(71,59,171,0.1), rgba(99,86,225,0.06))" }}>
            <Megaphone size={16} className="text-[var(--brand-accent)]" />
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--ink)]">New Campaign</h3>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[var(--ink-secondary)] uppercase tracking-wide">Campaign name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--brand-accent)] transition"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[var(--ink-secondary)] uppercase tracking-wide">Platform</label>
            <input
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              placeholder="e.g. Facebook, Google, Display…"
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--brand-accent)] transition"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] font-medium text-[var(--ink-secondary)] uppercase tracking-wide">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--brand-accent)] transition"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] font-medium text-[var(--ink-secondary)] uppercase tracking-wide">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--brand-accent)] transition"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-[13px] font-medium text-[var(--ink-secondary)] border border-[#CAC9CF] hover:bg-gray-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onSave({
              name: name.trim(),
              platform: platform.trim() || "Web",
              status: "Draft",
              startDate: startDate || "TBD",
              endDate: endDate || "TBD",
              adShellIds: [],
            })}
            className="px-4 py-2 rounded-full text-[13px] font-semibold text-white transition cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CampaignsPage({
  projectId,
  projectName,
  onClose,
}: {
  projectId: string;
  projectName: string;
  onClose: () => void;
}) {
  const { toggleSidebar, sidebarOpen } = useSidebar();
  const [campaigns, setCampaigns]     = useState<Campaign[]>([]);
  const [query, setQuery]             = useState("");
  const [showNew, setShowNew]         = useState(false);

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  function addCampaign(data: Omit<Campaign, "id">) {
    setCampaigns(prev => [...prev, { ...data, id: `camp-${Date.now()}` }]);
    setShowNew(false);
  }

  function deleteCampaign(id: string) {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] shrink-0">
        <button
          onClick={toggleSidebar}
          className={`w-7 h-7 flex items-center justify-center rounded-md transition shrink-0 cursor-pointer ${sidebarOpen ? "text-[var(--brand-accent)] bg-[rgba(71,59,171,0.08)]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
        >
          <PanelLeft size={16} />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-[#F4F5F6] rounded-lg px-3 py-1.5">
          <Search size={13} className="text-[var(--ink-tertiary)] shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search campaigns…"
            className="bg-transparent text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-tertiary)] outline-none flex-1"
          />
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-white cursor-pointer shrink-0 transition"
          style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
        >
          <Plus size={13} strokeWidth={2.5} />
          New Campaign
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(71,59,171,0.08), rgba(99,86,225,0.05))" }}>
              <Megaphone size={24} className="text-[var(--brand-accent)]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[var(--ink)] mb-1">No campaigns yet</p>
              <p className="text-[12px] text-[var(--ink-secondary)] max-w-[280px] leading-relaxed">
                Create a campaign to schedule and publish your ad shells across platforms.
              </p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium text-white cursor-pointer transition"
              style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
            >
              <Plus size={13} strokeWidth={2.5} />
              New Campaign
            </button>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {filtered.map(c => (
              <CampaignCard key={c.id} campaign={c} onDelete={() => deleteCampaign(c.id)} />
            ))}
          </div>
        )}
      </div>

      {/* New campaign dialog */}
      {showNew && (
        <NewCampaignDialog
          projectName={projectName}
          onSave={addCampaign}
          onCancel={() => setShowNew(false)}
        />
      )}
    </div>
  );
}
