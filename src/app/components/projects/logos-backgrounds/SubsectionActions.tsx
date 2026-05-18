"use client";

import { useState, useRef } from "react";
import { Trash2, Pencil, Plus, RotateCcw } from "lucide-react";

export function TipButton({
  tip,
  onClick,
  className,
  style,
  children,
}: {
  tip: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div
      className="relative"
      onMouseEnter={() => { timer.current = setTimeout(() => setShow(true), 600); }}
      onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setShow(false); }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
        className={className ?? "w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow text-gray-700"}
        style={style}
      >
        {children}
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-20">
          {tip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

/** Tooltip wrapper — same delay/style as TipButton but wraps any child, not just a button. */
export function TipWrapper({ tip, children }: { tip: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <div
      className="relative"
      onMouseEnter={() => { timer.current = setTimeout(() => setShow(true), 600); }}
      onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setShow(false); }}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-20">
          {tip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

interface SubsectionActionsProps {
  onDelete?: () => void;
  onEdit?: () => void;
  onAddBackground?: () => void;
  /** If provided, shows a Reload button (only rendered when truthy) */
  onRestore?: () => void;
  deleteTip?: string;
  editTip?: string;
  restoreTip?: string;
}

export function SubsectionActions({
  onDelete,
  onEdit,
  onAddBackground,
  onRestore,
  deleteTip = "Delete all assets under this offer/template",
  editTip = "Edit all assets under this offer/template",
  restoreTip = "Use all templates",
}: SubsectionActionsProps) {
  return (
    <div className="flex items-center gap-1.5 ml-2 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0">
      <TipButton tip={deleteTip} onClick={onDelete}>
        <Trash2 size={14} />
      </TipButton>
      <TipButton tip={editTip} onClick={onEdit}>
        <Pencil size={14} />
      </TipButton>
      {onRestore && (
        <TipButton tip={restoreTip} onClick={onRestore}>
          <RotateCcw size={14} />
        </TipButton>
      )}
      {onAddBackground && (
        <TipButton tip="Add background for this offer/template" onClick={onAddBackground}>
          <Plus size={14} />
        </TipButton>
      )}
    </div>
  );
}
