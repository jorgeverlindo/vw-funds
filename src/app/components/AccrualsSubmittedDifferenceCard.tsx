import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, LabelList, Tooltip as RechartsTooltip } from 'recharts';
import { createPortal } from 'react-dom';
import { useTranslation } from '../contexts/LanguageContext';

// Data
const data = [
  { month: "Jan '25", accruals: 64236, submitted: 52358, difference: 11877 },
  { month: "Feb '25", accruals: 34781, submitted: 50390, difference: -15609 },
  { month: "Mar '25", accruals: 29773, submitted: 56260, difference: -26487 },
  { month: "Apr '25", accruals: 33368, submitted: 57554, difference: -24186 },
  { month: "May '25", accruals: 17052, submitted: 49663, difference: -32611 },
  { month: "Jun '25", accruals: 34359, submitted: 51260, difference: -16901 },
  { month: "Jul '25", accruals: 46211, submitted: 53449, difference: -7238 },
  { month: "Aug '25", accruals: 56217, submitted: 65598, difference: -9381 },
  { month: "Sep '25", accruals: 59509, submitted: 62345, difference: -2836 },
  { month: "Oct '25", accruals: 57444, submitted: 55320, difference: 2124 },
  { month: "Nov '25", accruals: 37494, submitted: 41560, difference: -4066 },
  { month: "Dec '25", accruals: 0, submitted: 0, difference: 0 },
];

// Components

const MetricBan = ({ title, metrics, groupKey }: { title: string, metrics: { label: string, value: string }[], groupKey: string }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-[14px] font-semibold text-[#1f1d25] tracking-[0.17px]">{t(title)}</h4>
      <div className="flex gap-2">
        {metrics.map((m, idx) => (
            <div key={`${groupKey}-${m.label}-${idx}`} className="border border-[#E0E0E0] rounded-lg px-3 py-2 min-w-[120px] bg-white">
                <div className="text-[11px] text-[#686576] font-normal leading-[1.66]">{t(m.label)}</div>
                <div className="text-[14px] text-[#1f1d25] font-normal leading-[1.43]">{m.value}</div>
            </div>
        ))}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Find relevant data
    const accruals = payload.find((p: any) => p.dataKey === 'accruals');
    const submitted = payload.find((p: any) => p.dataKey === 'submitted');
    const difference = payload.find((p: any) => p.dataKey === 'difference');

    const { t } = useTranslation();

    return (
      <div className="bg-white rounded-md shadow-lg border border-gray-100 p-3 min-w-[200px]">
        <div className="mb-2 border-b border-gray-100 pb-1">
           <span className="font-medium text-[14px] text-gray-900">{label}</span>
        </div>
        <div className="flex flex-col gap-1">
          {accruals && (
            <div className="flex items-center justify-between text-[11px] gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#6050E0]" />
                <span className="text-gray-500">{t('Accruals')} ($)</span>
              </div>
              <span className="text-gray-900 text-right">${accruals.value.toLocaleString()}</span>
            </div>
          )}
          {submitted && (
             <div className="flex items-center justify-between text-[11px] gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#F89070]" />
                <span className="text-gray-500">{t('Submitted')} ($)</span>
              </div>
              <span className="text-gray-900 text-right">${submitted.value.toLocaleString()}</span>
            </div>
          )}
          {difference && (
             <div className="flex items-center justify-between text-[11px] gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#9CA3AF]" />
                <span className="text-gray-500">{t('Difference')} ($)</span>
              </div>
              <span className="text-gray-900 text-right">${difference.value.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function AccrualsSubmittedDifferenceCard() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(0,0,0,0.12)] flex flex-col gap-8 min-w-0">
      {/* Header with KPI BANs */}
      <div className="flex items-start gap-8">
        <MetricBan
          title="Accruals"
          groupKey="accruals"
          metrics={[
            { label: 'Year-to-Date', value: '$470,444' },
            { label: 'Avg. Accrual/mo', value: '$42,767' },
          ]}
        />
        <MetricBan
          title="Submitted"
          groupKey="submitted"
          metrics={[
            { label: 'Year-to-Date', value: '$370,354' },
            { label: 'Avg. Submitted/mo', value: '$32,424' },
          ]}
        />
      </div>

      {/* Chart */}
      <div className="w-full h-[280px] min-w-[100px]" style={{ minHeight: '280px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={1}>
          <BarChart data={data} margin={{ top: 20, right: 0, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EC" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#686576' }}
              tickLine={false}
              axisLine={{ stroke: '#E6E8EC' }}
              tickFormatter={(value) => value}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#686576' }}
              tickLine={false}
              axisLine={false}
              width={50}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="square"
              iconSize={8}
              formatter={(value) => (
                <span className="text-[11px] text-[#686576] ml-1">{t(value)}</span>
              )}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            
            <Bar dataKey="accruals" fill="#6050E0" name="Accruals">
               <LabelList dataKey="accruals" position="top" fontSize={9} fill="#6050E0" formatter={(val: number) => val ? `$${(val/1000).toFixed(1)}k` : ''} />
            </Bar>
            <Bar dataKey="submitted" fill="#F89070" name="Submitted">
               <LabelList dataKey="submitted" position="top" fontSize={9} fill="#F89070" formatter={(val: number) => val ? `$${(val/1000).toFixed(1)}k` : ''} />
            </Bar>
            <Bar dataKey="difference" fill="#9CA3AF" name="Difference">
               <LabelList dataKey="difference" position="top" fontSize={9} fill="#9CA3AF" formatter={(val: number) => val ? `$${(val/1000).toFixed(1)}k` : ''} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}