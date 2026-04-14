import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils'; // Assuming cn exists or I'll use simple string concat if not

// MainPane Wrapper
// Primary content area that resizes when RightPane opens
export const MainPane = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={`flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.04)] overflow-hidden ${className || ''}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MainPane.displayName = "MainPane";

// RightPane Wrapper
// Side panel that pushes content
export const RightPane = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "flex-none bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.04)] overflow-hidden h-full animate-in slide-in-from-right duration-300",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
RightPane.displayName = "RightPane";