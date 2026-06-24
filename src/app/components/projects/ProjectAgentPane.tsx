"use client";

import { useState, useRef, useEffect, useCallback, useMemo, forwardRef, type ButtonHTMLAttributes } from "react";
import { useUsabilityTesting } from "../../contexts/UsabilityTestingContext";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, ChevronDown, Search, X, Check,
  Copy, ThumbsUp, ThumbsDown, Pencil, Download, Share2,
  Plus, Minus, FileText, Tag, Trash2, Eye, Layers, Image, Info, MoreVertical,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import { AgentInput, type AgentInputHandle } from "../AgentPane";
import type { UserType } from "../../AppContent";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "../ui/dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import { resolveJellybean } from "@/data/jellybeans/jellybean-catalog";
const imgAgentAvatar = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071107/vw-funds/a66b3945941bddb97efa53207e606703467e02b3.png';
import { AvatarInitials } from "../ui/AvatarInitials";
import { PROJECT_OWNERS, PLATFORM_OPTIONS } from "./CreateProjectDialog";
import { ChannelChip } from "../ui/ChannelChip";
import { OfferCard } from "./offers/OfferCard";
import type { Offer as OfferCardData } from "./offers/OfferCard";
import { offerLibrary } from "./lib/mock-data";
import { useWorkflow } from "../../contexts/WorkflowContext";
import { TemplateZoneEditor } from "@projects/templates/TemplateZoneEditor";
import { inlineMarkdown, MarkdownContent } from "./agent/markdown";
import { ResponseActions } from "./agent/ResponseActions";
import { ConstellationArcMark, useConstellationAnim } from "./agent/ConstellationArcMark";
import { ProactiveAutoApplyBar, ProactiveQuestionsCard } from "./agent/ProactiveWidgets";
import { AgentSelect, AgentAddSelect, ConfirmedChip, WhyThese } from "./agent/AgentSelects";
import { SetupProjectCard } from "./agent/SetupProjectCard";
import { OffersProposalCard } from "./agent/OffersProposalCard";
import { type TemplateInfo } from "./agent/TemplatePreviewModal";
import {
  loadAgentThreads, saveAgentThreads, getThreadTitle, groupThreadsByDate,
  fileToBase64, parseExcelToText, deduplicateName,
} from "./agent/utils";
import type { AgentThread } from "./agent/utils";
import { useAgentStream } from "./agent/useAgentStream";

// ─── Shared event constants ────────────────────────────────────────────────────
export const PROJECT_CONTEXT_EVENT         = "project-context-update";
export const PROJECT_AGENT_ACTION_EVENT    = "project-agent-action";
export const AGENT_SCROLL_TO_SECTION_EVENT = "agent-scroll-to-section";
export const AGENT_GENERATE_ASSETS_EVENT   = "agent-generate-assets";
export const AGENT_ASSETS_GENERATED_EVENT  = "agent-assets-generated";
export const AGENT_OPEN_CAMPAIGNS_EVENT    = "agent-open-campaigns";

export interface ProjectContextPayload {
  projectId: string;
  projectName: string;
  oem: string;
  /** Campaign start date string, e.g. "Jun 1, 2026" */
  startDate?: string;
  /** Campaign end date string, e.g. "Jun 30, 2026" */
  endDate?: string;
  /** Primary campaign owner / contact name */
  owner?: string;
  /** Dealer / account name shown on banners */
  dealerName?: string;
  /** CTA button text (default "Shop Now") */
  ctaText?: string;
  /** Lease label text (default "Lease for") */
  leaseLabel?: string;
  /** Single-line fine print / terms */
  finePrint?: string;
  currentOfferIds: string[];
  currentTemplateIds: string[];
  availableOffers: {
    id: string; year: string; make: string; model: string; trim: string;
    offerType: string; monthlyPayment: number; term: number;
    pvi: number; aging: number; stock: number;
    image?: string;
  }[];
  availableTemplates: {
    id: string; name: string; format: string; width: number; height: number; brand: string;
  }[];
  /** OEM name of the currently active brand kit, if any (e.g. "Honda") */
  activeBrandOem?: string;
  /** Per-section task owner names, keyed by section id (e.g. "offers", "templates") */
  taskOwners?: Record<string, string>;
  /** IDs of all backgrounds currently in the project (authoritative — includes all add paths) */
  currentBackgroundIds?: string[];
  /**
   * First N generated asset preview records (bg image URL + label).
   * Used for email asset grid and campaign-review.html query params.
   * Only contains assets with publicly-accessible Cloudinary bg images.
   */
  generatedAssetPreviews?: Array<{
    bgUrl: string;
    vehicleUrl: string;
    offerName: string;
    templateName: string;
    dims: string;
    offerType?: string;
    monthlyPayment?: number;
    term?: number;
    trim?: string;
    make?: string;
  }>;
}

// Custom offer (from file upload / extracted by AI)
export interface CustomOffer {
  id: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  offerType: string;
  monthlyPayment: string;
  term: string;
  dueAtSigning: string;
  apr?: string;
  notes?: string;
  image?: string;
  exteriorColor?: string;
}

// ─── Car image resolver ───────────────────────────────────────────────────────
export function resolveCarImage(make: string, model: string, trim: string, year?: string, colorFamily?: string): string {
  return resolveJellybean(make, model, trim, year, colorFamily);
}

export type AgentActionPayload =
  | { action: "add_offers";       offerIds: string[]; editedOfferIds?: string[] }
  | { action: "remove_offers";    offerIds: string[] }
  | { action: "add_templates";    templateIds: string[] }
  | { action: "remove_templates"; templateIds: string[] }
  | { action: "set_project_name"; name: string }
  | { action: "create_project";   name: string; account: string; oem: string; startDate: string; endDate: string; owner?: string; platforms?: string[] }
  | { action: "set_brand";        oem: string }
  | { action: "add_backgrounds";  backgroundIds: string[] }
  | { action: "add_custom_background"; background: { id: string; name: string; thumbnail: string; images: Record<string, string> } }
  | { action: "send_email";       recipient: string; message: string }
  | { action: "add_custom_offers"; offers: CustomOffer[] }
  | { action: "edit_offer"; offerId: string; patches: Partial<{ monthlyPayment: number; term: number; totalDueAtSigning: number; offerType: string; trim: string; year: string; make: string; model: string }> }
  | { action: "set_task_owners"; owners: Record<string, string> }
  | { action: "set_dealer_bg_generating"; value: boolean }
  | { action: "remove_backgrounds"; backgroundIds: string[] }
  | { action: "duplicate_template"; templateId: string; newName?: string }
  | { action: "update_project_display"; patches: { ctaText?: string; leaseLabel?: string; finePrint?: string; dealerName?: string } }
  | { action: "swap_jellybean"; offerId: string; jellybeanUrl: string; jellybeanId: string; colorFamily: string };

// ─── Multimodal API types ─────────────────────────────────────────────────────
type ApiContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

type ApiMessage = { role: "user" | "assistant"; content: string | ApiContentBlock[] };

// ─── Message model ─────────────────────────────────────────────────────────────
type Role = "user" | "assistant";

interface TextMessage    { id: string; role: Role;        type: "text";      content: string; isGenerateAssetsPrompt?: boolean; applied?: boolean; totalGenerated?: number }
interface ToolChipMsg    { id: string; role: "assistant"; type: "tool";      name: string; input: Record<string, unknown> }
interface ProposalMsg    { id: string; role: "assistant"; type: "proposal";  input: ProposalInput; applied: boolean }
interface SetupMsg       { id: string; role: "assistant"; type: "setup";     input: SetupInput;    applied: boolean }
interface OffersMsg      { id: string; role: "assistant"; type: "offers";    input: OffersInput;   applied: boolean }
interface TemplatesMsg    { id: string; role: "assistant"; type: "templates"; input: TemplatesInput; applied: boolean }
interface BrandMsg        { id: string; role: "assistant"; type: "brand";       input: BrandInput;        applied: boolean }
interface BackgroundsMsg  { id: string; role: "assistant"; type: "backgrounds"; input: BackgroundsInput;  applied: boolean }
interface PreviewMsg      { id: string; role: "assistant"; type: "preview";     offerIds: string[];       templateIds: string[] }
interface ContinuationMsg { id: string; role: "user";     type: "continuation"; content: string }
interface EmailMsg        { id: string; role: "assistant"; type: "email";       input: EmailInput;        applied: boolean }
interface ShareMsg        { id: string; role: "assistant"; type: "share";       input: ShareInput;        applied: boolean }
interface NotifyOwnersMsg { id: string; role: "assistant"; type: "notify_owners"; input: NotifyOwnersInput; applied: boolean; liveOwners?: Record<string, string>; }
interface TaskOwnersInput {
  owners?: Record<string, string>; // section → owner name suggestions from agent
  suggested_owners?: Array<{ section: string; name: string }>;
}
interface TaskOwnersMsg { id: string; role: "assistant"; type: "task_owners"; input: TaskOwnersInput; applied: boolean; liveOwners?: Record<string, string>; }
interface ProactiveQuestionsInput {
  intro_line?: string;
}
interface ProactiveQuestionsMsg {
  id: string;
  role: "assistant";
  type: "proactive_questions";
  input: ProactiveQuestionsInput;
  applied: boolean;
}
// File upload message (shown in chat as user bubble with file chip)
interface UserFileMsg     { id: string; role: "user"; type: "user_file"; text: string; files: { name: string; type: string }[]; apiContent: ApiContentBlock[] }
// Parsed offers from AI extraction of uploaded file
interface ParsedOffersMsg { id: string; role: "assistant"; type: "parsed_offers"; input: ParsedOffersInput; applied: boolean }

// Reviewer picker — multi-select contacts before the share chooser
interface ReviewerPickerMsg {
  id: string; role: "assistant"; type: "reviewer_picker"; applied: boolean;
  recipientHints?: string[];
}

interface CampaignCtaMsg {
  id: string; role: "assistant"; type: "campaign_cta";
}

// Dealer background approval card (full_dealer_bg flow — isolated from Inventory AI Config)
interface DealerBgProposalMsg {
  id: string; role: "assistant"; type: "dealer_bg_proposal";
  bgObject: { id: string; name: string; thumbnail: string; images: Record<string, string> };
  previewUrl: string;   // canvas composite of first offer + generated background
  applied: boolean;
}

type Message = TextMessage | ToolChipMsg | ProposalMsg | SetupMsg | OffersMsg | TemplatesMsg | BrandMsg | BackgroundsMsg | PreviewMsg | ContinuationMsg | EmailMsg | ShareMsg | UserFileMsg | ParsedOffersMsg | NotifyOwnersMsg | TaskOwnersMsg | ProactiveQuestionsMsg | DealerBgProposalMsg | ReviewerPickerMsg | CampaignCtaMsg;

interface ProposalInput {
  project_name?: string;
  offer_ids: string[];
  template_ids: string[];
  start_date?: string;
  end_date?: string;
  rationale: string;
}
interface SetupInput {
  project_name: string;
  account?: string;
  oem: string;
  start_date: string;
  end_date: string;
  /** Enum set by the agent based on user intent — drives continuation messages */
  flow_scope?: "full" | "offers_only" | "templates_only" | "offers_and_templates" | "templates_and_email" | "offers_and_email" | "full_dealer_bg";
  /** Legacy field — kept for backward compat with old sessions */
  flow_steps?: string[];
  owner?: string;
  platforms?: string[];
}
interface OffersInput {
  offer_ids: string[];
  rationale: string;
}
interface TemplatesInput {
  template_ids: string[];
  rationale: string;
}
interface BrandInput {
  oem: string;
  rationale: string;
}
interface BackgroundsInput {
  background_ids: string[];
  rationale: string;
}
interface EmailInput {
  recipient_hint?: string;
  message: string;
}
interface ShareInput {
  recipient_hint: string;
  project_name?: string;
  /** Pre-selected mechanism — when set, the chooser is skipped entirely */
  mechanism?: "email" | "platform";
  /** Contacts pre-selected from the reviewer picker — shows a grouped summary */
  selectedContacts?: Array<{ name: string; email: string; group: "constellation" | "dealer" | "internal" }>;
}
interface NotifyOwnersInput {
  owners?: Record<string, string>; // section → owner name hint from agent
}

// Offer row extracted from a file by Claude
interface ParsedOfferRow {
  id: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
  offer_type: string;
  monthly_payment: string;
  term: string;
  due_at_signing?: string;
  apr?: string;
  notes?: string;
  field_confidence: Record<string, "high" | "medium" | "low">;
}

interface ParsedOffersInput {
  source: string;
  offers: ParsedOfferRow[];
  extraction_notes?: string;
}

// ─── Custom header icons (from exported SVGs — pixel-perfect, color via currentColor) ────
function IconHistory() {
  // Icon.svg — 34×30 viewBox — clock with circular arrow
  return (
    <svg width="24" height="24" viewBox="0 0 34 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 11.4583V14.9999L19.9167 17.9166" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.28906 8.95825V12.2916H12.6224" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.71094 17.5695C10.7707 20.5634 13.6301 22.7084 16.9913 22.7084C21.2547 22.7084 24.7109 19.2573 24.7109 15.0001C24.7109 10.7429 21.2547 7.29175 16.9913 7.29175C13.7927 7.29175 11.0484 9.2343 9.87716 12.0024" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconExpand() {
  // Open Left Pane.svg — 30×30 viewBox — expand arrows
  return (
    <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.4583 8.125H21.875V13.5417M16.4583 13.5417L21.2305 8.76953M13.5417 16.4583L8.76953 21.2305M8.125 16.4583V21.875H13.5417" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconClose() {
  // Close.svg — 30×30 viewBox — X
  return (
    <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.4609 11.4583L18.5443 18.5416M18.5443 11.4583L11.4609 18.5416" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Thread persistence ────────────────────────────────────────────────────────
// AgentThread type, loadAgentThreads, saveAgentThreads, getThreadTitle, groupThreadsByDate
// → extracted to ./agent/utils.ts

// ─── Constellation arc animation → extracted to ./agent/ConstellationArcMark.tsx

// ─── File helpers → extracted to ./agent/utils.ts

// ─── SSE streaming hook → extracted to ./agent/useAgentStream.ts

// ─── Markdown renderer → extracted to ./agent/markdown.tsx

// ─── Response action bar → extracted to ./agent/ResponseActions.tsx

// ─── Confirmed chip → extracted to ./agent/AgentSelects.tsx

// ─── Shared constants (mirrors ProjectsModule) ────────────────────────────────
const AVAILABLE_ACCOUNTS = ["Honda of Anywhere", "BMW Seattle", "Spiriva Pharma", "Multiple Brands Inc.", "Honda City"];
const AVAILABLE_BRANDS   = ["Honda", "BMW", "Spiriva", "Volkswagen", "Audi", "General"];

const MOCK_CONTACTS = [
  // Constellation team
  { name: "Luke Theobald", email: "luke.theobald@helloconstellation.com", group: "constellation" as const },
  { name: "Jenny Park",    email: "jenny.park@helloconstellation.com",    group: "constellation" as const },
  { name: "Sonya Koh",     email: "sonya.koh@helloconstellation.com",     group: "constellation" as const },
  { name: "Zak Flaten",    email: "zak.flaten@helloconstellation.com",    group: "constellation" as const },
  { name: "Rachel Hui",    email: "rachel.hui@helloconstellation.com",    group: "constellation" as const },
  // Dealer contacts
  { name: "Mike Henderson",  email: "mike.henderson@hondaofanywhere.com", group: "dealer" as const },
  { name: "Sarah Collins",   email: "sarah.collins@hondaofanywhere.com",  group: "dealer" as const },
  { name: "James Whitaker",  email: "james.whitaker@hondaofanywhere.com", group: "dealer" as const },
  { name: "Ashley Morgan",   email: "ashley.morgan@hondaofanywhere.com",  group: "dealer" as const },
  { name: "Katelyn Gray",    email: "katelyn.gray@emichvw.com",           group: "dealer" as const },
  { name: "Jenni Eckhart",   email: "jenni.eckhart@helloconstellation.com", group: "internal" as const },
];

// ─── AgentSelect, AgentAddSelect, WhyThese → extracted to ./agent/AgentSelects.tsx

// ─── Name deduplication helper → extracted to ./agent/utils.ts

// ─── Proactive widgets → extracted to ./agent/ProactiveWidgets.tsx

// ─── SetupProjectCard → extracted to ./agent/SetupProjectCard.tsx
// ─── OffersProposalCard → extracted to ./agent/OffersProposalCard.tsx
// ─── TemplatePreviewModal → extracted to ./agent/TemplatePreviewModal.tsx
// ─── Templates Proposal Card ───────────────────────────────────────────────────
interface TemplatesCardProps {
  input: TemplatesInput;
  context: ProjectContextPayload | null;
  onApply: (templateIds: string[]) => void;
  onDismiss: () => void;
  proactive?: boolean;
  platforms?: string[];
}
function TemplatesProposalCard({ input, context, onApply, onDismiss, proactive, platforms }: TemplatesCardProps) {
  const allTemplates = context?.availableTemplates ?? [];

  const matchesPlatforms = (format: string) => {
    if (!platforms || platforms.length === 0) return true;
    const f = format.toLowerCase();
    return platforms.some(p => {
      if (p === "google-pmax") return true;
      if (p === "website") return f.includes("website") || f.includes("mobile");
      if (p === "facebook" || p === "meta") return f.includes("social");
      if (p === "google-display") return f.includes("display");
      return false;
    });
  };

  const [templateIds, setTemplateIds] = useState<string[]>(() =>
    platforms && platforms.length > 0
      ? input.template_ids.filter(id => {
          const t = allTemplates.find(x => x.id === id);
          return !t || matchesPlatforms(t.format);
        })
      : input.template_ids
  );
  const [applied,       setApplied]       = useState(false);
  const [zoneTpl,       setZoneTpl]       = useState<TemplateInfo | null>(null);
  const templates = allTemplates.filter(t => matchesPlatforms(t.format));
  const [manualMode, setManualMode] = useState(false);
  const autoApplyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!proactive || manualMode || applied) return;
    autoApplyRef.current = setTimeout(() => {
      setApplied(true);
      onApply(templateIds);
    }, 5000);
    return () => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); };
  }, [proactive, manualMode, applied]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll the main panel to the templates section when this card appears
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(AGENT_SCROLL_TO_SECTION_EVENT, { detail: { section: "templates" } }));
  }, []);

  if (applied) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`${templateIds.length} template${templateIds.length !== 1 ? "s" : ""} added`} />
      </div>
    );
  }

  const labelCls = "text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-tertiary)] mb-[4px]";

  return (
    <>
    {zoneTpl && createPortal(
      <TemplateZoneEditor templateId={zoneTpl.id} templateName={zoneTpl.name} onClose={() => setZoneTpl(null)} />,
      document.body,
    )}
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] flex flex-col gap-[8px]">
      {/* Rationale — free text, no outer box */}
      <div className="pl-[2px]">
        <p style={{ fontSize: 12, color: "rgb(31,29,37)", lineHeight: 1.43, letterSpacing: "0.17px" }}>{input.rationale}</p>
        <WhyThese content={
          <div style={{ fontSize: 12, color: "rgb(31,29,37)", lineHeight: 1.43, letterSpacing: "0.17px" }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>How I picked these</p>
            <p style={{ marginBottom: 4 }}>I select templates based on two priorities:</p>
            <p style={{ marginBottom: 2 }}>• <strong>Format coverage</strong> — I aim to cover website banner, display leaderboard, and social square formats for maximum reach across placements.</p>
            <p>• <strong>Brand match</strong> — templates tagged with your project's OEM are prioritised over generic multi-brand ones.</p>
          </div>
        } />
      </div>
      {/* Items card */}
      <div className="rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-white overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div className="flex flex-col gap-[10px] px-[14px] py-[12px]">
        <div>
          <p className={labelCls}>Templates · {templateIds.length} selected</p>
          <motion.div
            className="flex flex-col gap-[4px] max-h-[40vh] overflow-y-auto pr-[2px]"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.28 } } }}
            initial="hidden"
            animate="show"
          >
            {templateIds.map((id) => {
              const t = templates.find(x => x.id === id);
              return (
                <motion.div key={id}
                  variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.26, ease: "easeOut" } } }}
                  className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[8px] bg-[#f5f4f8] group">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[var(--ink)] truncate">{t ? t.name : id}</p>
                    {t && <p className="text-[10.5px] text-[var(--ink-secondary)] mt-[1px]">{t.format} · {t.width}×{t.height} · {t.brand}</p>}
                  </div>
                  <div className="flex items-center gap-[6px] shrink-0">
                    {t && (
                      <button onClick={() => setZoneTpl(t)}
                        className="text-[#686576] hover:text-[var(--brand-accent)] transition-colors cursor-pointer p-[2px]"
                        title="Edit Zone">
                        <Eye size={16} strokeWidth={1.7} />
                      </button>
                    )}
                    <button onClick={() => setTemplateIds(p => p.filter(x => x !== id))}
                      className="text-[#686576] hover:text-[#dc2626] transition-colors cursor-pointer p-[2px]">
                      <Trash2 size={16} strokeWidth={1.7} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            <AgentAddSelect
              placeholder="Add another template…"
              onAdd={v => setTemplateIds(p => [...p, v])}
              options={templates
                .filter(t => !templateIds.includes(t.id))
                .map(t => ({ value: t.id, label: `${t.name} — ${t.format}` }))}
            />
          </motion.div>
        </div>
        {/* Customize hint */}
        <div className="flex items-start gap-[6px] px-[2px] pt-[2px]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 mt-[1px]">
            <circle cx="6" cy="6" r="5.5" stroke="var(--brand-accent)" strokeOpacity="0.5"/>
            <path d="M6 5.5V8.5M6 3.5V4.5" stroke="var(--brand-accent)" strokeOpacity="0.7" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: 11, color: "var(--ink-secondary)", lineHeight: 1.5 }}>
            These templates are all customizable. Click the{" "}
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>⋮</span>
            {" "}menu on any template card and select{" "}
            <span style={{ fontWeight: 600, color: "var(--brand-accent)" }}>Edit Zone</span>
            {" "}to customize.
          </p>
        </div>
        <div className="flex items-center gap-[8px] pt-[2px]">
          <button onClick={() => { onApply(templateIds); setApplied(true); }}
            disabled={templateIds.length === 0}
            className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}>
            Add templates
          </button>
          <button onClick={onDismiss} className="px-[14px] py-[8px] rounded-full text-[13px] text-[var(--ink-secondary)] hover:bg-black/5 transition-colors cursor-pointer">
            Dismiss
          </button>
        </div>
      </div>
      {proactive && !manualMode && !applied && (
        <ProactiveAutoApplyBar delay={5000} onCancel={() => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); setManualMode(true); }} />
      )}
      </div>
    </motion.div>
    </>
  );
}

// ─── Brand Proposal Card ──────────────────────────────────────────────────────
// Normalize an OEM string to a known brand — strips underscores, case-insensitive prefix match
function normalizeOem(raw: string): string {
  if (!raw) return "";
  const direct = AVAILABLE_BRANDS.find(b => b === raw);
  if (direct) return direct;
  const cleaned = raw.replace(/_/g, " ").trim().toLowerCase();
  return AVAILABLE_BRANDS.find(b => cleaned.startsWith(b.toLowerCase()) || b.toLowerCase().startsWith(cleaned)) ?? raw;
}

interface BrandCardProps {
  input: BrandInput;
  projectName?: string;
  onApply: (oem: string) => void;
  onDismiss: () => void;
  proactive?: boolean;
}
function BrandProposalCard({ input, projectName, onApply, onDismiss, proactive }: BrandCardProps) {
  const [oem,     setOem]     = useState(() => normalizeOem(input.oem));
  const [applied, setApplied] = useState(false);

  const [manualMode, setManualMode] = useState(false);
  const autoApplyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!proactive || manualMode || applied) return;
    autoApplyRef.current = setTimeout(() => {
      setApplied(true);
      onApply(oem);
    }, 5000);
    return () => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); };
  }, [proactive, manualMode, applied]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll the main panel to the theme section when this card appears
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(AGENT_SCROLL_TO_SECTION_EVENT, { detail: { section: "theme" } }));
  }, []);

  if (applied) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`${oem} brand kit activated`} />
      </div>
    );
  }

  const inputCls = "w-full px-[10px] py-[7px] rounded-[8px] text-[12px] text-[var(--ink)] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none focus:border-[var(--brand-accent)] transition-all cursor-pointer appearance-none";
  const labelCls = "text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-tertiary)] mb-[4px]";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] flex flex-col gap-[8px]">
      {/* Rationale — free text, no outer box */}
      <div className="pl-[2px]">
        <p style={{ fontSize: 12, color: "rgb(31,29,37)", lineHeight: 1.43, letterSpacing: "0.17px" }}>{input.rationale}</p>
        <WhyThese content={
          <div style={{ fontSize: 12, color: "rgb(31,29,37)", lineHeight: 1.43, letterSpacing: "0.17px" }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>How I picked this</p>
            <p>• <strong>Brand consistency</strong> — the kit matches the OEM on your project, ensuring logos, colours, and typography align with the manufacturer's guidelines across all ad formats.</p>
          </div>
        } />
      </div>
      {/* Items card */}
      <div className="rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-white overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {projectName && (
          <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
            <p style={{ fontSize: 10.5, color: "var(--ink-tertiary)" }}>
              Project: <span style={{ color: "var(--ink)", fontWeight: 600 }}>{projectName}</span>
            </p>
          </div>
        )}
        <div className="flex flex-col gap-[10px] px-[14px] py-[12px]">
          <div>
            <p className={labelCls}>Brand / Theme Kit</p>
            <AgentSelect
              value={oem} onChange={setOem}
              options={AVAILABLE_BRANDS.map(b => ({ value: b, label: b }))}
            />
          </div>
          <div className="flex items-center gap-[8px] pt-[2px]">
            <button onClick={() => { onApply(oem); setApplied(true); }}
              className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer"
              style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}>
              Activate brand kit
            </button>
            <button onClick={onDismiss} className="px-[14px] py-[8px] rounded-full text-[13px] text-[var(--ink-secondary)] hover:bg-black/5 transition-colors cursor-pointer">
              Skip
            </button>
          </div>
        </div>
        {proactive && !manualMode && !applied && (
          <ProactiveAutoApplyBar delay={5000} onCancel={() => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); setManualMode(true); }} />
        )}
      </div>
    </motion.div>
  );
}

