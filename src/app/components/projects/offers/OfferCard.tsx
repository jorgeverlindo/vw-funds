"use client";

import { useState } from "react";
import { MoreHorizontal, Info, Check, Trash2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "../../ui/dropdown-menu";

interface Offer {
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
}

interface OfferCardProps {
  offer: Offer;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  /** Called when "Remove from project" is chosen in the kebab menu */
  onDelete?: () => void;
}

export function OfferCard({ offer, selected = false, onSelect, onDelete }: OfferCardProps) {
  const fullName = `${offer.year} ${offer.make} ${offer.model} ${offer.trim}`;
  const [hovered, setHovered] = useState(false);

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

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 365,
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        background: hovered && !selected ? "#FAFAFA" : "#fff",
        boxShadow,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
      }}
    >
      {/* Top section */}
      <div style={{ padding: 12, display: "flex", gap: 12 }}>
        {/* Car image */}
        <div style={{ width: 90, height: 90, position: "relative", flexShrink: 0 }}>
          <img src={offer.image} alt={fullName} className="absolute inset-0 w-full h-full object-contain drop-shadow-sm"  />
        </div>

        {/* Right content */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect?.(offer.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: "#6356E1", flexShrink: 0, cursor: "pointer" }}
            />
            <span
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: 400,
                lineHeight: "143%",
                letterSpacing: "0.17px",
                color: "rgb(31,29,37)",
              }}
            >
              {fullName}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: "rgb(104,101,118)", flexShrink: 0, marginTop: 2, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                >
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="z-[300] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.12)] p-1 min-w-[180px] animate-in fade-in-0 zoom-in-95"
                align="end"
                sideOffset={4}
                onClick={(e) => e.stopPropagation()}
              >
                {onDelete && (
                  <DropdownMenuItem
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#D2323F] cursor-pointer outline-none focus:bg-red-50 data-[highlighted]:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  >
                    <Trash2 size={13} className="text-[#D2323F]" />
                    Remove from project
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stock */}
          <p
            style={{
              fontSize: 11,
              lineHeight: "166%",
              letterSpacing: "0.4px",
              color: "rgb(104,101,118)",
              margin: 0,
            }}
          >
            {offer.stock} in stock
          </p>

          {/* Metric chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <Chip label="Aging" value={offer.aging} />
            <Chip label="Sales" value={offer.sales} />
            <Chip label="Inventory" value={offer.inventory} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "0 12px" }} />

      {/* Bottom section */}
      <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Offer type chips */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(99,86,225,0.08)",
              color: "rgb(99,86,225)",
              fontSize: 11,
              lineHeight: "18px",
              letterSpacing: "0.16px",
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: 100,
            }}
          >
            <Check size={11} strokeWidth={2.5} />
            {offer.offerType}
          </span>
          {offer.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 11,
                lineHeight: "18px",
                letterSpacing: "0.16px",
                color: "rgb(104,101,118)",
                background: "rgba(104,101,118,0.08)",
                padding: "2px 8px",
                borderRadius: 100,
                fontWeight: 400,
              }}
            >
              {tag}
            </span>
          ))}
          <span
            style={{
              fontSize: 11,
              lineHeight: "18px",
              letterSpacing: "0.16px",
              color: "rgb(1,87,155)",
              background: "rgba(1,87,155,0.08)",
              padding: "2px 8px",
              borderRadius: 100,
              fontWeight: 400,
            }}
          >
            PVI: {offer.pvi}
          </span>
        </div>

        {/* Financial details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <FinancialCell label="Monthly Payment" value={`$${offer.monthlyPayment.toLocaleString()}`} />
          <FinancialCell label="Term" value={String(offer.term)} />
          <FinancialCell
            label="Total Due at Signing"
            value={`$${offer.totalDueAtSigning.toLocaleString()}`}
            infoIcon
          />
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        background: "rgba(1,87,155,0.08)",
        color: "rgb(1,87,155)",
        fontSize: 11,
        lineHeight: "18px",
        letterSpacing: "0.16px",
        fontWeight: 400,
        padding: "2px 8px",
        borderRadius: 100,
      }}
    >
      {label}: <strong style={{ fontWeight: 600 }}>{value}</strong>
    </span>
  );
}

function FinancialCell({ label, value, infoIcon }: { label: string; value: string; infoIcon?: boolean }) {
  return (
    <div>
      <p
        style={{
          fontSize: 10,
          lineHeight: "10px",
          color: "rgb(104,101,118)",
          margin: "0 0 4px 0",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        {label}
        {infoIcon && <Info size={10} color="rgb(184,182,192)" style={{ flexShrink: 0 }} />}
      </p>
      <p
        style={{
          fontSize: 12,
          lineHeight: "143%",
          letterSpacing: "0.17px",
          fontWeight: 700,
          color: "rgb(31,29,37)",
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}
