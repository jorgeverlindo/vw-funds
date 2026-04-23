import { cn } from '@/lib/utils';

/**
 * AvatarInitials — text-based avatar following the Figma Avatar component spec.
 * Supports circular, rounded, and square variants.
 * Default: 32px circular, #bcbbc2 background, white text.
 */

interface AvatarInitialsProps {
  initials: string;
  size?: number;
  shape?: 'circular' | 'rounded' | 'square';
  bgColor?: string;
  textColor?: string;
  className?: string;
}

export function AvatarInitials({
  initials,
  size = 32,
  shape = 'circular',
  bgColor = '#bcbbc2',
  textColor = '#ffffff',
  className,
}: AvatarInitialsProps) {
  const radius =
    shape === 'circular' ? '50%' :
    shape === 'rounded'  ? `${Math.round(size * 0.2)}px` :
                           '0px';

  const fontSize = Math.round(size * 0.42);

  return (
    <div
      className={cn('flex items-center justify-center shrink-0 select-none font-normal', className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bgColor,
        color: textColor,
        fontSize,
        letterSpacing: '0.14px',
        lineHeight: 1,
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