// ─── Backgrounds Proposal Card ─────────────────────────────────────────────────
const SCENE_BACKGROUNDS = [
  { id: "dirt-road",                  name: "Dirt Road",               thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071536/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Display_300x250_1.png" },
  { id: "gold-flare",                 name: "Gold Flare",              thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071581/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Display_300x250_1.png" },
  { id: "purple-city",                name: "Purple City",             thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071599/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Display_300x250_1.png" },
  { id: "snow-house",                 name: "Snow House",              thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071611/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Display_300x250_1.png" },
  { id: "ballon-festival",            name: "Balloon Festival",        thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071509/vw-funds/public/backgrounds/Ballon_Festival/1777265296524_9d7c8327.jpg" },
  { id: "beach-sunset",               name: "Beach Sunset",            thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071515/vw-funds/public/backgrounds/Beach_Sunset/BM_250724_2_DISPLAY_300x250.jpg" },
  { id: "desert-day",                 name: "Desert Day",              thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071522/vw-funds/public/backgrounds/Desert_Day/tmp_b9mipxq_1080x1080_1774762572901_300x250_1774892650125.jpg" },
  { id: "desert-pyramid-night-sky",   name: "Desert Pyramid Night",    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071533/vw-funds/public/backgrounds/Desert_Pyramid_Night_Sky/1777056196506_131012de.jpg" },
  { id: "docks-midday",               name: "Docks Midday",            thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071549/vw-funds/public/backgrounds/Docks_Midday/BM_250515_1_SOCIAL_1080x1080_300x250_1774892650098.jpg" },
  { id: "field-with-mountain",        name: "Field With Mountain",     thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071563/vw-funds/public/backgrounds/Field_With_Mountain/1777014100078_094e3bd4.jpg" },
  { id: "forest-lodge",               name: "Forest Lodge",            thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071569/vw-funds/public/backgrounds/Forest_Lodge/1777217113411_a7cf6a69.jpg" },
  { id: "frozen-lake-night",          name: "Frozen Lake Night",       thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071579/vw-funds/public/backgrounds/Frozen_Lake_Night/1777303348542_7657d84b.jpg" },
  { id: "ice-lab",                    name: "Ice Lab",                 thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071589/vw-funds/public/backgrounds/Ice_Lab/1777123961113_36260ab2.jpg" },
  { id: "stadium-night",              name: "Stadium Night",           thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071628/vw-funds/public/backgrounds/Stadium_Night/BM_250825_1C_Display_300x250.jpg" },
];

// ─── Reviewer Picker Card ("Share for review" — matches Figma 5573-603759) ────
type ReviewerContact = typeof MOCK_CONTACTS[number];

// ─── Campaign CTA Card (standard flow — post asset generation) ────────────────
function CampaignCtaCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mr-[16px] mt-[4px] bg-white border border-[rgba(0,0,0,0.12)] rounded-[14px] overflow-hidden"
      style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.12), 0px 1px 1px rgba(0,0,0,0.14), 0px 2px 1px -1px rgba(0,0,0,0.2)" }}>
      <div className="flex flex-col gap-[12px] p-[14px]">
        <div className="flex flex-col gap-[4px]">
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1f1d25", letterSpacing: "0.15px", lineHeight: 1.57 }}>
            Assets ready for campaign
          </p>
          <p style={{ fontSize: 12, color: "#686576", letterSpacing: "0.17px", lineHeight: 1.43 }}>
            This is a pre-approved flow — your assets are set. Would you like to generate a campaign now?
          </p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent(AGENT_OPEN_CAMPAIGNS_EVENT))}
          className="w-full py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer"
          style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}>
          Go to Campaigns
        </button>
      </div>
    </motion.div>
  );
}

function ReviewerPickerCard({
  applied,
  projectName,
  projectUrl,
  onSend,
  recipientHints,
}: {
  applied: boolean;
  projectName: string;
  projectUrl: string;
  onSend: (contacts: ReviewerContact[], channels: Record<string, "platform" | "email">, message: string) => void;
  recipientHints?: string[];
}) {
  const [customContacts, setCustomContacts] = useState<ReviewerContact[]>([]);
  const allContacts = [...MOCK_CONTACTS, ...customContacts];

  const [selected, setSelected] = useState<ReviewerContact[]>(() => {
    if (recipientHints && recipientHints.length > 0) {
      const lowerHints = recipientHints.map(h => h.toLowerCase());
      return MOCK_CONTACTS.filter(c =>
        lowerHints.some(h => c.name.toLowerCase().includes(h) || h.includes(c.name.toLowerCase().split(" ")[0]))
      );
    }
    return MOCK_CONTACTS.filter(c => c.group !== "dealer");
  });
  const [message, setMessage] = useState(
    () => `I'd like to share the ${projectName} project with you. Please find the project link below:\n\n${projectUrl}`
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [channels, setChannels] = useState<Record<string, "platform" | "email">>(
    () => Object.fromEntries(MOCK_CONTACTS.map(c => [c.email, c.group === "dealer" ? "email" : "platform"]))
  );

  const toggleChannel = (email: string) =>
    setChannels(prev => ({ ...prev, [email]: prev[email] === "platform" ? "email" : "platform" }));

  const addByEmail = (raw: string) => {
    const email = raw.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    const existing = allContacts.find(c => c.email.toLowerCase() === email);
    if (existing) {
      if (!selected.find(s => s.email === existing.email)) {
        setSelected(prev => [...prev, existing]);
      }
    } else {
      const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      const contact: ReviewerContact = { name, email, group: "dealer" };
      setCustomContacts(prev => [...prev, contact]);
      setChannels(prev => ({ ...prev, [email]: "email" }));
      setSelected(prev => [...prev, contact]);
    }
    setEmailInput("");
    setShowAddMenu(false);
  };

  if (applied) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label="Sent for review" />
      </div>
    );
  }

  const remove = (email: string) => setSelected(prev => prev.filter(c => c.email !== email));
  const add = (contact: ReviewerContact) => {
    setSelected(prev => prev.find(c => c.email === contact.email) ? prev : [...prev, contact]);
    setShowAddMenu(false);
  };
  const available = allContacts.filter(c => !selected.find(s => s.email === c.email));

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mr-[16px] mt-[4px] bg-white border border-[rgba(0,0,0,0.12)] rounded-[14px] overflow-visible"
      style={{
        boxShadow: "0px 1px 3px rgba(0,0,0,0.12), 0px 1px 1px rgba(0,0,0,0.14), 0px 2px 1px -1px rgba(0,0,0,0.2)",
      }}>

      <div className="flex flex-col gap-[12px] p-[14px]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1f1d25", letterSpacing: "0.15px", lineHeight: 1.57 }}>Share for review</p>
          <div className="flex items-center px-[6px] py-[3px] rounded-[8px]" style={{ background: "#fafaff", minHeight: 24 }}>
            <span style={{ fontSize: 11, color: "#6356e1", letterSpacing: "0.16px", lineHeight: "18px" }}>{selected.length} selected</span>
          </div>
        </div>

        {/* ── Contact list ── */}
        <div className="flex flex-col rounded-[var(--card,12px)] overflow-hidden">
          {selected.map((contact, i) => (
            <div key={contact.email} className="relative">
              <div className="flex items-center gap-[12px] px-[8px]" style={{ paddingTop: 4, paddingBottom: 4 }}>
                {/* Avatar */}
                <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "#f4f5f6" }}>
                  <span style={{ fontSize: 9, fontWeight: 400, color: "#473bab", letterSpacing: "0.4px", lineHeight: "1.66" }}>
                    {initials(contact.name)}
                  </span>
                </div>
                {/* Text */}
                <div className="flex flex-col flex-1 min-w-0 py-[4px]">
                  <p style={{ fontSize: 12, color: "#1f1d25", letterSpacing: "0.17px", lineHeight: "1.43", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.name}</p>
                  <p style={{ fontSize: 11, color: "#686576", letterSpacing: "0.4px", lineHeight: "1.66" }}>
                    {channels[contact.email] === "platform" ? "Platform Message" : contact.email}
                  </p>
                </div>
                {/* Kebab menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center justify-center rounded-full shrink-0 cursor-pointer hover:bg-[rgba(0,0,0,0.04)] transition-colors"
                      style={{ padding: 5 }}>
                      <MoreVertical size={14} strokeWidth={1.5} color="#686576" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={4} className="w-[220px]">
                    <DropdownMenuItem onClick={() => toggleChannel(contact.email)}>
                      {channels[contact.email] === "platform" ? "Notify by Email" : "Notify by Platform Message"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => remove(contact.email)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50">
                      Remove contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Divider */}
              {i < selected.length - 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-[rgba(0,0,0,0.08)]" />
              )}
            </div>
          ))}
        </div>

        {/* ── Include Contact button ── */}
        <div className="relative">
          <button
            onClick={() => { setShowAddMenu(v => !v); setTimeout(() => emailInputRef.current?.focus(), 50); }}
            className="w-full py-[8px] rounded-full border text-[13px] font-medium tracking-[0.46px] cursor-pointer transition-colors hover:bg-[rgba(71,59,171,0.04)]"
            style={{ borderColor: "var(--brand-accent)", color: "var(--brand-accent)", fontWeight: 500, background: "transparent" }}>
            Include Contact
          </button>
          {showAddMenu && (
            <div className="absolute top-full left-0 right-0 mt-[4px] bg-white rounded-[8px] border border-[rgba(0,0,0,0.12)] z-20 overflow-hidden"
              style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.12)" }}>
              {available.map(contact => (
                <button key={contact.email} onClick={() => add(contact)}
                  className="w-full flex items-center gap-[10px] px-[12px] py-[8px] hover:bg-[#f5f4ff] text-left cursor-pointer transition-colors">
                  <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "#f4f5f6" }}>
                    <span style={{ fontSize: 9, color: "#473bab" }}>{initials(contact.name)}</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span style={{ fontSize: 12, color: "#1f1d25" }}>{contact.name}</span>
                    <span style={{ fontSize: 10, color: "#686576" }}>{contact.email}</span>
                  </div>
                </button>
              ))}
              {/* Email input row */}
              {available.length > 0 && (
                <div className="h-px mx-[12px]" style={{ background: "rgba(0,0,0,0.08)" }} />
              )}
              <div className="flex items-center gap-[8px] px-[12px] py-[8px]">
                <input
                  ref={emailInputRef}
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addByEmail(emailInput); } }}
                  placeholder="Enter email address..."
                  className="flex-1 text-[12px] outline-none bg-transparent"
                  style={{ color: "#1f1d25", letterSpacing: "0.17px" }}
                />
                <button
                  onClick={() => addByEmail(emailInput)}
                  disabled={!emailInput.includes("@")}
                  className="shrink-0 w-[20px] h-[20px] rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: "var(--brand-accent)" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M1 5h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Message textarea ── */}
        <div className="flex flex-col gap-[4px]">
          <div className="px-[4px]">
            <p style={{ fontSize: 12, color: "#686576", letterSpacing: "0.15px", lineHeight: "12px" }}>Message</p>
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full px-[8px] py-[6px] rounded-[4px] resize-none focus:outline-none focus:ring-1"
            style={{
              background: "#f9fafa",
              border: "1px solid #dddce0",
              color: "#1f1d25",
              fontSize: 12,
              letterSpacing: "0.17px",
              lineHeight: "1.43",
              height: 120,
              fontFamily: "inherit",
              // focus ring color
            }}
          />
        </div>

        {/* ── Send Message button ── */}
        <button
          onClick={() => selected.length > 0 && onSend(selected, channels, message)}
          disabled={selected.length === 0}
          className="w-full py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer disabled:opacity-40"
          style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}>
          Send Message
        </button>

      </div>
    </motion.div>
  );
}

// ─── Dealer BG preview image with shimmer skeleton ────────────────────────────
function DealerBgPreviewImage({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {/* Skeleton always rendered on top — fades out once the real image is ready */}
      <div
        className="absolute inset-0 skeleton-shimmer pointer-events-none"
        style={{ opacity: loaded ? 0 : 1, transition: "opacity 0.3s ease", zIndex: 1 }}
      />
      <img
        src={src}
        alt="Generated background preview"
        style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </>
  );
}

// ─── Generate Assets Smart Card ───────────────────────────────────────────────
function GenerateAssetsSmartCard({
  context,
  confirmedBackgroundIds,
  applied,
  totalGenerated,
}: {
  context: ProjectContextPayload | null;
  confirmedBackgroundIds: string[];
  applied: boolean;
  totalGenerated?: number;
}) {
  if (applied) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`${totalGenerated ?? 0} assets generated`} />
      </div>
    );
  }

  const selectedOffers = (context?.currentOfferIds ?? [])
    .map(id => context?.availableOffers.find(o => o.id === id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  const selectedTemplates = (context?.currentTemplateIds ?? [])
    .map(id => context?.availableTemplates.find(t => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const offerCount    = selectedOffers.length;
  const templateCount = selectedTemplates.length;
  const bgCount       = confirmedBackgroundIds.length > 0 ? confirmedBackgroundIds.length : 1;
  const total         = Math.max(offerCount * templateCount * bgCount, 0);
  const adShells      = bgCount;

  const offerNames  = selectedOffers.slice(0, 4).map(o => o.model).join(" · ") || "—";
  const tmplDims    = selectedTemplates.slice(0, 4).map(t => `${t.width}×${t.height}`).join(" · ") || "—";
  const bgNames     = confirmedBackgroundIds.length > 0
    ? confirmedBackgroundIds.slice(0, 3).map(id => SCENE_BACKGROUNDS.find(b => b.id === id)?.name ?? id).join(" · ")
    : "No backgrounds";

  const listItems = [
    { icon: <Tag size={14} style={{ color: "#473bab" }} />, label: `${offerCount} Offer${offerCount !== 1 ? "s" : ""}`, sub: offerNames },
    { icon: <Layers size={14} style={{ color: "#473bab" }} />, label: "Templates", sub: tmplDims },
    { icon: <Image size={14} style={{ color: "#473bab" }} />, label: `${confirmedBackgroundIds.length > 0 ? confirmedBackgroundIds.length : "No"} Background${confirmedBackgroundIds.length !== 1 ? "s" : ""}`, sub: bgNames },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-white overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 14 }}>
        {/* Header — title only, no chip */}
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1f1d25", letterSpacing: "0.15px" }}>Generate Assets</span>

        {/* List items — no outer border, only bottom dividers */}
        <div>
          {listItems.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
              borderBottom: i < listItems.length - 1 ? "1px solid rgba(0,0,0,0.07)" : "none",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 100, background: "#EEEEFF",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1f1d25", lineHeight: 1.4, margin: 0 }}>{item.label}</p>
                <p style={{ fontSize: 11, color: "#686576", lineHeight: 1.4, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alert */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px",
          border: "1px solid #473bab", borderRadius: 8,
          background: "rgba(71,59,171,0.04)",
        }}>
          <Info size={14} style={{ color: "#473bab", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#473bab", lineHeight: 1.5, margin: 0 }}>
            <strong>{total} Assets</strong> will be grouped into <strong>{adShells} Ad Shell{adShells !== 1 ? "s" : ""}</strong> — one per background — each containing all format sizes for every offer.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent(AGENT_GENERATE_ASSETS_EVENT))}
            style={{
              width: "100%", padding: "10px 16px", borderRadius: 999,
              fontSize: 13, fontWeight: 600, letterSpacing: "0.46px",
              color: "white", background: "#473bab", border: "none", cursor: "pointer",
            }}
          >
            Generate {total} Assets
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent(AGENT_SCROLL_TO_SECTION_EVENT, { detail: { section: "adshells" } }))}
            style={{
              width: "100%", padding: "10px 16px", borderRadius: 999,
              fontSize: 13, fontWeight: 500, letterSpacing: "0.46px",
              color: "#473bab", background: "transparent",
              border: "1px solid rgba(99,86,225,0.5)", cursor: "pointer",
            }}
          >
            Review First
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface BackgroundsCardProps {
  input: BackgroundsInput;
  onApply: (backgroundIds: string[]) => void;
  onDismiss: () => void;
  proactive?: boolean;
}
function BackgroundsProposalCard({ input, onApply, onDismiss }: BackgroundsCardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);
  const [previewBg, setPreviewBg] = useState<string | null>(null);

  useEffect(() => {
    if (!previewBg) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewBg(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [previewBg]);

  // Scroll the main panel to the backgrounds section when this card appears
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(AGENT_SCROLL_TO_SECTION_EVENT, { detail: { section: "backgrounds" } }));
  }, []);

  const toggle = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  if (applied) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`${selectedIds.length} background${selectedIds.length !== 1 ? "s" : ""} added`} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] flex flex-col gap-[8px]">
      {/* Rationale — free text, no outer box */}
      <div className="pl-[2px]">
        <p style={{ fontSize: 12, color: "rgb(31,29,37)", lineHeight: 1.43, letterSpacing: "0.17px" }}>{input.rationale}</p>
        <WhyThese content={
          <div style={{ fontSize: 12, color: "rgb(31,29,37)", lineHeight: 1.43, letterSpacing: "0.17px" }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>How I picked these</p>
            <p style={{ marginBottom: 2 }}>• <strong>Environment variety</strong> — different lighting conditions and settings keep the creative fresh across placements and avoid visual repetition.</p>
            <p>• <strong>Vehicle framing</strong> — I avoid overly generic or cluttered scenes, favouring open roads, urban vistas, and scenic backdrops that naturally frame the vehicle as the hero.</p>
          </div>
        } />
      </div>
      {/* Items card */}
      <div className="rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-white overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="flex flex-col gap-[10px] px-[14px] py-[12px]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-tertiary)] mb-[8px]">
              Backgrounds · {selectedIds.length} selected
            </p>
            <div className="flex gap-[10px] overflow-x-auto pb-2">
              {SCENE_BACKGROUNDS.map(bg => {
                const isSelected = selectedIds.includes(bg.id);
                return (
                  <button key={bg.id} onClick={() => toggle(bg.id)}
                    className="group flex-none flex flex-col items-center gap-[4px] cursor-pointer"
                    style={{ width: 200 }}>
                    <div className="relative w-[200px] h-[133px] rounded-[10px] overflow-hidden transition-all"
                      style={{
                        outline: isSelected ? "2px solid var(--brand-accent)" : "2px solid transparent",
                        outlineOffset: 1,
                        boxShadow: isSelected ? "0 0 0 3px rgba(71,59,171,0.15)" : "none",
                      }}>
                      <img src={bg.thumbnail} alt={bg.name} className="w-full h-full object-cover" />

                      {/* Checkbox — top left */}
                      <div
                        className="absolute top-[6px] left-[6px] z-10 flex items-center justify-center rounded-[4px] transition-all duration-150"
                        style={{
                          width: 18, height: 18,
                          background: isSelected ? "var(--brand-accent)" : "rgba(255,255,255,0.88)",
                          border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.28)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                        }}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} className="text-white" />}
                      </div>

                      {/* Preview button — top right, visible on hover */}
                      <button
                        className="absolute top-[6px] right-[6px] z-10 w-[26px] h-[26px] rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => { e.stopPropagation(); setPreviewBg(bg.thumbnail); }}
                        title="Preview"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="white" strokeWidth="1.8"/>
                          <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.8"/>
                        </svg>
                      </button>
                    </div>
                    <span className="text-[9px] text-[var(--ink-secondary)] text-center leading-tight truncate w-full">
                      {bg.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-[8px] pt-[2px]">
            <button onClick={() => { onApply(selectedIds); setApplied(true); }}
              disabled={selectedIds.length === 0}
              className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer disabled:opacity-40"
              style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}>
              Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ""}background{selectedIds.length !== 1 ? "s" : ""}
            </button>
            <button onClick={onDismiss}
              className="px-[14px] py-[8px] rounded-full text-[13px] text-[var(--ink-secondary)] hover:bg-black/5 transition-colors cursor-pointer">
              Skip
            </button>
          </div>
        </div>
      </div>
      {previewBg && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75"
          onClick={() => setPreviewBg(null)}
          onKeyDown={e => e.key === 'Escape' && setPreviewBg(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[85vh] rounded-[12px] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={previewBg}
              alt="Background preview"
              className="block max-w-[90vw] max-h-[85vh] object-contain"
            />
            <button
              className="absolute top-[10px] right-[10px] w-[32px] h-[32px] rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              onClick={() => setPreviewBg(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>,
        document.body,
      )}
    </motion.div>
  );
}

// ─── Share Chooser Card ───────────────────────────────────────────────────────

function ShareChooserCard({
  input,
  projectName,
  applied,
  onChooseEmail,
  onChoosePlatform,
}: {
  input: ShareInput;
  projectName: string;
  applied: boolean;
  onChooseEmail: (recipientHint: string) => void;
  onChoosePlatform: (recipientName: string) => void;
}) {

  const recipient = input.recipient_hint || "the recipient";
  const firstName = recipient.split(" ")[0];

  // If the agent already specified a mechanism, skip the chooser and fire immediately
  const [chosen, setChosen] = useState<"email" | "platform" | null>(
    input.mechanism ?? null,
  );

  // Auto-fire effect when mechanism is pre-selected by the agent
  const firedRef = useRef(false);
  useEffect(() => {
    if (input.mechanism && !firedRef.current) {
      firedRef.current = true;
      if (input.mechanism === "email") {
        onChooseEmail(recipient);
      } else {
        onChoosePlatform(recipient);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (chosen === "email") {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`Opening email share for ${firstName}…`} />
      </div>
    );
  }

  if (chosen === "platform") {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`Platform notification sent to ${firstName}`} />
      </div>
    );
  }

  // ── Grouped contacts mode (from ReviewerPickerCard) ─────────────────────────
  if (input.selectedContacts && input.selectedContacts.length > 0) {
    const emailContacts = input.selectedContacts.filter(c => c.group !== "dealer");
    const platformContacts = input.selectedContacts.filter(c => c.group === "dealer");

    const handleGroupedConfirm = () => {
      setChosen("email"); // mark as applied
      if (emailContacts.length > 0) onChooseEmail(emailContacts.map(c => c.name).join(", "));
      if (platformContacts.length > 0) onChoosePlatform(platformContacts.map(c => c.name).join(", "));
    };

    const ContactRow = ({ contact, method, color }: { contact: typeof input.selectedContacts[number]; method: string; color: string }) => (
      <div className="flex items-center gap-[8px] py-[5px]">
        <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
          style={{ background: color }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: "white" }}>
            {contact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </span>
        </div>
        <span style={{ fontSize: 12, color: "var(--ink)", flex: 1 }}>{contact.name}</span>
        <span style={{ fontSize: 10, color: "var(--ink-tertiary)", background: "rgba(0,0,0,0.06)", borderRadius: 4, padding: "1px 6px" }}>{method}</span>
      </div>
    );

    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.10)] bg-white overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 360 }}>

        <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Ready to send</p>
          <p style={{ fontSize: 10.5, color: "var(--ink-tertiary)", lineHeight: 1.4 }}>Here's how each reviewer will be notified.</p>
        </div>

        <div className="px-[14px] py-[10px] flex flex-col">
          {emailContacts.length > 0 && (
            <div className="mb-[6px]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#c4c1d0] mb-[3px]">Via Email</p>
              {emailContacts.map(c => <ContactRow key={c.email} contact={c} method="Email" color="var(--brand-accent)" />)}
            </div>
          )}
          {platformContacts.length > 0 && (
            <div className="mb-[6px]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#c4c1d0] mb-[3px]">Via Platform</p>
              {platformContacts.map(c => <ContactRow key={c.email} contact={c} method="Platform" color="#0d7a5f" />)}
            </div>
          )}
          <button
            onClick={handleGroupedConfirm}
            className="mt-[6px] py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white"
            style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)", cursor: "pointer" }}>
            Confirm & Send
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.10)] bg-white overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
        <p style={{ fontSize: 11, color: "var(--ink-secondary)", lineHeight: 1.5 }}>
          How would you like to send to{" "}
          <strong style={{ color: "var(--ink)" }}>{recipient}</strong>?
        </p>
      </div>

      <div className="flex flex-col gap-[8px] px-[14px] py-[12px]">
        {/* Email option */}
        <button
          onClick={() => { setChosen("email"); onChooseEmail(input.recipient_hint); }}
          className="flex items-center gap-[10px] px-[12px] py-[10px] rounded-[10px] border border-[rgba(0,0,0,0.10)] bg-white hover:bg-[#f5f4ff] hover:border-[rgba(99,86,225,0.35)] text-left transition-all group"
          style={{ cursor: "pointer" }}
        >
          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(99,86,225,0.10)" }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="5" width="16" height="11" rx="2" stroke="var(--brand-mid)" strokeWidth="1.5"/>
              <path d="M2 7l8 5 8-5" stroke="var(--brand-mid)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>Send via Email</p>
            <p style={{ fontSize: 10.5, color: "var(--ink-tertiary)" }}>Share a project link by email</p>
          </div>
          <ChevronDown size={13} strokeWidth={1.5} style={{ color: "var(--ink-tertiary)", transform: "rotate(-90deg)", flexShrink: 0 }} />
        </button>

        {/* Platform Communications option */}
        <button
          onClick={() => { setChosen("platform"); onChoosePlatform(input.recipient_hint); }}
          className="flex items-center gap-[10px] px-[12px] py-[10px] rounded-[10px] border border-[rgba(0,0,0,0.10)] bg-white hover:bg-[#f0faf7] hover:border-[rgba(13,122,95,0.35)] text-left transition-all group"
          style={{ cursor: "pointer" }}
        >
          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(13,122,95,0.10)" }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 2.5C7.1 2.5 4.7 4.7 4.7 7.5V11.5L3 13v.5h14V13l-1.7-1.5V7.5C15.3 4.7 12.9 2.5 10 2.5Z" stroke="#0d7a5f" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 13.5c0 1.1.9 2 2 2s2-.9 2-2" stroke="#0d7a5f" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>Platform Communications</p>
            <p style={{ fontSize: 10.5, color: "var(--ink-tertiary)" }}>Send an in-app notification</p>
          </div>
          <ChevronDown size={13} strokeWidth={1.5} style={{ color: "var(--ink-tertiary)", transform: "rotate(-90deg)", flexShrink: 0 }} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Task Owners Proposal Card ────────────────────────────────────────────────

