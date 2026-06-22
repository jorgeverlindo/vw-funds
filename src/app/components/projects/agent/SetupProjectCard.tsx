"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { motion } from "motion/react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "../../ui/dropdown-menu";
import { AvatarInitials } from "../../ui/AvatarInitials";
import { PROJECT_OWNERS, PLATFORM_OPTIONS } from "../CreateProjectDialog";
import { ChannelChip } from "../../ui/ChannelChip";
import { AgentSelect } from "./AgentSelects";
import { ConfirmedChip } from "./AgentSelects";
import { ProactiveAutoApplyBar } from "./ProactiveWidgets";
import { deduplicateName } from "./utils";

// ─── Shared constants (mirrors ProjectsModule) ────────────────────────────────
const AVAILABLE_ACCOUNTS = ["Honda of Anywhere", "BMW Seattle", "Spiriva Pharma", "Multiple Brands Inc.", "Honda City"];
const AVAILABLE_BRANDS   = ["Honda", "BMW", "Spiriva", "Volkswagen", "Audi", "General"];

interface SetupInput {
  project_name: string;
  account?: string;
  oem: string;
  start_date: string;
  end_date: string;
  /** Enum set by the agent based on user intent — drives continuation messages */
  flow_scope?: "full" | "offers_only" | "templates_only" | "offers_and_templates" | "templates_and_email" | "offers_and_email";
  /** Legacy field — kept for backward compat with old sessions */
  flow_steps?: string[];
  owner?: string;
  platforms?: string[];
}

