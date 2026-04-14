import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DatavizTooltip } from './DatavizTooltip';
import { Download } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const data = [
  { name: 'Available', value: 5727277.02, percent: 30.50, color: '#51B994' }, // Green
  { name: 'Reimbursed', value: 13052849.98, percent: 69.50, color: 'rgba(247, 134, 100, 0.9)' }, // Orange
];

const totalBalance = 18780127.00;

export function FundUtilizationDonutCard({ variant = 'dealer' }: { variant?: 'dealer' | 'oem' }) {
  const { t } = useTranslation();
  const chartData = variant === 'oem' ? data.map(d => ({ ...d, value: d.value * 10 })) : data;
  const total = variant === 'oem' ? totalBalance * 10 : totalBalance;

  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)] flex flex-col gap-3 h-[400px] min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-medium text-[#1f1d25] tracking-[0.15px] leading-6 shrink-0">
          {t('Fund utilization')}
        </h3>
        
        <div className="flex items-center gap-2">
            <select className="text-xs text-[#686576] bg-[#f9fafa] border border-[#cac9cf] rounded px-2 py-1 shrink-0 cursor-pointer">
                <option>{t('Select Fund')}</option>
            </select>
            {variant === 'oem' && (
                <button 
                    className="p-1.5 rounded-full hover:bg-black/5 text-[#ACABFF] hover:text-[#2f2673] transition-colors cursor-pointer"
                    title={t('Download')}
                >
                    <Download size={20} />
                </button>
            )}
        </div>
      </div>

      {/* Donut Chart with centered total */}
      <div className="relative w-full h-[240px] min-w-[100px]" style={{ minHeight: '240px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={1}>
          <PieChart>
            <Tooltip 
              wrapperStyle={{ zIndex: 1000 }}
              content={
                <DatavizTooltip 
                  title={t("Utilization")}
                  renderItems={(payload) => {
                    if (!payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="flex flex-col gap-1 min-w-[140px]">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                           <span className="text-[11px] font-medium text-[#1f1d25]">{t(item.name)}</span>
                        </div>
                        <div className="flex justify-between items-center pl-4 text-[11px]">
                           <span className="text-[#686576] font-medium">{item.percent}%</span>
                           <span className="text-[#1f1d25] font-semibold">${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-utilization-${entry.name}-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Label - positioned absolutely with lower z-index */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0">
          <div className="text-[11px] text-[#686576] leading-tight">{t('Total Balance')}</div>
          <div className="text-base font-semibold text-[#1f1d25] mt-1">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Legend with Percent Pills */}
      <div className="space-y-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              {/* Percent Pill */}
              <div
                className="px-2 py-0.5 rounded-full font-medium text-white text-center min-w-[40px]"
                style={{
                  backgroundColor: item.color,
                }}
              >
                {item.percent}%
              </div>
              <span className="text-[#1f1d25]">{t(item.name)}</span>
            </div>
            <span className="text-[#686576] font-medium">
              ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
