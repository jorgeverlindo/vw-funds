import { Upload, ChevronDown, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';

interface UploadMediaTypeProps {
  isLoading?: boolean;
  onInteraction?: () => void;
  selectedTypes?: string[];
  onChange?: (types: string[]) => void;
  className?: string;
}

const MEDIA_TYPES = [
  "Search SEM",
  "Display/Internet Banners",
  "Social Media",
  "Email/CRM",
  "Print",
  "Radio",
  "Television/OTT"
];

export function UploadMediaType({ 
  className, 
  isLoading, 
  onInteraction, 
  selectedTypes = [], 
  onChange 
}: UploadMediaTypeProps) {
  const [open, setOpen] = useState(false);

  const toggleType = (type: string) => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onChange?.(next);
    onInteraction?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex items-center justify-between w-full h-10 px-3 bg-[#F9FAFA] border border-[#CAC9CF] rounded-[4px] text-[#1F1D25] text-[13px] hover:border-[#473BAB] focus:outline-none focus:ring-1 focus:ring-[#473BAB] transition-all cursor-pointer",
            className
          )}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#473BAB]" />
            ) : (
              <Upload className="w-4 h-4 text-[#686576] group-hover:text-[#473BAB] transition-colors flex-shrink-0" />
            )}
            <span className="font-normal truncate text-[#111014]/60">
              {isLoading 
                ? "Uploading..." 
                : selectedTypes.length > 0 
                  ? selectedTypes.join(", ") 
                  : "Select Media Types"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#686576] group-hover:text-[#473BAB] transition-colors flex-shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[328px] p-1" align="start">
        <div className="flex flex-col">
          {MEDIA_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className="flex items-center justify-between px-3 py-2.5 text-[13px] hover:bg-black/5 rounded-sm transition-colors text-left"
            >
              <span className={cn(selectedTypes.includes(type) ? "text-[#473BAB] font-medium" : "text-[#1F1D25]")}>
                {type}
              </span>
              {selectedTypes.includes(type) && (
                <Check className="w-4 h-4 text-[#473BAB]" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
