// ─── NewGlobalAIConfigContent ─────────────────────────────────────────────────
// Full-screen form for creating a new Global AI Config in Client Settings.
// Mirrors InventoryContent (editor view) — same toggle, same TabNavigation,
// same EmptyState illustration, same footer.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Info, X, BookOpen, Paperclip, SendHorizonal, ChevronLeft, ChevronRight, ChevronDown, Eye, Loader2, Pencil } from 'lucide-react';
import { generateImage, generateAllAngles, KODIAK_VEHICLE_GUARD, assetToDataUrl } from '../../../lib/replicateClient';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../ui/resizable';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { BreadcrumbBar } from '../BreadcrumbBar';
import { TabNavigation } from '../TabNavigation';
import { PromptLibraryModal } from '../inventory/PromptLibraryModal';
import { VinsAppliedTab } from './VinsAppliedTab';
import { ANGLES } from '../inventory/AngleBar';
import { cn } from '../../../lib/utils';
const emptyStateSvg = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071197/vw-funds/inventory/empty-state.svg';
const FavoriteIconSrc = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071200/vw-funds/inventory/icons/Favorite.svg';
const EditIconSrc = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071211/vw-funds/inventory/icons/edit.svg';
const PreviewIconSrc = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071217/vw-funds/inventory/icons/preview.svg';
const SettingsIconSrc = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071219/vw-funds/inventory/icons/settings.svg';
const GridIconSrc = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071213/vw-funds/inventory/icons/grid.svg';
const FullscreenIconSrc = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071202/vw-funds/inventory/icons/Full-screen.svg';
import type { AIConfigRecord, SavedFormState } from '../../../data/inventory/aiConfigs';
import type { VinFilters, VinRecord, AngleKey } from '../../../data/inventory/types';
import { filterVins } from '../../../data/inventory/vins';
import { BLUE_GEN_ANGLES, BLUE_SOURCE_ANGLES, BLUE_VEHICLE_GROUP } from '../../../data/inventory/blueVehicle';
import { KODIAK_SOURCE_ANGLES, KODIAK_VEHICLE_GROUP } from '../../../data/inventory/kodiakVehicle';

// ─── Asset icons ──────────────────────────────────────────────────────────────
const IconUpload = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M8.99999 2.8125V11.25M8.99999 2.8125L12.375 6.1875M8.99999 2.8125L5.625 6.1875M15.1875 9.5625V14.4375C15.1875 14.8517 14.8517 15.1875 14.4375 15.1875H3.5625C3.14829 15.1875 2.8125 14.8517 2.8125 14.4375V9.5625"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const IconUpdate = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M14.4464 15.1875V12.5625C14.4464 12.3554 14.2785 12.1875 14.0714 12.1875H11.4464M3.5625 2.8125V5.4375C3.5625 5.64461 3.73039 5.8125 3.9375 5.8125H6.5625M2.86037 8.22656C2.82878 8.47994 2.8125 8.73807 2.8125 9C2.8125 12.4173 5.58274 15.1875 9 15.1875C11.0074 15.1875 12.8333 14.2315 13.9741 12.75M15.1396 9.77344C15.1712 9.52006 15.1875 9.26193 15.1875 9C15.1875 5.58274 12.4173 2.8125 9 2.8125C6.99256 2.8125 5.16666 3.76847 4.02588 5.25"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const AI_MODELS = [
  { id: 'flux-kontext-max',    label: 'Flux Kontext Max'     },
  { id: 'flux-kontext-pro',    label: 'Flux Kontext Pro'     },
  { id: 'flux-one-depth',      label: 'Flux One Depth'       },
  { id: 'midjourney-v8',       label: 'Midjourney V8'        },
  { id: 'stable-diffusion-35', label: 'Stable Diffusion 3.5' },
  { id: 'dalle-3',             label: 'DALL·E 3'             },
  { id: 'ideogram-3',          label: 'Ideogram 3.0'         },
  { id: 'recraft-v4',          label: 'Recraft V4'           },
];

const EDITOR_TABS = [
  { id: 'parameters',   label: 'Parameters'   },
  { id: 'vins-applied', label: 'VINs Applied' },
];

// ─── Constellation 3-Arc Pulsing Mark ────────────────────────────────────────
// Copied from AgentPane.tsx — shared animation pattern for AI loading states.
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

// ─── GlobalAIRenderOverlay ────────────────────────────────────────────────────
// Fake-animation mode: Constellation pulsing mark centred in the preview area.
// Real-generation mode: dark overlay with progress bar (driven by Replicate API).
//   s1(1600) → s2(1900) → s3(1900) → s4(1600)  = 7000ms total
//   No "Ready/done" stage — overlay vanishes as soon as s4 finishes.
const GLOBAL_STAGE_DURATIONS = [1600, 1900, 1900, 1600];

type GlobalStage = 'idle' | 's1' | 's2' | 's3' | 's4';

const GLOBAL_STAGE_LABELS: Record<GlobalStage, string> = {
  idle: '',
  s1:   'Analyzing reference…',
  s2:   'Generating scene…',
  s3:   'Compositing vehicle…',
  s4:   'Enhancing details…',
};

