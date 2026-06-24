import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Paperclip, ArrowUp, Settings2 } from "lucide-react";
import { generateImage } from "@/lib/replicateClient";

// ─── Constellation arc animation — copied from NewGlobalAIConfigContent.tsx ──
interface ArcState { outer: boolean; middle: boolean; inner: boolean; }

function ConstellationArcMark({ arcs, size = 20 }: { arcs: ArcState; size?: number }) {
  return (
    <svg width={size * 0.56} height={size} viewBox="0 0 18 33" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M2.22422 16.0471C2.22422 7.57204 8.61025 0.631495 16.6988 0.0413128C16.332 0.0118036 15.9594 0 15.5867 0C6.97648 0 0 7.18252 0 16.0471C0 24.9116 6.97648 32.0941 15.5867 32.0941C15.9594 32.0941 16.332 32.0823 16.6988 32.0528C8.61025 31.4626 2.22422 24.5221 2.22422 16.0471Z"
        fill="#473bab" style={{ opacity: arcs.outer ? 0.92 : 0.22, transition: 'opacity 120ms ease' }} />
      <path d="M6.12227 16.047C6.12227 9.69073 10.9089 4.48533 16.9796 4.04269C16.7045 4.02498 16.4236 4.01318 16.1427 4.01318C9.6879 4.01318 4.4541 9.40154 4.4541 16.047C4.4541 22.6924 9.6879 28.0808 16.1427 28.0808C16.4236 28.0808 16.7045 28.069 16.9796 28.0513C10.9146 27.6086 6.12227 22.4032 6.12227 16.047Z"
        fill="#6356e1" style={{ opacity: arcs.middle ? 0.82 : 0.18, transition: 'opacity 120ms ease' }} />
      <path d="M17.2605 8.04407C17.0771 8.03227 16.8937 8.02637 16.7045 8.02637C12.3994 8.02637 8.9082 11.6206 8.9082 16.0529C8.9082 20.4851 12.3994 24.0793 16.7045 24.0793C16.8937 24.0793 17.0771 24.0734 17.2605 24.0557C13.2134 23.7606 10.0261 20.2904 10.0261 16.0529C10.0261 11.8154 13.2191 8.34507 17.2605 8.04998V8.04407Z"
        fill="#8c86fc" style={{ opacity: arcs.inner ? 0.72 : 0.12, transition: 'opacity 120ms ease' }} />
    </svg>
  );
}

function useConstellationAnim(running: boolean): ArcState {
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
      const q = (delay: number, fn: () => void) => {
        t += delay;
        const id = setTimeout(() => { if (!cancelled) fn(); }, t);
        timers.push(id);
      };
      all(false);
      q(80,  () => setO(true));
      q(240, () => setM(true));
      q(240, () => setI(true));
      q(600, () => {});
      q(180, () => all(false));
      q(380, () => {});
      q(140, () => all(true));
      q(280, () => all(false));
      q(200, () => all(true));
      q(280, () => all(false));
      q(320, () => {});
      q(80,  () => { all(false); setO(true); });
      q(220, () => { setO(false); setM(true); });
      q(220, () => { setM(false); setI(true); });
      q(220, () => { setI(false); });
      q(140, () => all(true));
      q(420, () => all(false));
      q(380, () => loop());
      timerRefs.current = timers;
    }
    loop();
    return () => { cancelled = true; clearAll(); setArcs({ outer: false, middle: false, inner: false }); };
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  return arcs;
}

// ─── Stage labels + subtasks (bg-generation context) ─────────────────────────
type BgStage = 'idle' | 's1' | 's2' | 's3' | 's4';

const STAGE_DURATIONS = [1600, 1900, 1900, 1600]; // ms per stage

const STAGE_LABELS: Record<BgStage, string> = {
  idle: '',
  s1:   'Analyzing reference…',
  s2:   'Generating scene…',
  s3:   'Compositing details…',
  s4:   'Enhancing output…',
};

const STAGE_SUBTASKS: Record<string, [string, string, string]> = {
  s1: ['Loading background reference', 'Reading scene metadata',   'Parsing prompt context'],
  s2: ['Framing scene composition',    'Matching lighting angle',  'Drafting scene layout'],
  s3: ['Blending background layers',   'Compositing shadows',      'Merging background plates'],
  s4: ['Sharpening edge detail',       'Color grading output',     'Final render pass'],
};

