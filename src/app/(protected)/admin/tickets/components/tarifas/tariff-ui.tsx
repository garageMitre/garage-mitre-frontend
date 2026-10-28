'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Piezas visuales compartidas por las tarifas y el mapa: el mismo lenguaje que la pantalla de
// operación (tarjetas con borde fino, etiquetas chicas en mayúscula, amarillo solo como acento).

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-xs font-medium uppercase tracking-wider text-muted-foreground', className)}>{children}</p>;
}

export function TariffCard({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('rounded-xl border border-border bg-card', className)} {...props}>{children}</section>;
}

export function TariffCardHeader({ eyebrow, title, description, actions, id }: {
  eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; id?: string;
}) {
  return <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-border px-5 py-4">
    <div className="min-w-0">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 id={id} className={cn('text-base font-semibold text-foreground', eyebrow && 'mt-1')}>{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>;
}

type SegmentOption<T extends string> = { value: T; label: ReactNode; icon?: ReactNode };

// Control segmentado accesible (radiogroup con flechas), igual al de «Por hora / Día/Sem/Mes».
export function Segmented<T extends string>({ value, onChange, options, label, className }: {
  value: T; onChange: (value: T) => void; options: SegmentOption<T>[]; label: string; className?: string;
}) {
  return <div role="radiogroup" aria-label={label} className={cn('inline-flex gap-1 rounded-lg border border-border bg-gm-surface-2 p-1', className)}>
    {options.map((option, index) => {
      const active = option.value === value;
      return <button key={option.value} type="button" role="radio" aria-checked={active} tabIndex={active ? 0 : -1}
        onClick={() => onChange(option.value)}
        onKeyDown={event => {
          const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
          if (!step) return;
          event.preventDefault();
          const next = (index + step + options.length) % options.length;
          onChange(options[next].value);
          event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
        }}
        className={cn('flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gm-yellow/60',
          active ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground')}>
        {option.icon}{option.label}
      </button>;
    })}
  </div>;
}

// Fila de datos cortos (horario, tolerancia…) separada por líneas finas.
export function FactGrid({ facts, className }: { facts: { label: string; value: ReactNode }[]; className?: string }) {
  return <dl className={cn('flex flex-wrap gap-px bg-border', className)}>
    {facts.map(fact => <div key={fact.label} className="min-w-[140px] flex-1 bg-card px-5 py-3">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{fact.label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground gm-tnum">{fact.value}</dd>
    </div>)}
  </dl>;
}

export const thClass = 'px-4 sm:px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground';
export const tdClass = 'px-4 sm:px-5 py-3 text-sm';
