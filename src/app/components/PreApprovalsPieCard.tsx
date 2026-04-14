import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DatavizTooltip } from './DatavizTooltip';
import { Download } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const data = [
  { name: 'Approved', value: 14883, percent: 86.01, color: '#51B994' },
  { name: 'Declined', value: 2000, percent: 11.56, color: 'rgba(247, 134, 100, 0.9)' },
  { name: 'Revision Requested', value: 206, percent: 1.19, color: '#2F2673' },
  { name: 'Pending', value: 51, percent: 0.29, color: '#A8A8F8' },
];

export function PreApprovalsPieCard({ variant = 'dealer' }: { variant?: 'dealer' | 'oem' }) {
  const { t } = useTranslation();
  // Mock scaling for OEM
  const displayData = variant === 'oem' ? data.map(d => ({ ...d, value: d.value * 10 })) : data;

  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)] flex flex-col gap-3 h-[320px] min-w-0">
      <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-[#1f1d25] tracking-[0.15px] leading-6">
            {t('Pre-Approvals')}
          </h3>
          <button 
            className="p-1.5 rounded-full hover:bg-black/5 text-[#ACABFF] hover:text-[#2f2673] transition-colors cursor-pointer"
            title={t('Download')}
          >
            <Download size={20} />
          </button>
      </div>

      <div className="flex items-center flex-1 min-h-0 gap-6">
          {/* Chart Left - Using explicit width/height strategy where possible, or robust flex */}
          <div className="flex-1 h-[240px] min-w-[100px] relative" style={{ minHeight: '240px' }}>
             <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={1}>
              <PieChart>
                <Tooltip 
                  content={
                    <DatavizTooltip 
                      title={t("Pre-Approvals")}
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
                               <span className="text-[#1f1d25] font-semibold">{item.value.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Pie
                    data={displayData}
                    cx="50%"
                    cy="50%"
                    outerRadius="90%"
                    dataKey="value"
                    stroke="none"
                >
                    {displayData.map((entry, index) => (
                    <Cell key={`cell-pre-approval-${entry.name}-${index}`} fill={entry.color} />
                    ))}
                </Pie>
              </PieChart>
             </ResponsiveContainer>
          </div>

          {/* Legend Right */}
          <div className="w-[180px] space-y-3 pl-4 border-l border-gray-100 shrink-0">
            {displayData.map((item) => (
            <div key={item.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                        <div
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white min-w-[32px] text-center"
                            style={{
                            backgroundColor: item.color,
                            }}
                        >
                            {item.percent}%
                        </div>
                        <span className="text-[#1f1d25] truncate max-w-[80px]">{t(item.name)}</span>
                    </div>
                    <span className="text-[#1f1d25] font-medium text-right">
                        {item.value.toLocaleString()}
                    </span>
                </div>
            </div>
            ))}
          </div>
      </div>
    </div>
  );
}
