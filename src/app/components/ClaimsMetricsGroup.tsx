import { MetricCard } from './MetricCard';
import { useTranslation } from '../contexts/LanguageContext';

export function ClaimsMetricsGroup({ variant = 'dealer' }: { variant?: 'dealer' | 'oem' }) {
  const { t } = useTranslation();
  return (
    <div className="bg-[#F0F2F4] flex-1 min-h-px min-w-px relative rounded-xl">
      <div className="content-stretch flex flex-col items-start p-2 relative w-full">
        <p className="font-['Roboto'] font-medium leading-6 relative shrink-0 text-[#1f1d25] text-sm tracking-[0.17px] mb-2 px-1">
          {t('Claims')}
        </p>
        <div className="content-center flex flex-wrap gap-2 items-center relative shrink-0 w-full">
          <MetricCard label="Approved YTD" value={variant === 'oem' ? "$31,495,100" : "$314,951"} />
          <MetricCard label="Avg. Submissions/mo" value={variant === 'oem' ? "$3,709,700" : "$37,097"} />
          <MetricCard label="Pending/In-Review Claims" value={variant === 'oem' ? "$5,602,500" : "$56,025"} />
        </div>
      </div>
    </div>
  );
}
