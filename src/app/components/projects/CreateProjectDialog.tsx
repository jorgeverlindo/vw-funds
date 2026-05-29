"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import { SingleDatePicker } from "../ui/SingleDatePicker";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { AvatarInitials } from "../ui/AvatarInitials";
import { ChannelChip } from "../ui/ChannelChip";

// ─── Avatar photo imports (from VW Data Grid) ─────────────────────────────────
const imgZakFlaten = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071066/vw-funds/48ea8970f6d4b2ca434cf82051473b99fc39b3d9.png';
const imgRachelHui = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071119/vw-funds/avatars/rachel-hui.png';
// ─── Channel icon imports ─────────────────────────────────────────────────────
const imgGoogle = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071130/vw-funds/channels/google.png';
const imgMeta = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071126/vw-funds/channels/Brand_Logo/Meta.svg';
const imgWebsite = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071128/vw-funds/channels/_website_.svg';
// ─── Shared data ───────────────────────────────────────────────────────────────

export const ACCOUNTS = [
  "Honda of Anywhere",
  "BMW Seattle",
  "Spiriva Pharma",
  "Multiple Brands Inc.",
  "Honda City",
];

/** Only the 4 platforms shown in the Figma design */
export interface PlatformOption {
  id: string;
  label: string;
  icon: string;
}

export const PLATFORM_OPTIONS: PlatformOption[] = [
  { id: "google-pmax",    label: "Google PMax",    icon: imgGoogle  },
  { id: "google-display", label: "Google Display", icon: imgGoogle  },
  { id: "meta",           label: "Meta",           icon: imgMeta    },
  { id: "facebook",       label: "Facebook",       icon: imgMeta    },
  { id: "website",        label: "Website",        icon: imgWebsite },
];

export const PROJECT_OWNERS = [
  { id: "jorge-verlindo",  name: "Jorge Verlindo",  email: "jorge.verlindo@helloconstellation.com",  initials: "JV", color: "#473bab", avatar: null },
  { id: "luke-theobald",   name: "Luke Theobald",   email: "luke.theobald@helloconstellation.com",   initials: "LT", color: "#2563eb", avatar: null },
  { id: "jenny-park",      name: "Jenny Park",      email: "jenny.park@helloconstellation.com",      initials: "JP", color: "#7c3aed", avatar: null },
  { id: "sonya-koh",       name: "Sonya Koh",       email: "sonya.koh@helloconstellation.com",       initials: "SK", color: "#db2777", avatar: null },
  { id: "zak-flaten",      name: "Zak Flaten",      email: "zak.flaten@helloconstellation.com",      initials: "ZF", color: "#059669", avatar: imgZakFlaten },
  { id: "rachel-hui",      name: "Rachel Hui",      email: "rachel.hui@helloconstellation.com",      initials: "RH", color: "#d97706", avatar: imgRachelHui },
  { id: "mike-henderson",  name: "Mike Henderson",  email: "mike.henderson@hondaofanywhere.com",     initials: "MH", color: "#dc2626", avatar: null },
  { id: "sarah-collins",   name: "Sarah Collins",   email: "sarah.collins@hondaofanywhere.com",      initials: "SC", color: "#0891b2", avatar: null },
  { id: "james-whitaker",  name: "James Whitaker",  email: "james.whitaker@hondaofanywhere.com",     initials: "JW", color: "#65a30d", avatar: null },
  { id: "ashley-morgan",   name: "Ashley Morgan",   email: "ashley.morgan@hondaofanywhere.com",      initials: "AM", color: "#ea580c", avatar: null },
  { id: "jenny-eckhart",   name: "Jenny Eckhart",   email: "jenny.eckhart@helloconstellation.com",    initials: "JE", color: "#0e7490", avatar: null },
  { id: "mallory-manning", name: "Mallory Manning", email: "mallory.manning@helloconstellation.com", initials: "MM", color: "#b45309", avatar: null },
  { id: "katelyn-gray",    name: "Katelyn Gray",    email: "katelyn.gray@helloconstellation.com",    initials: "KG", color: "#0369a1", avatar: null },
] as const;

