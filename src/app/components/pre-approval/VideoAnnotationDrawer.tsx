'use client';

import { createPortal } from 'react-dom';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
  Sparkles, Pencil, ChevronDown, ChevronUp, MinusCircle, PlusCircle,
  CheckCircle2, CirclePlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkflowDocument } from '@/app/contexts/WorkflowContext';
import { useWorkflow } from '@/app/contexts/WorkflowContext';
import { AnnotationPin } from './AnnotationPin';
import { InteractiveAnnotation } from './InteractiveAnnotation';
import { ScrollerAnnotations, AnnotationItem } from './ScrollerAnnotations';
import { PreApprovalForm } from './PreApprovalForm';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoAnnotation {
  id: string;
  timestamp: number;
  xPct: number;
  yPct: number;
  /** 2-char CATA code e.g. "3A", "1D" */
  cataCode: string;
  title: string;
  description: string;
  included: boolean;
}

interface VideoFrame {
  left: number;
  top: number;
  width: number;
  height: number;
}

// ─── Temporal visibility window for canvas pins ────────────────────────────────
// A pin is shown on the canvas only when the player is within this many
// seconds of the annotation's timestamp (before or after).
const VISIBILITY_WINDOW_SEC = 2;

// ─── Auto-annotation seeds ────────────────────────────────────────────────────
// Pins are clustered in the latter half of the video (50 – 90 % of duration)
// where pricing, offer and disclaimer text typically appears in car commercials.
// The first half (action shots, no text) is intentionally left clean.

function buildAutoAnnotations(duration: number): VideoAnnotation[] {
  if (!duration || duration <= 0) return [];
  const d = duration;
  return [
    // ~50 % — offer / price overlay appears (center of screen)
    {
      id: uid(), timestamp: d * 0.50, xPct: 48, yPct: 40,
      cataCode: '3A', title: 'Background Colors',
      description: 'Must adhere to Primary & Secondary brand color palettes. The background must not include any design elements.',
      included: true,
    },
    // ~60 % — secondary price text (left-center)
    {
      id: uid(), timestamp: d * 0.60, xPct: 26, yPct: 54,
      cataCode: '1D', title: 'Font Types',
      description: 'Volkswagen approved fonts must be used across all assets. VW Head Light, VW Head Regular, VW Head Bold, VW Head Extra Bold, VW Text.',
      included: true,
    },
    // ~70 % — logo / brand badge (upper-right)
    {
      id: uid(), timestamp: d * 0.70, xPct: 74, yPct: 18,
      cataCode: '3A', title: 'Logo Protection',
      description: 'The VW logo has a protected zone. Design elements or type must not intrude on this zone. The protected zone is equal to half of the logo diameter on all sides.',
      included: false,
    },
    // ~80 % — deal-days / promo graphic (center)
    {
      id: uid(), timestamp: d * 0.80, xPct: 53, yPct: 58,
      cataCode: '2D', title: 'Assets',
      description: 'Assets may not contain graphics or unauthorized design elements outside of VW brand guidelines.',
      included: true,
    },
    // ~90 % — fine-print disclaimer text (lower third)
    {
      id: uid(), timestamp: d * 0.90, xPct: 50, yPct: 80,
      cataCode: '2D', title: 'Protected Area',
      description: 'Logos must respect the protected area defined in the brand definition guidelines.',
      included: true,
    },
  ].sort((a, b) => a.timestamp - b.timestamp);
}

// ─── CATA codes ───────────────────────────────────────────────────────────────

