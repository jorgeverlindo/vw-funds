import { MetricCard } from './MetricCard';
import { useTranslation } from '../contexts/LanguageContext';

export function BalanceMetricsGroup({ variant = 'dealer' }: { variant?: 'dealer' | 'oem' }) {
  const { t } = useTranslation();
  return (
    <div className="bg-[#F0F2F4] flex-1 min-h-px min-w-px relative rounded-xl">
      <div className="content-stretch flex flex-col items-start p-2 relative w-full">
        <p className="font-['Roboto'] font-medium leading-6 relative shrink-0 text-[#1f1d25] text-sm tracking-[0.17px] mb-2 px-1">
          {t('Balance')}
        </p>
        <div className="content-center flex flex-wrap gap-2 items-center relative shrink-0 w-full">
          <MetricCard label="Current Balance" value={variant === 'oem' ? "$15,492,000" : "$155,492"} />
          <MetricCard label="Available Funds" value={variant === 'oem' ? "$9,946,700" : "$99,467"} />
          <MetricCard label="Proj. EOY Balance" value={variant === 'oem' ? "$1,201,300" : "$12,013"} />
          <MetricCard label="Expiring this month" value={variant === 'oem' ? "$413,000" : "$4,130"} />
        </div>
      </div>
    </div>
  );
}
