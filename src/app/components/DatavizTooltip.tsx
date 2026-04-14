import { TooltipProps } from 'recharts';

interface DatavizTooltipProps extends TooltipProps<any, any> {
  title?: string;
  renderTitle?: (payload: any[]) => string;
  renderItems?: (payload: any[]) => React.ReactNode;
}

export function DatavizTooltip({ active, payload, label, title, renderTitle, renderItems }: DatavizTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Determine the title to show
  const displayTitle = title || (renderTitle ? renderTitle(payload) : label) || '';

  return (
    <div className="bg-white rounded border border-[rgba(0,0,0,0.12)] shadow-md p-3 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
      {displayTitle && (
        <div className="text-xs font-semibold text-[#1f1d25] mb-2 pb-1 border-b border-[rgba(0,0,0,0.06)]">
          {displayTitle}
        </div>
      )}
      
      {renderItems ? (
        renderItems(payload)
      ) : (
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between text-[11px] gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-[#686576] font-medium capitalize">
                  {entry.name}
                </span>
              </div>
              <span className="text-[#1f1d25] font-semibold tabular-nums">
                {typeof entry.value === 'number' 
                  ? entry.value.toLocaleString() 
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
