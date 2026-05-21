import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';
import { useWorkflow } from '../../contexts/WorkflowContext';
import type { WCMItem } from '../WebMonitoringContent';
import type { NotifItem as CommentNotifItem } from '../comments/types';
import { getUserById } from '../comments/constants';
import { formatTimestamp } from '../comments/utils';

interface NotificationOverlayOEMProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDrawer: () => void;
  onOpenWebMonitoring: (id: string) => void;
  onOpenPreApproval?: (id: string) => void;
  onOpenClaim?: (id: string) => void;
  className?: string;
  solutionNotifs?: { id: string; solution: { submittedBy: string; submittedAtISO: string; comment: string } }[];
  seenSolutionIds?: Set<string>;
  onOpenSolution?: (id: string) => void;
  reportedNotifs?: WCMItem[];
  seenReportedIds?: Set<string>;
  onOpenReported?: (id: string) => void;
  // Comment notifications (bridged from CommentsContext)
  commentNotifs?: CommentNotifItem[];
  onMarkCommentNotifRead?: (id: string) => void;
  onCommentNotifNavigate?: (notif: CommentNotifItem) => void;
}

export function NotificationOverlayOEM({
  isOpen,
  onClose,
  onOpenDrawer,
  onOpenWebMonitoring,
  onOpenPreApproval,
  onOpenClaim,
  className,
  solutionNotifs, seenSolutionIds, onOpenSolution,
  reportedNotifs, seenReportedIds, onOpenReported,
  commentNotifs,
  onMarkCommentNotifRead,
  onCommentNotifNavigate,
}: NotificationOverlayOEMProps) {
  const { workflow, markNotificationRead } = useWorkflow();

  if (!isOpen) return null;

  // Suppress unused-variable warnings for props kept for API compatibility
  void onOpenDrawer;
  void onOpenWebMonitoring;

  // ── Build a unified list sorted by recency (newest first) ──────────────────

  type MergedItem = { key: string; sortMs: number; node: React.ReactNode };
  const merged: MergedItem[] = [];

  // Workflow notifications (OEM-targeted) — createdAt is a reliable ISO string
  workflow.notifications
    .filter(n => n.targetRole === 'oem')
    .forEach(n => {
      merged.push({
        key: n.id,
        sortMs: new Date(n.createdAt).getTime(),
        node: (
          <div
            onClick={() => {
              markNotificationRead(n.id);
              if (n.type === 'pre-approval') onOpenPreApproval?.(n.referenceId);
              else if (n.type === 'claim') onOpenClaim?.(n.referenceId);
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
                    {n.body}{n.referenceId ? <> <span className="font-medium">{n.referenceId}</span></> : null}
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

  // Dealer-submitted solutions — submittedAtISO is a reliable ISO string
  (solutionNotifs ?? []).forEach(({ id, solution }) => {
    const isRead = seenSolutionIds?.has(id) ?? false;
    merged.push({
      key: `sol-${id}`,
      sortMs: new Date(solution.submittedAtISO).getTime(),
      node: (
        <div
          onClick={() => { onOpenSolution?.(id); onClose(); }}
          className={isRead ? 'opacity-70' : ''}
        >
          <NotificationItem
            id={id}
            type="claim"
            message={
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-normal text-[#1f1d25]">{solution.submittedBy}</span>
                <span className="font-normal text-[#1f1d25] text-[12px]">
                  updated the infraction with a solution <span className="font-medium">{id}</span>
                </span>
              </div>
            }
            time={new Date(solution.submittedAtISO).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            isRead={isRead}
            user={{ name: '', initials: solution.submittedBy.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() }}
          />
        </div>
      ),
    });
  });

  // Dealer-reported infractions — use createdAtISO when available, fall back to detectedOn
  (reportedNotifs ?? []).forEach((infr) => {
    const isRead = seenReportedIds?.has(infr.id) ?? false;
    const sortMs = infr.createdAtISO
      ? new Date(infr.createdAtISO).getTime()
      : new Date(infr.detectedOn).getTime() || 0;
    merged.push({
      key: `rep-${infr.id}`,
      sortMs,
      node: (
        <div
          onClick={() => { onOpenReported?.(infr.id); onClose(); }}
          className={isRead ? 'opacity-70' : ''}
        >
          <NotificationItem
            id={infr.id}
            type="claim"
            message={
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-normal text-[#1f1d25]">{infr.reportedBy ?? 'Dealer'}</span>
                <span className="font-normal text-[#1f1d25] text-[12px]">
                  reported a compliance infraction by {infr.dealership} <span className="font-medium">{infr.id}</span>
                </span>
              </div>
            }
            time={infr.createdAtISO
              ? new Date(infr.createdAtISO).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : infr.detectedOn}
            isRead={isRead}
            user={{ name: '', initials: (infr.reportedBy ?? 'DR').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() }}
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
        'absolute top-full right-0 mt-2 w-[400px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-[110] origin-top-right animate-in fade-in zoom-in-95 duration-200',
        className,
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
