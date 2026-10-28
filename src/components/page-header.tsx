import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 border-b border-border pb-5 short:pb-4 md:flex-row md:items-end md:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="gm-display text-[22px] font-bold leading-tight tracking-[0.01em] text-foreground sm:text-[26px] md:text-[30px] short:text-[24px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[13.5px] text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
}