// ─── Setup Project Card ────────────────────────────────────────────────────────
export interface SetupProjectCardProps {
  input: SetupInput;
  existingNames?: string[];
  onApply: (name: string, account: string, oem: string, startDate: string, endDate: string, owner: string, platforms: string[]) => void;
  onDismiss: () => void;
  proactive?: boolean;
}
export function SetupProjectCard({ input, existingNames = [], onApply, onDismiss, proactive }: SetupProjectCardProps) {
  const dedupedName = deduplicateName(input.project_name, existingNames);
  const [name,      setName]      = useState(dedupedName);
  const [account,   setAccount]   = useState(input.account ?? "");
  const [oem,       setOem]       = useState(input.oem);
  const [startDate, setStartDate] = useState(input.start_date);
  const [endDate,   setEndDate]   = useState(input.end_date);
  const [ownerId,   setOwnerId]   = useState(input.owner ? (PROJECT_OWNERS.find(o => o.name === input.owner)?.id ?? "jorge-verlindo") : "jorge-verlindo");
  // Normalize agent-supplied platform strings (labels or IDs) → PLATFORM_OPTIONS ids
  const normalizePlatformIds = (raw: string[]): string[] =>
    raw.flatMap(val => {
      if (PLATFORM_OPTIONS.some(p => p.id === val)) return [val]; // already a valid ID
      const lower = val.toLowerCase().replace(/[-\s]/g, "");
      const match = PLATFORM_OPTIONS.find(p =>
        p.id.replace(/-/g, "") === lower ||
        p.label.toLowerCase().replace(/[-\s]/g, "") === lower
      );
      return match ? [match.id] : [];
    });
  const [platforms, setPlatforms] = useState<string[]>(normalizePlatformIds(input.platforms ?? []));
  const [applied,         setApplied]         = useState(false);
  const [nameError,       setNameError]       = useState("");
  const [startDateError,  setStartDateError]  = useState("");
  const [endDateError,    setEndDateError]    = useState("");
  const wasDeduplicated = dedupedName !== input.project_name;
  const [manualMode, setManualMode] = useState(false);
  const autoApplyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Proactive auto-apply
  useEffect(() => {
    if (!proactive || manualMode || applied) return;
    const owner = PROJECT_OWNERS.find(o => o.id === ownerId);
    autoApplyRef.current = setTimeout(() => {
      setApplied(true);
      onApply(name, account, oem, startDate, endDate, owner?.name ?? "", platforms);
    }, 5000);
    return () => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); };
  }, [proactive, manualMode, applied]); // eslint-disable-line react-hooks/exhaustive-deps

  if (applied) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`Project "${name}" created`} />
      </div>
    );
  }

  const inputCls = "w-full px-[10px] py-[7px] rounded-[8px] text-[12px] text-[var(--ink)] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)] transition-all";
  const labelCls = "text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-tertiary)] mb-[4px]";

  const menuCls = "z-[500] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.1)] p-1 animate-in fade-in-0 zoom-in-95 min-w-[var(--radix-dropdown-menu-trigger-width)]";
  const itemCls = "flex items-center gap-2 px-[10px] py-[6px] rounded-lg text-[12px] text-[var(--ink)] cursor-pointer outline-none select-none data-[highlighted]:bg-[#f5f4f8]";

  const selectedOwner = PROJECT_OWNERS.find(o => o.id === ownerId);
  const togglePlatform = (p: string) =>
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-white overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa] flex items-center gap-[6px]">
        <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--brand-accent), var(--brand-mid))" }}>
          <Plus size={9} color="white" strokeWidth={3} />
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--brand-accent)", letterSpacing: "0.3px" }}>
          New project setup
        </span>
      </div>

      <div className="flex flex-col gap-[10px] px-[14px] py-[12px]">
        {/* Name */}
        <div>
          <p className={labelCls}>Project name</p>
          <input type="text" value={name} onChange={e => { setName(e.target.value); setNameError(""); }}
            onFocus={e => e.target.select()}
            placeholder="e.g. Honda Summer Lease Event"
            className={inputCls} />
          {nameError ? (
            <p className="mt-[4px]" style={{ fontSize: 10, color: "var(--danger)" }}>{nameError}</p>
          ) : (
            <p className="mt-[4px]" style={{ fontSize: 10, color: "var(--ink-tertiary)", fontStyle: "italic" }}>
              {wasDeduplicated
                ? `"${input.project_name}" already exists — adjusted to avoid a collision. Edit to customise.`
                : "Suggested name — edit to customise."}
            </p>
          )}
        </div>

        {/* Account + Brand row */}
        <div className="flex gap-[8px]">
          <div className="flex-1">
            <p className={labelCls}>Account</p>
            <AgentSelect
              value={account} onChange={setAccount}
              placeholder="Select account"
              options={AVAILABLE_ACCOUNTS.map(a => ({ value: a, label: a }))}
            />
          </div>
          <div className="flex-1">
            <p className={labelCls}>Brand</p>
            <AgentSelect
              value={oem} onChange={setOem}
              options={AVAILABLE_BRANDS.map(b => ({ value: b, label: b }))}
            />
          </div>
        </div>

        {/* Owner */}
        <div>
          <p className={labelCls}>Owner</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center gap-[8px] px-[10px] py-[7px] rounded-[8px] text-[12px] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none transition-all hover:border-[#b0b0b5] focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)] cursor-pointer text-left"
              >
                {selectedOwner ? (
                  <>
                    <AvatarInitials initials={selectedOwner.initials} size={18} bgColor={selectedOwner.color} />
                    <span className="flex-1 text-[var(--ink)] truncate">{selectedOwner.name}</span>
                  </>
                ) : (
                  <span className="flex-1 text-[var(--ink-tertiary)]">Select owner</span>
                )}
                <ChevronDown size={10} className="shrink-0 text-[var(--ink-tertiary)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={menuCls + " max-h-[240px] overflow-y-auto"} sideOffset={4} align="start">
              {PROJECT_OWNERS.map(owner => (
                <DropdownMenuItem key={owner.id} className={itemCls} onClick={() => setOwnerId(owner.id)}>
                  <AvatarInitials initials={owner.initials} size={20} bgColor={owner.color} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 12 }}>{owner.name}</p>
                    <p style={{ fontSize: 10, color: "var(--ink-tertiary)" }} className="truncate">{owner.email}</p>
                  </div>
                  {owner.id === ownerId && <Check size={11} strokeWidth={2.5} className="text-[var(--brand-accent)] shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Dates row */}
        <div className="flex gap-[8px]">
          <div className="flex-1">
            <p className={labelCls}>Start date</p>
            <input type="text" value={startDate}
              onChange={e => { setStartDate(e.target.value); setStartDateError(""); }}
              className={inputCls + (startDateError ? " border-[var(--danger)]!" : "")} placeholder="Jun 1, 2026" />
            {startDateError && (
              <p className="mt-[4px]" style={{ fontSize: 10, color: "var(--danger)" }}>{startDateError}</p>
            )}
          </div>
          <div className="flex-1">
            <p className={labelCls}>End date</p>
            <input type="text" value={endDate}
              onChange={e => { setEndDate(e.target.value); setEndDateError(""); }}
              className={inputCls + (endDateError ? " border-[var(--danger)]!" : "")} placeholder="Jun 30, 2026" />
            {endDateError && (
              <p className="mt-[4px]" style={{ fontSize: 10, color: "var(--danger)" }}>{endDateError}</p>
            )}
          </div>
        </div>

        {/* Platforms */}
        <div>
          <p className={labelCls}>Platforms</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex flex-wrap items-center gap-[4px] min-h-[34px] px-[8px] py-[5px] rounded-[8px] text-[12px] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none transition-all hover:border-[#b0b0b5] focus:border-[var(--brand-accent)] cursor-pointer text-left"
              >
                {platforms.length === 0 ? (
                  <span className="flex-1 text-[var(--ink-tertiary)]">Select platforms</span>
                ) : (
                  <div className="flex flex-wrap gap-[3px] flex-1 min-w-0">
                    {platforms.map(id => {
                      const p = PLATFORM_OPTIONS.find(o => o.id === id);
                      if (!p) return null;
                      return (
                        <ChannelChip
                          key={id}
                          label={p.label}
                          icon={p.icon}
                          onRemove={() => togglePlatform(id)}
                        />
                      );
                    })}
                  </div>
                )}
                <ChevronDown size={10} className="shrink-0 text-[var(--ink-tertiary)] ml-auto self-center" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={menuCls} sideOffset={4} align="start">
              {PLATFORM_OPTIONS.map(p => {
                const active = platforms.includes(p.id);
                return (
                  <DropdownMenuItem
                    key={p.id}
                    className={itemCls}
                    onSelect={e => { e.preventDefault(); togglePlatform(p.id); }}
                  >
                    <span
                      className="w-[14px] h-[14px] rounded-[3px] border flex items-center justify-center shrink-0 transition-all"
                      style={{ background: active ? "var(--brand-accent)" : "white", borderColor: active ? "var(--brand-accent)" : "rgba(0,0,0,0.2)" }}
                    >
                      {active && <Check size={9} strokeWidth={3} color="white" />}
                    </span>
                    <img src={p.icon} alt="" className="w-[12px] h-[12px] shrink-0 object-contain" />
                    <span>{p.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-[8px] pt-[2px]">
          <button
            onClick={() => {
              const norm = (s: string) => s.trim().toLowerCase();
              let hasError = false;
              if ((existingNames ?? []).some(n => norm(n) === norm(name))) {
                setNameError("Already exists — choose a different name");
                hasError = true;
              } else {
                setNameError("");
              }
              if (!startDate.trim()) {
                setStartDateError("Start date is required");
                hasError = true;
              } else {
                setStartDateError("");
              }
              if (!endDate.trim()) {
                setEndDateError("End date is required");
                hasError = true;
              } else {
                setEndDateError("");
              }
              if (hasError) return;
              const ownerName = PROJECT_OWNERS.find(o => o.id === ownerId)?.name ?? "Jorge Verlindo";
              onApply(name, account, oem, startDate, endDate, ownerName, platforms);
              setApplied(true);
            }}
            disabled={!name.trim()}
            className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
          >
            Create project
          </button>
          <button onClick={onDismiss}
            className="px-[14px] py-[8px] rounded-full text-[13px] text-[var(--ink-secondary)] hover:bg-black/5 transition-colors cursor-pointer">
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
