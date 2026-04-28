'use client';

import { createPortal } from 'react-dom';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
  AlertCircle, CheckSquare, Square, Trash2, Plus, Clock,
} from 'lucide-react';
import { WorkflowDocument } from '@/app/contexts/WorkflowContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoAnnotation {
  id: string;
  /** Timestamp in seconds where the annotation was placed */
  timestamp: number;
  /** Position as percentage of video container (0–100) */
  xPct: number;
  yPct: number;
  cataCode: string;
  title: string;
  description: string;
  /** Whether to include this annotation in the compliance report */
  included: boolean;
}

// ─── CATA compliance codes ────────────────────────────────────────────────────

const CATA_CODES = [
  { code: 'CATA-01', title: 'Brand Compliance',        description: 'Brand guidelines not followed' },
  { code: 'CATA-02', title: 'Logo Misuse',             description: 'VW logo used incorrectly or in wrong context' },
  { code: 'CATA-03', title: 'Color Violation',         description: 'Brand palette not respected' },
  { code: 'CATA-04', title: 'Typography Non-Compliant', description: 'Wrong typeface or weight used' },
  { code: 'CATA-05', title: 'Disclaimer Missing',      description: 'Required pricing or offer disclaimer absent' },
  { code: 'CATA-06', title: 'Legal Text Missing',      description: 'Mandatory legal copy not present' },
  { code: 'CATA-07', title: 'Unauthorized Claims',     description: 'Superiority or unsubstantiated claim present' },
  { code: 'CATA-08', title: 'Competitive Reference',   description: 'Unauthorized competitor mention or comparison' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface AnnotationCardProps {
  annotation: VideoAnnotation;
  index: number;
  isActive: boolean;
  onSeek: (t: number) => void;
  onToggleInclude: (id: string) => void;
  onDelete: (id: string) => void;
}

function AnnotationCard({ annotation, index, isActive, onSeek, onToggleInclude, onDelete }: AnnotationCardProps) {
  return (
    <div
      className={`rounded-xl border p-3 transition-colors cursor-pointer ${
        isActive
          ? 'border-[#473BAB] bg-[rgba(71,59,171,0.05)]'
          : 'border-[#E0E0E0] bg-white hover:border-[#C9C7D4]'
      }`}
      onClick={() => onSeek(annotation.timestamp)}
    >
      {/* Header row */}
      <div className="flex items-start gap-2.5">
        {/* Pin badge */}
        <div className="w-5 h-5 rounded-full bg-[#EF5350] flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-white text-[9px] font-bold leading-none">{index + 1}</span>
        </div>

        {/* Code + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold text-[#686576] uppercase tracking-wide">
              {annotation.cataCode}
            </span>
          </div>
          <p className="text-[13px] font-medium text-[#1f1d25] leading-snug">{annotation.title}</p>
          {annotation.description && (
            <p className="text-[12px] text-[#686576] mt-1 leading-relaxed">{annotation.description}</p>
          )}
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#F0F0F0]">
        <button
          onClick={(e) => { e.stopPropagation(); onSeek(annotation.timestamp); }}
          className="flex items-center gap-1 text-[11px] text-[#9C99A9] hover:text-[#473BAB] transition-colors"
        >
          <Clock className="w-3 h-3" />
          {fmtTime(annotation.timestamp)}
        </button>

        <div className="flex items-center gap-1">
          {/* Include toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleInclude(annotation.id); }}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors ${
              annotation.included
                ? 'text-[#473BAB] hover:bg-[rgba(71,59,171,0.08)]'
                : 'text-[#9C99A9] hover:bg-gray-100'
            }`}
            title={annotation.included ? 'Included in report' : 'Excluded from report'}
          >
            {annotation.included
              ? <CheckSquare className="w-3 h-3" />
              : <Square className="w-3 h-3" />
            }
            <span>Include</span>
          </button>

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(annotation.id); }}
            className="p-1 rounded text-[#9C99A9] hover:text-[#D2323F] hover:bg-red-50 transition-colors"
            title="Remove annotation"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pin placement modal ──────────────────────────────────────────────────────

interface PinModalProps {
  timestamp: number;
  onConfirm: (cataCode: string, title: string, description: string) => void;
  onCancel: () => void;
}

function PinModal({ timestamp, onConfirm, onCancel }: PinModalProps) {
  const [selectedCode, setSelectedCode] = useState(CATA_CODES[0].code);
  const [description, setDescription] = useState('');

  const selected = CATA_CODES.find(c => c.code === selectedCode)!;

  const handleConfirm = () => {
    onConfirm(selected.code, selected.title, description.trim() || selected.description);
  };

  return (
    <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center rounded-xl">
      <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-5 mx-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-[#EF5350] shrink-0" />
          <h3 className="text-[15px] font-medium text-[#1f1d25]">Add Compliance Annotation</h3>
        </div>

        <p className="text-[12px] text-[#9C99A9] mb-4">
          At <strong className="text-[#686576]">{fmtTime(timestamp)}</strong>
        </p>

        {/* CATA code selector */}
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

        {/* Description */}
        <label className="block text-[12px] font-medium text-[#686576] mb-1.5">
          Notes <span className="font-normal text-[#9C99A9]">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={selected.description}
          rows={2}
          className="w-full rounded-xl border border-[#E0E0E0] px-3 py-2 text-[13px] text-[#1f1d25] placeholder:text-[#9C99A9] resize-none focus:outline-none focus:border-[#473BAB] transition-colors mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-[13px] font-medium text-[#686576] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#473BAB] text-white text-[13px] font-medium hover:bg-[#3c31a0] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Pin
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Processing overlay ───────────────────────────────────────────────────────

interface ProcessingOverlayProps {
  onSkip: () => void;
}

function ProcessingOverlay({ onSkip }: ProcessingOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 bg-[#0a0a0a]/90 flex flex-col items-center justify-center rounded-xl gap-5">
      {/* Spinner */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#473BAB] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-[#473BAB]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-white text-[15px] font-medium">Analyzing video…</p>
        <p className="text-white/50 text-[12px] mt-1">Preparing compliance review</p>
      </div>
      <button
        onClick={onSkip}
        className="px-5 py-2 rounded-full border border-white/20 text-white text-[13px] font-medium hover:bg-white/10 transition-colors cursor-pointer"
      >
        Skip
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface VideoAnnotationDrawerProps {
  doc: WorkflowDocument;
  onClose: () => void;
}

export function VideoAnnotationDrawer({ doc, onClose }: VideoAnnotationDrawerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // ── Video state ──────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // ── Processing overlay ───────────────────────────────────────────────────
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setProcessing(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // ── Annotations ──────────────────────────────────────────────────────────
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [pendingPin, setPendingPin] = useState<{ xPct: number; yPct: number } | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  // Active annotation = closest to currentTime within 1s
  const activeAnnotation = annotations.reduce<VideoAnnotation | null>((best, ann) => {
    const dist = Math.abs(ann.timestamp - currentTime);
    if (dist > 1) return best;
    if (!best || dist < Math.abs(best.timestamp - currentTime)) return ann;
    return best;
  }, null);

  // ── Video event handlers ─────────────────────────────────────────────────

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v) setCurrentTime(v.currentTime);
  };

  const handleDurationChange = () => {
    const v = videoRef.current;
    if (v) setDuration(v.duration || 0);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => setIsPlaying(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.pause();
    else v.play();
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

  const seekTo = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, t));
  };

  // ── Timeline scrubber ────────────────────────────────────────────────────

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(ratio * duration);
  };

  // ── Video canvas click → place pin ───────────────────────────────────────

  const handleVideoClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (processing || showPinModal) return;
    const v = videoRef.current;
    if (!v) return;

    // Pause the video first
    v.pause();

    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingPin({ xPct, yPct });
    setShowPinModal(true);
  }, [processing, showPinModal]);

  const handlePinConfirm = (cataCode: string, title: string, description: string) => {
    if (!pendingPin) return;
    const newAnn: VideoAnnotation = {
      id: uid(),
      timestamp: currentTime,
      xPct: pendingPin.xPct,
      yPct: pendingPin.yPct,
      cataCode,
      title,
      description,
      included: true,
    };
    setAnnotations(prev => [...prev, newAnn].sort((a, b) => a.timestamp - b.timestamp));
    setPendingPin(null);
    setShowPinModal(false);
  };

  const handlePinCancel = () => {
    setPendingPin(null);
    setShowPinModal(false);
  };

  const toggleInclude = (id: string) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, included: !a.included } : a));
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const includedCount = annotations.filter(a => a.included).length;

  // ── Keyboard shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showPinModal) return;
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowLeft') skip(-5);
      if (e.key === 'ArrowRight') skip(5);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPinModal, isPlaying]);

  // ── Annotations sorted by timestamp ─────────────────────────────────────
  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp - b.timestamp);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-stretch bg-black/80 backdrop-blur-sm">
      {/* ── Left Panel — Annotation List ────────────────────────────────── */}
      <div className="w-[300px] shrink-0 bg-white flex flex-col border-r border-[#E0E0E0]">
        {/* Panel header */}
        <div className="px-5 py-4 border-b border-[#E0E0E0] shrink-0">
          <h3 className="text-[14px] font-medium text-[#1f1d25]">Compliance Review</h3>
          <p className="text-[12px] text-[#9C99A9] mt-0.5 truncate">{doc.name}</p>
        </div>

        {/* Annotation count banner */}
        {annotations.length > 0 && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-[rgba(71,59,171,0.06)] border border-[rgba(71,59,171,0.15)] shrink-0">
            <p className="text-[12px] text-[#473BAB] font-medium">
              {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} —{' '}
              {includedCount} included in report
            </p>
          </div>
        )}

        {/* Hint */}
        {!processing && (
          <div className="mx-3 mt-2 shrink-0">
            <p className="text-[11px] text-[#9C99A9] leading-relaxed">
              Pause the video and click anywhere on the frame to add a compliance annotation.
            </p>
          </div>
        )}

        {/* Annotation cards */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2">
          {sortedAnnotations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <AlertCircle className="w-8 h-8 text-[#E0E0E0]" />
              <p className="text-[13px] text-[#9C99A9]">No annotations yet</p>
            </div>
          ) : (
            sortedAnnotations.map((ann, i) => (
              <AnnotationCard
                key={ann.id}
                annotation={ann}
                index={i}
                isActive={ann.id === activeAnnotation?.id}
                onSeek={seekTo}
                onToggleInclude={toggleInclude}
                onDelete={deleteAnnotation}
              />
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="px-3 py-3 border-t border-[#E0E0E0] shrink-0 space-y-2">
          {includedCount > 0 && (
            <button className="w-full px-4 py-2.5 rounded-xl bg-[#473BAB] text-white text-[13px] font-medium hover:bg-[#3c31a0] transition-colors cursor-pointer">
              Export Report ({includedCount})
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-[#E0E0E0] text-[#686576] text-[13px] font-medium hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* ── Right Side — Video + Timeline ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#1a1a1a] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-8 bg-white/10 rounded flex items-center justify-center shrink-0">
              <span className="text-[8px] font-bold text-red-400 leading-tight">
                {doc.type.toUpperCase().slice(0, 4)}
              </span>
            </div>
            <p className="text-white/80 text-[13px] font-medium truncate">{doc.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/60 hover:text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video area */}
        <div className="flex-1 min-h-0 flex items-center justify-center bg-black p-4 relative">
          <div
            ref={videoContainerRef}
            className="relative w-full h-full flex items-center justify-center"
            onClick={handleVideoClick}
            style={{ cursor: processing || showPinModal ? 'default' : 'crosshair' }}
          >
            <video
              ref={videoRef}
              src={doc.url}
              className="max-w-full max-h-full rounded-lg object-contain"
              style={{ display: 'block' }}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              onLoadedMetadata={handleDurationChange}
              // Prevent default click from toggling play (we handle it ourselves)
              onClick={(e) => e.stopPropagation()}
            />

            {/* Annotation pins overlay — positioned over the video element */}
            {!processing && sortedAnnotations.map((ann, i) => (
              <button
                key={ann.id}
                onClick={(e) => {
                  e.stopPropagation();
                  seekTo(ann.timestamp);
                }}
                className="absolute flex items-center justify-center rounded-full transition-transform hover:scale-125 focus:outline-none"
                style={{
                  left: `${ann.xPct}%`,
                  top: `${ann.yPct}%`,
                  width: 22,
                  height: 22,
                  background: ann.id === activeAnnotation?.id ? '#FF7043' : '#EF5350',
                  border: '2px solid white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                }}
                title={`${ann.cataCode}: ${ann.title} @ ${fmtTime(ann.timestamp)}`}
              >
                <span className="text-white text-[9px] font-bold leading-none">{i + 1}</span>
              </button>
            ))}

            {/* Pending pin preview */}
            {pendingPin && (
              <div
                className="absolute rounded-full animate-ping"
                style={{
                  left: `${pendingPin.xPct}%`,
                  top: `${pendingPin.yPct}%`,
                  width: 22,
                  height: 22,
                  background: 'rgba(239,83,80,0.5)',
                  border: '2px solid #EF5350',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                }}
              />
            )}

            {/* Processing overlay */}
            {processing && <ProcessingOverlay onSkip={() => setProcessing(false)} />}

            {/* Pin modal */}
            {showPinModal && (
              <PinModal
                timestamp={currentTime}
                onConfirm={handlePinConfirm}
                onCancel={handlePinCancel}
              />
            )}
          </div>
        </div>

        {/* ── Controls + Timeline ────────────────────────────────────────── */}
        <div className="bg-[#1a1a1a] border-t border-white/10 px-5 py-3 shrink-0">
          {/* Playback controls row */}
          <div className="flex items-center gap-3 mb-3">
            {/* Skip back */}
            <button
              onClick={() => skip(-5)}
              className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
              title="Back 5s"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors cursor-pointer shrink-0"
            >
              {isPlaying
                ? <Pause className="w-4 h-4 text-[#1a1a1a]" />
                : <Play className="w-4 h-4 text-[#1a1a1a] ml-0.5" />
              }
            </button>

            {/* Skip forward */}
            <button
              onClick={() => skip(5)}
              className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
              title="Forward 5s"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Time display */}
            <span className="text-white/60 text-[12px] font-mono ml-1 select-none">
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Annotation count pill */}
            {annotations.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-[#EF5350] text-white text-[11px] font-medium">
                {annotations.length} pin{annotations.length !== 1 ? 's' : ''}
              </span>
            )}

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted
                ? <VolumeX className="w-4 h-4" />
                : <Volume2 className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Timeline scrubber */}
          <div className="relative">
            {/* Clickable track */}
            <div
              ref={timelineRef}
              className="relative h-8 flex items-center cursor-pointer group"
              onClick={handleTimelineClick}
            >
              {/* Rail */}
              <div className="absolute left-0 right-0 h-1 bg-white/15 rounded-full">
                {/* Progress */}
                <div
                  className="h-full bg-[#473BAB] rounded-full transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Annotation markers on timeline */}
              {sortedAnnotations.map((ann, i) => {
                const pct = duration > 0 ? (ann.timestamp / duration) * 100 : 0;
                return (
                  <button
                    key={ann.id}
                    onClick={(e) => { e.stopPropagation(); seekTo(ann.timestamp); }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform hover:scale-125"
                    style={{ left: `${pct}%`, zIndex: 5 }}
                    title={`${i + 1}: ${ann.title} @ ${fmtTime(ann.timestamp)}`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center"
                      style={{ background: ann.id === activeAnnotation?.id ? '#FF7043' : '#EF5350' }}
                    >
                      <span className="text-white text-[7px] font-bold leading-none">{i + 1}</span>
                    </div>
                  </button>
                );
              })}

              {/* Playhead thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${progress}%` }}
              />
            </div>

            {/* Keyboard hint */}
            <p className="text-[10px] text-white/25 mt-1 select-none text-right">
              Space · play/pause · ← → · skip 5s · Esc · close
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
