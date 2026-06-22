"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../../../lib/utils";
import { OfferCard } from "../offers/OfferCard";
import type { Offer as OfferCardData } from "../offers/OfferCard";
import { offerLibrary } from "../lib/mock-data";
import { AgentAddSelect, ConfirmedChip, WhyThese } from "./AgentSelects";
import { ProactiveAutoApplyBar } from "./ProactiveWidgets";
import { AGENT_SCROLL_TO_SECTION_EVENT } from "../ProjectAgentPane";

interface OffersInput {
  offer_ids: string[];
  rationale: string;
}

interface ProjectContextPayload {
  projectId: string;
  projectName: string;
  oem: string;
  currentOfferIds: string[];
  currentTemplateIds: string[];
  availableOffers: {
    id: string; year: string; make: string; model: string; trim: string;
    offerType: string; monthlyPayment: number; term: number;
    pvi: number; aging: number; stock: number;
  }[];
  availableTemplates: {
    id: string; name: string; format: string; width: number; height: number; brand: string;
  }[];
  activeBrandOem?: string;
  taskOwners?: Record<string, string>;
}

type AgentActionPayload =
  | { action: "add_offers";       offerIds: string[]; editedOfferIds?: string[] }
  | { action: "remove_offers";    offerIds: string[] }
  | { action: "add_templates";    templateIds: string[] }
  | { action: "remove_templates"; templateIds: string[] }
  | { action: "set_project_name"; name: string }
  | { action: "create_project";   name: string; account: string; oem: string; startDate: string; endDate: string; owner?: string; platforms?: string[] }
  | { action: "set_brand";        oem: string }
  | { action: "add_backgrounds";  backgroundIds: string[] }
  | { action: "send_email";       recipient: string; message: string }
  | { action: "add_custom_offers"; offers: unknown[] }
  | { action: "edit_offer"; offerId: string; patches: Partial<{ monthlyPayment: number; term: number; totalDueAtSigning: number; offerType: string; trim: string; year: string; make: string; model: string }> }
  | { action: "set_task_owners"; owners: Record<string, string> };

