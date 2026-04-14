import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DatavizTooltip } from './DatavizTooltip';
import { Download } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useOverviewData } from '../../data/access/useOverviewData';

export function SpendBreakdownStackedBarCard() {
  const { t } = useTranslation();
  const { spendBreakdown } = useOverviewData();

  // Sort to stable order: CPO, OTHER, HARD
  const displayData = useMemo(() => {
    const order = ['MEDIA - CPO', 'MEDIA - OTHER', 'HARD'];
    return [...spendBreakdown].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  }, [spendBreakdown]);

  const chartData = useMemo(() => {
    const row: Record<string, number | string> = { name: 'Total' };
    displayData.forEach(item => { row[item.category] = item.percent; });
    return [row];
  }, [displayData]);

  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)] flex flex-col gap-4 h-[320px] min-w-0">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-[#1f1d25] tracking-[0.15px] leading-6">
          {t('Spend')}
        </h3>
        <button
          className="p-1.5 rounded-full hover:bg-black/5 text-[#ACABFF] hover:text-[#2f2673] transition-colors cursor-pointer"
          title={t('Download')}
        >
          <Download size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 w-full min-w-0">
        <div className="w-full min-w-[100px] flex-1" style={{ minHeight: '120px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={120} debounce={1}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#686576' }}
                tickLine={false}
                axisLine={{ stroke: '#E6E8EC' }}
                ticks={[0, 20, 40, 60, 80, 100]}
              />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                cursor={false}
                content={
                  <DatavizTooltip
                    title={t('Spend')}
                    renderItems={() => (
                      <div className="space-y-3">
                        {displayData.map(item => (
                          <div key={item.category} className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-[10px] font-semibold text-[#686576] uppercase tracking-wider">
                                {t(item.category)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pl-4 gap-4">
                              <span className="text-[11px] font-medium text-[#1f1d25]">{item.percent.toFixed(2)}%</span>
                              <span className="text-[11px] text-[#686576]">
                                ${item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                }
              />
              {displayData.map((item, idx) => (
                <Bar
                  key={item.category}
                  dataKey={item.category}
                  stackId="a"
                  fill={item.color}
                  barSize={32}
                  radius={idx === 0 ? [4, 0, 0, 4] : idx === displayData.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                  name={t(item.category)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        {displayData.map(item => (
          <div key={item.category} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <div
                className="px-2 py-0.5 rounded-full font-medium text-white text-[10px]"
                style={{ backgroundColor: item.color }}
              >
                {item.percent.toFixed(2)}%
              </div>
              <span className="text-[#1f1d25] uppercase tracking-wider text-[10px] font-medium">
                {t(item.category)}
              </span>
            </div>
            <span className="text-[#1f1d25] font-normal">
              ${item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
