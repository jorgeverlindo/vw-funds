"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, ChevronDown, Search, X, Check,
  Copy, ThumbsUp, ThumbsDown, Pencil, Download, Share2,
  Plus, Minus, FileText, Tag, Trash2, Eye,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { AgentInput } from "../AgentPane";
import type { UserType } from "../../AppContent";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "../ui/dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import imgAgentAvatar from "figma:asset/a66b3945941bddb97efa53207e606703467e02b3.png";
import { AvatarInitials } from "../ui/AvatarInitials";
import { PROJECT_OWNERS, PLATFORM_OPTIONS } from "./CreateProjectDialog";
import { ChannelChip } from "../ui/ChannelChip";
import { OfferCard } from "./offers/OfferCard";
import type { Offer as OfferCardData } from "./offers/OfferCard";
import { offerLibrary } from "./lib/mock-data";
import { useWorkflow } from "../../contexts/WorkflowContext";
import { TemplateZoneEditor } from "@projects/templates/TemplateZoneEditor";

// ─── Shared event constants ────────────────────────────────────────────────────
export const PROJECT_CONTEXT_EVENT         = "project-context-update";
export const PROJECT_AGENT_ACTION_EVENT    = "project-agent-action";
export const AGENT_SCROLL_TO_SECTION_EVENT = "agent-scroll-to-section";
export const AGENT_GENERATE_ASSETS_EVENT   = "agent-generate-assets";

export interface ProjectContextPayload {
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
  /** OEM name of the currently active brand kit, if any (e.g. "Honda") */
  activeBrandOem?: string;
  /** Per-section task owner names, keyed by section id (e.g. "offers", "templates") */
  taskOwners?: Record<string, string>;
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
}

export type AgentActionPayload =
  | { action: "add_offers";       offerIds: string[] }
  | { action: "remove_offers";    offerIds: string[] }
  | { action: "add_templates";    templateIds: string[] }
  | { action: "remove_templates"; templateIds: string[] }
  | { action: "set_project_name"; name: string }
  | { action: "create_project";   name: string; account: string; oem: string; startDate: string; endDate: string; owner?: string; platforms?: string[] }
  | { action: "set_brand";        oem: string }
  | { action: "add_backgrounds";  backgroundIds: string[] }
  | { action: "send_email";       recipient: string; message: string }
  | { action: "add_custom_offers"; offers: CustomOffer[] }
  | { action: "edit_offer"; offerId: string; patches: Partial<{ monthlyPayment: number; term: number; totalDueAtSigning: number; offerType: string; trim: string; year: string; make: string; model: string }> }
  | { action: "set_task_owners"; owners: Record<string, string> };

// ─── Multimodal API types ─────────────────────────────────────────────────────
type ApiContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

type ApiMessage = { role: "user" | "assistant"; content: string | ApiContentBlock[] };

// ─── Message model ─────────────────────────────────────────────────────────────
type Role = "user" | "assistant";

interface TextMessage    { id: string; role: Role;        type: "text";      content: string; isGenerateAssetsPrompt?: boolean }
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

type Message = TextMessage | ToolChipMsg | ProposalMsg | SetupMsg | OffersMsg | TemplatesMsg | BrandMsg | BackgroundsMsg | PreviewMsg | ContinuationMsg | EmailMsg | ShareMsg | UserFileMsg | ParsedOffersMsg | NotifyOwnersMsg | TaskOwnersMsg | ProactiveQuestionsMsg;

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
interface AgentThread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const THREADS_KEY = "constellation_agent_threads";

function loadAgentThreads(): AgentThread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    return raw ? (JSON.parse(raw) as AgentThread[]) : [];
  } catch { return []; }
}

function saveAgentThreads(threads: AgentThread[]) {
  try { localStorage.setItem(THREADS_KEY, JSON.stringify(threads)); } catch {}
}

function getThreadTitle(msgs: Message[]): string {
  const first = msgs.find((m): m is TextMessage => m.type === "text" && m.role === "user");
  if (!first) return "New conversation";
  const t = first.content.trim();
  return t.length > 46 ? t.slice(0, 46) + "…" : t;
}

function groupThreadsByDate(threads: AgentThread[]): { label: string; items: AgentThread[] }[] {
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo   = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const groups: Record<string, AgentThread[]> = { Today: [], Yesterday: [], "This week": [], Older: [] };
  for (const t of threads) {
    const d = new Date(t.updatedAt);
    if      (d >= today)     groups.Today.push(t);
    else if (d >= yesterday) groups.Yesterday.push(t);
    else if (d >= weekAgo)   groups["This week"].push(t);
    else                     groups.Older.push(t);
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items: items.sort((a, b) => b.updatedAt - a.updatedAt) }));
}

// ─── Constellation arc animation (matches AgentPane exactly) ──────────────────
interface ArcState { outer: boolean; middle: boolean; inner: boolean }

function ConstellationArcMark({ arcs, size = 20 }: { arcs: ArcState; size?: number }) {
  return (
    <svg width={size * 0.56} height={size} viewBox="0 0 18 33" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M2.22422 16.0471C2.22422 7.57204 8.61025 0.631495 16.6988 0.0413128C16.332 0.0118036 15.9594 0 15.5867 0C6.97648 0 0 7.18252 0 16.0471C0 24.9116 6.97648 32.0941 15.5867 32.0941C15.9594 32.0941 16.332 32.0823 16.6988 32.0528C8.61025 31.4626 2.22422 24.5221 2.22422 16.0471Z"
        fill="#473bab" style={{ opacity: arcs.outer ? 0.92 : 0.22, transition: "opacity 120ms ease" }} />
      <path d="M6.12227 16.047C6.12227 9.69073 10.9089 4.48533 16.9796 4.04269C16.7045 4.02498 16.4236 4.01318 16.1427 4.01318C9.6879 4.01318 4.4541 9.40154 4.4541 16.047C4.4541 22.6924 9.6879 28.0808 16.1427 28.0808C16.4236 28.0808 16.7045 28.069 16.9796 28.0513C10.9146 27.6086 6.12227 22.4032 6.12227 16.047Z"
        fill="#6356e1" style={{ opacity: arcs.middle ? 0.82 : 0.18, transition: "opacity 120ms ease" }} />
      <path d="M17.2605 8.04407C17.0771 8.03227 16.8937 8.02637 16.7045 8.02637C12.3994 8.02637 8.9082 11.6206 8.9082 16.0529C8.9082 20.4851 12.3994 24.0793 16.7045 24.0793C16.8937 24.0793 17.0771 24.0734 17.2605 24.0557C13.2134 23.7606 10.0261 20.2904 10.0261 16.0529C10.0261 11.8154 13.2191 8.34507 17.2605 8.04998V8.04407Z"
        fill="#8c86fc" style={{ opacity: arcs.inner ? 0.72 : 0.12, transition: "opacity 120ms ease" }} />
    </svg>
  );
}

function useConstellationAnim(running: boolean) {
  const [arcs, setArcs] = useState<ArcState>({ outer: false, middle: false, inner: false });
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearAll = () => { timerRefs.current.forEach(clearTimeout); timerRefs.current = []; };
  const all = (lit: boolean) => setArcs({ outer: lit, middle: lit, inner: lit });
  const setO = (lit: boolean) => setArcs(s => ({ ...s, outer: lit }));
  const setM = (lit: boolean) => setArcs(s => ({ ...s, middle: lit }));
  const setI = (lit: boolean) => setArcs(s => ({ ...s, inner: lit }));
  useEffect(() => {
    if (!running) { clearAll(); all(false); return; }
    let cancelled = false;
    function loop() {
      if (cancelled) return;
      const timers: ReturnType<typeof setTimeout>[] = [];
      let t = 80;
      const q = (delay: number, fn: () => void) => { t += delay; const id = setTimeout(() => { if (!cancelled) fn(); }, t); timers.push(id); };
      all(false);
      q(80,  () => setO(true));  q(240, () => setM(true));  q(240, () => setI(true));
      q(600, () => {});          q(180, () => all(false));   q(380, () => {});
      q(140, () => all(true));   q(280, () => all(false));   q(200, () => all(true));
      q(280, () => all(false));  q(320, () => {});
      q(80,  () => { all(false); setO(true); });
      q(220, () => { setO(false); setM(true); });
      q(220, () => { setM(false); setI(true); });
      q(220, () => { setI(false); });
      q(140, () => all(true)); q(420, () => all(false)); q(380, () => loop());
      timerRefs.current = timers;
    }
    loop();
    return () => { cancelled = true; clearAll(); setArcs({ outer: false, middle: false, inner: false }); };
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
  return arcs;
}

// ─── File helpers ─────────────────────────────────────────────────────────────

/** Read a File as a base64 string (no data-URL prefix) */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Parse an Excel file to a readable text representation using xlsx */
async function parseExcelToText(file: File): Promise<string> {
  try {
    const xlsx = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = xlsx.read(buf, { type: "array" });
    const lines: string[] = [`[Excel file: ${file.name}]`];
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const csv = xlsx.utils.sheet_to_csv(ws);
      if (csv.trim()) lines.push(`\nSheet: ${sheetName}\n${csv}`);
    }
    return lines.join("\n");
  } catch {
    return `[Excel file: ${file.name} — could not parse]`;
  }
}

// ─── SSE streaming hook ────────────────────────────────────────────────────────
function useAgentStream() {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamMessage = useCallback(
    async (
      messages: ApiMessage[],
      ctx: ProjectContextPayload,
      onDelta:  (d: string) => void,
      onTool:   (name: string, input: Record<string, unknown>) => void,
      onDone:   () => void,
      onError:  (msg: string) => void,
      forceTool?: string,
    ) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setStreaming(true);
      try {
        const res = await fetch("/api/agent/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({ messages, projectContext: ctx, ...(forceTool ? { forceTool } : {}) }),
        });
        if (!res.ok || !res.body) { onError(`Server error ${res.status}`); return; }
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
            if (ev.type === "text_delta")   onDelta(ev.delta as string);
            else if (ev.type === "tool_result") onTool(ev.name as string, ev.input as Record<string, unknown>);
            else if (ev.type === "done")    onDone();
            else if (ev.type === "error")   onError(ev.message as string);
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") onError(String(err));
      } finally { setStreaming(false); }
    }, []);
  const stop = useCallback(() => { abortRef.current?.abort(); setStreaming(false); }, []);
  return { streaming, setStreaming, streamMessage, stop };
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function inlineMarkdown(text: string): React.ReactNode[] {
  // Split on **bold** and render accordingly
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{ fontWeight: 600, color: "#1f1d25" }}>{p.slice(2, -2)}</strong>
      : p
  );
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect table block — starts with |
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      // Parse rows, skipping separator rows (---|---)
      const rows = tableLines
        .filter(l => !/^\s*\|[\s\-|]+\|\s*$/.test(l))
        .map(l =>
          l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim())
        );
      if (rows.length > 0) {
        const [header, ...body] = rows;
        nodes.push(
          <div key={`tbl-${i}`} className="overflow-x-auto my-[8px]">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, fontFamily: "'Roboto', sans-serif" }}>
              <thead>
                <tr style={{ background: "rgba(71,59,171,0.06)", borderBottom: "1.5px solid rgba(71,59,171,0.18)" }}>
                  {header.map((cell, ci) => (
                    <th key={ci} style={{ padding: "5px 10px", textAlign: "left", fontWeight: 600, color: "#473bab", whiteSpace: "nowrap", letterSpacing: "0.3px" }}>
                      {inlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: ri % 2 === 1 ? "rgba(0,0,0,0.015)" : "transparent" }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: "5px 10px", color: "#1f1d25", whiteSpace: "nowrap" }}>
                        {inlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // ### heading
    if (line.startsWith("### ")) {
      nodes.push(
        <p key={i} style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700, fontSize: 13, color: "#1f1d25", marginBottom: 2, marginTop: 6 }}>
          {inlineMarkdown(line.slice(4))}
        </p>
      );
      i++; continue;
    }

    // ## heading
    if (line.startsWith("## ")) {
      nodes.push(
        <p key={i} style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700, fontSize: 13.5, color: "#1f1d25", marginBottom: 3, marginTop: 8 }}>
          {inlineMarkdown(line.slice(3))}
        </p>
      );
      i++; continue;
    }

    // Empty line → small gap
    if (line.trim() === "") {
      nodes.push(<div key={i} style={{ height: 6 }} />);
      i++; continue;
    }

    // Regular line
    nodes.push(
      <p key={i} style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: "#1f1d25", lineHeight: 1.6, letterSpacing: "0.17px" }}>
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div className="flex flex-col gap-[1px]">{nodes}</div>;
}

