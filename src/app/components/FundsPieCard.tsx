import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DatavizTooltip } from './DatavizTooltip';
import { Download } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useOverviewData } from '../../data/access/useOverviewData';
import { useChartAnimation } from '../hooks/useChartAnimation';

type TabKey = 'funds' | 'available' | 'approved' | 'pending' | 'expiring';
const TABS: { id: TabKey; label: string }[] = [
  { id: 'funds',     label: 'Funds' },
  { id: 'available', label: 'Available' },
  { id: 'approved',  label: 'Approved' },
  { id: 'pending',   label: 'Pending' },
  { id: 'expiring',  label: 'Expiring' },
];

export function FundsPieCard() {
  const { t } = useTranslation();
  const { fundSplitViews, kpis } = useOverviewData();
  const [activeTab, setActiveTab] = useState<TabKey>('available');
  const chartAnim = useChartAnimation();

  const data = fundSplitViews[activeTab];

  const displayTotal = useMemo(() => {
    switch (activeTab) {
      case 'funds':     return kpis.accrualsYTD;
      case 'available': return kpis.availableFunds;
      case 'approved':  return kpis.approvedYTD;
      case 'pending':   return kpis.pendingInReview;
      case 'expiring':  return kpis.expiringThisMonth;
    }
  }, [activeTab, kpis]);

  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)] flex flex-col gap-3 h-[400px] min-w-0">
      <div className="flex justify-between items-start">
        <h3 className="text-base font-medium text-[#1f1d25] tracking-[0.15px] leading-6">
          {t('Funds')}
        </h3>
      </div>

      <div className="flex items-center gap-1 p-1 bg-[#f9fafa] rounded-lg overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.4px] leading-[1.66] rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-[#1f1d25] shadow-sm'
                : 'text-[#686576] hover:text-[#1f1d25]'
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      <div className="w-full h-[200px] min-w-[100px]" style={{ minHeight: '200px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={1}>
          <PieChart>
            <Tooltip
              content={
                <DatavizTooltip
                  title={t('Funds Breakdown')}
                  renderItems={payload => {
                    if (!payload?.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="flex flex-col gap-1 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[11px] font-medium text-[#1f1d25]">{t(item.name)}</span>
                        </div>
                        <div className="flex justify-between items-center pl-4 text-[11px]">
                          <span className="text-[#686576] font-medium">{item.percent}%</span>
                          <span className="text-[#1f1d25] font-semibold">
                            ${item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2} {...chartAnim}>
              {data.map((entry, index) => (
                <Cell key={`cell-funds-${entry.name}-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {data.map(item => (
          <div key={item.name} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <div
                className="px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                {item.percent}%
              </div>
              <span className="text-[#1f1d25]">{t(item.name)}</span>
            </div>
            <span className="text-[#686576] font-medium">
              ${item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-[#E6E8EC]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#686576]">{t(TABS.find(t => t.id === activeTab)?.label ?? 'Available')}</span>
          <span className="text-[#1f1d25] font-semibold">
            ${displayTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
}
