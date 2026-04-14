import { useTranslation } from '../contexts/LanguageContext';
import { usePaymentTransactions } from '../../data/access/usePaymentTransactions';

export function PaymentStatusTable() {
  const { t } = useTranslation();
  const { rows: paymentData } = usePaymentTransactions();
  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-[16px] font-medium text-[#1f1d25] tracking-[0.15px]">
            {t('Payment Status')}
          </h3>
          <div className="bg-[#f9fafa] h-[34px] rounded-full px-3 flex items-center gap-2 border border-[rgba(0,0,0,0.12)]">
            <svg className="size-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              placeholder={t('Find below')}
              className="w-[160px] bg-transparent border-none outline-none text-sm text-[#9c99a9]"
            />
          </div>
        </div>
        <div className="text-[11px] text-[#686576] tracking-[0.4px]">
          Total <span className="text-[#1f1d25]">$1,741,685.45</span>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[rgba(0,0,0,0.12)] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f9fafa] border-b border-[rgba(0,0,0,0.12)]">
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-medium text-[#686576] tracking-[0.15px]">{t('Date')}</span>
                  <svg className="size-4 text-[#686576]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M7 10l5 5 5-5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-medium text-[#686576] tracking-[0.15px]">{t('Amount')}</span>
                  <svg className="size-4 text-[#686576]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M7 10l5 5 5-5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-medium text-[#686576] tracking-[0.15px]">{t('Date paid')}</span>
                  <svg className="size-4 text-[#686576]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M7 10l5 5 5-5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-medium text-[#686576] tracking-[0.15px]">{t('Status')}</span>
                  <svg className="size-4 text-[#686576]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M7 10l5 5 5-5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paymentData.map((row, index) => (
              <tr
                key={index}
                className="border-b border-[rgba(0,0,0,0.12)] last:border-0 hover:bg-[#f9fafa]/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-[12px] text-[#1f1d25] tracking-[0.17px]">{row.date}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-[#1f1d25] tracking-[0.17px]">{row.amount}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-[#1f1d25] tracking-[0.17px]">{row.datePaid}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#DFF7EA] text-[#1F7A4D] text-[11px] font-medium tracking-[0.4px]">
                    {t(row.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
