import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { DatavizTooltip } from './DatavizTooltip';
import { Download } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { useClaimPhaseData } from '../../data/access/useClaimPhaseData';
import { useChartAnimation } from '../hooks/useChartAnimation';

export function SubmissionPhaseStackedBarCard({ variant = 'dealer' }: { variant?: 'dealer' | 'oem' }) {
  const { t } = useTranslation();
  const { submissionPhases } = useClaimPhaseData();
  const chartAnim = useChartAnimation();

  const chartData = useMemo(() => {
    // dealer mode: first dealer row + benchmark (last row)
    // oem mode: all rows (up to 10 dealers + benchmark)
    const rows = variant === 'dealer'
      ? submissionPhases.length >= 2
        ? [submissionPhases[0], submissionPhases[submissionPhases.length - 1]]
        : submissionPhases
      : submissionPhases.slice(0, 11);   // max 10 dealers + benchmark

    return rows.map(item => ({ ...item, name: t(item.name) }));
  }, [t, variant, submissionPhases]);

  const displayLegendItems = useMemo(() => {
    if (variant === 'oem') {
      return [
        { name: 'Submission', color: '#6356e1' },
        { name: 'Pre-Approval', color: '#acabff' },
        { name: 'Final Approval', color: '#72c6a8' },
        { name: 'Payment', color: '#e0e0e0' },
      ];
    }
    return [
      { name: 'Submission → Pre-Approval', color: '#6356e1' },
      { name: 'Pre-Approval → Final Approval', color: '#acabff' },
      { name: 'Final Approval → Payment', color: '#72c6a8' },
    ];
  }, [variant]);

  return (
    <div className={cn(
      "bg-white rounded-xl p-3 border border-[rgba(0,0,0,0.12)] flex flex-col gap-2 w-full min-w-0 h-[420px]",
      variant === 'oem' && "h-[500px]"
    )}>
      {/* Header Row */}
      <div className="flex items-start justify-between shrink-0">
        <div className="flex flex-col">
          <h3 className="text-base font-bold text-[#1f1d25] tracking-[0.15px] leading-relaxed">
            {t('Breakdown by time in submission phase')}
          </h3>
          <p className="text-[11px] text-[#1f1d25] tracking-[0.4px] leading-tight">
            {t('In days')}
          </p>
        </div>
        <button 
          className="p-1 rounded-full hover:bg-black/5 text-black/56 transition-colors cursor-pointer"
          title={t('Download')}
        >
          <Download size={24} strokeWidth={2} />
        </button>
      </div>

      {/* Legend Row */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 py-2 shrink-0 max-w-[600px] mx-auto">
        {displayLegendItems.map((item) => (
          <div key={item.name} className="flex items-center gap-1">
            <div 
              className="w-3.5 h-3.5 shrink-0" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[11px] text-[#1f1d25] tracking-[0.4px]">
              {t(item.name)}
            </span>
          </div>
        ))}
      </div>

      {/* Chart Plot Area */}
      <div className="w-full flex-1 min-h-[250px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            layout="vertical" 
            margin={{ top: 0, right: 40, left: 40, bottom: 20 }}
            barSize={variant === 'oem' ? 12 : 60}
            barGap={variant === 'oem' ? 8 : 32}
          >
            <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0.12)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#1f1d25' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 50]}
              ticks={[0, 10, 20, 30, 40, 50]}
              height={30}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={(props) => {
                const { x, y, payload } = props;
                const isBenchmark = payload.value === t('Benchmark');
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={-10}
                      y={0}
                      dy={variant === 'oem' ? 4 : (isBenchmark ? 4 : -4)}
                      textAnchor="end"
                      fill="#1f1d25"
                      className={`text-[10px] ${isBenchmark ? 'font-bold' : 'font-normal'}`}
                    >
                      {variant === 'oem' ? (
                        <tspan>{payload.value.length > 25 ? `${payload.value.substring(0, 22)}...` : payload.value}</tspan>
                      ) : (
                        payload.value.split(' ').map((word: string, i: number, arr: string[]) => (
                          <tspan x={-10} dy={i === 0 ? 0 : 10} key={`tspan-${payload.value}-${i}`}>
                            {word} {i === 1 && arr.length > 2 ? arr.slice(2).join(' ') : ''}
                          </tspan>
                        ))
                      )}
                    </text>
                  </g>
                );
              }}
              tickLine={false}
              axisLine={false}
              width={160}
            />
            <Tooltip 
              content={
                <DatavizTooltip 
                  renderItems={(payload) => {
                    if (!payload || !payload.length) return null;
                    const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
                    return (
                      <div className="space-y-2">
                        {payload.map((entry) => (
                          <div key={entry.dataKey} className="flex items-center justify-between text-[11px] gap-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full shrink-0" 
                                style={{ backgroundColor: entry.color || entry.fill }}
                              />
                              <span className="text-[#686576] font-medium">
                                {entry.name}
                              </span>
                            </div>
                            <span className="text-[#1f1d25] font-semibold tabular-nums">
                              {entry.value}
                            </span>
                          </div>
                        ))}
                        <div className="pt-1.5 mt-1.5 border-t border-[rgba(0,0,0,0.06)] flex justify-between items-center text-[11px] gap-4">
                          <span className="text-[#686576] font-semibold">{t('Total days')}</span>
                          <span className="text-[#1f1d25] font-bold">{total}</span>
                        </div>
                      </div>
                    );
                  }}
                />
              } 
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Bar dataKey="Submission → Pre-Approval" stackId="a" fill="#6356e1" radius={[0, 0, 0, 0]} name={t("Submission → Pre-Approval")} {...chartAnim} />
            <Bar dataKey="Pre-Approval → Final Approval" stackId="a" fill="#acabff" radius={[0, 0, 0, 0]} name={t("Pre-Approval → Final Approval")} {...chartAnim} />
            <Bar dataKey="Final Approval → Payment" stackId="a" fill="#72c6a8" radius={[0, 4, 4, 0]} name={t("Final Approval → Payment")} {...chartAnim} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