// ─── Overlay component (same pattern as GlobalAIRenderOverlayFake) ───────────
function BgGenerateOverlay({ isRunning }: { isRunning: boolean }) {
  const [stage,   setStage]   = useState<BgStage>('idle');
  const [subStep, setSubStep] = useState(0);
  const arcs = useConstellationAnim(isRunning && stage !== 'idle');

  useEffect(() => {
    if (!isRunning) { setStage('idle'); setSubStep(0); return; }
    let cancelled = false;
    const stageKeys: BgStage[] = ['s1', 's2', 's3', 's4'];
    let elapsed = 0;

    stageKeys.forEach((key, si) => {
      const dur = STAGE_DURATIONS[si];
      const start = elapsed;
      elapsed += dur;

      setTimeout(() => {
        if (cancelled) return;
        setStage(key);
        setSubStep(0);
        setTimeout(() => { if (!cancelled) setSubStep(1); }, dur * 0.35);
        setTimeout(() => { if (!cancelled) setSubStep(2); }, dur * 0.7);
      }, start);
    });

    return () => { cancelled = true; };
  }, [isRunning]);

  if (!isRunning || stage === 'idle') return null;

  const stageLabel = STAGE_LABELS[stage];
  const tasks = STAGE_SUBTASKS[stage] ?? STAGE_SUBTASKS['s1'];

  const getTaskState = (i: number): 'done' | 'active' | 'pending' => {
    if (i < subStep) return 'done';
    if (i === subStep) return 'active';
    return 'pending';
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#f4f5f6] z-20 rounded-[12px]">
      <div className="flex flex-col gap-[4px] p-[10px]" style={{ width: 240 }}>
        {/* Header: arc + stage label */}
        <div className="flex items-center gap-[4px]" style={{ minHeight: 36 }}>
          <div className="shrink-0 flex items-center justify-center" style={{ width: 36, height: 36 }}>
            <ConstellationArcMark arcs={arcs} size={36} />
          </div>
          <span className="flex-1 min-w-0 font-['Roboto',sans-serif] font-normal text-[14px] leading-[1.5] tracking-[0.15px] text-[#1f1d25] whitespace-nowrap overflow-hidden text-ellipsis">
            {stageLabel}
          </span>
        </div>
        {/* Sub-tasks */}
        <div className="flex flex-col gap-[3px] pl-[21px]" style={{ width: 166 }}>
          {tasks.map((task, i) => {
            const state = getTaskState(i);
            return (
              <div key={task} className="flex gap-[4px] items-center">
                {state === 'done' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                    <circle cx="8" cy="8" r="7" stroke="#686576" strokeWidth="1.2" fill="none" />
                    <path d="M4.5 8l2.5 2.5 4-4.5" stroke="#686576" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : state === 'active' ? (
                  <div className="shrink-0 w-[8px] h-[8px] rounded-full bg-[#6356e1] ml-[4px] mr-[4px]" />
                ) : (
                  <div className="shrink-0 w-[16px] h-[16px]" />
                )}
                <span className="font-['Roboto',sans-serif] font-normal text-[10px] leading-[10px] text-[#686576] whitespace-nowrap">
                  {task}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
interface BackgroundLike {
  id: string;
  name: string;
  thumbnail: string;
  images: Record<string, string>;
}

interface Props {
  background: BackgroundLike;
  accountName?: string;
  onSave: (newBg: { id: string; name: string; thumbnail: string; images: Record<string, string> }) => void;
  onClose: () => void;
}

export function EditBackgroundModal({ background, accountName = "Honda of Anywhere", onSave, onClose }: Props) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const previewUrl = generatedUrl ?? background.thumbnail;
  const canSave = generatedUrl !== null;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [prompt]);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 80);
  }, []);

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || generating) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setGenerating(true);
    setError(null);

    try {
      const url = await generateImage({
        prompt: trimmed,
        modelId: "flux-kontext-pro",
        inputImage: background.thumbnail,
        signal: ctrl.signal,
      });
      if (!ctrl.signal.aborted) {
        setGeneratedUrl(url);
        setPrompt("");
      }
    } catch (e: unknown) {
      if (!ctrl.signal.aborted) {
        setError(e instanceof Error ? e.message : "Generation failed");
      }
    } finally {
      if (!ctrl.signal.aborted) setGenerating(false);
    }
  }, [prompt, generating, background.thumbnail]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Wrap a temporary Replicate URL in a Cloudinary Fetch URL so it's permanently cached.
  // Cloudinary caches the image on first request — the Replicate URL expiring after that is fine.
  const toPersistentUrl = (url: string) => {
    if (!url.startsWith('https://replicate.delivery') && !url.includes('replicate.com')) return url;
    return `https://res.cloudinary.com/dvq75cqna/image/fetch/f_auto,q_auto/${encodeURIComponent(url)}`;
  };

  const handleSave = () => {
    if (!canSave || !generatedUrl) return;
    const persistentUrl = toPersistentUrl(generatedUrl);
    const newImages: Record<string, string> = {};
    for (const key of Object.keys(background.images)) {
      newImages[key] = persistentUrl;
    }
    onSave({
      id: `${background.id}-custom-${Date.now()}`,
      name: background.name,
      thumbnail: persistentUrl,
      images: newImages,
    });
  };

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative flex flex-col bg-white rounded-[12px] shadow-2xl overflow-hidden"
        style={{ width: "min(1000px, calc(100vw - 48px))", maxHeight: "calc(100vh - 64px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <span className="text-[16px] font-semibold text-[var(--ink)] tracking-[0.15px]">Edit Background</span>
          <button
            onClick={handleClose}
            className="w-[30px] h-[30px] flex items-center justify-center rounded-full hover:bg-[#F3F2F7] transition-colors"
          >
            <X size={18} strokeWidth={1.8} className="text-[var(--ink-secondary)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 px-5 pb-5 overflow-y-auto flex-1">

          {/* Preview + overlay */}
          <div
            className="relative w-full rounded-[12px] overflow-hidden bg-[#f4f5f6]"
            style={{ aspectRatio: "16/9" }}
          >
            {!generating && (
              <img
                src={previewUrl}
                alt={background.name}
                className="w-full h-full object-cover"
              />
            )}
            <BgGenerateOverlay isRunning={generating} />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[12px] text-red-500 px-1">{error}</p>
          )}

          {/* AI Agent Input — two-row layout matching Figma */}
          <div
            className="flex flex-col gap-2 rounded-[16px] border px-3 pt-3 pb-3"
            style={{
              background: "#f0f2f4",
              borderColor: "rgba(0,0,0,0.12)",
              boxShadow: "0px 2px 1px rgba(0,0,0,0.08)",
            }}
          >
            {/* Top: prompt textarea */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe how to customize this background…"
              rows={1}
              disabled={generating}
              className="w-full bg-transparent text-[12px] text-[var(--ink)] placeholder:text-[var(--ink-secondary)]/60 resize-none outline-none leading-[1.43] tracking-[0.17px] disabled:opacity-50 pb-1"
              style={{ minHeight: 40, maxHeight: 120, overflowY: "auto" }}
            />

            {/* Bottom: icons row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* Paperclip — stroke IconButton */}
                <button
                  className="w-[30px] h-[30px] flex items-center justify-center rounded-full border transition-colors hover:bg-black/5"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                >
                  <Paperclip size={16} strokeWidth={1.6} className="text-[var(--ink-secondary)]" />
                </button>

                {/* Dealer chip — outlined button */}
                <button
                  className="flex items-center gap-1.5 h-[28px] px-[10px] rounded-full border text-[13px] font-medium tracking-[0.46px] transition-colors hover:bg-black/5"
                  style={{ borderColor: "rgba(0,0,0,0.12)", color: "rgba(17,16,20,0.56)" }}
                >
                  <Settings2 size={14} strokeWidth={1.6} />
                  {accountName}
                </button>
              </div>

              {/* Send button — primary contained */}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all"
                style={{
                  background: prompt.trim() && !generating ? "#473bab" : "rgba(0,0,0,0.26)",
                }}
              >
                <ArrowUp size={16} strokeWidth={2.5} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 shrink-0">
          <button
            onClick={handleClose}
            className="h-9 px-4 rounded-full text-[14px] font-medium tracking-[0.4px] transition-colors hover:bg-[#473bab]/8"
            style={{ color: "#473bab" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="h-9 px-4 rounded-full text-[14px] font-medium tracking-[0.4px] text-white transition-all"
            style={{
              background: canSave ? "#473bab" : "rgba(0,0,0,0.26)",
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