const CATA_CODES = [
  { code: '1A', title: 'Brand Identity',        description: 'Brand identity elements must follow VW specifications' },
  { code: '1B', title: 'Logo Usage',            description: 'VW logo must be used in approved form and placement' },
  { code: '1C', title: 'Color Palette',         description: 'Only Primary & Secondary brand colors may be used' },
  { code: '1D', title: 'Font Types',            description: 'VW approved fonts only: VW Head Light, Regular, Bold, Extra Bold, Text' },
  { code: '2A', title: 'Imagery Standards',     description: 'Only approved lifestyle or vehicle photography' },
  { code: '2B', title: 'Video Standards',       description: 'Video must meet VW motion guidelines' },
  { code: '2C', title: 'Asset Quality',         description: 'Assets must meet minimum resolution and quality' },
  { code: '2D', title: 'Assets',                description: 'Assets may not contain unauthorized graphics' },
  { code: '3A', title: 'Background Colors',     description: 'Must adhere to Primary & Secondary brand palettes; no design elements in background' },
  { code: '3B', title: 'Logo Protection',       description: 'Protected zone equal to half the logo diameter on all sides' },
  { code: '3C', title: 'Disclaimer Missing',    description: 'Required pricing or offer disclaimer must be present' },
  { code: '3D', title: 'Legal Text',            description: 'Mandatory legal copy must be present and legible' },
  { code: '4A', title: 'Unauthorized Claims',   description: 'Superiority or unsubstantiated claims are not permitted' },
  { code: '4B', title: 'Competitive Reference', description: 'Unauthorized competitor mention or comparison' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function fmtTimecode(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const totalMs  = Math.round(s * 1000);
  const ms       = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const sec      = totalSec % 60;
  const min      = Math.floor(totalSec / 60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

const FPS = 24;
function toFrames(s: number): number {
  return Math.round(s * FPS);
}

// ─── useVideoThumbnails ───────────────────────────────────────────────────────

const THUMB_COUNT = 16;

function useVideoThumbnails(src: string | undefined, duration: number) {
  const [thumbs,  setThumbs]  = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!src || !duration || duration <= 0) return;
    let cancelled = false;

    setLoading(true);
    setThumbs([]);

    const video    = document.createElement('video');
    video.src      = src;
    video.muted    = true;
    video.preload  = 'metadata';
    video.crossOrigin = 'anonymous';

    const canvas   = document.createElement('canvas');
    canvas.width   = 128;
    canvas.height  = 72;
    const ctx      = canvas.getContext('2d');
    if (!ctx) { setLoading(false); return; }

    const captured: string[] = [];
    const timestamps = Array.from({ length: THUMB_COUNT }, (_, i) => (i / THUMB_COUNT) * duration);
    let idx = 0;

    const seekNext = () => {
      if (cancelled || idx >= timestamps.length) {
        if (!cancelled) { setThumbs([...captured]); setLoading(false); }
        video.src = '';
        return;
      }
      video.currentTime = timestamps[idx];
    };

    const onSeeked = () => {
      if (cancelled) return;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        captured.push(canvas.toDataURL('image/jpeg', 0.5));
      } catch { captured.push(''); }
      setThumbs([...captured]);
      idx++;
      setTimeout(seekNext, 40);
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', () => { if (!cancelled) setLoading(false); });
    video.addEventListener('loadedmetadata', seekNext, { once: true });

    return () => {
      cancelled = true;
      video.removeEventListener('seeked', onSeeked);
      video.src = '';
    };
  }, [src, duration]);

  return { thumbs, loading };
}

// ─── ProcessingOverlay ────────────────────────────────────────────────────────

function ProcessingOverlay({ onSkip }: { onSkip: () => void }) {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 bg-[#111014]/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-5 rounded-[8px]"
    >
      {/* Spinner + Sparkles icon */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-white/10 border-t-[#473BAB] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#473BAB]" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center px-6">
        <p className="text-white text-[15px] font-semibold font-['Roboto']">
          AI analyzing video{'.'.repeat(dot)}
        </p>
        <p className="text-white/50 text-[11px] mt-1 leading-relaxed font-['Roboto'] max-w-[220px]">
          Scanning frames for brand compliance violations and CATA code matches
        </p>
      </div>

      {/* Skip button */}
      <button
        onClick={onSkip}
        className="px-5 py-1.5 rounded-full border border-white/20 text-white/70 text-[12px] font-medium font-['Roboto'] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
      >
        Skip analysis
      </button>
    </motion.div>
  );
}

// ─── PinModal ─────────────────────────────────────────────────────────────────

interface PinModalProps {
  timestamp: number;
  onConfirm: (cataCode: string, title: string, description: string) => void;
  onCancel: () => void;
}

function PinModal({ timestamp, onConfirm, onCancel }: PinModalProps) {
  const [selectedCode, setSelectedCode] = useState(CATA_CODES[0].code);
  const [notes, setNotes] = useState('');
  const selected = CATA_CODES.find(c => c.code === selectedCode)!;

  return (
    <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center rounded-[8px]">
      <div className="bg-white rounded-2xl shadow-2xl w-[340px] p-5 mx-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-4 w-4 items-center justify-center bg-[#EF5350] p-[4px] rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0">
            <span className="text-[10px] font-normal text-white font-['Roboto']">!</span>
          </div>
          <h3 className="text-[14px] font-semibold text-[#1f1d25] font-['Roboto']">Add Compliance Annotation</h3>
        </div>
        <p className="text-[11px] text-[#9C99A9] mb-4 ml-6 font-['Roboto']">
          At <strong className="text-[#686576]">{fmtTimecode(timestamp)}</strong>
          <span className="text-[#9C99A9]"> ({toFrames(timestamp)} Frames)</span>
        </p>

        <label className="block text-[11px] font-medium text-[#686576] mb-1.5 font-['Roboto']">Violation Type</label>
        <select
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
          className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 text-[12px] text-[#1f1d25] focus:outline-none focus:border-[#473BAB] mb-3 bg-white cursor-pointer"
        >
          {CATA_CODES.map(c => (
            <option key={c.code} value={c.code}>{c.code} — {c.title}</option>
          ))}
        </select>

        <label className="block text-[11px] font-medium text-[#686576] mb-1.5 font-['Roboto']">
          Notes <span className="font-normal text-[#9C99A9]">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={selected.description}
          rows={2}
          className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 text-[12px] text-[#1f1d25] placeholder:text-[#9C99A9] resize-none focus:outline-none focus:border-[#473BAB] transition-colors mb-4"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-full text-[12px] font-medium text-[#686576] hover:bg-gray-100 transition-colors cursor-pointer font-['Roboto']">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected.code, selected.title, notes.trim() || selected.description)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#473BAB] text-white text-[12px] font-medium hover:bg-[#3c31a0] transition-colors cursor-pointer font-['Roboto']"
          >
            <CirclePlus className="w-3.5 h-3.5" />
            Add Pin
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TimelineRuler ────────────────────────────────────────────────────────────

const RULER_SEGMENTS = 4;   // 5 labels: 0, 25%, 50%, 75%, 100%
const MINOR_PER_SEG  = 9;   // 9 minor ticks between each major

interface RulerProps {
  duration: number;
  currentTime: number;
  annotations: VideoAnnotation[];
  onSeek: (t: number) => void;
  onHoverPin: (id: string | null) => void;
}

function TimelineRuler({ duration, currentTime, annotations, onSeek, onHoverPin }: RulerProps) {
  const totalFrames = toFrames(duration);
  const progress    = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  };

  return (
    <div
      className="relative w-full cursor-pointer select-none"
      style={{ height: 28 }}
      onClick={handleClick}
    >
      {/* Major ticks + labels */}
      {Array.from({ length: RULER_SEGMENTS + 1 }, (_, i) => {
        const pct    = (i / RULER_SEGMENTS) * 100;
        const frames = Math.round((i / RULER_SEGMENTS) * totalFrames);
        return (
          <div key={i} className="absolute top-0 flex flex-col items-start" style={{ left: `${pct}%` }}>
            <div className="w-px bg-[rgba(0,0,0,0.25)]" style={{ height: 16 }} />
            <span
              className="text-[10px] text-[#686576] leading-none font-['Roboto'] whitespace-nowrap"
              style={{ marginTop: 2, transform: i === RULER_SEGMENTS ? 'translateX(-100%)' : i === 0 ? 'none' : 'translateX(-50%)' }}
            >
              {frames}
            </span>
          </div>
        );
      })}

      {/* Minor ticks */}
      {Array.from({ length: RULER_SEGMENTS }, (_, seg) =>
        Array.from({ length: MINOR_PER_SEG }, (_, tick) => {
          const pct = ((seg + (tick + 1) / (MINOR_PER_SEG + 1)) / RULER_SEGMENTS) * 100;
          return (
            <div
              key={`${seg}-${tick}`}
              className="absolute top-0 w-px bg-[rgba(0,0,0,0.12)]"
              style={{ left: `${pct}%`, height: 7 }}
            />
          );
        })
      )}

      {/* Annotation pins at timestamp positions */}
      {annotations.map((ann, i) => {
        const pct = duration > 0 ? (ann.timestamp / duration) * 100 : 0;
        return (
          <div
            key={ann.id}
            className="absolute"
            style={{ left: `${pct}%`, top: 0, transform: 'translateX(-50%)', zIndex: 5 }}
            onMouseEnter={() => onHoverPin(ann.id)}
            onMouseLeave={() => onHoverPin(null)}
            onClick={(e) => { e.stopPropagation(); onSeek(ann.timestamp); }}
          >
            <AnnotationPin
              number={i + 1}
              direction="bottom-right"
              delay={0}
            />
          </div>
        );
      })}

      {/* Playhead */}
      {duration > 0 && (
        <div
          className="absolute top-0 bottom-0 w-px bg-[#473BAB] pointer-events-none"
          style={{ left: `${progress}%`, zIndex: 4 }}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface VideoAnnotationDrawerProps {
  doc: WorkflowDocument;
  onClose: () => void;
}

export function VideoAnnotationDrawer({ doc, onClose }: VideoAnnotationDrawerProps) {
  const { submitPreApproval } = useWorkflow();

  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Video state ─────────────────────────────────────────────────────────
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [isMuted,     setIsMuted]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

  // ── Video frame rect (excludes letterbox, for accurate pin placement) ──
  const [videoFrame, setVideoFrame] = useState<VideoFrame | null>(null);

  const computeVideoFrame = useCallback(() => {
    const video     = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const scale = Math.min(cw / vw, ch / vh);
    setVideoFrame({
      left:   (cw - vw * scale) / 2,
      top:    (ch - vh * scale) / 2,
      width:  vw * scale,
      height: vh * scale,
    });
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener('loadedmetadata', computeVideoFrame);
    window.addEventListener('resize', computeVideoFrame);
    return () => {
      v.removeEventListener('loadedmetadata', computeVideoFrame);
      window.removeEventListener('resize', computeVideoFrame);
    };
  }, [computeVideoFrame]);

  // ── Filmstrip thumbnails ─────────────────────────────────────────────────
  const { thumbs, loading: thumbsLoading } = useVideoThumbnails(doc.url, duration);

  // ── Processing overlay ───────────────────────────────────────────────────
  const [processing,   setProcessing]   = useState(true);
  const [hasSeeded,    setHasSeeded]    = useState(false);

  useEffect(() => {
    processingTimerRef.current = setTimeout(() => setProcessing(false), 3500);
    return () => { if (processingTimerRef.current) clearTimeout(processingTimerRef.current); };
  }, []);

  // Seed auto-annotations once processing ends + duration is known
  useEffect(() => {
    if (!processing && duration > 0 && !hasSeeded) {
      setAnnotations(buildAutoAnnotations(duration));
      setHasSeeded(true);
    }
  }, [processing, duration, hasSeeded]);

  const skipProcessing = () => {
    if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
    setProcessing(false);
    // Seed immediately if duration is already available
    if (duration > 0 && !hasSeeded) {
      setAnnotations(buildAutoAnnotations(duration));
      setHasSeeded(true);
    }
  };

  // ── Submit state (for PreApprovalForm completion) ────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted,  setIsSubmitted]  = useState(false);

  const handleFormDone = (_data: unknown) => {
    setIsSubmitting(true);
    setTimeout(() => {
      submitPreApproval();
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setTimeout(() => setIsSubmitted(false), 500);
      }, 3000);
    }, 1500);
  };

  // ── Annotations ──────────────────────────────────────────────────────────
  const [annotations,  setAnnotations]  = useState<VideoAnnotation[]>([]);
  const [activeAnnId,  setActiveAnnId]  = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);

  // Pin placement flow
  const [pinPlacementMode, setPinPlacementMode] = useState(false);
  const [pendingPin,       setPendingPin]        = useState<{ xPct: number; yPct: number } | null>(null);
  const [showPinModal,     setShowPinModal]       = useState(false);

  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);

  const annotationItems: AnnotationItem[] = sortedAnnotations.map((ann, i) => ({
    id:          ann.id,
    number:      i + 1,
    category:    ann.cataCode,
    title:       ann.title,
    description: ann.description,
    x:           ann.xPct,
    y:           ann.yPct,
    timestamp:   ann.timestamp,
    included:    ann.included,
  }));

  // ── Video controls ───────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    isPlaying ? v.pause() : v.play();
  }, [isPlaying]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const skip = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + delta));
  }, [duration]);

  const seekTo = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration || Infinity, t));
  }, [duration]);

  // ── Timeline ─────────────────────────────────────────────────────────────
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [timelineZoom,      setTimelineZoom]      = useState(1);

  // ── Pin placement ─────────────────────────────────────────────────────────
  const handleVideoAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinPlacementMode || showPinModal || !videoFrame) return;
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const xInContainer = e.clientX - cr.left;
    const yInContainer = e.clientY - cr.top;
    if (
      xInContainer < videoFrame.left || xInContainer > videoFrame.left + videoFrame.width ||
      yInContainer < videoFrame.top  || yInContainer > videoFrame.top  + videoFrame.height
    ) return;
    videoRef.current?.pause();
    setPendingPin({
      xPct: ((xInContainer - videoFrame.left) / videoFrame.width)  * 100,
      yPct: ((yInContainer - videoFrame.top)  / videoFrame.height) * 100,
    });
    setPinPlacementMode(false);
    setShowPinModal(true);
  }, [pinPlacementMode, showPinModal, videoFrame]);

  const handlePinConfirm = (cataCode: string, title: string, description: string) => {
    if (!pendingPin) return;
    const ann: VideoAnnotation = {
      id: uid(), timestamp: currentTime,
      xPct: pendingPin.xPct, yPct: pendingPin.yPct,
      cataCode, title, description, included: true,
    };
    setAnnotations(prev => [...prev, ann].sort((a, b) => a.timestamp - b.timestamp));
    setPendingPin(null);
    setShowPinModal(false);
  };

  const toggleInclude    = (id: string) => setAnnotations(prev => prev.map(a => a.id === id ? { ...a, included: !a.included } : a));
  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (activeAnnId  === id) setActiveAnnId(null);
    if (hoveredPinId === id) setHoveredPinId(null);
  };

  // Hovered pin shows the annotation open on canvas too
  const displayOpenId = hoveredPinId ?? activeAnnId;

  const includedCount = annotations.filter(a => a.included).length;
  const progress      = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showPinModal) return;
      if (e.key === 'Escape') {
        if (pinPlacementMode) { setPinPlacementMode(false); return; }
        onClose();
      }
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowLeft')  skip(-5);
      if (e.key === 'ArrowRight') skip(5);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showPinModal, pinPlacementMode, togglePlay, skip, onClose]);

  // ─────────────────────────────────────────────────────────────────────────────

  return createPortal(
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[10000] flex items-center justify-center isolate">
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#111014]/60 backdrop-blur-sm"
          />

          {/* Modal — same dimensions + style as PreApprovalDrawer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.25 }}
            className="relative flex flex-col w-[95vw] h-[90vh] bg-white rounded-[16px] shadow-2xl overflow-hidden"
          >
            {/* ── Header ── (identical to PreApprovalDrawer) */}
            <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.08)] bg-white z-20">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-[#473BAB]/10 flex items-center justify-center text-[#473BAB]">
                  <CheckCircle2 size={20} />
                </div>
                <h2 className="text-[18px] font-semibold text-[#1F1D25] tracking-tight">Pre-approval Request</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 text-[#111014]/56 transition-colors"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* ── Body ─────────────────────────────────────────────────── */}
            <div className="flex-1 flex min-h-0 relative">

              {/* Left Panel — ScrollerAnnotations */}
              <div className="w-[220px] shrink-0 flex flex-col bg-white">
                {/* Panel header — custom hover tooltip for truncated filename */}
                <div className="px-3 py-3 shrink-0">
                  {/* Tooltip wrapper — relative so tooltip can anchor here */}
                  <div className="relative group">
                    <p className="text-[11px] font-semibold text-[#1F1D25] font-['Roboto'] truncate cursor-default">
                      {doc.name}
                    </p>
                    {/* Custom tooltip: appears below on hover */}
                    <div
                      className="pointer-events-none absolute left-0 top-full mt-1 z-[200]
                                 opacity-0 group-hover:opacity-100
                                 transition-opacity duration-150
                                 bg-[#1F1D25] text-white text-[10px] leading-snug
                                 rounded-md px-2 py-1.5 shadow-lg
                                 max-w-[190px] break-all whitespace-normal"
                    >
                      {doc.name}
                    </div>
                  </div>
                  {annotations.length > 0 && (
                    <p className="text-[10px] text-[#473BAB] mt-0.5 font-medium font-['Roboto']">
                      {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} · {includedCount} in report
                    </p>
                  )}
                </div>

                {/* Scroller — dealer view: timecode only, no Include/Delete (OEM role activates those) */}
                <div className="flex-1 min-h-0">
                  <ScrollerAnnotations
                    annotations={annotationItems}
                    activeId={displayOpenId}
                    onSelect={(id) => {
                      setActiveAnnId(activeAnnId === id ? null : id);
                      const ann = annotations.find(a => a.id === id);
                      if (ann) seekTo(ann.timestamp);
                    }}
                    emptyMessage="No annotations yet"
                    className="h-full w-full rounded-none bg-white"
                  />
                </div>
              </div>

              {/* Center — Video canvas + Timeline */}
              <div className="flex-1 flex flex-col min-w-0 bg-white">

                {/* Pin placement hint */}
                <AnimatePresence>
                  {pinPlacementMode && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex-none bg-[#473BAB] px-4 py-2 text-center text-[12px] text-white font-['Roboto'] shrink-0 flex items-center justify-center gap-3"
                    >
                      <span>Click on the video frame to place the annotation pin</span>
                      <button
                        onClick={() => setPinPlacementMode(false)}
                        className="text-white/70 hover:text-white text-[11px] border border-white/30 px-2 py-0.5 rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Video canvas */}
                <div
                  ref={containerRef}
                  className="flex-1 min-h-0 bg-[#0d0d0d] relative"
                  onClick={handleVideoAreaClick}
                  style={{ cursor: pinPlacementMode ? 'crosshair' : 'default' }}
                >
                  <video
                    ref={videoRef}
                    src={doc.url}
                    className="absolute inset-0 w-full h-full object-contain"
                    onTimeUpdate={() => { const v = videoRef.current; if (v) setCurrentTime(v.currentTime); }}
                    onDurationChange={() => { const v = videoRef.current; if (v?.duration) { setDuration(v.duration); computeVideoFrame(); } }}
                    onLoadedMetadata={() => { const v = videoRef.current; if (v) { setDuration(v.duration || 0); computeVideoFrame(); } }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />

                  {/* InteractiveAnnotation pins — positioned over actual video frame */}
                  {/* Each pin is shown only within ±VISIBILITY_WINDOW_SEC of its timestamp */}
                  {videoFrame && !processing && (
                    <div
                      className="absolute"
                      style={{
                        left:   videoFrame.left,
                        top:    videoFrame.top,
                        width:  videoFrame.width,
                        height: videoFrame.height,
                        pointerEvents: pinPlacementMode ? 'none' : 'auto',
                      }}
                    >
                      <AnimatePresence>
                        {sortedAnnotations.map((ann, i) => {
                          const inWindow =
                            Math.abs(ann.timestamp - currentTime) <= VISIBILITY_WINDOW_SEC;
                          if (!inWindow) return null;
                          return (
                            <motion.div
                              key={ann.id}
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.6 }}
                              transition={{ duration: 0.25, ease: 'easeOut' }}
                              className="absolute inset-0 pointer-events-none"
                              style={{ pointerEvents: 'auto' }}
                            >
                              <InteractiveAnnotation
                                id={ann.id}
                                number={i + 1}
                                category={ann.cataCode}
                                title={ann.title}
                                description={ann.description}
                                x={ann.xPct}
                                y={ann.yPct}
                                isOpen={displayOpenId === ann.id}
                                onToggle={() => {
                                  setHoveredPinId(null);
                                  setActiveAnnId(activeAnnId === ann.id ? null : ann.id);
                                }}
                                direction="bottom-right"
                                delay={0}
                              />
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* Pending pin pulse while modal is open */}
                      {pendingPin && (
                        <div
                          className="absolute rounded-tl-[12px] rounded-tr-[12px] rounded-bl-[12px] animate-ping pointer-events-none"
                          style={{
                            left: `${pendingPin.xPct}%`,
                            top:  `${pendingPin.yPct}%`,
                            width: 16, height: 16,
                            background: 'rgba(239,83,80,0.5)',
                            border: '1px solid #EF5350',
                            transform: 'translate(-50%,-50%)',
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Add Annotation — floating button at bottom-right of canvas */}
                  {!processing && !pinPlacementMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinPlacementMode(true);
                        videoRef.current?.pause();
                      }}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-[rgba(71,59,171,0.4)] text-[#473BAB] text-[12px] font-medium font-['Roboto'] hover:bg-white hover:border-[#473BAB] shadow-sm backdrop-blur-sm transition-all cursor-pointer z-10"
                    >
                      <Pencil className="w-[13px] h-[13px]" />
                      Add Annotation
                    </button>
                  )}

                  {/* Processing overlay */}
                  <AnimatePresence>
                    {processing && <ProcessingOverlay onSkip={skipProcessing} />}
                  </AnimatePresence>

                  {/* Pin modal */}
                  {showPinModal && (
                    <PinModal
                      timestamp={currentTime}
                      onConfirm={handlePinConfirm}
                      onCancel={() => { setPendingPin(null); setShowPinModal(false); }}
                    />
                  )}
                </div>

                {/* ── Timeline Panel ───────────────────────────────────── */}
                <div className="bg-white border-t border-[rgba(0,0,0,0.08)] shrink-0">
                  <div className="flex flex-col gap-[6px] px-[8px] pt-[6px] pb-[6px]">

                    {/* Top bar: controls + timecode + collapse + zoom */}
                    <div className="flex items-center justify-between w-full h-[30px]">

                      {/* Left: play controls + timecode */}
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => skip(-5)} className="p-1 text-[#686576] hover:text-[#1f1d25] transition-colors cursor-pointer">
                          <SkipBack className="w-[16px] h-[16px]" />
                        </button>
                        <button onClick={togglePlay} className="p-1 text-[#686576] hover:text-[#1f1d25] transition-colors cursor-pointer">
                          {isPlaying ? <Pause className="w-[16px] h-[16px]" /> : <Play className="w-[16px] h-[16px]" />}
                        </button>
                        <button onClick={() => skip(5)} className="p-1 text-[#686576] hover:text-[#1f1d25] transition-colors cursor-pointer">
                          <SkipForward className="w-[16px] h-[16px]" />
                        </button>

                        <div className="w-px h-[18px] bg-[rgba(0,0,0,0.12)] mx-1.5" />

                        <span className="text-[11px] text-[#1f1d25] font-['Roboto'] whitespace-nowrap">
                          {fmtTimecode(currentTime)}
                          <span className="text-[#686576]"> ({toFrames(currentTime)} Frames)</span>
                        </span>

                        <div className="w-px h-[18px] bg-[rgba(0,0,0,0.12)] mx-1.5" />

                        <span className="text-[11px] text-[rgba(0,0,0,0.5)] font-['Roboto'] whitespace-nowrap">
                          {fmtTimecode(duration)}
                          <span className="text-[#686576]"> ({toFrames(duration)} Frames)</span>
                        </span>
                      </div>

                      {/* Collapse toggle */}
                      <button
                        onClick={() => setTimelineCollapsed(c => !c)}
                        className="p-1 text-[#686576] hover:text-[#1f1d25] transition-colors cursor-pointer"
                      >
                        {timelineCollapsed
                          ? <ChevronUp   className="w-[16px] h-[16px]" />
                          : <ChevronDown className="w-[16px] h-[16px]" />}
                      </button>

                      {/* Zoom slider */}
                      <div className="flex items-center gap-1 h-[24px]">
                        <button
                          onClick={() => setTimelineZoom(z => Math.max(1, z - 0.5))}
                          className="text-[#686576] hover:text-[#473BAB] transition-colors cursor-pointer disabled:opacity-30"
                          disabled={timelineZoom <= 1}
                        >
                          <MinusCircle className="w-[16px] h-[16px]" />
                        </button>
                        <div className="relative w-[80px] h-full flex items-center">
                          <div className="absolute inset-x-0 h-[2px] rounded-full bg-[#473BAB] opacity-30" />
                          <div
                            className="absolute left-0 h-[2px] rounded-full bg-[#473BAB]"
                            style={{ width: `${((timelineZoom - 1) / 4) * 100}%` }}
                          />
                          <input
                            type="range" min={1} max={5} step={0.1}
                            value={timelineZoom}
                            onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                          />
                          <div
                            className="absolute w-[11px] h-[11px] rounded-full bg-[#473BAB] shadow pointer-events-none"
                            style={{ left: `calc(${((timelineZoom - 1) / 4) * 100}% - 5.5px)` }}
                          />
                        </div>
                        <button
                          onClick={() => setTimelineZoom(z => Math.min(5, z + 0.5))}
                          className="text-[#686576] hover:text-[#473BAB] transition-colors cursor-pointer disabled:opacity-30"
                          disabled={timelineZoom >= 5}
                        >
                          <PlusCircle className="w-[16px] h-[16px]" />
                        </button>
                      </div>
                    </div>

                    {/* Ruler + Filmstrip — hidden when collapsed */}
                    <AnimatePresence initial={false}>
                      {!timelineCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {/* Ruler — pl-[46px] aligns with filmstrip content */}
                          <div className="border-t border-[rgba(0,0,0,0.08)] pt-[2px]">
                            <div className="pl-[46px] pr-[36px]">
                              <TimelineRuler
                                duration={duration}
                                currentTime={currentTime}
                                annotations={sortedAnnotations}
                                onSeek={seekTo}
                                onHoverPin={setHoveredPinId}
                              />
                            </div>
                          </div>

                          {/* Filmstrip row */}
                          <div className="flex items-center w-full gap-1 mt-[4px]">
                            {/* Volume icon column (46px matches ruler pl) */}
                            <div
                              className="w-[45px] flex items-center justify-end pr-2 shrink-0 cursor-pointer"
                              onClick={toggleMute}
                              title={isMuted ? 'Unmute' : 'Mute'}
                            >
                              {isMuted
                                ? <VolumeX className="w-[14px] h-[14px] text-[#686576]" />
                                : <Volume2 className="w-[14px] h-[14px] text-[#686576]" />}
                            </div>

                            {/* Filmstrip */}
                            <div
                              className="flex-1 rounded-[8px] overflow-hidden flex cursor-pointer relative"
                              style={{ height: 51 }}
                              onClick={(e) => {
                                if (!duration) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                seekTo(((e.clientX - rect.left) / rect.width) * duration);
                              }}
                            >
                              {thumbsLoading && thumbs.length === 0
                                ? Array.from({ length: THUMB_COUNT }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="flex-1 bg-[#e0e0e0] animate-pulse border-r border-white/10"
                                      style={{ animationDelay: `${i * 60}ms` }}
                                    />
                                  ))
                                : thumbs.length > 0
                                ? thumbs.map((url, i) => (
                                    <div key={i} className="flex-1 relative overflow-hidden border-r border-black/10 shrink-0">
                                      {url
                                        ? <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
                                        : <div className="w-full h-full bg-[#c8c8c8]" />}
                                    </div>
                                  ))
                                : <div className="flex-1 bg-[#e0e0e0]" />
                              }

                              {/* Playhead on filmstrip */}
                              {duration > 0 && (
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-[#473BAB] pointer-events-none z-10"
                                  style={{ left: `${progress}%` }}
                                />
                              )}

                              {/* Extracting badge */}
                              {thumbsLoading && (
                                <div className="absolute top-1 right-1 bg-black/50 px-1.5 py-0.5 rounded text-[9px] text-white/70 flex items-center gap-1 pointer-events-none z-10">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#473BAB] animate-pulse" />
                                  Extracting…
                                </div>
                              )}
                            </div>

                            {/* + button */}
                            <button
                              className="w-[28px] h-[28px] bg-[#f0f2f4] border border-[rgba(0,0,0,0.12)] rounded-[4px] flex items-center justify-center hover:bg-[#e4e6e8] transition-colors cursor-pointer shrink-0"
                              title="Add canvas"
                            >
                              <span className="text-[#686576] text-[16px] leading-none font-light">+</span>
                            </button>
                          </div>

                          {/* Keyboard hint */}
                          <p className="text-[9px] text-[#9C99A9] select-none text-right font-['Roboto'] mt-1">
                            Space · play/pause &nbsp;·&nbsp; ← → · skip 5s &nbsp;·&nbsp; Esc · close
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-[1px] bg-[rgba(0,0,0,0.08)] my-4 shrink-0" />

              {/* Right Panel — PreApprovalForm (unchanged) */}
              <div className="w-[380px] flex-none h-full overflow-hidden bg-[#F9FAFA]">
                <PreApprovalForm onClose={onClose} onDone={handleFormDone} />
              </div>
            </div>

            {/* Submit overlay — shown when form is submitted */}
            <AnimatePresence>
              {(isSubmitting || isSubmitted) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E0E0E0] border-t-[#473BAB]" />
                      <p className="text-[16px] font-medium text-[#1F1D25]">Submitting request…</p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex flex-col items-center gap-4 text-center px-8"
                    >
                      <div className="h-16 w-16 bg-[#473BAB] rounded-full flex items-center justify-center text-white shadow-lg">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <h3 className="text-[20px] font-semibold text-[#1F1D25] mb-2">Request Submitted!</h3>
                        <p className="text-[14px] text-[#686576] max-w-[280px]">
                          Your pre-approval request has been successfully created and is being reviewed.
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        className="mt-4 px-8 py-2.5 bg-[#473BAB] text-white rounded-full text-sm font-medium hover:bg-[#3D3295] transition-colors"
                      >
                        Done
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </AnimatePresence>
    </>,
    document.body
  );
}
