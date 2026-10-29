import { cn } from '@/lib/utils';

// Logo de texto de Garage Mitre (header y pantallas de acceso). El ícono de la pestaña
// (src/app/icon.svg) usa el mismo amarillo con el monograma "GM".
export function BrandLogo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  const text = size === 'lg' ? 'text-lg' : 'text-[15px]';
  return (
    <span className={cn('inline-flex select-none items-center gap-2', className)}>
      <span className={cn('rounded-md bg-yellow-400 px-2.5 py-1 font-extrabold leading-none tracking-wide text-black shadow-sm', text)}>
        GARAGE
      </span>
      <span className={cn('font-semibold leading-none tracking-[0.2em] text-foreground', text)}>MITRE</span>
    </span>
  );
}
