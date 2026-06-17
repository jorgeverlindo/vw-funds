
import { useState, useMemo } from "react";
import {
  Sparkles, BarChart2, Clock, Search, MoreVertical,
  ChevronRight, Trash2, LayoutGrid, Table2, Check, Info, MoreHorizontal
} from "lucide-react";
import { OfferCard } from "@projects/offers/OfferCard";
import { BrowseOffersDialog } from "@projects/offers/BrowseOffersDialog";
import { getProjectOffers, getProjectById, offerLibrary } from "@projects/lib/mock-data";
import { useProjectStore } from "@projects/lib/project-store";

type Offer = typeof offerLibrary[number];

export function OffersPage({ projectId, onNavigateTo }: { projectId: string; onNavigateTo: (page: string) => void }) {
  const id = projectId;
  const project = getProjectById(id);

  const { deletedOfferIds, deleteOffers, addedOfferIds, addOffers } = useProjectStore();

  // Base offers from mock-data + dynamically added ones
  const baseOffers = getProjectOffers(id);
  const extraOffers = useMemo(() => {
    const projectAddedIds = addedOfferIds[id] ?? [];
    return projectAddedIds
      .map((aid) => offerLibrary.find((o) => o.id === aid))
      .filter((o): o is Offer => !!o);
  }, [addedOfferIds, id]);

  const allOffers = useMemo(() => [...baseOffers, ...extraOffers], [baseOffers, extraOffers]);
  const offers = useMemo(() => allOffers.filter((o) => !deletedOfferIds.has(o.id)), [allOffers, deletedOfferIds]);

  // Current offer IDs in project (for the dialog to know what's already added)
  const existingOfferIds = useMemo(() => new Set(offers.map((o) => o.id)), [offers]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [browseOpen, setBrowseOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  function handleSelect(offerId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(offerId) : next.delete(offerId);
      return next;
    });
  }

  function handleSelectAll() {
    if (selected.size === offers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(offers.map((o) => o.id)));
    }
  }

  function handleDelete() {
    deleteOffers(Array.from(selected));
    setSelected(new Set());
  }

  function handleAddFromBrowse(ids: string[]) {
    addOffers(id, ids);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Offers</h1>
        <div className="flex items-center rounded-full border border-[var(--brand-accent)/20] bg-[var(--brand-accent)/8] px-3 py-1 gap-1.5 ml-1">
          <span className="text-xs font-medium text-[var(--brand-accent)]">Data Compliance</span>
        </div>
        <button className="ml-1 text-gray-400 hover:text-gray-600">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* CTA blocks */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          <CtaBlock
            icon={<Sparkles size={20} className="text-[var(--brand-accent)]/60" />}
            text="From inventory, incentives, and competitors"
            action="Get Recommendations"
            onClick={undefined}
          />
          <CtaBlock
            icon={<BarChart2 size={20} className="text-[var(--brand-accent)]/60" />}
            text="Regional, national and VIN-level offers"
            action="Browse All Offers"
            onClick={() => setBrowseOpen(true)}
          />
          <CtaBlock
            icon={<Clock size={20} className="text-[var(--brand-accent)]/60" />}
            text="Browse offers from the previous months"
            action="See Past Offers"
            onClick={undefined}
          />
        </div>

        {/* Recommendations section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Recommendations to get you started</h2>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Find below"
                  className="pl-7 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
                />
              </div>
              {/* Delete selected */}
              {selected.size > 0 && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 transition"
                >
                  <Trash2 size={13} />
                  Delete ({selected.size})
                </button>
              )}
              {/* Select all */}
              <button
                onClick={handleSelectAll}
                className="text-xs text-[var(--brand-accent)] font-medium hover:text-[var(--brand-accent-hover)]"
              >
                {selected.size === offers.length && offers.length > 0 ? "Deselect All" : "Select All"}
              </button>
              <span className="text-xs text-gray-400">{offers.length} offer{offers.length !== 1 ? "s" : ""}</span>

              {/* View mode toggle */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`w-7 h-7 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-[var(--brand-accent)] text-white" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                  title="Grid view"
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`w-7 h-7 flex items-center justify-center transition-colors ${viewMode === "table" ? "bg-[var(--brand-accent)] text-white" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                  title="Table view"
                >
                  <Table2 size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Offer cards grid / table */}
          {viewMode === "grid" ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 380px))" }}>
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  selected={selected.has(offer.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            <OfferTable
              offers={offers}
              selected={selected}
              onSelect={handleSelect}
            />
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex justify-end px-6 py-3 bg-white">
        <button
          onClick={() => onNavigateTo('templates')}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] border border-[var(--brand-accent)/30] rounded-full px-4 py-1.5 hover:bg-[var(--brand-accent)/5] transition"
        >
          Add Templates
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Browse All Offers dialog */}
      <BrowseOffersDialog
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        existingOfferIds={existingOfferIds}
        onAdd={handleAddFromBrowse}
      />
    </div>
  );
}