function GlobalAIRenderOverlay({
  isRunning,
  onComplete,
  // Real-generation mode: when provided, drives the overlay from actual API progress
  realCompleted,
  realTotal,
  realLabel,
}: {
  isRunning: boolean;
  onComplete?: () => void;
  realCompleted?: number;
  realTotal?: number;
  realLabel?: string;
}) {
  const isRealMode = realTotal !== undefined;

  // ── Real-API mode ──────────────────────────────────────────────────────────
  if (isRealMode) {
    if (!isRunning) return null;
    const completed = realCompleted ?? 0;
    const total     = realTotal!;
    const progress  = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isDone    = completed >= total;

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] z-20 rounded-xl">
        <div className="mb-4">
          {isDone ? (
            <div className="w-12 h-12 rounded-full bg-[#473bab] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11L9 16L18 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-white/20" />
              <div
                className="absolute inset-0 rounded-full border-4 border-[#6356e1] border-t-transparent animate-spin"
                style={{ animationDuration: '0.9s' }}
              />
            </div>
          )}
        </div>
        <p className="text-white text-[13px] font-medium font-['Roboto'] tracking-[0.15px] mb-1">
          {realLabel ?? (isDone ? 'Ready' : 'Generating…')}
        </p>
        <p className="text-white/50 text-[11px] font-['Roboto'] mb-3">
          {completed} / {total} angles
        </p>
        {!isDone && (
          <div className="w-40 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6356e1] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Fake-animation mode: delegate to a proper component so hooks are legal ──
  return <GlobalAIRenderOverlayFake isRunning={isRunning} onComplete={onComplete} />;
}

// ─── Fake overlay — compact card (240px) with sub-task progress ──────────────

const STAGE_SUBTASKS: Record<string, [string, string, string]> = {
  s1: ['Loading vehicle reference', 'Reading scene metadata',  'Parsing prompt context'],
  s2: ['Framing vehicle placement', 'Matching lighting angle', 'Drafting scene layout'],
  s3: ['Blending vehicle layer',    'Compositing shadows',     'Merging background plates'],
  s4: ['Sharpening edge detail',    'Color grading output',    'Final render pass'],
};

function GlobalAIRenderOverlayFake({
  isRunning,
  onComplete,
  // Optional: real-API progress mode. When provided, stage is derived from
  // the completed/total ratio instead of the internal timer animation.
  realCompleted,
  realTotal,
}: {
  isRunning:      boolean;
  onComplete?:    () => void;
  realCompleted?: number;
  realTotal?:     number;
}) {
  const isProgressMode = realTotal !== undefined;

  // ── Timer-based state (Blue / fake flow) ─────────────────────────────────
  const [timerStage,   setTimerStage]   = useState<GlobalStage>('idle');
  const [timerSubStep, setTimerSubStep] = useState(0);

  // ── Progress-based stage derivation (real Kodiak API flow) ───────────────
  const { progressStage, progressSubStep } = useMemo<{ progressStage: GlobalStage; progressSubStep: number }>(() => {
    if (!isProgressMode || !isRunning) return { progressStage: 'idle', progressSubStep: 0 };
    const c = realCompleted ?? 0;
    const t = realTotal!;
    if (c >= t) return { progressStage: 'idle', progressSubStep: 0 };
    const p     = c / t;
    // 4 equal bands: s1 0–25%, s2 25–50%, s3 50–75%, s4 75–100%
    const si    = Math.min(3, Math.floor(p * 4));
    const stageKeys: GlobalStage[] = ['s1', 's2', 's3', 's4'];
    const stageP = (p - si * 0.25) / 0.25;
    return { progressStage: stageKeys[si], progressSubStep: Math.min(2, Math.floor(stageP * 3)) };
  }, [isProgressMode, isRunning, realCompleted, realTotal]);

  const stage   = isProgressMode ? progressStage   : timerStage;
  const subStep = isProgressMode ? progressSubStep : timerSubStep;

  const arcs = useConstellationAnim(isRunning && stage !== 'idle');

  // ── Timer-based useEffect (fake/Blue flow only) ───────────────────────────
  useEffect(() => {
    if (isProgressMode) return; // real-progress mode drives stage externally
    if (!isRunning) {
      setTimerStage('idle');
      setTimerSubStep(0);
      return;
    }

    const stages: GlobalStage[] = ['s1', 's2', 's3', 's4'];
    let elapsed = 0;
    setTimerStage('s1');
    setTimerSubStep(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    stages.forEach((s, i) => {
      elapsed += i === 0 ? 0 : GLOBAL_STAGE_DURATIONS[i - 1];
      timers.push(
        setTimeout(() => {
          setTimerStage(s);
          setTimerSubStep(0);
          const dur = GLOBAL_STAGE_DURATIONS[i];
          timers.push(setTimeout(() => setTimerSubStep(1), dur * 0.35));
          timers.push(setTimeout(() => setTimerSubStep(2), dur * 0.7));
          if (s === 's4') {
            timers.push(setTimeout(() => {
              setTimerStage('idle');
              setTimerSubStep(0);
              onComplete?.();
            }, dur));
          }
        }, elapsed),
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [isRunning, onComplete, isProgressMode]);

  // ── onComplete for real-progress mode ─────────────────────────────────────
  useEffect(() => {
    if (!isProgressMode) return;
    if ((realCompleted ?? 0) >= (realTotal ?? Infinity)) {
      onComplete?.();
    }
  }, [isProgressMode, realCompleted, realTotal, onComplete]);

  if (stage === 'idle') return null;

  const stageLabel = GLOBAL_STAGE_LABELS[stage];
  // In real-progress mode, append "X/N" so the user can track angle count
  const displayLabel = isProgressMode && realCompleted !== undefined && realTotal !== undefined
    ? `${stageLabel} · ${realCompleted}/${realTotal}`
    : stageLabel;
  const tasks = STAGE_SUBTASKS[stage] ?? STAGE_SUBTASKS['s1'];

  const getTaskState = (i: number): 'done' | 'active' | 'pending' => {
    if (i < subStep) return 'done';
    if (i === subStep) return 'active';
    return 'pending';
  };

  // Solid overlay — same bg as the preview panel so no image bleeds through.
  // No outer card wrapper, no drop-shadow — flat-centred per Figma node 3600-105765.
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#f4f5f6] z-20 rounded-xl">
      <div className="flex flex-col gap-[4px] p-[10px]" style={{ width: 240 }}>

        {/* Header: 36 × 36 arc container + 14px body1 label */}
        <div className="flex items-center gap-[4px]" style={{ minHeight: 36 }}>
          <div className="shrink-0 flex items-center justify-center" style={{ width: 36, height: 36 }}>
            <ConstellationArcMark arcs={arcs} size={36} />
          </div>
          <span className="flex-1 min-w-0 font-['Roboto',sans-serif] font-normal text-[14px] leading-[1.5] tracking-[0.15px] text-[#1f1d25] whitespace-nowrap overflow-hidden text-ellipsis">
            {displayLabel}
          </span>
        </div>

        {/* Sub-tasks — 166 px wide, 10 px text, #686576 */}
        <div className="flex flex-col gap-[3px] pl-[21px]" style={{ width: 166 }}>
          {tasks.filter(Boolean).map((task, i) => {
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

// ─── Shared style constants ───────────────────────────────────────────────────
const LABEL_BASE =
  "font-['Roboto',sans-serif] font-normal text-[12px] leading-[12px] tracking-[0.15px] text-[#686576]";

const ReqLabel = ({ children }: { children: React.ReactNode }) => (
  <label className={cn(LABEL_BASE, 'flex items-center gap-[4px] pb-[4px] px-[4px]')}>
    <span className="text-[#d2323f]">*</span>{children}
  </label>
);

const OptLabel = ({ children }: { children: React.ReactNode }) => (
  <label className={cn(LABEL_BASE, 'pb-[4px] px-[4px] block')}>
    {children}
  </label>
);

const INPUT_BASE = [
  'w-full min-h-[36px] py-[6px] pl-[8px] pr-[4px]',
  'bg-[#f9fafa] border border-[#cac9cf] rounded-[4px]',
  "font-['Roboto',sans-serif] font-normal text-[12px] leading-[1.5] tracking-[0.17px]",
  'text-[#1f1d25] placeholder:text-[#9c99a9]',
  'outline-none focus:border-[#6356e1] transition-colors',
].join(' ');

// Card-style accordion — rounded border, NO overflow-hidden on the item itself.
// overflow-hidden on the item clips the bottom border/shadow during Radix animation.
// Instead, each section (trigger / content) clips its own bg to its own corners.
const ACC_ITEM = 'border border-[rgba(0,0,0,0.12)] rounded-[12px]';

// Trigger: explicit horizontal + vertical padding so the text and chevron sit
// comfortably inside the card. rounded-t-[11px] clips the trigger's bg-white to
// the top corners (1px inside the 12px border so the border still shows).
const ACC_TRIGGER = [
  'bg-white hover:bg-[rgba(17,16,20,0.04)]',
  '[&[data-state=open]]:bg-white',
  'px-[16px] py-[12px]',
  'rounded-t-[11px]',
  // Roboto Medium 13 px — matches Figma accordion header spec
  "font-['Roboto',sans-serif] font-medium text-[13px] leading-[22px] tracking-[0.1px] text-[#1f1d25]",
].join(' ');

// ─── UploadBlock ──────────────────────────────────────────────────────────────
interface UploadBlockProps {
  description: string;
  fileUrl: string | null;
  onUpload: () => void;
  onClear: () => void;
  altText?: string;
}
function UploadBlock({ description, fileUrl, onUpload, onClear, altText = '' }: UploadBlockProps) {
  return (
    <>
      <p className="font-['Roboto',sans-serif] font-normal text-[11px] text-[#9c99a9] leading-[1.5] mb-3">
        {description}
      </p>
      {fileUrl && (
        <div className="relative w-[68px] h-[50px] rounded-[4px] border border-[rgba(0,0,0,0.12)] overflow-hidden mb-3 shrink-0">
          <img src={fileUrl} alt={altText} className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 cursor-pointer"
          >
            <X size={9} />
          </button>
        </div>
      )}
      <button
        onClick={onUpload}
        className="flex items-center gap-[6px] h-[28px] px-3 border-[1.5px] border-[#6356e1] rounded-full text-[11px] text-[#473bab] font-['Roboto'] bg-transparent hover:bg-[#473bab]/5 transition-colors cursor-pointer"
      >
        {fileUrl ? <IconUpdate /> : <IconUpload />}
        {fileUrl ? 'Update' : 'Upload'}
      </button>
    </>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ onRequestUpload }: { onRequestUpload: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 select-none">
      <img src={emptyStateSvg} alt="" className="w-[140px] h-[140px]" />
      <div className="text-center">
        <p className="text-[14px] font-medium text-[#1f1d25] font-['Roboto'] mb-1">
          Upload your background
        </p>
        <p className="text-[12px] text-[#9c99a9] font-['Roboto']">
          SVG, PNG or JPG (Max. 3MB)
        </p>
      </div>
      <button
        onClick={onRequestUpload}
        className="flex items-center gap-1.5 h-9 px-5 rounded-full bg-[#473bab] text-[13px] text-white font-['Roboto'] hover:bg-[#3c3192] transition-colors cursor-pointer"
      >
        <span className="text-[16px] leading-none">+</span>
        New Background
      </button>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
// Shows the preview image in full-screen lightbox.
// imageUrl = the actual background/composite for this config (from bgUrl).
// When sourceImageUrl is provided, shows a Generated / Source tab toggle.
// When previousVersionUrl is provided, adds a "Previous Version" tab.
type PreviewModalTab = 'generated' | 'previous' | 'source';

interface PreviewModalProps {
  open:                 boolean;
  onClose:              () => void;
  angleIndex:           number;
  onPrev:               () => void;
  onNext:               () => void;
  imageUrl:             string | null;
  sourceImageUrl?:      string | null;
  previousVersionUrl?:  string | null;
}
function PreviewModal({ open, onClose, angleIndex, onPrev, onNext, imageUrl, sourceImageUrl, previousVersionUrl }: PreviewModalProps) {
  const [tab, setTab] = useState<PreviewModalTab>('generated');
  const angle = ANGLES[angleIndex];
  const hasPrevious = !!previousVersionUrl;

  // Build visible tabs:
  //   • Generated      — always visible
  //   • Previous Version — conditional: only after an angle has been individually edited
  //   • Source           — always visible (vehicle cutout on white)
  const visibleTabs: Array<{ id: PreviewModalTab; label: string }> = [
    { id: 'generated', label: 'Generated'       },
    ...(hasPrevious ? [{ id: 'previous' as PreviewModalTab, label: 'Previous Version' }] : []),
    { id: 'source', label: 'Source' },
  ];

  // If navigating to an angle where the current tab is no longer available,
  // fall back to Generated so the user isn't left with an empty frame.
  useEffect(() => {
    if (tab === 'source'   && !sourceImageUrl)    setTab('generated');
    if (tab === 'previous' && !previousVersionUrl) setTab('generated');
  }, [angleIndex, sourceImageUrl, previousVersionUrl, tab]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, onPrev, onNext]);

  if (!open) return null;

  const displayImg =
    tab === 'previous' ? previousVersionUrl :
    tab === 'source'   ? sourceImageUrl     :
    imageUrl;

  return (
    <div
      className="fixed inset-0 bg-black/52 flex items-center justify-center z-[500]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] overflow-hidden w-[820px] max-w-[94vw] shadow-[0_24px_64px_rgba(0,0,0,.25)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-[18px] py-[13px] border-b border-[#e5e7eb]">
          {/* Tab bar — Generated and Source are always shown; Previous Version is conditional */}
          <div className="flex flex-1">
            {visibleTabs.map(({ id: t, label }) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1 border-none bg-transparent text-[13px] cursor-pointer border-b-2 font-['Roboto'] transition-all duration-150",
                  tab === t
                    ? 'text-[#473bab] border-[#473bab] font-medium'
                    : "text-[#686476] border-transparent hover:text-[#374151]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Angle chip */}
          <span className="px-2 py-0.5 rounded bg-[#f3f4f6] text-[11px] font-medium text-[#374151] font-['Roboto']">
            {angle?.label}
          </span>
          {/* Left / Right arrows */}
          <button
            onClick={e => { e.stopPropagation(); onPrev(); }}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-[#e5e7eb] text-[#686476] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onNext(); }}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-[#e5e7eb] text-[#686476] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full border-none bg-transparent cursor-pointer text-[#686476] hover:bg-[#f3f4f6] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          className="relative h-[480px] overflow-hidden"
          style={{ background: tab === 'source' ? '#ffffff' : '#111' }}
          key={`${angleIndex}-${tab}`}
        >
          {displayImg ? (
            <img
              src={displayImg}
              alt={angle?.label ?? 'Preview'}
              className="absolute inset-0 w-full h-full object-contain transition-opacity duration-200"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/40 text-[13px] font-['Roboto']">No image available</span>
            </div>
          )}
          {/* Side nav overlays */}
          <button
            onClick={e => { e.stopPropagation(); onPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-[#1f1d25] hover:bg-white transition-colors cursor-pointer z-10"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-[#1f1d25] hover:bg-white transition-colors cursor-pointer z-10"
          >
            <ChevronRight size={18} />
          </button>
          {/* Angle label badge */}
          <div
            className="absolute bottom-3 left-3 text-[11px] font-medium font-['Roboto'] px-2 py-0.5 rounded z-10"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
          >
            {angle?.label}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
// Small circular icon button (top-right image actions: Favorite, Preview, Edit)
// Matches Figma: white bg, p-3.5px, rounded-full, elevation/8 shadow (scaled)
function ActionBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="bg-white rounded-full flex items-center justify-center border-none cursor-pointer shrink-0"
      style={{
        padding: '3.5px',
        boxShadow:
          '0px 3.5px 3.5px -2.1px rgba(0,0,0,0.2),' +
          '0px 5.6px 7.1px 0.7px rgba(0,0,0,0.14),' +
          '0px 2.1px 9.9px 1.4px rgba(0,0,0,0.12)',
      }}
    >
      {children}
    </button>
  );
}

// ─── PreviewPanel ─────────────────────────────────────────────────────────────
// Right-side preview matching the Figma spec:
//   • Gray card wrapper (#f4f5f6, rounded-16, p-16, gap-10)
//   • Image area (rounded-11, overflow-hidden) with hover overlay (300ms dissolve):
//       – Top-right: Favorite / Preview / Edit action buttons
//       – Center L/R: nav arrows (white circle, elevation/8 shadow)
//       – Bottom-left: angle label chip
//   • Bottom chips bar (px-28, h-24): angle chips + edit slot + settings + view toggle
//   • Grid view adapted from Inventory GridView pattern
// When initialDone=true (edit mode) starts in 'done' with no animation.
type RenderPhase = 'idle' | 'animating' | 'done';

interface PreviewPanelProps {
  bgUrl: string | null;
  hasVinsSelected: boolean;
  onRequestUpload: () => void;
  /** Skip animation — image loads immediately in edit mode */
  initialDone?: boolean;
  /**
   * Per-angle generated images (vehicle composite).
   * Pass BLUE_GEN_ANGLES for new configs with VINs, or the record's own genAngles.
   * null → shows bgUrl directly (BG-only mode, no vehicle overlay).
   */
  angleImages?: Array<string | null> | null;
  /**
   * Per-angle source cutout images (no background).
   * When provided, enables the Generated / Source tab in the preview modal.
   */
  sourceAngles?: Array<string | null> | null;
  /**
   * Per-angle previous version images (before last individual edit).
   * When provided, enables the "Previous Version" tab in the preview modal.
   */
  previousAngles?: Array<string | null> | null;
  /** True while a Replicate background generation is in progress */
  isGeneratingBg?: boolean;
  /** Model label shown inside the generating state */
  modelLabel?: string;
  /** True while multi-angle (Generate AI Images) generation is running */
  isGeneratingImgs?: boolean;
  /** How many of the 6 angle images have completed so far */
  genImgCompleted?: number;
  /** True while a single-angle re-generation (Edit flow) is in progress */
  isGeneratingSingleAngle?: boolean;
  /** Called when the fake-composite overlay animation completes (used by Kodiak demo) */
  onOverlayComplete?: () => void;
  /**
   * Index of the angle currently in "edit" mode (0–5), or null if no angle is being edited.
   * When set, the corresponding angle chip shows a pencil indicator.
   */
  editingAngleIndex?: number | null;
  /**
   * Called when the user clicks the Edit button on an angle image.
   * The parent component should set editingAngleIndex to this value.
   */
  onEditAngle?: (index: number) => void;
  /** Clears editingAngleIndex — called when the user hits the Cancel (X) button */
  onCancelEdit?: () => void;
  /**
   * True when the active flow is Kodiak (real Flux Kontext API).
   * False for the Blue demo flow (BLUE_GEN_ANGLES revealed after overlay animation).
   * Controls Preview button behaviour: Kodiak → calls onPreviewClick; Blue → starts local overlay.
   */
  isKodiakFlow?: boolean;
  /** VINs matching the current filter selection — drives the VIN selector dropdown */
  vinList?: VinRecord[];
  /** Index into vinList of the currently selected VIN (default 0) */
  selectedVinIndex?: number;
  /** Called when the user picks a different VIN in the dropdown */
  onVinChange?: (index: number) => void;
  /**
   * Called when the user clicks the Preview button.
   * Kodiak flow: should trigger handleGenerateImages in the parent.
   * Blue flow: ignored (overlay is started internally).
   */
  onPreviewClick?: () => void;
}

function PreviewPanel({ bgUrl, hasVinsSelected, onRequestUpload, initialDone = false, angleImages = null, sourceAngles = null, previousAngles = null, isGeneratingBg = false, modelLabel = 'Flux Kontext Pro', isGeneratingImgs = false, genImgCompleted = 0, isGeneratingSingleAngle = false, onOverlayComplete: onOverlayCompleteProp, editingAngleIndex = null, onEditAngle, onCancelEdit, isKodiakFlow = false, onPreviewClick, vinList = [], selectedVinIndex = 0, onVinChange }: PreviewPanelProps) {
  const [phase,          setPhase]          = useState<RenderPhase>(initialDone ? 'done' : 'idle');
  const [overlayRunning, setOverlayRunning] = useState(false);
  const [angleIndex,     setAngleIndex]     = useState(0);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [viewMode,       setViewMode]       = useState<'single' | 'grid'>('single');

  // ── VIN combobox state ────────────────────────────────────────────────────
  const [vinComboOpen,    setVinComboOpen]    = useState(false);
  const [vinSearch,       setVinSearch]       = useState('');
  const vinComboRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!vinComboOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (vinComboRef.current && !vinComboRef.current.contains(e.target as Node)) {
        setVinComboOpen(false);
        setVinSearch('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [vinComboOpen]);

  const filteredVinOptions = vinSearch.trim()
    ? vinList.filter(v => {
        const q = vinSearch.toLowerCase();
        return (
          v.vin.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          String(v.year).includes(q)
        );
      })
    : vinList;

  const formatVinLabel = (v: VinRecord) =>
    `${v.vin} · ${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`;

  const both = !!(bgUrl && hasVinsSelected);

  // hasContent — drives empty-state vs. preview panel.
  // VINs alone do NOT show the preview; we need either a background URL,
  // a real angle image, OR an active generation (so the overlay renders
  // over the gray panel instead of the old bare spinner).
  const hasContent = !!(
    bgUrl ||
    isGeneratingImgs ||
    isGeneratingSingleAngle ||
    (angleImages !== null && angleImages.some(u => u !== null))
  );

  // Show "Hit Preview to render image" hint in Blue flow:
  // BG uploaded + VINs selected + overlay not yet triggered + no images yet
  const showPreviewHint = !isKodiakFlow && both && phase === 'idle' && !overlayRunning && angleImages === null;

  // Handler for the Preview button in the action bar.
  // Priority: angle-edit mode → Kodiak all-angles → Blue fake animation.
  const handlePreviewBtn = useCallback(() => {
    if (editingAngleIndex !== null) {
      // Angle-edit mode: delegate to parent → triggers single-angle regeneration
      onPreviewClick?.();
      return;
    }
    if (isKodiakFlow) {
      // Kodiak: delegate to parent (triggers full 6-angle API generation)
      onPreviewClick?.();
      return;
    }
    // Blue: start overlay animation manually
    if (phase === 'idle' && !overlayRunning) {
      setPhase('animating');
      setOverlayRunning(true);
    }
  }, [editingAngleIndex, isKodiakFlow, onPreviewClick, phase, overlayRunning]);

  // Reset to idle if conditions are broken
  useEffect(() => {
    if (!both && phase !== 'idle') {
      setPhase('idle');
      setOverlayRunning(false);
    }
  }, [both, phase]);

  const handleOverlayComplete = useCallback(() => {
    setOverlayRunning(false);
    setPhase('done');
    onOverlayCompleteProp?.();
  }, [onOverlayCompleteProp]);

  const goToPrev = useCallback(
    () => setAngleIndex(i => (i - 1 + ANGLES.length) % ANGLES.length),
    [],
  );
  const goToNext = useCallback(
    () => setAngleIndex(i => (i + 1) % ANGLES.length),
    [],
  );

  // ── Empty / generating states ──
  if (!hasContent) {
    // BG prompt send-button generating
    if (isGeneratingBg) {
      return (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5 select-none">
          <div className="relative w-[56px] h-[56px]">
            <div className="absolute inset-0 rounded-full border-[3px] border-[#473bab]/20" />
            <div
              className="absolute inset-0 rounded-full border-[3px] border-[#473bab] border-t-transparent animate-spin"
              style={{ animationDuration: '1s' }}
            />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-medium text-[#1f1d25] font-['Roboto'] mb-1">
              Generating background…
            </p>
            <p className="text-[12px] text-[#9c99a9] font-['Roboto']">
              {modelLabel} · ~35s
            </p>
          </div>
        </div>
      );
    }

    return <EmptyState onRequestUpload={onRequestUpload} />;
  }

  // ── Gray card + VIN selector + image + chips bar ──
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-[10px] bg-[#f4f5f6] rounded-[16px] p-[16px]">

      {/* ── VIN Selector bar ── */}
      <div className="flex flex-col gap-[4px] shrink-0">
        {/* Label: "Preview VIN X of Y" */}
        <span
          className="font-['Roboto'] font-normal text-[11px] leading-[1.66] tracking-[0.4px] text-[#686576]"
        >
          Preview VIN{vinList.length > 0 ? ` ${selectedVinIndex + 1} of ${vinList.length}` : ''}
        </span>

        <div className="flex items-center gap-[8px]">
          {/* Combobox */}
          <div ref={vinComboRef} className="relative flex-1 min-w-0">
            {/* Trigger button */}
            <button
              type="button"
              onClick={() => { setVinComboOpen(o => !o); setVinSearch(''); }}
              className={[
                'w-full flex items-center gap-[8px] h-[36px] px-[10px] rounded-[8px] bg-white border transition-colors text-left',
                vinComboOpen
                  ? 'border-[#473bab] shadow-[0_0_0_2px_rgba(71,59,171,0.12)]'
                  : 'border-[rgba(0,0,0,0.14)] hover:border-[rgba(71,59,171,0.4)]',
              ].join(' ')}
            >
              {/* Vehicle cutout thumbnail — falls back to ATV SVG if no source angle */}
              {sourceAngles?.[0] ? (
                <img
                  src={sourceAngles[0]}
                  alt=""
                  className="shrink-0 object-contain"
                  style={{ width: 44, height: 28 }}
                />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <circle cx="7" cy="7" r="6.5" fill="rgba(71,59,171,0.12)" />
                  <path d="M4 8.2L4.8 6h4.4l.8 2.2v1H4v-1z" fill="#473bab" opacity="0.9" />
                  <circle cx="5.2" cy="9.7" r="0.65" fill="#473bab" />
                  <circle cx="8.8" cy="9.7" r="0.65" fill="#473bab" />
                  <rect x="5.5" y="4.8" width="3" height="1.2" rx="0.4" fill="#473bab" opacity="0.55" />
                </svg>
              )}

              {vinComboOpen ? (
                /* Search input — visible when open */
                <input
                  autoFocus
                  value={vinSearch}
                  onChange={e => setVinSearch(e.target.value)}
                  placeholder="Search VIN…"
                  className="flex-1 min-w-0 bg-transparent border-none outline-none font-['Roboto'] text-[12px] text-[#1f1d25] placeholder:text-[#9c99a9]"
                  onKeyDown={e => { if (e.key === 'Escape') { setVinComboOpen(false); setVinSearch(''); } }}
                />
              ) : (
                /* Display text when closed */
                <span className="flex-1 min-w-0 font-['Roboto'] text-[12px] text-[#1f1d25] truncate">
                  {vinList.length > 0 && vinList[selectedVinIndex]
                    ? formatVinLabel(vinList[selectedVinIndex])
                    : <span className="text-[#9c99a9]">No VINs in selection</span>
                  }
                </span>
              )}

              <ChevronDown
                size={13}
                className={cn('shrink-0 text-[rgba(17,16,20,0.44)] transition-transform duration-150', vinComboOpen && 'rotate-180')}
              />
            </button>

            {/* Dropdown */}
            {vinComboOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white rounded-[8px] border border-[rgba(0,0,0,0.12)] shadow-[0_4px_16px_rgba(0,0,0,0.12)] overflow-hidden">
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredVinOptions.length > 0 ? (
                    filteredVinOptions.map(v => {
                      const origIdx = vinList.indexOf(v);
                      const isSelected = origIdx === selectedVinIndex;
                      return (
                        <button
                          key={v.vin}
                          type="button"
                          onMouseDown={e => e.preventDefault()} // prevent blur before click
                          onClick={() => {
                            onVinChange?.(origIdx);
                            setVinComboOpen(false);
                            setVinSearch('');
                          }}
                          className={cn(
                            'w-full flex items-center gap-[8px] px-[10px] py-[7px] text-left transition-colors',
                            isSelected
                              ? 'bg-[rgba(71,59,171,0.08)] text-[#473bab]'
                              : 'hover:bg-[rgba(17,16,20,0.04)] text-[#1f1d25]',
                          )}
                        >
                          {/* Vehicle cutout thumbnail per option */}
                          {sourceAngles?.[0] ? (
                            <img
                              src={sourceAngles[0]}
                              alt=""
                              className="shrink-0 object-contain"
                              style={{ width: 44, height: 28 }}
                            />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                              <circle cx="7" cy="7" r="6.5" fill={isSelected ? 'rgba(71,59,171,0.18)' : 'rgba(156,153,169,0.18)'} />
                              <path d="M4 8.2L4.8 6h4.4l.8 2.2v1H4v-1z" fill={isSelected ? '#473bab' : '#686476'} opacity="0.9" />
                              <circle cx="5.2" cy="9.7" r="0.65" fill={isSelected ? '#473bab' : '#686476'} />
                              <circle cx="8.8" cy="9.7" r="0.65" fill={isSelected ? '#473bab' : '#686476'} />
                              <rect x="5.5" y="4.8" width="3" height="1.2" rx="0.4" fill={isSelected ? '#473bab' : '#686476'} opacity="0.55" />
                            </svg>
                          )}
                          <span className="font-['Roboto'] text-[12px] truncate">
                            {formatVinLabel(v)}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-[10px] py-[12px] text-center font-['Roboto'] text-[12px] text-[#9c99a9]">
                      No VINs match your search
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview button — moved from chips bar */}
          <button
            onClick={handlePreviewBtn}
            disabled={isGeneratingImgs || isGeneratingBg}
            className={cn(
              'flex items-center gap-[5px] h-[32px] px-[12px] rounded-full border transition-colors shrink-0',
              "text-[#473bab] text-[12px] font-medium font-['Roboto'] whitespace-nowrap",
              (isGeneratingImgs || isGeneratingBg)
                ? 'border-[rgba(71,59,171,0.25)] opacity-40 cursor-not-allowed'
                : 'border-[rgba(99,86,225,0.5)] hover:bg-[#473bab]/5 cursor-pointer',
            )}
          >
            <Eye size={13} />
            Preview
          </button>
        </div>

        {/* Helper text */}
        <span className="font-['Roboto'] font-normal text-[11px] leading-[1.66] tracking-[0.4px] text-[#9c99a9]">
          You can type to search for a VIN
        </span>
      </div>

      {/* ── Image view area ── */}
      <div className="relative flex-1 min-h-0 rounded-[11px] overflow-hidden group">

        {/* Single view — hide image whenever any overlay is active so loading
            artefacts (corners of the image peeking through the rounded wrapper)
            are invisible. The overlay covers the entire image area anyway. */}
        {viewMode === 'single' && !overlayRunning && !isGeneratingImgs && !isGeneratingSingleAngle && (() => {
          const imgSrc = angleImages
            ? (angleImages[angleIndex] ?? null)
            : (bgUrl ?? null);
          return imgSrc ? (
            <img
              key={angleIndex}
              src={imgSrc}
              alt={ANGLES[angleIndex]?.label}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null;
        })()}

        {/* Grid view — 2-col grid, adapted from Inventory GridView */}
        {viewMode === 'grid' && (
          <div className="absolute inset-0 overflow-y-auto">
            <div className="grid grid-cols-2" style={{ gap: '2px', background: '#d1d5db' }}>
              {ANGLES.map((angle, i) => (
                <div
                  key={angle.id}
                  onClick={() => { setAngleIndex(i); setViewMode('single'); }}
                  className="relative overflow-hidden cursor-pointer bg-[#111] group/cell"
                  style={{ paddingBottom: '75%', height: 0 }}
                >
                  <img
                    src={angleImages ? (angleImages[i] ?? undefined) : (bgUrl ?? undefined)}
                    alt={angle.label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover/cell:scale-[1.03]"
                  />
                  {/* Cell hover overlay — 3 action buttons same as single view */}
                  <div className="absolute inset-0 bg-black/[0.28] flex items-end justify-end p-[8px] gap-[8px] opacity-0 group-hover/cell:opacity-100 transition-opacity duration-[180ms]">
                    <button
                      onClick={e => { e.stopPropagation(); setAngleIndex(i); setModalOpen(true); }}
                      className="w-[28px] h-[28px] rounded-full bg-white/[0.92] flex items-center justify-center cursor-pointer border-none"
                      title="Preview"
                    >
                      <img src={PreviewIconSrc} alt="" width={14} height={14} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setAngleIndex(i); setViewMode('single'); onEditAngle?.(i); }}
                      className="w-[28px] h-[28px] rounded-full bg-white/[0.92] flex items-center justify-center cursor-pointer border-none"
                      title="Edit angle"
                    >
                      <img src={EditIconSrc} alt="" width={14} height={14} />
                    </button>
                  </div>
                  {/* Angle label badge */}
                  <div className="absolute top-1.5 left-1.5 bg-black/[0.65] text-white text-[10px] font-medium font-['Roboto'] px-1.5 py-0.5 rounded-[3px]">
                    {angle.label}
                  </div>
                  {/* Edit mode indicator — purple border when this angle is being edited */}
                  {editingAngleIndex === i && (
                    <div className="absolute inset-0 pointer-events-none" style={{ border: '2.5px solid #473bab' }} />
                  )}
                  {/* Active (selected) border */}
                  {i === angleIndex && editingAngleIndex !== i && (
                    <div className="absolute inset-0 pointer-events-none" style={{ border: '2.5px solid #473bab' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blue-flow hint — "Hit Preview to render image" — shown over the BG before overlay runs */}
        {showPreviewHint && viewMode === 'single' && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-[14px] pointer-events-none z-[5]">
            <div className="flex items-center gap-[6px] bg-black/50 backdrop-blur-[2px] px-[14px] py-[7px] rounded-full">
              <img src={PreviewIconSrc} alt="" width={13} height={13} className="opacity-80 invert" />
              <span className="text-white text-[12px] font-['Roboto'] font-medium whitespace-nowrap">
                Hit Preview to render image
              </span>
            </div>
          </div>
        )}

        {/* Single-view hover overlay — hidden during generation so angle chip / nav
            arrows don't appear behind the GlobalAIRenderOverlay spinner. */}
        {viewMode === 'single' && !isGeneratingImgs && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">

            {/* Top-right: Preview / Edit-or-Cancel */}
            <div className="absolute top-[10px] right-[10px] flex items-center gap-[10px] pointer-events-auto">
              <ActionBtn title="Preview" onClick={() => setModalOpen(true)}>
                <img src={PreviewIconSrc} alt="" width={17} height={17} />
              </ActionBtn>
              {editingAngleIndex !== null ? (
                /* Cancel edit — X icon, tooltip "Cancel edit" */
                <ActionBtn title="Cancel edit" onClick={() => onCancelEdit?.()}>
                  <X size={17} strokeWidth={2} />
                </ActionBtn>
              ) : (
                <ActionBtn title="Edit angle" onClick={() => onEditAngle?.(angleIndex)}>
                  <img src={EditIconSrc} alt="" width={17} height={17} />
                </ActionBtn>
              )}
            </div>

            {/* Left nav arrow — white circle, elevation/8 shadow */}
            <button
              onClick={goToPrev}
              className="absolute left-[10px] top-1/2 -translate-y-1/2 w-[40px] h-[40px] rounded-full bg-white flex items-center justify-center cursor-pointer border-none pointer-events-auto text-[rgba(17,16,20,0.87)]"
              style={{ boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)' }}
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>

            {/* Right nav arrow */}
            <button
              onClick={goToNext}
              className="absolute right-[10px] top-1/2 -translate-y-1/2 w-[40px] h-[40px] rounded-full bg-white flex items-center justify-center cursor-pointer border-none pointer-events-auto text-[rgba(17,16,20,0.87)]"
              style={{ boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)' }}
            >
              <ChevronRight size={24} strokeWidth={2} />
            </button>

          {/* Bottom-left angle chip hidden in single view —
              the chips bar below already shows which angle is selected */}
          </div>
        )}

        {/* Generating-BG overlay — shown when re-generating background while content is visible */}
        {isGeneratingBg ? (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 rounded-xl gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-4 border-white/20" />
              <div
                className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin"
                style={{ animationDuration: '0.9s' }}
              />
            </div>
            <p className="text-white text-[13px] font-medium font-['Roboto'] tracking-[0.15px]">
              Generating background…
            </p>
            <p className="text-white/50 text-[11px] font-['Roboto']">{modelLabel}</p>
          </div>
        ) : isGeneratingSingleAngle ? (
          /* Single-angle edit — full overlay while one angle re-generates */
          <GlobalAIRenderOverlayFake isRunning={true} />
        ) : isGeneratingImgs ? (
          /* Multi-angle generation — same visual as Blue fake flow, driven by real API progress */
          <GlobalAIRenderOverlayFake
            isRunning={true}
            realCompleted={genImgCompleted}
            realTotal={6}
          />
        ) : (
          <GlobalAIRenderOverlayFake isRunning={overlayRunning} onComplete={handleOverlayComplete} />
        )}
      </div>

      {/* ── Image Management Actions bar ── */}
      {/* overflow-y: visible so the "Editing this angle" tooltip can float above this bar */}
      <div className="flex items-center gap-[8px] h-[24px] px-[0] shrink-0" style={{ overflowY: 'visible' }}>

        {/* Angle chips — flex-1, gap-[10px]
            overflow-y must be visible so the "Editing this angle" tooltip can
            float above the bar. overflow-x: clip prevents horizontal scroll
            without blocking the y-axis (unlike overflow-x: hidden). */}
        <div
          className="flex flex-1 min-w-0 items-center gap-[10px]"
          style={{ overflowX: 'clip', overflowY: 'visible' }}
        >
          {ANGLES.map((angle, i) => {
            const isActive    = i === angleIndex;
            const isEditing   = editingAngleIndex === i;
            const hasPrevious = !!(previousAngles?.[i]);
            // Show pencil indicator when angle is being edited OR has a previous version
            const showPencil  = isEditing || hasPrevious;
            return (
              <div key={angle.id} className="relative shrink-0">
                {/* "Editing this angle" tooltip — always in DOM, slides up + fades in
                    when isEditing becomes true (350ms ease). Kept out of the DOM flow
                    via pointer-events-none + position:absolute.                      */}
                <div
                  className="pointer-events-none absolute left-1/2 z-30"
                  style={{
                    bottom:     'calc(100% + 5px)',
                    transform:  `translateX(-50%) translateY(${isEditing ? '0px' : '6px'})`,
                    opacity:    isEditing ? 1 : 0,
                    transition: 'opacity 350ms ease, transform 350ms ease',
                  }}
                >
                  <div
                    className="whitespace-nowrap rounded-[4px] px-[8px] py-[4px] text-white"
                    style={{
                      background:    'rgba(97,97,97,0.9)',
                      fontFamily:    "'Roboto', sans-serif",
                      fontSize:      10,
                      fontWeight:    500,
                      lineHeight:    '14px',
                      letterSpacing: 0,
                    }}
                  >
                    Editing this angle
                  </div>
                  {/* Caret pointing down toward the chip */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
                    style={{
                      top:         '100%',
                      borderLeft:  '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop:   '5px solid rgba(97,97,97,0.9)',
                    }}
                  />
                </div>
                <button
                  onClick={() => { setAngleIndex(i); setViewMode('single'); }}
                  className={cn(
                    'flex items-center gap-[4px] h-[24px] px-[4px] py-[3px] rounded-[8px] border cursor-pointer transition-colors',
                    isEditing
                      ? 'border-[#473bab] bg-transparent'
                      : isActive
                        ? 'border-transparent bg-[rgba(0,0,0,0.2)]'
                        : 'border-transparent bg-[rgba(17,16,20,0.04)] hover:bg-[rgba(17,16,20,0.1)]',
                  )}
                >
                  {showPencil && (
                    <Pencil
                      size={9}
                      className="shrink-0"
                      style={{ color: isEditing ? '#473bab' : 'rgba(17,16,20,0.56)' }}
                    />
                  )}
                  <span
                    className={cn(
                      "px-[2px] text-[11px] leading-[18px] tracking-[0.16px] font-['Roboto'] whitespace-nowrap",
                      isEditing ? 'text-[#473bab]' : 'text-[#1f1d25]',
                    )}
                  >
                    {angle.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Settings */}
        <button
          title="Settings"
          className="w-[24px] h-[24px] flex items-center justify-center border-none bg-transparent cursor-pointer p-0 shrink-0 hover:opacity-60 transition-opacity"
        >
          <img src={SettingsIconSrc} alt="Settings" width={24} height={24} />
        </button>

        {/* View mode toggle: Grid icon in single view → Fullscreen icon in grid view */}
        <button
          onClick={() => setViewMode(v => v === 'single' ? 'grid' : 'single')}
          title={viewMode === 'single' ? 'Grid view' : 'Single view'}
          className="w-[24px] h-[24px] flex items-center justify-center border-none bg-transparent cursor-pointer p-0 shrink-0 hover:opacity-60 transition-opacity"
        >
          {viewMode === 'single'
            ? <img src={GridIconSrc}       alt="Grid view"   width={24} height={24} />
            : <img src={FullscreenIconSrc} alt="Single view" width={24} height={24} />}
        </button>
      </div>

      <PreviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        angleIndex={angleIndex}
        onPrev={goToPrev}
        onNext={goToNext}
        imageUrl={(angleImages ? (angleImages[angleIndex] ?? bgUrl) : bgUrl)}
        sourceImageUrl={sourceAngles ? (sourceAngles[angleIndex] ?? null) : null}
        previousVersionUrl={previousAngles ? (previousAngles[angleIndex] ?? null) : null}
      />
    </div>
  );
}

// ─── NewGlobalAIConfigContent ─────────────────────────────────────────────────

// ─── IconGenericLeftPane (inline — same as ClientSettingsContent toolbar) ──────
function IconGenericLeftPane() {
  return (
    <svg width="20" height="20" viewBox="0 0 30 30" fill="none">
      <path
        d="M7.29102 9.79183C7.29102 9.33159 7.66411 8.9585 8.12435 8.9585H21.8743C22.3346 8.9585 22.7077 9.33159 22.7077 9.79183V20.2085C22.7077 20.6687 22.3346 21.0418 21.8743 21.0418H8.12435C7.66411 21.0418 7.29102 20.6687 7.29102 20.2085V9.79183Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path
        d="M11.875 9.1665V14.9998V20.8332"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
    </svg>
  );
}

interface NewGlobalAIConfigContentProps {
  onCancel: () => void;
  onSave?: (record: AIConfigRecord) => void;
  /** Pre-fill form for editing an existing config */
  initialData?: SavedFormState;
  /** Mirrors the list-view side panel toggle */
  isSideSheetOpen?: boolean;
  onToggleSideSheet?: () => void;
}

export function NewGlobalAIConfigContent({
  onCancel,
  onSave,
  initialData,
  isSideSheetOpen = false,
  onToggleSideSheet,
}: NewGlobalAIConfigContentProps) {
  // ── Form state — seed from initialData when editing ──
  const [configName,      setConfigName]      = useState(initialData?.configName      ?? '');
  const [aiConfigActive,  setAiConfigActive]  = useState(initialData?.aiConfigActive  ?? true);
  const [activeTab,       setActiveTab]       = useState('parameters');
  const [aiModel,         setAiModel]         = useState(initialData?.aiModel         ?? 'flux-kontext-pro');
  const [seed,            setSeed]            = useState(initialData?.seed             ?? '');
  const [prompt,          setPrompt]          = useState(initialData?.prompt           ?? '');
  const [productPosition, setProductPosition] = useState(initialData?.productPosition ?? { x: 0, y: -30, width: 480 });
  const [bgUrl,           setBgUrl]           = useState<string | null>(initialData?.bgUrl    ?? null);
  const [overlayUrl,      setOverlayUrl]      = useState<string | null>(initialData?.overlayUrl ?? null);
  const [promptLibOpen,     setPromptLibOpen]     = useState(false);
  const [vinsCount,         setVinsCount]         = useState(initialData?.vinsCount ?? 0);
  const [filteredVinsCount, setFilteredVinsCount] = useState(0);
  const [filterGroupsState, setFilterGroupsState] = useState<Array<{ filters: VinFilters }>>(
    initialData?.filterGroups ?? [],
  );

  // ── Replicate single-background generation state ───────────────────────────
  const [isGeneratingBg,  setIsGeneratingBg]  = useState(false);
  const [genError,        setGenError]        = useState<string | null>(null);
  const genAbortRef = useRef<AbortController | null>(null);

  // ── Multi-angle (Generate AI Images) generation state ─────────────────────
  const [generatedAngles,  setGeneratedAngles]  = useState<Array<string | null> | null>(
    initialData?.isStaticRecord ? null : null,
  );
  const [isGeneratingImgs, setIsGeneratingImgs] = useState(false);
  const [genImgCompleted,  setGenImgCompleted]  = useState(0);
  const genImgAbortRef = useRef<AbortController | null>(null);

  // ── Background-only thumbnail state (for DataGrid parent row) ─────────────
  // Generated as a pure text-to-image (no vehicle) alongside angle generation.
  const [bgThumbnail, setBgThumbnail] = useState<string | null>(null);

  // ── VIN selector state ────────────────────────────────────────────────────
  const [selectedVinIndex, setSelectedVinIndex] = useState(0);

  // Aggregate VINs from all filter groups (deduped by VIN string)
  const vinList = useMemo<VinRecord[]>(() => {
    if (!filterGroupsState.length) return [];
    const seen = new Set<string>();
    return filterGroupsState
      .flatMap(g => filterVins(g.filters))
      .filter(v => seen.has(v.vin) ? false : (seen.add(v.vin), true));
  }, [filterGroupsState]);

  // Reset selected VIN to first when the list changes
  useEffect(() => { setSelectedVinIndex(0); }, [vinList.length]);

  // ── Angle Edit state ──────────────────────────────────────────────────────
  // editingAngleIndex: which angle (0–5) is currently in "edit" mode, or null
  // previousAngles:    per-angle previous-version URL, preserved across edits
  // isEditingAngle:    true while a single-angle regeneration is in progress
  const [editingAngleIndex, setEditingAngleIndex] = useState<number | null>(null);
  const [previousAngles,    setPreviousAngles]    = useState<Array<string | null> | null>(
    initialData?.previousAngles ?? null,
  );
  const [isEditingAngle,    setIsEditingAngle]    = useState(false);
  const editAngleAbortRef = useRef<AbortController | null>(null);

  // Build a vehicle description string from the first filter group
  // Supports both new multi-value arrays and legacy single fields.
  const vehicleDesc = useMemo(() => {
    const f = filterGroupsState[0]?.filters;
    if (!f) return '';
    const year  = f.years?.length  ? f.years[0]  : f.year;
    const make  = f.makes?.length  ? f.makes[0]  : f.make;
    const model = f.models?.length ? f.models[0] : f.model;
    const trim  = f.trims?.length  ? f.trims[0]  : f.trim;
    const color = f.colors?.length ? f.colors[0] : f.color;
    return [year, make, model, trim, color]
      .filter(v => v !== undefined && v !== null && v !== '')
      .map(String)
      .join(' ');
  }, [filterGroupsState]);

  // ── Vehicle mode detection ────────────────────────────────────────────────
  //
  // isKodiak  → REAL Flux Kontext flow: per-angle cutout as inputImage,
  //             Replicate generates 6 real composites.
  //
  // !isKodiak → BLUE DEMO flow: BLUE_GEN_ANGLES shown after overlay animation,
  //             no real API call. Only active when a non-Kodiak model is
  //             explicitly selected in VINs Applied filters.
  //
  // DEFAULT IS KODIAK — so the demo works without requiring the user to set
  // up VINs Applied filters first. Blue demo only triggers when filterGroups
  // explicitly contains a model that is NOT 'Kodiak 450'.
  //
  const isKodiak = useMemo(
    () => !filterGroupsState.some(g => {
      // New multi-select: check models[] array first
      if (g.filters.models?.length) {
        return g.filters.models.some(m => m !== 'Kodiak 450');
      }
      // Legacy single-value fallback
      return g.filters.model && g.filters.model !== 'Kodiak 450';
    }),
    [filterGroupsState],
  );

  // ── Blue demo reveal gate ──────────────────────────────────────────────────
  // BLUE_GEN_ANGLES are revealed only AFTER:
  //   1. A background image has been uploaded (bgUrl set), AND
  //   2. The fake-compositing overlay animation has completed.
  // This ensures the user always sees the loading feedback before the vehicle
  // images appear — regardless of whether BG was uploaded before or after
  // the VINs were selected.
  const [revealBluePreview, setRevealBluePreview] = useState(false);

  // Reset whenever the background changes — overlay must re-run for any new BG
  useEffect(() => {
    setRevealBluePreview(false);
  }, [bgUrl]);

  // Stable callback to avoid infinite re-renders in VinsAppliedTab
  const handleFilterGroupsChange = useCallback((groups: Array<{ filters: VinFilters }>) => {
    setFilterGroupsState(groups);
  }, []);

  const bgFileRef      = useRef<HTMLInputElement>(null);
  const overlayFileRef = useRef<HTMLInputElement>(null);

  const displayName = configName.trim() || 'New Global AI Config';

  // ── File helpers ──
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bgUrl) URL.revokeObjectURL(bgUrl);
    setBgUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearBg = useCallback(() => {
    if (bgUrl) URL.revokeObjectURL(bgUrl);
    setBgUrl(null);
  }, [bgUrl]);

  const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (overlayUrl) URL.revokeObjectURL(overlayUrl);
    setOverlayUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearOverlay = useCallback(() => {
    if (overlayUrl) URL.revokeObjectURL(overlayUrl);
    setOverlayUrl(null);
  }, [overlayUrl]);

  // ── Generate background via Replicate — triggered by Send button ──────────
  const handleGenerateBg = useCallback(async () => {
    if (!prompt.trim() || isGeneratingBg) return;

    genAbortRef.current?.abort();
    const abort = new AbortController();
    genAbortRef.current = abort;

    setGenError(null);
    setIsGeneratingBg(true);

    try {
      const url = await generateImage({
        prompt: prompt.trim(),
        modelId: aiModel,
        signal: abort.signal,
      });
      setBgUrl(url);
    } catch (err) {
      if ((err as Error).message !== 'aborted') {
        setGenError((err as Error).message ?? 'Generation failed');
      }
    } finally {
      setIsGeneratingBg(false);
    }
  }, [prompt, aiModel, isGeneratingBg]);

  // ── Generate all 6 angle images via Replicate ─────────────────────────────
  //
  // TWO FLOWS depending on selected vehicle:
  //
  // A) KODIAK 450 (isKodiak=true) — Flux Kontext compositing demo:
  //    Each angle uses its own vehicle cutout PNG as inputImage.
  //    Flux takes the vehicle image and replaces the background with the
  //    user's scene prompt. Result: 6 real composites (vehicle + generated BG).
  //
  // B) OTHER VEHICLES — standard scene generation:
  //    Calls generateAllAngles with the user prompt + vehicle description embedded.
  //    Uses uploaded/generated bgUrl as inputImage if available.
  //
  const handleGenerateImages = useCallback(async () => {
    if (isGeneratingImgs || isGeneratingBg) return;

    genImgAbortRef.current?.abort();
    const abort = new AbortController();
    genImgAbortRef.current = abort;
    setIsGeneratingImgs(true);
    setGenImgCompleted(0);
    setGeneratedAngles(Array(6).fill(null));
    setGenError(null);

    try {
      if (isKodiak) {
        // ── FLOW A: Kodiak — Flux Kontext cutout → background replacement ──────
        //
        // HOW IT WORKS:
        //   Each angle's vehicle cutout PNG is converted to a JPEG with a WHITE
        //   background (RGBA α-channel → opaque white fill, then JPEG-encoded).
        //   This white-background JPEG is sent as inputImage to Flux Kontext Pro.
        //
        //   Flux Kontext is a semantic image editor: give it a subject on a plain
        //   background + "change background to X" and it replaces the background
        //   while preserving the subject exactly. This is its primary use case.
        //
        //   A composite approach (bg + vehicle pre-pasted) was attempted but is
        //   unreliable: Flux sees a rough overlay and may remove the vehicle while
        //   "cleaning up" the image. The cutout approach removes that ambiguity.
        //
        //   bgUrl is intentionally NOT used as inputImage. An uploaded or
        //   generated background image serves only as context for the prompt;
        //   the subject preservation lock comes from the per-angle cutout.
        //
        // PROMPT STRUCTURE (per Flux Kontext official prompting guide):
        //   1. Clear edit command: "Change the background to [scene]."
        //   2. Explicit position lock: "Keep the ATV in the exact same position,
        //      scale, and camera angle."
        //   3. Edit scope: "Only replace the white background behind the ATV."
        //   4. Subject identity: KODIAK_VEHICLE_GUARD (color, body, decals).
        //
        const scenePart = prompt.trim();

        // Library prompts start with "Replace the background with" →
        // convert to Flux Kontext canonical editing form "Change the background to".
        // Custom text → wrap as "Change the background to [text]."
        // Empty → generic outdoor fallback.
        const sceneDescription = scenePart
          ? scenePart
              .replace(/^replace the background with\b/i, 'Change the background to')
              .trim()
          : 'Change the background to a professional outdoor adventure scene, rugged terrain, natural lighting, photorealistic, 35mm full-frame';

        // Flux Kontext official best practice: be explicit about what does NOT change.
        // "Only replace the white background" scopes the edit to the background only.
        const fluxPrompt =
          `${sceneDescription}. ` +
          `Keep the Yamaha Kodiak 450 ATV in the exact same position, scale, and camera angle. ` +
          `Only replace the white background behind the ATV. ` +
          `${KODIAK_VEHICLE_GUARD}`;

        // Pre-convert all 6 vehicle cutouts to white-background JPEGs.
        // The RGBA PNGs have transparent backgrounds; assetToDataUrl fills them
        // white before JPEG encoding so Flux receives "vehicle on white background"
        // — the canonical format for Flux Kontext background replacement.
        // All 6 run in parallel to minimise wait before API calls start.
        let cutoutDataUrls: string[];
        try {
          cutoutDataUrls = await Promise.all(
            KODIAK_SOURCE_ANGLES.map(url => assetToDataUrl(url)),
          );
        } catch (encErr) {
          throw new Error(`Could not encode vehicle image: ${(encErr as Error).message}`);
        }

        // Generate all 6 angles + a background-only thumbnail in parallel.
        // The bg thumbnail is a pure text-to-image (no vehicle) used as the
        // DataGrid parent row thumbnail so the landscape is shown without the ATV.
        const bgThumbnailTask = generateImage({
          prompt:  sceneDescription,   // same scene, no vehicle guard
          modelId: aiModel,
          signal:  abort.signal,
        }).then(url => setBgThumbnail(url)).catch(() => { /* non-critical */ });

        await Promise.all([
          ...cutoutDataUrls.map(async (cutoutDataUrl, i) => {
            // Stagger launch: 0, 300, 600 … 1500 ms — prevents simultaneous burst
            // that can trigger Replicate's concurrent-prediction rate limit.
            if (i > 0) {
              await new Promise<void>((resolve, reject) => {
                const t = setTimeout(resolve, i * 300);
                abort.signal.addEventListener('abort', () => { clearTimeout(t); reject(new Error('aborted')); }, { once: true });
              });
            }
            if (abort.signal.aborted) return;

            const attempt = () => generateImage({
              prompt:     fluxPrompt,
              modelId:    aiModel,
              inputImage: cutoutDataUrl,
              signal:     abort.signal,
            });

            try {
              const url = await attempt();
              setGeneratedAngles(prev => {
                const next = prev ? [...prev] : Array(6).fill(null);
                next[i] = url;
                return next;
              });
              setGenImgCompleted(c => c + 1);
            } catch (err) {
              const msg = (err as Error).message;
              if (msg === 'aborted') { setGenImgCompleted(c => c + 1); return; }
              // Retry once after 3 s for transient failures (rate limit / network)
              try {
                await new Promise<void>((resolve, reject) => {
                  const t = setTimeout(resolve, 3000);
                  abort.signal.addEventListener('abort', () => { clearTimeout(t); reject(new Error('aborted')); }, { once: true });
                });
                if (abort.signal.aborted) { setGenImgCompleted(c => c + 1); return; }
                const url = await attempt();
                setGeneratedAngles(prev => {
                  const next = prev ? [...prev] : Array(6).fill(null);
                  next[i] = url;
                  return next;
                });
                setGenImgCompleted(c => c + 1);
              } catch (retryErr) {
                setGenImgCompleted(c => c + 1);
                if ((retryErr as Error).message !== 'aborted') {
                  console.warn(`Kodiak angle ${i} failed after retry:`, (retryErr as Error).message);
                  setGenError(`Angle ${i + 1} failed: ${(retryErr as Error).message}`);
                }
              }
            }
          }),
          bgThumbnailTask,
        ]);
      } else {
        // ── FLOW B: Other vehicles — embed vehicle description in prompt ─────
        const scenePart   = prompt.trim();
        const vehiclePart = vehicleDesc ? `, featuring a ${vehicleDesc} parked in the scene` : '';
        const basePrompt  = scenePart
          ? `${scenePart}${vehiclePart}`
          : vehicleDesc
            ? `Professional vehicle photography, ${vehicleDesc} parked in an automotive studio scene`
            : 'Professional automotive photography scene';
        const sizeGuard   = 'The vehicle must occupy 58% of the image width with proportional height.';
        const finalPrompt = `${basePrompt}. ${sizeGuard}`;

        await generateAllAngles({
          prompt:     finalPrompt,
          modelId:    aiModel,
          inputImage: bgUrl ?? undefined,
          signal:     abort.signal,
          onAngleStart: () => {},
          onAngleComplete: (index, url) => {
            setGeneratedAngles(prev => {
              const next = prev ? [...prev] : Array(6).fill(null);
              next[index] = url;
              return next;
            });
            setGenImgCompleted(c => c + 1);
          },
        });
      }
    } catch (err) {
      if ((err as Error).message !== 'aborted') {
        setGenError((err as Error).message ?? 'Generation failed');
      }
    } finally {
      setIsGeneratingImgs(false);
    }
  }, [prompt, vehicleDesc, isKodiak, aiModel, bgUrl, isGeneratingImgs, isGeneratingBg]);

  // ── Generate a single angle (Edit flow) ───────────────────────────────────
  // Called when the user clicks Edit on an angle chip, writes a new prompt,
  // then presses Send. Replaces only that angle's image; saves the old one as
  // "Previous Version" so the user can compare before/after in the modal.
  const handleGenerateSingleAngle = useCallback(async () => {
    if (editingAngleIndex === null || isEditingAngle || isGeneratingBg) return;

    editAngleAbortRef.current?.abort();
    const abort = new AbortController();
    editAngleAbortRef.current = abort;
    setIsEditingAngle(true);
    setGenError(null);

    try {
      const scenePart = prompt.trim();
      const sceneDescription = scenePart
        ? scenePart.replace(/^replace the background with\b/i, 'Change the background to').trim()
        : 'Change the background to a professional outdoor adventure scene, rugged terrain, natural lighting, photorealistic, 35mm full-frame';

      const fluxPrompt =
        `${sceneDescription}. ` +
        `Keep the Yamaha Kodiak 450 ATV in the exact same position, scale, and camera angle. ` +
        `Only replace the white background behind the ATV. ` +
        `The vehicle must occupy 58% of the image width with proportional height. ` +
        `${KODIAK_VEHICLE_GUARD}`;

      const cutoutDataUrl = await assetToDataUrl(KODIAK_SOURCE_ANGLES[editingAngleIndex]);

      // Store the current image as "previous version" BEFORE generating
      setPreviousAngles(prev => {
        const next = prev ? [...prev] : Array(6).fill(null);
        next[editingAngleIndex] = generatedAngles?.[editingAngleIndex] ?? null;
        return next;
      });

      const url = await generateImage({
        prompt:     fluxPrompt,
        modelId:    aiModel,
        inputImage: cutoutDataUrl,
        signal:     abort.signal,
      });

      setGeneratedAngles(prev => {
        const next = prev ? [...prev] : Array(6).fill(null);
        next[editingAngleIndex] = url;
        return next;
      });

      // Exit edit mode on success
      setEditingAngleIndex(null);
    } catch (err) {
      if ((err as Error).message !== 'aborted') {
        setGenError((err as Error).message ?? 'Generation failed');
      }
    } finally {
      setIsEditingAngle(false);
    }
  }, [editingAngleIndex, isEditingAngle, isGeneratingBg, prompt, aiModel, generatedAngles]);

  // ── Save ──
  const handleSave = () => {
    const modelLabel = AI_MODELS.find(m => m.id === aiModel)?.label ?? aiModel;

    const savedFormState: SavedFormState = {
      configName,
      aiConfigActive,
      aiModel,
      seed,
      prompt,
      productPosition,
      bgUrl,
      overlayUrl,
      vinsCount:      vinsCount || filteredVinsCount,
      filterGroups:   filterGroupsState,
      // Persist generated angles so reopening the saved config shows the vehicle
      genAngles:      generatedAngles?.map(url => url ?? null) ?? undefined,
      sourceAngles:   isKodiak
        ? KODIAK_SOURCE_ANGLES.map(url => url ?? null)
        : BLUE_SOURCE_ANGLES.map(url => url ?? null),
      // Persist previous-version angles so they survive the edit round-trip
      previousAngles: previousAngles ?? undefined,
    };

    const totalVins = vinsCount || filteredVinsCount;

    // Build vinsApplied string from first filter group, or fall back to config name
    const firstFilter = filterGroupsState[0]?.filters;
    const vinsAppliedStr = firstFilter
      ? [
          firstFilter.years?.length  ? firstFilter.years.join(', ')  : firstFilter.year,
          firstFilter.makes?.length  ? firstFilter.makes.join(', ')  : firstFilter.make,
          firstFilter.models?.length ? firstFilter.models.join(', ') : firstFilter.model,
          firstFilter.trims?.length  ? firstFilter.trims.join(', ')  : firstFilter.trim,
          firstFilter.colors?.length ? firstFilter.colors.join(', ') : firstFilter.color,
        ]
          .filter(v => v !== undefined && v !== null && v !== '')
          .map(String)
          .join(' · ')
      : (configName.trim() || 'New Global AI Config');

    // ── Build vehicleGroups for DataGrid child row ──────────────────────────
    // Only populated when VINs have been selected (filter groups exist).
    // Key order matches AngleKey: 34l, front, 34r, right, left, rear
    const ANGLE_KEYS: AngleKey[] = ['34l', 'front', '34r', 'right', 'left', 'rear'];
    const hasSelectedVins = (vinsCount > 0 || filteredVinsCount > 0 || filterGroupsState.length > 0);

    let vehicleGroups: AIConfigRecord['vehicleGroups'];

    if (hasSelectedVins) {
      if (isKodiak) {
        // Kodiak — use real generated composites when available, fall back to source cutouts
        const angles = Object.fromEntries(
          ANGLE_KEYS.map((key, i) => [key, (generatedAngles?.[i] ?? KODIAK_SOURCE_ANGLES[i]) ?? null]),
        ) as Record<AngleKey, string | null>;
        const sourceAngs = Object.fromEntries(
          ANGLE_KEYS.map((key, i) => [key, KODIAK_SOURCE_ANGLES[i] ?? null]),
        ) as Record<AngleKey, string | null>;
        const prevAngs = previousAngles
          ? (Object.fromEntries(
              ANGLE_KEYS.map((key, i) => [key, previousAngles[i] ?? null]),
            ) as Record<AngleKey, string | null>)
          : undefined;
        vehicleGroups = [{
          ...KODIAK_VEHICLE_GROUP,
          id:             `kodiak-vg-${Date.now()}`,
          angles,
          sourceAngles:   sourceAngs,
          previousAngles: prevAngs,
          // Thumbnail: source cutout (without background) — shows clean vehicle in DataGrid child row
          thumbnail:      KODIAK_SOURCE_ANGLES[0],
        }];
      } else {
        // Blue demo — BLUE_VEHICLE_GROUP already has all 6 angles + thumbnail
        vehicleGroups = [BLUE_VEHICLE_GROUP];
      }
    }

    const newRecord: AIConfigRecord = {
      id:           `config-${Date.now()}`,
      name:         configName.trim() || 'New Global AI Config',
      // Thumbnail = pure background scene (no vehicle) when available,
      // else uploaded/generated background, else empty state fallback.
      // bgThumbnail is generated as a text-to-image alongside the angle generation.
      thumbnail:    bgThumbnail ?? bgUrl ?? emptyStateSvg,
      dimensions:   '1600 × 1200',
      vinsApplied:  vinsAppliedStr,
      vins:         totalVins,
      status:       aiConfigActive ? 'Active' : 'Paused',
      createdAt:    'Just now',
      model:        modelLabel,
      // Expose filterGroups at the record level so DataGrid can render chips
      filterGroups: filterGroupsState.length ? filterGroupsState : undefined,
      // vehicleGroups → DataGrid child row with make/model/trim/color + 6 angles
      vehicleGroups,
      // Store full form state for click-to-edit round-trip
      formState:    savedFormState,
    };
    onSave?.(newRecord);
    onCancel();
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex-none px-6 pt-4 pb-0">

        <div className="mb-2">
          <BreadcrumbBar
            items={[
              { label: 'Settings' },
              { label: 'Global AI Configs', onClick: onCancel },
            ]}
            activeLabel={displayName}
          />
        </div>

        <div className="flex items-center gap-[8px] h-[34px] pb-[9px] pt-[11px] pr-[8px] mb-0">
          {/* Side panel toggle — same icon/style as list-view toolbar */}
          <button
            onClick={onToggleSideSheet}
            title="Toggle side panel"
            className={[
              'p-[5px] rounded-[100px] flex items-center justify-center transition-colors shrink-0',
              isSideSheetOpen
                ? 'text-[#473bab] bg-[rgba(71,59,171,0.08)]'
                : 'text-[rgba(17,16,20,0.56)] hover:bg-[rgba(17,16,20,0.04)]',
            ].join(' ')}
          >
            <span className="size-[20px] flex items-center justify-center">
              <IconGenericLeftPane />
            </span>
          </button>

          <h1 className="font-['Roboto',sans-serif] font-medium text-[16px] leading-[1.5] tracking-[0.15px] text-[#1f1d25] truncate">
            {displayName}
          </h1>

          <div className="flex items-center gap-2 ml-1 shrink-0">
            <button
              onClick={() => setAiConfigActive(v => !v)}
              className="relative w-7 h-4 rounded-full shrink-0 transition-colors cursor-pointer"
              style={{ background: aiConfigActive ? '#473bab' : '#d1d5db' }}
            >
              <span
                className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm"
                style={{ left: aiConfigActive ? '14px' : '2px', transition: 'left 0.2s' }}
              />
            </button>
            <span className="text-[13px] text-[#374151] font-['Roboto'] whitespace-nowrap">
              AI Config Active
            </span>
            <button className="text-[#9c99a9] hover:text-[#686476] transition-colors shrink-0 cursor-pointer">
              <Info size={14} />
            </button>
          </div>
        </div>

        <div className="w-full">
          <TabNavigation
            tabs={EDITOR_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* ── Body ── */}
      {/* Both panels are always mounted — CSS show/hide preserves internal state
          so VinsAppliedTab keeps its checked VINs when switching tabs, and
          onSelectionChange(0) never fires on remount, keeping the trigger alive. */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* Parameters panel */}
        <div className={activeTab === 'parameters' ? 'flex-1 min-h-0 flex flex-col' : 'hidden'}>
          <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">

            {/* ── Left panel — form (40%) ── */}
            <ResizablePanel defaultSize={40} minSize={28} maxSize={58}>
              <div className="h-full overflow-y-auto p-4 flex flex-col gap-4">

                {/* Config Name — disabled while editing an individual angle */}
                <div className="flex flex-col">
                  <OptLabel>Config Name</OptLabel>
                  <input
                    value={configName}
                    onChange={e => setConfigName(e.target.value)}
                    placeholder="New Global AI Config"
                    disabled={editingAngleIndex !== null}
                    className={cn(INPUT_BASE, editingAngleIndex !== null && 'opacity-50 cursor-not-allowed')}
                  />
                </div>

                {/* Two-column accordion grid */}
                <Accordion
                  type="multiple"
                  defaultValue={['background', 'overlay', 'image-creation', 'position']}
                  className="w-full"
                >
                  <div className="grid grid-cols-2 gap-x-3 items-start">

                    {/* ── Left accordion column ── */}
                    <div className="flex flex-col gap-[16px]">

                      {/* Background Image */}
                      <AccordionItem value="background" className={ACC_ITEM}>
                        <AccordionTrigger className={ACC_TRIGGER}>
                          Background Image
                        </AccordionTrigger>
                        <AccordionContent className="px-[16px] pb-[16px] pt-[8px] bg-white">
                          <UploadBlock
                            description={'SVG, PNG or JPG (max. 3MB)\nBackground and mask must have the same dimensions'}
                            fileUrl={bgUrl}
                            onUpload={() => bgFileRef.current?.click()}
                            onClear={clearBg}
                            altText="Background"
                          />
                          <input
                            ref={bgFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleBgUpload}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* Overlay */}
                      <AccordionItem value="overlay" className={ACC_ITEM}>
                        <AccordionTrigger className={ACC_TRIGGER}>
                          Overlay
                        </AccordionTrigger>
                        <AccordionContent className="px-[16px] pb-[16px] pt-[8px] bg-white">
                          <UploadBlock
                            description={'SVG, PNG or JPG (max. 3MB)\nOverlay must match background dimensions'}
                            fileUrl={overlayUrl}
                            onUpload={() => overlayFileRef.current?.click()}
                            onClear={clearOverlay}
                            altText="Overlay"
                          />
                          <input
                            ref={overlayFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleOverlayUpload}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </div>

                    {/* ── Right accordion column ── */}
                    <div className="flex flex-col gap-[16px]">

                      {/* Image Creation */}
                      <AccordionItem value="image-creation" className={ACC_ITEM}>
                        <AccordionTrigger className={ACC_TRIGGER}>
                          Image Creation
                        </AccordionTrigger>
                        <AccordionContent className="px-[16px] pb-[16px] pt-[8px] bg-white">
                          <div className="flex flex-col gap-3">

                            {/* Model */}
                            <div className="flex flex-col">
                              <ReqLabel>Model</ReqLabel>
                              <Select value={aiModel} onValueChange={setAiModel}>
                                <SelectTrigger
                                  className={cn(
                                    INPUT_BASE,
                                    'flex items-center justify-between gap-1 h-auto focus:ring-0 cursor-pointer',
                                  )}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {AI_MODELS.map(m => (
                                    <SelectItem
                                      key={m.id} value={m.id}
                                      className="text-[12px] font-['Roboto'] cursor-pointer"
                                    >
                                      {m.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Seed */}
                            <div className="flex flex-col">
                              <OptLabel>Seed</OptLabel>
                              <input
                                type="number"
                                value={seed}
                                onChange={e => setSeed(e.target.value)}
                                placeholder="Random"
                                className={INPUT_BASE}
                              />
                            </div>

                            {/* Prompt */}
                            <div className="rounded-[16px] shadow-[0px_2px_1px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.12)] overflow-hidden">
                              <Textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="Describe the scene…"
                                className="min-h-[80px] border-0 focus-visible:ring-0 resize-none text-[12px] font-normal font-['Roboto'] tracking-[0.17px] text-[#1f1d25] placeholder:text-[#9c99a9] rounded-none px-3 py-2.5 bg-white"
                              />
                              <div className="flex items-center gap-1 px-2 py-1.5 border-t border-[rgba(0,0,0,0.12)] bg-[#f9fafa]">
                                <button className="w-[26px] h-[26px] rounded-full border border-[rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-[rgba(17,16,20,0.04)] transition-colors text-[rgba(17,16,20,0.56)] cursor-pointer">
                                  <Paperclip size={12} />
                                </button>
                                <button
                                  onClick={() => setPromptLibOpen(true)}
                                  className="w-[26px] h-[26px] rounded-full border border-[rgba(0,0,0,0.12)] flex items-center justify-center hover:bg-[rgba(17,16,20,0.04)] transition-colors text-[rgba(17,16,20,0.56)] hover:text-[#473bab] cursor-pointer"
                                  title="Prompt Library"
                                >
                                  <BookOpen size={12} />
                                </button>
                                <div className="flex-1" />
                                {/* Send button */}
                                <button
                                  onClick={
                                    editingAngleIndex !== null
                                      ? handleGenerateSingleAngle
                                      : isKodiak
                                        ? handleGenerateImages
                                        : handleGenerateBg
                                  }
                                  disabled={
                                    prompt.length < 10 ||
                                    isEditingAngle ||
                                    isGeneratingImgs ||
                                    isGeneratingBg
                                  }
                                  className={cn(
                                    'w-[26px] h-[26px] rounded-full border flex items-center justify-center transition-colors',
                                    (prompt.length >= 10 && !isEditingAngle && !isGeneratingImgs && !isGeneratingBg)
                                      ? 'border-[#473bab] bg-[#473bab] text-white hover:bg-[#3c3192] cursor-pointer'
                                      : 'border-[rgba(0,0,0,0.12)] text-[#9c99a9] cursor-not-allowed',
                                  )}
                                >
                                  <SendHorizonal size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Product Image Position */}
                      <AccordionItem value="position" className={ACC_ITEM}>
                        <AccordionTrigger className={ACC_TRIGGER}>
                          Product Image Position
                        </AccordionTrigger>
                        <AccordionContent className="px-[16px] pb-[16px] pt-[8px] bg-white">
                          <div className="grid grid-cols-3 gap-2">
                            {(['x', 'y', 'width'] as const).map(field => (
                              <div key={field} className="flex flex-col">
                                <ReqLabel>
                                  {field === 'width' ? 'Width' : field.toUpperCase()}
                                </ReqLabel>
                                <input
                                  type="number"
                                  value={productPosition[field]}
                                  onChange={e =>
                                    setProductPosition(prev => ({
                                      ...prev,
                                      [field]: Number(e.target.value),
                                    }))
                                  }
                                  className={INPUT_BASE}
                                />
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </div>
                  </div>
                </Accordion>
              </div>
            </ResizablePanel>

            {/* Divider */}
            <ResizableHandle className="!w-[6px] bg-[#e2e4e9] hover:bg-[#6356e1] data-[resize-handle-active]:bg-[#6356e1] transition-colors cursor-col-resize [&>div]:hidden" />

            {/* ── Right panel — preview (60%) ── */}
            <ResizablePanel defaultSize={60} minSize={36}>
              <div className="h-full p-4 flex flex-col min-h-0">
                <PreviewPanel
                  bgUrl={bgUrl}
                  hasVinsSelected={vinsCount > 0 || filteredVinsCount > 0 || !!initialData}
                  onRequestUpload={() => bgFileRef.current?.click()}
                  initialDone={!!initialData?.bgUrl}
                  // ── angleImages priority ──────────────────────────────────────
                  // 1. Static (edit) records    → their own saved genAngles
                  // 2. Real generated angles    → only shown AFTER generation completes
                  //    (null while isGeneratingImgs=true so overlay covers a blank slate)
                  // 3. Kodiak 450               → null (empty until Flux generates results)
                  // 4. Blue demo (non-Kodiak)   → BLUE_GEN_ANGLES only after:
                  //      • bgUrl is set (background uploaded), AND
                  //      • overlay animation has completed (revealBluePreview=true)
                  // 5. No VINs / no BG yet     → null (EmptyState)
                  angleImages={
                    initialData?.isStaticRecord
                      ? (initialData.genAngles ?? null)
                      : (generatedAngles !== null && !isGeneratingImgs)
                        ? generatedAngles
                        // Fallback: reopening a saved config that has genAngles stored
                        : initialData?.genAngles
                          ? initialData.genAngles
                          : isKodiak
                            ? null
                            : (revealBluePreview && (vinsCount > 0 || filteredVinsCount > 0 || (!!initialData && !initialData.isStaticRecord)))
                              ? BLUE_GEN_ANGLES
                              : null
                  }
                  sourceAngles={
                    // isKodiak determines which vehicle is active — always wins over stored data
                    isKodiak
                      ? (initialData?.isStaticRecord
                          ? (initialData.sourceAngles ?? KODIAK_SOURCE_ANGLES)
                          : KODIAK_SOURCE_ANGLES)
                      : BLUE_SOURCE_ANGLES  // Raptor 700R — always use Blue cutouts
                  }
                  previousAngles={
                    initialData?.isStaticRecord
                      ? (initialData.previousAngles ?? null)
                      : previousAngles
                  }
                  isGeneratingBg={isGeneratingBg}
                  isGeneratingImgs={isGeneratingImgs}
                  genImgCompleted={genImgCompleted}
                  modelLabel={AI_MODELS.find(m => m.id === aiModel)?.label ?? 'Flux Kontext Pro'}
                  onOverlayComplete={() => {
                    if (!isKodiak) setRevealBluePreview(true);
                  }}
                  isKodiakFlow={isKodiak}
                  onPreviewClick={
                    // Angle-edit mode wins over normal generation
                    editingAngleIndex !== null
                      ? handleGenerateSingleAngle
                      : isKodiak
                        ? handleGenerateImages
                        : undefined
                  }
                  editingAngleIndex={editingAngleIndex}
                  onEditAngle={setEditingAngleIndex}
                  onCancelEdit={() => setEditingAngleIndex(null)}
                  vinList={vinList}
                  selectedVinIndex={selectedVinIndex}
                  onVinChange={setSelectedVinIndex}
                  isGeneratingSingleAngle={isEditingAngle}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* VINs Applied panel — always mounted, preserves checked state */}
        <div className={activeTab === 'vins-applied' ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : 'hidden'}>
          <VinsAppliedTab
            onSelectionChange={setVinsCount}
            onFilteredCountChange={setFilteredVinsCount}
            initialFilterGroups={filterGroupsState.length ? filterGroupsState : undefined}
            onFilterGroupsChange={handleFilterGroupsChange}
          />
        </div>

        {/* ── Footer ── */}
        <div className="flex-none flex items-center justify-end gap-2 px-6 py-3 border-t border-[rgba(0,0,0,0.12)] bg-white shrink-0">
          {/* Generation error — pushed to left */}
          {genError && (
            <span className="text-[11px] text-[#d2323f] font-['Roboto'] mr-auto">
              {genError}
            </span>
          )}
          <button
            onClick={onCancel}
            className="h-9 px-[18px] rounded-full border-[1.5px] border-[#6356e1] text-[13px] font-medium text-[#473bab] font-['Roboto'] hover:bg-[#473bab]/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="h-9 px-[18px] rounded-full border-[1.5px] border-[#6356e1] text-[13px] font-medium text-[#473bab] font-['Roboto'] hover:bg-[#473bab]/5 transition-colors cursor-pointer"
          >
            Save
          </button>
          {/* Generate AI Images — last button, only on new/edit (not static demo records) */}
          {!initialData?.isStaticRecord && (
            <button
              onClick={handleGenerateImages}
              disabled={isGeneratingImgs || isGeneratingBg || (!bgUrl && prompt.trim().length < 10 && !vehicleDesc)}
              className={cn(
                "h-9 px-[18px] rounded-full text-[13px] font-medium font-['Roboto'] transition-colors flex items-center gap-1.5",
                !isGeneratingImgs && !isGeneratingBg && (bgUrl || prompt.trim().length >= 10 || vehicleDesc)
                  ? 'bg-[#473bab] text-white hover:bg-[#3c3192] cursor-pointer'
                  : 'bg-[#473bab]/40 text-white cursor-not-allowed',
              )}
            >
              {isGeneratingImgs && <Loader2 size={13} className="animate-spin" />}
              Generate AI Images
            </button>
          )}
        </div>
      </div>

      <PromptLibraryModal
        open={promptLibOpen}
        onClose={() => setPromptLibOpen(false)}
        onInsert={p => setPrompt(p)}
      />
    </div>
  );
}
