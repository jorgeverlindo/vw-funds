import { useState } from "react";
import { Search, ChevronLeft, Plus, Megaphone, Globe, Calendar, MoreVertical, Trash2, ExternalLink } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = "Draft" | "Scheduled" | "Active" | "Ended";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  adShellCount: number;
}

// ─── Status chip ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<CampaignStatus, { bg: string; text: string }> = {
  Draft:     { bg: "bg-gray-100",              text: "text-gray-500" },
  Scheduled: { bg: "bg-orange-50",             text: "text-orange-700" },
  Active:    { bg: "bg-green-50",              text: "text-green-700" },
  Ended:     { bg: "bg-gray-100",              text: "text-gray-400" },
};

function StatusChip({ status }: { status: CampaignStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
}

// ─── Campaign card ────────────────────────────────────────────────────────────

function CampaignCard({ campaign, onDelete }: { campaign: Campaign; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-sm transition-shadow">
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--brand-accent), var(--brand-mid, #6356E1))" }} />
      <div className="px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[13px] font-semibold text-gray-900 leading-tight truncate">{campaign.name}</span>
            <div className="flex items-center gap-1.5">
              <Globe size={11} className="text-gray-400 shrink-0" />
              <span className="text-[11px] text-gray-500">{campaign.platform}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusChip status={campaign.status} />
            <div className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition cursor-pointer"
              >
                <MoreVertical size={13} className="text-gray-400" />
              </button>
              {menuOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30 min-w-[140px]">
                  <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                    <ExternalLink size={11} /> View Campaign
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition"
                    onClick={onDelete}
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Calendar size={11} className="shrink-0" />
          <span>{campaign.startDate} – {campaign.endDate}</span>
        </div>
        <div className="text-[11px] text-gray-400">
          {campaign.adShellCount} ad shell{campaign.adShellCount !== 1 ? "s" : ""}
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
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/30 backdrop-blur-[2px]" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] mx-4 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--brand-accent)/8] flex items-center justify-center">
            <Megaphone size={16} className="text-[var(--brand-accent)]" />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900">New Campaign</h3>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Campaign name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] transition"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Platform</label>
            <input
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              placeholder="e.g. Facebook, Google, Display…"
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] transition"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] transition" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">End date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] transition" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-[13px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
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
              adShellCount: 0,
            })}
            className="px-4 py-2 rounded-full text-[13px] font-semibold text-white bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover,#3b30a0)] transition cursor-pointer disabled:opacity-40"
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
  onNavigateTo,
}: {
  projectId: string;
  projectName: string;
  onNavigateTo: (page: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [query, setQuery]         = useState("");
  const [showNew, setShowNew]     = useState(false);

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  function addCampaign(data: Omit<Campaign, "id">) {
    setCampaigns(prev => [...prev, { ...data, id: `camp-${prev.length + 1}` }]);
    setShowNew(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Campaigns</h1>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Find campaigns…"
              className="pl-7 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
            />
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--brand-accent)] border border-[var(--brand-accent)/30] rounded-full px-3 py-1.5 hover:bg-[var(--brand-accent)/5] transition"
          >
            <Plus size={13} strokeWidth={2.5} />
            New Campaign
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {filtered.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-12 gap-3">
            <div className="text-gray-300">
              <Megaphone size={28} strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-400">
              {query ? "No campaigns match your search." : "No campaigns yet."}
            </p>
            {!query && (
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] border border-[var(--brand-accent)/30] rounded-full px-4 py-1.5 hover:bg-[var(--brand-accent)/5] transition"
              >
                <Plus size={13} strokeWidth={2.5} />
                New Campaign
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {filtered.map(c => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onDelete={() => setCampaigns(prev => prev.filter(x => x.id !== c.id))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-start px-6 py-3 bg-white border-t border-gray-100">
        <button
          onClick={() => onNavigateTo("adshells")}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] border border-[var(--brand-accent)/30] rounded-full px-4 py-1.5 hover:bg-[var(--brand-accent)/5] transition"
        >
          <ChevronLeft size={14} />
          Ad Shells
        </button>
      </div>

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
