"use client";

import { useState } from "react";
import {
  X, Search, ChevronRight, ChevronDown,
  Layers, LayoutGrid, Box, Puzzle, Image, Tag, FileText,
  PanelLeft, MoreHorizontal, Folder,
} from "lucide-react";
import { TemplateCard } from "@projects/templates/TemplateCard";
import { BackgroundCollectionCard } from "@projects/logos-backgrounds/BackgroundCollectionCard";
import { OfferCard } from "@projects/offers/OfferCard";
import { AssetCard } from "@projects/ui/AssetCard";
import { CardViewVertical } from "@projects/ui/CardViewVertical";
import { TemplateWireframe } from "@projects/templates/TemplateWireframe";
import { StatusChip } from "@/app/components/StatusChip";
import { templates, backgroundCollections, offerLibrary } from "@projects/lib/mock-data";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface ComponentEntry {
  name: string;
  description: string;
  path: string;
  tags: string[];
  isBase?: boolean;
}

interface ComponentCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  components: ComponentEntry[];
}

const CATEGORIES: ComponentCategory[] = [
  {
    id: "ui",
    label: "UI — Design System",
    icon: <Layers size={13} />,
    components: [
      {
        name: "AssetCard",
        description:
          "Standard card shell. Square thumbnail with gray background, checkbox and menu overlay, text area below. Accepts preview and footer as render slots.",
        path: "components/ui/AssetCard.tsx",
        tags: ["base", "card", "slot"],
        isBase: true,
      },
      {
        name: "CardViewVertical",
        description:
          "Standard responsive grid. Cards inside resize fluidly between 240–300 px via auto-fill.",
        path: "components/ui/CardViewVertical.tsx",
        tags: ["grid", "layout", "responsive"],
        isBase: true,
      },
      {
        name: "Button",
        description: "Base button — shadcn/ui.",
        path: "components/ui/button.tsx",
        tags: ["shadcn", "primitive"],
      },
      {
        name: "Badge",
        description: "Base badge/chip — shadcn/ui.",
        path: "components/ui/badge.tsx",
        tags: ["shadcn", "primitive"],
      },
      {
        name: "Checkbox",
        description: "Base checkbox — shadcn/ui.",
        path: "components/ui/checkbox.tsx",
        tags: ["shadcn", "primitive"],
      },
      {
        name: "Dialog",
        description: "Base dialog — shadcn/ui.",
        path: "components/ui/dialog.tsx",
        tags: ["shadcn", "primitive"],
      },
      {
        name: "ScrollArea",
        description: "Custom scroll area — shadcn/ui.",
        path: "components/ui/scroll-area.tsx",
        tags: ["shadcn", "primitive"],
      },
      {
        name: "Select",
        description: "Base select — shadcn/ui.",
        path: "components/ui/select.tsx",
        tags: ["shadcn", "primitive"],
      },
      {
        name: "Separator",
        description: "Horizontal or vertical visual separator — shadcn/ui.",
        path: "components/ui/separator.tsx",
        tags: ["shadcn", "primitive"],
      },
    ],
  },
  {
    id: "cards",
    label: "Cards",
    icon: <Box size={13} />,
    components: [
      {
        name: "TemplateCard",
        description:
          "Template card. Displays a scaled wireframe in the thumbnail, name, format, dimensions and brand chip. Hover reveals the 'Edit zones' button.",
        path: "components/templates/TemplateCard.tsx",
        tags: ["card", "template", "AssetCard"],
      },
      {
        name: "BackgroundCollectionCard",
        description:
          "Background/lifestyle card. Image in object-contain, name, dimensions, tag chips and folder path.",
        path: "components/logos-backgrounds/BackgroundCollectionCard.tsx",
        tags: ["card", "background", "AssetCard"],
      },
      {
        name: "OfferCard",
        description: "Offer card with vehicle metrics, offer type and financial details.",
        path: "components/offers/OfferCard.tsx",
        tags: ["card", "offer"],
      },
    ],
  },
  {
    id: "layout",
    label: "Layout",
    icon: <LayoutGrid size={13} />,
    components: [
      {
        name: "ProjectContentLayout",
        description:
          "Main layout for project pages. Manages the sidebar, main content area and right panel.",
        path: "components/layout/ProjectContentLayout.tsx",
        tags: ["layout", "shell"],
      },
      {
        name: "TopBar",
        description:
          "Global top navigation bar: logo, search, action icons and user avatar.",
        path: "components/layout/TopBar.tsx",
        tags: ["layout", "nav"],
      },
      {
        name: "GlobalNav",
        description: "Global side navigation.",
        path: "components/layout/GlobalNav.tsx",
        tags: ["layout", "nav"],
      },
      {
        name: "PageMeta",
        description: "Breadcrumbs and metadata for the current page.",
        path: "components/layout/PageMeta.tsx",
        tags: ["layout", "breadcrumb"],
      },
      {
        name: "SidebarToggleButton",
        description: "Button to open/close the sidebar.",
        path: "components/layout/SidebarToggleButton.tsx",
        tags: ["layout", "sidebar"],
      },
      {
        name: "StatusChip",
        description: "Status chip — e.g. Draft, Active, Published.",
        path: "components/layout/StatusChip.tsx",
        tags: ["layout", "chip", "status"],
      },
      {
        name: "TasksSidebar",
        description: "Project tasks sidebar.",
        path: "components/layout/TasksSidebar.tsx",
        tags: ["layout", "sidebar"],
      },
    ],
  },
  {
    id: "templates",
    label: "Templates",
    icon: <FileText size={13} />,
    components: [
      {
        name: "TemplateWireframe",
        description:
          "Renders a template's visual wireframe at a given scale. Accepts templateId and scale.",
        path: "components/templates/TemplateWireframe.tsx",
        tags: ["template", "wireframe", "preview"],
      },
      {
        name: "TemplateZoneEditor",
        description:
          "Template zone editor. Opens as a modal overlay on the page.",
        path: "components/templates/TemplateZoneEditor.tsx",
        tags: ["template", "editor", "modal"],
      },
      {
        name: "VariableMappingPane",
        description:
          "Right-panel variable mapper between single, multi and keyMessage templates.",
        path: "components/templates/VariableMappingPane.tsx",
        tags: ["template", "panel", "variables"],
      },
      {
        name: "AdTemplate",
        description: "Rendered ad preview component using real offer data.",
        path: "components/templates/AdTemplate.tsx",
        tags: ["template", "ad", "preview"],
      },
    ],
  },
  {
    id: "logos-backgrounds",
    label: "Logos & Backgrounds",
    icon: <img size={13}  />,
    components: [
      {
        name: "SelectBackgroundDialog",
        description:
          "Fullscreen dialog (50 px margin) for selecting backgrounds and lifestyle images. Two panels: folder tree on the left, card grid on the right.",
        path: "components/logos-backgrounds/SelectBackgroundDialog.tsx",
        tags: ["dialog", "background", "fullscreen"],
      },
      {
        name: "LifestyleTaggingDialog",
        description: "Dialog for tagging lifestyle images.",
        path: "components/logos-backgrounds/LifestyleTaggingDialog.tsx",
        tags: ["dialog", "lifestyle", "tagging"],
      },
      {
        name: "LogoPicker",
        description: "Logo selector for the project.",
        path: "components/logos-backgrounds/LogoPicker.tsx",
        tags: ["picker", "logo"],
      },
      {
        name: "CombinationAccordion",
        description: "Accordion for offer + background combinations.",
        path: "components/logos-backgrounds/CombinationAccordion.tsx",
        tags: ["accordion", "combination"],
      },
      {
        name: "OfferAccordion",
        description: "Offer accordion within the logos & backgrounds screen.",
        path: "components/logos-backgrounds/OfferAccordion.tsx",
        tags: ["accordion", "offer"],
      },
      {
        name: "SubsectionActions",
        description: "Subsection action bar (add, bulk actions, etc.).",
        path: "components/logos-backgrounds/SubsectionActions.tsx",
        tags: ["actions", "toolbar"],
      },
    ],
  },
  {
    id: "offers",
    label: "Offers",
    icon: <Tag size={13} />,
    components: [
      {
        name: "BrowseOffersDialog",
        description: "Dialog for browsing and selecting offers from the portal.",
        path: "components/offers/BrowseOffersDialog.tsx",
        tags: ["dialog", "offer", "browse"],
      },
    ],
  },
];

