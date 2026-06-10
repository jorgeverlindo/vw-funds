"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ConfirmedChip } from "./AgentSelects";
import { ConstellationArcMark, useConstellationAnim } from "./ConstellationArcMark";

// ─── Proactive Auto-Apply Progress Bar ───────────────────────────────────────
// Matches Figma "Auto-apply-Loader" component exactly:
//   Top: Loader Accordion — arc mark (24px brand) + caption (11px ink2) + chevron-down
//        Steps list (paddingLeft 21) — 2× circle-check rows + 1× dot row (10px ink2)
//   Bottom: "Applying automatically…" (11px ink2) + "Edit Manually" button (13px brand Medium)
//           <Progress> Linear — 4px track (white), fill brand purple at {progress}%

const STEPS = [
  { type: "check" as const, label: "Ranking by priority and ROI" },
  { type: "check" as const, label: "Scoring aging and Turn Rate" },
  { type: "dot"   as const, label: "Formatting report output" },
];

export function ProactiveAutoApplyBar({ delay, onCancel }: { delay: number; onCancel: () => void }) {
  const [progress, setProgress] = useState(0);
  const [stepsOpen, setStepsOpen] = useState(false); // accordion closed by default
  const startRef = useRef(Date.now());
  const arcs = useConstellationAnim(true); // animate arc mark while running

  useEffect(() => {
    startRef.current = Date.now();
    let rafId: number;
    const tick = () => {
      const p = Math.min((Date.now() - startRef.current) / delay * 100, 100);
      setProgress(p);
      if (p < 100) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [delay]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>

      {/* ── Loader Accordion — closed by default, toggle to open ──────── */}
      <div style={{ paddingTop: 10, paddingBottom: 10, display: "flex", flexDirection: "column", gap: 4 }}>

        {/* Header row — ConstellationArcMark + label + chevron toggle */}
        <button
          onClick={() => setStepsOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", gap: 0, cursor: "pointer", width: "100%" }}
          className="hover:opacity-75 transition-opacity"
        >
          {/* Existing ConstellationArcMark — 24px, animated */}
          <div style={{ width: 24, height: 24, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ConstellationArcMark arcs={arcs} size={24} />
          </div>
          {/* Caption — 11px, rgb(104,101,118), ls 0.4px, lh 166% */}
          <span style={{ flex: 1, textAlign: "left", fontSize: 11, color: "rgb(104,101,118)", letterSpacing: "0.4px", lineHeight: "166%" }}>
            Applying your selections…
          </span>
          {/* Chevron — rotates when open */}
          <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <motion.svg
              width="8" height="5" viewBox="0 0 8 5" fill="none"
              animate={{ rotate: stepsOpen ? 180 : 0 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <path d="M1 1l3 3 3-3" stroke="rgba(17,16,20,0.56)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          </div>
        </button>

        {/* Steps list — collapsed by default, paddingLeft 21, gap 3 */}
        <AnimatePresence initial={false}>
          {stepsOpen && (
            <motion.div
              key="steps"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ paddingLeft: 21, display: "flex", flexDirection: "column", gap: 3 }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, height: s.type === "dot" ? 10 : 16 }}>
                    {s.type === "check" ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="8" cy="8" r="6" stroke="#6356e1" strokeWidth="1"/>
                        <path d="M5.5 8l1.5 1.5L10.5 6" stroke="#6356e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6356e1", flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 10, color: "rgb(104,101,118)", lineHeight: "10px" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Loader footer — paddingLeft 7, gap 10 ──────────────────────── */}
      <div style={{ paddingLeft: 7, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "rgb(104,101,118)", letterSpacing: "0.4px", lineHeight: "166%" }}>
            Applying automatically…
          </span>
          <button
            onClick={onCancel}
            style={{ fontSize: 13, fontWeight: 500, color: "#473BAB", letterSpacing: "0.46px", lineHeight: "22px", cursor: "pointer" }}
            className="hover:opacity-75 transition-opacity"
          >
            Edit Manually
          </button>
        </div>
        {/* <Progress> Linear — 4px, white track, solid brand fill */}
        <div style={{ height: 4, background: "white", borderRadius: 2, overflow: "hidden", width: "100%" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#473BAB", borderRadius: 2, transition: "none" }} />
        </div>
      </div>

    </div>
  );
}

// ─── Proactive Questions Card ─────────────────────────────────────────────────
const PROACTIVE_OPTIONS = {
  goal:       ["Brand Awareness", "Conquest", "Retention", "Service Drive"] as const,
  timeline:   ["Weekend Event", "Month-long", "Seasonal", "Flexible"] as const,
  offerFocus: ["Lease-heavy", "Finance-heavy", "Mixed", "No preference"] as const,
};

interface ProactiveQuestionsInput {
  intro_line?: string;
}

function ChipRow({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
      <div className="flex flex-wrap gap-[6px]">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)} style={{ fontSize: 11.5 }}
            className={["px-[10px] py-[5px] rounded-full border font-medium transition-all cursor-pointer",
              value === opt ? "bg-[var(--brand-accent)] border-[var(--brand-accent)] text-white" : "bg-white border-[rgba(0,0,0,0.12)] text-[var(--ink-secondary)] hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
            ].join(" ")}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProactiveQuestionsCard({
  input, applied, onSubmit,
}: {
  input: ProactiveQuestionsInput;
  applied: boolean;
  onSubmit: (goal: string, timeline: string, offerFocus: string) => void;
}) {

  const [goal,       setGoal]       = useState<string | null>(null);
  const [timeline,   setTimeline]   = useState<string | null>(null);
  const [offerFocus, setOfferFocus] = useState<string | null>(null);

  if (applied) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label="Proactive build started" />
      </div>
    );
  }

  const canStart = goal !== null && timeline !== null && offerFocus !== null;
  const introLine = input.intro_line ?? "I've reviewed your catalog and team data — let me ask three quick questions to guide my selections.";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-white overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#f8f7ff] flex items-center gap-[6px]">
        <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--brand-accent), var(--brand-mid))" }}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 1v7M1 4.5h7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--brand-accent)", letterSpacing: "0.3px" }}>Proactive Campaign Build</span>
      </div>
      <div className="flex flex-col gap-[14px] px-[14px] py-[12px]">
        <p style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: 1.5 }}>{introLine}</p>
        <ChipRow label="Campaign goal" options={PROACTIVE_OPTIONS.goal} value={goal} onChange={setGoal} />
        <ChipRow label="Timeline" options={PROACTIVE_OPTIONS.timeline} value={timeline} onChange={setTimeline} />
        <ChipRow label="Offer focus" options={PROACTIVE_OPTIONS.offerFocus} value={offerFocus} onChange={setOfferFocus} />
      </div>
      <div className="px-[14px] pb-[12px] flex justify-end">
        <button onClick={() => { if (canStart) onSubmit(goal!, timeline!, offerFocus!); }} disabled={!canStart}
          className="px-[16px] py-[8px] rounded-full text-white text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}>
          Start Proactive Build →
        </button>
      </div>
    </motion.div>
  );
}
