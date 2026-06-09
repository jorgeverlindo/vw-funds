/**
 * ProjectsModule — Full Projects experience ported from constellation-app.
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { STORAGE_KEYS } from "../../constants/storageKeys";
import {
  ChevronDown, ChevronRight, Check, Plus,
  Search, MoreVertical, History,
  Loader2, Hourglass, CheckCircle2,
  FileText, Palette, Image as ImageIcon, Layers,
  Pencil, AlertTriangle, XCircle, Archive,
  ChevronsUpDown, Trash2,
  Eye, Wand2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectAccordionSection } from "@projects/ui/ProjectAccordionSection";
import { SingleDatePicker } from "../ui/SingleDatePicker";
import { BreadcrumbBar } from "../BreadcrumbBar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "../ui/dropdown-menu";
import { ICFilters, ICViewGrid, LCOffers, LCTemplates, LCStyles, LCPreview, type IconProps } from "@projects/ui/icons";
import { ProjectStoreProvider, useProjectStore } from "@projects/lib/project-store";
import { RightPanelProvider, useRightPanel } from "@projects/lib/right-panel-context";
import { SidebarProvider, useSidebar } from "@projects/lib/sidebar-context";
import { OfferCard } from "@projects/offers/OfferCard";
import { TemplateCard } from "@projects/templates/TemplateCard";
import {
  projects, getProjectById, getProjectLogoUrl,
  getProjectOffers, getProjectTemplates, offerLibrary, templateLibrary, brandKits,
  backgroundCollections,
} from "@projects/lib/mock-data";
import type { Offer, Template, BrandKit, ProjectStatus } from "@projects/lib/mock-data";
import {
  PROJECT_CONTEXT_EVENT,
  PROJECT_AGENT_ACTION_EVENT,
  AGENT_SCROLL_TO_SECTION_EVENT,
  AGENT_GENERATE_ASSETS_EVENT,
  type ProjectContextPayload,
  type AgentActionPayload,
} from "@projects/ProjectAgentPane";
import {
  CreateProjectDialog,
  PROJECT_OWNERS,
  PLATFORM_OPTIONS,
  type NewProjectInput,
} from "./CreateProjectDialog";
import { ChannelChip } from "../ui/ChannelChip";
import { emitSnackbar } from "../Snackbar";
import { TaskOwner } from "@projects/ui/TaskOwner";
import { useComments, CommentsButton } from "@comments";

// ─── Left-pane toggle icon (from design asset) ────────────────────────────────
function LeftPaneIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="13" viewBox="6 8 18 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M7.29175 9.79171C7.29175 9.33147 7.66484 8.95837 8.12508 8.95837H21.8751C22.3353 8.95837 22.7084 9.33147 22.7084 9.79171V20.2084C22.7084 20.6686 22.3353 21.0417 21.8751 21.0417H8.12508C7.66484 21.0417 7.29175 20.6686 7.29175 20.2084V9.79171Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M11.875 9.16663V15V20.8333" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Custom offer library (localStorage store for non-catalog offers) ─────────

// The shape stored in localStorage — all 16 fields required by OfferCard
interface StoredOffer {
  id: string; year: string; make: string; model: string; trim: string;
  image: string; stock: number; offerType: string; tags: string[];
  pvi: number; aging: number; sales: number; inventory: number;
  monthlyPayment: number; term: number; totalDueAtSigning: number;
}

function loadCustomOfferLibrary(): StoredOffer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_OFFER_LIBRARY);
    return raw ? (JSON.parse(raw) as StoredOffer[]) : [];
  } catch { return []; }
}

function saveCustomOfferLibrary(offers: StoredOffer[]) {
  try { localStorage.setItem(STORAGE_KEYS.CUSTOM_OFFER_LIBRARY, JSON.stringify(offers)); } catch {}
}

// ─── Custom background library (dealer-uploaded backgrounds — RideNow flow only) ─
interface CustomBackground {
  id: string;
  name: string;
  thumbnail: string;          // URL of the generated image (used everywhere)
  images: Record<string, string>; // same key for all template sizes → same URL
}

function loadCustomBackgroundLibrary(projectId: string): CustomBackground[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_BACKGROUND_LIBRARY);
    const all: Record<string, CustomBackground[]> = raw ? JSON.parse(raw) : {};
    return all[projectId] ?? [];
  } catch { return []; }
}

function saveCustomBackgroundLibrary(projectId: string, bgs: CustomBackground[]): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_BACKGROUND_LIBRARY);
    const all: Record<string, CustomBackground[]> = raw ? JSON.parse(raw) : {};
    all[projectId] = bgs;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND_LIBRARY, JSON.stringify(all));
  } catch { /* quota exceeded */ }
}

// Convert a CustomOffer (from ParsedOffersCard) to a StoredOffer with defaults
function customOfferToStored(co: import("@projects/ProjectAgentPane").CustomOffer): StoredOffer {
  return {
    id: co.id,
    year: co.year,
    make: co.make,
    model: co.model,
    trim: co.trim,
    image: co.image ?? "",                             // resolved by resolveCarImage at extraction time
    stock: 1,
    offerType: co.offerType,
    tags: ["Custom"],
    pvi: 0,
    aging: 0,
    sales: 0,
    inventory: 1,
    monthlyPayment: parseFloat(co.monthlyPayment) || 0,
    term: parseInt(co.term) || 36,
    totalDueAtSigning: parseFloat(co.dueAtSigning) || 0,
  };
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadProjectState(projectId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECT_STATE(projectId));
    if (!raw) return null;
    return JSON.parse(raw) as {
      addedOfferIds?: string[];
      addedTemplateIds?: string[];
      removedOfferIds?: string[];
      removedTemplateIds?: string[];
      bgId?: string | null;
      agentAddedBgIds?: string[];
      activatedOem?: string | null;
      activatedOems?: string[];
      taskOwners?: Record<string, string>;
      generatedAssetIds?: Array<{ offerId: string; templateId: string; bgId: string | null }>;
    };
  } catch { return null; }
}

// ─── makeUniqueName — dedup helper ───────────────────────────────────────────────

function makeUniqueName(desired: string, existing: string[]): string {
  const norm = (s: string) => s.trim().toLowerCase();
  const set = new Set(existing.map(norm));
  if (!set.has(norm(desired))) return desired;
  let i = 1;
  while (set.has(norm(`${desired} ${i}`))) i++;
  return `${desired} ${i}`;
}

// ─── Local project type (extends mock, adds tags + createdAt + owner + platforms) ─

type LocalProject = (typeof projects[0]) & {
  tags?: string[];
  createdAt?: string;
  account?: string;
  owner?: string;       // owner display name
  platforms?: string[]; // selected ad platforms
};

type ProjectPage = "offers" | "templates" | "logos-backgrounds" | "preview";

// ─── Main module export ────────────────────────────────────────────────────────

export function ProjectsModule({ openProjectId, onProjectChange }: { openProjectId?: string | null; onProjectChange?: (id: string | null, name: string) => void }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(openProjectId ?? null);

  // When a notification requests a specific project to be opened, honour it.
  const prevOpenRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (openProjectId && openProjectId !== prevOpenRef.current) {
      setSelectedProjectId(openProjectId);
    }
    prevOpenRef.current = openProjectId;
  }, [openProjectId]);

  return (
    <ProjectStoreProvider>
      <RightPanelProvider>
        <SidebarProvider>
          <ProjectsModuleInner
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            onProjectChange={onProjectChange}
          />
        </SidebarProvider>
      </RightPanelProvider>
    </ProjectStoreProvider>
  );
}

// ─── Inner component ──────────────────────────────────────────────────────────

