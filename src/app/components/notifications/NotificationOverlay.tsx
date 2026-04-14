import { NotificationItem, NotificationItemProps } from './NotificationItem';
import { cn } from '@/lib/utils';

const MOCK_NOTIFICATIONS: NotificationItemProps[] = [
  {
    id: '1',
    type: 'claim',
    referenceId: 'MFA386592',
    message: 'claim has a new status:',
    time: '12 min ago',
    status: 'Revision Requested'
  },
  {
    id: '2',
    type: 'pre-approval',
    referenceId: 'MFC539881',
    message: 'pre-approval has a new status:',
    time: '50 min ago',
    status: 'Approved'
  },
  {
    id: '3',
    type: 'comment',
    referenceId: 'MFC539811', // Referenced in comment subtext
    message: null, // Custom handling in Item for comments structure if needed, or just pass empty here and handle logic
    time: '1 day ago',
    user: {
      name: 'Marie Smith',
      initials: 'MS'
    }
  },
  {
    id: '4',
    type: 'claim',
    referenceId: 'MFA386592',
    message: 'claim has a new status:',
    time: '12 days ago',
    status: 'Denied'
  }
];

interface NotificationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function NotificationOverlay({ isOpen, onClose, className }: NotificationOverlayProps) {
  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "absolute top-full right-0 mt-2 w-[400px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-[110] origin-top-right animate-in fade-in zoom-in-95 duration-200",
        className
      )}
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
      <div className="flex flex-col max-h-[480px] overflow-y-auto custom-scrollbar">
        {MOCK_NOTIFICATIONS.map((notif) => (
          <NotificationItem 
            key={notif.id} 
            {...notif} 
            // Special handling to match exact design for Comment type where structure is a bit different
            message={
               notif.type === 'comment' ? (
                 <span><span className="font-bold">{notif.user?.name}</span></span>
               ) : notif.message
            }
          />
        ))}
      </div>
    </div>
  );
}
