import { MoreVertical, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export interface PortalItem {
  id: string;
  title: string;
  type: string;
  dimensions: string;
  imageSrc: string;
}

interface PortalCardProps {
  item: PortalItem;
  selected: boolean;
  onSelect: () => void;
}

export function PortalCard({ item, selected, onSelect }: PortalCardProps) {
  return (
    <div 
      className={cn(
        "group relative flex flex-col bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
        selected 
          ? "border-[#473bab] ring-1 ring-[#473bab] shadow-md" 
          : "border-transparent hover:border-gray-200 hover:shadow-sm"
      )}
      onClick={onSelect}
    >
      {/* Image Container */}
      <div className="aspect-square relative bg-gray-100 overflow-hidden">
        <ImageWithFallback 
          src={item.imageSrc} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Overlay Gradient on hover? */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />

        {/* Checkbox - Visible on hover or selected */}
        <div 
          className={cn(
            "absolute top-3 left-3 z-10 transition-opacity duration-200",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <div className={cn(
            "w-5 h-5 rounded flex items-center justify-center border transition-colors",
            selected 
              ? "bg-[#473bab] border-[#473bab]" 
              : "bg-white/80 border-gray-400 hover:bg-white"
          )}>
            {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        </div>

        {/* Brand Logo Watermark (from designs) - Optional/Mocked */}
        <div className="absolute top-3 right-3 opacity-80">
           {/* Mock VW logo or similar if needed, typically part of image in these systems */}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-medium text-[#1f1d25] truncate leading-tight mb-1" title={item.title}>
            {item.title}
          </h3>
          <p className="text-[11px] text-[#686576] truncate">
            {item.type} | {item.dimensions}
          </p>
        </div>
        
        {/* Overflow Menu */}
        <button 
          className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => {
             e.stopPropagation();
             // Menu logic
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
