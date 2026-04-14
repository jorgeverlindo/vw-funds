import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DatavizTooltip } from './DatavizTooltip';
import { useTranslation } from '../contexts/LanguageContext';
import { useOverviewData } from '../../data/access/useOverviewData';

export function FundUtilizationDonutCard() {
  const { t } = useTranslation();
  const { utilizationData } = useOverviewData();

  const chartData = [
    { name: 'Available',  value: utilizationData.available,  percent: utilizationData.availablePercent,  color: '#51B994' },
    { name: 'Reimbursed', value: utilizationData.reimbursed, percent: utilizationData.reimbursedPercent, color: 'rgba(247, 134, 100, 0.9)' },
  ];

  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)] flex flex-col gap-3 h-[400px] min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-medium text-[#1f1d25] tracking-[0.15px] leading-6 shrink-0">
          {t('Fund utilization')}
        </h3>
        <div className="flex items-center gap-2">
          <select className="text-xs text-[#686576] bg-[#f9fafa] border border-[#cac9cf] rounded px-2 py-1 shrink-0 cursor-pointer">
            <option>{t('Select Fund')}</option>
          </select>
        </div>
      </div>

      <div className="relative w-full h-[240px] min-w-[100px]" style={{ minHeight: '240px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={1}>
          <PieChart>
            <Tooltip
              wrapperStyle={{ zIndex: 1000 }}
              content={
                <DatavizTooltip
                  title={t('Utilization')}
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
            <Pie data={chartData} key={utilizationData.total} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" animationBegin={0} animationDuration={600}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-utilization-${entry.name}-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0">
          <div className="text-[11px] text-[#686576] leading-tight">{t('Total Balance')}</div>
          <div className="text-base font-semibold text-[#1f1d25] mt-1">
            ${utilizationData.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {chartData.map(item => (
          <div key={item.name} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <div
                className="px-2 py-0.5 rounded-full font-medium text-white text-center min-w-[40px]"
                style={{ backgroundColor: item.color }}
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
    </div>
  );
}
