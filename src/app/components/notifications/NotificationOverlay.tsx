import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';
import { useWorkflow } from '../../contexts/WorkflowContext';
import type { WCMItem } from '../WebMonitoringContent';
import type { CaseUpdateNotif } from '../../contexts/ComplianceContext';

interface NotificationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreApproval?: (id: string) => void;
  onOpenClaim?: (id: string) => void;
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
}

export function NotificationOverlay({
  isOpen,
  onClose,
  onOpenPreApproval,
  onOpenClaim,
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
}: NotificationOverlayProps) {
  const { workflow, markNotificationRead } = useWorkflow();

  if (!isOpen) return null;

  // ── Build a unified list sorted by recency (newest first) ──────────────────

  type MergedItem = { key: string; sortMs: number; node: React.ReactNode };
  const merged: MergedItem[] = [];

  // Workflow notifications (dealer-targeted)
  workflow.notifications
    .filter(n => n.targetRole === 'dealer')
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
