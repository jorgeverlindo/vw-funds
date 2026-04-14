import { MetricCard } from './MetricCard';

interface MetricGroupProps {
  title: string;
  metrics: Array<{ label: string; value: string }>;
}

export function MetricGroup({ title, metrics }: MetricGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-[#1f1d25] tracking-[0.17px]">{title}</p>
      <div className="flex flex-col gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex flex-col text-[11px]">
            <span className="text-[#686576]">{metric.label}</span>
            <span className="text-[#1f1d25] font-medium">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