// ─── OfferTable ───────────────────────────────────────────────────────────────

type OfferRow = typeof offerLibrary[number];

const COLS: { key: string; label: string; align?: "right" }[] = [
  { key: "vehicle",        label: "Vehicle" },
  { key: "offerType",      label: "Type" },
  { key: "tags",           label: "Tags" },
  { key: "pvi",            label: "PVI",        align: "right" },
  { key: "aging",          label: "Aging",      align: "right" },
  { key: "sales",          label: "Sales",      align: "right" },
  { key: "inventory",      label: "Inventory",  align: "right" },
  { key: "monthlyPayment", label: "Monthly",    align: "right" },
  { key: "term",           label: "Term",       align: "right" },
  { key: "totalDue",       label: "Due at Signing", align: "right" },
];

function OfferTable({
  offers,
  selected,
  onSelect,
}: {
  offers: OfferRow[];
  selected: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
}) {
  const allSelected = offers.length > 0 && offers.every((o) => selected.has(o.id));
  const someSelected = offers.some((o) => selected.has(o.id)) && !allSelected;

  function handleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
    offers.forEach((o) => onSelect(o.id, e.target.checked));
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {/* Checkbox */}
            <th className="w-8 pl-4 pr-2 py-2.5">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={handleSelectAll}
                className="w-3.5 h-3.5 rounded accent-[#473bab] cursor-pointer"
              />
            </th>
            {/* Car image placeholder column */}
            <th className="w-12 px-2 py-2.5" />
            {COLS.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.align === "right" ? "text-right" : ""}`}
              >
                {col.label}
              </th>
            ))}
            {/* Actions */}
            <th className="w-8 pr-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {offers.map((offer, i) => {
            const isSelected = selected.has(offer.id);
            return (
              <tr
                key={offer.id}
                className={`border-b border-gray-100 last:border-0 transition-colors ${isSelected ? "bg-[var(--brand-accent)/5]" : i % 2 === 1 ? "bg-gray-50/40" : "bg-white"} hover:bg-[var(--brand-accent)/8]/40`}
              >
                {/* Checkbox */}
                <td className="pl-4 pr-2 py-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(offer.id, e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-[#473bab] cursor-pointer"
                  />
                </td>

                {/* Car thumbnail */}
                <td className="px-2 py-2">
                  <div className="relative w-12 h-8 shrink-0">
                    <img src={offer.image} alt={offer.model} className="absolute inset-0 w-full h-full object-contain drop-shadow-sm"  />
                  </div>
                </td>

                {/* Vehicle */}
                <td className="px-3 py-2.5 min-w-[200px]">
                  <p className="text-xs font-semibold text-gray-900 leading-snug">
                    {offer.year} {offer.make} {offer.model}
                  </p>
                  <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{offer.trim}</p>
                </td>

                {/* Offer type */}
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 bg-[var(--brand-accent)/8] text-[var(--brand-accent)] text-[11px] font-medium px-2 py-0.5 rounded-full">
                    <Check size={10} strokeWidth={2.5} />
                    {offer.offerType}
                  </span>
                </td>

                {/* Tags */}
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {offer.tags.map((tag) => (
                      <span key={tag} className="inline-block text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>

                {/* PVI */}
                <td className="px-3 py-2.5 text-right">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    {offer.pvi}
                  </span>
                </td>

                {/* Aging */}
                <td className="px-3 py-2.5 text-right">
                  <span className={`text-xs font-medium ${offer.aging >= 60 ? "text-red-600" : offer.aging >= 30 ? "text-amber-600" : "text-gray-700"}`}>
                    {offer.aging}d
                  </span>
                </td>

                {/* Sales */}
                <td className="px-3 py-2.5 text-right text-xs font-medium text-gray-700">
                  {offer.sales}
                </td>

                {/* Inventory */}
                <td className="px-3 py-2.5 text-right text-xs font-medium text-gray-700">
                  {offer.inventory}
                </td>

                {/* Monthly Payment */}
                <td className="px-3 py-2.5 text-right">
                  <p className="text-xs font-bold text-gray-900">${offer.monthlyPayment.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">/mo</p>
                </td>

                {/* Term */}
                <td className="px-3 py-2.5 text-right text-xs font-medium text-gray-700">
                  {offer.term} mo
                </td>

                {/* Total Due at Signing */}
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <p className="text-xs font-bold text-gray-900">${offer.totalDueAtSigning.toLocaleString()}</p>
                    <Info size={10} className="text-gray-300 shrink-0" />
                  </div>
                </td>

                {/* Row actions */}
                <td className="pr-3 py-2.5 text-right">
                  <button className="text-gray-300 hover:text-gray-500 transition-colors">
                    <MoreHorizontal size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CtaBlock({
  icon,
  text,
  action,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  action: string;
  onClick?: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-2">
        {icon}
        <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
      </div>
      <button
        onClick={onClick}
        className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white text-xs font-semibold py-2 px-3 rounded-full transition"
      >
        {action}
      </button>
    </div>
  );
}
