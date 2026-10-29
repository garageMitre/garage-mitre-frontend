import { cn } from '@/lib/utils';

// Monograma "GM": el mismo dibujo que el ícono de la pestaña (src/app/icon1.svg).
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={cn('size-8 shrink-0', className)}>
      <rect width="32" height="32" rx="8" fill="#facc15" />
      <g fill="none" stroke="#0a0a0a" strokeWidth="3.4">
        <path d="M14.4 12.1A5.5 5.5 0 1 0 16 16H11.2" />
        <path d="M19.4 22.4V10.2l4.4 6.2 4.4-6.2v12.2" />
      </g>
    </svg>
  );
}

// Logo de Garage Mitre (header y pantallas de acceso).
export function BrandLogo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  return (
    <span className={cn('inline-flex select-none items-center gap-2.5', className)}>
      <BrandMark className={size === 'lg' ? 'size-10' : 'size-8'} />
      <span className={cn('font-extrabold tracking-tight text-foreground', size === 'lg' ? 'text-xl' : 'text-[15px]')}>
        Garage Mitre
      </span>
    </span>
  );
}
