"use client";

import { useState } from "react";
import { MoreVertical, Info, Trash2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "../../ui/dropdown-menu";
import { useComments } from "@comments";

export interface Offer {
  id: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  image: string;
  stock: number;
  offerType: string;
  tags: string[];
  pvi: number;
  aging: number;
  sales: number;
  inventory: number;
  monthlyPayment: number;
  term: number;
  totalDueAtSigning: number;
  /** Optional VIN — shown as subtitle in "regular" variant */
  vin?: string;
}

interface OfferCardProps {
  offer: Offer;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  /** Called when "Remove from project" is chosen in the kebab menu */
  onDelete?: () => void;
  /**
   * "recommendation" — catalog offer with PVI / aging / sales / inventory metrics (default when pvi > 0)
   * "regular"        — custom / client-submitted offer; no scoring metrics shown
   * If omitted the variant is inferred: custom- prefix or pvi === 0 → regular.
   */
  variant?: "recommendation" | "regular";
  className?: string;
}

/** Infer variant from offer data when not explicitly provided */
function resolveVariant(offer: Offer, explicit?: "recommendation" | "regular"): "recommendation" | "regular" {
  if (explicit) return explicit;
  if (offer.id.startsWith("custom-") || offer.pvi === 0) return "regular";
  return "recommendation";
}

export function OfferCard({ offer, selected = false, onSelect, onDelete, variant: variantProp, className }: OfferCardProps) {
  const variant = resolveVariant(offer, variantProp);
  const fullName = `${offer.year} ${offer.make} ${offer.model} ${offer.trim}`;
  const [hovered, setHovered] = useState(false);
  const commentsCtx = useComments();

  const borderColor = selected
    ? "#6356E1"
    : hovered
    ? "rgba(99,86,225,0.35)"
    : "rgba(0,0,0,0.12)";

  const boxShadow = selected
    ? "0 2px 8px rgba(99,86,225,0.14)"
    : hovered
    ? "0 4px 12px rgba(0,0,0,0.10)"
    : undefined;

  // Filter out the internal "Custom" tag from the visible chips
  const visibleTags = offer.tags.filter(t => t !== "Custom");

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        background: hovered && !selected ? "#FAFAFA" : "#fff",
        boxShadow,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
        width: "100%",
      }}
    >
      {/* ── Top section ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "10px 12px 10px 0", display: "flex", gap: 0 }}>

        {/* Car image block — includes checkbox overlay */}
        <div style={{ width: 90, minHeight: 80, position: "relative", flexShrink: 0 }}>
          {/* Checkbox — top-left corner, MUI-style */}
          {onSelect && (
            <div
              style={{ position: "absolute", top: 0, left: 0, zIndex: 2, padding: "6px 6px 0 6px" }}
              onClick={e => e.stopPropagation()}
            >
              <MuiCheckbox
                checked={selected}
                onChange={checked => onSelect(offer.id, checked)}
              />
            </div>
          )}

          {/* Vehicle image */}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            {offer.image ? (
              <img
                src={offer.image}
                alt={fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center bottom" }}
              />
            ) : (
              <img
                src="https://res.cloudinary.com/dvq75cqna/image/upload/v1780071654/vw-funds/public/car-silhouette.png"
                alt="vehicle"
                style={{ width: 69, height: 69, objectFit: "contain", opacity: 0.72 }}
              />
            )}
          </div>
        </div>

        {/* Right content */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2, paddingLeft: 10 }}>
          {/* Title + kebab row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 4, paddingRight: 0 }}>
            <span style={{
              flex: 1,
              fontSize: 12,
              fontWeight: 400,
              lineHeight: "143%",
              letterSpacing: "0.17px",
              color: "rgb(31,29,37)",
              paddingRight: 4,
            }}>
              {fullName}
            </span>
            {/* Comment button — only shown when CommentsProvider is present */}
            {commentsCtx && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  commentsCtx.openPanelForEntity({ id: offer.id, label: fullName, type: "offer" });
                }}
                title="Comment on this offer"
                style={{ color: "rgba(104,101,118,0.7)", flexShrink: 0, background: "none", border: "none", padding: "2px", cursor: "pointer", borderRadius: 4, display: "flex", alignItems: "center" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={e => e.stopPropagation()}
                  style={{ color: "rgba(104,101,118,0.7)", flexShrink: 0, background: "none", border: "none", padding: "2px", cursor: "pointer", borderRadius: 4 }}
                >
                  <MoreVertical size={15} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="z-[300] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.12)] p-1 min-w-[180px] animate-in fade-in-0 zoom-in-95"
                align="end"
                sideOffset={4}
                onClick={e => e.stopPropagation()}
              >
                {onDelete && (
                  <DropdownMenuItem
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#D2323F] cursor-pointer outline-none focus:bg-red-50 data-[highlighted]:bg-red-50"
                    onClick={e => { e.stopPropagation(); onDelete(); }}
                  >
                    <Trash2 size={13} className="text-[#D2323F]" />
                    Remove from project
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Subtitle: stock (recommendation) or VIN (regular) */}
          <p style={{
            fontSize: 11, lineHeight: "166%", letterSpacing: "0.4px",
            color: "rgb(104,101,118)", margin: 0, }}>
            {variant === "recommendation"
              ? `${offer.stock} in stock`
              : offer.vin ?? (offer.stock > 1 ? `${offer.stock} in stock` : null)
            }
          </p>

          {/* Metric chips — Recommendation only */}
          {variant === "recommendation" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
              {offer.aging  > 0 && <MetricChip label="Aging"     value={offer.aging} />}
              {offer.sales  > 0 && <MetricChip label="Sales"     value={offer.sales} />}
              {offer.inventory > 0 && <MetricChip label="Inventory" value={offer.inventory} />}
            </div>
          )}
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "0 8px" }} />

      {/* ── Bottom section ───────────────────────────────────────────────────── */}
      <div style={{ padding: "6px 8px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Offer type + tags chips */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
          {/* Offer type chip */}
          <OfferTypeChip label={offer.offerType} />

          {/* Tags */}
          {visibleTags.map(tag => (
            <TagChip key={tag} label={tag} />
          ))}

          {/* PVI badge — Recommendation only */}
          {variant === "recommendation" && offer.pvi > 0 && (
            <PviChip value={offer.pvi} />
          )}
        </div>

        {/* Financial details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <FinancialCell label="Monthly Payment" value={`$${offer.monthlyPayment.toLocaleString()}`} />
          <FinancialCell label="Term" value={String(offer.term)} />
          <FinancialCell
            label="Total Due at Signing"
            value={offer.totalDueAtSigning > 0 ? `$${offer.totalDueAtSigning.toLocaleString()}` : "—"}
            infoIcon
          />
        </div>
      </div>
    </div>
  );
}

// ─── MUI-style small Checkbox ─────────────────────────────────────────────────

function MuiCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 16, height: 16, borderRadius: 2, cursor: "pointer",
        border: checked ? "none" : "1.5px solid rgba(0,0,0,0.38)",
        background: checked ? "#6356E1" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "background 0.1s, border 0.1s",
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5L3.9 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ─── Chip sub-components ──────────────────────────────────────────────────────

function OfferTypeChip({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "rgba(99,86,225,0.10)", color: "#6356E1",
      fontSize: 11, lineHeight: "18px", letterSpacing: "0.16px", fontWeight: 500,
      padding: "1px 6px 1px 4px", borderRadius: 8,
      }}>
      {/* checkmark icon */}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
        <path d="M2 6.5L4.5 9L10 3" stroke="#6356E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 11, lineHeight: "18px", letterSpacing: "0.16px",
      color: "rgb(104,101,118)",
      background: "rgba(240,242,244,1)",
      padding: "1px 6px", borderRadius: 8, fontWeight: 400,
      }}>
      {label}
    </span>
  );
}

