"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { ConfirmedChip } from "./AgentSelects";

// ─── Proactive Auto-Apply Progress Bar ───────────────────────────────────────
export function ProactiveAutoApplyBar({ delay, onCancel }: { delay: number; onCancel: () => void }) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());

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
    <div className="px-[14px] py-[8px] border-t border-[rgba(71,59,171,0.1)] bg-[#f8f7ff]">
      <div className="flex items-center justify-between mb-[5px]">
        <span style={{ fontSize: 10, color: "var(--ink-secondary)" }}>Applying automatically…</span>
        <button onClick={onCancel} style={{ fontSize: 10, color: "var(--brand-accent)", fontWeight: 500 }} className="cursor-pointer hover:text-[var(--brand-mid)] transition-colors">
          Edit manually
        </button>
      </div>
      <div className="h-[3px] bg-[rgba(71,59,171,0.12)] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--brand-accent), var(--brand-mid))", transition: "none" }} />
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
