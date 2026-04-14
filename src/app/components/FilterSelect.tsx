import { useTranslation } from '../contexts/LanguageContext';

interface FilterSelectOption {
  value: string | null;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string | null;
  width?: string;
  // When provided → controlled mode. When omitted → static display (backward compat).
  options?: FilterSelectOption[];
  onChange?: (value: string | null) => void;
}

export function FilterSelect({ label, value, width = 'w-fit', options, onChange }: FilterSelectProps) {
  const { t } = useTranslation();

  if (options && onChange) {
    // Controlled mode — native <select> with appearance-none
    return (
      <div className={`flex flex-col gap-1 ${width}`}>
        <label className="text-[12px] text-[#686576] font-normal tracking-[0.15px] leading-3 px-1 whitespace-nowrap">
          {t(label)}
        </label>
        <div className="relative bg-[#f9fafa] rounded border border-[#cac9cf] px-2 h-10 min-w-max">
          <select
            className="w-full h-full bg-transparent text-[12px] text-[#1f1d25] font-normal tracking-[0.17px] appearance-none cursor-pointer pr-6 border-none outline-none"
            value={value ?? ''}
            onChange={e => onChange(e.target.value === '' ? null : e.target.value)}
          >
            {options.map(opt => (
              <option key={opt.value ?? '__all'} value={opt.value ?? ''}>
                {t(opt.label)}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-black/56 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    );
  }

  // Static display mode — backward compatible with all existing call sites
  return (
    <div className={`flex flex-col gap-1 w-fit`}>
      <label className="text-[12px] text-[#686576] font-normal tracking-[0.15px] leading-3 px-1 whitespace-nowrap">
        {t(label)}
      </label>
      <div className="relative bg-[#f9fafa] rounded border border-[#cac9cf] px-2 h-10 flex items-center min-w-max gap-2">
        <p className="text-[12px] text-[#1f1d25] font-normal tracking-[0.17px] leading-[1.43] whitespace-nowrap">
          {t(value ?? label)}
        </p>
        <svg className="size-6 text-black/56 -mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
