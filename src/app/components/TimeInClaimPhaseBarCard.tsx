import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Cell, Tooltip } from 'recharts';
import { Download } from 'lucide-react';
import { DatavizTooltip } from './DatavizTooltip';
import { useTranslation } from '../contexts/LanguageContext';
import { useClaimPhaseData } from '../../data/access/useClaimPhaseData';
import { useChartAnimation } from '../hooks/useChartAnimation';

export function TimeInClaimPhaseBarCard() {
  const { t } = useTranslation();
  const { claimTimings: data, claimAverage: average } = useClaimPhaseData();
  const chartAnim = useChartAnimation();
  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)] flex flex-col gap-3 w-full min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1f1d25] tracking-[0.17px] leading-6">
            {t('Time in Claim phase')}
          </h3>
          <p className="text-[11px] text-[#686576] mt-1">{t('Claim ID vs days')}</p>
        </div>
        <button className="text-[#686576] hover:text-[#473bab] active:text-[#2f2673] transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100">
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Fixed height container for Recharts stability */}
      <div className="w-full min-w-[100px] h-[260px]" style={{ minHeight: '260px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={1}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EC" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#686576' }}
              tickLine={false}
              axisLine={{ stroke: '#E6E8EC' }}
              domain={[0, 12]}
              ticks={[0, 2, 4, 6, 8, 10, 12]}
            />
            <YAxis
              type="category"
              dataKey="id"
              tick={{ fontSize: 10, fill: '#686576' }}
              tickLine={false}
              axisLine={false}
              width={70}
              reversed={true}
            />
            <Tooltip
              content={
                <DatavizTooltip
                  renderTitle={(payload) => payload[0]?.payload.id}
                  renderItems={(payload) => {
                    if (!payload || !payload.length) return null;
                    const item = payload[0];
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-4 text-[11px]">
                          <span className="text-[#686576]">{t('In days')}</span>
                          <span className="font-semibold text-[#1f1d25]">{item.value}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4 text-[11px]">
                          <span className="text-[#686576]">{t('Benchmark')}</span>
                          <span className="font-semibold text-[#1f1d25]">{average}</span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={12} {...chartAnim}>
               {data.map((entry, index) => (
                  <Cell key={`cell-${entry.id}-${index}`} fill={entry.days > average ? 'rgba(247, 134, 100, 0.9)' : '#60C098'} />
               ))}
            </Bar>
            <ReferenceLine x={average} stroke="#9CA3AF" strokeDasharray="4 4" strokeWidth={1} isFront>
              <text 
                x={average} 
                y={245} 
                dx={5}
                dy={0}
                fontSize={10} 
                fill="#686576" 
                textAnchor="start"
                className="bg-white/80" 
              >
                {`${t('Average')}: ${average}`}
              </text>
            </ReferenceLine>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}