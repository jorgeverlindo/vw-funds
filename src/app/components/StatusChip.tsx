import { Check, MoreHorizontal, Eye, Hourglass, XCircle, FileCheck, Banknote, CreditCard, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../contexts/LanguageContext';

// ─── SeverityChip ─────────────────────────────────────────────────────────────
// Moved from WebMonitoringContent.tsx — lives here alongside StatusChip.
const SEVERITY_TOKENS = {
  High:   { bg: 'bg-[rgba(210,50,63,0.08)]',  text: 'text-[#be0e1c]', dot: 'bg-[#D2323F]' },
  Medium: { bg: 'bg-[rgba(225,118,19,0.08)]', text: 'text-[#613f02]', dot: 'bg-[#E17613]' },
  Low:    { bg: 'bg-[#F3F4F6]',               text: 'text-[#686576]', dot: 'bg-[#9C99A9]' },
} as const;

type SeverityLevel = keyof typeof SEVERITY_TOKENS;

export function SeverityChip({ severity }: { severity: string }) {
  const token = SEVERITY_TOKENS[severity as SeverityLevel] ?? SEVERITY_TOKENS.Low;
  return (
    <span
      className={cn(
        "rounded-[8px] px-2 py-1 text-[11px] font-normal font-['Roboto'] tracking-[0.4px] inline-flex items-center gap-1.5 select-none whitespace-nowrap leading-tight",
        token.bg,
        token.text,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', token.dot)} />
      {severity}
    </span>
  );
}

export type ClaimStatus =
  | 'Approved'
  | 'Pending'
  | 'In Review'
  | 'Revision Requested'
  | 'Denied'
  | 'Finished'
  | 'Penalty Applied'
  | 'Ready for Payment'
  | 'Paid'
  | 'At risk';

interface StatusChipProps {
  status: ClaimStatus | string; // Allow string to support flexible API data, but type strongly where possible
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  const { t } = useTranslation();
  let styles = "";
  let icon = null;

  // Normalize status for case-insensitive matching if needed, 
  // but usually we expect exact matches. 
  // We'll stick to strict matching for the specific variants requested.
  
  switch (status) {
    case 'Approved':
    case 'Paid out':
      styles = "bg-[#E8F5E9] text-[#1b5e20]"; // Green
      icon = (
        <div className="w-3.5 h-3.5 mr-1.5 flex items-center justify-center rounded-full border border-[#4CAF50]">
          <Check className="w-2.5 h-2.5 text-[#4CAF50]" strokeWidth={3} />
        </div>
      );
      break;
    case 'Pending':
      styles = "bg-[#E1F5FE] text-[#014361]"; // Blue
      icon = (
        <div className="w-3.5 h-3.5 mr-1.5 flex items-center justify-center rounded-full border border-[#03A9F4] text-[#03A9F4]">
            <MoreHorizontal className="w-2.5 h-2.5" />
        </div>
      );
      break;
    case 'Open':
      styles = "bg-[#E1F5FE] text-[#014361]"; // Blue — same palette as Pending, label reads "Open"
      icon = (
        <div className="w-3.5 h-3.5 mr-1.5 flex items-center justify-center rounded-full border border-[#03A9F4] text-[#03A9F4]">
            <MoreHorizontal className="w-2.5 h-2.5" />
        </div>
      );
      break;
    case 'In Review':
      styles = "bg-[#FFF3E0] text-[#E65100]"; // Orange
      icon = <Eye className="w-3.5 h-3.5 mr-1.5 text-[#EF6C00]" />;
      break;
    case 'Revision Requested':
      styles = "bg-[#FFF3E0] text-[#E65100]"; // Orange/Brown (Same as In Review base, but maybe different icon)
      // Annex 3 shows Revision Requested with Hourglass and light orange bg
      icon = <Hourglass className="w-3.5 h-3.5 mr-1.5 text-[#E17613]" />;
      styles = "bg-[#FFF3E0] text-[#613f02]"; // Specific color from Annex 3
      // Override based on NotificationStack import which uses specific colors
      // "bg-[rgba(225,118,19,0.08)] text-[#613f02]"
      styles = "bg-[rgba(225,118,19,0.08)] text-[#613f02]";
      break;
    case 'Denied':
      // Annex 3 (NotificationStack) Denied:
      // bg-[rgba(210,50,63,0.08)] text-[#be0e1c]
      styles = "bg-[rgba(210,50,63,0.08)] text-[#be0e1c]";
      icon = <XCircle className="w-3.5 h-3.5 mr-1.5 text-[#D2323F]" />;
      break;
    case 'Finished':
      // Assuming 'Finished' might appear in other contexts, using a neutral or success-like style
      styles = "bg-gray-100 text-gray-700";
      icon = <FileCheck className="w-3.5 h-3.5 mr-1.5" />;
      break;
    case 'Penalty Applied':
      styles = "bg-[rgba(210,50,63,0.08)] text-[#be0e1c]"; // Red — same as Denied
      icon = <XCircle className="w-3.5 h-3.5 mr-1.5 text-[#D2323F]" />;
      break;
    case 'Ready for Payment':
      styles = "bg-[#E8F5E9] text-[#1b5e20]"; // Green — same as Approved
      icon = <Banknote className="w-3.5 h-3.5 mr-1.5 text-[#4CAF50]" />;
      break;
    case 'Paid':
      styles = "bg-[#E8F5E9] text-[#1b5e20]"; // Green
      icon = <CreditCard className="w-3.5 h-3.5 mr-1.5 text-[#4CAF50]" />;
      break;
    case 'At risk':
      styles = "bg-[rgba(210,50,63,0.08)] text-[#be0e1c]"; // Red error pattern
      icon = <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-[#D2323F]" />;
      break;
    default:
      // Fallback for unknown statuses
      styles = "bg-gray-100 text-gray-600";
      break;
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-[8px] text-[11px] font-normal font-['Roboto'] tracking-[0.4px] leading-tight select-none whitespace-nowrap",
        styles,
        className
      )}
    >
      {icon}
      <span>{t(status)}</span>
    </div>
  );
}