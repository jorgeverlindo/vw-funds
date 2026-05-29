// ─── GlobalAIConfigMenu ────────────────────────────────────────────────────────
// Dropdown overlay triggered by the kebab button on each GlobalAI Config row.
// Mirrors the VehiclesMenu pattern exactly — portal, Material shadow, slide-down
// animation, outside-click / Escape close.
// Figma reference: node 12493-299407 — "Property 1=Config Gallery"

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';

// ── Asset icons (Cloudinary-hosted, same folder as VehiclesMenu icons) ────────
const iconPower    = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071154/vw-funds/icons/Inventory_Table/Card___Row/esc__power.svg';
const iconTrash    = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780074746/vw-funds/icons/Inventory_Table/Card___Row/trash.svg';
const iconPencil   = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780074748/vw-funds/icons/Inventory_Table/Card___Row/pencil__edit__write.svg';
const iconDuplicate = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780074904/vw-funds/icons/Inventory_Table/Card___Row/square-behind-square-3__copy.svg';

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

// ── Download Background — outlined SVG (no filled version available) ──────────
function IconDownloadOutlined() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(17,16,20,0.56)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v13M7 11l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

// ── MenuItem ──────────────────────────────────────────────────────────────────
interface MenuItemProps {
  iconSrc?: string;
  iconNode?: React.ReactNode;
  label: string;
  onClick: () => void;
}

function MenuItem({ iconSrc, iconNode, label, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group/item w-full flex items-center text-left select-none cursor-pointer',
        'transition-colors duration-100',
        'text-[#1f1d25]',
        'hover:bg-[rgba(0,0,0,0.04)]',
        'active:bg-[rgba(0,0,0,0.08)]',
      )}
      style={{ height: 36, paddingLeft: 0, paddingRight: 16 }}
    >
      {/* Left icon slot — 36px wide, matches Figma */}
      <span className="flex items-center justify-center shrink-0" style={{ width: 36 }}>
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            width={18}
            height={18}
            draggable={false}
            className="transition-all duration-75 group-active/item:brightness-0 group-active/item:opacity-70 group-active/item:scale-90"
          />
        ) : iconNode}
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

          <MenuItem iconNode={<IconDownloadOutlined />} label="Download Background" onClick={handle('downloadBackground')} />
          <MenuItem iconSrc={iconDuplicate}             label="Duplicate"           onClick={handle('duplicate')} />
          <MenuItem iconSrc={iconPower}                 label="Enable AI Config"    onClick={handle('enableAiConfig')} />
          <MenuItem iconSrc={iconPencil}                label="Edit"                onClick={handle('edit')} />

          <MenuDivider />

          <MenuItem iconSrc={iconTrash}                 label="Remove"              onClick={handle('remove')} />

        </div>
      </div>
    </>,
    document.body,
  );
}
