"use client";

import { X, RotateCcw } from "lucide-react";
import { useProjectStore } from "@projects/lib/project-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateType = "single" | "multi" | "keyMessage";

interface VariableDef {
  /** Matches the exact identifier used inside {} in AdTemplate.tsx */
  key: string;
  /** Which template types render this variable */
  usedIn: TemplateType[];
  /** Short human description of the rendered output */
  hint: string;
  /** Ordered list of mapping options to show in the select */
  options: string[];
}

// ─── Offer field options ─────────────────────────────────────────────────────

interface FieldOption {
  value: string;
  label: string;
  group: "offer" | "special";
  example?: string;
}

const FIELD_OPTIONS: FieldOption[] = [
  // Offer fields — raw column names from the data model
  { value: "year",               label: "year",               group: "offer",   example: "2026" },
  { value: "make",               label: "make",               group: "offer",   example: "Honda" },
  { value: "model",              label: "model",              group: "offer",   example: "CR-V" },
  { value: "trim",               label: "trim",               group: "offer",   example: "TrailSport AWD" },
  { value: "offerType",          label: "offerType",          group: "offer",   example: "Lease" },
  { value: "monthlyPayment",     label: "monthlyPayment",     group: "offer",   example: "529" },
  { value: "term",               label: "term",               group: "offer",   example: "36" },
  { value: "totalDueAtSigning",  label: "totalDueAtSigning",  group: "offer",   example: "4999" },
  { value: "stock",              label: "stock",              group: "offer",   example: "16" },
  { value: "pvi",                label: "pvi",                group: "offer",   example: "92" },
  { value: "aging",              label: "aging",              group: "offer",   example: "27" },
  { value: "sales",              label: "sales",              group: "offer",   example: "10" },
  { value: "inventory",         label: "inventory",           group: "offer",   example: "16" },
  // Special tokens
  { value: "__fixed__",          label: "Fixed text (hardcoded)",        group: "special" },
  { value: "__project__",        label: "Dealer name (from project)",    group: "special" },
  { value: "__manual__",         label: "Manual input (Styles step)",    group: "special" },
  { value: "__auto__",           label: "Auto-generated from slots",     group: "special" },
];

// ─── Variable definitions ─────────────────────────────────────────────────────
// Only variables that appear literally inside {} in AdTemplate.tsx.

const VARIABLES: VariableDef[] = [
  {
    key: "year",
    usedIn: ["single", "multi"],
    hint: "Model year — e.g. 2026",
    options: ["year", "make", "model", "trim", "offerType", "monthlyPayment", "term", "totalDueAtSigning", "stock", "pvi", "aging", "sales", "inventory"],
  },
  {
    key: "make",
    usedIn: ["single", "multi"],
    hint: "Manufacturer — e.g. Honda",
    options: ["make", "model", "trim", "year", "offerType", "monthlyPayment", "term", "totalDueAtSigning", "stock", "pvi", "aging", "sales", "inventory"],
  },
  {
    key: "model",
    usedIn: ["single", "multi"],
    hint: "Vehicle model — e.g. CR-V",
    options: ["model", "trim", "make", "year", "offerType", "monthlyPayment", "term", "totalDueAtSigning", "stock", "pvi", "aging", "sales", "inventory"],
  },
  {
    key: "trim",
    usedIn: ["single", "multi"],
    hint: "Trim level — e.g. TrailSport AWD",
    options: ["trim", "model", "make", "year", "offerType", "monthlyPayment", "term", "totalDueAtSigning", "stock", "pvi", "aging", "sales", "inventory"],
  },
  {
    key: "monthlyPayment",
    usedIn: ["single", "multi"],
    hint: 'Monthly payment rendered as "$529/mo."',
    options: ["monthlyPayment", "totalDueAtSigning", "term", "stock", "pvi", "aging", "sales", "inventory", "__fixed__"],
  },
  {
    key: "term",
    usedIn: ["single"],
    hint: 'Term rendered as "for 36 months."',
    options: ["term", "monthlyPayment", "totalDueAtSigning", "stock", "pvi", "aging", "sales", "inventory", "__fixed__"],
  },
  {
    key: "totalDueAtSigning",
    usedIn: ["single"],
    hint: 'Due at signing — rendered as "$4,999 due at signing"',
    options: ["totalDueAtSigning", "monthlyPayment", "term", "stock", "pvi", "aging", "sales", "inventory", "__fixed__"],
  },
  {
    key: "cta",
    usedIn: ["single", "multi", "keyMessage"],
    hint: 'CTA button label — currently "Learn More"',
    options: ["__fixed__", "offerType", "make", "model", "trim"],
  },
  {
    key: "dealerName",
    usedIn: ["single"],
    hint: "Dealer name — shown on 600×1067 tall banner only",
    options: ["__project__", "__fixed__", "make"],
  },
  {
    key: "keyMessage",
    usedIn: ["keyMessage"],
    hint: "Large headline — manually typed in the Styles step",
    options: ["__manual__", "__fixed__", "offerType", "make", "model"],
  },
  {
    key: "modelLine",
    usedIn: ["keyMessage"],
    hint: 'Auto-built from slot models — e.g. "CR-V, HR-V and Odyssey"',
    options: ["__auto__", "model", "make", "__fixed__"],
  },
];

