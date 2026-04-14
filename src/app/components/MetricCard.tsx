import { useTranslation } from '../contexts/LanguageContext';

interface MetricCardProps {
  label: string;
  value: string;
}

export function MetricCard({ label, value }: MetricCardProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl px-3 py-2 border border-[rgba(0,0,0,0.12)] min-w-[100px] max-w-[360px] flex-1">
      {/* Remove overflow-clip to prevent text clipping */}
      <div className="content-stretch flex flex-col gap-0.5 items-start max-w-[inherit] min-w-[inherit] relative rounded-[inherit]">
        <p className="font-['Roboto'] font-normal leading-[1.66] relative shrink-0 text-[#1f1d25] text-[11px] tracking-[0.4px]">
          {t(label)}
        </p>
        <div className="content-end flex flex-wrap items-end justify-between relative shrink-0 w-full">
          <p className="font-['Roboto'] font-normal leading-[1.75] relative shrink-0 text-[#686576] text-base tracking-[0.15px]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}