// ─── Response action bar ───────────────────────────────────────────────────────
function ResponseActions({ text }: { text: string }) {
  const [liked,    setLiked]    = useState<boolean | null>(null);
  const [copied,   setCopied]   = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "constellation-response.txt";
    a.click(); URL.revokeObjectURL(url);
  };
  const handleShare = () => {
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else handleCopy();
  };

  const btn = "flex items-center justify-center w-[26px] h-[26px] rounded-full hover:bg-black/6 transition-colors cursor-pointer text-[#9c99a9] hover:text-[#686576]";

  return (
    <div className="flex items-center gap-[1px] mt-[6px] ml-[32px]">
      <button onClick={handleCopy} className={btn} title="Copy">
        {copied
          ? <Check size={12} className="text-[#2e9c5e]" strokeWidth={2.5} />
          : <Copy size={12} strokeWidth={1.7} />}
      </button>
      <button onClick={() => setLiked(liked === true ? null : true)} className={cn(btn, liked === true && "text-[#473bab]")} title="Like">
        <ThumbsUp size={12} strokeWidth={1.7} />
      </button>
      <button onClick={() => setLiked(liked === false ? null : false)} className={cn(btn, liked === false && "text-[#dc2626]")} title="Dislike">
        <ThumbsDown size={12} strokeWidth={1.7} />
      </button>
      <button className={btn} title="Edit">
        <Pencil size={12} strokeWidth={1.7} />
      </button>
      <button onClick={handleDownload} className={btn} title="Download">
        <Download size={12} strokeWidth={1.7} />
      </button>
      <button onClick={handleShare} className={btn} title="Share">
        <Share2 size={12} strokeWidth={1.7} />
      </button>
    </div>
  );
}

// ─── Confirmed chip ────────────────────────────────────────────────────────────
function ConfirmedChip({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-[6px] px-[10px] py-[5px] rounded-full"
      style={{ background: "rgba(35,150,90,0.08)", border: "1px solid rgba(35,150,90,0.18)", color: "#1e7a48" }}>
      <div className="w-[16px] h-[16px] rounded-full flex items-center justify-center shrink-0"
        style={{ background: "#2e9c5e" }}>
        <Check size={9} color="white" strokeWidth={3} />
      </div>
      <span style={{ fontSize: 12, fontFamily: "'Roboto', sans-serif", fontWeight: 500, letterSpacing: "0.17px" }}>
        {label}
      </span>
    </div>
  );
}

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

// ─── Shared custom select (replaces native <select>) ─────────────────────────