const ALL_CATEGORY: ComponentCategory = {
  id: "all",
  label: "All Components",
  icon: <Puzzle size={13} />,
  components: CATEGORIES.flatMap((c) => c.components),
};

// ─── Preview registry ─────────────────────────────────────────────────────────

type PreviewDef = React.ReactNode;

function buildPreviews(): Record<string, PreviewDef> {
  return {
    // ── AssetCard ──
    AssetCard: (
      <div style={{ zoom: 0.52 }}>
        <div style={{ width: 240 }}>
          <AssetCard
            selected={false}
            preview={
              <div className="w-full h-full flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="8" fill="#d1d5db" />
                  <rect x="14" y="14" width="20" height="20" rx="4" fill="#9ca3af" />
                </svg>
              </div>
            }
            footer={
              <div>
                <p className="text-[13px] font-medium text-gray-900">Asset Name</p>
                <p className="text-[11px] text-gray-500 mt-0.5">PNG · 1920×1080</p>
                <div className="mt-2">
                  <span className="text-[11px] text-gray-600 bg-[#f0f2f4] px-2 py-[3px] rounded">Honda</span>
                </div>
              </div>
            }
          />
        </div>
      </div>
    ),

    // ── CardViewVertical ──
    CardViewVertical: (
      <div className="w-full px-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="aspect-square rounded-lg bg-gray-300 ring-1 ring-inset ring-black/[0.07]" />
              <div className="h-2 bg-gray-300 rounded w-4/5" />
              <div className="h-1.5 bg-gray-200 rounded w-3/5" />
              <div className="h-4 bg-gray-200 rounded-sm w-2/5 mt-0.5" />
            </div>
          ))}
        </div>
      </div>
    ),

    // ── Button ──
    Button: (
      <div className="flex flex-col items-center gap-2.5">
        <button className="bg-[var(--brand-accent)] text-white text-sm font-semibold px-5 py-2 rounded-lg">Primary</button>
        <button className="bg-white text-gray-700 text-sm font-medium px-5 py-2 rounded-lg border border-gray-200">Secondary</button>
        <button className="text-[var(--brand-accent)] text-sm font-medium px-5 py-2 rounded-lg hover:bg-[var(--brand-accent)/8]">Ghost</button>
      </div>
    ),

    // ── Badge ──
    Badge: (
      <div className="flex flex-wrap gap-2 px-6 justify-center">
        <span className="text-[11px] text-gray-600 bg-[#f0f2f4] px-2.5 py-1 rounded">Default</span>
        <span className="text-[11px] text-[var(--brand-accent)] bg-[var(--brand-accent)/8] border border-[var(--brand-accent)]/20 px-2.5 py-1 rounded">Active</span>
        <span className="text-[11px] text-green-700 bg-green-50 px-2.5 py-1 rounded">Published</span>
        <span className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded">Regional</span>
        <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded">Draft</span>
      </div>
    ),

    // ── Checkbox ──
    Checkbox: (
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded border-2 bg-[var(--brand-accent)] border-[var(--brand-accent)] flex items-center justify-center">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[11px] text-gray-500">Checked</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded border-2 bg-white border-gray-300" />
          <span className="text-[11px] text-gray-500">Unchecked</span>
        </div>
      </div>
    ),

    // ── Dialog ──
    Dialog: (
      <div className="w-[220px] rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-800">Dialog Title</span>
          <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
            <X size={9} className="text-gray-400" />
          </div>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="h-2 bg-gray-100 rounded w-full" />
          <div className="h-2 bg-gray-100 rounded w-4/5" />
          <div className="h-2 bg-gray-100 rounded w-full" />
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100">
          <div className="h-7 w-16 rounded-full bg-gray-100" />
          <div className="h-7 w-16 rounded-full bg-[var(--brand-accent)]" />
        </div>
      </div>
    ),

    // ── ScrollArea ──
    ScrollArea: (
      <div className="w-[180px] h-[120px] border border-gray-200 rounded-xl overflow-hidden flex bg-white">
        <div className="flex-1 overflow-hidden p-2.5 space-y-2">
          {[90, 70, 80, 65, 75, 85].map((w, i) => (
            <div key={i} className="h-2 bg-gray-100 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="w-2 bg-gray-50 border-l border-gray-100 flex flex-col py-1.5">
          <div className="mx-auto w-1.5 h-8 rounded-full bg-gray-300" />
        </div>
      </div>
    ),

    // ── Select ──
    Select: (
      <div className="flex flex-col gap-2 items-center">
        <div className="w-[200px] rounded-lg border border-gray-200 bg-white flex items-center justify-between px-3 py-2 shadow-sm">
          <span className="text-sm text-gray-500">Select option...</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3.5 5.25l3.5 3.5 3.5-3.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="w-[200px] rounded-lg border border-[var(--brand-accent)/40] bg-white shadow-lg overflow-hidden">
          {["Option A", "Option B", "Option C"].map((opt, i) => (
            <div key={i} className={`px-3 py-1.5 text-sm cursor-pointer ${i === 1 ? "bg-[var(--brand-accent)/8] text-[var(--brand-accent)] font-medium" : "text-gray-700 hover:bg-gray-50"}`}>{opt}</div>
          ))}
        </div>
      </div>
    ),

    // ── Separator ──
    Separator: (
      <div className="w-[200px] flex flex-col gap-4">
        <div className="h-px bg-gray-200 w-full" />
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="h-px bg-gray-200 w-full" />
      </div>
    ),

    // ── TemplateCard ──
    TemplateCard: (
      <div style={{ zoom: 0.52 }}>
        <div style={{ width: 260 }}>
          <TemplateCard template={templates[0]} />
        </div>
      </div>
    ),

    // ── BackgroundCollectionCard ──
    BackgroundCollectionCard: (
      <div style={{ zoom: 0.52 }}>
        <div style={{ width: 260 }}>
          <BackgroundCollectionCard
            collection={backgroundCollections[0]}
            selected={false}
            onSelect={() => {}}
          />
        </div>
      </div>
    ),

    // ── OfferCard ──
    OfferCard: (
      <div style={{ zoom: 0.63 }}>
        <OfferCard offer={offerLibrary[0]} />
      </div>
    ),

    // ── ProjectContentLayout ──
    ProjectContentLayout: (
      <div className="w-[280px] h-[150px] flex rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="w-[42px] bg-gray-900 flex flex-col items-center py-3 gap-2.5 shrink-0">
          <div className="w-5 h-5 rounded bg-[var(--brand-accent)/8]0" />
          <div className="flex-1" />
          {[1, 2, 3, 4].map((i) => <div key={i} className="w-5 h-5 rounded-lg bg-gray-700" />)}
          <div className="flex-1" />
          <div className="w-5 h-5 rounded-full bg-gray-600" />
        </div>
        <div className="w-[90px] bg-gray-50 border-r border-gray-200 shrink-0 p-2 space-y-1.5">
          {[85, 60, 75, 90, 55].map((w, i) => <div key={i} className="h-2 bg-gray-200 rounded" style={{ width: `${w}%` }} />)}
        </div>
        <div className="flex-1 bg-white p-2 space-y-2">
          <div className="h-2.5 bg-gray-100 rounded w-full" />
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square bg-gray-100 rounded-lg" />)}
          </div>
        </div>
      </div>
    ),

    // ── TopBar ──
    TopBar: (
      <div className="w-[300px] h-11 bg-white border border-gray-200 rounded-xl flex items-center px-3 gap-3 shadow-sm">
        <div className="w-20 h-4 bg-[var(--brand-accent)]/25 rounded-sm" />
        <div className="flex-1 h-6 bg-gray-100 rounded-full flex items-center px-2.5 gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <div className="flex-1 h-1.5 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="w-6 h-6 rounded-lg bg-gray-100" />)}
          <div className="w-6 h-6 rounded-full bg-[var(--brand-accent)]/25 ml-0.5" />
        </div>
      </div>
    ),

    // ── GlobalNav ──
    GlobalNav: (
      <div className="w-[48px] h-[160px] bg-gray-900 rounded-xl flex flex-col items-center py-3 gap-2.5 shadow-sm">
        <div className="w-6 h-6 rounded-lg bg-[var(--brand-accent)/8]0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-sm bg-white/80" />
        </div>
        <div className="flex-1" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`w-6 h-6 rounded-lg ${i === 2 ? "bg-[var(--brand-accent)]" : "bg-gray-700"}`} />
        ))}
        <div className="flex-1" />
        <div className="w-6 h-6 rounded-full bg-gray-500" />
      </div>
    ),

    // ── PageMeta ──
    PageMeta: (
      <div className="flex items-center gap-1.5 px-3">
        <span className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">Projects</span>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="text-sm text-gray-500">Honda Demo</span>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="text-sm font-semibold text-gray-800">Templates</span>
      </div>
    ),

    // ── SidebarToggleButton ──
    SidebarToggleButton: (
      <button className="w-9 h-9 flex items-center justify-center text-gray-400 bg-gray-50 border border-gray-200 rounded-lg">
        <PanelLeft size={16} />
      </button>
    ),

    // ── StatusChip ──
    StatusChip: (
      <div className="flex flex-col gap-2.5 items-center">
        <StatusChip status="Draft" />
        <StatusChip status="In Review" />
        <StatusChip status="Published" />
      </div>
    ),

    // ── TasksSidebar ──
    TasksSidebar: (
      <div className="w-[200px] bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
        <div className="text-[11px] font-semibold text-gray-700 mb-2.5">Project Tasks</div>
        {[
          { label: "Select Offers", done: true },
          { label: "Add Templates", done: true },
          { label: "Map Variables", done: false },
          { label: "Choose Styles", done: false },
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${t.done ? "bg-[var(--brand-accent)] border-[var(--brand-accent)]" : "border-gray-300"}`}>
              {t.done && (
                <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={`text-[11px] ${t.done ? "line-through text-gray-400" : "text-gray-700"}`}>{t.label}</span>
          </div>
        ))}
      </div>
    ),

    // ── TemplateWireframe ──
    TemplateWireframe: (
      <div className="flex items-center justify-center">
        <TemplateWireframe templateId={templates[0].id} scale={0.38} showText />
      </div>
    ),

    // ── TemplateZoneEditor ──
    TemplateZoneEditor: (
      <div className="w-[240px] h-[155px] bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="bg-gray-800 px-3 py-2 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-white font-semibold">Zone Editor — CR-V</span>
          <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center">
            <X size={8} className="text-gray-300" />
          </div>
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 bg-gray-50 flex items-center justify-center p-2">
            <div className="w-[90px] h-[90px] border-2 border-dashed border-green-400 rounded relative">
              <div className="absolute top-1 left-1 right-1 h-[32px] bg-blue-100 border border-dashed border-blue-400 rounded text-[7px] text-blue-500 flex items-center justify-center">Product</div>
              <div className="absolute bottom-1 left-1 right-1 h-[14px] bg-purple-100 border border-dashed border-purple-400 rounded text-[7px] text-purple-500 flex items-center justify-center">Logo</div>
            </div>
          </div>
          <div className="w-[72px] bg-white border-l border-gray-100 p-2 space-y-1.5">
            {["Background", "Product", "Logo", "Text"].map((z, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-sm shrink-0 ${["bg-green-400", "bg-blue-400", "bg-purple-400", "bg-gray-300"][i]}`} />
                <span className="text-[9px] text-gray-600 truncate">{z}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    // ── VariableMappingPane ──
    VariableMappingPane: (
      <div className="w-[220px] bg-white border border-gray-200 rounded-xl p-3 shadow-sm space-y-2">
        <div className="text-[11px] font-semibold text-gray-800 mb-1">Map Variables</div>
        {["Headline", "Subheadline", "Price", "CTA", "Disclaimer"].map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 w-[70px] truncate shrink-0">{v}</span>
            <div className="flex-1 h-px border-t border-dashed border-gray-300" />
            <div className="h-5 w-[60px] bg-[var(--brand-accent)/8] rounded border border-[var(--brand-accent)]/20 text-[9px] text-[var(--brand-accent)] flex items-center px-1.5 shrink-0">
              {`{var_${i + 1}}`}
            </div>
          </div>
        ))}
      </div>
    ),

    // ── AdTemplate ──
    AdTemplate: (
      <div className="w-[150px] h-[150px] rounded-xl overflow-hidden relative shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-[var(--brand-accent)]" />
        <div className="absolute inset-x-3 top-3 h-[70px] border border-dashed border-green-400/60 rounded text-[8px] text-green-400 flex items-center justify-center">Background</div>
        <div className="absolute bottom-3 left-3 right-3 space-y-1">
          <div className="h-1.5 bg-white/70 rounded w-4/5" />
          <div className="h-1.5 bg-white/50 rounded w-3/5" />
          <div className="h-5 bg-[var(--brand-accent)/8]0 rounded-full text-[8px] text-white flex items-center justify-center mt-1">Lease from $529/mo</div>
        </div>
      </div>
    ),

    // ── SelectBackgroundDialog ──
    SelectBackgroundDialog: (
      <div className="w-[260px] h-[160px] bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 shrink-0">
          <span className="text-[11px] font-semibold text-gray-800">Select Background</span>
          <X size={12} className="text-gray-400" />
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="w-[80px] border-r border-gray-100 p-2 space-y-1 shrink-0">
            {["Recents", "Collections", "Brand Kits"].map((l, i) => (
              <div key={i} className={`text-[9px] rounded px-1.5 py-1 truncate ${i === 0 ? "bg-[var(--brand-accent)/8] text-[var(--brand-accent)] font-medium" : "text-gray-500"}`}>{l}</div>
            ))}
          </div>
          <div className="flex-1 p-2">
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`aspect-square rounded-md ${i === 2 ? "ring-2 ring-[var(--brand-accent)]" : "bg-gray-100"}`}
                  style={i === 2 ? { background: "#c7d2fe" } : undefined} />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),

    // ── LifestyleTaggingDialog ──
    LifestyleTaggingDialog: (
      <div className="w-[230px] h-[145px] bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-gray-800">Lifestyle Tagging</span>
        </div>
        <div className="flex flex-1 min-h-0 gap-0">
          <div className="flex-1 bg-gray-100 m-2 rounded-lg" />
          <div className="w-[80px] p-2 space-y-1 shrink-0">
            <div className="text-[9px] text-gray-500 mb-1.5">Tags</div>
            {["CR-V", "Lifestyle", "Outdoor"].map((t) => (
              <div key={t} className="h-5 bg-[var(--brand-accent)/8] border border-[var(--brand-accent)]/20 rounded text-[9px] text-[var(--brand-accent)] flex items-center px-1.5">{t}</div>
            ))}
          </div>
        </div>
      </div>
    ),

    // ── LogoPicker ──
    LogoPicker: (
      <div className="w-[200px] bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
        <div className="text-[10px] font-semibold text-gray-700 mb-2">Choose Logo</div>
        <div className="grid grid-cols-3 gap-2">
          {[true, false, false, false, false, false].map((sel, i) => (
            <div key={i} className={`aspect-square rounded-lg flex items-center justify-center ${sel ? "border-2 border-[var(--brand-accent)] bg-[var(--brand-accent)/8]" : "border border-gray-100 bg-gray-50"}`}>
              <div className="w-6 h-6 rounded bg-gray-300" />
            </div>
          ))}
        </div>
      </div>
    ),

    // ── CombinationAccordion ──
    CombinationAccordion: (
      <div className="w-[240px] space-y-1.5">
        {[
          { label: "CR-V TrailSport AWD", open: true },
          { label: "HR-V Sport 2WD", open: false },
        ].map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
              <ChevronRight size={12} className={`text-gray-400 transition-transform ${item.open ? "rotate-90" : ""}`} />
              <span className="text-[11px] font-medium text-gray-700 flex-1 truncate">{item.label}</span>
              <div className="text-[10px] text-gray-400">3</div>
            </div>
            {item.open && (
              <div className="px-3 py-2 grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="aspect-square bg-gray-100 rounded-lg" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    ),

    // ── OfferAccordion ──
    OfferAccordion: (
      <div className="w-[240px] space-y-1.5">
        {["2026 CR-V TrailSport", "2026 Odyssey EX-L"].map((label, i) => (
          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
              <ChevronRight size={12} className={`text-gray-400 ${i === 0 ? "rotate-90" : ""}`} />
              <span className="text-[11px] font-medium text-gray-700 flex-1 truncate">{label}</span>
              <span className="text-[10px] bg-[var(--brand-accent)/8] text-[var(--brand-accent)] px-1.5 py-0.5 rounded">Lease</span>
            </div>
            {i === 0 && (
              <div className="px-3 py-2 text-[10px] text-gray-500 space-y-1">
                <div className="flex justify-between"><span>Monthly</span><span className="font-semibold text-gray-800">$529/mo</span></div>
                <div className="flex justify-between"><span>Term</span><span className="font-semibold text-gray-800">36 mo</span></div>
              </div>
            )}
          </div>
        ))}
      </div>
    ),

    // ── SubsectionActions ──
    SubsectionActions: (
      <div className="flex items-center gap-2 w-[260px] px-3 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm">
        <button className="flex items-center gap-1 text-[11px] font-semibold text-white bg-[var(--brand-accent)] px-3 py-1.5 rounded-lg">
          <span className="text-base leading-none">+</span> Add
        </button>
        <button className="text-[11px] text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-lg">From Portal</button>
        <div className="flex-1" />
        <span className="text-[11px] text-gray-400">3 items</span>
        <button className="text-gray-400">
          <MoreHorizontal size={14} />
        </button>
      </div>
    ),

    // ── BrowseOffersDialog ──
    BrowseOffersDialog: (
      <div className="w-[260px] h-[160px] bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-semibold text-gray-800">Browse Offers</span>
          <X size={12} className="text-gray-400" />
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="w-[70px] border-r border-gray-100 p-2 space-y-0.5 shrink-0">
            {["All", "Lease", "Finance", "Cash"].map((l, i) => (
              <div key={l} className={`text-[9px] px-1.5 py-1 rounded cursor-pointer ${i === 0 ? "bg-[var(--brand-accent)/8] text-[var(--brand-accent)] font-medium" : "text-gray-500"}`}>{l}</div>
            ))}
          </div>
          <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
            {[
              { name: "CR-V TrailSport", price: "$529/mo" },
              { name: "HR-V Sport", price: "$699/mo" },
              { name: "Odyssey EX-L", price: "$999/mo" },
            ].map((o, i) => (
              <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-gray-50">
                <div className="w-7 h-7 rounded-md bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-0.5 min-w-0">
                  <div className="text-[9px] font-medium text-gray-700 truncate">{o.name}</div>
                  <div className="text-[9px] text-[var(--brand-accent)]">{o.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  };
}

const PREVIEW_REGISTRY = buildPreviews();

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface ComponentLibraryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ComponentLibraryDialog({ open, onClose }: ComponentLibraryDialogProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["components"]));
  const [query, setQuery] = useState("");

  if (!open) return null;

  const activeCategory =
    activeCategoryId === "all"
      ? ALL_CATEGORY
      : CATEGORIES.find((c) => c.id === activeCategoryId) ?? ALL_CATEGORY;

  const filtered = activeCategory.components.filter((comp) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      comp.name.toLowerCase().includes(q) ||
      comp.description.toLowerCase().includes(q) ||
      comp.path.toLowerCase().includes(q) ||
      comp.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  function toggleGroup(id: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-[50px] py-[50px]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Component Library</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {ALL_CATEGORY.components.length} components · consistent design across all implementations
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        {/* ── Two-panel body ── */}
        <div className="flex flex-1 min-h-0 border-t border-gray-100">

          {/* ── Left: Category tree ── */}
          <div className="w-[280px] border-r border-gray-100 flex flex-col shrink-0">

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">Categories</span>
            </div>

            <div className="px-3 pb-3">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Find component"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
              <CategoryItem
                icon={<Puzzle size={13} />}
                label="All Components"
                count={ALL_CATEGORY.components.length}
                active={activeCategoryId === "all"}
                onClick={() => setActiveCategoryId("all")}
              />

              <div className="my-1 border-t border-gray-100" />

              <CategoryGroup
                label="Constellation Design System"
                expanded={expandedGroups.has("components")}
                onToggle={() => toggleGroup("components")}
              >
                {CATEGORIES.map((cat) => (
                  <CategoryItem
                    key={cat.id}
                    icon={cat.icon}
                    label={cat.label}
                    count={cat.components.length}
                    active={activeCategoryId === cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    indent
                  />
                ))}
              </CategoryGroup>
            </div>
          </div>

          {/* ── Right: Component grid ── */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 px-5 pt-3 pb-1 shrink-0">
              <span className="text-xs text-gray-400">Library</span>
              <ChevronRight size={11} className="text-gray-300" />
              <span className="text-xs text-gray-600 font-medium">{activeCategory.label}</span>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 flex items-center justify-center bg-[var(--brand-accent)] text-white text-[10px] font-semibold rounded-full">
                  {activeCategoryId === "all" ? "∗" : CATEGORIES.findIndex((c) => c.id === activeCategoryId) + 1}
                </span>
                <span className="text-sm font-semibold text-gray-900">{activeCategory.label}</span>
              </div>
              <span className="ml-auto text-xs text-gray-400">{filtered.length} / {activeCategory.components.length} Items</span>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <p className="text-sm font-medium">No components found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((comp) => (
                    <ComponentCard key={comp.path} comp={comp} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={onClose}
                className="text-sm font-medium text-gray-700 border border-gray-300 rounded-full px-5 py-2 hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ComponentCard ────────────────────────────────────────────────────────────

function ComponentCard({ comp }: { comp: ComponentEntry }) {
  const preview = PREVIEW_REGISTRY[comp.name];

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden hover:border-[var(--brand-accent)/20] hover:shadow-sm transition-all group">
      {/* Preview area */}
      <div className="h-[200px] bg-[#f0f2f4] flex items-center justify-center overflow-hidden relative">
        {preview ?? <DefaultPreview name={comp.name} />}
      </div>

      {/* Info */}
      <div className="p-4 bg-white">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[13px] font-semibold text-gray-900">{comp.name}</span>
          {comp.isBase && (
            <span className="text-[10px] font-semibold text-[var(--brand-accent)] bg-[var(--brand-accent)/8] border border-[var(--brand-accent)]/20 px-1.5 py-[2px] rounded leading-none">base</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {comp.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-gray-500 bg-[#f0f2f4] px-1.5 py-[2px] rounded leading-none">{tag}</span>
          ))}
        </div>
        <p className="text-[12px] text-gray-500 mt-2 leading-relaxed line-clamp-2">{comp.description}</p>
        <code className="text-[11px] text-gray-400 mt-2 block font-mono truncate">{comp.path}</code>
      </div>
    </div>
  );
}

function DefaultPreview({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-gray-400">
      <Box size={28} className="text-gray-300" />
      <span className="text-[11px] font-medium">{name}</span>
    </div>
  );
}

// ─── CategoryItem ─────────────────────────────────────────────────────────────

function CategoryItem({
  icon, label, count, active = false, indent = false, onClick,
}: {
  icon: React.ReactNode; label: string; count?: number;
  active?: boolean; indent?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
        active ? "bg-[var(--brand-accent)/8] text-[var(--brand-accent)] font-medium" : "text-gray-600 hover:bg-gray-50"
      } ${indent ? "pl-7" : ""}`}
    >
      <span className="shrink-0 text-[var(--brand-accent)]/60">{icon}</span>
      <span className="flex-1 truncate text-[11.5px]">{label}</span>
      {count !== undefined && <span className="text-[10px] text-gray-400 shrink-0">({count})</span>}
    </div>
  );
}

// ─── CategoryGroup ────────────────────────────────────────────────────────────

function CategoryGroup({
  label, expanded, onToggle, children,
}: {
  label: string; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <div
        onClick={onToggle}
        className="flex items-center gap-2 px-2 py-1.5 text-gray-600 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
      >
        {expanded
          ? <ChevronDown size={12} className="text-gray-400 shrink-0" />
          : <ChevronRight size={12} className="text-gray-400 shrink-0" />}
        <span className="text-[11.5px] font-medium text-gray-700 truncate flex-1">{label}</span>
      </div>
      {expanded && <div>{children}</div>}
    </div>
  );
}
