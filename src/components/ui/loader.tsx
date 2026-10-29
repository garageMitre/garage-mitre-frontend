import React from 'react';
import { cn } from '@/lib/utils';

const ANGLES = [0, 60, 120, 180, 240, 300];

// El dibujo está pensado para 48px; los otros tamaños lo escalan entero.
const SCALE = { sm: 0.6, md: 1, lg: 1.35 } as const;

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof SCALE;
  /** Texto visible debajo; si no hay, igual se anuncia "Cargando…" a lectores de pantalla. */
  label?: string;
}

// Seis círculos que "respiran" hacia afuera, en los amarillos de la marca. La animación
// (loader-breathe) está en globals.css.
const Loader: React.FC<LoaderProps> = ({ className, size = 'md', label, ...props }) => {
  const box = 48 * SCALE[size];

  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-3', className)} {...props}>
      <div className="relative shrink-0" style={{ width: box, height: box }}>
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 flex h-12 w-12 origin-top-left items-center justify-center"
          style={{ transform: `scale(${SCALE[size]})` }}
        >
          {ANGLES.map((angle, idx) => (
            <div
              key={angle}
              className={cn('loader-dot absolute h-3.5 w-3.5 rounded-full', idx % 2 === 0 ? 'bg-yellow-400/40' : 'bg-amber-300/40')}
              style={
                {
                  '--dx': `${(Math.cos((angle * Math.PI) / 180) * 11).toFixed(2)}px`,
                  '--dy': `${(Math.sin((angle * Math.PI) / 180) * 11).toFixed(2)}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>
      {label ? (
        <span className="text-sm text-muted-foreground">{label}</span>
      ) : (
        <span className="sr-only">Cargando…</span>
      )}
    </div>
  );
};

export { Loader };
