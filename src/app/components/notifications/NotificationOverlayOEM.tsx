import { AlertTriangle } from 'lucide-react';
import { NotificationItem, NotificationItemProps } from './NotificationItem';
import { cn } from '@/lib/utils';

// Each entry in OEM_NOTIFICATIONS follows NotificationItemProps.
// For items with user defined: the render loop composes message as [name / action text].
// For the violation item (user: undefined): message is a ReactNode with icon + title + body,
// rendered as-is since no avatar slot exists.
const OEM_NOTIFICATIONS: NotificationItemProps[] = [
  {
    id: '1',
    type: 'claim',
    message: 'Submitted a new claim',
    time: '8 min ago',
    user: {
      name: 'Felix Orbit',
      initials: 'MS',
    },
  },
  // Index 1 — Violation detected (web monitoring alert)
  // user: undefined so NotificationItem renders no avatar slot;
  // message is a ReactNode containing the icon container + title + body per spec.
  {
    id: 'violation',
    type: 'claim',
    time: '2 hours ago',
    user: undefined,
    message: (
      <div className="flex items-start gap-3">
        {/* Left icon container as specified */}
        <div className="w-8 h-8 rounded-full bg-[rgba(210,50,63,0.08)] flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={16} color="#D2323F" />
        </div>
        {/* Title + body text column */}
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <span
            className="font-normal text-[#1F1D25]"
            style={{ fontSize: 14, lineHeight: '1.5', letterSpacing: '0.15px' }}
          >
            Violation detected
          </span>
          <span
            className="font-normal text-[#1F1D25]"
            style={{ fontSize: 12, lineHeight: '1.43', letterSpacing: '0.17px' }}
          >
            on Jack Daniels Volkswagen website. Review and take action.
          </span>
        </div>
      </div>
    ),
  },
  {
    id: '2',
    type: 'pre-approval',
    message: 'Submitted a new pre-approval',
    time: '1 day ago',
    user: {
      name: 'John Nash',
      initials: 'MS',
    },
  },
  {
    id: '3',
    type: 'claim',
    message: 'Submitted a new claim review',
    time: '2 days ago',
    user: {
      name: 'Any Silberstein',
      initials: 'MS',
    },
  },
];

interface NotificationOverlayOEMProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDrawer: () => void;
  onOpenWebMonitoring: (id: string) => void;
  className?: string;
}

export function NotificationOverlayOEM({
  isOpen,
  onClose,
  onOpenDrawer,
  onOpenWebMonitoring,
  className,
}: NotificationOverlayOEMProps) {
  if (!isOpen) return null;

  const handleItemClick = (id: string) => {
    // Existing item click behavior — unchanged
    if (id === '1') {
      onOpenDrawer();
      onClose();
      return;
    }
    // New violation notification click
    if (id === 'violation') {
      onClose();
      onOpenWebMonitoring('WCM-24091');
      return;
    }
    // ids '2' and '3' — no action (unchanged)
  };

  return (
    <div
      className={cn(
        'absolute top-full right-0 mt-2 w-[400px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-[110] origin-top-right animate-in fade-in zoom-in-95 duration-200',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col max-h-[480px] overflow-y-auto custom-scrollbar">
        {OEM_NOTIFICATIONS.map((notif) => (
          <div key={notif.id} onClick={() => handleItemClick(notif.id)}>
            <NotificationItem
              {...notif}
              message={
                notif.user
                  ? // Existing pattern: name on top, action text below
                    (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-normal text-[#1f1d25]">{notif.user.name}</span>
                        <span className="font-normal text-[#1f1d25] text-[12px]">
                          {notif.message as string}
                        </span>
                      </div>
                    )
                  : // Violation notification: message ReactNode already contains icon + text
                    notif.message
              }
              // For items with a user: blank the name so it isn't double-rendered inside NotificationItem
              // For the violation item (user=undefined): pass undefined so no avatar slot renders
              user={notif.user ? { ...notif.user, name: '' } : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
