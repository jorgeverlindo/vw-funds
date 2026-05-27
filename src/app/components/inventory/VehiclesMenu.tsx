// ─── VehiclesMenu ─────────────────────────────────────────────────────────────
// Dropdown overlay triggered by the kebab button on each inventory row.
// Mirrors Figma node 10899:97654 — 220px wide, Material shadow, 8px list padding.
// Mounts via React portal so it floats above sticky columns and scrollable panes.

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';
import type { SyndicationStatus, AIGenerationStatus } from '../../../data/inventory/vehicleInventory';

// ── Asset imports (local SVG icons from Figma export) ─────────────────────────
import iconSignal  from '../../../assets/icons/Inventory Table/Card & Row/live-full, signal.svg';
import iconCar     from '../../../assets/icons/Inventory Table/Card & Row/car.svg';
import iconPlus    from '../../../assets/icons/Inventory Table/Card & Row/plus-large, add large.svg';
import iconPhotos  from '../../../assets/icons/Inventory Table/Card & Row/images-2, photos, pictures, shot.svg';
import iconEye     from '../../../assets/icons/Inventory Table/Card & Row/eye-open, show, see, reveal, look, visible.svg';
import iconPower   from '../../../assets/icons/Inventory Table/Card & Row/esc, power.svg';

// ── Keyframe animation ────────────────────────────────────────────────────────
const SLIDE_DOWN_STYLE = `
@keyframes vehiclesMenuIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0px);  }
}
`;

// ── Types ─────────────────────────────────────────────────────────────────────
export type VehiclesMenuAction =
  | 'syndicate'
  | 'vinDetails'
  | 'newAiConfig'
  | 'viewSourceImages'
  | 'goToVdp'
  | 'disableAiImage';

export interface VehiclesMenuAnchor {
  top: number;
  right: number; // distance from right edge of viewport (for position:fixed)
}

// ── MenuItem ──────────────────────────────────────────────────────────────────
interface MenuItemProps {
  iconSrc: string;
  label: string;
  onClick: () => void;
}

function MenuItem({ iconSrc, label, onClick }: MenuItemProps) {
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
        <img
          src={iconSrc}
          alt=""
          width={18}
          height={18}
          draggable={false}
          className="transition-all duration-75 group-active/item:brightness-0 group-active/item:opacity-70 group-active/item:scale-90"
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
  syndicationStatus: SyndicationStatus;
  aiGenerationStatus: AIGenerationStatus;
  onAction: (action: VehiclesMenuAction) => void;
  onClose: () => void;
}

export function VehiclesMenu({ anchor, syndicationStatus, aiGenerationStatus, onAction, onClose }: VehiclesMenuProps) {
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
          maxHeight: 'calc(100vh - 16px)',
          overflowY: 'auto',
        }}
      >
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>

          <MenuItem
            iconSrc={iconSignal}
            label={syndicationStatus === 'syndicated' ? 'Turn Syndicate Off' : 'Syndicate'}
            onClick={handle('syndicate')}
          />
          <MenuItem iconSrc={iconCar}    label="VIN Details"        onClick={handle('vinDetails')} />
          <MenuItem iconSrc={iconPlus}   label="New AI Config"      onClick={handle('newAiConfig')} />

          <MenuDivider />

          <MenuItem iconSrc={iconPhotos} label="View Source Images" onClick={handle('viewSourceImages')} />
          <MenuItem iconSrc={iconEye}    label="Go to VDP"          onClick={handle('goToVdp')} />
          <MenuItem
            iconSrc={iconPower}
            label={aiGenerationStatus === 'enabled' ? 'Disable AI Image' : 'Enable AI Image'}
            onClick={handle('disableAiImage')}
          />

        </div>
      </div>
    </>,
    document.body,
  );
}