function PviChip({ value }: { value: number }) {
  return (
    <span style={{
      fontSize: 11, lineHeight: "18px", letterSpacing: "0.16px",
      color: "#01579b", background: "rgba(2,136,209,0.08)",
      padding: "1px 6px", borderRadius: 8, fontWeight: 400,
      }}>
      PVI: <strong style={{ fontWeight: 600 }}>{value}</strong>
    </span>
  );
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 2,
      background: "rgba(2,136,209,0.08)", color: "#01579b",
      fontSize: 11, lineHeight: "18px", letterSpacing: "0.16px", fontWeight: 400,
      padding: "1px 6px", borderRadius: 8,
      }}>
      {label}: <strong style={{ fontWeight: 600 }}>{value}</strong>
    </span>
  );
}

function FinancialCell({ label, value, infoIcon }: { label: string; value: string; infoIcon?: boolean }) {
  return (
    <div>
      <p style={{
        fontSize: 10, lineHeight: "10px", color: "rgb(104,101,118)",
        margin: "0 0 3px 0", display: "flex", alignItems: "center", gap: 2,
        }}>
        {label}
        {infoIcon && <Info size={10} color="rgb(184,182,192)" style={{ flexShrink: 0 }} />}
      </p>
      <p style={{
        fontSize: 12, lineHeight: "143%", letterSpacing: "0.17px",
        fontWeight: 600, color: "rgb(31,29,37)", margin: 0,
        }}>
        {value}
      </p>
    </div>
  );
}
