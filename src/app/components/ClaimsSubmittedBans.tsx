import { Check, MoreHorizontal, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusChip, ClaimStatus } from './StatusChip';

interface ClaimsSubmittedBansProps {
  activeFilter: ClaimStatus | null;
  onFilterChange: (status: ClaimStatus | null) => void;
  counts: {
    approved: number;
    pending: number;
    inReview: number;
  };
  amounts: {
    approved: number;
    pending: number;
    inReview: number;
  };
}

export function ClaimsSubmittedBans({ activeFilter, onFilterChange, counts, amounts }: ClaimsSubmittedBansProps) {
  
  const handleCardClick = (status: ClaimStatus) => {
    if (activeFilter === status) {
      onFilterChange(null);
    } else {
      onFilterChange(status);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
      <h3 className="text-sm font-semibold text-[#1f1d25] mb-4">Claims Submitted</h3>
      
      <div className="flex gap-4">
        {/* Approved Card */}
        <FilterCard 
          status="Approved"
          amount={amounts.approved}
          isActive={activeFilter === 'Approved'}
          onClick={() => handleCardClick('Approved')}
          colorStyles="bg-[#E8F5E9] text-[#1b5e20] border-[#4CAF50]"
          iconColor="text-[#4CAF50]"
          icon={<Check className="w-3 h-3" />}
        />

        {/* Pending Card */}
        <FilterCard 
          status="Pending"
          amount={amounts.pending}
          isActive={activeFilter === 'Pending'}
          onClick={() => handleCardClick('Pending')}
          colorStyles="bg-[#E1F5FE] text-[#014361] border-[#03A9F4]"
          iconColor="text-[#03A9F4]"
          icon={<MoreHorizontal className="w-3 h-3" />}
        />

        {/* In Review Card */}
        <FilterCard 
          status="In Review"
          amount={amounts.inReview}
          isActive={activeFilter === 'In Review'}
          onClick={() => handleCardClick('In Review')}
          colorStyles="bg-[#FFF3E0] text-[#E65100] border-[#EF6C00]"
          iconColor="text-[#EF6C00]"
          icon={<Eye className="w-3 h-3" />}
        />
      </div>
    </div>
  );
}

function FilterCard({ 
  status, 
  amount, 
  isActive, 
  onClick, 
  colorStyles,
  iconColor,
  icon 
}: { 
  status: string; 
  amount: number; 
  isActive: boolean; 
  onClick: () => void; 
  colorStyles: string;
  iconColor: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-start p-4 rounded-lg border transition-all text-left cursor-pointer",
        isActive 
          ? "bg-gray-50 ring-2 ring-offset-1 ring-[#6200EE] border-transparent" 
          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
      )}
    >
      <div className="mb-3">
        <StatusChip status={status} />
      </div>
      <div className="text-[20px] font-medium text-[#1f1d25] tracking-tight">
        ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </div>
    </button>
  );
}