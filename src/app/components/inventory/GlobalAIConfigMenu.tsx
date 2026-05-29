// ─── GlobalAIConfigMenu ────────────────────────────────────────────────────────
// Dropdown overlay triggered by the kebab button on each GlobalAI Config row.
// Mirrors the VehiclesMenu pattern exactly — portal, Material shadow, slide-down
// animation, outside-click / Escape close.
// Figma reference: node 12493-299407 — "Property 1=Config Gallery"

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';

// ── Keyframe animation (identical to VehiclesMenu) ────────────────────────────
const SLIDE_DOWN_STYLE = `
@keyframes vehiclesMenuIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0px);  }
}
`;

// ── Types ─────────────────────────────────────────────────────────────────────
export type GlobalAIConfigMenuAction =
  | 'downloadBackground'
  | 'duplicate'
  | 'enableAiConfig'
  | 'edit'
  | 'remove';

export interface GlobalAIConfigMenuAnchor {
  top: number;
  right: number; // distance from right edge of viewport
}

// ── Inline icons (Material Design paths, 18×18 viewport) ─────────────────────
function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(17,16,20,0.56)">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
  );
}
function IconDuplicate() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(17,16,20,0.56)">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
    </svg>
  );
}
function IconEnable() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(17,16,20,0.56)">
      <path d="M13 2.05V4.07c2.39.49 4.39 1.85 5.71 3.73L17.15 9.3C16.17 7.75 14.7 6.55 13 6.07V2.05zM11 2.05C6.5 2.55 3 6.36 3 11c0 4.64 3.5 8.45 8 8.95V17.9C7.73 17.44 5 14.44 5 11 5 7.56 7.73 4.56 11 4.1V2.05zM18.28 9.98l-1.46 1.45C17.55 12.16 18 13.04 18 14c0 2.21-1.79 4-4 4v-3l-4 4 4 4v-3c3.31 0 6-2.69 6-6 0-1.66-.67-3.16-1.72-4.02z" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(17,16,20,0.56)">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}
function IconRemove() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(17,16,20,0.56)">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

// ── MenuItem ──────────────────────────────────────────────────────────────────
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

function MenuItem({ icon, label, danger = false, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group/item w-full flex items-center text-left select-none cursor-pointer',
        'transition-colors duration-100',
        danger
          ? 'text-[#c62828] hover:bg-[rgba(198,40,40,0.06)] active:bg-[rgba(198,40,40,0.12)]'
          : 'text-[#1f1d25] hover:bg-[rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.08)]',
      )}
      style={{ height: 36, paddingLeft: 0, paddingRight: 16 }}
    >
      {/* Left icon slot — 36px wide, matches Figma */}
      <span className="flex items-center justify-center shrink-0" style={{ width: 36 }}>
        <span className="transition-all duration-75 group-active/item:opacity-60 group-active/item:scale-90">
          {icon}
        </span>
      </span>
      {/* Label */}
      <span
        className="font-['Roboto',sans-serif] font-normal leading-[21px]"
        style={{ fontSize: 14 }}
      >
        {label}
      </span>
    </button>
  );
}

// ── MenuDivider ───────────────────────────────────────────────────────────────
function MenuDivider() {
  return (
    <div
      className="bg-[rgba(0,0,0,0.12)]"
      style={{ height: 1, marginTop: 8, marginBottom: 8 }}
    />
  );
}

// ── GlobalAIConfigMenu (portal) ───────────────────────────────────────────────
interface GlobalAIConfigMenuProps {
  anchor: GlobalAIConfigMenuAnchor;
  onAction: (action: GlobalAIConfigMenuAction) => void;
  onClose: () => void;
}

export function GlobalAIConfigMenu({ anchor, onAction, onClose }: GlobalAIConfigMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Close on outside click or Escape ──────────────────────────────────────
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handle = (action: GlobalAIConfigMenuAction) => () => {
    onAction(action);
    onClose();
  };

  return createPortal(
    <>
      <style>{SLIDE_DOWN_STYLE}</style>

      <div
        ref={menuRef}
        role="menu"
        aria-label="Config actions"
        style={{
          position: 'fixed',
          top: anchor.top,
          right: anchor.right,
          width: 220,
          zIndex: 9999,
          borderRadius: 4,
          backgroundColor: '#ffffff',
          boxShadow: [
            '0 5px 5px -3px rgba(0,0,0,0.20)',
            '0 8px 10px  1px rgba(0,0,0,0.14)',
            '0 3px 14px  2px rgba(0,0,0,0.12)',
          ].join(', '),
          animation: 'vehiclesMenuIn 450ms ease-out forwards',
          maxHeight: 'calc(100vh - 16px)',
          overflowY: 'auto',
        }}
      >
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>

          <MenuItem icon={<IconDownload />} label="Download Background" onClick={handle('downloadBackground')} />
          <MenuItem icon={<IconDuplicate />} label="Duplicate"           onClick={handle('duplicate')} />
          <MenuItem icon={<IconEnable />}   label="Enable AI Config"     onClick={handle('enableAiConfig')} />
          <MenuItem icon={<IconEdit />}     label="Edit"                 onClick={handle('edit')} />

          <MenuDivider />

          <MenuItem icon={<IconRemove />}   label="Remove"               onClick={handle('remove')} danger />

        </div>
      </div>
    </>,
    document.body,
  );
}
