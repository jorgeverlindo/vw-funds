import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';
import { useWorkflow } from '../../contexts/WorkflowContext';
import type { WCMItem } from '../WebMonitoringContent';
import type { CaseUpdateNotif } from '../../contexts/ComplianceContext';
import type { NotifItem as CommentNotifItem } from '../comments/types';
import { getUserById } from '../comments/constants';
import { formatTimestamp } from '../comments/utils';

interface NotificationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreApproval?: (id: string) => void;
  onOpenClaim?: (id: string) => void;
  /** Called when a project-mention notification is clicked — id is the projectId */
  onOpenProject?: (projectId: string) => void;
  /** Current user's display name — project-mention notifs sent by this user are hidden */
  currentUserName?: string;
  className?: string;
  // Compliance infractions logged by OEM that pertain to this dealer
  infractionNotifs?: WCMItem[];
  seenInfractionIds?: Set<string>;
  onOpenInfraction?: (id: string) => void;
  // Dealer-submitted infractions — confirmation that report was accepted
  submittedNotifs?: WCMItem[];
  seenSubmittedIds?: Set<string>;
  onOpenSubmitted?: (id: string) => void;
  // Case status update notifications (OEM reviewed/resolved a compliance item)
  caseUpdateNotifs?: CaseUpdateNotif[];
  seenCaseUpdateIds?: Set<string>;
  onOpenCaseUpdate?: (id: string) => void;
  // Comment notifications (bridged from CommentsContext)
  commentNotifs?: CommentNotifItem[];
  onMarkCommentNotifRead?: (id: string) => void;
  onCommentNotifNavigate?: (notif: CommentNotifItem) => void;
}