function ProjectsModuleInner({
  selectedProjectId,
  onSelectProject,
  onProjectChange,
}: {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onProjectChange?: (id: string | null, name: string) => void;
}) {
  const [currentPage, setCurrentPage] = useState<ProjectPage>("offers");

  // Local projects (newly created) — persisted to localStorage
  const [localProjects, setLocalProjects] = useState<LocalProject[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_PROJECTS);
      if (!raw) return [];
      return JSON.parse(raw) as LocalProject[];
    } catch { return []; }
  });
  // Status overrides for drag-drop on mock-data projects
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ProjectStatus>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATUS_OVERRIDES);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  // Deleted project IDs
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const allProjects = useMemo(() => {
    // localProjects take priority over static projects with the same id
    const localIds = new Set(localProjects.map(p => p.id));
    return [
      ...(projects as LocalProject[]).filter(p => !localIds.has(p.id) && !deletedIds.has(p.id)),
      ...localProjects.filter(p => !deletedIds.has(p.id)),
    ].map(p => ({ ...p, status: (statusOverrides[p.id] ?? p.status) as ProjectStatus }));
  }, [localProjects, statusOverrides, deletedIds]);

  // Notify parent about which project is open (so CommentsProvider context can update)
  useEffect(() => {
    if (!onProjectChange) return;
    if (selectedProjectId) {
      const proj = allProjects.find(p => p.id === selectedProjectId);
      onProjectChange(selectedProjectId, proj?.name ?? proj?.dealerName ?? "Project");
    } else {
      onProjectChange(null, "");
    }
  }, [selectedProjectId, allProjects, onProjectChange]);

  const moveProject = (projectId: string, newStatus: ProjectStatus) => {
    if (localProjects.find((p) => p.id === projectId)) {
      setLocalProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p)),
      );
    } else {
      setStatusOverrides((prev) => ({ ...prev, [projectId]: newStatus }));
    }
  };

  const deleteProject = (projectId: string) => {
    if (localProjects.find((p) => p.id === projectId)) {
      setLocalProjects((prev) => prev.filter((p) => p.id !== projectId));
    } else {
      setDeletedIds((prev) => new Set([...prev, projectId]));
    }
    if (selectedProjectId === projectId) onSelectProject(null);
  };

  const updateProject = (id: string, patches: Partial<LocalProject>) => {
    if (localProjects.find(p => p.id === id)) {
      // Already a local project — update in-place
      setLocalProjects(prev => prev.map(p => p.id === id ? { ...p, ...patches } : p));
    } else {
      // Static mock project — promote to local with patches applied
      const base = allProjects.find(p => p.id === id);
      if (!base) return;
      setLocalProjects(prev => [...prev, { ...base, ...patches }]);
      // allProjects dedup logic will now use the local copy over the static one
    }
  };

  // ── Persist localProjects to localStorage ───────────────────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_PROJECTS, JSON.stringify(localProjects));
  }, [localProjects]);

  // ── Persist statusOverrides to localStorage ──────────────────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATUS_OVERRIDES, JSON.stringify(statusOverrides));
  }, [statusOverrides]);

  // ── Listen for project status change events (e.g. from generate assets) ──────
  useEffect(() => {
    const handler = (e: Event) => {
      const { projectId, status } = (e as CustomEvent<{ projectId: string; status: ProjectStatus }>).detail;
      moveProject(projectId, status);
    };
    window.addEventListener("project-status-change", handler);
    return () => window.removeEventListener("project-status-change", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Listen for agent set_brand action ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AgentActionPayload>).detail;
      if (detail.action !== "set_brand") return;
      const { oem } = detail;
      if (!selectedProjectId) return;
      setLocalProjects(prev =>
        prev.map(p => p.id === selectedProjectId ? { ...p, oem } : p)
      );
    };
    window.addEventListener(PROJECT_AGENT_ACTION_EVENT, handler);
    return () => window.removeEventListener(PROJECT_AGENT_ACTION_EVENT, handler);
  }, [selectedProjectId]);

  // ── Listen for agent create_project action ───────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AgentActionPayload>).detail;
      if (detail.action !== "create_project") return;
      const { name, account, oem, startDate, endDate } = detail;
      const id = `project-${Date.now()}`;
      const abbr = (account || oem || "GEN").slice(0, 6).toUpperCase().replace(/\s/g, "");
      const mon  = new Date().toLocaleDateString("en-US", { month: "short", year: "2-digit" }).replace(" ", "");
      const code = `WF${String(Math.floor(Math.random() * 90000 + 10000))}_${abbr}_${name.replace(/\s+/g, "")}_${mon}`;
      const fmt  = (d: string) => d; // dates already formatted by AI
      const newProject: LocalProject = {
        id,
        dealerName:  account || "My Account",
        name,
        code,
        status:      "In Progress" as ProjectStatus,
        dateRange:   startDate && endDate ? `${fmt(startDate)} - ${fmt(endDate)}` : "",
        assignee:    { name: (detail as any).owner || "Jorge Verlindo", avatar: "" },
        oem:         oem || account || "General",
        templateIds: [],
        offerIds:    [],
        tags:        [],
        owner:       (detail as any).owner || "Jorge Verlindo",
        platforms:   (detail as any).platforms || [],
        createdAt:   new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
      setLocalProjects((prev) => [...prev, newProject]);
      onSelectProject(id);
    };
    window.addEventListener(PROJECT_AGENT_ACTION_EVENT, handler);
    return () => window.removeEventListener(PROJECT_AGENT_ACTION_EVENT, handler);
  }, [onSelectProject]);

  // ── Dispatch global context when on the list view (no project open) ──────────
  // This ensures the AI agent always has the full offer/template catalog available
  // even before a specific project is opened.
  useEffect(() => {
    if (selectedProjectId) return; // ProjectDetailView handles its own dispatch
    const payload: ProjectContextPayload = {
      projectId:          "",
      projectName:        "(no project open)",
      oem:                "",
      currentOfferIds:    [],
      currentTemplateIds: [],
      availableOffers:    offerLibrary.map((o) => ({
        id: o.id, year: o.year, make: o.make, model: o.model, trim: o.trim,
        offerType: o.offerType, monthlyPayment: o.monthlyPayment,
        term: o.term, pvi: o.pvi, aging: o.aging, stock: o.stock,
      })),
      availableTemplates: templateLibrary.map((t) => ({
        id: t.id, name: t.name, format: t.format,
        width: t.width, height: t.height, brand: t.brand,
      })),
    };
    // Defer so ProjectAgentPane's listener effect has time to register first
    setTimeout(() => window.dispatchEvent(new CustomEvent(PROJECT_CONTEXT_EVENT, { detail: payload })), 0);
  }, [selectedProjectId]);

  if (!selectedProjectId) {
    return (
      <ProjectsListView
        allProjects={allProjects}
        localProjectIds={new Set(localProjects.map(p => p.id))}
        onAddProject={(proj) => setLocalProjects((prev) => [...prev, proj])}
        onSelectProject={(id) => { onSelectProject(id); setCurrentPage("offers"); }}
        onMoveProject={moveProject}
        onDeleteProject={deleteProject}
      />
    );
  }

  const selectedProject = allProjects.find((p) => p.id === selectedProjectId);
  if (!selectedProject) {
    return (
      <ProjectsListView
        allProjects={allProjects}
        localProjectIds={new Set(localProjects.map(p => p.id))}
        onAddProject={(proj) => setLocalProjects((prev) => [...prev, proj])}
        onSelectProject={(id) => { onSelectProject(id); setCurrentPage("offers"); }}
        onMoveProject={moveProject}
        onDeleteProject={deleteProject}
      />
    );
  }

  return (
    <ProjectDetailView
      key={selectedProject.id}
      project={selectedProject}
      onBack={() => onSelectProject(null)}
      onDelete={() => { deleteProject(selectedProject.id); onSelectProject(null); }}
      onUpdateProject={updateProject}
    />
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ProjectStatus, {
  chipBg: string; chipText: string; icon: React.ReactNode; label: string;
}> = {
  "Template":          { chipBg: "bg-[#E0F7FA]",               chipText: "text-[#006064]",  icon: <FileText size={11} className="text-[#006064]" />,        label: "Template" },
  "In Progress":       { chipBg: "bg-[#E3F2FD]",               chipText: "text-[#0d47a1]",  icon: <Loader2 size={11} className="text-[#0d47a1]" />,         label: "In Progress" },
  "Awaiting Approval": { chipBg: "bg-[rgba(225,118,19,0.08)]",  chipText: "text-[#613f02]",  icon: <Hourglass size={11} className="text-[#613f02]" />,        label: "Awaiting Approval" },
  "Needs Edits":       { chipBg: "bg-[rgba(210,50,63,0.08)]",   chipText: "text-[#be0e1c]",  icon: <Pencil size={11} className="text-[#be0e1c]" />,           label: "Needs Edits" },
  "Approved":          { chipBg: "bg-[#E8F5E9]",               chipText: "text-[#1b5e20]",  icon: <CheckCircle2 size={11} className="text-[#1b5e20]" />,     label: "Approved" },
  "Assets Created":    { chipBg: "bg-[#EDE7F6]",               chipText: "text-[#4527A0]",  icon: <Layers size={11} className="text-[#4527A0]" />,           label: "Assets Created" },
  "Changes Made":      { chipBg: "bg-[rgba(225,118,19,0.08)]",  chipText: "text-[#613f02]",  icon: <AlertTriangle size={11} className="text-[#613f02]" />,    label: "Changes Made" },
  "Done":              { chipBg: "bg-[#E8F5E9]",               chipText: "text-[#1b5e20]",  icon: <Check size={11} className="text-[#1b5e20]" />,            label: "Done" },
  "Expired":           { chipBg: "bg-[#F3F4F6]",               chipText: "text-[var(--ink-secondary)]",  icon: <XCircle size={11} className="text-[var(--ink-secondary)]" />,          label: "Expired" },
  "Archived":          { chipBg: "bg-[#F3F4F6]",               chipText: "text-[var(--ink-secondary)]",  icon: <Archive size={11} className="text-[var(--ink-secondary)]" />,          label: "Archived" },
};

const PROJECT_STATUSES = Object.keys(STATUS_CONFIG) as ProjectStatus[];

const KANBAN_COLUMNS: ProjectStatus[] = [
  "In Progress", "Assets Created", "Awaiting Approval", "Approved",
];

const CURRENT_USER = {
  name: "Jorge Verlindo",
  email: "jorge.verlindo@helloconstellation.com",
  initials: "JV",
};

const ACCOUNTS = [
  "Honda of Anywhere",
  "BMW Seattle",
  "Spiriva Pharma",
  "Multiple Brands Inc.",
  "Honda City",
];

// ─── Project status chip ──────────────────────────────────────────────────────

export function ProjectStatusChip({ status }: { status: ProjectStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["In Progress"];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-normal font-['Roboto'] tracking-[0.4px] px-2 py-1 rounded-[8px] select-none whitespace-nowrap leading-tight ${cfg.chipBg} ${cfg.chipText}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Gray tag chip (account / tag) ───────────────────────────────────────────

function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#F3F4F6] text-[var(--ink-secondary)] text-[11px] font-['Roboto'] tracking-[0.4px] px-2 py-0.5 rounded-[8px] select-none whitespace-nowrap leading-tight">
      {label}
    </span>
  );
}

// ─── Stat badge ───────────────────────────────────────────────────────────────

function StatBadge({ icon, count }: { icon: React.ReactNode; count: number }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      {icon}
      {count}
    </span>
  );
}

// ─── Accordion action button (null state CTA) ─────────────────────────────────

const actnBtn =
  "flex items-center gap-1.5 border border-[var(--brand-accent)] text-[var(--brand-accent)] text-[12px] font-medium px-3 py-1.5 rounded-full hover:bg-[var(--brand-accent)]/5 transition shrink-0 cursor-pointer";

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onClick,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  project: LocalProject;
  onClick: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const logoUrl = getProjectLogoUrl(project.id);

  // Merge base project IDs with agent-added/removed IDs from localStorage
  const { offersCount, templatesCount, bgCount } = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECT_STATE(project.id)) ?? 'null');
      const addedOffers    = (saved?.addedOfferIds    as string[] | undefined) ?? [];
      const addedTemplates = (saved?.addedTemplateIds as string[] | undefined) ?? [];
      const removedOffers  = new Set<string>((saved?.removedOfferIds  as string[] | undefined) ?? []);
      const removedTpls    = new Set<string>((saved?.removedTemplateIds as string[] | undefined) ?? []);
      const agentBgs       = (saved?.agentAddedBgIds  as string[] | undefined) ?? [];

      const allOffers = [...new Set([...(project.offerIds ?? []), ...addedOffers])].filter(id => !removedOffers.has(id));
      const allTpls   = [...new Set([...(project.templateIds ?? []), ...addedTemplates])].filter(id => !removedTpls.has(id));
      const bgs       = agentBgs.length > 0 ? agentBgs.length : (saved?.bgId ? 1 : 0);

      return { offersCount: allOffers.length, templatesCount: allTpls.length, bgCount: bgs };
    } catch {
      return {
        offersCount:    (project.offerIds    ?? []).length,
        templatesCount: (project.templateIds ?? []).length,
        bgCount: 0,
      };
    }
  })();
  const assetsCount = offersCount * templatesCount;
  const status = project.status as ProjectStatus;
  const isDark = status === "Assets Created";

  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(); }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`w-full text-left bg-white border border-[#e8e7ef] rounded-xl overflow-hidden flex shadow-sm hover:shadow-md hover:border-[#ccc9da] transition group cursor-pointer ${isDragging ? "opacity-40 scale-[0.98]" : ""}`}
    >
      {/* Left thumbnail */}
      <div
        className="relative w-[85px] shrink-0 self-stretch flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: isDark ? "#1a1a2e" : "#f3f4f6" }}
      >
        <input
          type="checkbox"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 left-2 w-3.5 h-3.5 rounded accent-[var(--brand-accent)] cursor-pointer"
        />
        <img
          src={logoUrl}
          alt={project.dealerName}
          className="w-12 h-12 object-contain p-1"
          style={isDark ? { filter: "brightness(0) invert(1)" } : undefined}
        />
      </div>

      {/* Right content */}
      <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col gap-1.5">
        {/* Status chip + kebab */}
        <div className="flex items-center justify-between gap-2">
          <ProjectStatusChip status={status} />
          {/* Kebab — stop propagation so card click doesn't fire */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-gray-300 hover:text-gray-500 transition shrink-0 cursor-pointer"
              >
                <MoreVertical size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="z-[300] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.12)] p-1 min-w-[160px] animate-in fade-in-0 zoom-in-95"
              align="end"
              sideOffset={4}
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[var(--ink)] cursor-pointer outline-none focus:bg-gray-50 data-[highlighted]:bg-gray-50"
                onClick={(e) => { e.stopPropagation(); onClick(); }}
              >
                <Pencil size={13} className="text-gray-400" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[var(--danger)] cursor-pointer outline-none focus:bg-red-50 data-[highlighted]:bg-red-50"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 size={13} className="text-[var(--danger)]" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        {(() => {
          const displayTitle = project.name && !project.name.startsWith("WF") && !project.name.match(/^[A-Z]{2}\d/)
            ? project.name
            : project.dealerName;
          return (
            <p className="text-[13px] font-semibold text-gray-900 leading-snug truncate">
              {displayTitle}
            </p>
          );
        })()}

        {/* Code / dateRange */}
        <p className="text-[11px] text-gray-400 leading-tight line-clamp-2">
          {"code" in project ? (project as { code: string }).code : (project.name ?? "").startsWith("WF") ? project.name : (project.dateRange ?? "")}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-0.5">
          <StatBadge icon={<FileText size={16} />}  count={offersCount} />
          <StatBadge icon={<Palette size={16} />}   count={templatesCount} />
          <StatBadge icon={<ImageIcon size={16} />} count={bgCount} />
          <StatBadge icon={<Layers size={16} />}    count={assetsCount} />
        </div>
      </div>
    </div>
  );
}

// ─── Projects list / kanban view ──────────────────────────────────────────────

