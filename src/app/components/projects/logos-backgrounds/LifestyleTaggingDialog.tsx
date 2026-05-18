import { useState, useEffect } from "react";

import { X, Sparkles, CheckCircle, AlertTriangle, ChevronDown } from "lucide-react";
import type { BackgroundCollection } from "./BackgroundCollectionCard";
import type { DetectedVehicle } from "@projects/lib/api-client";
import { identifyVehicleWithAnthropic } from "@projects/lib/api-client";
import { suggestVehicleTag } from "@projects/lib/lifestyle-data";
import { templateLibrary } from "@projects/lib/mock-data";

// ─── Template size options ─────────────────────────────────────────────────────

const TEMPLATE_OPTIONS = templateLibrary.map((t) => ({
  id: t.id,
  label: `${t.width}×${t.height}`,
  sublabel: t.format,
  width: t.width,
  height: t.height,
}));

function detectTemplateId(imgWidth: number, imgHeight: number): string | null {
  // Exact match first
  const exact = TEMPLATE_OPTIONS.find(
    (t) => t.width === imgWidth && t.height === imgHeight
  );
  if (exact) return exact.id;
  // Closest aspect ratio
  const ratio = imgWidth / imgHeight;
  let best: (typeof TEMPLATE_OPTIONS)[0] | null = null;
  let bestDiff = Infinity;
  for (const t of TEMPLATE_OPTIONS) {
    const diff = Math.abs(t.width / t.height - ratio);
    if (diff < bestDiff) { bestDiff = diff; best = t; }
  }
  return best?.id ?? null;
}

// ─── VehicleTagRow ─────────────────────────────────────────────────────────────

const KNOWN_TAGS = [
  { value: "CRV-Trailsport", label: "CR-V TrailSport" },
  { value: "CRV-LX",         label: "CR-V LX" },
  { value: "CRV",            label: "CR-V (generic)" },
  { value: "HRV",            label: "HR-V" },
  { value: "Civic",          label: "Civic" },
];

