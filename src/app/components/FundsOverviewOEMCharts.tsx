import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, ReferenceLine, LabelList } from 'recharts';
import { Download } from 'lucide-react';
import { DatavizTooltip } from './DatavizTooltip';
import { useTranslation } from '../contexts/LanguageContext';
import { useOverviewData } from '../../data/access/useOverviewData';
import { useClaimPhaseData } from '../../data/access/useClaimPhaseData';

const CardHeader = ({ title, subtitle, onDownload }: { title: string; subtitle?: string; onDownload?: () => void }) => (
  <div className="flex justify-between items-start mb-4">
    <div>
      <h3 className="text-base font-medium text-[#1f1d25] tracking-[0.15px] leading-6">{title}</h3>
      {subtitle && <p className="text-[11px] text-[#686576] font-normal tracking-[0.4px] leading-[1.66]">{subtitle}</p>}
    </div>
    <button
      onClick={onDownload}
      className="p-1.5 rounded-full hover:bg-black/5 text-[#ACABFF] hover:text-[#2f2673] transition-colors cursor-pointer"
      title="Download CSV"
    >
      <Download size={20} />
    </button>
  </div>
);

export function AccruedFundsRooftopCard() {
  const { t } = useTranslation();
  const { rooftopChart } = useOverviewData();
  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)] flex flex-col h-[400px]">
      <CardHeader title={t('Accrued funds — by rooftop (USD)')} />
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={1}>
          <BarChart data={rooftopChart} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E0E0E0" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#686576' }} interval={0} />
            <Tooltip
              content={<DatavizTooltip title={t('Accrued funds — by rooftop (USD)')} />}
              cursor={{ fill: 'transparent' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
            />
            <Bar dataKey="value" fill="#6050E0" radius={[0, 4, 4, 0]} barSize={16} animationDuration={1000}>
              <LabelList
                dataKey="value"
                position="right"
                style={{ fontSize: '10px', fill: '#686576' }}
                formatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AccruedFundsRegionCard() {
  const { t } = useTranslation();
  const { regionChart } = useOverviewData();
  const total = regionChart.reduce((s, r) => s + r.value, 0) || 1;
  const dataWithPercent = regionChart.map(item => ({ ...item, percent: item.value / total }));

  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)] flex flex-col h-[400px]">
      <CardHeader title={t('Accrued Funds — by Region (USD)')} />
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={1}>
          <PieChart>
            <Pie
              data={dataWithPercent}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {dataWithPercent.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DatavizTooltip title={t('Accrued Funds — by Region (USD)')} />} />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: '11px', color: '#1f1d25' }}
              formatter={(value: string, entry: { payload?: { percent?: number } }) => (
                <span className="text-[#1f1d25] ml-1">
                  {value} ({Math.round((entry.payload?.percent ?? 0) * 100)}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SubmittedClaimsRooftopCard() {
  const { t } = useTranslation();
  const { claimsRooftopChart } = useOverviewData();
  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)] flex flex-col h-[400px]">
      <CardHeader title={t('Submitted Claims — by Rooftop (Count)')} />
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={1}>
          <BarChart data={claimsRooftopChart} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E0E0E0" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#686576' }} interval={0} />
            <Tooltip content={<DatavizTooltip title={t('Submitted Claims — by Rooftop (Count)')} />} cursor={{ fill: 'transparent' }} />
            <Bar dataKey="value" fill="#51B994" radius={[0, 4, 4, 0]} barSize={16} animationDuration={1000}>
              <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fill: '#686576' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function LongestPaymentTimeCard() {
  const { t } = useTranslation();
  const { paymentTimings, paymentAverage: average } = useClaimPhaseData();
  const data = paymentTimings.map(r => ({ name: r.id, value: r.days }));

  return (
    <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.12)] flex flex-col gap-2 w-full min-w-0">
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-base font-semibold text-[#1f1d25] tracking-[0.17px] leading-6">
          {t('Time in Payment phase')}
        </h3>
        <button
          className="p-1.5 rounded-full hover:bg-black/5 text-[#ACABFF] hover:text-[#2f2673] transition-colors cursor-pointer"
          title="Download"
        >
          <Download size={20} />
        </button>
      </div>
      <p className="text-[11px] text-[#686576] shrink-0">{t('Claim ID vs days')}</p>
      <div className="w-full h-[320px] min-w-[100px]" style={{ minHeight: '320px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={1}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 10, bottom: 20 }}
            barSize={16}
            barGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E0E0E0" />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#686576' }} tickLine={false} axisLine={{ stroke: '#E6E8EC' }} domain={[0, 25]} />
            <YAxis
              dataKey="name"
              type="category"
              width={80}
              tick={{ fontSize: 11, fill: '#686576' }}
              interval={0}
              tickFormatter={(val: string) => val.trim()}
            />
            <Tooltip content={<DatavizTooltip title={t('In days')} />} cursor={{ fill: 'transparent' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {LONGEST_PAYMENT_TIME_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.value > average ? '#F78664' : '#51B994'} />
              ))}
            </Bar>
            <ReferenceLine
              x={average}
              stroke="#686576"
              strokeDasharray="3 3"
              isFront={true}
              label={({ viewBox }: { viewBox: { x: number; y: number; height: number } }) => {
                const { x, y, height } = viewBox;
                return (
                  <text x={x + 5} y={y + height - 5} fill="#1F1D25" fontSize="10" fontWeight="500" textAnchor="start">
                    {`${t('Average')}: ${average}`}
                  </text>
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
