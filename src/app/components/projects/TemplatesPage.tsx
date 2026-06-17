
import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, MoreVertical, GitMerge } from "lucide-react";
import { TemplateCard } from "@projects/templates/TemplateCard";
import { SelectTemplateDialog } from "@projects/templates/SelectTemplateDialog";
import { CardViewVertical } from "@projects/ui/CardViewVertical";
import { VariableMappingPane } from "@projects/templates/VariableMappingPane";
import { useRightPanel } from "@projects/lib/right-panel-context";
import { getProjectTemplates, getProjectById, templateLibrary } from "@projects/lib/mock-data";
import type { Template } from "@projects/lib/mock-data";
import { useProjectStore } from "@projects/lib/project-store";

export function TemplatesPage({ projectId, onNavigateTo }: { projectId: string; onNavigateTo: (page: string) => void }) {
  const id = projectId;
  const project = getProjectById(id);
  const baseTemplates = getProjectTemplates(id);

  const { addedTemplateIds, addTemplates } = useProjectStore();
  const extraTemplates = useMemo(() => {
    const projectAddedIds = addedTemplateIds[id] ?? [];
    return projectAddedIds
      .map((tid) => templateLibrary.find((t) => t.id === tid))
      .filter((t): t is Template => !!t);
  }, [addedTemplateIds, id]);

  const templates = useMemo(
    () => [...baseTemplates, ...extraTemplates],
    [baseTemplates, extraTemplates]
  );
  const existingTemplateIds = useMemo(() => new Set(templates.map((t) => t.id)), [templates]);

  const [selected, setSelected] = useState<Set<string>>(new Set(templates.map((t) => t.id)));
  const [browseOpen, setBrowseOpen] = useState(false);
  const [mapVarsOpen, setMapVarsOpen] = useState(false);
  const { setRightPanel } = useRightPanel();

  function handleAddFromDialog(newTemplates: Template[]) {
    addTemplates(id, newTemplates.map((t) => t.id));
  }

  function handleSelect(templateId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(templateId) : next.delete(templateId);
      return next;
    });
  }

  // Determine which template types are present in this project
  const hasSingle     = templates.some((t) => t.products === 1);
  const hasMulti      = templates.some((t) => t.products > 1 && !t.name.toLowerCase().includes("keymessage") && !t.name.toLowerCase().includes("key_message") && !t.name.toLowerCase().includes("keymsg"));
  const hasKeyMessage = templates.some((t) => t.products > 1 && t.name.toLowerCase().includes("key"));
  const activeTypes = [
    ...(hasSingle     ? ["single"     as const] : []),
    ...(hasMulti      ? ["multi"      as const] : []),
    ...(hasKeyMessage ? ["keyMessage" as const] : []),
  ];

  // Register / unregister the right panel via context
  useEffect(() => {
    if (mapVarsOpen) {
      setRightPanel(
        <VariableMappingPane
          activeTypes={activeTypes}
          onClose={() => setMapVarsOpen(false)}
        />
      );
    } else {
      setRightPanel(null);
    }
    return () => setRightPanel(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapVarsOpen]);

  return (
    <>
      <SelectTemplateDialog
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        onAdd={handleAddFromDialog}
        existingTemplateIds={existingTemplateIds}
      />

    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Templates</h1>

        <button
          onClick={() => setBrowseOpen(true)}
          className="flex items-center gap-1 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition ml-1"
        >
          <Plus size={13} />
          Add
        </button>

        <button
          onClick={() => setMapVarsOpen((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition ml-0 ${
            mapVarsOpen
              ? "bg-[var(--brand-accent)] text-white border-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)]"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          <GitMerge size={13} />
          Map Variables
        </button>

        <button className="ml-1 text-gray-400 hover:text-gray-600">
          <MoreVertical size={16} />
        </button>

        {/* Search */}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Find below"
            className="pl-7 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)]"
          />
        </div>

        {/* Item count */}
        <span className="text-xs text-gray-400 shrink-0">{templates.length} Items</span>
      </div>

      {/* Grid */}
      <div className="flex-1 px-6 py-5 overflow-y-auto">
        <CardViewVertical>
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selected.has(template.id)}
              onSelect={handleSelect}
            />
          ))}
        </CardViewVertical>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-100">
        <button
          onClick={() => onNavigateTo('offers')}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] border border-[var(--brand-accent)/30] rounded-full px-4 py-1.5 hover:bg-[var(--brand-accent)/5] transition"
        >
          <ChevronLeft size={14} />
          Offers
        </button>
        <button
          onClick={() => onNavigateTo('logos-backgrounds')}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--brand-accent)] border border-[var(--brand-accent)/30] rounded-full px-4 py-1.5 hover:bg-[var(--brand-accent)/5] transition"
        >
          Styles
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
    </>
  );
}
