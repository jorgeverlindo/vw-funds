import { useTranslation } from '../contexts/LanguageContext';
import { usePaymentTransactions } from '../../data/access/usePaymentTransactions';
import { useOverviewData } from '../../data/access/useOverviewData';
import { StatusChip } from './StatusChip';

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export function PaymentStatusTableCard({ variant = 'dealer' }: { variant?: 'dealer' | 'oem' }) {
  const { t } = useTranslation();
  const { rows: data } = usePaymentTransactions();
  const { kpis } = useOverviewData();

  return (
    <div className="bg-white rounded-xl overflow-clip border border-[rgba(0,0,0,0.12)] flex flex-col h-[400px]">
      {/* Header */}
      <div className="content-stretch flex flex-col gap-2 items-start pb-0 pt-3 px-3 relative shrink-0">
        <div className="content-stretch flex gap-2 items-center relative shrink-0 w-full">
          <div className="content-stretch flex gap-2 h-[34px] items-center pl-0 pr-2 py-[10px] relative shrink-0">
            <div className="flex flex-col font-['Roboto'] font-medium justify-center leading-[0] relative shrink-0 text-[#1f1d25] text-base tracking-[0.15px]">
              <p className="leading-6">{variant === 'oem' ? t('Payouts') : t('Payment Status')}</p>
            </div>
          </div>
          <div className="bg-[#f9fafa] content-stretch flex flex-col h-[34px] items-start justify-center px-2 py-0 relative rounded-[20px] shrink-0 w-[200px] border border-[rgba(0,0,0,0.12)]">
            <div className="content-stretch flex flex-1 gap-2 items-center min-h-6 min-w-6 overflow-clip px-0 py-2 relative w-full">
              <svg className="size-6 text-black/56" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex flex-1 flex-col font-['Roboto'] font-normal justify-end leading-[0] max-h-[120px] min-h-px min-w-px relative text-[#9c99a9] text-sm tracking-[0.15px]">
                <p className="leading-[1.5]">{t('Search anything')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Total */}
        <div className="content-stretch flex gap-[3px] items-start relative shrink-0 font-['Roboto'] font-normal leading-[1.66] text-[11px] tracking-[0.4px]">
          <p className="relative shrink-0 text-[#1f1d25]">{t('Total Balance')}</p>
          <p className="relative shrink-0 text-[#686576]">  {fmt(kpis.currentBalance)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="content-stretch flex flex-col items-start pb-2 pt-1 px-3 relative shrink-0 w-full flex-1 overflow-hidden min-h-0">
        <div className="w-full overflow-x-auto overflow-y-auto min-h-0 flex-1">
          <div className="min-w-[500px]">
            {/* Header Row */}
            <div className="content-stretch flex items-start relative shrink-0 w-full border-b border-[rgba(0,0,0,0.12)] sticky top-0 bg-white z-10">
              <div className="flex-1 min-h-px min-w-px relative">
                <div className="content-stretch flex items-start px-4 py-0 relative w-full">
                  <div className="content-stretch flex flex-col h-9 items-start justify-center px-0 py-1.5 relative shrink-0">
                    <p className="font-['Roboto'] font-medium leading-3 relative shrink-0 text-[#686576] text-xs tracking-[0.15px]">{t('Date')}</p>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex items-start px-4 py-0 relative shrink-0 w-[130px]">
                <div className="content-stretch flex flex-col h-9 items-start justify-center px-0 py-1.5 relative shrink-0">
                  <p className="font-['Roboto'] font-medium leading-3 relative shrink-0 text-[#686576] text-xs tracking-[0.15px]">{t('Amount')}</p>
                </div>
              </div>
              <div className="content-stretch flex items-start px-4 py-0 relative shrink-0 w-32">
                <div className="content-stretch flex flex-col h-9 items-start justify-center px-0 py-1.5 relative shrink-0">
                  <p className="font-['Roboto'] font-medium leading-3 relative shrink-0 text-[#686576] text-xs tracking-[0.15px]">{t('Date paid')}</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[10px] items-start px-4 py-0 relative shrink-0 w-[109px]">
                <div className="content-stretch flex flex-col h-9 items-start justify-center px-0 py-1.5 relative shrink-0">
                  <p className="font-['Roboto'] font-medium leading-3 relative shrink-0 text-[#686576] text-xs tracking-[0.15px]">{t('Status')}</p>
                </div>
              </div>
            </div>

            {/* Data Rows */}
            {data.map((row, index) => (
              <div key={index} className="content-stretch flex items-center px-0 py-2 relative shrink-0 w-full border-b border-[rgba(0,0,0,0.12)] last:border-0">
                <div className="flex-1 min-h-px min-w-px relative">
                  <div className="content-stretch flex items-start px-4 py-0 relative w-full">
                    <p className="flex-1 font-['Roboto'] font-normal leading-[1.43] min-h-px min-w-px overflow-hidden relative text-[#1f1d25] text-xs text-ellipsis tracking-[0.17px]">
                      {row.date}
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex items-start px-4 py-0 relative shrink-0 w-[130px]">
                  <p className="flex-1 font-['Roboto'] font-normal leading-[1.43] min-h-px min-w-px overflow-hidden relative text-[#1f1d25] text-xs text-ellipsis tracking-[0.17px]">
                    {row.amount}
                  </p>
                </div>
                <div className="content-stretch flex items-start px-4 py-0 relative shrink-0 w-32">
                  <p className="flex-1 font-['Roboto'] font-normal leading-[1.43] min-h-px min-w-px overflow-hidden relative text-[#1f1d25] text-xs text-ellipsis tracking-[0.17px]">
                    {row.datePaid}
                  </p>
                </div>
                <div className="content-stretch flex gap-[10px] items-start px-4 py-0 relative shrink-0 w-[109px]">
                  <StatusChip status={row.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}