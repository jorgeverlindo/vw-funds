import { NotificationItem, NotificationItemProps } from './NotificationItem';
import { cn } from '@/lib/utils';
import { useWorkflow } from '../../contexts/WorkflowContext';

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
    referenceId: 'MFC539811',
    message: null,
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
  onOpenPreApproval?: (id: string) => void;
  onOpenClaim?: (id: string) => void;
  className?: string;
}

export function NotificationOverlay({ isOpen, onClose, onOpenPreApproval, onOpenClaim, className }: NotificationOverlayProps) {
  const { workflow, markNotificationRead } = useWorkflow();

  if (!isOpen) return null;

  // Dealer-targeted workflow notifications, newest first
  const dealerNotifs: NotificationItemProps[] = workflow.notifications
    .filter(n => n.targetRole === 'dealer')
    .map(n => ({
      id: n.id,
      type: n.type,
      message: (
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-normal text-[#1f1d25]">{n.user?.name ?? n.title}</span>
          <span className="font-normal text-[#1f1d25] text-[12px]">{n.body}</span>
        </div>
      ),
      time: n.time,
      isRead: n.isRead,
      user: n.user ? { ...n.user, name: '' } : undefined,
    }));

  const handleWorkflowClick = (id: string) => {
    markNotificationRead(id);
    const notif = workflow.notifications.find(n => n.id === id);
    if (notif) {
      if (notif.type === 'pre-approval') onOpenPreApproval?.(notif.referenceId);
      else if (notif.type === 'claim') onOpenClaim?.(notif.referenceId);
    }
    onClose();
  };

  return (
    <div
      className={cn(
        "absolute top-full right-0 mt-2 w-[400px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-[110] origin-top-right animate-in fade-in zoom-in-95 duration-200",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col max-h-[480px] overflow-y-auto custom-scrollbar">
        {/* Workflow notifications — dynamic, dealer-targeted, pinned at top */}
        {dealerNotifs.map((notif) => (
          <div
            key={notif.id}
            onClick={() => handleWorkflowClick(notif.id as string)}
            className={notif.isRead ? 'opacity-70' : ''}
          >
            <NotificationItem {...notif} />
          </div>
        ))}

        {/* Static dealer mock notifications */}
        {MOCK_NOTIFICATIONS.map((notif) => (
          <NotificationItem
            key={notif.id}
            {...notif}
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
