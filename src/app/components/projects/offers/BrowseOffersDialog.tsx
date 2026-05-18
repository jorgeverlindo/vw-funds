"use client";

import { useState, useMemo } from "react";

import { X, Search, Check, Info, MoreHorizontal } from "lucide-react";
import { offerLibrary } from "@projects/lib/mock-data";

type Offer = typeof offerLibrary[number];

interface BrowseOffersDialogProps {
  open: boolean;
  onClose: () => void;
  /** IDs of offers already in the project (base + previously added, excluding deleted) */
  existingOfferIds: Set<string>;
  onAdd: (ids: string[]) => void;
}

const MAKES = ["All", "BMW", "Mercedes-Benz", "Honda"];

export function BrowseOffersDialog({ open, onClose, existingOfferIds, onAdd }: BrowseOffersDialogProps) {
  const [search, setSearch] = useState("");
  const [makeFilter, setMakeFilter] = useState("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return offerLibrary.filter((o) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        o.make.toLowerCase().includes(q) ||
        o.model.toLowerCase().includes(q) ||
        o.trim.toLowerCase().includes(q) ||
        o.year.includes(q);
      const matchesMake = makeFilter === "All" || o.make === makeFilter;
      return matchesSearch && matchesMake;
    });
  }, [search, makeFilter]);

  function toggle(id: string) {
    if (existingOfferIds.has(id)) return; // already in project, can't re-add
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleAdd() {
    onAdd(Array.from(selected));
    setSelected(new Set());
    onClose();
  }

  function handleClose() {
    setSelected(new Set());
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl flex flex-col overflow-hidden"
        style={{ width: 860, maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Browse All Offers</h2>
            <p className="text-xs text-gray-400 mt-0.5">Select offers to add to this project</p>
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search offers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] w-52"
            />
          </div>

          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Make filter chips */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 shrink-0">
          {MAKES.map((make) => (
            <button
              key={make}
              onClick={() => setMakeFilter(make)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                makeFilter === make
                  ? "bg-[var(--brand-accent)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {make}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} offers</span>
        </div>

        {/* Offer grid */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No offers match your search.</p>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}>
              {filtered.map((offer) => {
                const alreadyAdded = existingOfferIds.has(offer.id);
                const isSelected = selected.has(offer.id);
                return (
                  <BrowseOfferCard
                    key={offer.id}
                    offer={offer}
                    alreadyAdded={alreadyAdded}
                    selected={isSelected}
                    onToggle={() => toggle(offer.id)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50">
          <span className="text-xs text-gray-500">
            {selected.size > 0 ? `${selected.size} offer${selected.size !== 1 ? "s" : ""} selected` : "No offers selected"}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-full hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selected.size === 0}
              className={`px-5 py-1.5 text-sm font-semibold rounded-full transition ${
                selected.size > 0
                  ? "bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent-hover)]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Add {selected.size > 0 ? `(${selected.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Compact offer card for the dialog ───────────────────────────────────────

function BrowseOfferCard({
  offer,
  alreadyAdded,
  selected,
  onToggle,
}: {
  offer: Offer;
  alreadyAdded: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const fullName = `${offer.year} ${offer.make} ${offer.model} ${offer.trim}`;

  return (
    <div
      onClick={alreadyAdded ? undefined : onToggle}
      style={{
        borderRadius: 12,
        border: `1px solid ${selected ? "#6356E1" : alreadyAdded ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.12)"}`,
        background: alreadyAdded ? "#fafafa" : "#fff",
        boxShadow: selected ? "0 2px 8px rgba(99,86,225,0.12)" : undefined,
        overflow: "hidden",
        cursor: alreadyAdded ? "default" : "pointer",
        opacity: alreadyAdded ? 0.6 : 1,
      }}
    >
      {/* Top section */}
      <div style={{ padding: 12, display: "flex", gap: 12 }}>
        {/* Car image */}
        <div style={{ width: 80, height: 80, position: "relative", flexShrink: 0 }}>
          <img src={offer.image} alt={fullName} className="absolute inset-0 w-full h-full object-contain drop-shadow-sm"  />
        </div>

        {/* Right content */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            {alreadyAdded ? (
              <span
                style={{
                  width: 16,
                  height: 16,
                  marginTop: 2,
                  flexShrink: 0,
                  borderRadius: 4,
                  background: "#e0e7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={10} color="#6356E1" strokeWidth={3} />
              </span>
            ) : (
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggle}
                onClick={(e) => e.stopPropagation()}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: "#6356E1", flexShrink: 0, cursor: "pointer" }}
              />
            )}
            <span style={{ flex: 1, fontSize: 12, fontWeight: 400, lineHeight: "143%", letterSpacing: "0.17px", color: "rgb(31,29,37)" }}>
              {fullName}
            </span>
            {alreadyAdded && (
              <span style={{ fontSize: 10, color: "#6356E1", fontWeight: 500, flexShrink: 0, marginTop: 3 }}>
                Added
              </span>
            )}
          </div>

          {/* Stock */}
          <p style={{ fontSize: 11, lineHeight: "166%", letterSpacing: "0.4px", color: "rgb(104,101,118)", margin: 0 }}>
            {offer.stock} in stock
          </p>

          {/* Metric chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <MiniChip label="Aging" value={offer.aging} />
            <MiniChip label="Sales" value={offer.sales} />
            <MiniChip label="Inv" value={offer.inventory} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "0 12px" }} />

      {/* Bottom section */}
      <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <TagChip label={offer.offerType} color="indigo" />
          {offer.tags.map((t) => <TagChip key={t} label={t} color="gray" />)}
          <TagChip label={`PVI: ${offer.pvi}`} color="blue" />
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <FinCell label="Monthly" value={`$${offer.monthlyPayment.toLocaleString()}`} />
          <FinCell label="Term" value={`${offer.term}mo`} />
          <FinCell label="Due at Signing" value={offer.totalDueAtSigning === 0 ? "—" : `$${offer.totalDueAtSigning.toLocaleString()}`} />
        </div>
      </div>
    </div>
  );
}

function MiniChip({ label, value }: { label: string; value: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, background: "rgba(1,87,155,0.08)", color: "rgb(1,87,155)", fontSize: 10, fontWeight: 400, padding: "1px 6px", borderRadius: 100, letterSpacing: "0.16px" }}>
      {label}: <strong style={{ fontWeight: 600 }}>{value}</strong>
    </span>
  );
}

function TagChip({ label, color }: { label: string; color: "indigo" | "gray" | "blue" }) {
  const styles = {
    indigo: { background: "rgba(99,86,225,0.08)", color: "rgb(99,86,225)" },
    gray: { background: "rgba(104,101,118,0.08)", color: "rgb(104,101,118)" },
    blue: { background: "rgba(1,87,155,0.08)", color: "rgb(1,87,155)" },
  }[color];
  return (
    <span style={{ ...styles, fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 100 }}>{label}</span>
  );
}

function FinCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <p style={{ fontSize: 9, color: "rgb(104,101,118)", margin: "0 0 2px 0" }}>{label}</p>
      <p style={{ fontSize: 11, fontWeight: 700, color: "rgb(31,29,37)", margin: 0 }}>{value}</p>
    </div>
  );
}