// ─── Offers Proposal Card ──────────────────────────────────────────────────────
interface OffersCardProps {
  input: OffersInput;
  context: ProjectContextPayload | null;
  onApply: (offerIds: string[], editedOfferIds: string[]) => void;
  onDismiss: () => void;
  proactive?: boolean;
  dispatchAction?: (a: AgentActionPayload) => void;
}
export function OffersProposalCard({ input, context, onApply, onDismiss, proactive, dispatchAction }: OffersCardProps) {
  const [offerIds, setOfferIds] = useState<string[]>(input.offer_ids);
  const [applied,  setApplied]  = useState(false);
  const [customizeMode, setCustomizeMode] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, {
    monthlyPayment: number; term: number; totalDueAtSigning: number;
  }>>({});
  // Tracks which offers had "Apply" clicked — those switch to regular (non-recommendation) card
  const [appliedCustomizations, setAppliedCustomizations] = useState<Set<string>>(new Set());
  const offers = context?.availableOffers ?? [];
  const [manualMode, setManualMode] = useState(false);
  const autoApplyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize customization values from catalog when customize mode opens
  useEffect(() => {
    if (!customizeMode) return;
    setCustomizations(prev => {
      const next = { ...prev };
      for (const id of offerIds) {
        if (!next[id]) {
          const o = offers.find(x => x.id === id);
          const full = offerLibrary.find(x => x.id === id);
          next[id] = {
            monthlyPayment: o?.monthlyPayment ?? 0,
            term:           o?.term ?? 36,
            totalDueAtSigning: (full as any)?.totalDueAtSigning ?? 0,
          };
        }
      }
      return next;
    });
  }, [customizeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle field change with auto-recalculation of totalDueAtSigning
  const handleCustomChange = useCallback((id: string, key: string, value: number) => {
    setCustomizations(prev => {
      const o   = offers.find(x => x.id === id);
      const full = offerLibrary.find(x => x.id === id);
      const orig = {
        monthlyPayment:    o?.monthlyPayment    ?? 0,
        term:              o?.term              ?? 36,
        totalDueAtSigning: (full as any)?.totalDueAtSigning ?? 0,
      };
      const existing = prev[id] ?? orig;
      const updated  = { ...existing, [key]: value };
      // Auto-recalculate totalDueAtSigning proportionally when monthly or term changes
      if (key === 'monthlyPayment' || key === 'term') {
        const origRatio = orig.monthlyPayment * orig.term > 0
          ? orig.totalDueAtSigning / (orig.monthlyPayment * orig.term)
          : 0.22;
        updated.totalDueAtSigning = Math.round(updated.monthlyPayment * updated.term * origRatio);
      }
      return { ...prev, [id]: updated };
    });
  }, [offers]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!proactive || manualMode || applied) return;
    autoApplyRef.current = setTimeout(() => {
      setApplied(true);
      onApply(offerIds, [...appliedCustomizations]);
    }, 5000);
    return () => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); };
  }, [proactive, manualMode, applied]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-apply when every offer has had its individual "Apply" clicked — equivalent to "Apply All"
  useEffect(() => {
    if (!applied && offerIds.length > 0 && appliedCustomizations.size >= offerIds.length) {
      setApplied(true);
      onApply(offerIds, [...appliedCustomizations]);
    }
  }, [appliedCustomizations.size]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll the main panel to the offers section when this card appears
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(AGENT_SCROLL_TO_SECTION_EVENT, { detail: { section: "offers" } }));
  }, []);

  if (applied) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`${offerIds.length} offer${offerIds.length !== 1 ? "s" : ""} added`} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] flex flex-col gap-[8px]">
      {/* Rationale — free text, no outer box */}
      <div className="pl-[2px]">
        <p style={{ fontSize: 14, color: "var(--ink-secondary)", lineHeight: 1.6, letterSpacing: "0.17px" }}>{input.rationale}</p>
        <WhyThese content={
          <div style={{ fontSize: 11, color: "var(--brand-accent)", lineHeight: 1.6 }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>How I picked these</p>
            <p style={{ marginBottom: 4 }}>I rank every offer in your inventory on two signals:</p>
            <p style={{ marginBottom: 2 }}>• <strong>Aging</strong> — days each unit has been in stock. Older units get priority to move inventory.</p>
            <p style={{ marginBottom: 4 }}>• <strong>PVI (Performance Value Index)</strong> — projected return per vehicle at its current price. Higher is better.</p>
            <p>The offers with the best combined score for your brand made the cut.</p>
          </div>
        } />
      </div>
      {/* Offer cards list — capped so action buttons stay visible without scrolling */}
      <motion.div
        className="flex flex-col gap-[6px] max-h-[52vh] overflow-y-auto pr-[2px]"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
        initial="hidden"
        animate="show"
      >
        {offerIds.map((id) => {
          const o = offers.find(x => x.id === id);
          if (!o) return null;
          // Look up the full catalog entry to get the car image
          const fullOffer = offerLibrary.find(x => x.id === o.id);
          const custom = customizations[id];
          const cardData: OfferCardData = {
            id: o.id,
            year: o.year,
            make: o.make,
            model: o.model,
            trim: o.trim,
            image: (fullOffer as any)?.image ?? "",
            stock: o.stock,
            offerType: o.offerType,
            tags: (fullOffer as any)?.tags ?? [],
            pvi: o.pvi,
            aging: o.aging,
            sales: (fullOffer as any)?.sales ?? 0,
            inventory: (fullOffer as any)?.inventory ?? o.stock,
            monthlyPayment: custom?.monthlyPayment ?? o.monthlyPayment,
            term: custom?.term ?? o.term,
            totalDueAtSigning: custom?.totalDueAtSigning ?? (fullOffer as any)?.totalDueAtSigning ?? 0,
          };
          const isApplied = appliedCustomizations.has(id);
          return (
            <motion.div key={id}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } } }}
              onClick={() => !customizeMode && setCustomizeMode(true)}
              style={{ cursor: !customizeMode ? "pointer" : undefined }}
            >
              <OfferCard
                offer={cardData}
                variant={isApplied ? "regular" : "recommendation"}
                onDelete={() => setOfferIds(p => p.filter(x => x !== id))}
              />
              <AnimatePresence>
                {customizeMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-[4px] px-[12px] py-[10px] rounded-[10px] bg-[rgba(71,59,171,0.04)] border border-[rgba(71,59,171,0.12)] flex flex-wrap gap-x-[16px] gap-y-[8px] items-end"
                  >
                    {[
                      { key: "monthlyPayment",    label: "Monthly Payment ($)", val: custom?.monthlyPayment    ?? o.monthlyPayment },
                      { key: "term",              label: "Term (mo)",           val: custom?.term              ?? o.term           },
                      { key: "totalDueAtSigning", label: "Due at Signing ($)",  val: custom?.totalDueAtSigning ?? ((fullOffer as any)?.totalDueAtSigning ?? 0) },
                    ].map(({ key, label, val }) => (
                      <label key={key} style={{ fontSize: 11 }} className="flex flex-col gap-[3px] text-[var(--ink-secondary)]">
                        {label}
                        <input
                          type="number"
                          value={val}
                          onChange={e => handleCustomChange(id, key, Number(e.target.value))}
                          className="w-[90px] px-[8px] py-[4px] rounded-[6px] border border-[rgba(0,0,0,0.12)] text-[12px] text-[var(--ink)] bg-white outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)]"
                        />
                      </label>
                    ))}
                    <button
                      onClick={() => {
                        setAppliedCustomizations(prev => new Set([...prev, id]));
                        const c = customizations[id];
                        if (c && dispatchAction) {
                          dispatchAction({ action: "edit_offer", offerId: id, patches: c });
                        }
                      }}
                      className="px-[12px] py-[4px] rounded-full text-[12px] font-medium text-white cursor-pointer transition-all"
                      style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
                    >
                      Apply
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Add another + action buttons */}
      <div className="flex flex-col gap-[6px] mt-[2px]">
        <AgentAddSelect
          placeholder="Add another offer…"
          onAdd={v => setOfferIds(p => [...p, v])}
          options={offers
            .filter(o => !offerIds.includes(o.id))
            .map(o => ({ value: o.id, label: `${o.year} ${o.make} ${o.model} ${o.trim} — ${o.offerType} $${o.monthlyPayment}/mo` }))}
        />
        <div className="flex items-center gap-[8px]">
          <button onClick={() => { onApply(offerIds, [...appliedCustomizations]); setApplied(true); }}
            disabled={offerIds.length === 0}
            className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}>
            Add {offerIds.length} offer{offerIds.length !== 1 ? "s" : ""}
          </button>
          <button
            onClick={() => setCustomizeMode(m => !m)}
            className={cn("px-[14px] py-[8px] rounded-full text-[13px] font-medium border transition-colors cursor-pointer",
              customizeMode
                ? "bg-[rgba(71,59,171,0.08)] border-[rgba(71,59,171,0.3)] text-[var(--brand-accent)]"
                : "border-[rgba(0,0,0,0.12)] text-[var(--ink-secondary)] hover:bg-black/5"
            )}>
            {customizeMode ? "Done" : "Customize"}
          </button>
          <button onClick={onDismiss} className="px-[14px] py-[8px] rounded-full text-[13px] text-[var(--ink-secondary)] hover:bg-black/5 transition-colors cursor-pointer">
            Dismiss
          </button>
        </div>
      </div>
      {proactive && !manualMode && !applied && (
        <ProactiveAutoApplyBar delay={5000} onCancel={() => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); setManualMode(true); }} />
      )}
    </motion.div>
  );
}
