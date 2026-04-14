import { MetricCard } from './MetricCard';
import { useTranslation } from '../contexts/LanguageContext';
import { useOverviewData } from '../../data/access/useOverviewData';

const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export function BalanceMetricsGroup() {
  const { t } = useTranslation();
  const { kpis } = useOverviewData();
  return (
    <div className="bg-[#F0F2F4] flex-1 min-h-px min-w-px relative rounded-xl">
      <div className="content-stretch flex flex-col items-start p-2 relative w-full">
        <p className="font-['Roboto'] font-medium leading-6 relative shrink-0 text-[#1f1d25] text-sm tracking-[0.17px] mb-2 px-1">
          {t('Balance')}
        </p>
        <div className="content-center flex flex-wrap gap-2 items-center relative shrink-0 w-full">
          <MetricCard label="Current Balance"     value={fmt(kpis.currentBalance)} />
          <MetricCard label="Available Funds"     value={fmt(kpis.availableFunds)} />
          <MetricCard label="Proj. EOY Balance"   value={fmt(kpis.projEOYBalance)} />
          <MetricCard label="Expiring this month" value={fmt(kpis.expiringThisMonth)} />
        </div>
      </div>
    </div>
  );
}