/** Standard select — shows current value, opens custom dropdown menu. */
function AgentSelect({
  value, onChange, options, placeholder, f,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  f: React.CSSProperties;
}) {
  const label = options.find(o => o.value === value)?.label ?? placeholder ?? "Select";
  const menuCls = "z-[500] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.1)] p-1 animate-in fade-in-0 zoom-in-95 min-w-[var(--radix-dropdown-menu-trigger-width)]";
  const itemCls = "flex items-center gap-2 px-[10px] py-[6px] rounded-lg text-[12px] text-[#1f1d25] cursor-pointer outline-none select-none data-[highlighted]:bg-[#f5f4f8]";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full flex items-center px-[10px] py-[7px] rounded-[8px] text-[12px] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none transition-all hover:border-[#b0b0b5] focus:border-[#473bab] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)] cursor-pointer text-left"
          style={f}
        >
          <span className="flex-1 truncate" style={{ color: value ? "#1f1d25" : "#9c99a9" }}>{label}</span>
          <ChevronDown size={10} className="shrink-0 text-[#9c99a9] ml-1" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={menuCls} sideOffset={4} align="start">
        {options.map(o => (
          <DropdownMenuItem key={o.value} className={itemCls} onClick={() => onChange(o.value)}>
            <span className="flex-1">{o.label}</span>
            {o.value === value && <Check size={11} strokeWidth={2.5} className="text-[#473bab] shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** "Add another" variant — dashed border, purple text, Plus icon trigger. */
function AgentAddSelect({
  onAdd, options, placeholder, f,
}: {
  onAdd: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  f: React.CSSProperties;
}) {
  if (options.length === 0) return null;
  const menuCls = "z-[500] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.1)] p-1 animate-in fade-in-0 zoom-in-95 min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[240px] overflow-y-auto";
  const itemCls = "flex items-center gap-2 px-[10px] py-[6px] rounded-lg text-[11.5px] text-[#1f1d25] cursor-pointer outline-none select-none data-[highlighted]:bg-[#f5f4f8]";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full flex items-center gap-[6px] px-[10px] py-[6px] mt-[2px] rounded-[8px] text-[11px] text-[#473bab] border border-dashed border-[rgba(71,59,171,0.35)] bg-transparent cursor-pointer hover:bg-[rgba(71,59,171,0.04)] transition-colors"
          style={f}
        >
          <Plus size={10} className="shrink-0" />
          <span className="flex-1 text-left">{placeholder ?? "+ Add another…"}</span>
          <ChevronDown size={9} className="shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={menuCls} sideOffset={4} align="start">
        {options.map(o => (
          <DropdownMenuItem key={o.value} className={itemCls} onClick={() => onAdd(o.value)}>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── "Why these?" expandable rationale box — accordion animation ──────────────
function WhyThese({ content }: { content: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const f = { fontFamily: "'Roboto', sans-serif" };
  return (
    <div className="mt-[6px]">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-[4px] text-[11px] text-[#473bab] cursor-pointer transition-colors hover:opacity-75"
        style={f}
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ display: "inline-block", lineHeight: 1, fontSize: 13 }}
        >
          ›
        </motion.span>
        Why these?
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="why-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="mt-[6px] px-[10px] py-[9px] rounded-[10px] border border-[rgba(71,59,171,0.14)]"
              style={{ background: "rgba(71,59,171,0.04)" }}>
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Name deduplication helper ─────────────────────────────────────────────────
function deduplicateName(desired: string, existing: string[]): string {
  const norm = (s: string) => s.trim().toLowerCase();
  const set = new Set(existing.map(norm));
  if (!set.has(norm(desired))) return desired;
  let i = 1;
  while (set.has(norm(`${desired} ${i}`))) i++;
  return `${desired} ${i}`;
}

// ─── Proactive Auto-Apply Progress Bar ───────────────────────────────────────
function ProactiveAutoApplyBar({ delay, onCancel }: { delay: number; onCancel: () => void }) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());
  const f = { fontFamily: "'Roboto', sans-serif" };

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
        <span style={{ ...f, fontSize: 10, color: "#686576" }}>Applying automatically…</span>
        <button onClick={onCancel} style={{ ...f, fontSize: 10, color: "#473bab", fontWeight: 500 }} className="cursor-pointer hover:text-[#6356e1] transition-colors">
          Edit manually
        </button>
      </div>
      <div className="h-[3px] bg-[rgba(71,59,171,0.12)] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #473bab, #6356e1)", transition: "none" }} />
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

function ProactiveQuestionsCard({
  input, applied, onSubmit,
}: {
  input: ProactiveQuestionsInput;
  applied: boolean;
  onSubmit: (goal: string, timeline: string, offerFocus: string) => void;
}) {
  const f = { fontFamily: "'Roboto', sans-serif" };
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

  function ChipRow({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string | null; onChange: (v: string) => void }) {
    return (
      <div>
        <p style={{ ...f, fontSize: 10, fontWeight: 600, color: "#9c99a9", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
        <div className="flex flex-wrap gap-[6px]">
          {options.map(opt => (
            <button key={opt} onClick={() => onChange(opt)} style={{ ...f, fontSize: 11.5 }}
              className={["px-[10px] py-[5px] rounded-full border font-medium transition-all cursor-pointer",
                value === opt ? "bg-[#473bab] border-[#473bab] text-white" : "bg-white border-[rgba(0,0,0,0.12)] text-[#686576] hover:border-[#473bab] hover:text-[#473bab]"
              ].join(" ")}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-white overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#f8f7ff] flex items-center gap-[6px]">
        <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #473bab, #6356e1)" }}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 1v7M1 4.5h7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
        <span style={{ ...f, fontSize: 11.5, fontWeight: 600, color: "#473bab", letterSpacing: "0.3px" }}>Proactive Campaign Build</span>
      </div>
      <div className="flex flex-col gap-[14px] px-[14px] py-[12px]">
        <p style={{ ...f, fontSize: 12, color: "#686576", lineHeight: 1.5 }}>{introLine}</p>
        <ChipRow label="Campaign goal" options={PROACTIVE_OPTIONS.goal} value={goal} onChange={setGoal} />
        <ChipRow label="Timeline" options={PROACTIVE_OPTIONS.timeline} value={timeline} onChange={setTimeline} />
        <ChipRow label="Offer focus" options={PROACTIVE_OPTIONS.offerFocus} value={offerFocus} onChange={setOfferFocus} />
      </div>
      <div className="px-[14px] pb-[12px] flex justify-end">
        <button onClick={() => { if (canStart) onSubmit(goal!, timeline!, offerFocus!); }} disabled={!canStart}
          className="px-[16px] py-[8px] rounded-full text-white text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #473bab 0%, #6356e1 100%)", ...f }}>
          Start Proactive Build →
        </button>
      </div>
    </motion.div>
  );
}

// ─── Setup Project Card ────────────────────────────────────────────────────────
interface SetupProjectCardProps {
  input: SetupInput;
  existingNames?: string[];
  onApply: (name: string, account: string, oem: string, startDate: string, endDate: string, owner: string, platforms: string[]) => void;
  onDismiss: () => void;
  proactive?: boolean;
}
function SetupProjectCard({ input, existingNames = [], onApply, onDismiss, proactive }: SetupProjectCardProps) {
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
    }, 2000);
    return () => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); };
  }, [proactive, manualMode, applied]); // eslint-disable-line react-hooks/exhaustive-deps

  if (applied) {
    return (
      <div className="ml-[32px] mt-[4px]">
        <ConfirmedChip label={`Project "${name}" created`} />
      </div>
    );
  }

  const inputCls = "w-full px-[10px] py-[7px] rounded-[8px] text-[12px] text-[#1f1d25] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none focus:border-[#473bab] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)] transition-all";
  const labelCls = "text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9c99a9] mb-[4px]";
  const f = { fontFamily: "'Roboto', sans-serif" };
  const menuCls = "z-[500] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.1)] p-1 animate-in fade-in-0 zoom-in-95 min-w-[var(--radix-dropdown-menu-trigger-width)]";
  const itemCls = "flex items-center gap-2 px-[10px] py-[6px] rounded-lg text-[12px] text-[#1f1d25] cursor-pointer outline-none select-none data-[highlighted]:bg-[#f5f4f8]";

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
          style={{ background: "linear-gradient(135deg, #473bab, #6356e1)" }}>
          <Plus size={9} color="white" strokeWidth={3} />
        </div>
        <span style={{ ...f, fontSize: 11.5, fontWeight: 600, color: "#473bab", letterSpacing: "0.3px" }}>
          New project setup
        </span>
      </div>

      <div className="flex flex-col gap-[10px] px-[14px] py-[12px]">
        {/* Name */}
        <div>
          <p className={labelCls} style={f}>Project name</p>
          <input type="text" value={name} onChange={e => { setName(e.target.value); setNameError(""); }}
            onFocus={e => e.target.select()}
            placeholder="e.g. Honda Summer Lease Event"
            className={inputCls} style={f} />
          {nameError ? (
            <p className="mt-[4px]" style={{ ...f, fontSize: 10, color: "#D2323F" }}>{nameError}</p>
          ) : (
            <p className="mt-[4px]" style={{ ...f, fontSize: 10, color: "#9c99a9", fontStyle: "italic" }}>
              {wasDeduplicated
                ? `"${input.project_name}" already exists — adjusted to avoid a collision. Edit to customise.`
                : "Suggested name — edit to customise."}
            </p>
          )}
        </div>

        {/* Account + Brand row */}
        <div className="flex gap-[8px]">
          <div className="flex-1">
            <p className={labelCls} style={f}>Account</p>
            <AgentSelect
              value={account} onChange={setAccount} f={f}
              placeholder="Select account"
              options={AVAILABLE_ACCOUNTS.map(a => ({ value: a, label: a }))}
            />
          </div>
          <div className="flex-1">
            <p className={labelCls} style={f}>Brand</p>
            <AgentSelect
              value={oem} onChange={setOem} f={f}
              options={AVAILABLE_BRANDS.map(b => ({ value: b, label: b }))}
            />
          </div>
        </div>

        {/* Owner */}
        <div>
          <p className={labelCls} style={f}>Owner</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center gap-[8px] px-[10px] py-[7px] rounded-[8px] text-[12px] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none transition-all hover:border-[#b0b0b5] focus:border-[#473bab] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)] cursor-pointer text-left"
                style={f}
              >
                {selectedOwner ? (
                  <>
                    <AvatarInitials initials={selectedOwner.initials} size={18} bgColor={selectedOwner.color} />
                    <span className="flex-1 text-[#1f1d25] truncate">{selectedOwner.name}</span>
                  </>
                ) : (
                  <span className="flex-1 text-[#9c99a9]">Select owner</span>
                )}
                <ChevronDown size={10} className="shrink-0 text-[#9c99a9]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={menuCls + " max-h-[240px] overflow-y-auto"} sideOffset={4} align="start">
              {PROJECT_OWNERS.map(owner => (
                <DropdownMenuItem key={owner.id} className={itemCls} onClick={() => setOwnerId(owner.id)}>
                  <AvatarInitials initials={owner.initials} size={20} bgColor={owner.color} />
                  <div className="flex-1 min-w-0">
                    <p style={{ ...f, fontSize: 12 }}>{owner.name}</p>
                    <p style={{ ...f, fontSize: 10, color: "#9c99a9" }} className="truncate">{owner.email}</p>
                  </div>
                  {owner.id === ownerId && <Check size={11} strokeWidth={2.5} className="text-[#473bab] shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Dates row */}
        <div className="flex gap-[8px]">
          <div className="flex-1">
            <p className={labelCls} style={f}>Start date</p>
            <input type="text" value={startDate}
              onChange={e => { setStartDate(e.target.value); setStartDateError(""); }}
              className={inputCls + (startDateError ? " border-[#D2323F]!" : "")} style={f} placeholder="Jun 1, 2026" />
            {startDateError && (
              <p className="mt-[4px]" style={{ ...f, fontSize: 10, color: "#D2323F" }}>{startDateError}</p>
            )}
          </div>
          <div className="flex-1">
            <p className={labelCls} style={f}>End date</p>
            <input type="text" value={endDate}
              onChange={e => { setEndDate(e.target.value); setEndDateError(""); }}
              className={inputCls + (endDateError ? " border-[#D2323F]!" : "")} style={f} placeholder="Jun 30, 2026" />
            {endDateError && (
              <p className="mt-[4px]" style={{ ...f, fontSize: 10, color: "#D2323F" }}>{endDateError}</p>
            )}
          </div>
        </div>

        {/* Platforms */}
        <div>
          <p className={labelCls} style={f}>Platforms</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex flex-wrap items-center gap-[4px] min-h-[34px] px-[8px] py-[5px] rounded-[8px] text-[12px] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none transition-all hover:border-[#b0b0b5] focus:border-[#473bab] cursor-pointer text-left"
                style={f}
              >
                {platforms.length === 0 ? (
                  <span className="flex-1 text-[#9c99a9]" style={f}>Select platforms</span>
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
                <ChevronDown size={10} className="shrink-0 text-[#9c99a9] ml-auto self-center" />
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
                      style={{ background: active ? "#473bab" : "white", borderColor: active ? "#473bab" : "rgba(0,0,0,0.2)" }}
                    >
                      {active && <Check size={9} strokeWidth={3} color="white" />}
                    </span>
                    <img src={p.icon} alt="" className="w-[12px] h-[12px] shrink-0 object-contain" />
                    <span style={f}>{p.label}</span>
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
            style={{ background: "linear-gradient(99deg, #473bab 0%, #6356e1 100%)", ...f }}
          >
            Create project
          </button>
          <button onClick={onDismiss}
            className="px-[14px] py-[8px] rounded-full text-[13px] text-[#686576] hover:bg-black/5 transition-colors cursor-pointer"
            style={f}>
            Dismiss
          </button>
        </div>
      </div>
      {proactive && !manualMode && !applied && (
        <ProactiveAutoApplyBar delay={2000} onCancel={() => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); setManualMode(true); }} />
      )}
    </motion.div>
  );
}

// ─── Offers Proposal Card ──────────────────────────────────────────────────────
interface OffersCardProps {
  input: OffersInput;
  context: ProjectContextPayload | null;
  onApply: (offerIds: string[]) => void;
  onDismiss: () => void;
  proactive?: boolean;
}
function OffersProposalCard({ input, context, onApply, onDismiss, proactive }: OffersCardProps) {
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
      onApply(offerIds);
    }, 2000);
    return () => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); };
  }, [proactive, manualMode, applied]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const f = { fontFamily: "'Roboto', sans-serif" };
  const labelCls = "text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9c99a9] mb-[4px]";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] flex flex-col gap-[8px]">
      {/* Rationale — free text, no outer box */}
      <div className="pl-[2px]">
        <p style={{ ...f, fontSize: 14, color: "#686576", lineHeight: 1.6, letterSpacing: "0.17px" }}>{input.rationale}</p>
        <WhyThese content={
          <div style={{ ...f, fontSize: 11, color: "#473bab", lineHeight: 1.6 }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>How I picked these</p>
            <p style={{ marginBottom: 4 }}>I rank every offer in your inventory on two signals:</p>
            <p style={{ marginBottom: 2 }}>• <strong>Aging</strong> — days each unit has been in stock. Older units get priority to move inventory.</p>
            <p style={{ marginBottom: 4 }}>• <strong>PVI (Performance Value Index)</strong> — projected return per vehicle at its current price. Higher is better.</p>
            <p>The offers with the best combined score for your brand made the cut.</p>
          </div>
        } />
      </div>
      {/* Offer cards list */}
      <motion.div
        className="flex flex-col gap-[6px]"
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
                      <label key={key} style={{ ...f, fontSize: 11 }} className="flex flex-col gap-[3px] text-[#686576]">
                        {label}
                        <input
                          type="number"
                          value={val}
                          onChange={e => handleCustomChange(id, key, Number(e.target.value))}
                          className="w-[90px] px-[8px] py-[4px] rounded-[6px] border border-[rgba(0,0,0,0.12)] text-[12px] text-[#1f1d25] bg-white outline-none focus:border-[#473bab] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)]"
                          style={f}
                        />
                      </label>
                    ))}
                    <button
                      onClick={() => setAppliedCustomizations(prev => new Set([...prev, id]))}
                      className="px-[12px] py-[4px] rounded-full text-[12px] font-medium text-white cursor-pointer transition-all"
                      style={{ background: "linear-gradient(99deg, #473bab 0%, #6356e1 100%)", ...f }}
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
          f={f}
          placeholder="+ Add another offer…"
          onAdd={v => setOfferIds(p => [...p, v])}
          options={offers
            .filter(o => !offerIds.includes(o.id))
            .map(o => ({ value: o.id, label: `${o.year} ${o.make} ${o.model} ${o.trim} — ${o.offerType} $${o.monthlyPayment}/mo` }))}
        />
        <div className="flex items-center gap-[8px]">
          <button onClick={() => { onApply(offerIds); setApplied(true); }}
            disabled={offerIds.length === 0}
            className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(99deg, #473bab 0%, #6356e1 100%)", ...f }}>
            Add {offerIds.length} offer{offerIds.length !== 1 ? "s" : ""}
          </button>
          <button
            onClick={() => setCustomizeMode(m => !m)}
            className={cn("px-[14px] py-[8px] rounded-full text-[13px] font-medium border transition-colors cursor-pointer",
              customizeMode
                ? "bg-[rgba(71,59,171,0.08)] border-[rgba(71,59,171,0.3)] text-[#473bab]"
                : "border-[rgba(0,0,0,0.12)] text-[#686576] hover:bg-black/5"
            )}
            style={f}>
            {customizeMode ? "Done" : "Customize"}
          </button>
          <button onClick={onDismiss} className="px-[14px] py-[8px] rounded-full text-[13px] text-[#686576] hover:bg-black/5 transition-colors cursor-pointer" style={f}>
            Dismiss
          </button>
        </div>
      </div>
      {proactive && !manualMode && !applied && (
        <ProactiveAutoApplyBar delay={2000} onCancel={() => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); setManualMode(true); }} />
      )}
    </motion.div>
  );
}

// ─── Template Preview Modal ────────────────────────────────────────────────────
type TemplateInfo = { id: string; name: string; format: string; width: number; height: number; brand: string };

function TemplatePreviewModal({ template, onClose }: { template: TemplateInfo | null; onClose: () => void }) {
  if (!template) return null;

  // Scale the template dimensions into a preview box (max 260×140)
  const maxW = 260; const maxH = 140;
  const scaleW = maxW / template.width;
  const scaleH = maxH / template.height;
  const scale = Math.min(scaleW, scaleH, 1);
  const pw = Math.round(template.width  * scale);
  const ph = Math.round(template.height * scale);

  const f = { fontFamily: "'Roboto', sans-serif" };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.42)", backdropFilter: "blur(2px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-white rounded-[16px] overflow-hidden mx-[16px]"
        style={{ width: 300, boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[16px] pt-[14px] pb-[10px] border-b border-[rgba(0,0,0,0.06)]">
          <div>
            <p style={{ ...f, fontSize: 12.5, fontWeight: 600, color: "#1f1d25" }}>{template.name}</p>
            <p style={{ ...f, fontSize: 10.5, color: "#686576", marginTop: 1 }}>{template.brand} · {template.format}</p>
          </div>
          <button onClick={onClose}
            className="flex items-center justify-center w-[26px] h-[26px] rounded-full hover:bg-black/6 transition-colors cursor-pointer text-[#9c99a9]">
            <X size={13} strokeWidth={1.7} />
          </button>
        </div>

        {/* Preview canvas */}
        <div className="flex items-center justify-center px-[16px] py-[16px] bg-[#f7f7fb]">
          <div style={{
            width: pw, height: ph,
            background: "linear-gradient(135deg, rgba(71,59,171,0.07) 0%, rgba(99,86,225,0.14) 100%)",
            border: "1.5px dashed rgba(71,59,171,0.28)",
            borderRadius: 6,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 5,
          }}>
            <FileText size={Math.max(16, Math.min(32, pw * 0.12))} strokeWidth={1.3} style={{ color: "rgba(71,59,171,0.45)" }} />
            <span style={{ ...f, fontSize: 8.5, color: "rgba(71,59,171,0.55)", letterSpacing: "0.6px", textTransform: "uppercase" }}>
              {template.width}×{template.height}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="px-[16px] pb-[16px] flex flex-col gap-[6px]">
          {([
            ["Format",     template.format],
            ["Dimensions", `${template.width} × ${template.height} px`],
            ["Brand",      template.brand],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span style={{ ...f, fontSize: 11, color: "#9c99a9", fontWeight: 500 }}>{label}</span>
              <span style={{ ...f, fontSize: 11, color: "#1f1d25" }}>{value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Templates Proposal Card ───────────────────────────────────────────────────
interface TemplatesCardProps {
  input: TemplatesInput;
  context: ProjectContextPayload | null;
  onApply: (templateIds: string[]) => void;
  onDismiss: () => void;
  proactive?: boolean;
}
function TemplatesProposalCard({ input, context, onApply, onDismiss, proactive }: TemplatesCardProps) {
  const [templateIds,   setTemplateIds]   = useState<string[]>(input.template_ids);
  const [applied,       setApplied]       = useState(false);
  const [zoneTpl,       setZoneTpl]       = useState<TemplateInfo | null>(null);
  const templates = context?.availableTemplates ?? [];
  const [manualMode, setManualMode] = useState(false);
  const autoApplyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!proactive || manualMode || applied) return;
    autoApplyRef.current = setTimeout(() => {
      setApplied(true);
      onApply(templateIds);
    }, 2000);
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

  const f = { fontFamily: "'Roboto', sans-serif" };
  const labelCls = "text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9c99a9] mb-[4px]";

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
        <p style={{ ...f, fontSize: 14, color: "#686576", lineHeight: 1.6, letterSpacing: "0.17px" }}>{input.rationale}</p>
        <WhyThese content={
          <div style={{ ...f, fontSize: 11, color: "#473bab", lineHeight: 1.6 }}>
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
          <p className={labelCls} style={f}>Templates · {templateIds.length} selected</p>
          <motion.div
            className="flex flex-col gap-[4px]"
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
                    <p className="text-[12px] font-medium text-[#1f1d25] truncate" style={f}>{t ? t.name : id}</p>
                    {t && <p className="text-[10.5px] text-[#686576] mt-[1px]" style={f}>{t.format} · {t.width}×{t.height} · {t.brand}</p>}
                  </div>
                  <div className="flex items-center gap-[4px] opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    {t && (
                      <button onClick={() => setZoneTpl(t)}
                        className="text-[#9c99a9] hover:text-[#473bab] transition-colors cursor-pointer"
                        title="Edit Zone">
                        <Eye size={12} strokeWidth={1.7} />
                      </button>
                    )}
                    <button onClick={() => setTemplateIds(p => p.filter(x => x !== id))}
                      className="text-[#9c99a9] hover:text-[#dc2626] transition-colors cursor-pointer">
                      <Trash2 size={12} strokeWidth={1.7} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            <AgentAddSelect
              f={f}
              placeholder="+ Add another template…"
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
            <circle cx="6" cy="6" r="5.5" stroke="#473bab" strokeOpacity="0.5"/>
            <path d="M6 5.5V8.5M6 3.5V4.5" stroke="#473bab" strokeOpacity="0.7" strokeLinecap="round"/>
          </svg>
          <p style={{ ...f, fontSize: 11, color: "#686576", lineHeight: 1.5 }}>
            These templates are all customizable. Click the{" "}
            <span style={{ fontWeight: 600, color: "#1f1d25" }}>⋮</span>
            {" "}menu on any template card and select{" "}
            <span style={{ fontWeight: 600, color: "#473bab" }}>Edit Zone</span>
            {" "}to customize.
          </p>
        </div>
        <div className="flex items-center gap-[8px] pt-[2px]">
          <button onClick={() => { onApply(templateIds); setApplied(true); }}
            disabled={templateIds.length === 0}
            className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(99deg, #473bab 0%, #6356e1 100%)", ...f }}>
            Add templates
          </button>
          <button onClick={onDismiss} className="px-[14px] py-[8px] rounded-full text-[13px] text-[#686576] hover:bg-black/5 transition-colors cursor-pointer" style={f}>
            Dismiss
          </button>
        </div>
      </div>
      {proactive && !manualMode && !applied && (
        <ProactiveAutoApplyBar delay={2000} onCancel={() => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); setManualMode(true); }} />
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
  const f = { fontFamily: "'Roboto', sans-serif" };
  const [manualMode, setManualMode] = useState(false);
  const autoApplyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!proactive || manualMode || applied) return;
    autoApplyRef.current = setTimeout(() => {
      setApplied(true);
      onApply(oem);
    }, 2000);
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

  const inputCls = "w-full px-[10px] py-[7px] rounded-[8px] text-[12px] text-[#1f1d25] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none focus:border-[#473bab] transition-all cursor-pointer appearance-none";
  const labelCls = "text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9c99a9] mb-[4px]";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] flex flex-col gap-[8px]">
      {/* Rationale — free text, no outer box */}
      <div className="pl-[2px]">
        <p style={{ ...f, fontSize: 14, color: "#686576", lineHeight: 1.6, letterSpacing: "0.17px" }}>{input.rationale}</p>
        <WhyThese content={
          <div style={{ ...f, fontSize: 11, color: "#473bab", lineHeight: 1.6 }}>
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
            <p style={{ ...f, fontSize: 10.5, color: "#9c99a9" }}>
              Project: <span style={{ color: "#1f1d25", fontWeight: 600 }}>{projectName}</span>
            </p>
          </div>
        )}
        <div className="flex flex-col gap-[10px] px-[14px] py-[12px]">
          <div>
            <p className={labelCls} style={f}>Brand / Theme Kit</p>
            <AgentSelect
              value={oem} onChange={setOem} f={f}
              options={AVAILABLE_BRANDS.map(b => ({ value: b, label: b }))}
            />
          </div>
          <div className="flex items-center gap-[8px] pt-[2px]">
            <button onClick={() => { onApply(oem); setApplied(true); }}
              className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer"
              style={{ background: "linear-gradient(99deg, #473bab 0%, #6356e1 100%)", ...f }}>
              Activate brand kit
            </button>
            <button onClick={onDismiss} className="px-[14px] py-[8px] rounded-full text-[13px] text-[#686576] hover:bg-black/5 transition-colors cursor-pointer" style={f}>
              Skip
            </button>
          </div>
        </div>
        {proactive && !manualMode && !applied && (
          <ProactiveAutoApplyBar delay={2000} onCancel={() => { if (autoApplyRef.current) clearTimeout(autoApplyRef.current); setManualMode(true); }} />
        )}
      </div>
    </motion.div>
  );
}

// ─── Backgrounds Proposal Card ─────────────────────────────────────────────────
const SCENE_BACKGROUNDS = [
  { id: "dirt-road",                  name: "Dirt Road",               thumbnail: "/backgrounds/Dirt-Road-HO_251027_1_Display_300x250 1.png" },
  { id: "gold-flare",                 name: "Gold Flare",              thumbnail: "/backgrounds/Gold-Flare-HO_251027_3_Display_300x250 1.png" },
  { id: "purple-city",                name: "Purple City",             thumbnail: "/backgrounds/Purple-City-HO_251229_D_Keeler_Display_300x250 1.png" },
  { id: "snow-house",                 name: "Snow House",              thumbnail: "/backgrounds/Snow-House-HO_251120_2_Display_300x250 1.png" },
  { id: "ballon-festival",            name: "Balloon Festival",        thumbnail: "/backgrounds/Ballon%20Festival/1777265296524_9d7c8327.jpg" },
  { id: "beach-sunset",               name: "Beach Sunset",            thumbnail: "/backgrounds/Beach%20Sunset/BM_250724_2_DISPLAY_300x250.jpg" },
  { id: "desert-day",                 name: "Desert Day",              thumbnail: "/backgrounds/Desert%20Day/tmp_b9mipxq_1080x1080_1774762572901_300x250_1774892650125.jpg" },
  { id: "desert-pyramid-night-sky",   name: "Desert Pyramid Night",    thumbnail: "/backgrounds/Desert%20Pyramid%20Night%20Sky/1777056196506_131012de.jpg" },
  { id: "docks-midday",               name: "Docks Midday",            thumbnail: "/backgrounds/Docks%20Midday/BM_250515_1_SOCIAL_1080x1080_300x250_1774892650098.jpg" },
  { id: "field-with-mountain",        name: "Field With Mountain",     thumbnail: "/backgrounds/Field%20With%20Mountain/1777014100078_094e3bd4.jpg" },
  { id: "forest-lodge",               name: "Forest Lodge",            thumbnail: "/backgrounds/Forest%20Lodge/1777217113411_a7cf6a69.jpg" },
  { id: "frozen-lake-night",          name: "Frozen Lake Night",       thumbnail: "/backgrounds/Frozen%20Lake%20Night/1777303348542_7657d84b.jpg" },
  { id: "ice-lab",                    name: "Ice Lab",                 thumbnail: "/backgrounds/Ice%20Lab/1777123961113_36260ab2.jpg" },
  { id: "stadium-night",              name: "Stadium Night",           thumbnail: "/backgrounds/Stadium%20Night/BM_250825_1C_Display_300x250.jpg" },
];

interface BackgroundsCardProps {
  input: BackgroundsInput;
  onApply: (backgroundIds: string[]) => void;
  onDismiss: () => void;
  proactive?: boolean;
}
function BackgroundsProposalCard({ input, onApply, onDismiss }: BackgroundsCardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);
  const f = { fontFamily: "'Roboto', sans-serif" };

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
        <p style={{ ...f, fontSize: 14, color: "#686576", lineHeight: 1.6, letterSpacing: "0.17px" }}>{input.rationale}</p>
        <WhyThese content={
          <div style={{ ...f, fontSize: 11, color: "#473bab", lineHeight: 1.6 }}>
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9c99a9] mb-[8px]" style={f}>
              Backgrounds · {selectedIds.length} selected
            </p>
            <div className="flex gap-[8px] overflow-x-auto pb-1">
              {SCENE_BACKGROUNDS.map(bg => {
                const isSelected = selectedIds.includes(bg.id);
                return (
                  <button key={bg.id} onClick={() => toggle(bg.id)}
                    className="flex-none flex flex-col items-center gap-[4px] cursor-pointer"
                    style={{ width: 64 }}>
                    <div className="relative w-[64px] h-[48px] rounded-[7px] overflow-hidden transition-all"
                      style={{
                        outline: isSelected ? "2px solid #473bab" : "2px solid transparent",
                        outlineOffset: 1,
                        boxShadow: isSelected ? "0 0 0 3px rgba(71,59,171,0.15)" : "none",
                      }}>
                      <img src={bg.thumbnail} alt={bg.name} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: "rgba(71,59,171,0.22)" }}>
                          <Check size={12} strokeWidth={2.5} className="text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-[#686576] text-center leading-tight truncate w-full" style={f}>
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
              style={{ background: "linear-gradient(99deg, #473bab 0%, #6356e1 100%)", ...f }}>
              Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ""}background{selectedIds.length !== 1 ? "s" : ""}
            </button>
            <button onClick={onDismiss}
              className="px-[14px] py-[8px] rounded-full text-[13px] text-[#686576] hover:bg-black/5 transition-colors cursor-pointer" style={f}>
              Skip
            </button>
          </div>
        </div>
      </div>
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
  const f = { fontFamily: "'Roboto', sans-serif" };
  const [chosen, setChosen] = useState<"email" | "platform" | null>(null);

  const recipient = input.recipient_hint || "the recipient";
  const firstName = recipient.split(" ")[0];

  if (chosen === "email") {
    // Delegate immediately — email proposal card will render as a separate message
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.10)] bg-white overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="px-[14px] pt-[10px] pb-[8px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
        <p style={{ ...f, fontSize: 11, color: "#686576", lineHeight: 1.5 }}>
          How would you like to send to{" "}
          <strong style={{ color: "#1f1d25" }}>{recipient}</strong>?
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
              <rect x="2" y="5" width="16" height="11" rx="2" stroke="#6356E1" strokeWidth="1.5"/>
              <path d="M2 7l8 5 8-5" stroke="#6356E1" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ ...f, fontSize: 12, fontWeight: 500, color: "#1f1d25" }}>Send via Email</p>
            <p style={{ ...f, fontSize: 10.5, color: "#9c99a9" }}>Share a project link by email</p>
          </div>
          <ChevronDown size={13} strokeWidth={1.5} style={{ color: "#9c99a9", transform: "rotate(-90deg)", flexShrink: 0 }} />
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
            <p style={{ ...f, fontSize: 12, fontWeight: 500, color: "#1f1d25" }}>Platform Communications</p>
            <p style={{ ...f, fontSize: 10.5, color: "#9c99a9" }}>Send an in-app notification</p>
          </div>
          <ChevronDown size={13} strokeWidth={1.5} style={{ color: "#9c99a9", transform: "rotate(-90deg)", flexShrink: 0 }} />
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
  const f = { fontFamily: "'Roboto', sans-serif" };

  // Merge agent suggestions with live owners from context
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = { ...liveOwners };
    if (input.owners) {
      Object.entries(input.owners).forEach(([section, name]) => {
        const owner = PROJECT_OWNERS.find(o =>
          o.name.toLowerCase().includes(name.toLowerCase())
        );
        if (owner) base[section] = owner.id;
      });
    }
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
        <p style={{ ...f, fontSize: 11, fontWeight: 600, color: "#1f1d25" }}>Assign Task Owners</p>
        <p style={{ ...f, fontSize: 10.5, color: "#9c99a9", marginTop: 2 }}>Choose a responsible owner for each section</p>
      </div>

      {/* Section rows */}
      <div className="flex flex-col divide-y divide-[rgba(0,0,0,0.05)]">
        {TASK_SECTIONS.map(({ id, label }) => {
          const ownerId = selections[id];
          const owner = PROJECT_OWNERS.find(o => o.id === ownerId);
          return (
            <div key={id} className="flex items-center gap-[10px] px-[14px] py-[8px]">
              <span style={{ ...f, fontSize: 12, color: "#686576", flex: 1 }}>{label}</span>
              <button
                ref={el => { triggerRefs.current[id] = el; }}
                onClick={() => openDropdown(id)}
                className="flex items-center gap-[6px] px-[8px] py-[4px] rounded-[8px] border border-[rgba(0,0,0,0.10)] bg-[#F9FAFA] hover:border-[var(--brand-accent)] hover:bg-[#f5f4ff] transition-all cursor-pointer min-w-[130px] text-left"
                style={f}
              >
                {owner ? (
                  <>
                    {owner.avatar
                      ? <img src={owner.avatar} alt={owner.name} className="w-[16px] h-[16px] rounded-full object-cover shrink-0" />
                      : <AvatarInitials initials={owner.initials} size={16} bgColor={owner.color} />
                    }
                    <span style={{ ...f, fontSize: 11, color: "#1f1d25", flex: 1 }}>{owner.name.split(" ")[0]}</span>
                  </>
                ) : (
                  <span style={{ ...f, fontSize: 11, color: "#9c99a9", flex: 1 }}>Unassigned</span>
                )}
                <ChevronDown size={11} strokeWidth={1.5} style={{ color: "#9c99a9", flexShrink: 0 }} />
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
          style={{ background: "linear-gradient(135deg, #6356E1 0%, #8B5CF6 100%)", ...f }}
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
                  className="w-full flex items-center gap-[8px] px-[10px] py-[7px] text-[12px] text-[#9c99a9] hover:bg-[#F4F5F6] cursor-pointer"
                  style={f}
                >
                  <span className="w-[16px] h-[16px] flex-shrink-0" />
                  Unassigned
                  {!selections[openSection] && <Check size={11} className="ml-auto text-[var(--brand-accent)]" />}
                </button>
                {PROJECT_OWNERS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => { setSelections(p => ({ ...p, [openSection]: o.id })); setOpenSection(null); }}
                    className="w-full flex items-center gap-[8px] px-[10px] py-[7px] text-[12px] text-[#1f1d25] hover:bg-[#F4F5F6] cursor-pointer"
                    style={f}
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
  const f = { fontFamily: "'Roboto', sans-serif" };
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
      `Hi team,\n\nI'd like to share the project "${projectName}" with you for your review and action.\n\nPlease find the project link below:\n\n[Project link]\n\nThank you!`
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
            <p style={{ ...f, fontSize: 11, fontWeight: 600, color: "#0d7a5f" }}>Task owners notified via platform</p>
          </div>
        </div>
        <div className="flex flex-col gap-[2px] px-[14px] py-[10px]">
          {resolvedOwners.map(({ section, owner }) => (
            <div key={owner.id} className="flex items-center gap-[8px] py-[4px]">
              {owner.avatar
                ? <img src={owner.avatar} alt={owner.name} className="w-[22px] h-[22px] rounded-full object-cover shrink-0" />
                : <AvatarInitials initials={owner.initials} size={22} bgColor={owner.color} />
              }
              <span style={{ ...f, fontSize: 12, color: "#1f1d25" }}>{owner.name}</span>
              <span style={{ ...f, fontSize: 10.5, color: "#9c99a9", textTransform: "capitalize" }}>{section}</span>
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
          <p style={{ ...f, fontSize: 11, fontWeight: 600, color: "#1f1d25" }}>Email to task owners</p>
          <button onClick={() => setChosen(null)} className="text-[#9c99a9] hover:text-[#1f1d25] transition-colors cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="px-[14px] py-[12px] flex flex-col gap-[10px]">
          {/* Recipients */}
          <div>
            <p style={{ ...f, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9c99a9", marginBottom: 6 }}>To</p>
            <div className="flex flex-wrap gap-[5px]">
              {resolvedOwners.map(({ owner }) => (
                <div key={owner.id} className="flex items-center gap-[5px] px-[8px] py-[3px] rounded-full bg-[#F4F5F6]">
                  {owner.avatar
                    ? <img src={owner.avatar} alt={owner.name} className="w-[14px] h-[14px] rounded-full object-cover shrink-0" />
                    : <AvatarInitials initials={owner.initials} size={14} bgColor={owner.color} />
                  }
                  <span style={{ ...f, fontSize: 11, color: "#1f1d25" }}>{owner.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <p style={{ ...f, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9c99a9", marginBottom: 6 }}>Subject</p>
            <p style={{ ...f, fontSize: 12, color: "#1f1d25" }}>Project shared: {projectName}</p>
          </div>

          {/* Message body */}
          <div>
            <p style={{ ...f, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9c99a9", marginBottom: 6 }}>Message</p>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none text-[12px] text-[#1f1d25] bg-[#F9FAFA] border border-[#E4E4E8] rounded-[8px] px-[10px] py-[8px] outline-none focus:border-[var(--brand-accent)] transition-colors overflow-hidden"
              style={{ ...f, minHeight: 80 }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => { onApply(); setEmailSent(true); }}
            className="self-end flex items-center gap-[6px] px-[14px] py-[7px] rounded-full text-white text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6356E1 0%, #8B5CF6 100%)", ...f }}
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
        <p style={{ ...f, fontSize: 11, color: "#686576", lineHeight: 1.5 }}>
          Notify <strong style={{ color: "#1f1d25" }}>{resolvedOwners.length} task owner{resolvedOwners.length !== 1 ? "s" : ""}</strong>. How would you like to send?
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
              <rect x="2" y="5" width="16" height="11" rx="2" stroke="#6356E1" strokeWidth="1.5"/>
              <path d="M2 7l8 5 8-5" stroke="#6356E1" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ ...f, fontSize: 12, fontWeight: 500, color: "#1f1d25" }}>Send via Email</p>
            <p style={{ ...f, fontSize: 10.5, color: "#9c99a9" }}>One email to all task owners</p>
          </div>
          <ChevronDown size={13} strokeWidth={1.5} style={{ color: "#9c99a9", transform: "rotate(-90deg)", flexShrink: 0 }} />
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
            <p style={{ ...f, fontSize: 12, fontWeight: 500, color: "#1f1d25" }}>Platform Communications</p>
            <p style={{ ...f, fontSize: 10.5, color: "#9c99a9" }}>In-app notification to all owners</p>
          </div>
          <ChevronDown size={13} strokeWidth={1.5} style={{ color: "#9c99a9", transform: "rotate(-90deg)", flexShrink: 0 }} />
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
            <span style={{ ...f, fontSize: 11, color: "#1f1d25" }}>{owner.name.split(" ")[0]}</span>
            <span style={{ ...f, fontSize: 10, color: "#9c99a9", textTransform: "capitalize" }}>· {section}</span>
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
  const f = { fontFamily: "'Roboto', sans-serif" };
  const labelCls = "text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9c99a9] mb-[6px]";
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
        <p style={{ ...f, fontSize: 11, color: "#686576", lineHeight: 1.5 }}>
          Sharing project link for <strong style={{ color: "#1f1d25" }}>{projectName}</strong>
        </p>
      </div>

      <div className="flex flex-col gap-[10px] px-[14px] py-[12px]">

        {/* ── Recipient section ── */}
        <div>
          <p className={labelCls} style={f}>Send to</p>

          {/* Mode A: known contact — single row, pre-selected */}
          {knownContact && (
            <div className="flex items-center gap-[8px] px-[10px] py-[8px] rounded-[8px]"
              style={{ background: "rgba(71,59,171,0.08)", outline: "1.5px solid rgba(71,59,171,0.35)" }}>
              <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0"
                style={{ background: knownContact.group === "constellation" ? "#473bab" : "#0d7a5f" }}>
                <span style={{ ...f, fontSize: 10, fontWeight: 700, color: "white" }}>
                  {knownContact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ ...f, fontSize: 12, fontWeight: 500, color: "#1f1d25" }}>{knownContact.name}</p>
                <p style={{ ...f, fontSize: 10, color: "#9c99a9" }} className="truncate">{knownContact.email}</p>
              </div>
              <Check size={13} strokeWidth={2.5} className="text-[#473bab] shrink-0" />
            </div>
          )}

          {/* Mode B: unknown recipient — ask for email */}
          {isUnknownRecipient && (
            <div className="flex flex-col gap-[6px]">
              <p style={{ ...f, fontSize: 11.5, color: "#686576", lineHeight: 1.5 }}>
                I don't have <strong style={{ color: "#1f1d25" }}>"{hint}"</strong> in my contacts.
              </p>
              <input
                type="email"
                value={unknownEmail}
                onChange={e => setUnknownEmail(e.target.value)}
                placeholder="their@email.com"
                className="w-full px-[10px] py-[7px] rounded-[8px] text-[12px] text-[#1f1d25] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none focus:border-[#473bab] transition-all"
                style={f}
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
                    <p className={groupLabelCls} style={f}>{group.label}</p>
                    <div className="flex flex-col gap-[3px] mb-[4px]">
                      {contacts.map(c => {
                        const isSelected = selectedEmails.has(c.email);
                        const avatarBg = group.key === "constellation" ? "#473bab" : "#0d7a5f";
                        return (
                          <button key={c.email} onClick={() => toggleContact(c.email)}
                            className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[8px] transition-all cursor-pointer text-left w-full"
                            style={{ background: isSelected ? "rgba(71,59,171,0.08)" : "#f5f4f8", outline: isSelected ? "1.5px solid rgba(71,59,171,0.35)" : "1.5px solid transparent" }}>
                            <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0" style={{ background: avatarBg }}>
                              <span style={{ ...f, fontSize: 9, fontWeight: 700, color: "white" }}>
                                {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p style={{ ...f, fontSize: 12, fontWeight: 500, color: "#1f1d25" }}>{c.name}</p>
                              <p style={{ ...f, fontSize: 10, color: "#9c99a9" }} className="truncate">{c.email}</p>
                            </div>
                            {isSelected && <Check size={12} strokeWidth={2.5} className="text-[#473bab] shrink-0" />}
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
          <p className={labelCls} style={f}>Message</p>
          <textarea ref={textareaRef} value={message} onChange={e => setMessage(e.target.value)}
            rows={1}
            className="w-full px-[10px] py-[8px] rounded-[8px] text-[12px] text-[#1f1d25] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none focus:border-[#473bab] transition-all resize-none leading-relaxed overflow-hidden"
            style={{ ...f, minHeight: 36 }} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-[8px] pt-[2px]">
          <button onClick={handleSend} disabled={!canSend}
            className="flex-1 py-[8px] rounded-full text-[13px] font-medium tracking-[0.46px] text-white transition-all cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(99deg, #473bab 0%, #6356e1 100%)", ...f }}>
            Send email
          </button>
          <button onClick={onDismiss}
            className="px-[14px] py-[8px] rounded-full text-[13px] text-[#686576] hover:bg-black/5 transition-colors cursor-pointer" style={f}>
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

  const inputCls = "w-full px-[10px] py-[7px] rounded-[8px] text-[12px] text-[#1f1d25] border border-[rgba(0,0,0,0.12)] bg-[#fafafb] outline-none focus:border-[#473bab] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)] transition-all";
  const labelCls = "text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9c99a9] mb-[4px]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="ml-[32px] mt-[4px] rounded-[14px] border border-[rgba(0,0,0,0.1)] bg-white overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* Header strip */}
      <div className="px-[14px] pt-[12px] pb-[10px] border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
        <p className="text-[11px] text-[#686576] leading-[1.5] tracking-[0.17px]"
          style={{ fontFamily: "'Roboto', sans-serif" }}>
          {input.rationale}
        </p>
      </div>

      <div className="flex flex-col gap-[12px] px-[14px] py-[12px]">

        {/* Project name */}
        {(input.project_name || context?.projectId === "") && (
          <div>
            <p className={labelCls} style={{ fontFamily: "'Roboto', sans-serif" }}>Project name</p>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Honda Summer Lease 2026"
              className={inputCls}
              style={{ fontFamily: "'Roboto', sans-serif" }}
            />
          </div>
        )}

        {/* Date range */}
        {(startDate || endDate) && (
          <div className="flex gap-[8px]">
            <div className="flex-1">
              <p className={labelCls} style={{ fontFamily: "'Roboto', sans-serif" }}>Start date</p>
              <input type="text" value={startDate} onChange={e => setStartDate(e.target.value)}
                className={inputCls} style={{ fontFamily: "'Roboto', sans-serif" }} />
            </div>
            <div className="flex-1">
              <p className={labelCls} style={{ fontFamily: "'Roboto', sans-serif" }}>End date</p>
              <input type="text" value={endDate} onChange={e => setEndDate(e.target.value)}
                className={inputCls} style={{ fontFamily: "'Roboto', sans-serif" }} />
            </div>
          </div>
        )}

        {/* Proposed offers */}
        <div>
          <div className="flex items-center justify-between mb-[6px]">
            <p className={labelCls} style={{ fontFamily: "'Roboto', sans-serif" }}>
              Offers · {offerIds.length} selected
            </p>
          </div>
          <div className="flex flex-col gap-[4px]">
            {offerIds.map(id => {
              const o = offers.find(x => x.id === id);
              return (
                <div key={id} className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[8px] bg-[#f5f4f8] group">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1f1d25] truncate"
                      style={{ fontFamily: "'Roboto', sans-serif" }}>
                      {o ? `${o.year} ${o.make} ${o.model} ${o.trim}` : id}
                    </p>
                    {o && (
                      <p className="text-[10.5px] text-[#686576] mt-[1px]"
                        style={{ fontFamily: "'Roboto', sans-serif" }}>
                        {o.offerType} · ${o.monthlyPayment}/mo · PVI {o.pvi} · {o.aging}d aging
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setOfferIds(prev => prev.filter(x => x !== id))}
                    className="opacity-0 group-hover:opacity-100 text-[#9c99a9] hover:text-[#dc2626] transition-all cursor-pointer shrink-0"
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
                  className="w-full px-[10px] py-[6px] rounded-[8px] text-[11px] text-[#473bab] border border-dashed border-[rgba(71,59,171,0.35)] bg-transparent cursor-pointer outline-none appearance-none"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  <option value="">+ Add another offer…</option>
                  {offers.filter(o => !offerIds.includes(o.id)).map(o => (
                    <option key={o.id} value={o.id}>
                      {o.year} {o.make} {o.model} {o.trim} — {o.offerType} ${o.monthlyPayment}/mo
                    </option>
                  ))}
                </select>
                <Plus size={10} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#473bab] pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Proposed templates */}
        <div>
          <div className="flex items-center justify-between mb-[6px]">
            <p className={labelCls} style={{ fontFamily: "'Roboto', sans-serif" }}>
              Templates · {templateIds.length} selected
            </p>
          </div>
          <div className="flex flex-col gap-[4px]">
            {templateIds.map(id => {
              const t = templates.find(x => x.id === id);
              return (
                <div key={id} className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[8px] bg-[#f5f4f8] group">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1f1d25] truncate"
                      style={{ fontFamily: "'Roboto', sans-serif" }}>
                      {t ? t.name : id}
                    </p>
                    {t && (
                      <p className="text-[10.5px] text-[#686576] mt-[1px]"
                        style={{ fontFamily: "'Roboto', sans-serif" }}>
                        {t.format} · {t.width}×{t.height} · {t.brand}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setTemplateIds(prev => prev.filter(x => x !== id))}
                    className="opacity-0 group-hover:opacity-100 text-[#9c99a9] hover:text-[#dc2626] transition-all cursor-pointer shrink-0"
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
                  className="w-full px-[10px] py-[6px] rounded-[8px] text-[11px] text-[#473bab] border border-dashed border-[rgba(71,59,171,0.35)] bg-transparent cursor-pointer outline-none appearance-none"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  <option value="">+ Add another template…</option>
                  {templates.filter(t => !templateIds.includes(t.id)).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.format}
                    </option>
                  ))}
                </select>
                <Plus size={10} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#473bab] pointer-events-none" />
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
            style={{ background: "linear-gradient(99deg, #473bab 0%, #6356e1 100%)", fontFamily: "'Roboto', sans-serif" }}
          >
            Apply to project
          </button>
          <button
            onClick={onDismiss}
            className="px-[14px] py-[8px] rounded-full text-[13px] text-[#686576] hover:bg-black/5 transition-colors cursor-pointer"
            style={{ fontFamily: "'Roboto', sans-serif" }}
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
  const brandColor = BRAND_COLORS[offer.make] ?? "#473bab";
  const f = { fontFamily: "'Roboto', sans-serif" };

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
        <div className="w-[5px] h-[5px] rounded-full" style={{ background: "#9c99a9" }} />
        <span style={{ ...f, fontSize: 8, fontWeight: 600, color: "#686576", letterSpacing: "0.3px" }}>Draft</span>
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-[7px] py-[5px]"
        style={{ background: "rgba(0,0,0,0.52)" }}>
        <span style={{ ...f, fontSize: 7.5, fontWeight: 500, color: "rgba(255,255,255,0.82)", letterSpacing: "0.2px" }}>
          {offer.make} Dealer
        </span>
        <span style={{ ...f, fontSize: 6.5, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "1px", textTransform: "uppercase" }}>
          {offer.make}
        </span>
      </div>

      {/* Car area — stylised placeholder */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 24, paddingBottom: 58 }}>
        <span style={{ ...f, fontSize: 34, fontWeight: 900, color: brandColor, opacity: 0.12, letterSpacing: -1, userSelect: "none" }}>
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
        <p style={{ ...f, fontSize: 7, fontWeight: 500, color: "rgba(255,255,255,0.65)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 1 }}>
          {offer.offerType} · {offer.year} {offer.make} {offer.model}
        </p>
        <div className="flex items-baseline gap-[2px]">
          <span style={{ ...f, fontSize: 22, fontWeight: 700, color: "white", lineHeight: 1 }}>
            ${offer.monthlyPayment}
          </span>
          <span style={{ ...f, fontSize: 8, color: "rgba(255,255,255,0.6)" }}>/mo</span>
        </div>
        <p style={{ ...f, fontSize: 6.5, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>
          {offer.term}mo · {offer.trim}
        </p>
      </div>

      {template && (
        <div className="absolute top-[20px] left-[5px]">
          <span style={{ ...f, fontSize: 7, fontWeight: 600, color: "white", background: "rgba(71,59,171,0.82)", padding: "2px 5px", borderRadius: 4, letterSpacing: "0.3px" }}>
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
  const f = { fontFamily: "'Roboto', sans-serif" };

  const offers    = context?.availableOffers    ?? [];
  const templates = context?.availableTemplates ?? [];
  const selectedOffers    = msg.offerIds   .map(id => offers   .find(o => o.id === id)).filter(Boolean) as typeof offers;
  const selectedTemplates = msg.templateIds.map(id => templates.find(t => t.id === id)).filter(Boolean) as typeof templates;

  return (
    <div className="ml-[32px] mt-[6px]">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-[5px] mb-[8px] cursor-pointer group w-full text-left">
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={11} strokeWidth={2} className="text-[#686576]" />
        </motion.div>
        <span style={{ ...f, fontSize: 11.5, fontWeight: 600, color: "#1f1d25" }}>
          Preview ({selectedOffers.length})
        </span>
        {selectedTemplates.length > 0 && (
          <span style={{ ...f, fontSize: 9.5, color: "#473bab", background: "rgba(71,59,171,0.08)", padding: "1px 7px", borderRadius: 100, fontWeight: 500 }}>
            {selectedTemplates.length} template{selectedTemplates.length !== 1 ? "s" : ""}
          </span>
        )}
        <div className="flex-1" />
        <span style={{ ...f, fontSize: 9.5, color: "#9c99a9" }} className="opacity-0 group-hover:opacity-100 transition-opacity">
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
  const selectAllRef = useRef<HTMLInputElement>(null);

  const checkedCount = checkedIds.size;
  const allChecked  = checkedCount === input.offers.length;
  const someChecked = checkedCount > 0 && checkedCount < input.offers.length;

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
  const toCardData = (row: ParsedOfferRow): OfferCardData => ({
    id: row.id,
    year:  row.year,
    make:  row.make,
    model: row.model,
    trim:  row.trim ?? "",
    image: "",                             // silhouette placeholder
    stock: 0,
    offerType: row.offer_type,
    tags:  row.apr ? [`${row.apr}% APR`] : [],
    pvi:   0,                              // forces "regular" variant
    aging: 0, sales: 0, inventory: 0,
    monthlyPayment:   parseFloat(row.monthly_payment)    || 0,
    term:             parseInt(row.term)                 || 0,
    totalDueAtSigning: parseFloat(row.due_at_signing ?? "0") || 0,
  });

  const handleApply = () => {
    const selected: CustomOffer[] = input.offers
      .filter(r => checkedIds.has(r.id))
      .map(r => ({
        id:             `custom-${r.id}-${Date.now()}`,
        year:           r.year,
        make:           r.make,
        model:          r.model,
        trim:           r.trim ?? "",
        offerType:      r.offer_type,
        monthlyPayment: r.monthly_payment,
        term:           r.term,
        dueAtSigning:   r.due_at_signing ?? "0",
        apr:            r.apr,
        notes:          r.notes,
      }));
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
          <FileText size={14} className="text-[#473bab]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-[#1f1d25] truncate" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>
            {input.source}
          </p>
          <p className="text-[11px] text-[#686576]" style={{ fontFamily: "'Roboto', sans-serif" }}>
            {input.offers.length} offer{input.offers.length === 1 ? "" : "s"} extracted
          </p>
        </div>
        <button onClick={onDismiss} className="shrink-0 text-[#9c99a9] hover:text-[#686576] transition-colors">
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
                borderColor: allChecked || someChecked ? "#473bab" : "rgba(0,0,0,0.25)",
                background:  allChecked ? "#473bab" : "white",
              }}
            >
              {allChecked  && <Check size={9} className="text-white" strokeWidth={3} />}
              {someChecked && <span className="w-[7px] h-[1.5px] rounded bg-[#473bab]" />}
            </span>
          </span>
          <span className="text-[11px] text-[#686576] group-hover:text-[#1f1d25] transition-colors"
            style={{ fontFamily: "'Roboto', sans-serif" }}>
            {allChecked ? "Deselect all" : someChecked ? `${checkedCount} selected` : "Select all"}
          </span>
        </label>
        <span className="ml-auto text-[10px] text-[#9c99a9]" style={{ fontFamily: "'Roboto', sans-serif" }}>
          {input.offers.length} total
        </span>
      </div>

      {/* Offer cards */}
      <div className="flex flex-col gap-[8px] p-[10px]">
        {input.offers.map(row => (
          <OfferCard
            key={row.id}
            offer={toCardData(row)}
            selected={checkedIds.has(row.id)}
            onSelect={(_, checked) => toggleRow(row.id, checked)}
          />
        ))}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-10 px-[12px] py-[10px] bg-white border-t border-[rgba(0,0,0,0.08)] shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
        <button
          onClick={handleApply}
          disabled={checkedCount === 0}
          className={cn(
            "w-full py-[8px] px-[14px] rounded-full text-[13px] tracking-[0.46px] transition-all duration-200",
            checkedCount > 0
              ? "bg-[#473bab] hover:bg-[#392e8a] text-white cursor-pointer shadow-sm"
              : "bg-[#473bab] opacity-40 text-white cursor-not-allowed"
          )}
          style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}
        >
          {checkedCount === 0
            ? "Select offers to add"
            : `Add ${checkedCount} offer${checkedCount === 1 ? "" : "s"} to project`}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Tool chip (for non-proposal tools) ───────────────────────────────────────
function ToolChipView({ name, input }: { name: string; input: Record<string, unknown> }) {
  const cfg: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    add_offers_to_project:        { label: "Added offers",     icon: <Plus     size={10} strokeWidth={2.5} />, color: "#16a34a", bg: "rgba(22,163,74,0.09)"  },
    remove_offers_from_project:   { label: "Removed offers",   icon: <Minus    size={10} strokeWidth={2.5} />, color: "#dc2626", bg: "rgba(220,38,38,0.09)"  },
    add_templates_to_project:     { label: "Added templates",  icon: <FileText size={10} strokeWidth={2.5} />, color: "#6356E1", bg: "rgba(99,86,225,0.09)"  },
    remove_templates_from_project:{ label: "Removed templates",icon: <Minus    size={10} strokeWidth={2.5} />, color: "#dc2626", bg: "rgba(220,38,38,0.09)"  },
    set_project_name:             { label: "Renamed project",  icon: <Tag      size={10} strokeWidth={2.5} />, color: "#0369a1", bg: "rgba(3,105,161,0.09)"  },
  };
  const c = cfg[name] ?? { label: name, icon: null, color: "#686576", bg: "rgba(104,101,118,0.09)" };
  let detail = "";
  if (name === "add_offers_to_project" || name === "remove_offers_from_project") {
    const ids = (input.offer_ids as string[]) ?? []; detail = ids.length === 1 ? ids[0] : `${ids.length} offers`;
  } else if (name === "add_templates_to_project" || name === "remove_templates_from_project") {
    const ids = (input.template_ids as string[]) ?? []; detail = ids.length === 1 ? ids[0] : `${ids.length} templates`;
  } else if (name === "set_project_name") { detail = `"${input.name}"`; }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.bg, color: c.color,
      fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 100 }}>
      {c.icon}{c.label}
      {detail && <span style={{ fontWeight: 400, opacity: 0.7 }}>· {detail}</span>}
    </span>
  );
}

// ─── Category chips ────────────────────────────────────────────────────────────
const PROJECT_CATEGORIES = ["Create a project", "Pick offers", "Pick templates", "Duplicate a project", "Create proactive project"];

// What each category chip sends to the agent — explicit phrasing ensures correct flow_scope
const CATEGORY_MESSAGES: Record<string, string> = {
  "Create a project":          "Create a project",
  "Pick offers":               "I want to pick offers for a new project. Offers only — no need for templates, backgrounds, or brand.",
  "Pick templates":            "I want to pick templates for a new project. Templates only — no need for offers, backgrounds, or brand.",
  "Duplicate a project":       "Duplicate a project",
  "Create proactive project":  "Build a full project proactively",
};

function CategoryChip({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="relative rounded-full border border-[rgba(99,86,225,0.5)] px-[10px] py-[4px] hover:bg-[rgba(71,59,171,0.06)] transition-colors cursor-pointer">
      <span className="text-[13px] text-[#473bab] tracking-[0.46px] whitespace-nowrap capitalize"
        style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, lineHeight: "22px" }}>
        {label}
      </span>
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
// Honda accounts available to the Agency user
const HONDA_ACCOUNTS = ["Honda of Anywhere", "Honda City"];

interface ProjectAgentPaneProps { isOpen: boolean; onClose: () => void; userType?: UserType; }

export function ProjectAgentPane({ isOpen, onClose, userType }: ProjectAgentPaneProps) {
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [projectContext, setProjectContext] = useState<ProjectContextPayload | null>(null);
  const [showHistory,      setShowHistory]      = useState(false);
  const [threads,          setThreads]          = useState<AgentThread[]>(() => loadAgentThreads());
  const [knownProjectNames,  setKnownProjectNames]  = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("constellation_local_projects");
      const projects: Array<{ name?: string }> = raw ? JSON.parse(raw) : [];
      return projects.map(p => p.name || "").filter(Boolean);
    } catch { return []; }
  });
  const [simulatingStream,   setSimulatingStream]   = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const currentThreadIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
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
  // Set to true right before create_project is dispatched so the project-ID-change effect
  // doesn't wipe the conversation history (the project was created BY this conversation).
  const projectCreatedByConversationRef = useRef(false);
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
      setMessages(prev => [...prev, {
        id: `backgrounds-${Date.now()}`, role: "assistant", type: "backgrounds",
        input: toolInput as BackgroundsInput, applied: false,
      } as BackgroundsMsg]);
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
      setMessages(prev => [...prev, {
        id: `share-${Date.now()}`, role: "assistant", type: "share",
        input: toolInput as ShareInput, applied: false,
      } as ShareMsg]);
    } else if (toolName === "propose_email") {
      setMessages(prev => [...prev, {
        id: `email-${Date.now()}`, role: "assistant", type: "email",
        input: toolInput as EmailInput, applied: false,
      } as EmailMsg]);
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
        const patches: Record<string, unknown> = {};
        if (toolInput.monthly_payment      != null) patches.monthlyPayment      = toolInput.monthly_payment;
        if (toolInput.term                 != null) patches.term                = toolInput.term;
        if (toolInput.total_due_at_signing != null) patches.totalDueAtSigning   = toolInput.total_due_at_signing;
        if (toolInput.offer_type           != null) patches.offerType           = toolInput.offer_type;
        if (toolInput.trim                 != null) patches.trim                = toolInput.trim;
        if (toolInput.year                 != null) patches.year                = toolInput.year;
        if (toolInput.make                 != null) patches.make                = toolInput.make;
        if (toolInput.model                != null) patches.model               = toolInput.model;
        dispatchAction({ action: "edit_offer", offerId: toolInput.offer_id as string, patches: patches as never });
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

    // If the continuation explicitly requests propose_parsed_offers, force it so the model cannot refuse.
    const forcedTool = text.includes("Call propose_parsed_offers") ? "propose_parsed_offers" : undefined;

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

    // Intercept "create a project" / "build a project" / "create proactive project" when one is already open
    if (!attachments.length && ctxRef.current?.projectId &&
        /\b(create|build|start|new)\b.*(project|campaign)/i.test(text.trim())) {
      const name = ctxRef.current.projectName;
      setMessages(prev => [...prev,
        { id: `u-${Date.now()}`, role: "user", type: "text", content: text } as TextMessage,
        { id: `a-${Date.now()}`, role: "assistant", type: "text",
          content: `**${name}** is already open — I won't start a new project mid-flow. Ask me to add offers, templates, backgrounds, or share the project instead.` } as TextMessage,
      ]);
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
    const isImageOrDocument = isFileUpload && (
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
        setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: "assistant", type: "text", content: `⚠️ ${String(err)}` } as TextMessage]);
      } finally {
        setStreaming(false);
      }
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
    );
  }, [streaming, projectContext, messages, streamMessage, handleToolResult]);

  // ── Flow steps helper — reads messagesRef (always fresh, no stale closure) ──
  const getFlowSteps = useCallback((): string[] => {
    const msgs = messagesRef.current;
    const setupMsgs = msgs.filter((m): m is SetupMsg => m.type === "setup");
    const agentSteps = setupMsgs.at(-1)?.input.flow_steps;
    if (agentSteps && agentSteps.length > 0) return agentSteps;
    // Fallback: infer from first user message
    const firstUser = msgs.find((m): m is TextMessage => m.type === "text" && m.role === "user");
    if (firstUser) {
      const t = firstUser.content.toLowerCase();
      const wantsEmail = t.includes("email") || t.includes("send") || t.includes("share");
      const wantsOffers = t.includes("offer");
      const wantsTemplates = t.includes("template");
      const wantsBackgrounds = t.includes("background");
      const steps: string[] = [];
      if (wantsOffers) steps.push("offers");
      if (wantsTemplates) steps.push("templates");
      if (wantsBackgrounds) steps.push("backgrounds");
      if (wantsEmail) steps.push("email");
      if (steps.length > 0) return steps;
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
    return `${prefix}. The offer catalog has NO offers for "${oem}". Do NOT write any text. Do NOT call propose_offers. ${context}`;
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
      // Flow is complete — proactively offer asset generation if offers + templates are present
      const ctx = ctxRef.current;
      const offerCount    = ctx?.currentOfferIds.length ?? 0;
      const templateCount = ctx?.currentTemplateIds.length ?? 0;
      if (offerCount > 0 && templateCount > 0) {
        // Approximate total: if backgrounds were added they'd be in ctx as well — use 1 as floor
        const total = offerCount * templateCount;
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `a-${Date.now()}`,
            role: "assistant",
            type: "text",
            content: `You now have everything ready to generate your assets — ${offerCount} offer${offerCount > 1 ? "s" : ""} × ${templateCount} template${templateCount > 1 ? "s" : ""} = **${total} asset${total > 1 ? "s" : ""}**.`,
            isGenerateAssetsPrompt: true,
          } as TextMessage]);
        }, 600);
      }
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
    };
    const msg = continuations[effectiveNext];
    if (msg) setTimeout(() => sendInternal(msg), 400);
  }, [getFlowSteps, sendInternal, buildOffersContinuation, setMessages]);

  // ── Setup card ──────────────────────────────────────────────────────────────
  const handleSetupApply = useCallback((name: string, account: string, oem: string, startDate: string, endDate: string, owner: string, platforms: string[]) => {
    projectCreatedByConversationRef.current = true; // suppress the project-ID-change reset
    dispatchAction({ action: "create_project", name, account, oem, startDate, endDate, owner, platforms });
    setKnownProjectNames(prev => [...prev, name]);
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
  }, [dispatchAction, sendInternal, getFlowSteps, buildOffersContinuation, fireNextStep]);

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
  const handleOffersApply = useCallback((offerIds: string[]) => {
    dispatchAction({ action: "add_offers", offerIds });
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
    const inSetupFlow = messagesRef.current.some(m => m.type === "setup");
    if (!inSetupFlow) return;
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
          projectId:   ctx?.projectId,
          projectName: ctx?.projectName ?? "Campaign",
          oem:         ctx?.oem,
          offers:      projectOffers.map(o => ({
            id: o.id, year: o.year, make: o.make, model: o.model, trim: o.trim,
            offerType: o.offerType, monthlyPayment: o.monthlyPayment, term: o.term,
          })),
          templates: projectTemplates.map(t => ({
            id: t.id, name: t.name, format: t.format,
          })),
        },
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) console.warn("[email] send-review error:", data.error);
      })
      .catch(err => console.warn("[email] send-review fetch failed:", err));

    setMessages(prev => [...prev, {
      id: `a-${Date.now()}`, role: "assistant", type: "text",
      content: `✅ Email sent to **${recipient}** with the project link.`,
    } as TextMessage]);
  }, [dispatchAction]);

  const handleEmailDismiss = useCallback(() => {}, []);

  // ── Share card ────────────────────────────────────────────────────────────
  // Called when user picks "Send via Email" from the share chooser card
  const handleShareChooseEmail = useCallback((recipientHint: string) => {
    const ctx = ctxRef.current;
    const name = ctx?.projectName ?? "this project";
    const oem  = ctx?.oem ?? "";
    const emailInput: EmailInput = {
      recipient_hint: recipientHint,
      message: `I'd like to share the ${oem} project "${name}" with you. You can view and collaborate on it using the link below:\n\n[Project link]`,
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
      "Jorge Verlindo",
    );
    setMessages(prev => [...prev, {
      id: `a-${Date.now()}`, role: "assistant", type: "text",
      content: `✅ Platform notification sent to **${recipientName}**. They'll see a notification in their feed.`,
    } as TextMessage]);
  }, [pushProjectMention]);

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
      let setupMsg = `Create a new ${oem} project.`;
      if (recipientClue) {
        setupMsg += ` Then send by email to ${recipientClue}.`;
      } else if (/template/i.test(originalText)) {
        setupMsg += ` Then add templates.`;
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
  }, [dispatchAction]);

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

    // ⚠️ GUARD: if a project is already open, never inject a setup card.
    // The chip is still visible in the chat state, but we redirect the user conversationally.
    if (ctx?.projectId) {
      setMessages(prev => [...prev,
        { id: `u-${Date.now()}`, role: "user", type: "text", content: "Create a project" } as TextMessage,
        { id: `a-${Date.now()}`, role: "assistant", type: "text",
          content: `**${ctx.projectName}** is already open. I can add or change offers, templates, backgrounds, or share it — just ask. To start a completely new project, close this one first.` } as TextMessage,
      ]);
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
  }, [knownProjectNames, simulatingStream]);

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
    : (projectContext?.projectName ?? "(no project open)");
  const hasMessages = messages.length > 0 || streaming || simulatingStream;
  const arcState = useConstellationAnim((streaming && !streamingText) || simulatingStream);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="project-agent-pane"
          initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ willChange: "transform" }}
          className="flex-none h-full w-[400px] overflow-hidden bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.04)]"
        >
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
                  <Tooltip.Content sideOffset={5} className="z-[999] px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-white bg-[#1f1d25] shadow-md select-none" style={{ fontFamily: "'Roboto', sans-serif" }}>
                    {showHistory ? "Back to conversation" : "Nudge close panel"}
                    <Tooltip.Arrow className="fill-[#1f1d25]" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              <span className="ml-0.5 text-[16px] text-[#1f1d25] tracking-[0.15px] whitespace-nowrap shrink-0"
                style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, lineHeight: "1.5" }}>
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
                    <Tooltip.Content sideOffset={5} className="z-[999] px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-white bg-[#1f1d25] shadow-md select-none" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Thread history
                      <Tooltip.Arrow className="fill-[#1f1d25]" />
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
                    <Tooltip.Content sideOffset={5} className="z-[999] px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-white bg-[#1f1d25] shadow-md select-none" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Fullscreen
                      <Tooltip.Arrow className="fill-[#1f1d25]" />
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
                    <Tooltip.Content sideOffset={5} className="z-[999] px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-white bg-[#1f1d25] shadow-md select-none" style={{ fontFamily: "'Roboto', sans-serif" }}>
                      Close panel
                      <Tooltip.Arrow className="fill-[#1f1d25]" />
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
                      <Search size={13} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9c99a9] pointer-events-none" />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={e => setHistorySearch(e.target.value)}
                        placeholder="Search conversations…"
                        className="w-full pl-[30px] pr-[10px] py-[7px] rounded-[10px] text-[12px] text-[#1f1d25] border border-[rgba(0,0,0,0.1)] bg-[#fafafb] outline-none focus:border-[#473bab] focus:ring-1 focus:ring-[rgba(71,59,171,0.15)] transition-all"
                        style={{ fontFamily: "'Roboto', sans-serif" }}
                      />
                    </div>
                    <button
                      onClick={handleNewThread}
                      title="New conversation"
                      className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[rgba(71,59,171,0.08)] hover:bg-[rgba(71,59,171,0.14)] transition-colors cursor-pointer shrink-0 text-[#473bab]"
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
                          <div className="flex items-center justify-center h-[120px] text-[13px] text-[#9c99a9]"
                            style={{ fontFamily: "'Roboto', sans-serif" }}>
                            No conversations yet
                          </div>
                        );
                      }
                      return groups.map(({ label, items }) => (
                        <div key={label} className="mb-[16px]">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9c99a9] mb-[6px] px-[2px]"
                            style={{ fontFamily: "'Roboto', sans-serif" }}>{label}</p>
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
                                <p className="text-[13px] text-[#1f1d25] truncate"
                                  style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>
                                  {thread.title}
                                </p>
                                <p className="text-[11px] text-[#9c99a9] mt-[1px]"
                                  style={{ fontFamily: "'Roboto', sans-serif" }}>
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
                      style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700,
                        backgroundImage: "linear-gradient(99.7748deg, rgb(71,59,171) 37.41%, rgb(172,171,255) 55.078%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      Welcome, Jorge
                    </p>
                    <p className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5] opacity-90 mb-[10px]"
                      style={{ fontFamily: "'Roboto', sans-serif" }}>
                      {`Hi, I'm your Auto Intelligence Agent, ready to help you build and optimise your advertising projects.`}
                    </p>
                    <div className="flex items-center gap-[6px]">
                      <p className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5] opacity-90 whitespace-nowrap shrink-0"
                        style={{ fontFamily: "'Roboto', sans-serif" }}>My current focus is</p>
                      <button className="flex items-center cursor-pointer">
                        <span className="text-[14px] tracking-[0.15px] leading-[1.5] opacity-90 whitespace-nowrap"
                          style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700,
                            backgroundImage: "linear-gradient(90deg, #473bab, #acabff)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                          {focusLabel}
                        </span>
                        <div className="size-[22px] flex items-center justify-center ml-[-2px]">
                          <ChevronDown size={12} strokeWidth={1.5} style={{ color: "#473BAB" }} />
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="flex flex-col items-center gap-[8px] pb-[16px] shrink-0">
                    <AgentInput onSubmit={send} accountName={isAgency ? selectedAccount : undefined} />
                    <div className="flex flex-wrap gap-[8px] items-center justify-center w-full">
                      {PROJECT_CATEGORIES.map(cat => (
                        <CategoryChip key={cat} label={cat} onClick={cat === "Create a project" ? handleCreateProjectClick : () => send(CATEGORY_MESSAGES[cat] ?? cat, null)} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* CHAT STATE */
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto custom-scrollbar pb-2" style={{ minHeight: 0 }}>
                    <div className="flex flex-col gap-[12px] pt-[4px]">

                      {messages.map(msg => (
                        <MessageBubble
                          key={msg.id} message={msg} context={filteredContext}
                          projectName={projectContext?.projectName ?? "this project"}
                          existingProjectNames={knownProjectNames}
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
                          onParsedOffersApply={(offers) => handleParsedOffersApply(msg.id, offers)}
                          onParsedOffersDismiss={() => handleParsedOffersDismiss(msg.id)}
                          onNotifyOwnersApply={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, applied: true } : m))}
                          onTaskOwnersApply={(owners) => {
                            dispatchAction({ action: "set_task_owners", owners });
                            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, applied: true } : m));
                          }}
                          proactive={proactiveMode}
                          onProactiveQuestionsApply={handleProactiveQuestionsSubmit}
                        />
                      ))}

                      {/* Streaming */}
                      {streaming && streamingText && (
                        <AssistantBubble text={streamingText} streaming />
                      )}

                      {/* Contextual loading indicator */}
                      {((streaming && !streamingText) || simulatingStream) && (
                        <div className="flex items-center gap-[8px]">
                          <img src={imgAgentAvatar} alt="AI" className="w-[22px] h-[22px] rounded-full object-cover shrink-0" />
                          <div className="flex items-center gap-[6px]">
                            <ConstellationArcMark arcs={arcState} size={18} />
                            <span className="text-[12px] text-[#686576] tracking-[0.4px]"
                              style={{ fontFamily: "'Roboto', sans-serif" }}>{simulatingStream ? "Setting up your project…" : loadingLabel}</span>
                          </div>
                        </div>
                      )}

                      <div ref={bottomRef} />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-[8px] pb-[16px] shrink-0 pt-[8px]">
                    <AgentInput onSubmit={send} accountName={isAgency ? selectedAccount : undefined} />
                    <div className="flex flex-wrap gap-[8px] items-center justify-center w-full">
                      {PROJECT_CATEGORIES.map(cat => (
                        <CategoryChip key={cat} label={cat} onClick={cat === "Create a project" ? handleCreateProjectClick : () => send(CATEGORY_MESSAGES[cat] ?? cat, null)} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Message bubble router ─────────────────────────────────────────────────────
function MessageBubble({
  message, context, projectName, existingProjectNames,
  onSetupApply, onSetupDismiss,
  onOffersApply, onOffersDismiss,
  onTemplatesApply, onTemplatesDismiss,
  onBackgroundsApply, onBackgroundsDismiss,
  onBrandApply, onBrandDismiss,
  onProposalApply, onProposalDismiss,
  onEmailApply, onEmailDismiss,
  onShareChooseEmail, onShareChoosePlatform,
  onParsedOffersApply, onParsedOffersDismiss,
  onNotifyOwnersApply,
  onTaskOwnersApply,
  proactive,
  onProactiveQuestionsApply,
}: {
  message: Message;
  context: ProjectContextPayload | null;
  projectName: string;
  existingProjectNames: string[];
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
  onParsedOffersApply: (offers: CustomOffer[]) => void;
  onParsedOffersDismiss: () => void;
  onNotifyOwnersApply: () => void;
  onTaskOwnersApply: (owners: Record<string, string>) => void;
  proactive?: boolean;
  onProactiveQuestionsApply?: (goal: string, timeline: string, offerFocus: string) => void;
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
            <p className="text-[12px] text-[#1f1d25] leading-[1.43] tracking-[0.17px] mb-[6px]"
              style={{ fontFamily: "'Roboto', sans-serif" }}>{message.text}</p>
          )}
          <div className="flex flex-wrap gap-[6px]">
            {message.files.map((f, i) => (
              <div key={i} className="flex items-center gap-[6px] px-[8px] py-[5px] bg-[rgba(71,59,171,0.06)] border border-[rgba(71,59,171,0.18)] rounded-[8px]">
                <FileText size={11} className="text-[#473bab] shrink-0" />
                <span className="text-[11px] text-[#473bab] truncate max-w-[160px]"
                  style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500 }}>{f.name}</span>
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
          <p className="text-[12px] text-[#1f1d25] leading-[1.43] tracking-[0.17px]"
            style={{ fontFamily: "'Roboto', sans-serif" }}>{message.content}</p>
        </div>
      </div>
    );
  }

  return <AssistantBubble text={(message as TextMessage).content} isGeneratePrompt={(message as TextMessage).isGenerateAssetsPrompt} />;
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
              <p className="text-[13px] text-[#1f1d25] leading-[1.6] tracking-[0.17px] whitespace-pre-wrap"
                style={{ fontFamily: "'Roboto', sans-serif" }}>
                {text}
                {streaming && (
                  <span style={{ display: "inline-block", width: 2, height: 13, background: "#473bab",
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
            style={{ background: "linear-gradient(99deg, #473bab 0%, #6356e1 100%)", fontFamily: "'Roboto', sans-serif" }}
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