// ─── Defaults (must match project-store.tsx) ──────────────────────────────────

const DEFAULTS: Record<string, string> = {
  year:              "year",
  make:              "make",
  model:             "model",
  trim:              "trim",
  monthlyPayment:    "monthlyPayment",
  term:              "term",
  totalDueAtSigning: "totalDueAtSigning",
  cta:               "__fixed__",
  dealerName:        "__project__",
  keyMessage:        "__manual__",
  modelLine:         "__auto__",
};

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<TemplateType, string> = {
  single:     "Single",
  multi:      "3-Up",
  keyMessage: "Key Msg",
};

const TYPE_COLORS: Record<TemplateType, string> = {
  single:     "bg-[var(--brand-accent)/8] text-[var(--brand-accent)]",
  multi:      "bg-amber-50 text-amber-700",
  keyMessage: "bg-emerald-50 text-emerald-700",
};

// ─── Main component ───────────────────────────────────────────────────────────

export function VariableMappingPane({
  activeTypes,
  onClose,
}: {
  activeTypes: TemplateType[];
  onClose: () => void;
}) {
  const { variableMappings, setVariableMapping, resetVariableMappings } = useProjectStore();

  const visibleVars = VARIABLES.filter((v) =>
    v.usedIn.some((t) => activeTypes.includes(t))
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-900">Map Variables</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Connect template <code className="bg-gray-100 px-1 rounded text-[10px]">{"{variables}"}</code> to offer fields
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition ml-2 shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {/* Variable list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {visibleVars.map((variable) => {
          const current = variableMappings[variable.key] ?? DEFAULTS[variable.key];
          const isDefault = current === DEFAULTS[variable.key];

          // Build ordered select options for this variable
          const offerOpts = variable.options
            .map((v) => FIELD_OPTIONS.find((o) => o.value === v))
            .filter((o): o is FieldOption => !!o && o.group === "offer");
          const specialOpts = variable.options
            .map((v) => FIELD_OPTIONS.find((o) => o.value === v))
            .filter((o): o is FieldOption => !!o && o.group === "special");

          return (
            <div key={variable.key} className="space-y-1">
              {/* Label row: variable name + type badges + reset */}
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] text-gray-600 flex-1">{variable.key}</span>
                {variable.usedIn
                  .filter((t) => activeTypes.includes(t))
                  .map((t) => (
                    <span
                      key={t}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${TYPE_COLORS[t]}`}
                    >
                      {TYPE_LABELS[t]}
                    </span>
                  ))}
                {!isDefault && (
                  <button
                    onClick={() => setVariableMapping(variable.key, DEFAULTS[variable.key])}
                    className="text-gray-300 hover:text-gray-500 transition shrink-0"
                    title="Reset to default"
                  >
                    <RotateCcw size={11} />
                  </button>
                )}
              </div>

              {/* Select */}
              <select
                value={current}
                onChange={(e) => setVariableMapping(variable.key, e.target.value)}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[var(--brand-accent)] focus:border-[var(--brand-accent)/40]"
              >
                {offerOpts.length > 0 && (
                  <optgroup label="Offer Fields">
                    {offerOpts.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}{opt.example ? `  —  e.g. "${opt.example}"` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
                {specialOpts.length > 0 && (
                  <optgroup label="Special">
                    {specialOpts.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 shrink-0 flex items-center justify-between">
        <button
          onClick={resetVariableMappings}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
        >
          <RotateCcw size={11} />
          Reset all defaults
        </button>
        <span className="text-[11px] text-gray-300">{visibleVars.length} variables</span>
      </div>
    </div>
  );
}
