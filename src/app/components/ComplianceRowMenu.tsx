// ─── ComplianceRowMenu ────────────────────────────────────────────────────────
// Portal dropdown for the Compliance datagrid kebab button.
// Mirrors the VehiclesMenu pattern: createPortal, same animation, same MenuItem layout.

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, RotateCcw, Copy, RefreshCw } from 'lucide-react';

const SLIDE_DOWN_STYLE = `
@keyframes vehiclesMenuIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0px);  }
}
`;

export interface ComplianceRowMenuAnchor {
  top: number;
  right: number; // distance from right edge of viewport (position:fixed)
}

interface ComplianceRowMenuProps {
  anchor: ComplianceRowMenuAnchor;
  status: string;
  canDelete: boolean;
  canReopen: boolean;
  canDuplicate: boolean;
  canReset: boolean;
  onDelete: () => void;
  onReopen: () => void;
  onDuplicate: () => void;
  onReset: () => void;
  onClose: () => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onClick, danger }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={
        danger
          ? 'w-full flex items-center text-left text-red-600 hover:bg-red-50 active:bg-red-100 cursor-pointer'
          : 'w-full flex items-center text-left text-[#014361] hover:bg-[rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.08)] cursor-pointer'
      }
      style={{ height: 36, paddingRight: 16 }}
    >
      <span className="flex items-center justify-center shrink-0" style={{ width: 36 }}>
        {icon}
      </span>
      <span className="font-['Roboto',sans-serif] font-normal leading-[21px]" style={{ fontSize: 14 }}>
        {label}
      </span>
    </button>
  );
}

export function ComplianceRowMenu({
  anchor, status, canDelete, canReopen, canDuplicate, canReset, onDelete, onReopen, onDuplicate, onReset, onClose,
}: ComplianceRowMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
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
          width: 200,
          zIndex: 9999,
          borderRadius: 4,
          backgroundColor: '#ffffff',
          boxShadow: [
            '0 5px 5px -3px rgba(0,0,0,0.20)',
            '0 8px 10px  1px rgba(0,0,0,0.14)',
            '0 3px 14px  2px rgba(0,0,0,0.12)',
          ].join(', '),
          animation: 'vehiclesMenuIn 450ms ease-out forwards',
        }}
      >
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
          {canDuplicate && (
            <MenuItem
              icon={<Copy size={15} className="text-[#686576]" />}
              label="Duplicate for testing"
              onClick={() => { onDuplicate(); onClose(); }}
            />
          )}
          {canReopen && status === 'Resolved' && (
            <MenuItem
              icon={<RotateCcw size={15} className="text-[#03A9F4]" />}
              label="Reopen infraction"
              onClick={() => { onReopen(); onClose(); }}
            />
          )}
          {canReset && (
            <MenuItem
              icon={<RefreshCw size={15} className="text-[#686576]" />}
              label="Reset to default"
              onClick={() => { onReset(); onClose(); }}
            />
          )}
          {canDelete && (
            <MenuItem
              icon={<Trash2 size={15} />}
              label="Delete infraction"
              onClick={() => { onDelete(); onClose(); }}
              danger
            />
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
