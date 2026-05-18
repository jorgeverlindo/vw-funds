"use client";

import { useRef, useEffect } from "react";
import { Upload, RotateCcw } from "lucide-react";
import { brandKits } from "@projects/lib/mock-data";

interface LogoPickerProps {
  make: string;
  slotType: string;
  /** The currently selected logo's ID (for highlighting). Pass undefined to fall back to the kit default. */
  selectedLogoId?: string;
  onSelectLogo: (logoId: string) => void;
  onUpload: (dataUrl: string) => void;
  onRevert: () => void;
  onClose: () => void;
}

export function LogoPicker({
  make,
  slotType,
  selectedLogoId,
  onSelectLogo,
  onUpload,
  onRevert,
  onClose,
}: LogoPickerProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kit = brandKits.find((k) => k.oem === make);
  const logos = kit?.logos.filter((l) => l.id.startsWith(slotType + "-")) ?? [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) { onUpload(dataUrl); onClose(); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const slotLabel =
    slotType.split("-")[0].charAt(0).toUpperCase() +
    slotType.split("-")[0].slice(1) +
    " Logo";

  const defaultId = slotType + "-positive";
  const effectiveSelectedId = selectedLogoId ?? defaultId;

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-xl p-3 flex flex-col gap-2 min-w-[180px]"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
        {slotLabel}
      </span>

      {logos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {logos.map((logo) => {
            const isSelected = logo.id === effectiveSelectedId;
            return (
              <button
                key={logo.id}
                onClick={() => { onSelectLogo(logo.id); onClose(); }}
                className={`w-12 h-12 rounded bg-gray-50 border-2 flex items-center justify-center transition ${
                  isSelected
                    ? "border-[var(--brand-accent)]"
                    : "border-gray-200 hover:border-[var(--brand-accent)/40]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.image} alt={logo.id} className="w-9 h-9 object-contain" />
              </button>
            );
          })}
        </div>
      )}

      <div className="h-px bg-gray-100" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 text-xs text-gray-700 hover:text-[var(--brand-accent)] hover:bg-gray-50 rounded-lg px-2 py-1.5 transition w-full text-left"
      >
        <Upload size={13} className="shrink-0" />
        Upload
      </button>

      <button
        onClick={() => { onRevert(); onClose(); }}
        className="flex items-center gap-2 text-xs text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition w-full text-left"
      >
        <RotateCcw size={13} className="shrink-0" />
        Revert All Overrides
      </button>
    </div>
  );
}