export function NotificationOverlay({
  isOpen,
  onClose,
  onOpenPreApproval,
  onOpenClaim,
  onOpenProject,
  currentUserName,
  className,
  infractionNotifs,
  seenInfractionIds,
  onOpenInfraction,
  submittedNotifs,
  seenSubmittedIds,
  onOpenSubmitted,
  caseUpdateNotifs,
  seenCaseUpdateIds,
  onOpenCaseUpdate,
  commentNotifs,
  onMarkCommentNotifRead,
  onCommentNotifNavigate,
}: NotificationOverlayProps) {
  const { workflow, markNotificationRead } = useWorkflow();

  if (!isOpen) return null;

  // ── Build a unified list sorted by recency (newest first) ──────────────────

  type MergedItem = { key: string; sortMs: number; node: React.ReactNode };
  const merged: MergedItem[] = [];

  // Workflow notifications (dealer-targeted)
  workflow.notifications
    .filter(n => n.targetRole === 'dealer')
    // Hide project-mention notifs that the current user sent themselves
    .filter(n => !(n.type === 'project-mention' && currentUserName && n.user?.name === currentUserName))
    .forEach(n => {
      merged.push({
        key: `wf-${n.id}`,
        sortMs: new Date(n.createdAt).getTime(),
        node: (
          <div
            onClick={() => {
              markNotificationRead(n.id);
              if (n.type === 'pre-approval') onOpenPreApproval?.(n.referenceId);
              else if (n.type === 'claim') onOpenClaim?.(n.referenceId);
              else if (n.type === 'project-mention') onOpenProject?.(n.referenceId);
              onClose();
            }}
            className={n.isRead ? 'opacity-70' : ''}
          >
            <NotificationItem
              id={n.id}
              type={n.type}
              message={
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-normal text-[#1f1d25]">{n.user?.name ?? n.title}</span>
                  <span className="font-normal text-[#1f1d25] text-[12px]">
                    {n.body}{n.type !== 'project-mention' && n.referenceId ? <> <span className="font-medium">{n.referenceId}</span></> : null}
                  </span>
                </div>
              }
              time={n.time}
              isRead={n.isRead}
              user={n.user ? { ...n.user, name: '' } : undefined}
            />
          </div>
        ),
      });
    });

  // OEM-added infractions against this dealer
  (infractionNotifs ?? []).forEach((infr) => {
    const isRead = seenInfractionIds?.has(infr.id) ?? false;
    const sortMs = infr.createdAtISO
      ? new Date(infr.createdAtISO).getTime()
      : new Date(infr.detectedOn).getTime() || 0;
    merged.push({
      key: `infr-${infr.id}`,
      sortMs,
      node: (
        <div
          onClick={() => { onOpenInfraction?.(infr.id); onClose(); }}
          className={isRead ? 'opacity-70' : ''}
        >
          <NotificationItem
            id={infr.id}
            type="claim"
            message={
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-normal text-[#1f1d25]">New compliance infraction logged</span>
                <span className="font-normal text-[#1f1d25] text-[12px]">
                  {infr.violationType} <span className="font-medium">{infr.id}</span>
                </span>
              </div>
            }
            time={infr.createdAtISO
              ? new Date(infr.createdAtISO).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : infr.detectedOn}
            isRead={isRead}
          />
        </div>
      ),
    });
  });

  // Dealer-submitted infraction reports (confirmation)
  (submittedNotifs ?? []).forEach((infr) => {
    const isRead = seenSubmittedIds?.has(infr.id) ?? false;
    const sortMs = infr.createdAtISO
      ? new Date(infr.createdAtISO).getTime()
      : new Date(infr.detectedOn).getTime() || 0;
    merged.push({
      key: `sub-${infr.id}`,
      sortMs,
      node: (
        <div
          onClick={() => { onOpenSubmitted?.(infr.id); onClose(); }}
          className={isRead ? 'opacity-70' : ''}
        >
          <NotificationItem
            id={infr.id}
            type="claim"
            message={
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-normal text-[#1f1d25]">Infraction report submitted</span>
                <span className="font-normal text-[#1f1d25] text-[12px]">
                  {infr.violationType} · Pending OEM review <span className="font-medium">{infr.id}</span>
                </span>
              </div>
            }
            time={infr.createdAtISO
              ? new Date(infr.createdAtISO).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : infr.detectedOn}
            isRead={isRead}
          />
        </div>
      ),
    });
  });

  // Case status updates from OEM
  (caseUpdateNotifs ?? []).forEach((notif) => {
    const isRead = seenCaseUpdateIds?.has(notif.id) ?? false;
    merged.push({
      key: `cu-${notif.id}`,
      sortMs: new Date(notif.timestampISO).getTime(),
      node: (
        <div
          onClick={() => { onOpenCaseUpdate?.(notif.id); onClose(); }}
          className={isRead ? 'opacity-70' : ''}
        >
          <NotificationItem
            id={notif.id}
            type="claim"
            message={
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-normal text-[#1f1d25]">Compliance case update</span>
                <span className="font-normal text-[#1f1d25] text-[12px]">
                  {notif.message} <span className="font-medium">{notif.itemId}</span>
                </span>
              </div>
            }
            time={new Date(notif.timestampISO).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            isRead={isRead}
          />
        </div>
      ),
    });
  });

  // Comment notifications
  (commentNotifs ?? []).forEach((notif) => {
    const actor = getUserById(notif.actorId);
    const actionLabel: Record<string, string> = {
      mentioned_you:  'mentioned you',
      replied_to_you: 'replied to your comment',
      commented:      'left a comment',
      pinned:         'pinned a comment',
      assigned_you:   'assigned you to a task',
    };
    const label = actionLabel[notif.action] ?? notif.action;
    merged.push({
      key: `comment-${notif.id}`,
      sortMs: notif.timestamp,
      node: (
        <div
          onClick={() => {
            onMarkCommentNotifRead?.(notif.id);
            onCommentNotifNavigate?.(notif);
            onClose();
          }}
          className={notif.isRead ? 'opacity-70' : ''}
        >
          <NotificationItem
            id={notif.id}
            type="comment"
            message={
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-medium text-[#1f1d25]">{actor?.name ?? 'Someone'}</span>
                <span className="text-[#686576] text-[12px]">
                  {label}{notif.projectName ? ` in ${notif.projectName}` : ''}
                </span>
                {notif.preview && (
                  <span className="text-[#9c99a9] text-[11px] line-clamp-1 mt-0.5">{notif.preview}</span>
                )}
              </div>
            }
            time={formatTimestamp(notif.timestamp)}
            isRead={notif.isRead}
            user={actor ? {
              name: actor.name,
              initials: actor.initials,
            } : undefined}
          />
        </div>
      ),
    });
  });

  // Sort newest first
  merged.sort((a, b) => b.sortMs - a.sortMs);

  return (
    <div
      className={cn(
        "absolute top-full right-0 mt-2 w-[400px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-[110] origin-top-right animate-in fade-in zoom-in-95 duration-200",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col max-h-[480px] overflow-y-auto custom-scrollbar">
        {merged.map(m => (
          <div key={m.key}>{m.node}</div>
        ))}

        {merged.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-1.5">
            <span className="text-[14px] font-medium text-[#1F1D25]">You're all caught up</span>
            <span className="text-[12px] text-[#9C99A9]">No new notifications</span>
          </div>
        )}
      </div>
    </div>
  );
}
