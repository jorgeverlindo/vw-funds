interface KPICardProps {
  label: string;
  value: string;
}

export function KPICard({ label, value }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl px-3 py-2 border border-[rgba(0,0,0,0.12)] min-w-[100px] max-w-[360px] flex-1">
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] text-[#1f1d25] font-normal tracking-[0.4px] leading-[1.66]">
          {label}
        </p>
        <p className="text-[16px] text-[#686576] font-normal tracking-[0.15px] leading-[1.75]">
          {value}
        </p>
      </div>
    </div>
  );
}
