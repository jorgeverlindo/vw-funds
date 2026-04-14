import { StatusChip, ClaimStatus } from '../StatusChip';
import { cn } from '@/lib/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export interface NotificationItemProps {
  id: string;
  type: 'claim' | 'pre-approval' | 'comment';
  referenceId?: string; // e.g., MFA386592
  message: React.ReactNode;
  time: string;
  status?: ClaimStatus;
  user?: {
    name: string;
    avatarUrl?: string;
    initials?: string;
  };
  isRead?: boolean;
}

export function NotificationItem({
  type,
  referenceId,
  message,
  time,
  status,
  user,
  isRead = false,
}: NotificationItemProps) {
  return (
    <div 
      className={cn(
        "group flex items-start gap-3 p-3 w-full border-b border-gray-100 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer",
        !isRead ? "bg-white" : "bg-gray-50/50"
      )}
    >
      {/* Avatar (if comment/user related) */}
      {user && (
        <div className="flex-shrink-0">
          {user.avatarUrl ? (
            <div className="w-8 h-8 rounded-full overflow-hidden">
               <ImageWithFallback src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#bcbbc2] flex items-center justify-center text-white text-[12px] font-medium tracking-wide">
              {user.initials || user.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          {/* Main Message */}
          <div className="text-[14px] text-[#1f1d25] font-normal leading-[1.5] tracking-[0.15px]">
             {referenceId && <span className="font-bold">{referenceId} </span>}
             {message}
          </div>
          
          {/* Timestamp */}
          <div className="text-[12px] text-[#9c99a9] whitespace-nowrap tracking-[0.17px] leading-[1.43]">
            {time}
          </div>
        </div>

        {/* Status Chip (if applicable) */}
        {status && (
          <div className="mt-1.5">
            <StatusChip status={status} />
          </div>
        )}

        {/* User Comment Subtext (if applicable) */}
        {user && type === 'comment' && (
          <div className="mt-0.5 text-[12px] text-[#1f1d25] tracking-[0.17px] leading-[1.43]">
             {user.name}
             <div className="text-[#9c99a9] mt-0.5">Left a comment on {referenceId}</div>
          </div>
        )}
      </div>
    </div>
  );
}
