import React from 'react';

interface KeyValueRowProps {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}

export function KeyValueRow({ label, value, valueClass = '' }: KeyValueRowProps) {
  return (
    <div className="flex items-start justify-between py-3.5 border-b border-[#F0F0F0] last:border-0">
      <span className="text-[#686576] text-[13px] font-normal">{label}</span>
      <span className={`text-[#1f1d25] text-[13px] font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
