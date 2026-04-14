import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DatavizTooltip } from './DatavizTooltip';
import { Download } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const fundsData = [
  { name: 'DMF - Media Costs', value: 4289810.05, percent: 74.88, color: '#6050E0' },
  { name: 'DMF - Hard Costs', value: 1439102.94, percent: 25.12, color: 'rgba(247, 134, 100, 0.9)' },
];

const rawTabs = ['Funds', 'Available', 'Approved', 'Pending', 'Expiring'];

export function FundsPieCard({ variant = 'dealer' }: { variant?: 'dealer' | 'oem' }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('Available');
  
  const total = variant === 'oem' ? 57289129.90 : 5728912.99;

  const data = variant === 'oem' ? fundsData.map(d => ({
    ...d,
    value: d.value * 10
  })) : fundsData;

  const tabs = useMemo(() => rawTabs.map(tab => ({
    id: tab,
    label: t(tab)
  })), [t]);

  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)] flex flex-col gap-3 h-[400px] min-w-0">
      {/* Title */}
      <div className="flex justify-between items-start">
        <h3 className="text-base font-medium text-[#1f1d25] tracking-[0.15px] leading-6">
            {t('Funds')}
        </h3>
        {variant === 'oem' && (
            <button 
                className="p-1.5 rounded-full hover:bg-black/5 text-[#ACABFF] hover:text-[#2f2673] transition-colors cursor-pointer"
                title={t('Download')}
            >
                <Download size={20} />
            </button>
        )}
      </div>

      {/* Internal Tabs - scrollable */}
      <div className="flex items-center gap-1 p-1 bg-[#f9fafa] rounded-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-[11px] font-medium tracking-[0.4px] leading-[1.66] rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-[#1f1d25] shadow-sm'
                : 'text-[#686576] hover:text-[#1f1d25]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full h-[200px] min-w-[100px]" style={{ minHeight: '200px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={1}>
          <PieChart>
          <Tooltip 
            content={
              <DatavizTooltip 
                title={t("Funds Breakdown")}
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
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-funds-${entry.name}-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      </div>

      {/* Legend with Percent Pills */}
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              {/* Percent Pill */}
              <div
                className="px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${item.color}20`,
                  color: item.color,
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

      {/* Available Total */}
      <div className="pt-3 border-t border-[#E6E8EC]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#686576]">{t('Available')}</span>
          <span className="text-[#1f1d25] font-semibold">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