export type ProjectOwner = typeof PROJECT_OWNERS[number];

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface NewProjectInput {
  name: string;
  account: string;
  brand: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  platforms: string[];
  tags: string[];
  recommendations: {
    offers: boolean;
    templates: boolean;
    themeAndLogos: boolean;
  };
}

type FormErrors = Partial<Record<"name" | "startDate" | "endDate", string>>;

// ─── Style constants ───────────────────────────────────────────────────────────

const fieldCls =
  "h-10 w-full flex items-center gap-2 border border-[#CAC9CF] rounded-[8px] px-3 text-[13px] bg-[#F9FAFA] text-left cursor-pointer select-none transition-all hover:border-[#B0B0B5] focus:outline-none data-[state=open]:border-[var(--brand-accent)] data-[state=open]:ring-1 data-[state=open]:ring-[var(--brand-accent)]";

const menuCls =
  "z-[400] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.12)] p-1 min-w-[var(--radix-dropdown-menu-trigger-width)] animate-in fade-in-0 zoom-in-95";

const itemCls =
  "flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#1f1d25] cursor-pointer hover:bg-gray-50 outline-none focus:bg-gray-50 data-[highlighted]:bg-gray-50";

const labelCls =
  "block text-[11px] font-medium text-[rgba(0,0,0,0.6)] mb-1.5 tracking-wide";

// ─── OwnerAvatar — photo if available, otherwise initials ─────────────────────

