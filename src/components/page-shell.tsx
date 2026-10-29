import { cn } from '@/lib/utils';

interface PageShellProps {
  children: React.ReactNode;
  /** Overrides the default vertical rhythm between sections. */
  className?: string;
}

/**
 * Page wrapper shared by every admin section — same width and vertical rhythm
 * as the `/tickets` operation screen. The ambient tint lives on the layout's
 * main area (`gm-page-glow`) so it has no visible edges; side padding comes
 * from `container px-6`, leaving this to own the vertical space only (trimmed
 * on short laptop screens via the `short:` breakpoint).
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="py-2 lg:py-4 short:py-0 short:-my-2">
      <div
        className={cn(
          'mx-auto w-full max-w-[1180px] px-2 sm:px-5 lg:px-7 space-y-8 short:space-y-5',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
