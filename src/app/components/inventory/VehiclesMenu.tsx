// ─── VehiclesMenu ─────────────────────────────────────────────────────────────
// Dropdown overlay triggered by the kebab button on each inventory row.
// Mirrors Figma node 10899:97654 — 220px wide, Material shadow, 8px list padding.
// Mounts via React portal so it floats above sticky columns and scrollable panes.

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils';
import type { SyndicationStatus, AIGenerationStatus } from '../../../data/inventory/vehicleInventory';

// ── Asset imports (local SVG icons from Figma export) ─────────────────────────
const iconSignal = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071160/vw-funds/icons/Inventory_Table/Card___Row/live-full__signal.svg';
const iconCar = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071152/vw-funds/icons/Inventory_Table/Card___Row/car.svg';
const iconPlus = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071162/vw-funds/icons/Inventory_Table/Card___Row/plus-large__add_large.svg';
const iconPhotos = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071158/vw-funds/icons/Inventory_Table/Card___Row/images-2__photos__pictures__shot.svg';
const iconEye = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071156/vw-funds/icons/Inventory_Table/Card___Row/eye-open__show__see__reveal__look__visible.svg';
const iconPower = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071154/vw-funds/icons/Inventory_Table/Card___Row/esc__power.svg';
const iconTrash = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780074746/vw-funds/icons/Inventory_Table/Card___Row/trash.svg';
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
  | 'disableAiImage'
  | 'removeAiConfig'
  | 'attachComment';

export interface VehiclesMenuAnchor {
  top: number;
  right: number; // distance from right edge of viewport (for position:fixed)
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
        {iconSrc
          ? <img
              src={iconSrc}
              alt=""
              width={18}
              height={18}
              draggable={false}
              className="transition-all duration-75 group-active/item:brightness-0 group-active/item:opacity-70 group-active/item:scale-90"
            />
          : iconNode
        }
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
  /** True when an AI config is currently applied to this VIN — shows "Remove AI Config" item */
  aiConfigApplied?: boolean;
  onAction: (action: VehiclesMenuAction) => void;
  onClose: () => void;
}

export function VehiclesMenu({ anchor, syndicationStatus, aiGenerationStatus, aiConfigApplied = false, onAction, onClose }: VehiclesMenuProps) {
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
          {aiConfigApplied && (
            <MenuItem
              iconSrc={iconTrash}
              label="Remove AI Config"
              onClick={handle('removeAiConfig')}
            />
          )}

          <MenuDivider />

          <MenuItem
            iconNode={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(17,16,20,0.56)">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            }
            label="Attach as a comment"
            onClick={handle('attachComment')}
          />

        </div>
      </div>
    </>,
    document.body,
  );
}
