import { X, Eye, Star, Users, Check, AlertCircle, Clock } from 'lucide-react';
import { StatusChip, ClaimStatus } from './StatusChip';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { KeyValueRow } from './ui/KeyValueRow';
import { useTranslation } from '../contexts/LanguageContext';

// Reuse types or define new ones
export interface Claim {
  id: string;
  uid: string;
  date: Date;
  amount: number;
  status: ClaimStatus; // Update to use the shared type
  timeInClaim: number;
  timeInPayment: number;
  dealershipCode: string;
  dealershipName: string;
  dealershipCity: string;
  fund: string;
  submittedBy: {
    name: string;
    avatarUrl: string;
  };
  type: string;
  lastUpdated: string;
  details?: string;
}

interface ClaimsPanelProps {
  claim: Claim;
  onClose: () => void;
}

export function ClaimsPanel({ claim, onClose }: ClaimsPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#E0E0E0] shrink-0">
        <div className="flex flex-col">
          <h2 className="text-[#1f1d25] text-[20px] font-medium tracking-[0.15px] leading-tight">
            {t('Claim')} - {claim.id}
          </h2>
          <span className="text-sm text-[#686576] mt-1">{claim.dealershipName}</span>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Actions */}
           <div className="flex items-center gap-2">
             <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E0E0E0] hover:bg-gray-50 transition-colors cursor-pointer">
               <Star className="w-3.5 h-3.5 text-[#9C99A9]" />
               <span className="text-[13px] font-medium text-[#1f1d25]/80">{t('Follow')}</span>
             </button>
             
             <StatusChip status={claim.status} />
           </div>

           <div className="w-px h-6 bg-[#E0E0E0] mx-1"></div>

           <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
             <X className="w-5 h-5 text-[#686576]" />
           </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-8 py-6 space-y-8">
          
          {/* Overview Section */}
          <section>
            <h3 className="text-[#1f1d25] text-[15px] font-medium mb-4">{t('Claim Overview')}</h3>
            <div className="space-y-0">
              <KeyValueRow label={t('Amount')} value={`$${claim.amount.toLocaleString()}`} valueClass="font-semibold text-lg" />
              <KeyValueRow label={t('Date Submitted')} value={claim.date.toLocaleDateString()} />
              <KeyValueRow label={t('Fund')} value={claim.fund} />
              <KeyValueRow label={t('Type')} value={claim.type} />
              <KeyValueRow label={t('Submitted by')} value={claim.submittedBy.name} />
              <KeyValueRow label={t('Time in Claim')} value={`${claim.timeInClaim} days`} />
              <KeyValueRow label={t('Time in Payment')} value={`${claim.timeInPayment} days`} />
            </div>
          </section>

          {/* Details Section (Stub) */}
          <section>
            <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">{t('Details')}</h3>
            <div className="border border-[#E0E0E0] rounded-lg p-4 bg-gray-50">
               <p className="text-[13px] text-[#686576]">
                 {claim.details || t('No additional details provided for this claim.')}
               </p>
            </div>
          </section>

          {/* Documents (Stub) */}
          <section>
            <h3 className="text-[#1f1d25] text-[15px] font-medium mb-3">{t('Documents')}</h3>
            <div className="border border-[#E0E0E0] rounded-lg p-0 flex overflow-hidden bg-white max-w-md">
                 <div className="w-[72px] bg-[#F5F5F5] flex items-center justify-center border-r border-[#E0E0E0] shrink-0">
                   <div className="w-10 h-12 bg-white border border-[#E0E0E0] shadow-sm flex items-center justify-center">
                      <span className="text-[9px] font-bold text-[#FF5252]">PDF</span>
                   </div>
                 </div>
                 <div className="flex-1 p-3 flex items-center justify-between min-w-0">
                   <div className="flex flex-col min-w-0 pr-3">
                     <span className="text-[#1f1d25] text-[13px] font-medium truncate mb-0.5">Invoice_{claim.id}.pdf</span>
                     <span className="text-[#686576] text-[11px] uppercase tracking-wide">PDF | 1.2 MB</span>
                   </div>
                   <button className="text-[#686576] hover:text-[#1f1d25] p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
                     <Eye className="w-5 h-5" />
                   </button>
                 </div>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[#E0E0E0] bg-white shrink-0">
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-full text-sm font-medium text-[#111014]/60 hover:bg-black/5 transition-colors cursor-pointer"
          >
            {t('Cancel')}
          </button>
          <button
            className="px-6 py-2 bg-[#473BAB] hover:bg-[#3D3295] text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            {t('Process Payment')}
          </button>
        </div>
      </div>
    </div>
  );
}