const TASK_SECTIONS = [
  { id: "offers",      label: "Offers" },
  { id: "templates",   label: "Templates" },
  { id: "platforms",   label: "Platforms" },
  { id: "backgrounds", label: "Backgrounds" },
  { id: "brand",       label: "Theme & Logos" },
  { id: "assets",      label: "Assets" },
  { id: "adshells",    label: "Ad Shells" },
  { id: "campaigns",   label: "Campaigns" },
];

function TaskOwnersProposalCard({
  input,
  liveOwners,
  onApply,
}: {
  input: TaskOwnersInput;
  liveOwners?: Record<string, string>;
  onApply: (owners: Record<string, string>) => void;
}) {

  // Seed from agent suggestions if no live owners set yet
  const seededOwners = useMemo(() => {
    const seed: Record<string, string> = {};
    (input.suggested_owners ?? []).forEach(({ section, name }) => {
      const match = PROJECT_OWNERS.find(o =>
        o.name.toLowerCase().includes(name.toLowerCase())
      );
      if (match) seed[section] = match.id;
    });
    return seed;
  }, [input.suggested_owners]);

  // Merge agent suggestions with live owners from context
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = { ...seededOwners };
    if (input.owners) {
      Object.entries(input.owners).forEach(([section, name]) => {
        const owner = PROJECT_OWNERS.find(o =>
          o.name.toLowerCase().includes(name.toLowerCase())
        );
        if (owner) base[section] = owner.id;
      });
    }
    // Live owners take final priority
    Object.assign(base, liveOwners);
    return base;
  });

  const [applied, setApplied] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [dropCoords, setDropCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const openDropdown = (sectionId: string) => {
    const btn = triggerRefs.current[sectionId];
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setDropCoords({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpenSection(sectionId);
  };

  const handleConfirm = () => {
    onApply(selections);
    setApplied(true);
  };

  if (applied) {
    const count = Object.keys(selections).length;
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`Task owners set for ${count} section${count !== 1 ? "s" : ""}`} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.10)] bg-white overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      {/* Header */}
      <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>Assign Task Owners</p>
        <p style={{ fontSize: 10.5, color: "var(--ink-tertiary)", marginTop: 2 }}>{input.suggested_owners?.length ? "Based on your team and recent campaigns, I'm proposing these task owners for your review." : "Choose a responsible owner for each section."}</p>
      </div>

      {/* Section rows */}
      <div className="flex flex-col divide-y divide-[rgba(0,0,0,0.05)]">
        {TASK_SECTIONS.map(({ id, label }) => {
          const ownerId = selections[id];
          const owner = PROJECT_OWNERS.find(o => o.id === ownerId);
          return (
            <div key={id} className="flex items-center gap-[10px] px-[14px] py-[8px]">
              <span style={{ fontSize: 12, color: "var(--ink-secondary)", flex: 1 }}>{label}</span>
              <button
                ref={el => { triggerRefs.current[id] = el; }}
                onClick={() => openDropdown(id)}
                className="flex items-center gap-[6px] px-[8px] py-[4px] rounded-[8px] border border-[rgba(0,0,0,0.10)] bg-[#F9FAFA] hover:border-[var(--brand-accent)] hover:bg-[#f5f4ff] transition-all cursor-pointer min-w-[130px] text-left"
              >
                {owner ? (
                  <>
                    {owner.avatar
                      ? <img src={owner.avatar} alt={owner.name} className="w-[16px] h-[16px] rounded-full object-cover shrink-0" />
                      : <AvatarInitials initials={owner.initials} size={16} bgColor={owner.color} />
                    }
                    <span style={{ fontSize: 11, color: "var(--ink)", flex: 1 }}>{owner.name.split(" ")[0]}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--ink-tertiary)", flex: 1 }}>Unassigned</span>
                )}
                <ChevronDown size={11} strokeWidth={1.5} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-[14px] py-[10px] border-t border-[rgba(0,0,0,0.06)] flex justify-end">
        <button
          onClick={handleConfirm}
          className="flex items-center gap-[6px] px-[14px] py-[7px] rounded-full text-white text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--brand-mid) 0%, #8B5CF6 100%)" }}
        >
          Apply Task Owners
        </button>
      </div>

      {/* Portal dropdown */}
      {createPortal(
        <AnimatePresence>
          {openSection && dropCoords && (
            <>
              <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpenSection(null)} />
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                style={{ position: "fixed", top: dropCoords.top, left: dropCoords.left, minWidth: dropCoords.width, zIndex: 9999 }}
                className="bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.10)] py-1"
              >
                <button
                  onClick={() => { setSelections(p => { const n = { ...p }; delete n[openSection]; return n; }); setOpenSection(null); }}
                  className="w-full flex items-center gap-[8px] px-[10px] py-[7px] text-[12px] text-[var(--ink-tertiary)] hover:bg-[#F4F5F6] cursor-pointer"
                >
                  <span className="w-[16px] h-[16px] flex-shrink-0" />
                  Unassigned
                  {!selections[openSection] && <Check size={11} className="ml-auto text-[var(--brand-accent)]" />}
                </button>
                {PROJECT_OWNERS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => { setSelections(p => ({ ...p, [openSection]: o.id })); setOpenSection(null); }}
                    className="w-full flex items-center gap-[8px] px-[10px] py-[7px] text-[12px] text-[var(--ink)] hover:bg-[#F4F5F6] cursor-pointer"
                  >
                    {o.avatar
                      ? <img src={o.avatar} alt={o.name} className="w-[16px] h-[16px] rounded-full object-cover shrink-0" />
                      : <AvatarInitials initials={o.initials} size={16} bgColor={o.color} />
                    }
                    <span style={{ flex: 1 }}>{o.name}</span>
                    {selections[openSection] === o.id && <Check size={11} className="text-[var(--brand-accent)]" />}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}

// ─── Notify Owners Card ───────────────────────────────────────────────────────

function NotifyOwnersCard({
  liveOwners,
  projectName,
  onApply,
}: {
  liveOwners?: Record<string, string>;
  projectName: string;
  onApply: () => void;
}) {

  const [chosen, setChosen] = useState<"email" | "platform" | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resolve owner IDs or names → PROJECT_OWNERS entries
  const resolvedOwners = useMemo(() => {
    const map = liveOwners ?? {};
    const seen = new Set<string>();
    return Object.entries(map)
      .map(([section, idOrName]) => {
        // Try ID lookup first (ProjectsModule stores IDs), then name lookup (agent hints)
        const owner = PROJECT_OWNERS.find(o => o.id === idOrName)
          ?? PROJECT_OWNERS.find(o => o.name.toLowerCase() === idOrName.toLowerCase());
        if (!owner || seen.has(owner.id)) return null;
        seen.add(owner.id);
        return { section, owner };
      })
      .filter((x): x is { section: string; owner: typeof PROJECT_OWNERS[number] } => x !== null);
  }, [liveOwners]);

  // Default email body
  useEffect(() => {
    setMessage(
      `Hi team,\n\nI'd like to share the project "${projectName}" with you for your review and action.\n\nPlease find the project link below:\n\nhttps://constellation-ux-app.vercel.app/OEM/Projects\n\nThank you!`
    );
  }, [projectName]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [message, chosen]);

  if (resolvedOwners.length === 0) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label="No task owners assigned yet" />
      </div>
    );
  }

  // ── Platform confirmed ──
  if (chosen === "platform") {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.10)] bg-white overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#f0faf7]">
          <div className="flex items-center gap-[7px]">
            <div className="w-4 h-4 rounded-full bg-[#0d7a5f] flex items-center justify-center shrink-0">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#0d7a5f" }}>Task owners notified via platform</p>
          </div>
        </div>
        <div className="flex flex-col gap-[2px] px-[14px] py-[10px]">
          {resolvedOwners.map(({ section, owner }) => (
            <div key={owner.id} className="flex items-center gap-[8px] py-[4px]">
              {owner.avatar
                ? <img src={owner.avatar} alt={owner.name} className="w-[22px] h-[22px] rounded-full object-cover shrink-0" />
                : <AvatarInitials initials={owner.initials} size={22} bgColor={owner.color} />
              }
              <span style={{ fontSize: 12, color: "var(--ink)" }}>{owner.name}</span>
              <span style={{ fontSize: 10.5, color: "var(--ink-tertiary)", textTransform: "capitalize" }}>{section}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ── Email compose + sent state ──
  if (chosen === "email") {
    if (emailSent) {
      const names = resolvedOwners.map(({ owner }) => owner.name.split(" ")[0]).join(", ");
      return (
        <div className="ml-[32px] mt-[4px]">
          <ConfirmedChip label={`Email sent to ${names}`} />
        </div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.10)] bg-white overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {/* Header */}
        <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa] flex items-center justify-between">
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>Email to task owners</p>
          <button onClick={() => setChosen(null)} className="text-[var(--ink-tertiary)] hover:text-[var(--ink)] transition-colors cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="px-[14px] py-[12px] flex flex-col gap-[10px]">
          {/* Recipients */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-tertiary)", marginBottom: 6 }}>To</p>
            <div className="flex flex-wrap gap-[5px]">
              {resolvedOwners.map(({ owner }) => (
                <div key={owner.id} className="flex items-center gap-[5px] px-[8px] py-[3px] rounded-full bg-[#F4F5F6]">
                  {owner.avatar
                    ? <img src={owner.avatar} alt={owner.name} className="w-[14px] h-[14px] rounded-full object-cover shrink-0" />
                    : <AvatarInitials initials={owner.initials} size={14} bgColor={owner.color} />
                  }
                  <span style={{ fontSize: 11, color: "var(--ink)" }}>{owner.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-tertiary)", marginBottom: 6 }}>Subject</p>
            <p style={{ fontSize: 12, color: "var(--ink)" }}>Project shared: {projectName}</p>
          </div>

          {/* Message body */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-tertiary)", marginBottom: 6 }}>Message</p>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none text-[12px] text-[var(--ink)] bg-[#F9FAFA] border border-[#E4E4E8] rounded-[8px] px-[10px] py-[8px] outline-none focus:border-[var(--brand-accent)] transition-colors overflow-hidden"
              style={{ minHeight: 80 }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => { onApply(); setEmailSent(true); }}
            className="self-end flex items-center gap-[6px] px-[14px] py-[7px] rounded-full text-white text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--brand-mid) 0%, #8B5CF6 100%)" }}
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
              <path d="M3 10l14-7-7 14V10H3z" fill="white"/>
            </svg>
            Send to all
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Choice card ──
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.10)] bg-white overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
        <p style={{ fontSize: 11, color: "var(--ink-secondary)", lineHeight: 1.5 }}>
          Notify <strong style={{ color: "var(--ink)" }}>{resolvedOwners.length} task owner{resolvedOwners.length !== 1 ? "s" : ""}</strong>. How would you like to send?
        </p>
      </div>

      <div className="flex flex-col gap-[8px] px-[14px] py-[12px]">
        {/* Email option */}
        <button
          onClick={() => setChosen("email")}
          className="flex items-center gap-[10px] px-[12px] py-[10px] rounded-[10px] border border-[rgba(0,0,0,0.10)] bg-white hover:bg-[#f5f4ff] hover:border-[rgba(99,86,225,0.35)] text-left transition-all cursor-pointer"
        >
          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(99,86,225,0.10)" }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="5" width="16" height="11" rx="2" stroke="var(--brand-mid)" strokeWidth="1.5"/>
              <path d="M2 7l8 5 8-5" stroke="var(--brand-mid)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>Send via Email</p>
            <p style={{ fontSize: 10.5, color: "var(--ink-tertiary)" }}>One email to all task owners</p>
          </div>
          <ChevronDown size={13} strokeWidth={1.5} style={{ color: "var(--ink-tertiary)", transform: "rotate(-90deg)", flexShrink: 0 }} />
        </button>

        {/* Platform option */}
        <button
          onClick={() => { setChosen("platform"); onApply(); }}
          className="flex items-center gap-[10px] px-[12px] py-[10px] rounded-[10px] border border-[rgba(0,0,0,0.10)] bg-white hover:bg-[#f0faf7] hover:border-[rgba(13,122,95,0.35)] text-left transition-all cursor-pointer"
        >
          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(13,122,95,0.10)" }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 2.5C7.1 2.5 4.7 4.7 4.7 7.5V11.5L3 13v.5h14V13l-1.7-1.5V7.5C15.3 4.7 12.9 2.5 10 2.5Z" stroke="#0d7a5f" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 13.5c0 1.1.9 2 2 2s2-.9 2-2" stroke="#0d7a5f" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>Platform Communications</p>
            <p style={{ fontSize: 10.5, color: "var(--ink-tertiary)" }}>In-app notification to all owners</p>
          </div>
          <ChevronDown size={13} strokeWidth={1.5} style={{ color: "var(--ink-tertiary)", transform: "rotate(-90deg)", flexShrink: 0 }} />
        </button>
      </div>

      {/* Owner preview */}
      <div className="px-[14px] pb-[10px] flex flex-wrap gap-[4px]">
        {resolvedOwners.map(({ section, owner }) => (
          <div key={owner.id} className="flex items-center gap-[4px] px-[7px] py-[3px] rounded-full bg-[#F4F5F6]">
            {owner.avatar
              ? <img src={owner.avatar} alt={owner.name} className="w-[14px] h-[14px] rounded-full object-cover shrink-0" />
              : <AvatarInitials initials={owner.initials} size={14} bgColor={owner.color} />
            }
            <span style={{ fontSize: 11, color: "var(--ink)" }}>{owner.name.split(" ")[0]}</span>
            <span style={{ fontSize: 10, color: "var(--ink-tertiary)", textTransform: "capitalize" }}>· {section}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Email Proposal Card ──────────────────────────────────────────────────────

interface EmailCardProps {
  input: EmailInput;
  projectName: string;
  onApply: (recipient: string, message: string) => void;
  onDismiss: () => void;
}

function EmailProposalCard({ input, projectName, onApply, onDismiss }: EmailCardProps) {

  const labelCls = "text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-tertiary)] mb-[6px]";
  const hint = (input.recipient_hint ?? "").trim();

  // Find known contact
  const knownContact = hint
    ? MOCK_CONTACTS.find(c =>
        c.name.toLowerCase().includes(hint.toLowerCase()) ||
        c.email.toLowerCase().includes(hint.toLowerCase()))
    : undefined;

  const isUnknownRecipient = !!hint && !knownContact;

  // State
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(
    () => knownContact ? new Set([knownContact.email]) : new Set()
  );
  const [unknownEmail, setUnknownEmail] = useState("");
  const [message, setMessage] = useState(input.message);
  const [applied, setApplied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [message]);

  const toggleContact = (email: string) =>
    setSelectedEmails(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });

  // Determine recipient label for confirmed chip
  const getRecipientLabel = () => {
    if (isUnknownRecipient) return unknownEmail || hint;
    if (knownContact) return knownContact.name.split(" ")[0];
    return MOCK_CONTACTS.filter(c => selectedEmails.has(c.email)).map(c => c.name.split(" ")[0]).join(", ") || "recipient";
  };

  if (applied) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`Email sent to ${getRecipientLabel()}`} />
      </div>
    );
  }

  const canSend = isUnknownRecipient ? unknownEmail.includes("@") : knownContact ? true : selectedEmails.size > 0;

  const handleSend = () => {
    const recipient = isUnknownRecipient ? unknownEmail : knownContact ? knownContact.email : [...selectedEmails].join(", ");
    onApply(recipient, message);
    setApplied(true);
  };

  const groupLabelCls = "text-[9px] font-semibold uppercase tracking-[0.08em] text-[#c4c1d0] px-[2px] mb-[3px] mt-[6px] first:mt-0";
  const CONTACT_GROUPS = [
    { key: "constellation" as const, label: "Constellation" },
    { key: "dealer" as const, label: "Dealer" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-white overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      {/* Header */}
      <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
        <p style={{ fontSize: 11, color: "var(--ink-secondary)", lineHeight: 1.5 }}>
          Sharing project link for <strong style={{ color: "var(--ink)" }}>{projectName}</strong>
        </p>
      </div>

      <div className="flex flex-col gap-[10px] px-[14px] py-[12px]">

        {/* ── Recipient section ── */}
        <div>
          <p className={labelCls}>Send to</p>

          {/* Mode A: known contact — single row, pre-selected */}
          {knownContact && (
            <div className="flex items-center gap-[8px] px-[10px] py-[8px] rounded-[8px]"
              style={{ background: "rgba(71,59,171,0.08)", outline: "1.5px solid rgba(71,59,171,0.35)" }}>
              <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0"
                style={{ background: knownContact.group === "constellation" ? "var(--brand-accent)" : "#0d7a5f" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "white" }}>
                  {knownContact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>{knownContact.name}</p>
                <p style={{ fontSize: 10, color: "var(--ink-tertiary)" }} className="truncate">{knownContact.email}</p>
              </div>
              <Check size={13} strokeWidth={2.5} className="text-[var(--brand-accent)] shrink-0" />
            </div>
          )}

          {/* Mode B: unknown recipient — ask for email */}
          {isUnknownRecipient && (
            <div className="flex flex-col gap-[6px]">
              <p style={{ fontSize: 11.5, color: "var(--ink-secondary)", lineHeight: 1.5 }}>
                I don't have <strong style={{ color: "var(--ink)" }}>"{hint}"</strong> in my contacts.
              </p>
              <input
                type="email"
                value={unknownEmail}
                onChange={e => setUnknownEmail(e.target.value)}
                placeholder="their@email.com"
                className="w-full px-[10px] py-[7px] rounded-[8px] text-[12px] text-[var(--ink)] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none focus:border-[var(--brand-accent)] transition-all"
              />
            </div>
          )}

          {/* Mode C: no hint — full grouped contact list */}
          {!hint && (
            <div className="flex flex-col">
              {CONTACT_GROUPS.map(group => {
                const contacts = MOCK_CONTACTS.filter(c => c.group === group.key);
                return (
                  <div key={group.key}>
                    <p className={groupLabelCls}>{group.label}</p>
                    <div className="flex flex-col gap-[3px] mb-[4px]">
                      {contacts.map(c => {
                        const isSelected = selectedEmails.has(c.email);
                        const avatarBg = group.key === "constellation" ? "var(--brand-accent)" : "#0d7a5f";
                        return (
                          <button key={c.email} onClick={() => toggleContact(c.email)}
                            className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[8px] transition-all cursor-pointer text-left w-full"
                            style={{ background: isSelected ? "rgba(71,59,171,0.08)" : "#f5f4f8", outline: isSelected ? "1.5px solid rgba(71,59,171,0.35)" : "1.5px solid transparent" }}>
                            <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0" style={{ background: avatarBg }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>
                                {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>{c.name}</p>
                              <p style={{ fontSize: 10, color: "var(--ink-tertiary)" }} className="truncate">{c.email}</p>
                            </div>
                            {isSelected && <Check size={12} strokeWidth={2.5} className="text-[var(--brand-accent)] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message editor */}
        <div>
          <p className={labelCls}>Message</p>
          <textarea ref={textareaRef} value={message} onChange={e => setMessage(e.target.value)}
            rows={1}
            className="w-full px-[10px] py-[8px] rounded-[8px] text-[12px] text-[var(--ink)] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none focus:border-[var(--brand-accent)] transition-all resize-none leading-relaxed overflow-hidden"
            style={{ minHeight: 36 }} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-[8px] pt-[2px]">
          <button onClick={handleSend} disabled={!canSend}
            className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}>
            Send email
          </button>
          <button onClick={onDismiss}
            className="px-[14px] py-[8px] rounded-full text-[13px] text-[var(--ink-secondary)] hover:bg-black/5 transition-colors cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Smart Proposal Card ───────────────────────────────────────────────────────
interface SmartProposalCardProps {
  input: ProposalInput;
  context: ProjectContextPayload | null;
  onApply: (offerIds: string[], templateIds: string[], name?: string) => void;
  onDismiss: () => void;
}

function SmartProposalCard({ input, context, onApply, onDismiss }: SmartProposalCardProps) {
  const [name,        setName]        = useState(input.project_name ?? "");
  const [startDate,   setStartDate]   = useState(input.start_date ?? "");
  const [endDate,     setEndDate]     = useState(input.end_date ?? "");
  const [offerIds,    setOfferIds]    = useState<string[]>(input.offer_ids);
  const [templateIds, setTemplateIds] = useState<string[]>(input.template_ids);
  const [applied,     setApplied]     = useState(false);

  const offers    = context?.availableOffers    ?? [];
  const templates = context?.availableTemplates ?? [];

  const handleApply = () => {
    onApply(offerIds, templateIds, name || undefined);
    setApplied(true);
  };

  if (applied) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`${offerIds.length} offer${offerIds.length !== 1 ? "s" : ""} + ${templateIds.length} template${templateIds.length !== 1 ? "s" : ""} added to project`} />
      </div>
    );
  }

  const inputCls = "w-full px-[10px] py-[7px] rounded-[8px] text-[12px] text-[var(--ink)] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)] transition-all";
  const labelCls = "text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-tertiary)] mb-[4px]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-white overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* Header strip */}
      <div className="px-[14px] pt-[12px] pb-[10px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
        <p className="text-[11px] text-[var(--ink-secondary)] leading-[1.5] tracking-[0.17px]">
          {input.rationale}
        </p>
      </div>

      <div className="flex flex-col gap-[12px] px-[14px] py-[12px]">

        {/* Project name */}
        {(input.project_name || context?.projectId === "") && (
          <div>
            <p className={labelCls}>Project name</p>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Honda Summer Lease 2026"
              className={inputCls}
            />
          </div>
        )}

        {/* Date range */}
        {(startDate || endDate) && (
          <div className="flex gap-[8px]">
            <div className="flex-1">
              <p className={labelCls}>Start date</p>
              <input type="text" value={startDate} onChange={e => setStartDate(e.target.value)}
                className={inputCls} />
            </div>
            <div className="flex-1">
              <p className={labelCls}>End date</p>
              <input type="text" value={endDate} onChange={e => setEndDate(e.target.value)}
                className={inputCls} />
            </div>
          </div>
        )}

        {/* Proposed offers */}
        <div>
          <div className="flex items-center justify-between mb-[6px]">
            <p className={labelCls}>
              Offers · {offerIds.length} selected
            </p>
          </div>
          <div className="flex flex-col gap-[4px]">
            {offerIds.map(id => {
              const o = offers.find(x => x.id === id);
              return (
                <div key={id} className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[8px] bg-[#f5f4f8] group">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[var(--ink)] truncate">
                      {o ? `${o.year} ${o.make} ${o.model} ${o.trim}` : id}
                    </p>
                    {o && (
                      <p className="text-[10.5px] text-[var(--ink-secondary)] mt-[1px]">
                        {o.offerType} · ${o.monthlyPayment}/mo · PVI {o.pvi} · {o.aging}d aging
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setOfferIds(prev => prev.filter(x => x !== id))}
                    className="opacity-0 group-hover:opacity-100 text-[var(--ink-tertiary)] hover:text-[#dc2626] transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 size={12} strokeWidth={1.7} />
                  </button>
                </div>
              );
            })}
            {/* Add more selector */}
            {offers.filter(o => !offerIds.includes(o.id)).length > 0 && (
              <div className="relative mt-[2px]">
                <select
                  value=""
                  onChange={e => { if (e.target.value) setOfferIds(prev => [...prev, e.target.value]); }}
                  className="w-full px-[10px] py-[6px] rounded-[8px] text-[11px] text-[var(--brand-accent)] border border-dashed border-[rgba(71,59,171,0.35)] bg-transparent cursor-pointer outline-none appearance-none"
                >
                  <option value="">+ Add another offer…</option>
                  {offers.filter(o => !offerIds.includes(o.id)).map(o => (
                    <option key={o.id} value={o.id}>
                      {o.year} {o.make} {o.model} {o.trim} — {o.offerType} ${o.monthlyPayment}/mo
                    </option>
                  ))}
                </select>
                <Plus size={10} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[var(--brand-accent)] pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Proposed templates */}
        <div>
          <div className="flex items-center justify-between mb-[6px]">
            <p className={labelCls}>
              Templates · {templateIds.length} selected
            </p>
          </div>
          <div className="flex flex-col gap-[4px]">
            {templateIds.map(id => {
              const t = templates.find(x => x.id === id);
              return (
                <div key={id} className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[8px] bg-[#f5f4f8] group">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[var(--ink)] truncate">
                      {t ? t.name : id}
                    </p>
                    {t && (
                      <p className="text-[10.5px] text-[var(--ink-secondary)] mt-[1px]">
                        {t.format} · {t.width}×{t.height} · {t.brand}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setTemplateIds(prev => prev.filter(x => x !== id))}
                    className="opacity-0 group-hover:opacity-100 text-[var(--ink-tertiary)] hover:text-[#dc2626] transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 size={12} strokeWidth={1.7} />
                  </button>
                </div>
              );
            })}
            {templates.filter(t => !templateIds.includes(t.id)).length > 0 && (
              <div className="relative mt-[2px]">
                <select
                  value=""
                  onChange={e => { if (e.target.value) setTemplateIds(prev => [...prev, e.target.value]); }}
                  className="w-full px-[10px] py-[6px] rounded-[8px] text-[11px] text-[var(--brand-accent)] border border-dashed border-[rgba(71,59,171,0.35)] bg-transparent cursor-pointer outline-none appearance-none"
                >
                  <option value="">+ Add another template…</option>
                  {templates.filter(t => !templateIds.includes(t.id)).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.format}
                    </option>
                  ))}
                </select>
                <Plus size={10} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[var(--brand-accent)] pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-[8px] pt-[2px]">
          <button
            onClick={handleApply}
            disabled={offerIds.length === 0 && templateIds.length === 0}
            className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
          >
            Apply to project
          </button>
          <button
            onClick={onDismiss}
            className="px-[14px] py-[8px] rounded-full text-[13px] text-[var(--ink-secondary)] hover:bg-black/5 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Ad Preview Card ───────────────────────────────────────────────────────────
const BRAND_COLORS: Record<string, string> = {
  Honda: "#CC0000", BMW: "#0066B1", Volkswagen: "#001E50",
  Audi: "#B30000", Toyota: "#EB0A1E", Ford: "#003478",
  Hyundai: "#002C5F", Kia: "#05141F", Chevrolet: "#D1A600",
};

function AdPreviewCard({ offer, template }: {
  offer: { id: string; year: string; make: string; model: string; trim: string; offerType: string; monthlyPayment: number; term: number; pvi: number; aging: number; stock: number };
  template?: { id: string; name: string; format: string; width: number; height: number; brand: string };
}) {
  const brandColor = BRAND_COLORS[offer.make] ?? "var(--brand-accent)";

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10, scale: 0.96 },
        show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.26, ease: "easeOut" } },
      }}
      className="relative flex-none rounded-[10px] overflow-hidden select-none"
      style={{ width: 148, height: 168, background: "linear-gradient(145deg, #e9e9e9 0%, #d6d6d6 100%)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
    >
      {/* Draft chip */}
      <div className="absolute top-[5px] right-[5px] z-10 flex items-center gap-[3px] px-[5px] py-[2px] rounded-full"
        style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(4px)" }}>
        <div className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--ink-tertiary)" }} />
        <span style={{ fontSize: 8, fontWeight: 600, color: "var(--ink-secondary)", letterSpacing: "0.3px" }}>Draft</span>
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-[7px] py-[5px]"
        style={{ background: "rgba(0,0,0,0.52)" }}>
        <span style={{ fontSize: 7.5, fontWeight: 500, color: "rgba(255,255,255,0.82)", letterSpacing: "0.2px" }}>
          {offer.make} Dealer
        </span>
        <span style={{ fontSize: 6.5, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "1px", textTransform: "uppercase" }}>
          {offer.make}
        </span>
      </div>

      {/* Car area — stylised placeholder */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 24, paddingBottom: 58 }}>
        <span style={{ fontSize: 34, fontWeight: 900, color: brandColor, opacity: 0.12, letterSpacing: -1, userSelect: "none" }}>
          {offer.make.substring(0, 3).toUpperCase()}
        </span>
        <svg width="88" height="38" viewBox="0 0 88 38" fill="none" className="absolute" style={{ opacity: 0.38 }}>
          <path d="M70 18H18L23 8H65L70 18Z" fill={brandColor} />
          <rect x="8" y="18" width="72" height="9" rx="3" fill={brandColor} />
          <circle cx="22" cy="30" r="6" fill={brandColor} />
          <circle cx="66" cy="30" r="6" fill={brandColor} />
          <circle cx="22" cy="30" r="2.8" fill="#d8d8d8" />
          <circle cx="66" cy="30" r="2.8" fill="#d8d8d8" />
          <rect x="26" y="9" width="22" height="8" rx="1.5" fill={brandColor} opacity="0.5" />
          <rect x="51" y="9" width="12" height="8" rx="1.5" fill={brandColor} opacity="0.5" />
        </svg>
      </div>

      {/* Bottom offer bar */}
      <div className="absolute bottom-0 left-0 right-0 px-[7px] pt-[7px] pb-[7px]"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.62) 100%)" }}>
        <p style={{ fontSize: 7, fontWeight: 500, color: "rgba(255,255,255,0.65)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 1 }}>
          {offer.offerType} · {offer.year} {offer.make} {offer.model}
        </p>
        <div className="flex items-baseline gap-[2px]">
          <span style={{ fontSize: 22, fontWeight: 700, color: "white", lineHeight: 1 }}>
            ${offer.monthlyPayment}
          </span>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.6)" }}>/mo</span>
        </div>
        <p style={{ fontSize: 6.5, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>
          {offer.term}mo · {offer.trim}
        </p>
      </div>

      {template && (
        <div className="absolute top-[20px] left-[5px]">
          <span style={{ fontSize: 7, fontWeight: 600, color: "white", background: "rgba(71,59,171,0.82)", padding: "2px 5px", borderRadius: 4, letterSpacing: "0.3px" }}>
            {template.width}×{template.height}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Preview Strip ─────────────────────────────────────────────────────────────
function PreviewStrip({ msg, context }: { msg: PreviewMsg; context: ProjectContextPayload | null }) {
  const [open, setOpen] = useState(true);

  const offers    = context?.availableOffers    ?? [];
  const templates = context?.availableTemplates ?? [];
  const selectedOffers    = msg.offerIds   .map(id => offers   .find(o => o.id === id)).filter(Boolean) as typeof offers;
  const selectedTemplates = msg.templateIds.map(id => templates.find(t => t.id === id)).filter(Boolean) as typeof templates;

  return (
    <div className="ml-[32px] mt-[6px]">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-[5px] mb-[8px] cursor-pointer group w-full text-left">
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={11} strokeWidth={2} className="text-[var(--ink-secondary)]" />
        </motion.div>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)" }}>
          Preview ({selectedOffers.length})
        </span>
        {selectedTemplates.length > 0 && (
          <span style={{ fontSize: 9.5, color: "var(--brand-accent)", background: "rgba(71,59,171,0.08)", padding: "1px 7px", borderRadius: 100, fontWeight: 500 }}>
            {selectedTemplates.length} template{selectedTemplates.length !== 1 ? "s" : ""}
          </span>
        )}
        <div className="flex-1" />
        <span style={{ fontSize: 9.5, color: "var(--ink-tertiary)" }} className="opacity-0 group-hover:opacity-100 transition-opacity">
          Details ↗
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="flex gap-[8px] overflow-x-auto pb-[6px]"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.22 } } }}
              initial="hidden"
              animate="show"
            >
              {selectedOffers.map((offer, i) => (
                <AdPreviewCard
                  key={offer.id}
                  offer={offer}
                  template={selectedTemplates.length > 0 ? selectedTemplates[i % selectedTemplates.length] : undefined}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ParsedOffersCard ─────────────────────────────────────────────────────────
// Offer rows extracted from a file — rendered as regular OfferCards (no metrics)
function ParsedOffersCard({
  input, applied, onApply, onDismiss,
}: {
  input: ParsedOffersInput;
  applied: boolean;
  onApply: (offers: CustomOffer[]) => void;
  onDismiss: () => void;
}) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    () => new Set(input.offers.map(o => o.id))
  );
  const [customizeMode, setCustomizeMode] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, {
    monthlyPayment: string; term: string; dueAtSigning: string;
  }>>({});
  const selectAllRef = useRef<HTMLInputElement>(null);

  const checkedCount = checkedIds.size;
  const allChecked  = checkedCount === input.offers.length;
  const someChecked = checkedCount > 0 && checkedCount < input.offers.length;

  // Seed customizations from parsed values when customize mode opens
  useEffect(() => {
    if (!customizeMode) return;
    setCustomizations(prev => {
      const next = { ...prev };
      for (const row of input.offers) {
        if (!next[row.id]) {
          next[row.id] = {
            monthlyPayment: row.monthly_payment ?? "0",
            term:           row.term ?? "36",
            dueAtSigning:   row.due_at_signing ?? "0",
          };
        }
      }
      return next;
    });
  }, [customizeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someChecked;
  }, [someChecked]);

  const toggleAll = () => {
    setCheckedIds(allChecked ? new Set() : new Set(input.offers.map(o => o.id)));
  };

  const toggleRow = (id: string, checked: boolean) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  /** Map a ParsedOfferRow to the OfferCard Offer shape (regular variant — pvi=0) */
  const toCardData = (row: ParsedOfferRow): OfferCardData => {
    const c = customizations[row.id];
    return {
    id: row.id,
    year:  row.year,
    make:  row.make,
    model: row.model,
    trim:  row.trim ?? "",
    image: resolveCarImage(row.make, row.model, row.trim ?? "", row.year),
    stock: 0,
    offerType: row.offer_type,
    tags:  row.apr ? [`${row.apr}% APR`] : [],
    pvi:   0,                              // forces "regular" variant
    aging: 0, sales: 0, inventory: 0,
    monthlyPayment:   parseFloat(c?.monthlyPayment ?? row.monthly_payment)    || 0,
    term:             parseInt(c?.term ?? row.term)                           || 0,
    totalDueAtSigning: parseFloat(c?.dueAtSigning ?? row.due_at_signing ?? "0") || 0,
  };
  };

  const handleApply = () => {
    const selected: CustomOffer[] = input.offers
      .filter(r => checkedIds.has(r.id))
      .map(r => {
        const c = customizations[r.id];
        return {
          id:             `custom-${r.id}-${Date.now()}`,
          year:           r.year,
          make:           r.make,
          model:          r.model,
          trim:           r.trim ?? "",
          offerType:      r.offer_type,
          monthlyPayment: c?.monthlyPayment ?? r.monthly_payment,
          term:           c?.term           ?? r.term,
          dueAtSigning:   c?.dueAtSigning   ?? r.due_at_signing ?? "0",
          apr:            r.apr,
          notes:          r.notes,
          image:          resolveCarImage(r.make, r.model, r.trim ?? "", r.year),
        };
      });
    onApply(selected);
  };

  if (applied) {
    return (
      <div className="ml-[32px]">
        <ConfirmedChip label={`${checkedCount} offer${checkedCount === 1 ? "" : "s"} added`} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      className="rounded-[12px] border border-[rgba(0,0,0,0.1)] bg-white"
      style={{ overflow: "clip" }}
    >
      {/* Header */}
      <div className="flex items-center gap-[8px] px-[12px] py-[10px] bg-[#fafafb] border-b border-[rgba(0,0,0,0.07)]">
        <div className="w-[28px] h-[28px] rounded-[6px] bg-[rgba(71,59,171,0.08)] flex items-center justify-center shrink-0">
          <FileText size={14} className="text-[var(--brand-accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-[var(--ink)] truncate" style={{ fontWeight: 500 }}>
            {input.source}
          </p>
          <p className="text-[11px] text-[var(--ink-secondary)]">
            {input.offers.length} offer{input.offers.length === 1 ? "" : "s"} extracted
          </p>
        </div>
        <button onClick={onDismiss} className="shrink-0 text-[var(--ink-tertiary)] hover:text-[var(--ink-secondary)] transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Sticky select-all bar */}
      <div className="sticky top-0 z-10 flex items-center gap-[8px] px-[12px] py-[7px] bg-white border-b border-[rgba(0,0,0,0.07)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <label className="flex items-center gap-[8px] cursor-pointer select-none group">
          <span className="relative flex items-center justify-center shrink-0 w-[15px] h-[15px]">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
            <span
              className="w-[15px] h-[15px] rounded-[3px] border-[1.5px] flex items-center justify-center transition-all pointer-events-none"
              style={{
                borderColor: allChecked || someChecked ? "var(--brand-accent)" : "rgba(0,0,0,0.25)",
                background:  allChecked ? "var(--brand-accent)" : "white",
              }}
            >
              {allChecked  && <Check size={9} className="text-white" strokeWidth={3} />}
              {someChecked && <span className="w-[7px] h-[1.5px] rounded bg-[var(--brand-accent)]" />}
            </span>
          </span>
          <span className="text-[11px] text-[var(--ink-secondary)] group-hover:text-[var(--ink)] transition-colors">
            {allChecked ? "Deselect all" : someChecked ? `${checkedCount} selected` : "Select all"}
          </span>
        </label>
        <span className="ml-auto text-[10px] text-[var(--ink-tertiary)]">
          {input.offers.length} total
        </span>
      </div>

      {/* Offer cards */}
      <div className="flex flex-col gap-[8px] p-[10px]">
        {input.offers.map(row => (
          <div key={row.id}>
            <OfferCard
              offer={toCardData(row)}
              selected={checkedIds.has(row.id)}
              onSelect={(_, checked) => toggleRow(row.id, checked)}
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
                    { key: "monthlyPayment", label: "Monthly Payment ($)", val: customizations[row.id]?.monthlyPayment ?? row.monthly_payment },
                    { key: "term",           label: "Term (mo)",           val: customizations[row.id]?.term           ?? row.term           },
                    { key: "dueAtSigning",   label: "Due at Signing ($)",  val: customizations[row.id]?.dueAtSigning   ?? row.due_at_signing ?? "0" },
                  ].map(({ key, label, val }) => (
                    <label key={key} style={{ fontSize: 11 }} className="flex flex-col gap-[3px] text-[var(--ink-secondary)]">
                      {label}
                      <input
                        type="number"
                        value={val}
                        onChange={e => setCustomizations(prev => ({
                          ...prev,
                          [row.id]: {
                            monthlyPayment: prev[row.id]?.monthlyPayment ?? row.monthly_payment,
                            term:           prev[row.id]?.term           ?? row.term,
                            dueAtSigning:   prev[row.id]?.dueAtSigning   ?? row.due_at_signing ?? "0",
                            [key]: e.target.value,
                          },
                        }))}
                        className="w-[90px] px-[8px] py-[4px] rounded-[6px] border border-[rgba(0,0,0,0.12)] text-[12px] text-[var(--ink)] bg-white outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)]"
                      />
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-10 px-[12px] py-[10px] bg-white border-t border-[rgba(0,0,0,0.08)] shadow-[0_-1px_4px_rgba(0,0,0,0.06)] flex items-center gap-[8px]">
        <button
          onClick={handleApply}
          disabled={checkedCount === 0}
          className={cn(
            "flex-1 py-[8px] px-[14px] rounded-full text-[13px] tracking-[0.46px] transition-all duration-200",
            checkedCount > 0
              ? "bg-[var(--brand-accent)] hover:bg-[#392e8a] text-white cursor-pointer shadow-sm"
              : "bg-[var(--brand-accent)] opacity-40 text-white cursor-not-allowed"
          )}
          style={{ fontWeight: 500 }}
        >
          {checkedCount === 0
            ? "Select offers to add"
            : `Add ${checkedCount} offer${checkedCount === 1 ? "" : "s"} to project`}
        </button>
        <button
          onClick={() => setCustomizeMode(m => !m)}
          className={cn(
            "px-[14px] py-[8px] rounded-full text-[13px] font-medium border transition-colors cursor-pointer shrink-0",
            customizeMode
              ? "bg-[rgba(71,59,171,0.08)] border-[rgba(71,59,171,0.3)] text-[var(--brand-accent)]"
              : "border-[rgba(0,0,0,0.12)] text-[var(--ink-secondary)] hover:bg-black/5"
          )}
        >
          {customizeMode ? "Done" : "Customize"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Tool chip (for non-proposal tools) ───────────────────────────────────────
function ToolChipView({ name, input }: { name: string; input: Record<string, unknown> }) {
  const cfg: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    add_offers_to_project:            { label: "Added offers",       icon: <Plus     size={10} strokeWidth={2.5} />, color: "#16a34a", bg: "rgba(22,163,74,0.09)"  },
    remove_offers_from_project:       { label: "Removed offers",     icon: <Minus    size={10} strokeWidth={2.5} />, color: "#dc2626", bg: "rgba(220,38,38,0.09)"  },
    add_templates_to_project:         { label: "Added templates",    icon: <FileText size={10} strokeWidth={2.5} />, color: "var(--brand-mid)", bg: "rgba(99,86,225,0.09)"  },
    remove_templates_from_project:    { label: "Removed templates",  icon: <Minus    size={10} strokeWidth={2.5} />, color: "#dc2626", bg: "rgba(220,38,38,0.09)"  },
    set_project_name:                 { label: "Renamed project",    icon: <Tag      size={10} strokeWidth={2.5} />, color: "#0369a1", bg: "rgba(3,105,161,0.09)"  },
    edit_offer:                       { label: "Edited offer",       icon: <Tag      size={10} strokeWidth={2.5} />, color: "#7c3aed", bg: "rgba(124,58,237,0.09)"  },
    add_backgrounds_to_project:       { label: "Added background",   icon: <Image    size={10} strokeWidth={2.5} />, color: "#0369a1", bg: "rgba(3,105,161,0.09)"  },
    remove_backgrounds_from_project:  { label: "Removed background", icon: <Minus    size={10} strokeWidth={2.5} />, color: "#dc2626", bg: "rgba(220,38,38,0.09)"  },
    duplicate_template_in_project:    { label: "Duplicated template",icon: <FileText size={10} strokeWidth={2.5} />, color: "var(--brand-mid)", bg: "rgba(99,86,225,0.09)"  },
    update_project_display:           { label: "Updated display",    icon: <Tag      size={10} strokeWidth={2.5} />, color: "#0369a1", bg: "rgba(3,105,161,0.09)"  },
  };
  const c = cfg[name] ?? { label: name, icon: null, color: "var(--ink-secondary)", bg: "rgba(104,101,118,0.09)" };
  let detail = "";
  if (name === "add_offers_to_project" || name === "remove_offers_from_project") {
    const ids = (input.offer_ids as string[]) ?? []; detail = ids.length === 1 ? ids[0] : `${ids.length} offers`;
  } else if (name === "add_templates_to_project" || name === "remove_templates_from_project") {
    const ids = (input.template_ids as string[]) ?? []; detail = ids.length === 1 ? ids[0] : `${ids.length} templates`;
  } else if (name === "set_project_name") { detail = `"${input.name}"`;
  } else if (name === "edit_offer") { detail = `${input.offer_id ?? ""}`;
  } else if (name === "add_backgrounds_to_project" || name === "remove_backgrounds_from_project") { const ids = (input.background_ids as string[]) ?? []; detail = ids.length === 1 ? ids[0] : `${ids.length} backgrounds`;
  } else if (name === "duplicate_template_in_project") { detail = `${input.template_id ?? ""}`; }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: c.bg, color: c.color,
      border: `1px solid ${c.bg.replace("0.09)", "0.28)")}`,
      fontSize: 12, fontWeight: 500, letterSpacing: "0.17px",
      padding: "4px 10px", borderRadius: 100,
    }}>
      {c.icon}{c.label}
      {detail && <span style={{ fontWeight: 400, opacity: 0.7 }}>· {detail}</span>}
    </span>
  );
}

// ─── Category chips ────────────────────────────────────────────────────────────
const PROJECT_CATEGORIES = ["Create a project", "Pick offers", "Pick templates", "Duplicate a project", "Create Automatic Project"];

// What each category chip sends to the agent — explicit phrasing ensures correct flow_scope
const CATEGORY_MESSAGES: Record<string, string> = {
  "Create a project":          "Create a project",
  "Pick offers":               "I want to pick offers for a new project. Offers only — no need for templates, backgrounds, or brand.",
  "Pick templates":            "I want to pick templates for a new project. Templates only — no need for offers, backgrounds, or brand.",
  "Duplicate a project":       "Duplicate a project",
  "Create Automatic Project":        "Create a proactive project",
};

const CategoryChip = forwardRef<HTMLButtonElement, { label: string } & ButtonHTMLAttributes<HTMLButtonElement>>(
  function CategoryChip({ label, ...rest }, ref) {
    return (
      <button ref={ref} {...rest}
        className="relative rounded-full border border-[rgba(99,86,225,0.5)] px-[10px] py-[4px] hover:bg-[rgba(71,59,171,0.06)] transition-colors cursor-pointer">
        <span className="text-[13px] text-[var(--brand-accent)] tracking-[0.46px] whitespace-nowrap capitalize"
          style={{ fontWeight: 500, lineHeight: "22px" }}>
          {label}
        </span>
      </button>
    );
  }
);

// ─── Main component ────────────────────────────────────────────────────────────
// Honda accounts available to the Agency user
const HONDA_ACCOUNTS = ["Honda of Anywhere", "Honda City"];

interface ProjectAgentPaneProps { isOpen: boolean; onClose: () => void; userType?: UserType; activeUserName?: string; }

export function ProjectAgentPane({ isOpen, onClose, userType, activeUserName }: ProjectAgentPaneProps) {
  const { triggerEvent } = useUsabilityTesting();
  const [paneWidth, setPaneWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const isDraggingPane = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  function handlePaneDragStart(e: React.MouseEvent) {
    isDraggingPane.current = true;
    setIsResizing(true); // disable spring during drag → right edge stays pinned
    dragStartX.current = e.clientX;
    dragStartWidth.current = paneWidth;
    e.preventDefault();

    function onMove(ev: MouseEvent) {
      if (!isDraggingPane.current) return;
      const delta = dragStartX.current - ev.clientX;
      const next = Math.max(320, Math.min(800, dragStartWidth.current + delta));
      setPaneWidth(next);
    }
    function onUp() {
      isDraggingPane.current = false;
      setIsResizing(false); // restore open/close animation
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const [messages,      setMessages]      = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [bgProcessing, setBgProcessing] = useState(false);
  const [projectContext, setProjectContext] = useState<ProjectContextPayload | null>(null);
  const [showHistory,      setShowHistory]      = useState(false);
  const [threads,          setThreads]          = useState<AgentThread[]>(() => loadAgentThreads());
  const [knownProjectNames,  setKnownProjectNames]  = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_PROJECTS);
      const projects: Array<{ name?: string }> = raw ? JSON.parse(raw) : [];
      return projects.map(p => p.name || "").filter(Boolean);
    } catch { return []; }
  });
  const [simulatingStream,   setSimulatingStream]   = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const currentThreadIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const agentInputRef = useRef<AgentInputHandle>(null);
  const { streaming, setStreaming, streamMessage, stop } = useAgentStream();
  // arcState declared below alongside simulatingStream (after all state declarations)

  // ── Contextual loading label — derived from what the agent is working on ──────
  const loadingLabel = useMemo((): string => {
    // Walk messages from newest to oldest to find the last continuation or user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.type === "continuation") {
        const c = m.content;
        if (c.includes("Project created")) return "Spinning up your project…";
        if (c.includes("templates only") || c.includes("skip offers") || c.includes("templates directly")) return "Matching templates to your brand…";
        if (c.includes("Propose offers") || c.includes("offer")) return "Scanning inventory for top picks…";
        if (c.includes("Propose templates") || c.includes("template")) return "Matching templates to your brand…";
        if (c.includes("Propose backgrounds") || c.includes("background")) return "Curating background scenes…";
        if (c.includes("brand") || c.includes("Brand")) return "Activating your brand theme…";
        if (c.includes("email") || c.includes("Email")) return "Preparing your share…";
        break;
      }
      if (m.type === "text" && m.role === "user") {
        const t = m.content.toLowerCase();
        // Edit-intent verbs take priority — project is already built, user is adjusting
        const isEdit = t.includes("remove") || t.includes("delete") || t.includes("remov") ||
          t.includes("change") || t.includes("update") || t.includes("edit") ||
          t.includes("rename") || t.includes("duplicate") || t.includes("swap") ||
          t.includes("replace") || t.includes("adjust") || t.includes("modify") ||
          t.includes("include") || t.includes("add the") || t.includes("add a ") ||
          t.includes("add an ");
        if (isEdit) return "Planning your adjustments…";
        if (t.includes("offer") || t.includes("lease") || t.includes("inventory")) return "Scanning inventory for top picks…";
        if (t.includes("template") || t.includes("banner") || t.includes("format")) return "Matching templates to your brand…";
        if (t.includes("background") || t.includes("scene")) return "Curating background scenes…";
        if (t.includes("brand") || t.includes("theme") || t.includes("logo")) return "Activating your brand theme…";
        if (t.includes("email") || t.includes("send") || t.includes("share")) return "Preparing your share…";
        if (t.includes("campaign") || t.includes("project") || t.includes("create") || t.includes("build")) return "Setting up your project…";
        break;
      }
    }
    return "Thinking…";
  }, [messages]);

  // ── WorkflowContext (for Platform Communications notification) ──────────────
  const { pushProjectMention } = useWorkflow();

  // Listen for project context
  useEffect(() => {
    const h = (e: Event) => setProjectContext((e as CustomEvent<ProjectContextPayload>).detail);
    window.addEventListener(PROJECT_CONTEXT_EVENT, h);
    return () => window.removeEventListener(PROJECT_CONTEXT_EVENT, h);
  }, []);

  // Mark generate-assets prompt as applied and append post-generation card once generation completes
  useEffect(() => {
    const handler = (e: Event) => {
      const { total } = (e as CustomEvent<{ total: number }>).detail;
      setMessages(prev => {
        const updated = prev.map(m =>
          (m.type === "text" && (m as TextMessage).isGenerateAssetsPrompt && !(m as TextMessage).applied)
            ? { ...m, applied: true, totalGenerated: total } as TextMessage
            : m
        );
        // Avoid duplicates
        const hasPostGenCard = updated.some(m => m.type === "share" || m.type === "reviewer_picker" || m.type === "campaign_cta");
        if (hasPostGenCard) return updated;

        const isProactiveSession = updated.some(m => m.type === "proactive_questions");
        const isDealerBgSession  = updated.some(m => m.type === "dealer_bg_proposal");
        const now = Date.now();

        if (isProactiveSession || isDealerBgSession) {
          // Proactive + dealer-bg flows: user reviews and decides who to share with
          return [
            ...updated,
            { id: `a-${now}`, role: "assistant", type: "text",
              content: "Based on your last project, these are the people who should review." } as TextMessage,
            { id: `reviewer-picker-${now + 1}`, role: "assistant", type: "reviewer_picker", applied: false } as ReviewerPickerMsg,
          ];
        }

        // Standard flow: assets are pre-approved, offer campaign creation
        return [
          ...updated,
          { id: `campaign-cta-${now}`, role: "assistant", type: "campaign_cta" } as CampaignCtaMsg,
        ];
      });
    };
    window.addEventListener(AGENT_ASSETS_GENERATED_EVENT, handler);
    return () => window.removeEventListener(AGENT_ASSETS_GENERATED_EVENT, handler);
  }, []);

  useEffect(() => {
    const handler = () => triggerEvent('assets_generated');
    window.addEventListener(AGENT_ASSETS_GENERATED_EVENT, handler);
    return () => window.removeEventListener(AGENT_ASSETS_GENERATED_EVENT, handler);
  }, [triggerEvent]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingText]);

  // Dispatch to ProjectsModule
  const dispatchAction = useCallback((a: AgentActionPayload) =>
    window.dispatchEvent(new CustomEvent(PROJECT_AGENT_ACTION_EVENT, { detail: a })), []);

  const proactiveModeRef = useRef(false);
  const [proactiveMode, setProactiveMode] = useState(false);
  // Agency (dealer) user: active Honda account context shown in the gear chip + focus label
  const [selectedAccount, setSelectedAccount] = useState(HONDA_ACCOUNTS[0]);

  // Refs that stay in sync with state — avoids stale closures in callbacks/timeouts
  const accRef      = useRef("");
  const ctxRef      = useRef<ProjectContextPayload | null>(null);
  const messagesRef = useRef<Message[]>([]);
  // Holds parsed offers extracted from a document while waiting for project setup
  const pendingParsedOffersRef = useRef<CustomOffer[] | null>(null);
  // Stores the original user text from a file upload so pipeline intent survives the extraction step
  const pendingPipelineTextRef = useRef<string>("");
  // Dealer background image — stores base64 dataURL of dealer-uploaded image for the full_dealer_bg flow.
  // ISOLATED from Inventory AI Config. Cleared after background is generated.
  const pendingDealerImageRef = useRef<string | null>(null);
  // Files currently staged in the AgentInput (updated via onFilesChange callback).
  const stagedFilesRef = useRef<File[]>([]);
  // Excel/PDF files the user staged alongside "Create a project" — held until setup completes.
  const pendingOffersFilesRef = useRef<File[] | null>(null);
  // Set to true right before create_project is dispatched so the project-ID-change effect
  // doesn't wipe the conversation history (the project was created BY this conversation).
  const projectCreatedByConversationRef = useRef(false);
  const fireNextStepRef = useRef<((step: string) => void) | null>(null);
  // Waiting for user confirmation to start a new project after completing the current one.
  const [awaitingNewProject, setAwaitingNewProject] = useState(false);
  useEffect(() => { ctxRef.current      = projectContext; }, [projectContext]);
  useEffect(() => { messagesRef.current = messages;       }, [messages]);

  // Agency (dealer) users → Honda-only catalog
  const filteredContext = useMemo((): ProjectContextPayload | null => {
    if (!projectContext) return null;
    if (userType !== 'dealer') return projectContext;
    return {
      ...projectContext,
      availableOffers:    projectContext.availableOffers.filter(o => o.make === 'Honda'),
      availableTemplates: projectContext.availableTemplates.filter(t => t.brand === 'Honda'),
    };
  }, [projectContext, userType]);

  const filteredCtxRef = useRef<ProjectContextPayload | null>(null);
  useEffect(() => { filteredCtxRef.current = filteredContext; }, [filteredContext]);

  // Auto-save messages to localStorage thread on every message change
  useEffect(() => {
    if (messages.length === 0) return;
    const now   = Date.now();
    const title = getThreadTitle(messages);
    setThreads(prev => {
      const tid = currentThreadIdRef.current;
      if (tid) {
        const updated = prev.map(t => t.id === tid ? { ...t, messages, title, updatedAt: now } : t);
        saveAgentThreads(updated);
        return updated;
      } else {
        const newId = `t-${now}`;
        currentThreadIdRef.current = newId;
        const newThread: AgentThread = { id: newId, title, messages, createdAt: now, updatedAt: now };
        const updated = [newThread, ...prev];
        saveAgentThreads(updated);
        return updated;
      }
    });
  }, [messages]); // intentionally excludes currentThreadIdRef — it's a ref, not state

  const handleToolResult = useCallback((toolName: string, toolInput: Record<string, unknown>) => {
    // Flush any streamed text that appeared before this tool call
    const preText = accRef.current.trim();
    if (preText) {
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "assistant", type: "text", content: preText } as TextMessage]);
      accRef.current = "";
      setStreamingText("");
    }

    if (toolName === "setup_project") {
      setMessages(prev => [...prev, {
        id: `setup-${Date.now()}`, role: "assistant", type: "setup",
        input: toolInput as SetupInput, applied: false,
      } as SetupMsg]);
    } else if (toolName === "propose_offers") {
      setMessages(prev => [...prev, {
        id: `offers-${Date.now()}`, role: "assistant", type: "offers",
        input: toolInput as OffersInput, applied: false,
      } as OffersMsg]);
    } else if (toolName === "propose_templates") {
      setMessages(prev => [...prev, {
        id: `templates-${Date.now()}`, role: "assistant", type: "templates",
        input: toolInput as TemplatesInput, applied: false,
      } as TemplatesMsg]);
    } else if (toolName === "propose_backgrounds") {
      if (proactiveModeRef.current) {
        const bgIds = (toolInput as BackgroundsInput).background_ids ?? [];
        dispatchAction({ action: "add_backgrounds", backgroundIds: bgIds });
        const bgNames = bgIds
          .map(id => SCENE_BACKGROUNDS.find(b => b.id === id)?.name ?? id)
          .join(", ");
        const bgLabel = bgIds.length === 1
          ? `**${bgNames}**`
          : `**${bgIds.length} backgrounds** (${bgNames})`;
        setMessages(prev => [...prev, {
          id: `a-${Date.now()}`, role: "assistant", type: "text",
          content: `Based on your last project, I recommend ${bgLabel} as your scene backgrounds. I've already added them to the project. If you'd prefer different ones, just let me know and I'll swap them out.`,
        } as TextMessage]);
        setTimeout(() => fireNextStepRef.current?.("backgrounds"), 400);
      } else {
        setMessages(prev => [...prev, {
          id: `backgrounds-${Date.now()}`, role: "assistant", type: "backgrounds",
          input: toolInput as BackgroundsInput, applied: false,
        } as BackgroundsMsg]);
      }
    } else if (toolName === "propose_task_owners") {
      setMessages(prev => [...prev, {
        id: `task-owners-${Date.now()}`, role: "assistant", type: "task_owners",
        input: toolInput as TaskOwnersInput, applied: false,
        liveOwners: ctxRef.current?.taskOwners,
      } as TaskOwnersMsg]);
    } else if (toolName === "propose_notify_owners") {
      setMessages(prev => [...prev, {
        id: `notify-owners-${Date.now()}`, role: "assistant", type: "notify_owners",
        input: toolInput as NotifyOwnersInput, applied: false,
        liveOwners: ctxRef.current?.taskOwners,
      } as NotifyOwnersMsg]);
    } else if (toolName === "propose_share") {
      const input = toolInput as { recipient_hints?: string[]; recipient_hint?: string };
      const recipientHints = input.recipient_hints ?? (input.recipient_hint ? [input.recipient_hint] : []);
      triggerEvent('email_notification_sent');
      setMessages(prev => [...prev, {
        id: `reviewer-picker-${Date.now()}`, role: "assistant", type: "reviewer_picker",
        applied: false, recipientHints,
      } as ReviewerPickerMsg]);
    } else if (toolName === "propose_email") {
      const input = toolInput as { recipient_hints?: string[]; recipient_hint?: string };
      const recipientHints = input.recipient_hints ?? (input.recipient_hint ? [input.recipient_hint] : []);
      triggerEvent('email_notification_sent');
      setMessages(prev => [...prev, {
        id: `reviewer-picker-${Date.now()}`, role: "assistant", type: "reviewer_picker",
        applied: false, recipientHints,
      } as ReviewerPickerMsg]);
    } else if (toolName === "propose_brand") {
      setMessages(prev => [...prev, {
        id: `brand-${Date.now()}`, role: "assistant", type: "brand",
        input: toolInput as BrandInput, applied: false,
      } as BrandMsg]);
    } else if (toolName === "propose_project") {
      setMessages(prev => [...prev, {
        id: `proposal-${Date.now()}`, role: "assistant", type: "proposal",
        input: toolInput as ProposalInput, applied: false,
      } as ProposalMsg]);
    } else if (toolName === "propose_proactive_questions") {
      setMessages(prev => [...prev, {
        id: `proactive-${Date.now()}`, role: "assistant", type: "proactive_questions",
        input: toolInput as ProactiveQuestionsInput, applied: false,
      } as ProactiveQuestionsMsg]);
    } else if (toolName === "generate_dealer_background") {
      // ── PHASE 1: Fast preview (runs now, ~30s) ───────────────────────────
      // Remove any trailing assistant text message committed in the same turn —
      // the model sometimes outputs a disclaimer before calling this tool.
      // The loading state below is the only visible signal we want.
      setMessages(prev => {
        const last = prev[prev.length - 1];
        return (last?.role === "assistant" && last.type === "text") ? prev.slice(0, -1) : prev;
      });

      setBgProcessing(true);
      dispatchAction({ action: "set_dealer_bg_generating", value: true } as never);

      (async () => {
        try {
          const storedImage = pendingDealerImageRef.current;
          if (!storedImage) throw new Error("No dealer image stored. Please re-upload the image.");

          const ctx = ctxRef.current;
          const firstConfirmedOffer = ctx?.availableOffers.find(
            o => ctx.currentOfferIds.includes(o.id)
          );
          const vehicleImageUrl = (firstConfirmedOffer as any)?.image ?? "";

          const { generatePreviewBackground, generatePreviewComposite } =
            await import("../../../lib/dealerBackgroundGenerator");

          // Resolve confirmed offers — primary source: currentOfferIds from context.
          // Fallback: match vehicleContext string against availableOffers (handles
          // timing gap where ctx may not have latest currentOfferIds yet).
          const vehicleContext = (toolInput as { vehicle_context?: string }).vehicle_context ?? "";
          const ctx2 = ctxRef.current;
          const confirmedOffers = (() => {
            const fromIds = (ctx2?.availableOffers ?? [])
              .filter(o => (ctx2?.currentOfferIds ?? []).includes(o.id));
            if (fromIds.length > 0) return fromIds;
            // Fallback: match vehicleContext tokens against offer make/model
            const vcLower = vehicleContext.toLowerCase();
            return (ctx2?.availableOffers ?? [])
              .filter(o => vcLower.includes(o.model.toLowerCase()) || vcLower.includes(o.make.toLowerCase()));
          })();
          const primaryOffer = confirmedOffers[0];
          const primaryVehicle = primaryOffer
            ? { year: primaryOffer.year, make: primaryOffer.make,
                model: primaryOffer.model, trim: primaryOffer.trim,
                offerId: primaryOffer.id,
                imageUrl: (primaryOffer as { image?: string }).image }
            : { year: new Date().getFullYear().toString(), make: vehicleContext.split(",")[0]?.trim() ?? "Vehicle",
                model: "", trim: "", offerId: "preview" };

          // Phase 1a: Flux Kontext Pro — clean background (~30s)
          // Removes all vehicles, people, clutter. Builds clear ground plane.
          const cleanPreviewBg = await generatePreviewBackground(storedImage);

          // Phase 1b: nano-banana (Gemini 2.5 Flash Image) — place the primary
          // vehicle into the clean bg using the catalog cutout as a reference
          // image. Preserves car identity; model handles perspective/lighting/shadow.
          const previewUrl = await generatePreviewComposite(cleanPreviewBg, primaryVehicle);

          // Build the initial background object
          const bgId = `dealer-bg-${Date.now()}`;
          const customBg = {
            id: bgId,
            name: "Your Scene",
            thumbnail: cleanPreviewBg,
            images: { "website-600x450": cleanPreviewBg },
            _dealerPhotoDataUrl: storedImage,
            // Clean 4:3 base for Phase 2a — nano-banana recomposes this scene
            // at each template's aspect ratio (no re-cleaning per template).
            _cleanBaseBg: cleanPreviewBg,
            _confirmedOffers: confirmedOffers.map(o => ({
              offerId: o.id, year: o.year, make: o.make, model: o.model, trim: o.trim,
              imageUrl: (o as { image?: string }).image,
            })),
          };

          // Store template keys for Phase 2 use
          const selectedTemplates = (ctx?.availableTemplates ?? []).filter(
            t => (ctx?.currentTemplateIds ?? []).includes(t.id)
          );
          const KNOWN_SIZES_MAP: Record<string, [number, number]> = {
            "website-2000x500": [2000, 500], "display-970x250": [970, 250],
            "display-300x250":  [300,  250], "social-1080x1080": [1080, 1080],
            "website-600x450":  [600,  450], "website-600x1067":  [600, 1067],
          };
          const findBestSizeKey = (w: number, h: number) => {
            const ar = w / h;
            return Object.entries(KNOWN_SIZES_MAP).reduce((best, [key, [kw, kh]]) => {
              const diff = Math.abs(ar - kw / kh);
              return diff < best.diff ? { key, diff } : best;
            }, { key: "display-300x250", diff: Infinity }).key;
          };
          const templateKeys = [...new Set(
            selectedTemplates.map(t => findBestSizeKey(t.width, t.height))
          )];

          // Store template keys on the bg object for Phase 2
          (customBg as any)._templateKeys = templateKeys;

          pendingDealerImageRef.current = null;

          setBgProcessing(false);
          setMessages(prev => [...prev, {
            id: `dealer-bg-${Date.now()}`,
            role: "assistant",
            type: "dealer_bg_proposal",
            bgObject: customBg as any,
            previewUrl,
            applied: false,
          } as DealerBgProposalMsg]);
          dispatchAction({ action: "set_dealer_bg_generating", value: false } as never);

        } catch (err) {
          setBgProcessing(false);
          setMessages(prev => [...prev, {
            id: `e-${Date.now()}`, role: "assistant", type: "text",
            content: `⚠️ Background generation failed: ${String(err)}. Please try uploading the image again.`,
          } as TextMessage]);
          dispatchAction({ action: "set_dealer_bg_generating", value: false } as never);
        }
      })();
    } else if (toolName === "propose_parsed_offers") {
      // Normalize flat confidence_* fields back into a field_confidence Record
      const rawInput = toolInput as Record<string, unknown>;
      const normalizedOffers = ((rawInput.offers ?? []) as Record<string, unknown>[]).map(o => {
        const fc: Record<string, "high" | "medium" | "low"> = {};
        if (o.field_confidence && typeof o.field_confidence === "object") {
          Object.assign(fc, o.field_confidence);
        }
        const confidenceKeys = ["monthly_payment", "term", "due_at_signing", "trim", "year", "apr"];
        for (const k of confidenceKeys) {
          const flat = o[`confidence_${k}`] as string | undefined;
          if (flat) fc[k] = flat as "high" | "medium" | "low";
          // Remove the flat key so it doesn't confuse the UI
          delete o[`confidence_${k}`];
        }
        return { ...o, field_confidence: fc };
      });
      const normalizedInput: ParsedOffersInput = {
        source: (rawInput.source as string) ?? "",
        offers: normalizedOffers as ParsedOfferRow[],
        extraction_notes: rawInput.extraction_notes as string | undefined,
      };
      setMessages(prev => [...prev, {
        id: `parsed-${Date.now()}`, role: "assistant", type: "parsed_offers",
        input: normalizedInput, applied: false,
      } as ParsedOffersMsg]);
    } else {
      setMessages(prev => [...prev, {
        id: `tool-${Date.now()}`, role: "assistant", type: "tool", name: toolName, input: toolInput,
      } as ToolChipMsg]);
      if (toolName === "add_offers_to_project")
        dispatchAction({ action: "add_offers",      offerIds:    toolInput.offer_ids    as string[] });
      else if (toolName === "remove_offers_from_project")
        dispatchAction({ action: "remove_offers",   offerIds:    toolInput.offer_ids    as string[] });
      else if (toolName === "add_templates_to_project")
        dispatchAction({ action: "add_templates",   templateIds: toolInput.template_ids as string[] });
      else if (toolName === "remove_templates_from_project")
        dispatchAction({ action: "remove_templates",templateIds: toolInput.template_ids as string[] });
      else if (toolName === "set_project_name")
        dispatchAction({ action: "set_project_name", name: toolInput.name as string });
      else if (toolName === "edit_offer") {
        // Tool schema defines patches as a nested camelCase object: { monthlyPayment, term, ... }
        const p = (toolInput.patches ?? {}) as Record<string, unknown>;
        const patches: Record<string, unknown> = {};
        if (p.monthlyPayment      != null) patches.monthlyPayment      = Number(p.monthlyPayment);
        if (p.term                != null) patches.term                = Number(p.term);
        if (p.totalDueAtSigning   != null) patches.totalDueAtSigning   = Number(p.totalDueAtSigning);
        if (p.offerType           != null) patches.offerType           = p.offerType;
        if (p.trim                != null) patches.trim                = p.trim;
        if (p.year                != null) patches.year                = p.year;
        if (p.make                != null) patches.make                = p.make;
        if (p.model               != null) patches.model               = p.model;
        dispatchAction({ action: "edit_offer", offerId: toolInput.offer_id as string, patches: patches as never });
      }
      else if (toolName === "add_backgrounds_to_project")
        dispatchAction({ action: "add_backgrounds", backgroundIds: toolInput.background_ids as string[] });
      else if (toolName === "remove_backgrounds_from_project")
        dispatchAction({ action: "remove_backgrounds", backgroundIds: toolInput.background_ids as string[] });
      else if (toolName === "duplicate_template_in_project")
        dispatchAction({ action: "duplicate_template", templateId: toolInput.template_id as string, newName: toolInput.new_name as string | undefined });
      else if (toolName === "update_project_display") {
        const p: { ctaText?: string; leaseLabel?: string; finePrint?: string; dealerName?: string } = {};
        if (toolInput.cta_text    != null) p.ctaText    = toolInput.cta_text    as string;
        if (toolInput.lease_label != null) p.leaseLabel = toolInput.lease_label as string;
        if (toolInput.fine_print  != null) p.finePrint  = toolInput.fine_print  as string;
        if (toolInput.dealer_name != null) p.dealerName = toolInput.dealer_name as string;
        dispatchAction({ action: "update_project_display", patches: p });
      }
      else if (toolName === "swap_jellybean_color") {
        const { offer_id, color_family, model, year, trim } = toolInput as { offer_id: string; color_family: string; model: string; year?: string; trim?: string };
        const url = resolveJellybean("Honda", model, trim ?? "", year, color_family);
        if (url) dispatchAction({ action: "swap_jellybean", offerId: offer_id, jellybeanUrl: url, jellybeanId: `jb-${model}-${color_family}`, colorFamily: color_family });
      }
    }
  }, [dispatchAction]);

  // sendInternal — triggers an AI turn shown as a subtle chip, not a full user bubble.
  // Uses refs so it's safe to call from setTimeout without stale closure issues.
  const sendInternal = useCallback(async (text: string) => {
    const contMsg: ContinuationMsg = { id: `cont-${Date.now()}`, role: "user", type: "continuation", content: text };
    setMessages(prev => [...prev, contMsg]);

    // Read current state from refs (not stale closure values)
    const ctx: ProjectContextPayload = filteredCtxRef.current ?? ctxRef.current ?? {
      projectId: "", projectName: "(no project open)", oem: "",
      currentOfferIds: [], currentTemplateIds: [], availableOffers: [], availableTemplates: [],
    };
    // If offers were already extracted from a document, strip the PDF blob from the history.
    // Without this, the agent sees the PDF on every continuation turn and re-runs
    // propose_parsed_offers (Step 1 of the decision tree), producing duplicate cards/projects.
    const offersAlreadyExtracted = messagesRef.current.some(m => m.type === "parsed_offers");

    // Build history from ref (includes all messages added before this call)
    const rawMsgs = [...messagesRef.current, contMsg]
      .filter((m): m is TextMessage | ContinuationMsg | UserFileMsg =>
        m.type === "text" || m.type === "continuation" || m.type === "user_file"
      );

    const history: ApiMessage[] = [];
    for (const m of rawMsgs) {
      if (m.type === "user_file" && offersAlreadyExtracted) {
        // Strip the blob — keep only the user's text so the agent doesn't re-extract
        history.push({ role: "user", content: (m as UserFileMsg).text || "Document uploaded." });
        // Inject a ghost assistant turn so the history alternates roles and the agent
        // knows the extraction step is already complete
        history.push({
          role: "assistant",
          content: "The vehicle offers have been extracted from the uploaded document and are ready.",
        });
      } else {
        history.push({
          role: m.role as "user" | "assistant",
          content: m.type === "user_file"
            ? (m as UserFileMsg).apiContent
            : (m as TextMessage | ContinuationMsg).content,
        });
      }
    }

    // ── Pipeline state markers ────────────────────────────────────────────────
    // Cards (offers, templates, backgrounds, brand) are filtered from history as
    // non-text messages. The agent can't see confirmations in the history and may
    // re-propose steps that are already done.
    // Fix: inject a single ghost exchange RIGHT BEFORE the continuation message
    // that explicitly lists which steps are already complete. The agent sees this
    // as authoritative evidence and skips completed steps.
    {
      const markers: string[] = [];
      if (ctx.currentOfferIds?.length)
        markers.push(`propose_offers ✅ (${ctx.currentOfferIds.length} offers in project)`);
      if (ctx.currentTemplateIds?.length)
        markers.push(`propose_templates ✅ (${ctx.currentTemplateIds.length} templates in project)`);
      if (ctx.activeBrandOem)
        markers.push(`propose_brand ✅ (${ctx.activeBrandOem} brand kit active)`);
      // Backgrounds/dealer_bg: not in project state → check message history
      const bgApplied = messagesRef.current.some(
        m => (m.type === "backgrounds" || m.type === "dealer_bg_proposal") && (m as any).applied
      );
      if (bgApplied) markers.push("propose_backgrounds / generate_dealer_background ✅ (background confirmed)");
      const taskOwnersApplied = messagesRef.current.some(m => m.type === "task_owners" && (m as any).applied);
      if (taskOwnersApplied) markers.push("propose_task_owners ✅ (task owners set)");

      if (markers.length > 0) {
        // Inject just before the continuation message (already at end of history)
        history.splice(history.length - 1, 0,
          { role: "user" as const,      content: `[PIPELINE STATE — steps already completed: ${markers.join(" | ")}. Do NOT re-propose any of these.]` },
          { role: "assistant" as const, content: "Confirmed. I will not re-propose completed steps." },
        );
      }
    }

    // Force the exact tool whenever the continuation names one.
    // This is the core guard against the agent calling setup_project or add_* tools
    // instead of the propose_* tool we asked for. tool_choice = "tool" means the model
    // HAS to call that specific tool and nothing else.
    const FORCED_TOOL_PATTERNS: Array<[string, string]> = [
      ["Next: setup_project",        "setup_project"],       // ← forces project creation, prevents multi-tool responses
      ["Next: propose_offers",       "propose_offers"],
      ["Next: propose_templates",    "propose_templates"],
      ["Next: propose_backgrounds",  "propose_backgrounds"],
      ["Next: propose_brand",        "propose_brand"],
      ["Next: propose_email",        "propose_email"],
      ["Next: propose_share",        "propose_share"],
      ["Next: propose_task_owners",  "propose_task_owners"],
      ["Next: propose_notify_owners","propose_notify_owners"],
      ["NOW call propose_task_owners","propose_task_owners"],
      ["Call propose_parsed_offers", "propose_parsed_offers"],
      ["generate_dealer_background", "generate_dealer_background"],
    ];
    const forcedTool = FORCED_TOOL_PATTERNS.find(([pattern]) => text.includes(pattern))?.[1];

    accRef.current = ""; setStreamingText("");
    await streamMessage(history, ctx,
      d => { accRef.current += d; setStreamingText(accRef.current); },
      handleToolResult,
      () => {
        const finalText = accRef.current;
        accRef.current = ""; setStreamingText("");
        if (finalText.trim()) setMessages(p => [...p, { id: `a-${Date.now()}`, role: "assistant", type: "text", content: finalText } as TextMessage]);
      },
      err => { setMessages(p => [...p, { id: `e-${Date.now()}`, role: "assistant", type: "text", content: `⚠️ ${err}` } as TextMessage]); accRef.current = ""; setStreamingText(""); },
      forcedTool,
    );
  }, [streamMessage, handleToolResult]); // stable — reads state via refs, not closure

  const send = useCallback(async (text: string, attachments: File[]) => {
    if (!text.trim() && !attachments.length || streaming) return;

    // ── New-project confirmation handler ────────────────────────────────────────
    // When awaitingNewProject is true the agent asked "create a new project?" and
    // is waiting for the user to confirm or cancel.
    if (awaitingNewProject) {
      setAwaitingNewProject(false);
      const confirmed = /\b(yes|ok|sure|yeah|yep|sim|claro|certo|pode|vamos|yup|go)\b/i.test(text.trim());
      setMessages(prev => [...prev,
        { id: `u-${Date.now()}`, role: "user", type: "text", content: text } as TextMessage,
      ]);
      if (confirmed) {
        // Inline handleNewThread to avoid a forward-reference TDZ (send is defined before handleNewThread)
        setMessages([]);
        setStreamingText("");
        currentThreadIdRef.current = null;
        setShowHistory(false);
        proactiveModeRef.current = false;
        setProactiveMode(false);
        setTimeout(() => {
          const ctx = ctxRef.current;
          const oem = ctx?.availableOffers?.[0]?.make ?? "General";
          const now = new Date();
          const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const setupInput: SetupInput = {
            project_name: deduplicateName("New Project", knownProjectNames),
            oem,
            start_date: fmt(now),
            end_date: fmt(new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())),
            flow_steps: ["offers", "templates", "backgrounds", "brand"],
          };
          setMessages([
            { id: `a-${Date.now()}`, role: "assistant", type: "text",
              content: `Starting fresh! Fill in the details below and confirm when you're ready.` } as TextMessage,
            { id: `setup-${Date.now()}`, role: "assistant", type: "setup", input: setupInput, applied: false } as SetupMsg,
          ]);
        }, 350);
      } else {
        const name = ctxRef.current?.projectName ?? "this project";
        setMessages(prev => [...prev,
          { id: `a-${Date.now()}`, role: "assistant", type: "text",
            content: `No problem — I'll keep working on **${name}**.` } as TextMessage,
        ]);
      }
      return;
    }

    // Detect proactive intent early — bypasses the "already open" intercept below.
    const isProactiveIntent = /\b(proactive|proactively|automatic|automatically|auto(?:pilot|create)?|autopilot)\b|do\s+(?:it\s+all|everything)\s*(?:for\s+me|automatically)?|(?:build|create|make|generate|set\s+up|wrap\s+up|put\s+together)\s+(?:the\s+)?(?:whole|entire|full|complete)\s+(?:campaign|project)|(?:build|create|make|finish|complete)\s+(?:the\s+)?(?:campaign|project)\s+for\s+me|build\s+it\s+(?:start\s+to\s+finish|end\s+to\s+end)|handle\s+the\s+whole\s+thing|take\s+it\s+from\s+here|take\s+care\s+of\s+the\s+whole\s+project|run\s+(?:with\s+it|the\s+full\s+project)|you\s+decide\s+everything|pick\s+everything\s+for\s+me|one[- ]click\s+campaign|just\s+make\s+it\s+happen|no\s+input\s+needed|don.?t\s+ask\s+me/i.test(text);

    // Intercept "create a project" / "build a project" when one is already open (skip for proactive)
    if (!isProactiveIntent && !attachments.length && ctxRef.current?.projectId &&
        /\b(create|build|start|new)\b.*(project|campaign)/i.test(text.trim())) {
      const name = ctxRef.current.projectName;
      const isComplete = messages.some(m => m.type === "campaign_cta");
      setMessages(prev => [...prev,
        { id: `u-${Date.now()}`, role: "user", type: "text", content: text } as TextMessage,
        { id: `a-${Date.now()}`, role: "assistant", type: "text",
          content: isComplete
            ? `**${name}** is complete — would you like to create a new project? I'll save this one and start fresh. Just say **yes** to confirm.`
            : `**${name}** is already open — I won't start a new project mid-flow. Ask me to add offers, templates, backgrounds, or share the project instead.` } as TextMessage,
      ]);
      if (isComplete) setAwaitingNewProject(true);
      return;
    }

    // Intercept "generate assets" command — trigger the modal directly
    if (!attachments.length && /generate\s+assets?/i.test(text.trim())) {
      window.dispatchEvent(new CustomEvent(AGENT_GENERATE_ASSETS_EVENT));
      setMessages(prev => [...prev,
        { id: `u-${Date.now()}`, role: "user",      type: "text", content: text } as TextMessage,
        { id: `a-${Date.now()}`, role: "assistant",  type: "text", content: "Opening **Generate Assets**…" } as TextMessage,
      ]);
      return;
    }

    const ctx: ProjectContextPayload = filteredContext ?? projectContext ?? {
      projectId: "", projectName: "(no project open)", oem: "",
      currentOfferIds: [], currentTemplateIds: [], availableOffers: [], availableTemplates: [],
    };

    let userMsg: TextMessage | UserFileMsg;

    if (attachments.length > 0) {
      // Build multimodal content blocks for all attachments
      const blocks: ApiContentBlock[] = [];
      if (text.trim()) blocks.push({ type: "text", text: text.trim() });

      for (const attachment of attachments) {
        try {
          if (attachment.type.startsWith("image/")) {
            const b64 = await fileToBase64(attachment);
            blocks.push({ type: "image", source: { type: "base64", media_type: attachment.type, data: b64 } });
          } else if (attachment.type === "application/pdf") {
            const b64 = await fileToBase64(attachment);
            blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } });
          } else if (/\.xlsx?$/i.test(attachment.name) || attachment.type.includes("spreadsheet") || attachment.type.includes("excel")) {
            const excelText = await parseExcelToText(attachment);
            const textIdx = blocks.findIndex(b => b.type === "text");
            const combined = (textIdx >= 0 ? (blocks[textIdx] as { type: "text"; text: string }).text + "\n\n" : "") + excelText;
            if (textIdx >= 0) blocks.splice(textIdx, 1);
            blocks.unshift({ type: "text", text: combined });
          } else {
            blocks.push({ type: "text", text: `[Attached file: ${attachment.name}]` });
          }
        } catch {
          blocks.push({ type: "text", text: `[File: ${attachment.name} — could not process]` });
        }
      }

      // Ensure there's at least one text block hinting at extraction
      if (!blocks.some(b => b.type === "text")) {
        blocks.unshift({ type: "text", text: `Please extract offers from these files: ${attachments.map(f => f.name).join(", ")}` });
      }

      userMsg = {
        id: `u-${Date.now()}`, role: "user", type: "user_file",
        text: text.trim(),
        files: attachments.map(f => ({ name: f.name, type: f.type })),
        apiContent: blocks,
      };
    } else {
      userMsg = { id: `u-${Date.now()}`, role: "user", type: "text", content: text };
    }

    setMessages(prev => [...prev, userMsg]);

    // Same blob-stripping logic as sendInternal: if offers were already extracted,
    // replace document blobs with text-only so the agent doesn't re-run extraction.
    const offersExtracted = messages.some(m => m.type === "parsed_offers");
    const rawSendMsgs = [...messages, userMsg]
      .filter((m): m is TextMessage | ContinuationMsg | UserFileMsg =>
        m.type === "text" || m.type === "continuation" || m.type === "user_file"
      );

    const history: ApiMessage[] = [];
    for (const m of rawSendMsgs) {
      if (m.type === "user_file" && offersExtracted && m !== userMsg) {
        // Prior file upload: strip blob, inject ghost assistant bridge
        history.push({ role: "user", content: (m as UserFileMsg).text || "Document uploaded." });
        history.push({
          role: "assistant",
          content: "The vehicle offers have been extracted from the uploaded document and are ready.",
        });
      } else {
        history.push({
          role: m.role as "user" | "assistant",
          content: m.type === "user_file"
            ? (m as UserFileMsg).apiContent
            : (m as TextMessage | ContinuationMsg).content,
        });
      }
    }

    // When the user uploads an image, PDF, or Excel — use the dedicated extract endpoint.
    // That endpoint has ONLY propose_parsed_offers as a tool with tool_choice forced,
    // so the model MUST extract offers. No system-prompt games needed.
    const isFileUpload = userMsg.type === "user_file";

    // ── Dealer background intent detection (full_dealer_bg flow — isolated from inventory) ──
    // If user uploads an image while explicitly mentioning project/campaign/background intent,
    // store the image for later use at the backgrounds step instead of routing to offer extraction.
    const isImageUpload = isFileUpload && (userMsg as UserFileMsg).files.some(f => f.type.startsWith("image/"));
    const lowerTextForBg = text.toLowerCase();
    const hasBgIntent = isImageUpload && (
      !lowerTextForBg.trim() ||            // bare image upload (no text) = bg intent
      lowerTextForBg.includes("background") || lowerTextForBg.includes("project") ||
      lowerTextForBg.includes("campaign") || lowerTextForBg.includes("include") ||
      lowerTextForBg.includes("usar") || lowerTextForBg.includes("usar essa") ||
      lowerTextForBg.includes("scene") || lowerTextForBg.includes("cena") ||
      lowerTextForBg.includes("dealer") || lowerTextForBg.includes("foto")
    );
    if (hasBgIntent) {
      // Convert the image file to base64 dataURL and store for later use
      const imageFile = attachments.find(f => f.type.startsWith("image/"));
      if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            pendingDealerImageRef.current = reader.result;
          }
        };
        reader.readAsDataURL(imageFile);
      }
      // Do NOT route to /api/agent/extract — let the agent handle this as a new project request
      // The image will be used when the backgrounds step is reached
    }

    const isImageOrDocument = isFileUpload && !hasBgIntent && (
      (userMsg as UserFileMsg).files.some(f =>
        f.type.startsWith("image/") ||
        f.type === "application/pdf" ||
        /\.xlsx?$/i.test(f.name)
      )
    );

    accRef.current = ""; setStreamingText("");

    if (isImageOrDocument) {
      // ── Dedicated extraction path ────────────────────────────────────────
      pendingPipelineTextRef.current = text.trim(); // preserve pipeline intent for after extraction
      setStreaming(true);
      try {
        const res = await fetch("/api/agent/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim(); if (!raw) continue;
            let ev: Record<string, unknown>;
            try { ev = JSON.parse(raw); } catch { continue; }
            if (ev.type === "tool_result") handleToolResult(ev.name as string, ev.input as Record<string, unknown>);
            else if (ev.type === "error") setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: "assistant", type: "text", content: `⚠️ ${ev.message}` } as TextMessage]);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn("[extract] Failed:", err);
        setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: "assistant", type: "text", content: `⚠️ ${String(err)}` } as TextMessage]);
      } finally {
        setStreaming(false);
      }
      return;
    }

    // ── Intent-based forced tool for user messages ───────────────────────────
    // The model consistently mis-routes "send/share to [person]" to propose_task_owners.
    // Force the correct tool client-side so this can never happen regardless of system prompt.
    const KNOWN_CONTACTS = [
      "Katelyn","Luke","Jenny","Sonya","Zak","Rachel","Jenni",
      "Mike","Sarah","James","Ashley","Mallory","Jorge",
    ];
    const lowerText = text.toLowerCase();
    const hasSendVerb  = /\b(send|share|manda|envia|compartilha|forward)\b/.test(lowerText);
    const hasPersonOrMech = KNOWN_CONTACTS.some(n => text.includes(n)) ||
                            /\b(email|platform|via\s+platform|via\s+email)\b/.test(lowerText);
    const hasPlatformKeyword = /\b(platform|via platform|platform message|mensagem de plataforma)\b/.test(lowerText);

    let userForcedTool: string | undefined;
    if (hasSendVerb && hasPersonOrMech) {
      // "send to X" / "share with X" / "send via platform to X" → always propose_share
      userForcedTool = "propose_share";
    } else if (hasSendVerb && hasPlatformKeyword) {
      userForcedTool = "propose_share";
    }

    // "proactive" / "automatic" / "auto" → trigger the proactive questions flow
    const wantsProactive = (/\b(proactive|proactively|automatic|automatically|auto(?:pilot|create)?|autopilot)\b|do\s+(?:it\s+all|everything)\s*(?:for\s+me|automatically)?|(?:build|create|make|generate|set\s+up|wrap\s+up|put\s+together)\s+(?:the\s+)?(?:whole|entire|full|complete)\s+(?:campaign|project)|(?:build|create|make|finish|complete)\s+(?:the\s+)?(?:campaign|project)\s+for\s+me|build\s+it\s+(?:start\s+to\s+finish|end\s+to\s+end)|handle\s+the\s+whole\s+thing|take\s+it\s+from\s+here|take\s+care\s+of\s+the\s+whole\s+project|run\s+(?:with\s+it|the\s+full\s+project)|you\s+decide\s+everything|pick\s+everything\s+for\s+me|one[- ]click\s+campaign|just\s+make\s+it\s+happen|no\s+input\s+needed|don.?t\s+ask\s+me/i).test(lowerText) && !hasBgIntent;
    if (wantsProactive && !userForcedTool) {
      userForcedTool = "propose_proactive_questions";
      triggerEvent('automatic_project_created');
    }

    // Dealer scene upload + no project open → the model MUST start with setup_project.
    // Without this it sometimes answers conversationally or proposes catalog
    // backgrounds. flow_scope is additionally overridden in getFlowSteps, so the
    // dealer_bg step is guaranteed regardless of the arguments the model picks.
    if (hasBgIntent && !ctx.projectId) {
      userForcedTool = "setup_project";
    }

    // If user uploads a bg image AND explicitly asks to CREATE a new project while one is open,
    // start fresh — do NOT apply the bg to the existing project.
    // The image is already stored in pendingDealerImageRef and will be used at the backgrounds step.
    if (hasBgIntent && ctx.projectId && /\b(create|build|start|new)\b.*(project|campaign)/i.test(text.trim())) {
      const oem = ctx?.availableOffers?.[0]?.make ?? "General";
      const now = new Date();
      const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const setupInput: SetupInput = {
        project_name: deduplicateName("New Project", knownProjectNames),
        oem,
        start_date: fmt(now),
        end_date: fmt(new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())),
        flow_steps: ["offers", "templates", "backgrounds", "brand"],
      };
      // Inline handleNewThread to avoid forward-ref TDZ
      currentThreadIdRef.current = null;
      setShowHistory(false);
      proactiveModeRef.current = false;
      setProactiveMode(false);
      setStreamingText("");
      setMessages([
        { id: `u-${Date.now()}`, role: "user", type: "text", content: text } as TextMessage,
        { id: `a-${Date.now()}`, role: "assistant", type: "text",
          content: `Starting a new project — your background image is saved and will be used at the backgrounds step. Fill in the details below.` } as TextMessage,
        { id: `setup-${Date.now()}`, role: "assistant", type: "setup", input: setupInput, applied: false } as SetupMsg,
      ]);
      return;
    }

    // Non-linear bg flow: project already open, user uploaded a bg image → skip
    // the normal agent turn and jump straight to background generation instead of
    // restarting the project setup flow. The image is already stored in pendingDealerImageRef.
    if (hasBgIntent && ctx.projectId) {
      const confirmedOffers = (ctx.availableOffers ?? []).filter(o => (ctx.currentOfferIds ?? []).includes(o.id));
      const vehicleCtx = confirmedOffers.map(o => `${o.year} ${o.make} ${o.model}`).join(", ") || "project vehicles";
      setTimeout(() => sendInternal(
        `Background image uploaded for the open project "${ctx.projectName}". ` +
        `Call generate_dealer_background with vehicle_context="${vehicleCtx}". ` +
        `Do NOT call setup_project — the project is already active.`
      ), 400);
      return;
    }

    await streamMessage(history, ctx,
      d => { accRef.current += d; setStreamingText(accRef.current); },
      handleToolResult,
      () => {
        const finalText = accRef.current;
        accRef.current = ""; setStreamingText("");
        if (finalText.trim()) setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "assistant", type: "text", content: finalText } as TextMessage]);
      },
      err => { setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: "assistant", type: "text", content: `⚠️ ${err}` } as TextMessage]); accRef.current = ""; setStreamingText(""); },
      userForcedTool,
    );
  }, [streaming, projectContext, messages, streamMessage, handleToolResult, awaitingNewProject, knownProjectNames]);

  // ── Flow steps helper — reads messagesRef (always fresh, no stale closure) ──
  const getFlowSteps = useCallback((): string[] => {
    const msgs = messagesRef.current;
    const setupMsg = msgs.filter((m): m is SetupMsg => m.type === "setup").at(-1);

    // 0. Dealer-bg override — DETERMINISTIC, beats whatever flow_scope the model
    //    chose. If a dealer scene image is staged (uploaded with bg intent and not
    //    yet consumed by generate_dealer_background), the flow MUST route through
    //    the dealer_bg step instead of catalog backgrounds. The ref is cleared
    //    when the background is generated, so later flows are unaffected.
    if (setupMsg && pendingDealerImageRef.current) {
      return ["offers", "templates", "dealer_bg", "brand"];
    }

    // 1. flow_scope enum (set by agent in tools.ts — primary source of truth)
    const SCOPE_STEPS: Record<NonNullable<SetupInput["flow_scope"]>, string[]> = {
      full:                   ["offers", "templates", "backgrounds", "brand"],
      offers_only:            ["offers"],
      templates_only:         ["templates"],
      offers_and_templates:   ["offers", "templates"],
      templates_and_email:    ["templates", "email"],
      offers_and_email:       ["offers", "email"],
      full_dealer_bg:         ["offers", "templates", "dealer_bg", "brand"],
    };
    const scope = setupMsg?.input.flow_scope;
    if (scope && SCOPE_STEPS[scope]) return SCOPE_STEPS[scope];

    // 2. Legacy flow_steps array (old sessions)
    const legacySteps = setupMsg?.input.flow_steps;
    if (legacySteps && legacySteps.length > 0) return legacySteps;

    // 3. Fallback: infer from user messages.
    //    Scan MOST RECENT user message first (captures "add backgrounds and send to X"
    //    on existing projects), then fall back to the first message for full-flow builds.
    const userMsgs = msgs.filter((m): m is TextMessage => m.type === "text" && m.role === "user");
    const recentUser = userMsgs.at(-1);
    const firstUser  = userMsgs.at(0);

    const inferStepsFrom = (text: string): string[] | null => {
      const t = text.toLowerCase();
      const wantsEmail       = t.includes("email") || t.includes("send") || t.includes("share") || t.includes("manda") || t.includes("envi");
      const wantsOffers      = t.includes("offer");
      const wantsTemplates   = t.includes("template");
      const wantsBackgrounds = t.includes("background") || t.includes("cen") || t.includes("backgr");
      const steps: string[] = [];
      if (wantsOffers)      steps.push("offers");
      if (wantsTemplates)   steps.push("templates");
      if (wantsBackgrounds) steps.push("backgrounds");
      if (wantsEmail)       steps.push("email");
      return steps.length > 0 ? steps : null;
    };

    // Prefer the most recent user message (partial flows on existing projects)
    if (recentUser && recentUser !== firstUser) {
      const steps = inferStepsFrom(recentUser.content);
      if (steps) return steps;
    }
    // Fall back to first message (full-flow from scratch)
    if (firstUser) {
      const steps = inferStepsFrom(firstUser.content);
      if (steps) return steps;
    }
    return ["offers", "templates", "backgrounds", "brand"];
  }, []);

  // ── Check if catalog has any offers for a given OEM ─────────────────────────
  const catalogHasOffersFor = useCallback((oem: string): boolean => {
    const offers = ctxRef.current?.availableOffers ?? [];
    if (offers.length === 0) return false;
    const oemLower = oem.toLowerCase().trim();
    return offers.some(o => {
      const makeLower = (o.make ?? "").toLowerCase();
      return makeLower.includes(oemLower) || oemLower.includes(makeLower);
    });
  }, []);

  // ── Build offers continuation — routes to propose_parsed_offers if no catalog match ──
  const buildOffersContinuation = useCallback((prefix: string, oem: string): string => {
    if (catalogHasOffersFor(oem)) {
      return `${prefix}. Next: propose_offers`;
    }
    const hasFile = messagesRef.current.some(m => m.type === "user_file");
    const context = hasFile
      ? "Call propose_parsed_offers now — scan the image/document in the conversation history and extract every offer row you can see."
      : "Call propose_parsed_offers now — no catalog offers exist for this brand. Create placeholder rows using the project OEM and current year so the user can fill in the details inline.";
    return `${prefix}. The offer catalog has NO offers for "${oem}". Do NOT call propose_offers. ${context}`;
  }, [catalogHasOffersFor]);

  const fireNextStep = useCallback((completedStep: string) => {
    const steps = getFlowSteps();
    const idx = steps.indexOf(completedStep);
    const nextStep = idx >= 0 && idx < steps.length - 1 ? steps[idx + 1] : null;

    // Skip brand step if a brand kit is already active — no need to offer it again
    const effectiveNext = (nextStep === "brand" && ctxRef.current?.activeBrandOem)
      ? (steps[idx + 2] ?? null)
      : nextStep;

    if (!nextStep || !effectiveNext) {
      if (proactiveModeRef.current) {
        proactiveModeRef.current = false;
        setProactiveMode(false);
      }
      triggerEvent('project_pipeline_complete');
      // Flow is complete — proactively offer asset generation if offers + templates are present
      const ctx = ctxRef.current;
      const offerCount    = ctx?.currentOfferIds.length ?? 0;
      const templateCount = ctx?.currentTemplateIds.length ?? 0;
      if (offerCount > 0 && templateCount > 0) {
        const total = offerCount * templateCount;
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `a-${Date.now()}`,
            role: "assistant",
            type: "text",
            content: "Your offers, templates, and backgrounds are all confirmed. Ready to generate the ad assets?",
            isGenerateAssetsPrompt: true,
          } as TextMessage]);
        }, 600);
      }

      return;
    }

    if (effectiveNext === "dealer_bg") {
      // Instead of proposing catalog backgrounds, trigger dealer background generation
      const ctx = ctxRef.current;
      const confirmedOffers = (ctx?.availableOffers ?? [])
        .filter(o => (ctx?.currentOfferIds ?? []).includes(o.id));
      const vehicleContext = confirmedOffers.length > 0
        ? confirmedOffers.map(o => `${o.year} ${o.make} ${o.model}`).join(", ")
        : "vehicles";
      setTimeout(() => sendInternal(
        `Step complete. generate_dealer_background vehicle_context="${vehicleContext}".`
      ), 400);
      return;
    }

    if (effectiveNext === "offers") {
      const setupMsg = messagesRef.current.filter((m): m is SetupMsg => m.type === "setup").at(-1);
      const oem = setupMsg?.input.oem ?? ctxRef.current?.oem ?? "";
      setTimeout(() => sendInternal(buildOffersContinuation("Step complete", oem)), 400);
      return;
    }

    const continuations: Record<string, string> = {
      templates:   "Step complete. Next: propose_templates",
      backgrounds: "Step complete. Next: propose_backgrounds",
      brand:       "Step complete. Next: propose_brand",
      email:       "Step complete. Next: propose_email",
      dealer_bg:   "Step complete. Next: propose_brand",
    };
    const msg = continuations[effectiveNext];
    if (msg) setTimeout(() => sendInternal(msg), 400);
  }, [getFlowSteps, sendInternal, buildOffersContinuation, setMessages]);

  useEffect(() => { fireNextStepRef.current = fireNextStep; }, [fireNextStep]);

  // ── Setup card ──────────────────────────────────────────────────────────────
  const handleSetupApply = useCallback((name: string, account: string, oem: string, startDate: string, endDate: string, owner: string, platforms: string[]) => {
    projectCreatedByConversationRef.current = true; // suppress the project-ID-change reset
    dispatchAction({ action: "create_project", name, account, oem, startDate, endDate, owner, platforms });
    setKnownProjectNames(prev => [...prev, name]);

    // Recovery: if there are unapplied parsed-offers cards visible in the conversation
    // (user uploaded Excel before creating the project), queue them now so they get added.
    if (!pendingParsedOffersRef.current) {
      const unapplied = (messagesRef.current as Message[])
        .filter((m): m is ParsedOffersMsg => m.type === "parsed_offers" && !(m as ParsedOffersMsg).applied)
        .flatMap(m => (m as ParsedOffersMsg).input.offers);
      if (unapplied.length > 0) {
        pendingParsedOffersRef.current = unapplied;
        setMessages(prev => prev.map(m =>
          m.type === "parsed_offers" && !(m as ParsedOffersMsg).applied
            ? { ...m, applied: true } as ParsedOffersMsg : m
        ));
      }
    }

    setTimeout(() => {
      // If offers were pre-extracted from a document, add them now and skip propose_offers
      if (pendingParsedOffersRef.current) {
        const pending = pendingParsedOffersRef.current;
        pendingParsedOffersRef.current = null;
        dispatchAction({ action: "add_custom_offers", offers: pending });
        // Continue to next step after offers (templates, email, etc.) based on flow scope
        setTimeout(() => fireNextStep("offers"), 400);
        return;
      }

      // If the user staged Excel/PDF files alongside "Create a project", send them now
      // for extraction and offer-adding, now that the project exists.
      if (pendingOffersFilesRef.current) {
        const files = pendingOffersFilesRef.current;
        pendingOffersFilesRef.current = null;
        setTimeout(() => send("Add the offers from the attached file to the project", files), 200);
        return;
      }

      const steps = getFlowSteps();
      const firstStep = steps[0] ?? "offers";

      if (firstStep === "offers") {
        sendInternal(buildOffersContinuation("Project created", oem));
        return;
      }

      const continuations: Record<string, string> = {
        templates:   "Project created. Next: propose_templates",
        backgrounds: "Project created. Next: propose_backgrounds",
        brand:       "Project created. Next: propose_brand",
        email:       "Project created. Next: propose_email",
      };
      sendInternal(continuations[firstStep] ?? buildOffersContinuation("Project created", oem));
    }, 600);
  }, [dispatchAction, send, sendInternal, getFlowSteps, buildOffersContinuation, fireNextStep]);

  // ── Proactive questions submit ───────────────────────────────────────────────
  const handleProactiveQuestionsSubmit = useCallback((goal: string, timeline: string, offerFocus: string) => {
    setMessages(prev => prev.map(m =>
      m.type === "proactive_questions" && !(m as ProactiveQuestionsMsg).applied
        ? { ...m, applied: true } as ProactiveQuestionsMsg : m
    ));
    proactiveModeRef.current = true;
    setProactiveMode(true);
    setTimeout(() => sendInternal(
      `Proactive build. User priorities: Goal: ${goal}, Timeline: ${timeline}, Offer focus: ${offerFocus}. ` +
      `Use these to guide ALL selections. Call setup_project now with flow_steps ["offers","templates","backgrounds","brand"]. NO text output.`
    ), 200);
  }, [sendInternal]);

  // ── Offers card ─────────────────────────────────────────────────────────────
  const handleOffersApply = useCallback((offerIds: string[], editedOfferIds: string[] = []) => {
    dispatchAction({ action: "add_offers", offerIds, editedOfferIds });
    const inSetupFlow = messagesRef.current.some(m => m.type === "setup");
    if (!inSetupFlow) {
      // Standalone: tell the agent offers were confirmed so it can continue
      setTimeout(() => sendInternal(
        "Offers added to project. Check the original user request and continue with any remaining steps (use COMPLETION FLOW rules — check CURRENT PROJECT STATE first)."
      ), 400);
      return;
    }
    fireNextStep("offers");
  }, [dispatchAction, sendInternal, fireNextStep]);

  // ── Templates card ──────────────────────────────────────────────────────────
  const handleTemplatesApply = useCallback((templateIds: string[]) => {
    dispatchAction({ action: "add_templates", templateIds });
    // Always fire next step — even on existing projects (no setup card).
    // Previously guarded by inSetupFlow which silently dropped the continuation
    // when templates were proposed directly on an open project.
    fireNextStep("templates");
  }, [dispatchAction, fireNextStep]);

  // ── Backgrounds card ────────────────────────────────────────────────────────
  const handleBackgroundsApply = useCallback((backgroundIds: string[]) => {
    dispatchAction({ action: "add_backgrounds", backgroundIds });
    fireNextStep("backgrounds");
  }, [dispatchAction, fireNextStep]);

  const handleBackgroundsDismiss = useCallback(() => {
    fireNextStep("backgrounds");
  }, [fireNextStep]);

  // ── Email card ──────────────────────────────────────────────────────────────
  const handleEmailApply = useCallback((recipient: string, message: string) => {
    dispatchAction({ action: "send_email", recipient, message });

    // Fire-and-forget: send a real email via /api/email/send-review
    const ctx = ctxRef.current;
    const projectOffers = ctx
      ? ctx.availableOffers.filter(o => ctx.currentOfferIds.includes(o.id))
      : [];
    const projectTemplates = ctx
      ? ctx.availableTemplates.filter(t => ctx.currentTemplateIds.includes(t.id))
      : [];

    fetch("/api/email/send-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_email: recipient,
        message,
        project: {
          projectId:       ctx?.projectId,
          projectName:     ctx?.projectName ?? "Campaign",
          oem:             ctx?.oem,
          start_date:      ctx?.startDate,
          end_date:        ctx?.endDate,
          campaign_owner:  ctx?.owner,
          // Rich asset items — Cloudinary will composite vehicle over bg server-side
          assetItems: (ctx?.generatedAssetPreviews ?? []).map(p => ({
            bgUrl:         p.bgUrl,
            vehicleUrl:    p.vehicleUrl,
            offerName:     p.offerName,
            dims:          p.dims,
            offerType:     p.offerType,
            monthlyPayment: p.monthlyPayment,
            term:          p.term,
            trim:          p.trim,
            make:          p.make,
          })),
          offers:      projectOffers.map(o => {
            const rawImage = (o as { image?: string }).image ?? "";
            // blob: and data: URLs are browser-session-only — strip them before
            // sending so the email falls back to the make-colour avatar instead
            // of a broken-image icon in the recipient's inbox.
            const safeImage =
              rawImage.startsWith("blob:") || rawImage.startsWith("data:")
                ? ""
                : rawImage;
            return {
              id: o.id, year: o.year, make: o.make, model: o.model, trim: o.trim,
              offerType: o.offerType, monthlyPayment: o.monthlyPayment, term: o.term,
              image: safeImage,
            };
          }),
          templates: projectTemplates.map(t => ({
            id: t.id, name: t.name, format: t.format,
          })),
        },
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) { if (import.meta.env.DEV) console.warn("[email] send-review error:", data.error); }
      })
      .catch(err => { if (import.meta.env.DEV) console.warn("[email] send-review fetch failed:", err); });

    setMessages(prev => [...prev, {
      id: `a-${Date.now()}`, role: "assistant", type: "text",
      content: `✅ Email sent to **${recipient}** with the project link.`,
    } as TextMessage]);

    const projectId = ctxRef.current?.projectId;
    if (projectId) {
      window.dispatchEvent(new CustomEvent("project-status-change", {
        detail: { projectId, status: "Awaiting Approval" },
      }));
    }
  }, [dispatchAction]);

  const handleEmailDismiss = useCallback(() => {}, []);

  // ── Share card ────────────────────────────────────────────────────────────
  // Called when user picks "Send via Email" from the share chooser card
  const handleShareChooseEmail = useCallback((recipientHint: string) => {
    const ctx = ctxRef.current;
    const name = ctx?.projectName ?? "this project";
    const oem  = ctx?.oem ?? "";
    const projectUrl = ctx?.projectId
      ? `https://constellation-ux-app.vercel.app/OEM/Projects?project=${ctx.projectId}`
      : "https://constellation-ux-app.vercel.app/OEM/Projects";
    const emailInput: EmailInput = {
      recipient_hint: recipientHint,
      message: `I'd like to share the ${oem} project "${name}" with you. You can view and collaborate on it using the link below:\n\n${projectUrl}`,
    };
    setMessages(prev => [...prev, {
      id: `email-${Date.now()}`, role: "assistant", type: "email",
      input: emailInput, applied: false,
    } as EmailMsg]);
  }, []);

  // Called when user picks "Send via Platform Communications"
  const handleShareChoosePlatform = useCallback((recipientName: string) => {
    const ctx = ctxRef.current;
    pushProjectMention(
      ctx?.projectId ?? "unknown",
      ctx?.projectName ?? "this project",
      activeUserName ?? "Someone",
    );
    setMessages(prev => [...prev, {
      id: `a-${Date.now()}`, role: "assistant", type: "text",
      content: `✅ Platform notification sent to **${recipientName}**. They'll see a notification in their feed.`,
    } as TextMessage]);

    const projectId = ctxRef.current?.projectId;
    if (projectId) {
      window.dispatchEvent(new CustomEvent("project-status-change", {
        detail: { projectId, status: "Awaiting Approval" },
      }));
    }
  }, [pushProjectMention]);

  // ── Reviewer picker confirm → show ShareChooserCard with grouped contacts ────
  const handleReviewerPickerConfirm = useCallback((msgId: string, selected: typeof MOCK_CONTACTS[number][], channels: Record<string, "platform" | "email">, _message: string) => {
    // Mark card applied
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, applied: true } as ReviewerPickerMsg : m));
    triggerEvent('reviewer_sent');

    // Build confirmation using actual channel selection (user may have toggled)
    const platformNames = selected.filter(c => channels[c.email] === "platform").map(c => c.name.split(" ")[0]).join(", ");
    const emailNames    = selected.filter(c => channels[c.email] === "email").map(c => c.name.split(" ")[0]).join(", ");
    const parts: string[] = [];
    if (platformNames) parts.push(`Platform notification sent to **${platformNames}**.`);
    if (emailNames) parts.push(`Email sent to **${emailNames}**.`);

    setMessages(prev => [...prev, {
      id: `a-${Date.now()}`, role: "assistant", type: "text",
      content: parts.join(" "),
    } as TextMessage]);

    const projectId = ctxRef.current?.projectId;
    if (projectId) {
      window.dispatchEvent(new CustomEvent("project-status-change", {
        detail: { projectId, status: "Awaiting Approval" },
      }));
    }
  }, [triggerEvent]);

  // ── ParsedOffers card ────────────────────────────────────────────────────────
  const handleParsedOffersApply = useCallback((msgId: string, offers: CustomOffer[]) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, applied: true } as ParsedOffersMsg : m));

    const projectOpen = Boolean(ctxRef.current?.projectId);
    const inSetupFlow = messagesRef.current.some(m => m.type === "setup");
    // Consume the stored pipeline text (clear it so it isn't used twice)
    const originalText = pendingPipelineTextRef.current;
    pendingPipelineTextRef.current = "";

    if (!projectOpen && !inSetupFlow) {
      // No project yet — store offers and trigger setup with full pipeline intent preserved
      pendingParsedOffersRef.current = offers;
      const oem = offers[0]?.make ?? "";
      // Extract email recipient from the original user text if present
      const emailMatch = originalText.match(/(?:send|email|share)(?:\s+(?:it|this|project))?(?:\s+(?:to|with))?\s+([A-Z][a-z]+)/);
      const recipientClue = emailMatch?.[1] ?? "";
      // IMPORTANT: force setup_project tool so the agent cannot call add_offers_to_project
      // or any other tool in the same response turn — which would cause the "X offers added" loop.
      let setupMsg = `Next: setup_project for a new ${oem} campaign.`;
      if (recipientClue) {
        setupMsg += ` After setup, send by email to ${recipientClue}.`;
      } else if (/template/i.test(originalText)) {
        setupMsg += ` After setup, add templates.`;
      }
      sendInternal(setupMsg);
      return;
    }

    // Project already open or setup card already in thread — add offers directly
    dispatchAction({ action: "add_custom_offers", offers });
    if (inSetupFlow) {
      fireNextStep("offers");
    } else if (originalText) {
      // Project was open — check if there is remaining pipeline to execute (e.g. email)
      const emailMatch = originalText.match(/(?:send|email|share)(?:\s+(?:it|this|project))?(?:\s+(?:to|with))?\s+([A-Z][a-z]+)/);
      const recipientClue = emailMatch?.[1] ?? "";
      if (recipientClue) {
        setTimeout(() => sendInternal(`Offers added. Now send by email to ${recipientClue}.`), 400);
      }
    }
  }, [dispatchAction, fireNextStep, sendInternal]);

  const handleParsedOffersDismiss = useCallback((msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
  }, []);

  // ── Brand card ──────────────────────────────────────────────────────────────
  const handleBrandApply = useCallback((oem: string) => {
    dispatchAction({ action: "set_brand", oem });
    // Fire next step so the flow-complete handler runs (generates assets prompt +
    // propose_task_owners). Without this, the flow would silently end here.
    setTimeout(() => fireNextStep("brand"), 400);
  }, [dispatchAction, fireNextStep]);

  // ── Thread management ────────────────────────────────────────────────────────
  const handleNewThread = useCallback(() => {
    setMessages([]);
    setStreamingText("");
    currentThreadIdRef.current = null;
    setShowHistory(false);
    proactiveModeRef.current = false;
    setProactiveMode(false);
  }, []);

  const handleLoadThread = useCallback((thread: AgentThread) => {
    setMessages(thread.messages);
    currentThreadIdRef.current = thread.id;
    setShowHistory(false);
  }, []);

  // Reset thread when the user switches to a different project.
  // Exception: if the project was just created by this conversation (setup card confirmed),
  // we must NOT reset — the history contains the full pipeline context.
  const prevProjectIdRef = useRef<string | null>(null);
  useEffect(() => {
    const newId = projectContext?.projectId ?? "";
    if (prevProjectIdRef.current !== null && prevProjectIdRef.current !== newId) {
      if (projectCreatedByConversationRef.current) {
        // Project created from this conversation — keep the history intact
        projectCreatedByConversationRef.current = false;
      } else {
        handleNewThread();
      }
    }
    prevProjectIdRef.current = newId;
  }, [projectContext?.projectId, handleNewThread]);

  // ── "Create a project" chip — shows a brief thinking moment, then the card ──
  const handleCreateProjectClick = useCallback(() => {
    if (simulatingStream) return; // prevent double-tap
    const ctx = ctxRef.current;

    const stagedFiles = stagedFilesRef.current.slice();
    if (stagedFiles.length > 0) {
      stagedFilesRef.current = [];
      const imageFiles = stagedFiles.filter(f => f.type.startsWith("image/"));
      const docFiles   = stagedFiles.filter(f => !f.type.startsWith("image/"));

      if (imageFiles.length > 0 && docFiles.length === 0) {
        // Pure image → bg flow (hasBgIntent detection in send())
        send("Create a project", imageFiles);
        return;
      }

      // Has Excel/PDF: queue for after project creation, show setup card below
      if (docFiles.length > 0) pendingOffersFilesRef.current = docFiles;
      // If there were also images alongside docs, ignore them for now (edge case)
    }

    // Feature 2: If a project is open and already complete (campaign_cta), offer to start fresh.
    if (ctx?.projectId) {
      const isComplete = messagesRef.current.some(m => m.type === "campaign_cta");
      setMessages(prev => [...prev,
        { id: `u-${Date.now()}`, role: "user", type: "text", content: "Create a project" } as TextMessage,
        { id: `a-${Date.now()}`, role: "assistant", type: "text",
          content: isComplete
            ? `**${ctx.projectName}** is complete — would you like to create a new project? I'll save this one and start fresh. Just say **yes** to confirm.`
            : `**${ctx.projectName}** is already open. I can add or change offers, templates, backgrounds, or share it — just ask. To start a completely new project, close this one first.` } as TextMessage,
      ]);
      if (isComplete) setAwaitingNewProject(true);
      return;
    }

    // Infer OEM from the first available offer; fall back to "General"
    const oem = ctx?.availableOffers?.[0]?.make ?? "General";
    const now  = new Date();
    const fmt  = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const startDate = fmt(now);
    const endDate   = fmt(new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()));
    const setupInput: SetupInput = {
      project_name: deduplicateName("New Project", knownProjectNames),
      oem,
      start_date: startDate,
      end_date:   endDate,
      flow_steps: ["offers", "templates", "backgrounds", "brand"],
    };
    // 1. Show user message immediately
    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", type: "text", content: "Create a project" } as TextMessage,
    ]);
    // 2. Simulate agent thinking (arc animation plays)
    setSimulatingStream(true);
    // 3. After a brief pause, drop the intro message + setup card
    setTimeout(() => {
      setSimulatingStream(false);
      const oemLabel = oem !== "General" ? ` for **${oem}**` : "";
      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`, role: "assistant", type: "text",
          content: `I'll set up a new project${oemLabel}. Review the details below and confirm when you're ready — you can edit any field before creating.`,
        } as TextMessage,
        { id: `setup-${Date.now()}`, role: "assistant", type: "setup", input: setupInput, applied: false } as SetupMsg,
      ]);
    }, 1100);
  }, [knownProjectNames, simulatingStream, send]);

  const sendWithStaged = useCallback((text: string) => {
    const files = stagedFilesRef.current.slice();
    stagedFilesRef.current = [];
    send(text, files);
  }, [send]);

  // ── Full proposal card (existing projects) ───────────────────────────────────
  const handleProposalApply = useCallback((msgId: string, offerIds: string[], templateIds: string[], name?: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, applied: true } as ProposalMsg : m));
    if (offerIds.length)    dispatchAction({ action: "add_offers",      offerIds });
    if (templateIds.length) dispatchAction({ action: "add_templates",   templateIds });
    if (name)               dispatchAction({ action: "set_project_name", name });
  }, [dispatchAction]);

  const handleProposalDismiss = useCallback((msgId: string) =>
    setMessages(prev => prev.filter(m => m.id !== msgId)), []);

  // Agency user → focus is account-based; others → project-based
  const isAgency = userType === 'dealer';
  const focusLabel = isAgency
    ? selectedAccount
    : (projectContext?.projectName ?? "Honda of Anywhere");
  const hasMessages = messages.length > 0 || streaming || simulatingStream;
  const arcState = useConstellationAnim((streaming && !streamingText) || simulatingStream || bgProcessing);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        /* Outer: animates width so MainPane (flex-1) expands/shrinks in concert */
        <motion.div key="project-agent-pane-wrapper"
          initial={{ width: 0 }} animate={{ width: paneWidth }} exit={{ width: 0 }}
          transition={isResizing ? { duration: 0 } : { duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
          className="flex-none h-full overflow-hidden"
        >
        <motion.div key="project-agent-pane"
          initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
          style={{ willChange: "transform", width: paneWidth }}
          className="relative flex-none h-full overflow-hidden bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.04)]"
        >
          {/* Drag handle — left edge, resize pane width */}
          <div
            className="absolute left-0 top-0 h-full w-[6px] cursor-col-resize z-10 group"
            onMouseDown={handlePaneDragStart}
          >
            <div className="h-full w-[3px] ml-[1.5px] bg-transparent group-hover:bg-[#6356e1] group-active:bg-[#6356e1] transition-colors duration-150 rounded-full" />
          </div>
          <div className="flex flex-col h-full pt-[12px] px-[16px]">

            {/* ── Top bar ─────────────────────────────────────────── */}
            <Tooltip.Provider delayDuration={400}>
            <div className="relative flex items-center gap-[4px] pb-[12px] shrink-0">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    aria-label={showHistory ? "Back to conversation" : "Nudge close panel"}
                    onClick={() => { if (showHistory) setShowHistory(false); }}
                    className="flex items-center justify-center rounded-full w-[28px] h-[28px] hover:bg-black/5 transition-colors cursor-pointer shrink-0"
                  >
                    <ChevronLeft size={16} strokeWidth={1.5} className="text-[rgba(17,16,20,0.56)]" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content sideOffset={5} className="z-[999] px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-white bg-[var(--ink)] shadow-md select-none">
                    {showHistory ? "Back to conversation" : "Nudge close panel"}
                    <Tooltip.Arrow className="fill-[var(--ink)]" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <span className="ml-0.5 text-[16px] text-[var(--ink)] tracking-[0.15px] whitespace-nowrap shrink-0"
                style={{ fontWeight: 500, lineHeight: "1.5" }}>
                AI Agent Auto
              </span>
              <button aria-label="Select agent" className="p-[5px] rounded-full hover:bg-black/5 transition-colors cursor-pointer shrink-0 ml-[2px]">
                <div className="size-[20px] flex items-center justify-center">
                  <ChevronDown size={12} strokeWidth={1.5} className="text-[rgba(17,16,20,0.56)]" />
                </div>
              </button>

              <div className="absolute right-[-6px] top-0 flex items-center gap-[2px]">
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      aria-label={showHistory ? "Back to chat" : "Thread history"}
                      onClick={() => { setShowHistory(h => !h); setHistorySearch(""); }}
                      className={cn("flex items-center justify-center rounded-full w-[28px] h-[28px] hover:bg-black/5 transition-colors cursor-pointer text-[rgba(17,16,20,0.56)]", showHistory && "bg-black/5")}
                    >
                      <IconHistory />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content sideOffset={5} className="z-[999] px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-white bg-[var(--ink)] shadow-md select-none">
                      Thread history
                      <Tooltip.Arrow className="fill-[var(--ink)]" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button aria-label="Fullscreen" onClick={handleNewThread} className="flex items-center justify-center rounded-full w-[28px] h-[28px] hover:bg-black/5 transition-colors cursor-pointer text-[rgba(17,16,20,0.56)]">
                      <IconExpand />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content sideOffset={5} className="z-[999] px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-white bg-[var(--ink)] shadow-md select-none">
                      Fullscreen
                      <Tooltip.Arrow className="fill-[var(--ink)]" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button onClick={onClose} aria-label="Close panel" className="flex items-center justify-center rounded-full w-[28px] h-[28px] hover:bg-black/5 transition-colors cursor-pointer text-[rgba(17,16,20,0.56)]">
                      <IconClose />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content sideOffset={5} className="z-[999] px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-white bg-[var(--ink)] shadow-md select-none">
                      Close panel
                      <Tooltip.Arrow className="fill-[var(--ink)]" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </div>
            </div>
            </Tooltip.Provider>

            {/* ── Body ────────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-h-0">

              {showHistory ? (
                /* HISTORY STATE */
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Search + new-thread row */}
                  <div className="flex items-center gap-[8px] mb-[12px] shrink-0">
                    <div className="relative flex-1">
                      <Search size={13} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[var(--ink-tertiary)] pointer-events-none" />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={e => setHistorySearch(e.target.value)}
                        placeholder="Search conversations…"
                        className="w-full pl-[30px] pr-[10px] py-[7px] rounded-[10px] text-[12px] text-[var(--ink)] border border-[rgba(0,0,0,0.1)] bg-[#fafafb] outline-none focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)] transition-all"
                      />
                    </div>
                    <button
                      onClick={handleNewThread}
                      title="New conversation"
                      className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[rgba(71,59,171,0.08)] hover:bg-[rgba(71,59,171,0.14)] transition-colors cursor-pointer shrink-0 text-[var(--brand-accent)]"
                    >
                      <Plus size={15} strokeWidth={2} />
                    </button>
                  </div>

                  {/* Thread list */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {(() => {
                      const filtered = threads.filter(t =>
                        !historySearch || t.title.toLowerCase().includes(historySearch.toLowerCase())
                      );
                      const groups = groupThreadsByDate(filtered);
                      if (groups.length === 0) {
                        return (
                          <div className="flex items-center justify-center h-[120px] text-[13px] text-[var(--ink-tertiary)]">
                            No conversations yet
                          </div>
                        );
                      }
                      return groups.map(({ label, items }) => (
                        <div key={label} className="mb-[16px]">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-tertiary)] mb-[6px] px-[2px]">{label}</p>
                          <div className="flex flex-col gap-[2px]">
                            {items.map(thread => (
                              <button
                                key={thread.id}
                                onClick={() => handleLoadThread(thread)}
                                className={cn(
                                  "w-full text-left px-[10px] py-[8px] rounded-[10px] hover:bg-[rgba(0,0,0,0.04)] transition-colors",
                                  thread.id === currentThreadIdRef.current && "bg-[rgba(71,59,171,0.06)]"
                                )}
                              >
                                <p className="text-[13px] text-[var(--ink)] truncate"
                                  style={{ fontWeight: 500 }}>
                                  {thread.title}
                                </p>
                                <p className="text-[11px] text-[var(--ink-tertiary)] mt-[1px]">
                                  {new Date(thread.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : !hasMessages ? (
                /* NULL STATE */
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="pt-[12px] shrink-0">
                    <p className="text-[20px] tracking-[0.15px] leading-[1.6] opacity-90 mb-[10px]"
                      style={{ fontWeight: 700,
                        backgroundImage: "linear-gradient(99.7748deg, rgb(71,59,171) 37.41%, rgb(172,171,255) 55.078%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      Welcome, Jorge
                    </p>
                    <p className="text-[14px] text-[var(--ink)] tracking-[0.15px] leading-[1.5] opacity-90 mb-[10px]">
                      {`Hi, I'm your Auto Intelligence Agent, ready to help you build and optimise your advertising projects.`}
                    </p>
                    <div className="flex items-center gap-[6px]">
                      <p className="text-[14px] text-[var(--ink)] tracking-[0.15px] leading-[1.5] opacity-90 whitespace-nowrap shrink-0">My current focus is</p>
                      <button className="flex items-center cursor-pointer">
                        <span className="text-[14px] tracking-[0.15px] leading-[1.5] opacity-90 whitespace-nowrap"
                          style={{ fontWeight: 700,
                            backgroundImage: "linear-gradient(90deg, var(--brand-accent), var(--brand-dark-mode))",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                          {focusLabel}
                        </span>
                        <div className="size-[22px] flex items-center justify-center ml-[-2px]">
                          <ChevronDown size={12} strokeWidth={1.5} style={{ color: "var(--brand-accent)" }} />
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="flex flex-col items-center gap-[8px] pb-[16px] shrink-0">
                    <AgentInput ref={agentInputRef} onSubmit={send} onFilesChange={files => { stagedFilesRef.current = files; }} onStop={stop} streaming={streaming} accountName={isAgency ? selectedAccount : "Honda of Anywhere"} />
                    <div className="flex flex-wrap gap-[8px] items-center justify-center w-full">
                      {PROJECT_CATEGORIES.map(cat => {
                        const chip = <CategoryChip label={cat} onClick={cat === "Create Automatic Project" ? () => send(CATEGORY_MESSAGES[cat] ?? cat, []) : () => agentInputRef.current?.populate(CATEGORY_MESSAGES[cat] ?? cat)} />;
                        if (cat === "Create Automatic Project") {
                          return (
                            <Tooltip.Provider key={cat} delayDuration={400}>
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>{chip}</Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content side="top" sideOffset={6} className="z-[999] max-w-[200px] px-[8px] py-[6px] rounded-[6px] text-[11px] font-medium leading-[1.4] text-white bg-[var(--ink)] shadow-md select-none text-center animate-in fade-in-0 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-[450ms]">
                                    Create a full project. Agent will pick up all of our templates and take decisions for you.
                                    <Tooltip.Arrow className="fill-[var(--ink)]" />
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            </Tooltip.Provider>
                          );
                        }
                        return <CategoryChip key={cat} label={cat} onClick={() => agentInputRef.current?.populate(CATEGORY_MESSAGES[cat] ?? cat)} />;
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* CHAT STATE */
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto custom-scrollbar pb-2" style={{ minHeight: 0 }}>
                    <div className="flex flex-col gap-[12px] pt-[4px]">

                      {(() => {
                        // Prefer the authoritative context field (covers all add paths: propose_backgrounds,
                        // add_backgrounds_to_project tool, and manual UI selection). Fall back to
                        // scanning the message history in case context hasn't re-dispatched yet.
                        const confirmedBgIds = filteredContext?.currentBackgroundIds
                          ?? messages
                            .filter((m): m is BackgroundsMsg => m.type === "backgrounds" && m.applied)
                            .flatMap(m => m.input.background_ids);
                        const setupPlatforms = messages
                          .filter((m): m is SetupMsg => m.type === "setup" && m.applied)
                          .at(-1)?.input.platforms ?? [];
                        return messages.map(msg => (
                        <MessageBubble
                          key={msg.id} message={msg} context={filteredContext}
                          projectName={projectContext?.projectName ?? "this project"}
                          existingProjectNames={knownProjectNames}
                          confirmedBackgroundIds={confirmedBgIds}
                          setupPlatforms={setupPlatforms}
                          onSetupApply={handleSetupApply}
                          onSetupDismiss={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                          onOffersApply={handleOffersApply}
                          onOffersDismiss={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                          onTemplatesApply={handleTemplatesApply}
                          onTemplatesDismiss={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                          onBackgroundsApply={handleBackgroundsApply}
                          onBackgroundsDismiss={handleBackgroundsDismiss}
                          onBrandApply={handleBrandApply}
                          onBrandDismiss={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                          onProposalApply={(offerIds, templateIds, name) =>
                            handleProposalApply(msg.id, offerIds, templateIds, name)}
                          onProposalDismiss={() => handleProposalDismiss(msg.id)}
                          onEmailApply={handleEmailApply}
                          onEmailDismiss={handleEmailDismiss}
                          onShareChooseEmail={handleShareChooseEmail}
                          onShareChoosePlatform={handleShareChoosePlatform}
                          onReviewerPickerConfirm={(contacts, channels, message) => handleReviewerPickerConfirm(msg.id, contacts, channels, message)}
                          onParsedOffersApply={(offers) => handleParsedOffersApply(msg.id, offers)}
                          onParsedOffersDismiss={() => handleParsedOffersDismiss(msg.id)}
                          onNotifyOwnersApply={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, applied: true } : m))}
                          onTaskOwnersApply={(owners) => {
                            dispatchAction({ action: "set_task_owners", owners });
                            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, applied: true } : m));
                            // No continuation needed — task owners is always the final step.
                            // Sending any continuation here risks the agent re-reading the
                            // original "Proactive build" message and calling setup_project again.
                          }}
                          proactive={proactiveMode}
                          onProactiveQuestionsApply={handleProactiveQuestionsSubmit}
                          dispatchAction={dispatchAction}
                          onDealerBgApprove={(bgObject) => {
                            // ── PHASE 2: Generate per-template clean bgs + per-offer composites ──
                            const dealerPhoto = (bgObject as any)._dealerPhotoDataUrl as string | undefined;
                            const confirmedOfferDescs = (bgObject as any)._confirmedOffers as
                              Array<{ offerId: string; year: string; make: string; model: string; trim: string; imageUrl?: string }> | undefined;

                            // Set generating flag BEFORE adding the bg to the library so JellyBeanCard
                            // shows the skeleton from the very first render — prevents a one-frame flash
                            // of the wrong-ratio placeholder image.
                            if (dealerPhoto) {
                              dispatchAction({ action: "set_dealer_bg_generating", value: true } as never);
                            }
                            dispatchAction({ action: "add_custom_background", background: bgObject });
                            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, applied: true } as DealerBgProposalMsg : m));
                            // Open Backgrounds accordion and scroll to it, then scroll to Preview
                            window.dispatchEvent(new CustomEvent(AGENT_SCROLL_TO_SECTION_EVENT, { detail: { section: "backgrounds" } }));
                            setTimeout(() => window.dispatchEvent(new CustomEvent(AGENT_SCROLL_TO_SECTION_EVENT, { detail: { section: "preview" } })), 600);
                            setTimeout(() => fireNextStep("dealer_bg"), 300);

                            if (dealerPhoto) {
                              (async () => {
                                try {
                                  const { generateDealerBackgroundsForTemplates } =
                                    await import("../../../lib/dealerBackgroundGenerator");

                                  // Phase 2a: per-template CLEAN backgrounds via nano-banana
                                  // (full scene + aspect_ratio recompose). Only the SELECTED
                                  // template keys are generated.
                                  // The clean base (car-free, from Phase 1a) is the input —
                                  // no re-cleaning per template.
                                  const selectedKeys = (bgObject as any)._templateKeys as string[] | undefined;
                                  const cleanBase = (bgObject as any)._cleanBaseBg as string | undefined ?? dealerPhoto;
                                  const cleanBgImages = await generateDealerBackgroundsForTemplates(
                                    cleanBase,
                                    selectedKeys ?? [],
                                  );
                                  const fallback = (bgObject as any).images["website-600x450"] ?? cleanBase;
                                  (selectedKeys ?? Object.keys(cleanBgImages)).forEach(
                                    k => { if (!cleanBgImages[k]) cleanBgImages[k] = fallback; }
                                  );

                                  // NO Phase 2b — car placement is deterministic canvas math in
                                  // JellyBeanCard (dealerCarPlacement): alpha-detected tires on a
                                  // known ground line + contact shadow. Zero model calls per offer.
                                  const updatedBg = {
                                    ...(bgObject as any),
                                    images: { ...(bgObject as any).images, ...cleanBgImages },
                                  };
                                  dispatchAction({ action: "add_custom_background", background: updatedBg });
                                } catch { /* fallback remains */ }
                                finally {
                                  dispatchAction({ action: "set_dealer_bg_generating", value: false } as never);
                                }
                              })();
                            }
                          }}
                          onDealerBgSkip={() => {
                            setMessages(prev => prev.map(m =>
                              m.id === msg.id ? { ...m, applied: true } as DealerBgProposalMsg : m
                            ));
                            setTimeout(() => {
                              setMessages(prev => [...prev, {
                                id: `a-${Date.now()}`, role: "assistant", type: "text",
                                content: "No problem! You can upload a different image, and I'll pick a background from the catalog.",
                              } as TextMessage]);
                            }, 200);
                          }}
                        />
                      ));
                      })()}

                      {/* Streaming — suppressed when bgProcessing to avoid duplicate indicator */}
                      {streaming && streamingText && !bgProcessing && (
                        <AssistantBubble text={streamingText} streaming />
                      )}

                      {/* Background generation loading indicator — absorbs LLM streaming text when available */}
                      {bgProcessing && (
                        <div className="flex items-center gap-[8px]">
                          <img src={imgAgentAvatar} alt="AI" className="w-[22px] h-[22px] rounded-full object-cover shrink-0" />
                          <div className="flex items-center gap-[6px]">
                            <ConstellationArcMark arcs={arcState} size={18} />
                            <span className="text-[12px] text-[var(--ink-secondary)] tracking-[0.4px]">
                              {streaming && streamingText ? streamingText : "Generating the background image — in-painting the scene…"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Contextual loading indicator */}
                      {((streaming && !streamingText) || simulatingStream) && (
                        <div className="flex items-center gap-[8px]">
                          <img src={imgAgentAvatar} alt="AI" className="w-[22px] h-[22px] rounded-full object-cover shrink-0" />
                          <div className="flex items-center gap-[6px]">
                            <ConstellationArcMark arcs={arcState} size={18} />
                            <span className="text-[12px] text-[var(--ink-secondary)] tracking-[0.4px]">{simulatingStream ? "Setting up your project…" : loadingLabel}</span>
                          </div>
                        </div>
                      )}

                      <div ref={bottomRef} />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-[8px] pb-[16px] shrink-0 pt-[8px]">
                    <AgentInput ref={agentInputRef} onSubmit={send} onFilesChange={files => { stagedFilesRef.current = files; }} onStop={stop} streaming={streaming} accountName={isAgency ? selectedAccount : "Honda of Anywhere"} />
                    <div className="flex flex-wrap gap-[8px] items-center justify-center w-full">
                      {PROJECT_CATEGORIES.map(cat => {
                        if (cat === "Create Automatic Project") {
                          return (
                            <Tooltip.Provider key={cat} delayDuration={400}>
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <CategoryChip label={cat} onClick={() => send(CATEGORY_MESSAGES[cat] ?? cat, [])} />
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content side="top" sideOffset={6} className="z-[999] max-w-[200px] px-[8px] py-[6px] rounded-[6px] text-[11px] font-medium leading-[1.4] text-white bg-[var(--ink)] shadow-md select-none text-center animate-in fade-in-0 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-[450ms]">
                                    Create a full project. Agent will pick up all of our templates and take decisions for you.
                                    <Tooltip.Arrow className="fill-[var(--ink)]" />
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            </Tooltip.Provider>
                          );
                        }
                        return <CategoryChip key={cat} label={cat} onClick={() => agentInputRef.current?.populate(CATEGORY_MESSAGES[cat] ?? cat)} />;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Message bubble router ─────────────────────────────────────────────────────
function MessageBubble({
  message, context, projectName, existingProjectNames,
  confirmedBackgroundIds,
  setupPlatforms,
  onSetupApply, onSetupDismiss,
  onOffersApply, onOffersDismiss,
  onTemplatesApply, onTemplatesDismiss,
  onBackgroundsApply, onBackgroundsDismiss,
  onBrandApply, onBrandDismiss,
  onProposalApply, onProposalDismiss,
  onEmailApply, onEmailDismiss,
  onShareChooseEmail, onShareChoosePlatform,
  onReviewerPickerConfirm,
  onParsedOffersApply, onParsedOffersDismiss,
  onNotifyOwnersApply,
  onTaskOwnersApply,
  proactive,
  onProactiveQuestionsApply,
  dispatchAction,
  onDealerBgApprove,
  onDealerBgSkip,
}: {
  message: Message;
  context: ProjectContextPayload | null;
  projectName: string;
  existingProjectNames: string[];
  confirmedBackgroundIds: string[];
  setupPlatforms?: string[];
  onSetupApply: (name: string, account: string, oem: string, start: string, end: string) => void;
  onSetupDismiss: () => void;
  onOffersApply: (offerIds: string[]) => void;
  onOffersDismiss: () => void;
  onTemplatesApply: (templateIds: string[]) => void;
  onTemplatesDismiss: () => void;
  onBackgroundsApply: (backgroundIds: string[]) => void;
  onBackgroundsDismiss: () => void;
  onBrandApply: (oem: string) => void;
  onBrandDismiss: () => void;
  onProposalApply: (offerIds: string[], templateIds: string[], name?: string) => void;
  onProposalDismiss: () => void;
  onEmailApply: (recipient: string, message: string) => void;
  onEmailDismiss: () => void;
  onShareChooseEmail: (recipientHint: string) => void;
  onShareChoosePlatform: (recipientName: string) => void;
  onReviewerPickerConfirm: (contacts: typeof MOCK_CONTACTS[number][], channels: Record<string, "platform" | "email">, message: string) => void;
  onParsedOffersApply: (offers: CustomOffer[]) => void;
  onParsedOffersDismiss: () => void;
  onNotifyOwnersApply: () => void;
  onTaskOwnersApply: (owners: Record<string, string>) => void;
  proactive?: boolean;
  onProactiveQuestionsApply?: (goal: string, timeline: string, offerFocus: string) => void;
  dispatchAction?: (a: AgentActionPayload) => void;
  onDealerBgApprove?: (bgObject: { id: string; name: string; thumbnail: string; images: Record<string, string> }) => void;
  onDealerBgSkip?: () => void;
}) {
  if (message.type === "continuation") {
    return null;
  }

  if (message.type === "proactive_questions") {
    return (
      <ProactiveQuestionsCard
        input={message.input}
        applied={message.applied}
        onSubmit={onProactiveQuestionsApply ?? (() => {})}
      />
    );
  }

  if (message.type === "user_file") {
    return (
      <div className="flex justify-end">
        <div className="ml-[40px] bg-[#fafaff] rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] px-[12px] py-[10px] relative">
          <div aria-hidden="true" className="absolute inset-0 rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] border border-[rgba(99,86,225,0.5)] pointer-events-none" />
          {message.text && (
            <p className="text-[12px] text-[var(--ink)] leading-[1.43] tracking-[0.17px] mb-[6px]">{message.text}</p>
          )}
          <div className="flex flex-wrap gap-[6px]">
            {message.files.map((f, i) => (
              <div key={i} className="flex items-center gap-[6px] px-[8px] py-[5px] bg-[rgba(71,59,171,0.06)] border border-[rgba(71,59,171,0.18)] rounded-[8px]">
                <FileText size={11} className="text-[var(--brand-accent)] shrink-0" />
                <span className="text-[11px] text-[var(--brand-accent)] truncate max-w-[160px]"
                  style={{ fontWeight: 500 }}>{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "parsed_offers") {
    return (
      <ParsedOffersCard
        input={message.input}
        applied={message.applied}
        onApply={onParsedOffersApply}
        onDismiss={onParsedOffersDismiss}
      />
    );
  }

  if (message.type === "dealer_bg_proposal") {
    const msg = message as DealerBgProposalMsg;
    if (msg.applied) {
      return (
        <div className="ml-[32px] mt-[4px]">
          <ConfirmedChip label="Scene background added to project" />
        </div>
      );
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.10)] bg-white overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 380 }}
      >
        {/* Header */}
        <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>Scene Background Preview</p>
          <p style={{ fontSize: 10.5, color: "var(--ink-tertiary)", lineHeight: 1.4 }}>
            Your image adapted with a vehicle on the foreground. Approve to use in this campaign.
          </p>
        </div>

        {/* Preview composite */}
        <div className="relative w-full" style={{ aspectRatio: "4/3", background: "#ececf2" }}>
          <DealerBgPreviewImage src={msg.previewUrl} />
          <div
            className="absolute top-[8px] left-[8px] rounded-[4px] text-white font-medium"
            style={{ fontSize: 9, padding: "2px 6px", background: "rgba(71,59,171,0.82)" }}
          >
            Preview
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-[8px] px-[14px] py-[12px]">
          <button
            onClick={() => onDealerBgApprove?.(msg.bgObject)}
            className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white cursor-pointer"
            style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
          >
            ✓ Use this background
          </button>
          <button
            onClick={() => onDealerBgSkip?.()}
            className="px-[14px] py-[8px] rounded-full text-[13px] text-[var(--ink-secondary)] hover:bg-black/5 transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>
      </motion.div>
    );
  }

  if (message.type === "tool") {
    return (
      <div className="ml-[32px] flex">
        <ToolChipView name={message.name} input={message.input} />
      </div>
    );
  }

  if (message.type === "setup") {
    return (
      <SetupProjectCard
        input={message.input}
        existingNames={existingProjectNames}
        onApply={onSetupApply}
        onDismiss={onSetupDismiss}
        proactive={proactive}
      />
    );
  }

  if (message.type === "offers") {
    return (
      <OffersProposalCard
        input={message.input}
        context={context}
        onApply={onOffersApply}
        onDismiss={onOffersDismiss}
        proactive={proactive}
        dispatchAction={dispatchAction}
      />
    );
  }

  if (message.type === "templates") {
    return (
      <TemplatesProposalCard
        input={message.input}
        context={context}
        onApply={onTemplatesApply}
        onDismiss={onTemplatesDismiss}
        proactive={proactive}
        platforms={setupPlatforms}
      />
    );
  }

  if (message.type === "preview") {
    return <PreviewStrip msg={message} context={context} />;
  }

  if (message.type === "backgrounds") {
    return (
      <BackgroundsProposalCard
        input={message.input}
        onApply={onBackgroundsApply}
        onDismiss={onBackgroundsDismiss}
        proactive={proactive}
      />
    );
  }

  if (message.type === "email") {
    return (
      <EmailProposalCard
        input={message.input}
        projectName={projectName}
        onApply={onEmailApply}
        onDismiss={onEmailDismiss}
      />
    );
  }

  if (message.type === "task_owners") {
    return (
      <div key={message.id}>
        <TaskOwnersProposalCard
          input={message.input}
          liveOwners={message.liveOwners}
          onApply={(owners) => {
            // Convert id-keyed selections → name-keyed for the action
            const ownerNames: Record<string, string> = {};
            Object.entries(owners).forEach(([section, ownerId]) => {
              const owner = PROJECT_OWNERS.find(o => o.id === ownerId);
              if (owner) ownerNames[section] = owner.name;
            });
            onTaskOwnersApply(ownerNames);
          }}
        />
      </div>
    );
  }

  if (message.type === "notify_owners") {
    return (
      <div key={message.id}>
        <NotifyOwnersCard
          liveOwners={message.liveOwners}
          projectName={context?.projectName ?? "this project"}
          onApply={onNotifyOwnersApply}
        />
      </div>
    );
  }

  if (message.type === "share") {
    return (
      <ShareChooserCard
        input={message.input}
        projectName={projectName}
        applied={message.applied}
        onChooseEmail={onShareChooseEmail}
        onChoosePlatform={onShareChoosePlatform}
      />
    );
  }

  if (message.type === "reviewer_picker") {
    const projectUrl = context?.projectId
      ? `https://constellation-ux-app.vercel.app/OEM/Projects?project=${context.projectId}`
      : "https://constellation-ux-app.vercel.app/OEM/Projects";
    return (
      <ReviewerPickerCard
        applied={message.applied}
        projectName={projectName}
        projectUrl={projectUrl}
        onSend={onReviewerPickerConfirm}
        recipientHints={(message as ReviewerPickerMsg).recipientHints}
      />
    );
  }

  if (message.type === "campaign_cta") {
    return <CampaignCtaCard />;
  }

  if (message.type === "brand") {
    return (
      <BrandProposalCard
        input={message.input}
        projectName={projectName}
        onApply={onBrandApply}
        onDismiss={onBrandDismiss}
        proactive={proactive}
      />
    );
  }

  if (message.type === "proposal") {
    return (
      <SmartProposalCard
        input={message.input}
        context={context}
        onApply={onProposalApply}
        onDismiss={onProposalDismiss}
      />
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="ml-[40px] bg-[#fafaff] rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] px-[12px] py-[10px] relative">
          <div aria-hidden="true" className="absolute inset-0 rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] border border-[rgba(99,86,225,0.5)] pointer-events-none" />
          <p className="text-[12px] text-[var(--ink)] leading-[1.43] tracking-[0.17px]">{message.content}</p>
        </div>
      </div>
    );
  }

  const textMsg = message as TextMessage;
  if (textMsg.isGenerateAssetsPrompt) {
    return (
      <div>
        <AssistantBubble text={textMsg.content} />
        <GenerateAssetsSmartCard
          context={context}
          confirmedBackgroundIds={confirmedBackgroundIds}
          applied={textMsg.applied ?? false}
          totalGenerated={textMsg.totalGenerated}
        />
      </div>
    );
  }
  return <AssistantBubble text={textMsg.content} />;
}

// ─── Assistant bubble with avatar + action bar ─────────────────────────────────
function AssistantBubble({ text, streaming = false, isGeneratePrompt = false }: { text: string; streaming?: boolean; isGeneratePrompt?: boolean }) {
  // Detect if text has markdown (tables, headings, bold) — render rich if so
  const hasMarkdown = /^\s*\|/m.test(text) || /^#{1,3} /m.test(text) || /\*\*[^*]+\*\*/.test(text);

  return (
    <div className="group">
      <div className="flex gap-[8px] items-start">
        <img src={imgAgentAvatar} alt="AI" className="w-[22px] h-[22px] rounded-full object-cover shrink-0 mt-[1px]" />
        <div className="flex-1 pt-[2px]">
          {hasMarkdown && !streaming
            ? <MarkdownContent text={text} />
            : (
              <p className="text-[13px] text-[var(--ink)] leading-[1.6] tracking-[0.17px] whitespace-pre-wrap">
                {text}
                {streaming && (
                  <span style={{ display: "inline-block", width: 2, height: 13, background: "var(--brand-accent)",
                    marginLeft: 2, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />
                )}
              </p>
            )
          }
        </div>
      </div>
      {isGeneratePrompt && !streaming && (
        <div className="ml-[30px] mt-[10px]">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent(AGENT_GENERATE_ASSETS_EVENT))}
            className="px-[18px] py-[9px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white cursor-pointer transition-all"
            style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
          >
            Generate Assets
          </button>
        </div>
      )}
      {!streaming && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ResponseActions text={text} />
        </div>
      )}
    </div>
  );
}
