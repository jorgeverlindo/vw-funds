// ─── VehiclesMenu ─────────────────────────────────────────────────────────────
// Dropdown overlay triggered by the kebab button on each inventory row.
// Mirrors Figma node 10899:97654 — 220px wide, Material shadow, 8px list padding.
// Mounts via React portal so it floats above sticky columns and scrollable panes.

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Pencil,
  Download,
  Share2,
  Globe,
  Info,
  Sparkles,
  RefreshCw,
  Image,
  ExternalLink,
  ImageOff,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

// ── Keyframe animation ────────────────────────────────────────────────────────
const SLIDE_DOWN_STYLE = `
@keyframes vehiclesMenuIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0px);  }
}
`;

// ── Types ─────────────────────────────────────────────────────────────────────
export type VehiclesMenuAction =
  | 'edit'
  | 'download'
  | 'share'
  | 'syndicate'
  | 'vinDetails'
  | 'newAiConfig'
  | 'processAiConfig'
  | 'viewSourceImages'
  | 'goToVdp'
  | 'disableAiImage'
  | 'delete';

export interface VehiclesMenuAnchor {
  top: number;
  right: number; // distance from right edge of viewport (for position:fixed)
}

// ── MenuItem ──────────────────────────────────────────────────────────────────
interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

function MenuItem({ icon: Icon, label, danger = false, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // layout
        'w-full flex items-center text-left select-none cursor-default',
        // transition
        'transition-colors duration-100',
        // default text colour
        danger ? 'text-[#d32f2f]' : 'text-[#1f1d25]',
        // hover state
        danger
          ? 'hover:bg-[rgba(211,47,47,0.06)]'
          : 'hover:bg-[rgba(0,0,0,0.04)]',
        // pressed state
        danger
          ? 'active:bg-[rgba(211,47,47,0.12)]'
          : 'active:bg-[rgba(0,0,0,0.08)]',
      )}
      style={{ height: 36, paddingLeft: 0, paddingRight: 16 }}
    >
      {/* Left icon slot — 36px wide, matches Figma */}
      <span
        className="flex items-center justify-center shrink-0"
        style={{ width: 36 }}
      >
        <Icon
          size={18}
          strokeWidth={1.6}
          className={danger ? 'text-[#d32f2f]' : 'text-[rgba(17,16,20,0.56)]'}
        />
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

// ── VehiclesMenu (portal) ─────────────────────────────────────────────────────
interface VehiclesMenuProps {
  anchor: VehiclesMenuAnchor;
  onAction: (action: VehiclesMenuAction) => void;
  onClose: () => void;
}

export function VehiclesMenu({ anchor, onAction, onClose }: VehiclesMenuProps) {
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
    // Use capture so we catch clicks before any stopPropagation deeper in the tree
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // ── Helper: fire action and close ─────────────────────────────────────────
  const handle = (action: VehiclesMenuAction) => () => {
    onAction(action);
    onClose();
  };

  return createPortal(
    <>
      <style>{SLIDE_DOWN_STYLE}</style>

      <div
        ref={menuRef}
        role="menu"
        aria-label="Row actions"
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
          // Prevent the menu from clipping at viewport edges
          maxHeight: 'calc(100vh - 16px)',
          overflowY: 'auto',
        }}
      >
        {/* MenuList — 8px vertical padding matching Figma <MenuList> */}
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>

          <MenuItem icon={Pencil}       label="Edit"               onClick={handle('edit')} />
          <MenuItem icon={Download}     label="Download"           onClick={handle('download')} />
          <MenuItem icon={Share2}       label="Share"              onClick={handle('share')} />

          <MenuDivider />

          <MenuItem icon={Globe}        label="Syndicate"          onClick={handle('syndicate')} />
          <MenuItem icon={Info}         label="VIN Details"        onClick={handle('vinDetails')} />
          <MenuItem icon={Sparkles}     label="New AI Config"      onClick={handle('newAiConfig')} />
          <MenuItem icon={RefreshCw}    label="Process AI Config"  onClick={handle('processAiConfig')} />
          <MenuItem icon={Image}        label="View Source Images" onClick={handle('viewSourceImages')} />
          <MenuItem icon={ExternalLink} label="Go to VDP"          onClick={handle('goToVdp')} />
          <MenuItem icon={ImageOff}     label="Disable AI Image"   onClick={handle('disableAiImage')} />

          <MenuDivider />

          <MenuItem icon={Trash2}       label="Delete"             onClick={handle('delete')} danger />

        </div>
      </div>
    </>,
    document.body,
  );
}
