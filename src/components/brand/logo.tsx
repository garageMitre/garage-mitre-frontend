import { cn } from '@/lib/utils';

interface GarageMitreLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withTagline?: boolean;
  stacked?: boolean;
  className?: string;
}

export function GarageMitreLogo({
  size = 'md',
  withTagline = false,
  stacked = false,
  className,
}: GarageMitreLogoProps) {
  const dims = {
    sm: { garage: 'text-[14px]', mitre: 'text-[14px]', sub: 'text-[9px]'  },
    md: { garage: 'text-[20px]', mitre: 'text-[18px]', sub: 'text-[10px]' },
    lg: { garage: 'text-[36px]', mitre: 'text-[32px]', sub: 'text-[12px]' },
    xl: { garage: 'text-[64px]', mitre: 'text-[56px]', sub: 'text-[14px]' },
  }[size];

  return (
    <div
      className={cn(
        'inline-flex',
        stacked ? 'flex-col items-start gap-1' : 'items-baseline gap-2',
        className
      )}
    >
      <span className={cn('gm-display font-bold text-foreground', dims.garage)}>GARAGE</span>
      <div className="flex flex-col leading-none">
        <span className={cn('gm-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-gm-yellow to-gm-orange', dims.mitre)}>
          MITRE
        </span>
      </div>
    </div>
  );
}

export function GarageMitreMonogram({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const cls =
    size === 'sm'
      ? 'text-[13px] px-2 py-[4px]'
      : size === 'lg'
      ? 'text-[28px] px-3 py-[8px]'
      : 'text-[18px] px-[10px] py-[5px]';
  return <span className={cn('gm-plate font-display', cls, className)}>GM</span>;
}
