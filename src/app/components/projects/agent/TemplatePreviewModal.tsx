"use client";

import { motion } from "motion/react";
import { X, FileText } from "lucide-react";

// ─── Template Preview Modal ────────────────────────────────────────────────────
export type TemplateInfo = { id: string; name: string; format: string; width: number; height: number; brand: string };

export function TemplatePreviewModal({ template, onClose }: { template: TemplateInfo | null; onClose: () => void }) {
  if (!template) return null;

  // Scale the template dimensions into a preview box (max 260×140)
  const maxW = 260; const maxH = 140;
  const scaleW = maxW / template.width;
  const scaleH = maxH / template.height;
  const scale = Math.min(scaleW, scaleH, 1);
  const pw = Math.round(template.width  * scale);
  const ph = Math.round(template.height * scale);

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
            <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{template.name}</p>
            <p style={{ fontSize: 10.5, color: "var(--ink-secondary)", marginTop: 1 }}>{template.brand} · {template.format}</p>
          </div>
          <button onClick={onClose}
            className="flex items-center justify-center w-[26px] h-[26px] rounded-full hover:bg-black/6 transition-colors cursor-pointer text-[var(--ink-tertiary)]">
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
            <span style={{ fontSize: 8.5, color: "rgba(71,59,171,0.55)", letterSpacing: "0.6px", textTransform: "uppercase" }}>
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
              <span style={{ fontSize: 11, color: "var(--ink-tertiary)", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 11, color: "var(--ink)" }}>{value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
