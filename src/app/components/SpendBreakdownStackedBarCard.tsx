import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DatavizTooltip } from './DatavizTooltip';
import { Download } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const spendDataDealer = [
  { category: 'MEDIA - CPO', value: 1440893.42, percent: 3.20, color: '#6050E0' },
  { category: 'MEDIA - OTHER', value: 39067277.93, percent: 86.64, color: '#A8A8F8' },
  { category: 'HARD', value: 4582202.69, percent: 10.16, color: 'rgba(247, 134, 100, 0.9)' },
];

const spendDataOEM = [
  { category: 'MEDIA - CPO', value: 14408930.42, percent: 12.20, color: '#6050E0' },
  { category: 'MEDIA - OTHER', value: 89067277.93, percent: 76.64, color: '#A8A8F8' },
  { category: 'HARD', value: 14582202.69, percent: 11.16, color: 'rgba(247, 134, 100, 0.9)' },
];

export function SpendBreakdownStackedBarCard({ variant = 'dealer' }: { variant?: 'dealer' | 'oem' }) {
  const { t } = useTranslation();
  
  const displayData = variant === 'oem' ? spendDataOEM : spendDataDealer;

  const chartData = useMemo(() => [
    {
      name: 'Total',
      'MEDIA - CPO': displayData[0].percent,
      'MEDIA - OTHER': displayData[1].percent,
      'HARD': displayData[2].percent,
    }
  ], [displayData]);

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
                    title={t("Spend")}
                    renderItems={() => (
                      <div className="space-y-3">
                        {displayData.map((item) => (
                          <div key={item.category} className="flex flex-col gap-0.5">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-[10px] font-semibold text-[#686576] uppercase tracking-wider">
                                  {t(item.category)}
                                </span>
                             </div>
                             <div className="flex justify-between items-center pl-4 gap-4">
                                <span className="text-[11px] font-medium text-[#1f1d25]">
                                  {item.percent.toFixed(2)}%
                                </span>
                                <span className="text-[11px] text-[#686576]">
                                  ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="MEDIA - CPO" stackId="a" fill="#6050E0" radius={[4, 0, 0, 4]} barSize={32} name={t("MEDIA - CPO")} />
              <Bar dataKey="MEDIA - OTHER" stackId="a" fill="#A8A8F8" radius={[0, 0, 0, 0]} barSize={32} name={t("MEDIA - OTHER")} />
              <Bar dataKey="HARD" stackId="a" fill="rgba(247, 134, 100, 0.9)" radius={[0, 4, 4, 0]} barSize={32} name={t("HARD")} />
            </BarChart>
          </ResponsiveContainer>
          </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 mt-auto">
        {displayData.map((item) => (
          <div key={item.category} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <div
                className="px-2 py-0.5 rounded-full font-medium text-white text-[10px]"
                style={{
                  backgroundColor: item.color,
                }}
              >
                {item.percent.toFixed(2)}%
              </div>
              <span className="text-[#1f1d25] uppercase tracking-wider text-[10px] font-medium">{t(item.category)}</span>
            </div>
            <span className="text-[#1f1d25] font-normal">
              ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
