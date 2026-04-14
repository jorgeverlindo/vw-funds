import { useTranslation } from '../contexts/LanguageContext';

interface FilterSelectProps {
  label: string;
  value: string;
  width?: string;
}

export function FilterSelect({ label, value, width = 'w-fit' }: FilterSelectProps) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col gap-1 w-fit`}>
      <label className="text-[12px] text-[#686576] font-normal tracking-[0.15px] leading-3 px-1 whitespace-nowrap">
        {t(label)}
      </label>
      <div className="relative bg-[#f9fafa] rounded border border-[#cac9cf] px-2 h-10 flex items-center min-w-max gap-2">
        <p className="text-[12px] text-[#1f1d25] font-normal tracking-[0.17px] leading-[1.43] whitespace-nowrap">
          {t(value)}
        </p>
        <svg className="size-6 text-black/56 -mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