function VehicleTagRow({
  vehicle,
  tag,
  onTagChange,
}: {
  vehicle: DetectedVehicle;
  tag: string | null;
  onTagChange: (tag: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  const label = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(" ");

  const knownTag = KNOWN_TAGS.find((k) => k.value === tag);

  const confidenceColor =
    vehicle.confidence === "high"
      ? "text-green-600 bg-green-50"
      : vehicle.confidence === "medium"
      ? "text-amber-600 bg-amber-50"
      : "text-red-600 bg-red-50";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Vehicle info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
        <span className={`inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${confidenceColor}`}>
          {vehicle.confidence} confidence
        </span>
      </div>

      {/* Tag selector */}
      <div className="relative shrink-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
            tag
              ? "bg-violet-50 border-violet-300 text-violet-700"
              : "bg-amber-50 border-amber-300 text-amber-700"
          }`}
        >
          {tag ? (
            <>
              <CheckCircle size={12} />
              {knownTag?.label ?? tag}
            </>
          ) : (
            <>
              <AlertTriangle size={12} />
              No tag matched
            </>
          )}
          <ChevronDown size={11} />
        </button>

        {open && (
          <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 min-w-[180px]">
            <button
              onClick={() => { onTagChange(null); setOpen(false); }}
              className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 transition ${!tag ? "font-semibold text-amber-700 bg-amber-50" : "text-gray-500"}`}
            >
              None
            </button>
            <div className="border-t border-gray-100 my-1" />
            {KNOWN_TAGS.map((k) => (
              <button
                key={k.value}
                onClick={() => { onTagChange(k.value); setOpen(false); }}
                className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 transition ${tag === k.value ? "font-semibold text-violet-700 bg-violet-50" : "text-gray-700"}`}
              >
                {k.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LifestyleTaggingDialog ────────────────────────────────────────────────────

interface LifestyleTaggingDialogProps {
  file: File;
  imageUrl: string;
  onConfirm: (bg: BackgroundCollection) => void;
  onCancel: () => void;
}

type Stage = "detecting" | "review" | "error";

export function LifestyleTaggingDialog({
  file,
  imageUrl,
  onConfirm,
  onCancel,
}: LifestyleTaggingDialogProps) {
  const [stage, setStage] = useState<Stage>("detecting");
  const [vehicles, setVehicles] = useState<DetectedVehicle[]>([]);
  const [tags, setTags] = useState<(string | null)[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);

  // Detect image dimensions and auto-select template
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const dims = { w: img.naturalWidth, h: img.naturalHeight };
      setImgDims(dims);
      setTemplateId(detectTemplateId(dims.w, dims.h));
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Call the API
  useEffect(() => {
    async function identify() {
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          // Extract base64 and media type
          const [header, base64] = dataUrl.split(",");
          const mediaType = header.match(/data:([^;]+)/)?.[1] ?? "image/png";

          const detected = await identifyVehicleWithAnthropic(base64, mediaType);
          setVehicles(detected);
          setTags(detected.map((v: DetectedVehicle) => suggestVehicleTag(v.model, v.trim)));
          setStage("review");
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
        setStage("error");
      }
    }
    identify();
  }, [file]);

  function handleConfirm() {
    const activeTags = tags.filter(Boolean) as string[];
    const isMulti = activeTags.length > 1;
    const id = `lifestyle-upload-${Date.now()}`;
    const name = vehicles.map((v) => [v.model, v.trim].filter(Boolean).join(" ")).join(" + ") || file.name.replace(/\.[^.]+$/, "");

    const bg: BackgroundCollection = {
      id,
      name,
      type: "Lifestyle",
      isLifestyle: true,
      ...(isMulti ? { vehicleTags: activeTags } : { vehicleTag: activeTags[0] ?? undefined }),
      sizes: 1,
      folder: "Uploads",
      color: "#6b7a8d",
      thumbnail: imageUrl,
      images: templateId ? { [templateId]: imageUrl } : {},
    };

    onConfirm(bg);
  }

  const selectedTemplate = TEMPLATE_OPTIONS.find((t) => t.id === templateId);
  const canConfirm = tags.some(Boolean) && templateId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-[680px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-500" />
            <h2 className="text-base font-semibold text-gray-900">Identify Lifestyle Image</h2>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Image preview */}
          <div className="bg-gray-900 flex items-center justify-center" style={{ maxHeight: 260 }}>
            <div className="relative w-full" style={{ maxHeight: 260 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Lifestyle preview"
                className="w-full object-contain"
                style={{ maxHeight: 260 }}
              />
            </div>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* Detecting state */}
            {stage === "detecting" && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
                <p className="text-sm text-gray-500">Identifying vehicles with AI…</p>
              </div>
            )}

            {/* Error state */}
            {stage === "error" && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Identification failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Review state */}
            {stage === "review" && (
              <>
                {/* Vehicle list */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Detected vehicles · {vehicles.length}
                  </p>
                  {vehicles.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">No vehicles detected in this image.</p>
                  ) : (
                    <div>
                      {vehicles.map((v, i) => (
                        <VehicleTagRow
                          key={i}
                          vehicle={v}
                          tag={tags[i] ?? null}
                          onTagChange={(t) => setTags((prev) => prev.map((p, j) => j === i ? t : p))}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Template size */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Template size
                    {imgDims && (
                      <span className="ml-2 font-normal normal-case text-gray-400">
                        (image: {imgDims.w}×{imgDims.h})
                      </span>
                    )}
                  </p>
                  <div className="relative">
                    <button
                      onClick={() => setTemplateOpen((o) => !o)}
                      className={`w-full flex items-center gap-2 border rounded-lg px-3 py-2 text-sm text-left transition ${
                        templateId ? "border-gray-200 bg-white" : "border-amber-300 bg-amber-50"
                      }`}
                    >
                      {selectedTemplate ? (
                        <>
                          <span className="font-medium text-gray-900">{selectedTemplate.label}</span>
                          <span className="text-xs text-gray-400">{selectedTemplate.sublabel}</span>
                        </>
                      ) : (
                        <span className="text-amber-700 text-sm">Select template size…</span>
                      )}
                      <ChevronDown size={13} className="ml-auto text-gray-400 shrink-0" />
                    </button>
                    {templateOpen && (
                      <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 max-h-52 overflow-y-auto">
                        {TEMPLATE_OPTIONS.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => { setTemplateId(t.id); setTemplateOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition ${templateId === t.id ? "bg-[var(--brand-accent)/8]" : ""}`}
                          >
                            <span className={`text-sm font-medium ${templateId === t.id ? "text-[var(--brand-accent)]" : "text-gray-800"}`}>{t.label}</span>
                            <span className="text-xs text-gray-400">{t.sublabel}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="text-sm font-medium text-gray-600 border border-gray-300 rounded-lg px-5 py-2 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          {stage === "review" && (
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-violet-600 rounded-lg px-5 py-2 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Sparkles size={14} />
              Add as Lifestyle Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
