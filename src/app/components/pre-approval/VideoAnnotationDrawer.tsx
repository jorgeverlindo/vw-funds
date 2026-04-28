'use client';

import { createPortal } from 'react-dom';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
  Sparkles, CirclePlus, ChevronDown, ChevronUp, MinusCircle, PlusCircle,
} from 'lucide-react';
import { WorkflowDocument } from '@/app/contexts/WorkflowContext';
import { AnnotationPin } from './AnnotationPin';
import { InteractiveAnnotation } from './InteractiveAnnotation';
import { ScrollerAnnotations, AnnotationItem } from './ScrollerAnnotations';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoAnnotation {
  id: string;
  timestamp: number;
  xPct: number;
  yPct: number;
  /** 2-char CATA code, e.g. "3A", "1D" */
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

// ─── CATA codes (matching Figma design format) ────────────────────────────────

const CATA_CODES = [
  { code: '1A', title: 'Brand Identity',     description: 'Brand identity elements must follow VW specifications' },
  { code: '1B', title: 'Logo Usage',         description: 'VW logo must be used in approved form and placement' },
  { code: '1C', title: 'Color Palette',      description: 'Only Primary & Secondary brand colors may be used' },
  { code: '1D', title: 'Font Types',         description: 'VW approved fonts only: VW Head Light, Regular, Bold, Extra Bold, Text' },
  { code: '2A', title: 'Imagery Standards',  description: 'Only approved lifestyle or vehicle photography' },
  { code: '2B', title: 'Video Standards',    description: 'Video must meet VW motion guidelines' },
  { code: '2C', title: 'Asset Quality',      description: 'Assets must meet minimum resolution and quality' },
  { code: '2D', title: 'Assets',             description: 'Assets may not contain unauthorized graphics' },
  { code: '3A', title: 'Background Colors',  description: 'Must adhere to Primary & Secondary brand palettes; no design elements in background' },
  { code: '3B', title: 'Logo Protection',    description: 'Protected zone equal to half the logo diameter on all sides' },
  { code: '3C', title: 'Disclaimer Missing', description: 'Required pricing or offer disclaimer must be present' },
  { code: '3D', title: 'Legal Text',         description: 'Mandatory legal copy must be present and legible' },
  { code: '4A', title: 'Unauthorized Claims', description: 'Superiority or unsubstantiated claims are not permitted' },
  { code: '4B', title: 'Competitive Reference', description: 'Unauthorized competitor mention or comparison' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function fmtTimecode(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const totalMs = Math.round(s * 1000);
  const ms      = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
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

    const video  = document.createElement('video');
    video.src    = src;
    video.muted  = true;
    video.preload = 'metadata';

    const canvas = document.createElement('canvas');
    canvas.width  = 128;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');
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
    <div className="absolute inset-0 z-20 bg-[#0a0a0a]/92 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#473BAB] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-[#473BAB]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-white text-[16px] font-medium">
          AI analyzing video{''.padEnd(dot, '.')}
        </p>
        <p className="text-white/45 text-[12px] mt-1.5 max-w-[260px] leading-relaxed">
          Scanning frames for brand compliance violations and CATA code matches
        </p>
      </div>
      <button
        onClick={onSkip}
        className="px-6 py-2 rounded-full border border-white/20 text-white/70 text-[13px] font-medium hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
      >
        Skip analysis
      </button>
    </div>
  );
}

// ─── PinModal (CATA code selector) ───────────────────────────────────────────

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
    <div className="absolute inset-0 z-30 bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-5 mx-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-4 w-4 items-center justify-center bg-[#EF5350] p-[4px] rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] shrink-0">
            <span className="text-[10px] font-normal text-white font-['Roboto']">!</span>
          </div>
          <h3 className="text-[15px] font-medium text-[#1f1d25]">Add Compliance Annotation</h3>
        </div>
        <p className="text-[12px] text-[#9C99A9] mb-4 ml-6">
          At <strong className="text-[#686576]">{fmtTimecode(timestamp)}</strong>
          <span className="text-[#9C99A9]"> ({toFrames(timestamp)} Frames)</span>
        </p>

        <label className="block text-[12px] font-medium text-[#686576] mb-1.5">Violation Type</label>
        <select
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
          className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 text-[13px] text-[#1f1d25] focus:outline-none focus:border-[#473BAB] mb-3 bg-white cursor-pointer"
        >
          {CATA_CODES.map(c => (
            <option key={c.code} value={c.code}>{c.code} — {c.title}</option>
          ))}
        </select>

        <label className="block text-[12px] font-medium text-[#686576] mb-1.5">
          Notes <span className="font-normal text-[#9C99A9]">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={selected.description}
          rows={2}
          className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 text-[13px] text-[#1f1d25] placeholder:text-[#9C99A9] resize-none focus:outline-none focus:border-[#473BAB] transition-colors mb-4"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-full text-[13px] font-medium text-[#686576] hover:bg-gray-100 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected.code, selected.title, notes.trim() || selected.description)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#473BAB] text-white text-[13px] font-medium hover:bg-[#3c31a0] transition-colors cursor-pointer"
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

const RULER_SEGMENTS   = 4;   // 5 labels: 0%, 25%, 50%, 75%, 100%
const MINOR_PER_SEG    = 9;   // 9 minor ticks between each major

interface RulerProps {
  duration: number;
  currentTime: number;
  annotations: VideoAnnotation[];
  onSeek: (t: number) => void;
}

function TimelineRuler({ duration, currentTime, annotations, onSeek }: RulerProps) {
  const totalFrames = toFrames(duration);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
            <span className="text-[11px] text-[#686576] leading-none font-['Roboto'] whitespace-nowrap ml-0.5" style={{ marginTop: 2 }}>
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

      {/* Annotation pins — AnnotationPin component, direction bottom-right */}
      {annotations.map((ann, i) => {
        const pct = duration > 0 ? (ann.timestamp / duration) * 100 : 0;
        return (
          <div
            key={ann.id}
            className="absolute top-0"
            style={{ left: `${pct}%`, transform: 'translateX(-50%)', zIndex: 5 }}
          >
            <AnnotationPin
              number={i + 1}
              direction="bottom-right"
              delay={0}
              onClick={() => onSeek(ann.timestamp)}
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
  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Video state ─────────────────────────────────────────────────────────
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [isMuted,     setIsMuted]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

  // ── Video frame rect (for accurate pin placement, excludes letterbox) ──
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
  const [processing, setProcessing] = useState(true);
  useEffect(() => {
    processingTimerRef.current = setTimeout(() => setProcessing(false), 3000);
    return () => { if (processingTimerRef.current) clearTimeout(processingTimerRef.current); };
  }, []);
  const skipProcessing = () => {
    if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
    setProcessing(false);
  };

  // ── Annotations ──────────────────────────────────────────────────────────
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [activeAnnId, setActiveAnnId] = useState<string | null>(null);

  // Pin placement flow
  const [pinPlacementMode, setPinPlacementMode] = useState(false);
  const [pendingPin, setPendingPin]   = useState<{ xPct: number; yPct: number } | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);

  // Convert to AnnotationItem for ScrollerAnnotations
  const annotationItems: AnnotationItem[] = sortedAnnotations.map((ann, i) => ({
    id:          ann.id,
    number:      i + 1,
    category:    ann.cataCode,     // "3A", "1D" etc — no "CATA" prefix
    title:       ann.title,
    description: ann.description,
    x:           ann.xPct,
    y:           ann.yPct,
    timestamp:   ann.timestamp,
    included:    ann.included,
  }));

  // ── Video controls ───────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    isPlaying ? v.pause() : v.play();
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };
  const skip = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + delta));
  };
  const seekTo = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration || Infinity, t));
  }, [duration]);

  // ── Timeline ─────────────────────────────────────────────────────────────
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);

  // ── Pin placement ─────────────────────────────────────────────────────────
  const handleVideoAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinPlacementMode || showPinModal || !videoFrame) return;
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const xInContainer = e.clientX - cr.left;
    const yInContainer = e.clientY - cr.top;
    // Reject clicks in letterbox areas
    if (
      xInContainer < videoFrame.left || xInContainer > videoFrame.left + videoFrame.width ||
      yInContainer < videoFrame.top  || yInContainer > videoFrame.top  + videoFrame.height
    ) return;
    videoRef.current?.pause();
    setPendingPin({
      xPct: ((xInContainer - videoFrame.left) / videoFrame.width) * 100,
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

  const toggleInclude  = (id: string) => setAnnotations(prev => prev.map(a => a.id === id ? { ...a, included: !a.included } : a));
  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (activeAnnId === id) setActiveAnnId(null);
  };

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPinModal, pinPlacementMode, isPlaying]);

  // ── Render ────────────────────────────────────────────────────────────────

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-stretch bg-black/80 backdrop-blur-sm">

      {/* ── Left Panel — ScrollerAnnotations ────────────────────────── */}
      <div className="w-[220px] shrink-0 flex flex-col bg-[#f0f2f4]">
        {/* Header */}
        <div className="px-4 py-4 border-b border-[rgba(0,0,0,0.08)] shrink-0">
          <h3 className="text-[13px] font-medium text-[#1f1d25] font-['Roboto']">Compliance Review</h3>
          <p className="text-[11px] text-[#9C99A9] mt-0.5 truncate font-['Roboto']">{doc.name}</p>
          {annotations.length > 0 && (
            <p className="text-[11px] text-[#473BAB] mt-1.5 font-medium font-['Roboto']">
              {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} · {includedCount} in report
            </p>
          )}
        </div>

        {/* ScrollerAnnotations — reuses existing component */}
        <div className="flex-1 min-h-0">
          <ScrollerAnnotations
            annotations={annotationItems}
            activeId={activeAnnId}
            onSelect={(id) => {
              setActiveAnnId(activeAnnId === id ? null : id);
              const ann = annotations.find(a => a.id === id);
              if (ann) seekTo(ann.timestamp);
            }}
            onToggleInclude={toggleInclude}
            onDelete={deleteAnnotation}
            emptyMessage="No annotations yet"
            className="h-full w-full rounded-none"
          />
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-[rgba(0,0,0,0.08)] shrink-0 space-y-2">
          {includedCount > 0 && (
            <button className="w-full px-4 py-2.5 rounded-xl bg-[#473BAB] text-white text-[13px] font-medium hover:bg-[#3c31a0] transition-colors cursor-pointer font-['Roboto']">
              Export Report ({includedCount})
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-[rgba(0,0,0,0.12)] text-[#686576] text-[13px] font-medium hover:bg-black/5 transition-colors cursor-pointer font-['Roboto']"
          >
            Close
          </button>
        </div>
      </div>

      {/* ── Right side ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-7 bg-white/10 rounded flex items-center justify-center shrink-0">
              <span className="text-[7px] font-bold text-red-400 leading-tight">
                {doc.type.toUpperCase().slice(0, 4)}
              </span>
            </div>
            <p className="text-white/70 text-[12px] truncate font-['Roboto']">{doc.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Add Annotation — outlined pill button matching Figma */}
            {!pinPlacementMode ? (
              <button
                onClick={() => { setPinPlacementMode(true); videoRef.current?.pause(); }}
                className="flex items-center gap-1.5 px-[10px] py-[4px] rounded-full border border-[rgba(99,86,225,0.5)] text-[#a89cf0] text-[13px] font-medium hover:bg-white/5 transition-colors cursor-pointer font-['Roboto']"
              >
                <CirclePlus className="w-[16px] h-[16px]" />
                Add Annotation
              </button>
            ) : (
              <button
                onClick={() => setPinPlacementMode(false)}
                className="flex items-center gap-1.5 px-[10px] py-[4px] rounded-full bg-[rgba(99,86,225,0.15)] border border-[rgba(99,86,225,0.5)] text-[#a89cf0] text-[13px] font-medium cursor-pointer font-['Roboto']"
              >
                Cancel
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pin placement hint banner */}
        {pinPlacementMode && (
          <div className="bg-[#473BAB]/90 px-4 py-2 text-center text-[12px] text-white font-['Roboto'] shrink-0">
            Click anywhere on the video frame to place an annotation pin
          </div>
        )}

        {/* Video canvas */}
        <div
          ref={containerRef}
          className="flex-1 min-h-0 bg-black relative"
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
            onClick={(e) => e.stopPropagation()}
          />

          {/* Pin overlay — exactly over the video frame (no letterbox) */}
          {videoFrame && !processing && (
            <div
              className="absolute pointer-events-none"
              style={{ left: videoFrame.left, top: videoFrame.top, width: videoFrame.width, height: videoFrame.height }}
            >
              {sortedAnnotations.map((ann, i) => (
                <InteractiveAnnotation
                  key={ann.id}
                  id={ann.id}
                  number={i + 1}
                  category={ann.cataCode}
                  title={ann.title}
                  description={ann.description}
                  x={ann.xPct}
                  y={ann.yPct}
                  isOpen={activeAnnId === ann.id}
                  onToggle={() => setActiveAnnId(activeAnnId === ann.id ? null : ann.id)}
                  direction="bottom-right"
                  delay={0}
                />
              ))}
              {/* Pending pin pulse */}
              {pendingPin && (
                <div
                  className="absolute rounded-tl-[12px] rounded-tr-[12px] rounded-bl-[12px] animate-ping pointer-events-none"
                  style={{
                    left: `${pendingPin.xPct}%`, top: `${pendingPin.yPct}%`,
                    width: 16, height: 16,
                    background: 'rgba(239,83,80,0.5)', border: '1px solid #EF5350',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
            </div>
          )}

          {processing && <ProcessingOverlay onSkip={skipProcessing} />}

          {showPinModal && (
            <PinModal
              timestamp={currentTime}
              onConfirm={handlePinConfirm}
              onCancel={() => { setPendingPin(null); setShowPinModal(false); }}
            />
          )}
        </div>

        {/* ── V2 Timeline Panel ─────────────────────────────────────── */}
        <div className="bg-white rounded-t-[16px] shrink-0 w-full overflow-hidden">
          <div className="flex flex-col gap-[8px] pt-[8px] px-[8px] pb-[8px]">

            {/* Timeline Top Bar */}
            <div className="flex items-center justify-between w-full h-[30px]">

              {/* Left: play controls + timecode */}
              <div className="flex items-center gap-1">
                <button onClick={() => skip(-5)} className="p-1 text-[#686576] hover:text-[#1f1d25] transition-colors cursor-pointer">
                  <SkipBack className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-1 text-[#686576] hover:text-[#1f1d25] transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-[18px] h-[18px]" /> : <Play className="w-[18px] h-[18px]" />}
                </button>
                <button onClick={() => skip(5)} className="p-1 text-[#686576] hover:text-[#1f1d25] transition-colors cursor-pointer">
                  <SkipForward className="w-[18px] h-[18px]" />
                </button>

                {/* Divider */}
                <div className="w-px h-[20px] bg-[rgba(0,0,0,0.12)] mx-1" />

                {/* Current time */}
                <span className="text-[12px] text-[#1f1d25] font-['Roboto'] leading-[24px] tracking-[0.15px] px-1 whitespace-nowrap">
                  {fmtTimecode(currentTime)}
                  <span className="text-[#686576]"> ({toFrames(currentTime)} Frames)</span>
                </span>

                <div className="w-px h-[20px] bg-[rgba(0,0,0,0.12)] mx-1" />

                {/* Total duration */}
                <span className="text-[12px] text-[rgba(0,0,0,0.6)] font-['Roboto'] leading-[24px] tracking-[0.15px] px-1 whitespace-nowrap">
                  {fmtTimecode(duration)}
                  <span className="text-[#686576]"> ({toFrames(duration)} Frames)</span>
                </span>
              </div>

              {/* Center: collapse toggle */}
              <button
                onClick={() => setTimelineCollapsed(c => !c)}
                className="p-1 text-[#686576] hover:text-[#1f1d25] transition-colors cursor-pointer"
              >
                {timelineCollapsed ? <ChevronUp className="w-[18px] h-[18px]" /> : <ChevronDown className="w-[18px] h-[18px]" />}
              </button>

              {/* Right: zoom slider */}
              <div className="flex items-center gap-1 h-[24px]">
                <button
                  onClick={() => setTimelineZoom(z => Math.max(1, z - 0.5))}
                  className="text-[#686576] hover:text-[#473BAB] transition-colors cursor-pointer"
                  disabled={timelineZoom <= 1}
                >
                  <MinusCircle className="w-[18px] h-[18px]" />
                </button>
                <div className="relative w-[100px] h-full flex items-center">
                  {/* Rail */}
                  <div className="absolute inset-x-0 h-[2px] rounded-full bg-[#473BAB] opacity-40" />
                  {/* Track (filled portion) */}
                  <div
                    className="absolute left-0 h-[2px] rounded-full bg-[#473BAB]"
                    style={{ width: `${((timelineZoom - 1) / 4) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={1} max={5} step={0.1}
                    value={timelineZoom}
                    onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                  {/* Thumb */}
                  <div
                    className="absolute w-[12px] h-[12px] rounded-full bg-[#473BAB] shadow pointer-events-none"
                    style={{ left: `calc(${((timelineZoom - 1) / 4) * 100}% - 6px)` }}
                  />
                </div>
                <button
                  onClick={() => setTimelineZoom(z => Math.min(5, z + 0.5))}
                  className="text-[#686576] hover:text-[#473BAB] transition-colors cursor-pointer"
                  disabled={timelineZoom >= 5}
                >
                  <PlusCircle className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            {/* Timebars ruler + Filmstrip — hidden when collapsed */}
            {!timelineCollapsed && (
              <>
                {/* Timebars ruler — pl-[46px] aligns with filmstrip content */}
                <div className="border-t border-[rgba(0,0,0,0.12)] pt-[2px] w-full">
                  <div className="pl-[46px] pr-[32px]">
                    <TimelineRuler
                      duration={duration}
                      currentTime={currentTime}
                      annotations={sortedAnnotations}
                      onSeek={seekTo}
                    />
                  </div>
                </div>

                {/* Layer row: mute icon + filmstrip + add button */}
                <div className="flex items-center w-full gap-1">
                  {/* Left: mute icon column (45px matching ruler pl) */}
                  <div className="w-[45px] flex items-center justify-end pr-2 shrink-0">
                    {isMuted
                      ? <VolumeX className="w-[15px] h-[15px] text-[#686576]" />
                      : <Volume2 className="w-[15px] h-[15px] text-[#686576]" />
                    }
                  </div>

                  {/* Filmstrip — 51px height, 8px radius, thumbnails */}
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
                          <div key={i} className="flex-1 bg-[#e0e0e0] animate-pulse border-r border-white/10" style={{ animationDelay: `${i * 60}ms` }} />
                        ))
                      : thumbs.length > 0
                      ? thumbs.map((url, i) => (
                          <div key={i} className="flex-1 relative overflow-hidden border-r border-black/10 shrink-0">
                            {url
                              ? <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
                              : <div className="w-full h-full bg-[#e0e0e0]" />
                            }
                          </div>
                        ))
                      : <div className="flex-1 bg-[#e0e0e0]" />
                    }

                    {/* Playhead on filmstrip */}
                    {duration > 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-[#473BAB] pointer-events-none"
                        style={{ left: `${progress}%` }}
                      />
                    )}

                    {/* Extracting badge */}
                    {thumbsLoading && (
                      <div className="absolute top-1 right-1 bg-black/50 px-1.5 py-0.5 rounded text-[9px] text-white/70 flex items-center gap-1 pointer-events-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#473BAB] animate-pulse" />
                        Extracting…
                      </div>
                    )}
                  </div>

                  {/* Add new canvas button */}
                  <button
                    className="w-[28px] h-[28px] bg-[#f0f2f4] border border-[rgba(0,0,0,0.12)] rounded-[4px] flex items-center justify-center shadow-sm hover:bg-[#e4e6e8] transition-colors cursor-pointer shrink-0"
                    title="Add new canvas"
                  >
                    <span className="text-[#686576] text-[16px] leading-none font-light">+</span>
                  </button>
                </div>

                {/* Keyboard hint */}
                <p className="text-[10px] text-[#9C99A9] select-none text-right font-['Roboto']">
                  Space · play/pause &nbsp;·&nbsp; ← → · skip 5s &nbsp;·&nbsp; Esc · close
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