function OwnerAvatar({ owner, size = 24 }: { owner: typeof PROJECT_OWNERS[number]; size?: number }) {
  if (owner.avatar) {
    return (
      <img
        src={owner.avatar}
        alt={owner.name}
        className="rounded-full shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return <AvatarInitials initials={owner.initials} size={size} bgColor={owner.color} />;
}

// ─── RecommendationCard — no border, only subtle background ──────────────────

function RecommendationCard({
  checked,
  onChange,
  title,
  description,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="flex gap-3 p-3.5 rounded-xl cursor-pointer select-none transition-colors"
      style={{ background: checked ? "rgba(71,59,171,0.05)" : "rgba(0,0,0,0.02)" }}
      onClick={() => onChange(!checked)}
    >
      {/* MUI-style checkbox */}
      <div
        className="mt-0.5 w-[18px] h-[18px] rounded flex items-center justify-center border shrink-0 transition-all"
        style={{
          background: checked ? "#473bab" : "white",
          borderColor: checked ? "#473bab" : "#B0B0B5",
        }}
      >
        {checked && <Check size={11} color="white" strokeWidth={2.5} />}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#1f1d25] leading-tight">
          {title}
        </p>
        <p className="text-[12px] text-[rgba(0,0,0,0.6)] mt-[3px] leading-[1.43]">
          {description}
        </p>
        {children && (
          <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PlatformMultiSelect ──────────────────────────────────────────────────────

function PlatformMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  const selectedPlatforms = selected
    .map(id => PLATFORM_OPTIONS.find(p => p.id === id))
    .filter(Boolean) as PlatformOption[];

  const menuCls = "z-[500] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.1)] p-1 animate-in fade-in-0 zoom-in-95 min-w-[var(--radix-dropdown-menu-trigger-width)]";
  const itemCls = "flex items-center gap-2 px-[10px] py-[6px] rounded-lg text-[13px] text-[#1f1d25] cursor-pointer outline-none select-none data-[highlighted]:bg-[#f5f4f8]";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full flex flex-wrap items-center gap-1.5 min-h-[40px] border border-[#CAC9CF] rounded-[8px] px-2.5 py-1.5 bg-[#F9FAFA] cursor-pointer hover:border-[#B0B0B5] transition-colors text-left focus:outline-none focus:border-[var(--brand-accent)]"
        >
          {selectedPlatforms.length === 0 ? (
            <span className="text-[13px] text-[rgba(0,0,0,0.38)] flex-1">Select platforms</span>
          ) : (
            <div className="flex flex-wrap gap-[3px] flex-1 min-w-0">
              {selectedPlatforms.map(p => (
                <ChannelChip key={p.id} label={p.label} icon={p.icon} onRemove={() => toggle(p.id)} />
              ))}
            </div>
          )}
          <ChevronDown size={13} className="ml-auto text-[rgba(0,0,0,0.4)] shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={menuCls} sideOffset={4} align="start">
        {PLATFORM_OPTIONS.map(p => {
          const active = selected.includes(p.id);
          return (
            <DropdownMenuItem
              key={p.id}
              className={itemCls}
              onSelect={e => { e.preventDefault(); toggle(p.id); }}
            >
              <span
                className="w-[14px] h-[14px] rounded-[3px] border flex items-center justify-center shrink-0 transition-all"
                style={{ background: active ? "var(--brand-accent)" : "white", borderColor: active ? "var(--brand-accent)" : "rgba(0,0,0,0.2)" }}
              >
                {active && <Check size={9} strokeWidth={3} color="white" />}
              </span>
              <img src={p.icon} alt="" className="w-[16px] h-[16px] shrink-0 object-contain" />
              <span>{p.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── TagInput ──────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [val, setVal] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const v = raw.trim().replace(/,$/, "").trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setVal("");
  };
  const remove = (i: number) => onChange(tags.filter((_, idx) => idx !== i));

  return (
    <div
      className="min-h-10 w-full flex flex-wrap items-center gap-1 border border-[#CAC9CF] rounded-[8px] px-2.5 py-1.5 bg-[#F9FAFA] cursor-text hover:border-[#B0B0B5] focus-within:border-[var(--brand-accent)] focus-within:ring-1 focus-within:ring-[var(--brand-accent)] transition-all"
      onClick={() => ref.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-[#F3F4F6] text-[#686576] text-[11px] px-2 py-0.5 rounded-full select-none border border-[#E4E4E8]"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove(i); }}
            className="text-[#9C99A9] hover:text-[#686576] leading-none transition-colors cursor-pointer ml-0.5"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={ref}
        type="text"
        value={val}
        placeholder={tags.length === 0 ? "Add tags…" : ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) { add(v); return; }
          setVal(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); add(val); }
          if (e.key === "Backspace" && !val && tags.length) remove(tags.length - 1);
        }}
        className="flex-1 min-w-[80px] bg-transparent text-[13px] text-[#1f1d25] placeholder:text-[rgba(0,0,0,0.38)] outline-none leading-tight"
      />
    </div>
  );
}

// ─── CreateProjectDialog ───────────────────────────────────────────────────────

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSave,
  brandOptions = [],
  existingNames,
  initialData,
  mode = "create",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: NewProjectInput) => void;
  brandOptions?: { id: string; name: string }[];
  existingNames?: string[];
  initialData?: Partial<NewProjectInput>;
  mode?: "create" | "edit";
}) {
  const [name, setName]           = useState("");
  const [account, setAccount]     = useState("");
  const [brand, setBrand]         = useState("");
  const [ownerId, setOwnerId]     = useState("jorge-verlindo");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate]     = useState<Date | undefined>(undefined);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [tags, setTags]           = useState<string[]>([]);
  const [recOffers, setRecOffers]       = useState(true);
  const [recTemplates, setRecTemplates] = useState(true);
  const [recTheme, setRecTheme]         = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  void brandOptions; // available for future brand selector

  // Populate form when editing an existing project
  useEffect(() => {
    if (open && initialData) {
      if (initialData.name    !== undefined) setName(initialData.name);
      if (initialData.account !== undefined) setAccount(initialData.account);
      if (initialData.brand   !== undefined) setBrand(initialData.brand);
      if (initialData.ownerId !== undefined) setOwnerId(initialData.ownerId);
      if (initialData.startDate !== undefined) setStartDate(initialData.startDate);
      if (initialData.endDate   !== undefined) setEndDate(initialData.endDate);
      if (initialData.platforms !== undefined) setPlatforms(initialData.platforms);
      if (initialData.tags      !== undefined) setTags(initialData.tags);
    }
  }, [open, initialData]);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!name.trim()) e.name      = "Project name is required";
    const norm = (s: string) => s.trim().toLowerCase();
    if (!e.name && existingNames?.some(n => norm(n) === norm(name))) {
      e.name = "A project with this name already exists";
    }
    if (!startDate)   e.startDate = "Start date is required";
    if (!endDate)     e.endDate   = "End date is required";
    if (startDate && endDate && endDate < startDate)
                      e.endDate   = "End date must be after start date";
    return e;
  };

  const resetForm = () => {
    setName(""); setAccount(""); setBrand(""); setOwnerId("jorge-verlindo");
    setStartDate(undefined); setEndDate(undefined);
    setPlatforms([]); setTags([]);
    setRecOffers(true); setRecTemplates(true); setRecTheme(true);
    setErrors({});
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ name, account, brand, ownerId, startDate: startDate!, endDate: endDate!, platforms, tags,
      recommendations: { offers: recOffers, templates: recTemplates, themeAndLogos: recTheme } });
    resetForm();
    onOpenChange(false);
  };

  const handleCancel = () => { resetForm(); onOpenChange(false); };

  const selectedOwner = PROJECT_OWNERS.find((o) => o.id === ownerId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
      <DialogContent
        className="w-full max-w-[900px] sm:max-w-[900px] p-0 rounded-[24px] gap-0 [&>button]:hidden border-0"
        style={{ boxShadow: "0 11px 15px rgba(0,0,0,0.2), 0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12)" }}
      >
        <DialogTitle className="sr-only">{mode === "edit" ? "Edit Project" : "Create Project"}</DialogTitle>

        {/* ── Header — no bottom border ───────────────────────────────── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 rounded-t-[24px] bg-white">
          <h2 className="text-[20px] font-medium text-[#1f1d25] leading-tight">
            {mode === "edit" ? "Edit Project" : "Create Project"}
          </h2>
          <button
            onClick={handleCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[rgba(0,0,0,0.54)] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Body — two columns, no divider ─────────────────────────── */}
        <div className="flex min-h-0">

          {/* Left: Basic Information */}
          <div className="flex-1 px-4 py-2 flex flex-col gap-3.5 overflow-y-auto max-h-[480px]">

            {/* Project Name */}
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Project Name</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Honda Summer Lease Event"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                className={`h-10 w-full rounded-[8px] border px-3 text-[13px] text-[#1f1d25] placeholder:text-[rgba(0,0,0,0.38)] bg-[#F9FAFA] outline-none transition-all ${
                  errors.name
                    ? "border-[#D2323F] ring-1 ring-[#D2323F]"
                    : "border-[#CAC9CF] hover:border-[#B0B0B5] focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)]"
                }`}
              />
              {errors.name && <p className="text-[11px] text-[#D2323F]">{errors.name}</p>}
            </div>

            {/* Account */}
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Account</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={fieldCls}>
                    <span className={account ? "text-[#1f1d25]" : "text-[rgba(0,0,0,0.38)]"}>
                      {account || "Select account"}
                    </span>
                    <ChevronDown size={13} className="ml-auto text-[rgba(0,0,0,0.4)] shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={menuCls} sideOffset={4}>
                  {ACCOUNTS.map((a) => (
                    <DropdownMenuItem key={a} className={itemCls} onClick={() => setAccount(a)}>
                      <span className="flex-1">{a}</span>
                      {account === a && <Check size={13} className="text-[var(--brand-accent)]" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Owner */}
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Owner</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={fieldCls}>
                    {selectedOwner ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <OwnerAvatar owner={selectedOwner} size={22} />
                        <span className="text-[#1f1d25] truncate">{selectedOwner.name}</span>
                        <span className="text-[11px] text-[rgba(0,0,0,0.38)] truncate ml-1 hidden md:block">
                          {selectedOwner.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[rgba(0,0,0,0.38)]">Select owner</span>
                    )}
                    <ChevronDown size={13} className="text-[rgba(0,0,0,0.4)] shrink-0 ml-auto" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={menuCls + " max-h-[260px] overflow-y-auto"} sideOffset={4}>
                  {PROJECT_OWNERS.map((owner) => (
                    <DropdownMenuItem key={owner.id} className={itemCls} onClick={() => setOwnerId(owner.id)}>
                      <OwnerAvatar owner={owner} size={24} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[#1f1d25] leading-tight">{owner.name}</p>
                        <p className="text-[11px] text-[rgba(0,0,0,0.38)] truncate">{owner.email}</p>
                      </div>
                      {owner.id === ownerId && <Check size={13} className="text-[var(--brand-accent)] shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Dates */}
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className={labelCls}>Start Date</label>
                <SingleDatePicker
                  value={startDate}
                  onChange={(d) => { setStartDate(d); if (errors.startDate) setErrors((p) => ({ ...p, startDate: undefined })); }}
                  placeholder="MM/DD/YYYY"
                  direction="down"
                  error={!!errors.startDate}
                />
                {errors.startDate && <p className="text-[11px] text-[#D2323F]">{errors.startDate}</p>}
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className={labelCls}>Expiration Date</label>
                <SingleDatePicker
                  value={endDate}
                  onChange={(d) => { setEndDate(d); if (errors.endDate) setErrors((p) => ({ ...p, endDate: undefined })); }}
                  placeholder="MM/DD/YYYY"
                  direction="down"
                  error={!!errors.endDate}
                />
                {errors.endDate && <p className="text-[11px] text-[#D2323F]">{errors.endDate}</p>}
              </div>
            </div>

            {/* Platforms */}
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Platforms</label>
              <PlatformMultiSelect selected={platforms} onChange={setPlatforms} />
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Tags</label>
              <TagInput tags={tags} onChange={setTags} />
            </div>
          </div>

          {/* Right: Project Recommendations — no left border, clean background */}
          <div className="w-[300px] shrink-0 px-4 py-2 flex flex-col gap-2.5 bg-white overflow-y-auto max-h-[480px]">
            <p className="text-[14px] font-medium text-[#1f1d25]">Project Recommendations</p>

            <RecommendationCard
              checked={recOffers}
              onChange={setRecOffers}
              title="Recommend offers"
              description="Our model calculates best offers bases on age, volume, PVI and Incentive type."
            />

            <RecommendationCard
              checked={recTemplates}
              onChange={setRecTemplates}
              title="Recommend templates"
              description="We will choose the templates that matches the selected dimensions and aligns best with the recommended offers."
            >
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[rgba(0,0,0,0.6)]">* Dimensions</label>
                <button
                  className="h-9 w-full flex items-center gap-2 border border-[#CAC9CF] rounded-[6px] px-3 text-[12px] bg-[#F9FAFA] text-left opacity-50 cursor-not-allowed"
                  disabled
                  tabIndex={-1}
                >
                  <span className="flex-1 text-[rgba(0,0,0,0.38)]">Select dimensions</span>
                  <ChevronDown size={12} className="text-[rgba(0,0,0,0.4)] shrink-0" />
                </button>
              </div>
            </RecommendationCard>

            <RecommendationCard
              checked={recTheme}
              onChange={setRecTheme}
              title="Recommend theme and logos"
              description="We are selecting a basic background and logo to get you started."
            />
          </div>
        </div>

        {/* ── Footer — no top border ──────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 rounded-b-[24px] bg-white">
          <button
            onClick={handleCancel}
            className="px-4 py-1.5 rounded-full text-[14px] font-medium text-[#473bab] hover:bg-[rgba(71,59,171,0.06)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-1.5 rounded-full text-[14px] font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
            style={{ background: "#473bab" }}
          >
            {mode === "edit" ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