function ProjectsListView({
  allProjects,
  localProjectIds,
  onAddProject,
  onSelectProject,
  onMoveProject,
  onDeleteProject,
}: {
  allProjects: LocalProject[];
  localProjectIds: Set<string>;
  onAddProject: (p: LocalProject) => void;
  onSelectProject: (id: string) => void;
  onMoveProject: (id: string, status: ProjectStatus) => void;
  onDeleteProject: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [showNewProject, setShowNewProject] = useState(false);

  // Collapsed kanban columns
  const [collapsedColumns, setCollapsedColumns] = useState<Set<ProjectStatus>>(new Set());
  const toggleColumn = (col: ProjectStatus) =>
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ProjectStatus | null>(null);

  const mineCount = allProjects.filter(p => localProjectIds.has(p.id)).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allProjects.filter((p) => {
      if (activeTab === "mine" && !localProjectIds.has(p.id)) return false;
      return !q || p.name.toLowerCase().includes(q) || p.dealerName.toLowerCase().includes(q);
    });
  }, [search, allProjects, activeTab, localProjectIds]);

  const byStatus = useMemo(() => {
    const map: Record<string, LocalProject[]> = {};
    for (const col of KANBAN_COLUMNS) map[col] = [];
    for (const p of filtered) {
      const key = p.status as string;
      if (map[key]) map[key].push(p);
      else map[key] = [p];
    }
    return map;
  }, [filtered]);

  return (
    <>
    <CreateProjectDialog
      open={showNewProject}
      onOpenChange={(v) => { if (!v) setShowNewProject(false); }}
      brandOptions={brandKits.map(k => ({ id: k.id, name: k.name }))}
      existingNames={allProjects.map(p => p.name || ("dealerName" in p ? (p as any).dealerName : "") || "")}
      onSave={(data: NewProjectInput) => {
        const fmt  = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const id   = `project-${Date.now()}`;
        const abbr = (data.account || data.brand || "GEN").slice(0, 6).toUpperCase().replace(/\s/g, "");
        const mon  = new Date().toLocaleDateString("en-US", { month: "short", year: "2-digit" }).replace(" ", "");
        const code = `WF${String(Math.floor(Math.random() * 90000 + 10000))}_${abbr}_${data.name.replace(/\s+/g, "")}_${mon}`;
        const kit  = brandKits.find((k) => k.name === data.brand);
        const ownerObj = PROJECT_OWNERS.find(o => o.id === data.ownerId);
        const ownerName = ownerObj?.name ?? "Jorge Verlindo";
        const proj: LocalProject = {
          id,
          dealerName:  data.account || "My Account",
          name:        data.name,
          code,
          status:      "In Progress" as ProjectStatus,
          dateRange:   `${fmt(data.startDate)} - ${fmt(data.endDate)}`,
          assignee:    { name: ownerName, avatar: "" },
          oem:         kit?.oem ?? data.brand ?? data.account ?? "General",
          templateIds: [],
          offerIds:    [],
          tags:        data.tags,
          owner:       ownerName,
          platforms:   data.platforms,
          createdAt:   fmt(new Date()),
        };
        onAddProject(proj);
        setShowNewProject(false);
        onSelectProject(proj.id);
      }}
    />
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* Title + tabs */}
      <div className="px-6 pt-4 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-semibold text-gray-900">Projects</h1>
          <CommentsButton />
        </div>
        <div className="flex items-center gap-6 border-b border-gray-100">
          {(["all", "mine"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
                activeTab === tab
                  ? "border-[var(--brand-accent)] text-[var(--brand-accent)]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "all" ? `All (${allProjects.length})` : `Created By Me${mineCount > 0 ? ` (${mineCount})` : ""}`}
            </button>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 px-6 py-2 shrink-0">
        <button className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition cursor-pointer">
          <ICFilters size={20} />
        </button>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-1.5 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition">
          <Plus size={13} />
          New Project
        </button>
        <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 transition cursor-pointer">
          <MoreVertical size={15} />
        </button>
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Find below"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded-full text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] w-44"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">{filtered.length} Projects</span>
          <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 transition cursor-pointer">
            <ICViewGrid size={20} />
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-auto px-6 pb-6 pt-2">
        <div
          className="flex gap-3 items-start"
          style={{ minWidth: "max-content" }}
          onDragOver={(e) => e.preventDefault()}
        >
          {KANBAN_COLUMNS.map((colStatus) => {
            const cards = byStatus[colStatus] ?? [];
            const isCollapsed = collapsedColumns.has(colStatus);
            const isDragTarget = dragOverCol === colStatus;

            return (
              <div
                key={colStatus}
                className={`w-[345px] shrink-0 flex flex-col rounded-xl overflow-hidden transition-colors ${isDragTarget ? "ring-2 ring-[var(--brand-accent)] ring-offset-1" : ""}`}
                style={{ backgroundColor: isDragTarget ? "#f0eef8" : "#F4F5F6" }}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(colStatus); }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedId) onMoveProject(draggedId, colStatus);
                  setDraggedId(null);
                  setDragOverCol(null);
                }}
              >
                {/* Column header */}
                <button
                  onClick={() => toggleColumn(colStatus)}
                  className="flex items-center gap-3 p-3 w-full text-left hover:bg-black/5 transition-colors select-none cursor-pointer"
                >
                  {isCollapsed
                    ? <ChevronRight size={14} className="text-gray-400 shrink-0" />
                    : <ChevronDown size={14} className="text-gray-400 shrink-0" />
                  }
                  <span className="text-sm font-semibold text-gray-900">{colStatus}</span>
                  <span className="text-xs text-gray-400 font-normal">({cards.length})</span>
                </button>

                {/* Cards — animated collapse */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      key="cards"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="flex flex-col gap-2.5 pt-1 px-4 pb-4">
                        {cards.map((p) => (
                          <ProjectCard
                            key={p.id}
                            project={p}
                            onClick={() => onSelectProject(p.id)}
                            onDelete={() => onDeleteProject(p.id)}
                            onDragStart={() => setDraggedId(p.id)}
                            onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                            isDragging={draggedId === p.id}
                          />
                        ))}
                        {cards.length === 0 && (
                          <div className={`flex items-center justify-center text-xs py-8 rounded-lg border border-dashed transition-colors ${isDragTarget ? "border-[var(--brand-accent)] text-[var(--brand-accent)]" : "border-gray-200 text-gray-300"}`}>
                            {isDragTarget ? "Drop here" : "No projects"}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}

// ─── JellyBean Preview Card ───────────────────────────────────────────────────

const BRAND_COLORS_MAP: Record<string, string> = {
  Honda: "#CC0000", BMW: "#0066B1", Volkswagen: "#001E50",
  Audi: "#B30000", Toyota: "#EB0A1E", Ford: "#003478",
  Hyundai: "#002C5F", Kia: "#05141F", Chevrolet: "#D1A600",
};

/** Pick the right logo image from a brand kit for a given base slot + bg presence.
 *  e.g. getLogoForSlot(kit, "primary-square", true) → looks for "primary-square-negative" first */
function getLogoForSlot(
  kit: BrandKit | undefined,
  baseSlot: string,
  hasBg: boolean,
): string | undefined {
  if (!kit) return undefined;
  const preferred = hasBg ? "negative" : "positive";
  const fallback  = hasBg ? "positive" : "negative";
  return (
    kit.logos.find(l => l.id === `${baseSlot}-${preferred}`)?.image ??
    kit.logos.find(l => l.id === `${baseSlot}-${fallback}`)?.image ??
    kit.logos.find(l => l.id.startsWith(baseSlot))?.image
  );
}

function getBgImage(
  bg: typeof backgroundCollections[0] | null | undefined,
  template: { id: string; width: number; height: number }
): string | undefined {
  if (!bg) return undefined;
  const images = (bg.images ?? {}) as Record<string, string>;
  if (images[template.id]) return images[template.id];
  // Fallback: find closest aspect ratio among available images
  const KNOWN_SIZES: Record<string, [number, number]> = {
    "website-2000x500":  [2000, 500],
    "display-970x250":   [970, 250],
    "display-300x250":   [300, 250],
    "social-1080x1080":  [1080, 1080],
    "website-600x450":   [600, 450],
    "website-600x1067":  [600, 1067],
  };
  const targetAr = template.width / template.height;
  let bestKey = "display-300x250";
  let bestDiff = Infinity;
  for (const [key, [w, h]] of Object.entries(KNOWN_SIZES)) {
    if (!images[key]) continue;
    const diff = Math.abs(targetAr - w / h);
    if (diff < bestDiff) { bestDiff = diff; bestKey = key; }
  }
  return images[bestKey];
}

function JellyBeanCard({
  offer, template, fixedHeight = 160, bgImage, brandKit,
}: {
  offer: Offer & { image?: string };
  template: Template;
  fixedHeight?: number;
  bgImage?: string;
  brandKit?: BrandKit;
}) {
  const h = fixedHeight;
  const ar = template.width / template.height;
  const w = Math.min(Math.round(h * ar), 540);
  const isWide = ar > 2.0; // 2000×500 (4:1), 970×250 (3.88:1)

  // Fixed chip / text sizes (consistent across all card widths)
  const chipFontSize = 9.5;
  const priceFontSize = Math.round(h * 0.14); // ~22px at h=160
  const labelFontSize = 9;
  const barPadV = Math.round(h * 0.045);
  const barPadH = isWide ? 10 : Math.round(w * 0.05);

  // Adaptive text colors — white on bg image, dark on plain gray
  const hasBg       = !!bgImage;

  // Brand logos — choose positive (dark) or negative (white) based on background
  const slots = (template as any).logoSlots as string[] | undefined ?? [];
  const primaryLogoSrc     = getLogoForSlot(brandKit, "primary-square", hasBg);
  const eventHorizLogoSrc  = getLogoForSlot(brandKit, "event-horizontal", hasBg);
  const eventSquareLogoSrc = getLogoForSlot(brandKit, "event-square", hasBg);
  const eventLogoSrc = slots.includes("event-horizontal") ? eventHorizLogoSrc
    : slots.includes("event-square")                      ? eventSquareLogoSrc
    : undefined;

  // Logo sizes scaled to card height
  const primaryLogoH = Math.round(h * 0.174);   // ~28px at h=160  (+20%)
  const eventLogoH   = Math.round(h * 0.126);   // ~20px at h=160  (+20%)

  const dealerColor = hasBg ? "rgba(255,255,255,0.92)" : "var(--ink)";
  const makeColor   = hasBg ? "rgba(255,255,255,0.55)" : "var(--ink-tertiary)";
  const labelColor  = hasBg ? "rgba(255,255,255,0.70)" : "var(--ink-secondary)";
  const priceColor  = hasBg ? "white"                  : "var(--ink)";
  const moColor     = hasBg ? "rgba(255,255,255,0.60)" : "var(--ink-secondary)";
  const termColor   = hasBg ? "rgba(255,255,255,0.45)" : "var(--ink-tertiary)";

  return (
    <div
      className="relative rounded-[10px] overflow-hidden select-none shrink-0 cursor-pointer hover:shadow-lg transition-shadow"
      style={{ width: w, height: h, background: "#e2e2e2" }}
    >
      {/* Background image */}
      {bgImage && (
        <img src={bgImage} alt="background"
          className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      )}

      {/* ── WIDE layout: car on right 55%, text on left ──────────────────────── */}
      {isWide ? (
        <>
          {offer.image && (
            <img
              src={offer.image}
              alt={`${offer.year} ${offer.make} ${offer.model}`}
              className="absolute object-contain"
              style={{ right: 0, bottom: 0, height: "90%", width: "55%", objectPosition: "right bottom" }}
              draggable={false}
            />
          )}

          {/* Top row: dealer + primary logo (or make text fallback) */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between"
            style={{ padding: `${barPadV}px ${barPadH}px` }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: dealerColor, whiteSpace: "nowrap" }}>
              {offer.make} Dealer
            </span>
            {primaryLogoSrc
              ? <img src={primaryLogoSrc} alt={offer.make} draggable={false}
                  style={{ height: primaryLogoH, width: "auto", objectFit: "contain" }} />
              : <span style={{ fontSize: 10, fontWeight: 700, color: makeColor, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                  {offer.make}
                </span>
            }
          </div>

          {/* Template badge */}
          <div className="absolute rounded"
            style={{ top: Math.round(h * 0.13), left: barPadH, background: "rgba(71,59,171,0.82)", padding: "2px 5px" }}>
            <span style={{ fontSize: chipFontSize, fontWeight: 600, color: "white", letterSpacing: "0.3px" }}>
              {template.width}×{template.height}
            </span>
          </div>

          {/* Draft chip */}
          <div className="absolute flex items-center gap-[3px] rounded-full"
            style={{ top: Math.round(h * 0.13), right: barPadH, background: "rgba(255,255,255,0.88)", padding: "2px 6px" }}>
            <div className="rounded-full" style={{ width: 5, height: 5, background: "var(--ink-tertiary)" }} />
            <span style={{ fontSize: chipFontSize, fontWeight: 600, color: "var(--ink-secondary)" }}>Draft</span>
          </div>

          {/* Bottom left: price + optional event logo bottom-right */}
          <div className="absolute bottom-0 left-0"
            style={{ width: "48%", padding: `${Math.round(h * 0.06)}px ${barPadH}px ${Math.round(h * 0.07)}px` }}>
            <p style={{ fontSize: labelFontSize, fontWeight: 500, color: labelColor, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 1 }}>
              {offer.offerType} · {offer.year} {offer.make}
            </p>
            <div className="flex items-baseline" style={{ gap: 2 }}>
              <span style={{ fontSize: priceFontSize, fontWeight: 700, color: priceColor, lineHeight: 1 }}>
                ${offer.monthlyPayment}
              </span>
              <span style={{ fontSize: 11, color: moColor }}>/mo</span>
            </div>
            <p style={{ fontSize: labelFontSize, color: termColor, marginTop: 1 }}>
              {offer.term}mo · {offer.trim}
            </p>
          </div>

          {/* Event logo — bottom-right */}
          {eventLogoSrc && (
            <div className="absolute bottom-0 right-0"
              style={{ padding: `${Math.round(h * 0.06)}px ${barPadH}px ${Math.round(h * 0.07)}px` }}>
              <img src={eventLogoSrc} alt="event" draggable={false}
                style={{ height: eventLogoH, width: "auto", objectFit: "contain" }} />
            </div>
          )}
        </>
      ) : (
        /* ── NORMAL/SQUARE layout ──────────────────────────────────────────── */
        <>
          {offer.image && (
            <img
              src={offer.image}
              alt={`${offer.year} ${offer.make} ${offer.model}`}
              className="absolute w-full object-contain"
              style={{
                bottom: Math.round(h * 0.26),
                left: 0, right: 0,
                height: Math.round(h * 0.52),
                padding: `0 ${Math.round(w * 0.06)}px`,
              }}
              draggable={false}
            />
          )}

          {/* Top row: dealer + primary logo (or make text fallback) */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between"
            style={{ padding: `${barPadV}px ${barPadH}px` }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: dealerColor, whiteSpace: "nowrap" }}>
              {offer.make} Dealer
            </span>
            {primaryLogoSrc
              ? <img src={primaryLogoSrc} alt={offer.make} draggable={false}
                  style={{ height: primaryLogoH, width: "auto", objectFit: "contain" }} />
              : <span style={{ fontSize: 10, fontWeight: 700, color: makeColor, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                  {offer.make}
                </span>
            }
          </div>

          {/* Draft chip */}
          <div className="absolute flex items-center gap-[3px] rounded-full"
            style={{ top: Math.round(h * 0.12), right: Math.round(w * 0.04), background: "rgba(255,255,255,0.88)", padding: "2px 6px" }}>
            <div className="rounded-full" style={{ width: 5, height: 5, background: "var(--ink-tertiary)" }} />
            <span style={{ fontSize: chipFontSize, fontWeight: 600, color: "var(--ink-secondary)" }}>Draft</span>
          </div>

          {/* Template badge */}
          <div className="absolute rounded"
            style={{ top: Math.round(h * 0.12), left: Math.round(w * 0.04), background: "rgba(71,59,171,0.82)", padding: "2px 5px" }}>
            <span style={{ fontSize: chipFontSize, fontWeight: 600, color: "white", letterSpacing: "0.3px" }}>
              {template.width}×{template.height}
            </span>
          </div>

          {/* Bottom: price + event logo top-right of price bar */}
          <div className="absolute bottom-0 left-0 right-0"
            style={{ padding: `${Math.round(h * 0.04)}px ${barPadH}px ${Math.round(h * 0.06)}px` }}>
            {/* Event logo — floated to top-right of this block */}
            {eventLogoSrc && (
              <img src={eventLogoSrc} alt="event" draggable={false}
                className="absolute top-0 right-0"
                style={{ height: eventLogoH, width: "auto", objectFit: "contain",
                  margin: `${Math.round(h * 0.04)}px ${barPadH}px 0 0` }} />
            )}
            <p style={{ fontSize: labelFontSize, fontWeight: 500, color: labelColor, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 1 }}>
              {offer.offerType} · {offer.year} {offer.make} {offer.model}
            </p>
            <div className="flex items-baseline" style={{ gap: 2 }}>
              <span style={{ fontSize: priceFontSize, fontWeight: 700, color: priceColor, lineHeight: 1 }}>
                ${offer.monthlyPayment}
              </span>
              <span style={{ fontSize: 11, color: moColor }}>/mo</span>
            </div>
            <p style={{ fontSize: labelFontSize, color: termColor, marginTop: 1 }}>
              {offer.term}mo · {offer.trim}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Project Detail View ──────────────────────────────────────────────────────

const SECTION_IDS = ["offers", "templates", "platforms", "backgrounds", "theme", "preview", "assets", "adshells", "campaigns"] as const;
type SectionId = typeof SECTION_IDS[number];
type GeneratedAsset = { key: string; offer: Offer; template: Template; bgId: string | null };

function ProjectDetailView({
  project,
  onBack,
  onDelete,
  onUpdateProject,
}: {
  project: LocalProject;
  onBack: () => void;
  onDelete: () => void;
  onUpdateProject?: (id: string, patches: Partial<LocalProject>) => void;
}) {
  const logoUrl = getProjectLogoUrl(project.id);
  // Derive directly from project's own IDs — avoids the projects[0] fallback in getProjectById
  const offers    = (project.offerIds ?? [])
    .map((id) => offerLibrary.find((o) => o.id === id))
    .filter((o): o is Offer => !!o);
  const templates = (project.templateIds ?? [])
    .map((id) => templateLibrary.find((t) => t.id === id))
    .filter((t): t is Template => !!t);
  const status    = project.status as ProjectStatus;
  const offersCount   = offers.length    > 0 ? offers.length    : undefined;
  const templateCount = templates.length > 0 ? templates.length : undefined;

  // Scene backgrounds (no vehicle/lifestyle backgrounds)
  const sceneBackgrounds = backgroundCollections.filter(bg => !(bg as any).isLifestyle);

  // Restore persisted state for this project
  const saved = useMemo(() => loadProjectState(project.id), [project.id]);

  const { setActiveBrandKit, activeBrandKitIds } = useProjectStore();

  // Auto-wire brand kit when project OEM matches a known brand kit
  useEffect(() => {
    const kit = brandKits.find(k =>
      k.oem.toLowerCase() === (project.oem ?? "").toLowerCase() ||
      k.name.toLowerCase() === (project.oem ?? "").toLowerCase()
    );
    if (!kit) return;
    if (!activeBrandKitIds[project.id]?.[kit.oem]) {
      setActiveBrandKit(project.id, kit.oem, kit.id);
    }
    setAgentActivatedOems(prev =>
      prev.includes(kit.oem) ? prev : [...prev, kit.oem]
    );
  }, [project.id, project.oem]); // eslint-disable-line react-hooks/exhaustive-deps

  // Locally removed offer/template IDs (session-level, persisted per project)
  const [removedOfferIds, setRemovedOfferIds]       = useState<Set<string>>(new Set(saved?.removedOfferIds ?? []));
  const [removedTemplateIds, setRemovedTemplateIds] = useState<Set<string>>(new Set(saved?.removedTemplateIds ?? []));
  const [removedBgIds, setRemovedBgIds]             = useState<Set<string>>(new Set());

  // Confirm-delete state: null = no dialog open
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "offer" | "template";
    id: string;
    label: string;
  } | null>(null);

  // Agent-added IDs (arrive via window events from ProjectAgentPane, persisted per project)
  const [agentAddedOfferIds,    setAgentAddedOfferIds]    = useState<string[]>(saved?.addedOfferIds ?? []);
  // Offer IDs that the user edited in the agent panel — rendered with variant="regular" (not recommendation)
  const [agentEditedOfferIds,   setAgentEditedOfferIds]   = useState<Set<string>>(new Set());
  const [agentAddedTemplateIds, setAgentAddedTemplateIds] = useState<string[]>(saved?.addedTemplateIds ?? []);
  // Custom offer library — persisted to localStorage, merged with static offerLibrary
  const [customOfferLibrary, setCustomOfferLibrary] = useState<StoredOffer[]>(() => loadCustomOfferLibrary());
  // Custom background library (dealer-uploaded backgrounds — isolated from catalog)
  const [customBackgroundLibrary, setCustomBackgroundLibrary] = useState<CustomBackground[]>(
    () => loadCustomBackgroundLibrary(project.id)
  );
  // Backgrounds: additive model — only show what the agent (or user) explicitly adds
  const [agentAddedBgIds,       setAgentAddedBgIds]       = useState<string[]>(saved?.agentAddedBgIds ?? []);
  // Brand/theme kit: only activated when agent explicitly confirms it (not auto-derived from OEM)
  const [agentActivatedOems, setAgentActivatedOems] = useState<string[]>(
    saved?.activatedOems ?? (saved?.activatedOem ? [saved.activatedOem] : [])
  );

  // Merged library: static catalog + user-added custom offers from file extraction
  const combinedOfferLibrary = useMemo(
    () => [...offerLibrary, ...customOfferLibrary] as Offer[],
    [customOfferLibrary],
  );

  // Agent-created projects (id starts with "project-") should not auto-expand Theme & Logos;
  // the brand card in the pane handles that after the wizard is complete.
  const isAgentCreated = project.id.startsWith("project-");

  // Active brand kits — can be multiple (one per make)
  const activeBrandKits: BrandKit[] = brandKits.filter(k =>
    agentActivatedOems.some(oem => k.oem === oem || k.name === oem)
  );
  const brandKit = activeBrandKits[0]; // backward compat alias

  // Controlled accordion states — declared here so agent effects can reference setExpandedSections
  const [expandedSections, setExpandedSections] = useState<Partial<Record<SectionId, boolean>>>({
    offers:    !!offersCount,
    templates: !!templateCount,
    preview:   !!offersCount && !!templateCount,
    theme:     agentActivatedOems.length > 0 && !isAgentCreated,
  });
  const [selectedBgId, setSelectedBgId] = useState<string | null>(saved?.bgId ?? null);
  const selectedBg = backgroundCollections.find(b => b.id === selectedBgId) ?? null;

  // Edit Project dialog
  const [showEditProject, setShowEditProject] = useState(false);

  // Task owners per section
  const [taskOwners, setTaskOwners] = useState<Record<string, string>>(saved?.taskOwners ?? {});
  const setTaskOwner = (section: string, ownerId: string) =>
    setTaskOwners((prev) => ({ ...prev, [section]: ownerId }));

  // Generate Assets modal & generated asset state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);

  // Restore generated assets from localStorage on mount (after combinedOfferLibrary is ready)
  useEffect(() => {
    const savedIds = saved?.generatedAssetIds;
    if (!savedIds || savedIds.length === 0) return;
    const restored: GeneratedAsset[] = savedIds.flatMap(({ offerId, templateId, bgId }) => {
      const offer = combinedOfferLibrary.find(o => o.id === offerId);
      const template = templateLibrary.find(t => t.id === templateId);
      if (!offer || !template) return [];
      return [{ key: `${bgId ?? "none"}-${templateId}-${offerId}`, offer, template, bgId }];
    });
    if (restored.length > 0) {
      setGeneratedAssets(restored);
      setExpandedSections(prev => ({ ...prev, assets: true }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount

  // ── Auto-expand Preview when both offers AND templates are present ───────────
  useEffect(() => {
    if (offers.length > 0 && templates.length > 0) {
      setExpandedSections(prev => ({ ...prev, preview: true }));
    }
  }, [offers.length, templates.length]);

  // ── Generic agent scroll-to-section handler ──────────────────────────────────
  // When an agent card mounts it fires AGENT_SCROLL_TO_SECTION_EVENT with a
  // section name that matches the data-agent-section attribute on the wrapper div.
  // We expand the section and scroll it into view so the user never loses context.
  useEffect(() => {
    const handler = (e: Event) => {
      const { section } = (e as CustomEvent<{ section: string }>).detail;
      setExpandedSections(prev => ({ ...prev, [section]: true }));
      setTimeout(() => {
        const el = document.querySelector(`[data-agent-section="${section}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 180);
    };
    window.addEventListener(AGENT_SCROLL_TO_SECTION_EVENT, handler);
    return () => window.removeEventListener(AGENT_SCROLL_TO_SECTION_EVENT, handler);
  }, []);

  // When the agent fires AGENT_GENERATE_ASSETS_EVENT, open the generate modal
  useEffect(() => {
    const handler = () => setShowGenerateModal(true);
    window.addEventListener(AGENT_GENERATE_ASSETS_EVENT, handler);
    return () => window.removeEventListener(AGENT_GENERATE_ASSETS_EVENT, handler);
  }, []);

  // ── Autosave project state to localStorage ───────────────────────────────────
  useEffect(() => {
    const state = {
      addedOfferIds: agentAddedOfferIds,
      addedTemplateIds: agentAddedTemplateIds,
      removedOfferIds: [...removedOfferIds],
      removedTemplateIds: [...removedTemplateIds],
      bgId: selectedBgId,
      agentAddedBgIds,
      activatedOems: agentActivatedOems,
      activatedOem: agentActivatedOems[0] ?? null,
      taskOwners,
      generatedAssetIds: generatedAssets.map(a => ({ offerId: a.offer.id, templateId: a.template.id, bgId: a.bgId })),
    };
    localStorage.setItem(STORAGE_KEYS.PROJECT_STATE(project.id), JSON.stringify(state));
  }, [agentAddedOfferIds, agentAddedTemplateIds, removedOfferIds, removedTemplateIds, selectedBgId, agentAddedBgIds, agentActivatedOems, project.id, taskOwners, generatedAssets]);

  const visibleOffers = [
    ...offers,
    ...agentAddedOfferIds
      .map((id) => combinedOfferLibrary.find((o) => o.id === id))
      .filter((o): o is Offer => !!o),
  ].filter((o, i, arr) => !removedOfferIds.has(o.id) && arr.findIndex((x) => x.id === o.id) === i);

  const visibleTemplates = [
    ...templates,
    ...agentAddedTemplateIds
      .map((id) => templateLibrary.find((t) => t.id === id))
      .filter((t): t is Template => !!t),
  ].filter((t, i, arr) => !removedTemplateIds.has(t.id) && arr.findIndex((x) => x.id === t.id) === i);

  // Only show backgrounds the agent (or user) has explicitly added — additive model
  const visibleBackgrounds = [
    ...sceneBackgrounds.filter(b => agentAddedBgIds.includes(b.id) && !removedBgIds.has(b.id)),
    ...customBackgroundLibrary.filter(b => !removedBgIds.has(b.id)),
  ];

  const visibleOffersCount   = visibleOffers.length    > 0 ? visibleOffers.length    : undefined;
  const visibleTemplateCount = visibleTemplates.length > 0 ? visibleTemplates.length : undefined;

  // ── Dispatch project context whenever relevant state changes ─────────────
  useEffect(() => {
    const visibleOfferIds    = visibleOffers.map((o) => o.id);
    const visibleTemplateIds = visibleTemplates.map((t) => t.id);
    const payload: ProjectContextPayload = {
      projectId:          project.id,
      projectName:        project.name,
      oem:                project.oem ?? project.dealerName,
      startDate:          (project as any).startDate,
      endDate:            (project as any).endDate,
      owner:              (project as any).owner,
      currentOfferIds:    visibleOfferIds,
      currentTemplateIds: visibleTemplateIds,
      activeBrandOem:     brandKit?.oem,
      // First 4 generated asset previews — bg image URLs are public Cloudinary links
      generatedAssetPreviews: generatedAssets.slice(0, 4).flatMap(({ offer, template, bgId }) => {
        const bg = bgId ? backgroundCollections.find(b => b.id === bgId) ?? null : null;
        const bgUrl = getBgImage(bg, template);
        if (!bgUrl || !bgUrl.startsWith('http')) return [];
        const vehicleUrl = (offer as any).image ?? "";
        return [{
          bgUrl,
          vehicleUrl:     vehicleUrl.startsWith('http') ? vehicleUrl : "",
          offerName:      `${offer.year} ${offer.make} ${offer.model}`,
          templateName:   template.name,
          dims:           `${template.width}×${template.height}`,
          offerType:      (offer as any).offerType ?? '',
          monthlyPayment: (offer as any).monthlyPayment ?? 0,
          term:           (offer as any).term ?? 0,
          trim:           (offer as any).trim ?? '',
          make:           (offer as any).make ?? '',
        }];
      }),
      taskOwners:         Object.fromEntries(
        Object.entries(taskOwners)
          .map(([section, id]) => [section, PROJECT_OWNERS.find(o => o.id === id)?.name ?? id])
      ),
      availableOffers:    combinedOfferLibrary.map((o) => ({
        id: o.id, year: o.year, make: o.make, model: o.model, trim: o.trim,
        offerType: o.offerType, monthlyPayment: o.monthlyPayment,
        term: o.term, pvi: (o as any).pvi ?? 0, aging: (o as any).aging ?? 0, stock: (o as any).stock ?? 1,
        image: (o as any).image ?? "",
      })),
      availableTemplates: templateLibrary.map((t) => ({
        id: t.id, name: t.name, format: t.format,
        width: t.width, height: t.height, brand: t.brand,
      })),
    };
    // Defer so ProjectAgentPane's listener effect has time to register first
    setTimeout(() => window.dispatchEvent(new CustomEvent(PROJECT_CONTEXT_EVENT, { detail: payload })), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, visibleOffers.length, visibleTemplates.length, customOfferLibrary.length, brandKit?.oem, taskOwners]);

  // ── Listen for agent actions from ProjectAgentPane ────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { action, ...payload } = (e as CustomEvent<AgentActionPayload>).detail;
      if (action === "add_offers") {
        const { offerIds, editedOfferIds = [] } = payload as { offerIds: string[]; editedOfferIds?: string[] };
        if (editedOfferIds.length > 0) {
          setAgentEditedOfferIds(prev => new Set([...prev, ...editedOfferIds]));
        }
        // Expand first so the accordion opens empty, then items stagger in
        setExpandedSections((prev) => ({ ...prev, offers: true }));
        setTimeout(() => setAgentAddedOfferIds((prev) => [...new Set([...prev, ...offerIds])]), 220);
      } else if (action === "remove_offers") {
        const { offerIds } = payload as { offerIds: string[] };
        setRemovedOfferIds((prev) => new Set([...prev, ...offerIds]));
      } else if (action === "add_templates") {
        const { templateIds } = payload as { templateIds: string[] };
        setExpandedSections((prev) => ({ ...prev, templates: true }));
        setTimeout(() => setAgentAddedTemplateIds((prev) => [...new Set([...prev, ...templateIds])]), 220);
      } else if (action === "remove_templates") {
        const { templateIds } = payload as { templateIds: string[] };
        setRemovedTemplateIds((prev) => new Set([...prev, ...templateIds]));
      } else if (action === "add_custom_background") {
        const bg = (payload as { background: CustomBackground }).background;
        setCustomBackgroundLibrary(prev => {
          const next = [...prev.filter(b => b.id !== bg.id), bg];
          saveCustomBackgroundLibrary(project.id, next);
          return next;
        });
      } else if (action === "add_backgrounds") {
        const { backgroundIds } = payload as { backgroundIds: string[] };
        setExpandedSections((prev) => ({ ...prev, backgrounds: true, preview: true }));
        setTimeout(() => {
          // Add backgrounds — additive model
          setAgentAddedBgIds((prev) => [...new Set([...prev, ...backgroundIds])]);
          if (backgroundIds.length > 0) setSelectedBgId(backgroundIds[0]);
        }, 220);
      } else if (action === "set_brand") {
        const { oem } = payload as { oem: string };
        setExpandedSections((prev) => ({ ...prev, theme: true }));
        setTimeout(() => {
          setAgentActivatedOems(prev => prev.includes(oem) ? prev : [...prev, oem]);
          const kit = brandKits.find(k => k.oem === oem || k.name === oem);
          if (kit) setActiveBrandKit(project.id, kit.oem, kit.id);
        }, 220);
      } else if (action === "add_custom_offers") {
        const { offers: customOffers } = payload as { offers: import("@projects/ProjectAgentPane").CustomOffer[] };
        const stored = customOffers.map(customOfferToStored);
        const newIds = stored.map((s) => s.id);
        // Persist to localStorage and update in-memory library
        setCustomOfferLibrary((prev) => {
          const merged = [...prev, ...stored.filter((s) => !prev.some((p) => p.id === s.id))];
          saveCustomOfferLibrary(merged);
          return merged;
        });
        setExpandedSections((prev) => ({ ...prev, offers: true }));
        setTimeout(() => setAgentAddedOfferIds((prev) => [...new Set([...prev, ...newIds])]), 220);
      } else if (action === "edit_offer") {
        const { offerId, patches } = payload as { offerId: string; patches: Partial<StoredOffer> };
        if (offerId.startsWith("custom-")) {
          // Custom offer already in the mutable library — update in-place
          setCustomOfferLibrary((prev) => {
            const updated = prev.map((o) => o.id === offerId ? { ...o, ...patches } : o);
            saveCustomOfferLibrary(updated);
            return updated;
          });
        } else {
          // Static catalog offer — create an edited copy in customOfferLibrary,
          // swap the old ID out and the new one in
          const newId = `custom-edited-${offerId}`;
          setCustomOfferLibrary((prev) => {
            const base = [...offerLibrary, ...prev].find((o) => o.id === offerId);
            if (!base) return prev;
            const editedOffer: StoredOffer = { ...(base as StoredOffer), ...patches, id: newId };
            const without = prev.filter((o) => o.id !== newId);
            const updated = [...without, editedOffer];
            saveCustomOfferLibrary(updated);
            return updated;
          });
          // Remove old catalog ID, add new custom ID
          setRemovedOfferIds((prev) => new Set([...prev, offerId]));
          setAgentAddedOfferIds((prev) => [...new Set([...prev, newId])]);
        }
      } else if (action === "set_task_owners") {
        const ownerNames = (payload as any).owners as Record<string, string>;
        // Convert name → id for taskOwners state
        const newOwners: Record<string, string> = {};
        Object.entries(ownerNames).forEach(([section, name]) => {
          const owner = PROJECT_OWNERS.find(o => o.name === name);
          if (owner) newOwners[section] = owner.id;
        });
        setTaskOwners(prev => ({ ...prev, ...newOwners }));
      }
    };
    window.addEventListener(PROJECT_AGENT_ACTION_EVENT, handler);
    return () => window.removeEventListener(PROJECT_AGENT_ACTION_EVENT, handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "offer") {
      setRemovedOfferIds((prev) => new Set([...prev, confirmDelete.id]));
    } else {
      setRemovedTemplateIds((prev) => new Set([...prev, confirmDelete.id]));
    }
    setConfirmDelete(null);
  };

  const initials = (project.assignee?.name ?? "")
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const toggleSection = (id: SectionId, v: boolean) =>
    setExpandedSections((prev) => ({ ...prev, [id]: v }));

  const allExpanded = SECTION_IDS.every((id) => expandedSections[id]);
  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedSections({});
    } else {
      setExpandedSections(Object.fromEntries(SECTION_IDS.map((id) => [id, true])));
    }
  };

  const tags = (project as LocalProject).tags ?? [];
  const accountName = project.dealerName;

  // Parse created date from dateRange (first part before " - ")
  const createdDateStr = (project.createdAt
    ?? (project.dateRange ?? "").split(" - ")[0])
    || "—";

  return (
    <ProjectDetailViewInner
      project={project}
      onBack={onBack}
      onDelete={onDelete}
      offers={offers}
      templates={templates}
      status={status}
      offersCount={offersCount}
      templateCount={templateCount}
      sceneBackgrounds={sceneBackgrounds}
      saved={saved}
      removedOfferIds={removedOfferIds}
      setRemovedOfferIds={setRemovedOfferIds}
      removedTemplateIds={removedTemplateIds}
      setRemovedTemplateIds={setRemovedTemplateIds}
      removedBgIds={removedBgIds}
      setRemovedBgIds={setRemovedBgIds}
      confirmDelete={confirmDelete}
      setConfirmDelete={setConfirmDelete}
      agentAddedOfferIds={agentAddedOfferIds}
      setAgentAddedOfferIds={setAgentAddedOfferIds}
      agentEditedOfferIds={agentEditedOfferIds}
      setAgentEditedOfferIds={setAgentEditedOfferIds}
      agentAddedTemplateIds={agentAddedTemplateIds}
      setAgentAddedTemplateIds={setAgentAddedTemplateIds}
      customOfferLibrary={customOfferLibrary}
      setCustomOfferLibrary={setCustomOfferLibrary}
      customBackgroundLibrary={customBackgroundLibrary}
      setCustomBackgroundLibrary={setCustomBackgroundLibrary}
      agentAddedBgIds={agentAddedBgIds}
      setAgentAddedBgIds={setAgentAddedBgIds}
      agentActivatedOems={agentActivatedOems}
      setAgentActivatedOems={setAgentActivatedOems}
      combinedOfferLibrary={combinedOfferLibrary}
      isAgentCreated={isAgentCreated}
      activeBrandKits={activeBrandKits}
      brandKit={brandKit}
      expandedSections={expandedSections}
      setExpandedSections={setExpandedSections}
      selectedBgId={selectedBgId}
      setSelectedBgId={setSelectedBgId}
      showEditProject={showEditProject}
      setShowEditProject={setShowEditProject}
      taskOwners={taskOwners}
      setTaskOwners={setTaskOwners}
      showGenerateModal={showGenerateModal}
      setShowGenerateModal={setShowGenerateModal}
      generatedAssets={generatedAssets}
      setGeneratedAssets={setGeneratedAssets}
      logoUrl={logoUrl}
      onUpdateProject={onUpdateProject}
    />
  );
}

// ─── ProjectDetailViewInner (receives CommentsProvider from parent) ────────────
// Extracted so we can call useComments() *inside* CommentsProvider.

// (Props are passed 1:1 from ProjectDetailView — no logic change.)
function ProjectDetailViewInner({
  project,
  onBack,
  onDelete,
  onUpdateProject,
  offers,
  templates,
  status,
  offersCount,
  templateCount,
  sceneBackgrounds,
  saved,
  removedOfferIds,
  setRemovedOfferIds,
  removedTemplateIds,
  setRemovedTemplateIds,
  removedBgIds,
  setRemovedBgIds,
  confirmDelete,
  setConfirmDelete,
  agentAddedOfferIds,
  setAgentAddedOfferIds,
  agentEditedOfferIds,
  setAgentEditedOfferIds,
  agentAddedTemplateIds,
  setAgentAddedTemplateIds,
  customOfferLibrary,
  setCustomOfferLibrary,
  customBackgroundLibrary,
  setCustomBackgroundLibrary,
  agentAddedBgIds,
  setAgentAddedBgIds,
  agentActivatedOems,
  setAgentActivatedOems,
  combinedOfferLibrary,
  isAgentCreated,
  activeBrandKits,
  brandKit,
  expandedSections,
  setExpandedSections,
  selectedBgId,
  setSelectedBgId,
  showEditProject,
  setShowEditProject,
  taskOwners,
  setTaskOwners,
  showGenerateModal,
  setShowGenerateModal,
  generatedAssets,
  setGeneratedAssets,
  logoUrl,
}: {
  project: LocalProject;
  onBack: () => void;
  onDelete: () => void;
  onUpdateProject?: (id: string, patches: Partial<LocalProject>) => void;
  offers: Offer[];
  templates: Template[];
  status: ProjectStatus;
  offersCount: number | undefined;
  templateCount: number | undefined;
  sceneBackgrounds: typeof backgroundCollections;
  saved: ReturnType<typeof loadProjectState>;
  removedOfferIds: Set<string>;
  setRemovedOfferIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  removedTemplateIds: Set<string>;
  setRemovedTemplateIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  removedBgIds: Set<string>;
  setRemovedBgIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  confirmDelete: { type: "offer" | "template"; id: string; label: string } | null;
  setConfirmDelete: React.Dispatch<React.SetStateAction<{ type: "offer" | "template"; id: string; label: string } | null>>;
  agentAddedOfferIds: string[];
  setAgentAddedOfferIds: React.Dispatch<React.SetStateAction<string[]>>;
  agentEditedOfferIds: Set<string>;
  setAgentEditedOfferIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  agentAddedTemplateIds: string[];
  setAgentAddedTemplateIds: React.Dispatch<React.SetStateAction<string[]>>;
  customOfferLibrary: StoredOffer[];
  setCustomOfferLibrary: React.Dispatch<React.SetStateAction<StoredOffer[]>>;
  customBackgroundLibrary: CustomBackground[];
  setCustomBackgroundLibrary: React.Dispatch<React.SetStateAction<CustomBackground[]>>;
  agentAddedBgIds: string[];
  setAgentAddedBgIds: React.Dispatch<React.SetStateAction<string[]>>;
  agentActivatedOems: string[];
  setAgentActivatedOems: React.Dispatch<React.SetStateAction<string[]>>;
  combinedOfferLibrary: Offer[];
  isAgentCreated: boolean;
  activeBrandKits: BrandKit[];
  brandKit: BrandKit | undefined;
  expandedSections: Partial<Record<SectionId, boolean>>;
  setExpandedSections: React.Dispatch<React.SetStateAction<Partial<Record<SectionId, boolean>>>>;
  selectedBgId: string | null;
  setSelectedBgId: React.Dispatch<React.SetStateAction<string | null>>;
  showEditProject: boolean;
  setShowEditProject: React.Dispatch<React.SetStateAction<boolean>>;
  taskOwners: Record<string, string>;
  setTaskOwners: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  showGenerateModal: boolean;
  setShowGenerateModal: React.Dispatch<React.SetStateAction<boolean>>;
  generatedAssets: GeneratedAsset[];
  setGeneratedAssets: React.Dispatch<React.SetStateAction<GeneratedAsset[]>>;
  logoUrl: string;
}) {
  // Access comments context (we're inside CommentsProvider now)
  const commentsCtx = useComments();

  // Re-derive helpers from props (previously local vars in ProjectDetailView)
  const setTaskOwner = (section: string, ownerId: string) =>
    setTaskOwners((prev) => ({ ...prev, [section]: ownerId }));

  const { setActiveBrandKit, activeBrandKitIds } = useProjectStore();

  const accountName = project.dealerName;
  const tags = (project as LocalProject).tags ?? [];
  const createdDateStr = (project.createdAt ?? (project.dateRange ?? "").split(" - ")[0]) || "—";
  const initials = (project.assignee?.name ?? "")
    .split(" ")
    .map((n: string) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const allExpanded = SECTION_IDS.every((id) => expandedSections[id]);
  const toggleSection = (id: SectionId, v: boolean) =>
    setExpandedSections((prev) => ({ ...prev, [id]: v }));
  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedSections({});
    } else {
      setExpandedSections(Object.fromEntries(SECTION_IDS.map((id) => [id, true])));
    }
  };

  const visibleOffers = useMemo(() => {
    const combined = [
      ...offers,
      ...agentAddedOfferIds
        .map((id) => combinedOfferLibrary.find((o) => o.id === id))
        .filter((o): o is Offer => !!o),
    ];
    const seen = new Set<string>();
    return combined.filter((o) => {
      if (removedOfferIds.has(o.id) || seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
  }, [offers, agentAddedOfferIds, combinedOfferLibrary, removedOfferIds]);

  const visibleTemplates = useMemo(() => {
    const combined = [
      ...templates,
      ...agentAddedTemplateIds
        .map((id) => templateLibrary.find((t) => t.id === id))
        .filter((t): t is Template => !!t),
    ];
    const seen = new Set<string>();
    return combined.filter((t) => {
      if (removedTemplateIds.has(t.id) || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [templates, agentAddedTemplateIds, removedTemplateIds]);

  const visibleBackgrounds = useMemo(() => {
    const catalogBgs = agentAddedBgIds
      .map((id) => backgroundCollections.find((b) => b.id === id))
      .filter((b): b is NonNullable<typeof b> => !!b)
      .filter((b) => !removedBgIds.has(b.id));
    const customBgs = customBackgroundLibrary.filter(b => !removedBgIds.has(b.id));
    return [...catalogBgs, ...customBgs];
  }, [agentAddedBgIds, removedBgIds, customBackgroundLibrary]);

  const visibleOffersCount    = visibleOffers.length    > 0 ? visibleOffers.length    : undefined;
  const visibleTemplateCount  = visibleTemplates.length > 0 ? visibleTemplates.length : undefined;
  const selectedBg = backgroundCollections.find(b => b.id === selectedBgId) ?? null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "offer") {
      setRemovedOfferIds((prev) => new Set([...prev, confirmDelete.id]));
    } else {
      setRemovedTemplateIds((prev) => new Set([...prev, confirmDelete.id]));
    }
    setConfirmDelete(null);
    persistProjectState(project.id, {
      removedOfferIds: [...removedOfferIds, confirmDelete.type === "offer" ? confirmDelete.id : ""].filter(Boolean),
      removedTemplateIds: [...removedTemplateIds, confirmDelete.type === "template" ? confirmDelete.id : ""].filter(Boolean),
      addedOfferIds: agentAddedOfferIds,
      addedTemplateIds: agentAddedTemplateIds,
      agentAddedBgIds,
      activatedOems: agentActivatedOems,
    });
    emitSnackbar(`${confirmDelete.type === "offer" ? "Offer" : "Template"} removed`);
  };

  const actnBtn = "flex items-center gap-1 text-[12px] text-[var(--brand-accent)] font-medium cursor-pointer hover:opacity-75 transition";

  return (
    <div className="flex flex-row h-full bg-white overflow-hidden">
    {/* ── Main content column ───────────────────────────────────────── */}
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-5 pt-3.5 pb-0 shrink-0">

        {/* Breadcrumb + Comments toggle */}
        <div className="mb-2.5 flex items-center justify-between">
          <BreadcrumbBar
            items={[{ label: "Projects", onClick: onBack }]}
            activeLabel={project.name}
          />
          <CommentsButton />
        </div>

        {/* Title row */}
        <div className="flex items-center gap-4 mb-2 min-w-0">
          {/* Panel toggle */}
          <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition shrink-0 cursor-pointer">
            <LeftPaneIcon />
          </button>

          {/* Title */}
          <h1 className="text-[18px] font-bold text-[var(--ink)] leading-tight min-w-0">
            {project.name && !project.name.startsWith("WF") && !project.name.match(/^[A-Z]{2}\d/)
              ? project.name
              : project.dealerName}
          </h1>

          {/* Kebab — 16px from title (gap-4) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition shrink-0 cursor-pointer">
                <MoreVertical size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="z-[300] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.12)] p-1 min-w-[170px] animate-in fade-in-0 zoom-in-95"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuItem
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[var(--ink)] cursor-pointer outline-none focus:bg-gray-50 data-[highlighted]:bg-gray-50"
                onClick={() => setShowEditProject(true)}
              >
                <Pencil size={13} className="text-gray-400" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[var(--danger)] cursor-pointer outline-none focus:bg-red-50 data-[highlighted]:bg-red-50"
                onClick={onDelete}
              >
                <Trash2 size={13} className="text-[var(--danger)]" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Account logo + name — 16px from kebab (gap-4) */}
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-secondary)] shrink-0">
            <div className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
              <img src={logoUrl} alt={accountName} className="w-full h-full object-contain p-0.5" />
            </div>
            <span className="truncate max-w-[130px]">{accountName}</span>
          </div>

          {/* Creator avatar + name — 16px from account (gap-4) */}
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-secondary)] shrink-0">
            <div className="w-6 h-6 rounded-full bg-[var(--brand-accent)] text-white text-[9px] font-semibold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <span className="truncate max-w-[110px]">{project.assignee?.name ?? ""}</span>
          </div>

        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pb-3 border-b border-[#EAEAEC]">
          <ProjectStatusChip status={status} />
          <span className="text-[12px] text-[var(--ink-secondary)]">{project.dateRange}</span>
          {/* Account chip */}
          <TagChip label={accountName} />
          {/* Tag chips */}
          {tags.map((t) => <TagChip key={t} label={t} />)}

          <span className="text-[11px]">
            <span className="font-medium text-[var(--ink)]">Last Updated:</span>{" "}
            <span className="text-[var(--ink-secondary)]">just now</span>
          </span>
          <span className="text-[11px]">
            <span className="font-medium text-[var(--ink)]">Created:</span>{" "}
            <span className="text-[var(--ink-secondary)]">{createdDateStr}</span>
          </span>
          <span className="text-[11px]">
            <span className="font-medium text-[var(--ink)]">Creator:</span>{" "}
            <span className="text-[var(--ink-secondary)]">{project.assignee?.name ?? ""}</span>
          </span>

          {/* Expand all — pushed right */}
          <button
            onClick={toggleExpandAll}
            className="ml-auto flex items-center gap-1 text-[12px] text-[var(--brand-accent)] hover:opacity-75 transition font-medium cursor-pointer"
          >
            <ChevronsUpDown size={13} strokeWidth={2} />
            {allExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* ── Accordion sections ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1 px-4 py-3">

        {/* Offers */}
        <div data-agent-section="offers">
        <ProjectAccordionSection
          title="Offers"
          count={visibleOffersCount}
          statusSlot={visibleOffersCount ? <ProjectStatusChip status="Done" /> : undefined}
          onDetails={visibleOffersCount ? () => {} : undefined}
          expanded={expandedSections["offers"]}
          onExpandedChange={(v) => toggleSection("offers", v)}
          ownerSlot={<TaskOwner ownerId={taskOwners["offers"]} onChange={(id) => setTaskOwner("offers", id)} />}
          emptyContent={
            <button className={actnBtn}>
              <Plus size={12} strokeWidth={2.5} />
              Add Offers
            </button>
          }
        >
          <motion.div
            key={`offers-${visibleOffers.map(o => o.id).join('-')}`}
            className="flex gap-3 overflow-x-auto pb-1"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
            initial="hidden"
            animate="show"
          >
            {visibleOffers.map((o) => (
              <motion.div
                key={o.id}
                className="flex-shrink-0"
                variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0, transition: { duration: 0.28, ease: "easeOut" } } }}
              >
                <OfferCard
                  offer={o as any}
                  variant={agentEditedOfferIds.has(o.id) ? "regular" : undefined}
                  onDelete={() => setConfirmDelete({
                    type: "offer",
                    id: o.id,
                    label: `${(o as any).year} ${(o as any).make} ${(o as any).model} ${(o as any).trim}`,
                  })}
                />
              </motion.div>
            ))}
          </motion.div>
        </ProjectAccordionSection>
        </div>

        {/* Templates */}
        <div data-agent-section="templates">
        <ProjectAccordionSection
          title="Templates"
          count={visibleTemplateCount}
          statusSlot={visibleTemplateCount ? <ProjectStatusChip status="Done" /> : undefined}
          onDetails={visibleTemplateCount ? () => {} : undefined}
          expanded={expandedSections["templates"]}
          onExpandedChange={(v) => toggleSection("templates", v)}
          ownerSlot={<TaskOwner ownerId={taskOwners["templates"]} onChange={(id) => setTaskOwner("templates", id)} />}
          emptyContent={
            <button className={actnBtn}>
              <Plus size={12} strokeWidth={2.5} />
              Add Templates
            </button>
          }
        >
          <motion.div
            key={`templates-${visibleTemplates.map(t => t.id).join('-')}`}
            className="flex gap-3 overflow-x-auto pb-2"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
            initial="hidden"
            animate="show"
          >
            {visibleTemplates.map((t) => (
              <motion.div
                key={t.id}
                className="flex-shrink-0 w-[260px]"
                variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0, transition: { duration: 0.28, ease: "easeOut" } } }}
              >
                <TemplateCard
                  template={t}
                  onDelete={() => setConfirmDelete({
                    type: "template",
                    id: t.id,
                    label: t.name,
                  })}
                />
              </motion.div>
            ))}
          </motion.div>
        </ProjectAccordionSection>
        </div>

        {/* Platforms */}
        <div data-agent-section="platforms">
        <ProjectAccordionSection
          title="Platforms"
          count={(project.platforms?.length ?? 0) > 0 ? (project.platforms?.length ?? 0) : undefined}
          statusSlot={(project.platforms?.length ?? 0) > 0 ? <ProjectStatusChip status="Done" /> : undefined}
          ownerSlot={<TaskOwner ownerId={taskOwners["platforms"]} onChange={(id) => setTaskOwner("platforms", id)} />}
          expanded={expandedSections["platforms"]}
          onExpandedChange={(v) => toggleSection("platforms", v)}
          emptyContent={
            <button className={actnBtn}>
              <Plus size={12} strokeWidth={2.5} />
              Add Platforms
            </button>
          }
        >
          {(project.platforms?.length ?? 0) > 0 && (
            <motion.div
              className="flex flex-wrap gap-1.5"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {(project.platforms ?? []).map((p) => {
                // p may be an ID ("google-pmax") or a label ("Google PMax") depending on source
                const opt = PLATFORM_OPTIONS.find(o => o.id === p || o.label === p);
                const label = opt?.label ?? p;
                return (
                  <ChannelChip key={p} label={label} icon={opt?.icon} />
                );
              })}
            </motion.div>
          )}
        </ProjectAccordionSection>
        </div>

        {/* Backgrounds */}
        <div data-agent-section="backgrounds">
        <ProjectAccordionSection
          title="Backgrounds"
          count={visibleBackgrounds.length > 0 ? visibleBackgrounds.length : undefined}
          expanded={expandedSections["backgrounds"]}
          onExpandedChange={(v) => toggleSection("backgrounds", v)}
          ownerSlot={<TaskOwner ownerId={taskOwners["backgrounds"]} onChange={(id) => setTaskOwner("backgrounds", id)} />}
          emptyContent={
            <button className={actnBtn}>
              <Plus size={12} strokeWidth={2.5} />
              Add Backgrounds
            </button>
          }
        >
          <motion.div
            key={`bg-stagger-${visibleBackgrounds.length}-${selectedBgId}`}
            className="flex gap-3 overflow-x-auto pb-2"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
            initial="hidden"
            animate="show"
          >
            {visibleBackgrounds.map((bg) => (
              <motion.div
                key={bg.id}
                className="group relative flex-none flex flex-col items-center gap-1.5 cursor-pointer"
                style={{ width: 80 }}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } } }}
              >
                {/* Kebab menu */}
                <div className="absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="w-[18px] h-[18px] rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer"
                        onClick={(e) => e.stopPropagation()}>
                        <MoreVertical size={10} strokeWidth={2.5} className="text-[var(--ink-secondary)]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemovedBgIds(prev => new Set([...prev, bg.id]));
                          if (selectedBgId === bg.id) setSelectedBgId(null);
                        }}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Thumbnail */}
                <button
                  onClick={() => setSelectedBgId(prev => prev === bg.id ? null : bg.id)}
                  className="w-full"
                >
                  <div
                    className="relative w-[80px] h-[60px] rounded-lg overflow-hidden transition-all"
                    style={{
                      outline: selectedBgId === bg.id ? "2.5px solid var(--brand-accent)" : "2px solid transparent",
                      outlineOffset: 1,
                      boxShadow: selectedBgId === bg.id ? "0 0 0 4px rgba(71,59,171,0.15)" : "none",
                    }}
                  >
                    <img src={bg.thumbnail} alt={bg.name} className="w-full h-full object-cover" />
                    {selectedBgId === bg.id && (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(71,59,171,0.18)" }}>
                        <Check size={16} strokeWidth={2.5} className="text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                </button>
                <span className="text-[10px] text-[var(--ink-secondary)] text-center leading-tight font-medium">
                  {bg.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </ProjectAccordionSection>
        </div>

        {/* Theme & Logos */}
        <div data-agent-section="theme">
        <ProjectAccordionSection
          title="Theme & Logos"
          count={activeBrandKits.length > 0 ? activeBrandKits.length : undefined}
          statusSlot={activeBrandKits.length > 0 ? <ProjectStatusChip status="Done" /> : undefined}
          expanded={expandedSections["theme"]}
          onExpandedChange={(v) => toggleSection("theme", v)}
          ownerSlot={<TaskOwner ownerId={taskOwners["brand"]} onChange={(id) => setTaskOwner("brand", id)} />}
          emptyContent={
            <button className={actnBtn}>
              <Plus size={12} strokeWidth={2.5} />
              Add Theme &amp; Logos
            </button>
          }
        >
          <div className="flex flex-col gap-4">
            {/* Brand selector checkboxes */}
            <div className="flex flex-wrap gap-2">
              {brandKits.map(k => {
                const isActive = agentActivatedOems.some(oem => k.oem === oem || k.name === oem);
                return (
                  <button
                    key={k.id}
                    onClick={() => {
                      setAgentActivatedOems(prev =>
                        isActive ? prev.filter(o => o !== k.oem && o !== k.name) : [...prev, k.oem]
                      );
                      if (!isActive) setActiveBrandKit(project.id, k.oem, k.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer ${isActive ? "bg-[rgba(99,86,225,0.08)] border-[rgba(99,86,225,0.3)] text-[var(--brand-accent)]" : "bg-white border-[rgba(0,0,0,0.12)] text-[var(--ink-secondary)] hover:border-[rgba(99,86,225,0.3)]"}`}
                  >
                    <span className={`w-[14px] h-[14px] rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-[var(--brand-mid)] border-[var(--brand-mid)]" : "border-[rgba(0,0,0,0.3)]"}`}>
                      {isActive && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    {k.name}
                  </button>
                );
              })}
            </div>
            {/* Logo grids for each active brand kit */}
            {activeBrandKits.map(kit => (
              <div key={kit.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <span className="text-[13px] font-semibold text-[var(--ink)]">{kit.name}</span>
                  <div className="flex items-center gap-2">
                    {kit.colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-[11px] text-[var(--ink-secondary)] font-mono">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <motion.div
                  className="flex flex-wrap gap-2"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
                  initial="hidden"
                  animate="show"
                >
                  {kit.logos.map((logo) => (
                    <motion.div
                      key={logo.id}
                      className="flex flex-col items-center gap-1 w-[88px]"
                      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: "easeOut" } } }}
                    >
                      <div className="w-[88px] h-[66px] rounded-lg bg-[#F4F5F6] border border-black/[0.07] flex items-center justify-center p-2">
                        <img src={logo.image} alt={logo.label} className="max-w-full max-h-full object-contain" />
                      </div>
                      <span className="text-[10px] text-[var(--ink-secondary)] text-center leading-tight line-clamp-2">{logo.label}</span>
                      <span className="text-[9px] text-[var(--ink-tertiary)] text-center">{logo.sublabel}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </ProjectAccordionSection>
        </div>

        {/* Preview */}
        <ProjectAccordionSection
          title="Preview"
          count={visibleOffers.length > 0 && visibleTemplates.length > 0 ? visibleOffers.length * visibleTemplates.length : undefined}
          statusSlot={
            visibleOffers.length > 0 && visibleTemplates.length > 0
              ? <button
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-white cursor-pointer"
                  style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
                  onClick={() => setShowGenerateModal(true)}
                >
                  <Wand2 size={11} strokeWidth={2} />
                  Generate Assets
                </button>
              : undefined
          }
          expanded={expandedSections["preview"]}
          onExpandedChange={(v) => toggleSection("preview", v)}
          emptyContent={
            <button className={actnBtn}>
              <Eye size={12} strokeWidth={2} />
              Add Preview
            </button>
          }
        >
          {visibleOffers.length > 0 && visibleTemplates.length > 0 && (
            <motion.div
              key={`preview-${visibleTemplates.map(t => t.id).join('-')}-${visibleOffers.map(o => o.id).join('-')}`}
              className="flex gap-3 overflow-x-auto pb-2"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
              initial="hidden"
              animate="show"
            >
              {visibleTemplates.flatMap(template =>
                visibleOffers.map(offer => ({ key: `${template.id}-${offer.id}`, offer, template }))
              ).map(({ key, offer, template }) => (
                <motion.div
                  key={key}
                  className="flex-shrink-0"
                  variants={{ hidden: { opacity: 0, y: 12, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: "easeOut" } } }}
                >
                  <JellyBeanCard
                    offer={offer as any}
                    template={template}
                    fixedHeight={160}
                    bgImage={getBgImage(selectedBg, template)}
                    brandKit={brandKit}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </ProjectAccordionSection>

        {/* Assets */}
        <div data-agent-section="assets">
        <ProjectAccordionSection
          title="Assets"
          count={generatedAssets.length > 0 ? generatedAssets.length : undefined}
          expanded={expandedSections["assets"]}
          onExpandedChange={(v) => toggleSection("assets", v)}
          ownerSlot={<TaskOwner ownerId={taskOwners["assets"]} onChange={(id) => setTaskOwner("assets", id)} />}
          emptyContent={
            <div className="flex flex-col gap-2 items-start">
              <button className={actnBtn} onClick={() => visibleOffers.length > 0 && visibleTemplates.length > 0 ? setShowGenerateModal(true) : undefined}>
                <Wand2 size={12} strokeWidth={2} />
                Add Assets
              </button>
              <p className="text-[12px] text-gray-400 leading-relaxed">
                Please click to Generate Assets in the Preview section.
              </p>
            </div>
          }
        >
          {generatedAssets.length > 0 && (
            <motion.div
              key={`assets-${generatedAssets.length}`}
              className="flex gap-3 overflow-x-auto pb-2"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
              initial="hidden"
              animate="show"
            >
              {generatedAssets.map(({ key, offer, template, bgId }) => {
                const bg = bgId ? backgroundCollections.find(b => b.id === bgId) ?? null : null;
                return (
                  <motion.div
                    key={key}
                    className="flex-shrink-0"
                    variants={{ hidden: { opacity: 0, y: 10, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: "easeOut" } } }}
                  >
                    <JellyBeanCard
                      offer={offer as any}
                      template={template}
                      fixedHeight={160}
                      bgImage={getBgImage(bg, template)}
                      brandKit={brandKit}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </ProjectAccordionSection>
        </div>

        {/* Ad Shells */}
        <div data-agent-section="adshells">
        <ProjectAccordionSection
          title="Ad Shells"
          ownerSlot={<TaskOwner ownerId={taskOwners["adshells"]} onChange={(id) => setTaskOwner("adshells", id)} />}
          expanded={expandedSections["adshells"]}
          onExpandedChange={(v) => toggleSection("adshells", v)}
          emptyContent={
            <button className={actnBtn}>
              <Plus size={12} strokeWidth={2.5} />
              Create Ad Shells
            </button>
          }
        />
        </div>

        {/* Campaigns */}
        <ProjectAccordionSection
          title="Campaigns"
          ownerSlot={<TaskOwner ownerId={taskOwners["campaigns"]} onChange={(id) => setTaskOwner("campaigns", id)} />}
          expanded={expandedSections["campaigns"]}
          onExpandedChange={(v) => toggleSection("campaigns", v)}
          emptyContent={
            <p className="text-[12px] text-gray-400 leading-relaxed">
              Please create Ad Shells first.
            </p>
          }
        />
        </div>
      </div>

      {/* ── Delete confirmation overlay ──────────────────────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            key="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-[380px] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <Trash2 size={18} className="text-[var(--danger)]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--ink)] mb-1.5">
                Remove {confirmDelete.type === "offer" ? "Offer" : "Template"}
              </h3>
              <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed mb-6">
                Remove{" "}
                <span className="font-medium text-[var(--ink)]">{confirmDelete.label}</span>{" "}
                from this project? This won't delete the {confirmDelete.type} permanently.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 rounded-full text-[13px] font-medium text-[var(--ink-secondary)] border border-[#CAC9CF] hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-full text-[13px] font-semibold text-white bg-[var(--danger)] hover:bg-[#B01E2B] transition cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Generate Assets confirmation modal ──────────────────────────── */}
      {(() => {
        const bgCount   = visibleBackgrounds.length > 0 ? visibleBackgrounds.length : 1;
        const genTotal  = visibleOffers.length * visibleTemplates.length * bgCount;
        const genBreakdown =
          visibleBackgrounds.length > 0
            ? `${visibleBackgrounds.length} background${visibleBackgrounds.length > 1 ? "s" : ""} × ${visibleOffers.length} offer${visibleOffers.length > 1 ? "s" : ""} × ${visibleTemplates.length} template${visibleTemplates.length > 1 ? "s" : ""}`
            : `${visibleOffers.length} offer${visibleOffers.length > 1 ? "s" : ""} × ${visibleTemplates.length} template${visibleTemplates.length > 1 ? "s" : ""}`;

        const handleGenerate = () => {
          const bgsToUse = visibleBackgrounds.length > 0 ? visibleBackgrounds.map(b => b.id) : [null as null];
          const assets: GeneratedAsset[] = [];
          bgsToUse.forEach(bgId => {
            visibleTemplates.forEach(template => {
              visibleOffers.forEach(offer => {
                assets.push({ key: `${bgId ?? "none"}-${template.id}-${offer.id}`, offer, template, bgId });
              });
            });
          });
          setGeneratedAssets(assets);
          setExpandedSections(prev => ({ ...prev, assets: true }));
          setShowGenerateModal(false);
          emitSnackbar(`${genTotal} asset${genTotal > 1 ? "s" : ""} created`);
          window.dispatchEvent(new CustomEvent("project-status-change", {
            detail: { projectId: project.id, status: "Assets Created" },
          }));
        };

        return (
          <AnimatePresence>
            {showGenerateModal && (
              <motion.div
                key="generate-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[500] flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
                onClick={() => setShowGenerateModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "linear-gradient(135deg, #EDE9FF 0%, #D8D2FF 100%)" }}>
                    <Wand2 size={18} className="text-[var(--brand-accent)]" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[var(--ink)] mb-1.5">
                    Generate Assets
                  </h3>
                  <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed mb-2">
                    You're about to generate{" "}
                    <span className="font-semibold text-[var(--ink)]">{genTotal} asset{genTotal > 1 ? "s" : ""}</span>
                    {" "}({genBreakdown}).
                  </p>
                  <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed mb-6">
                    Total: <span className="font-semibold text-[var(--ink)]">{genTotal}</span>
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowGenerateModal(false)}
                      className="px-4 py-2 rounded-full text-[13px] font-medium text-[var(--ink-secondary)] border border-[#CAC9CF] hover:bg-gray-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="px-4 py-2 rounded-full text-[13px] font-semibold text-white transition cursor-pointer"
                      style={{ background: "linear-gradient(99deg, var(--brand-accent) 0%, var(--brand-mid) 100%)" }}
                    >
                      Generate {genTotal} Asset{genTotal > 1 ? "s" : ""}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        );
      })()}

      {/* Edit Project dialog */}
      <CreateProjectDialog
        open={showEditProject}
        onOpenChange={setShowEditProject}
        mode="edit"
        initialData={{
          name: project.name,
          account: project.dealerName,
          ownerId: PROJECT_OWNERS.find(o => o.name === project.assignee?.name)?.id ?? "jorge-verlindo",
          startDate: project.dateRange ? (() => { try { return new Date(project.dateRange.split(" - ")[0]); } catch { return undefined; } })() : undefined,
          endDate: project.dateRange ? (() => { try { return new Date(project.dateRange.split(" - ")[1]); } catch { return undefined; } })() : undefined,
          platforms: (project as any).platforms ?? [],
          tags: (project as any).tags ?? [],
        }}
        brandOptions={brandKits.map(k => ({ id: k.id, name: k.name }))}
        existingNames={[]}
        onSave={(data) => {
          const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const ownerObj = PROJECT_OWNERS.find(o => o.id === data.ownerId);
          onUpdateProject?.(project.id, {
            name:       data.name,
            dealerName: data.account,
            dateRange:  `${fmt(data.startDate)} - ${fmt(data.endDate)}`,
            platforms:  data.platforms,
            tags:       data.tags,
            assignee:   { name: ownerObj?.name ?? project.assignee?.name ?? "", avatar: project.assignee?.avatar ?? "" },
          });
          setShowEditProject(false);
          emitSnackbar("Project updated");
        }}
      />
    </div>
    </div>
    </div>
  );
}

// ─── New Project Form ─────────────────────────────────────────────────────────

type NewProjectErrors = Partial<Record<"name" | "startDate" | "endDate", string>>;

const fieldTriggerCls =
  "h-10 w-full flex items-center gap-2 border border-[#CAC9CF] rounded-[4px] px-3 text-[13px] bg-[#F9FAFA] text-left cursor-pointer select-none transition-all hover:border-[#B0B0B5] focus:outline-none data-[state=open]:border-[var(--brand-accent)] data-[state=open]:ring-1 data-[state=open]:ring-[var(--brand-accent)]";

const menuContentCls =
  "z-[200] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.12)] p-1 min-w-[var(--radix-dropdown-menu-trigger-width)] animate-in fade-in-0 zoom-in-95";

const menuItemCls =
  "flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[var(--ink)] cursor-pointer hover:bg-gray-50 outline-none focus:bg-gray-50 data-[highlighted]:bg-gray-50";

// ── Tag chip input ────────────────────────────────────────────────────────────

function TagChipInput({
  tags, onTagsChange,
}: { tags: string[]; onTagsChange: (t: string[]) => void }) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const val = raw.trim().replace(/,$/, "").trim();
    if (val && !tags.includes(val)) onTagsChange([...tags, val]);
    setInputVal("");
  };

  const removeTag = (i: number) => onTagsChange(tags.filter((_, idx) => idx !== i));

  return (
    <div
      className="min-h-10 w-full flex flex-wrap items-center gap-1 border border-[#CAC9CF] rounded-[4px] px-2 py-1.5 bg-[#F9FAFA] cursor-text hover:border-[#B0B0B5] focus-within:border-[var(--brand-accent)] focus-within:ring-1 focus-within:ring-[var(--brand-accent)] transition-all"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-[#F3F4F6] text-[var(--ink-secondary)] text-[11px] font-['Roboto'] tracking-[0.4px] px-2 py-0.5 rounded-[8px] select-none"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(i); }}
            className="text-[var(--ink-tertiary)] hover:text-[var(--ink-secondary)] leading-none -mr-0.5 transition-colors cursor-pointer"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputVal}
        placeholder={tags.length === 0 ? "Tags" : ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) { addTag(v); return; }
          setInputVal(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); addTag(inputVal); }
          if (e.key === "Backspace" && !inputVal && tags.length) removeTag(tags.length - 1);
        }}
        className="flex-1 min-w-[60px] bg-transparent text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-secondary)]/60 outline-none leading-tight"
      />
    </div>
  );
}

function NewProjectForm({
  onClose, onSave,
}: { onClose: () => void; onSave: (p: LocalProject) => void }) {
  const [name, setName]           = useState("");
  const [account, setAccount]     = useState("");
  const [brand, setBrand]         = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate]     = useState<Date | undefined>(undefined);
  const [tags, setTags]           = useState<string[]>([]);
  const [status, setStatus]       = useState<ProjectStatus>("In Progress");
  const [errors, setErrors]       = useState<NewProjectErrors>({});

  const validate = (): NewProjectErrors => {
    const e: NewProjectErrors = {};
    if (!name.trim())  e.name      = "Project name is required";
    if (!startDate)    e.startDate = "Start date is required";
    if (!endDate)      e.endDate   = "End date is required";
    if (startDate && endDate && endDate < startDate)
                       e.endDate   = "End date must be after start date";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const id   = `project-${Date.now()}`;
    const kit  = brandKits.find((k) => k.name === brand);
    const abbr = (account || "GEN").slice(0, 6).toUpperCase().replace(/\s/g, "");
    const mon  = new Date().toLocaleDateString("en-US", { month: "short", year: "2-digit" }).replace(" ", "");
    const code = `WF${String(Math.floor(Math.random() * 90000 + 10000))}_${abbr}_${name.replace(/\s+/g, "")}_${mon}`;
    const fmt  = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    onSave({
      id,
      dealerName:  account || "My Account",
      name,
      code,
      status,
      dateRange:   `${fmt(startDate!)} - ${fmt(endDate!)}`,
      assignee:    { name: CURRENT_USER.name, avatar: "" },
      oem:         kit?.oem ?? account ?? "General",
      templateIds: [],
      offerIds:    [],
      tags,
      createdAt:   fmt(new Date()),
    } as LocalProject);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      <div className="px-6 pt-5 pb-6 flex flex-col gap-4">

        {/* Row 1: Name · Account · Brand · Owner */}
        <div className="flex gap-3 items-start">
          <div className="flex flex-col gap-1 flex-[3]">
            <input
              type="text"
              autoFocus
              placeholder="Project Name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })); }}
              className={`h-10 w-full rounded-[4px] border px-3 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-secondary)]/60 bg-[#F9FAFA] outline-none transition-all
                ${errors.name
                  ? "border-[var(--danger)] ring-1 ring-[var(--danger)]"
                  : "border-[#CAC9CF] hover:border-[#B0B0B5] focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)]"}`}
            />
            {errors.name && <p className="text-[11px] text-[var(--danger)] leading-tight">{errors.name}</p>}
          </div>

          <div className="flex-[2] min-w-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={fieldTriggerCls}>
                  <span className={account ? "text-[var(--ink)]" : "text-[var(--ink-secondary)]/60"}>{account || "Account"}</span>
                  <ChevronDown size={13} className="ml-auto text-[#111014]/40 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={menuContentCls} sideOffset={4}>
                {ACCOUNTS.map((a) => (
                  <DropdownMenuItem key={a} className={menuItemCls} onClick={() => setAccount(a)}>
                    <span className="flex-1">{a}</span>
                    {account === a && <Check size={13} className="text-[var(--brand-accent)]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-[2] min-w-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={fieldTriggerCls}>
                  <span className={brand ? "text-[var(--ink)]" : "text-[var(--ink-secondary)]/60"}>{brand || "Brand"}</span>
                  <ChevronDown size={13} className="ml-auto text-[#111014]/40 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={menuContentCls} sideOffset={4}>
                {brandKits.map((k) => (
                  <DropdownMenuItem key={k.id} className={menuItemCls} onClick={() => setBrand(k.name)}>
                    <span className="flex-1">{k.name}</span>
                    {brand === k.name && <Check size={13} className="text-[var(--brand-accent)]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-[2] min-w-0" aria-hidden="true" tabIndex={-1}>
            <div className="relative h-10 flex items-center border border-[#CAC9CF] rounded-[4px] bg-[#F9FAFA] px-3 gap-2">
              <span className="absolute -top-[9px] left-2 px-1 bg-white text-[10px] text-[var(--ink-secondary)] leading-none select-none">Owner</span>
              <div className="w-[18px] h-[18px] rounded-full bg-[#CAC9CF] flex items-center justify-center shrink-0">
                <span className="text-[8px] text-white font-bold leading-none">{CURRENT_USER.initials}</span>
              </div>
              <span className="text-[13px] text-[var(--ink)] truncate flex-1">{CURRENT_USER.email}</span>
              <ChevronDown size={13} className="text-[#111014]/40 shrink-0" />
            </div>
          </div>
        </div>

        {/* Row 2: Status · Start · End · Tags */}
        <div className="flex gap-3 items-start">
          <div className="h-10 flex items-center shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="cursor-pointer outline-none">
                  <ProjectStatusChip status={status} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="z-[200] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.12)] p-1 min-w-[200px] animate-in fade-in-0 zoom-in-95"
                sideOffset={6}
                align="start"
              >
                {PROJECT_STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer outline-none focus:bg-gray-50 data-[highlighted]:bg-gray-50"
                    onClick={() => setStatus(s)}
                  >
                    <ProjectStatusChip status={s} />
                    {status === s && <Check size={13} className="ml-auto text-[var(--brand-accent)]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <SingleDatePicker
              value={startDate}
              onChange={(d) => { setStartDate(d); if (errors.startDate) setErrors(p => ({ ...p, startDate: undefined })); }}
              placeholder="Start Date"
              direction="down"
              error={!!errors.startDate}
            />
            {errors.startDate && <p className="text-[11px] text-[var(--danger)] leading-tight">{errors.startDate}</p>}
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <SingleDatePicker
              value={endDate}
              onChange={(d) => { setEndDate(d); if (errors.endDate) setErrors(p => ({ ...p, endDate: undefined })); }}
              placeholder="End Date"
              direction="down"
              error={!!errors.endDate}
            />
            {errors.endDate && <p className="text-[11px] text-[var(--danger)] leading-tight">{errors.endDate}</p>}
          </div>

          <div className="flex-1 min-w-0">
            <TagChipInput tags={tags} onTagsChange={setTags} />
          </div>
        </div>

        {/* Row 3: Metadata */}
        <p className="text-[11px] text-[var(--ink-tertiary)] leading-relaxed">
          <span className="font-medium text-[var(--ink-secondary)]">Last Updated:</span> just now
          <span className="mx-3 text-[#E0E0E0]">|</span>
          <span className="font-medium text-[var(--ink-secondary)]">Created:</span> just now
          <span className="mx-3 text-[#E0E0E0]">|</span>
          <span className="font-medium text-[var(--ink-secondary)]">Creator:</span> {CURRENT_USER.name}
        </p>

        {/* Row 4: Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium text-[var(--ink-secondary)] border border-[#CAC9CF] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] transition-colors cursor-pointer"
          >
            <Check size={14} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tasks sidebar (kept for future use) ──────────────────────────────────────

const PAGE_NAV: {
  id: ProjectPage;
  label: string;
  Icon: React.ComponentType<IconProps>;
}[] = [
  { id: "offers",            label: "Offers",    Icon: LCOffers },
  { id: "templates",         label: "Templates", Icon: LCTemplates },
  { id: "logos-backgrounds", label: "Styles",    Icon: LCStyles },
  { id: "preview",           label: "Preview",   Icon: LCPreview },
];
