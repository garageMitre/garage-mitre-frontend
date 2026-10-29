'use client';
import type { PricingLine } from '@/types/pricing-options.type';
// Los precios son pesos enteros: los centavos solo aparecen cuando un cálculo proporcional los genera.
export const formatPrice = (amount: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount);
const time = (value: string) => new Date(value).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

// Detalle de cómo se llegó a un importe: una línea por tramo o componente, y el total.
export function PricingBreakdown({ lines, total }: { lines: PricingLine[]; total: number }) {
  return <div className="overflow-hidden rounded-md border border-border text-sm">
    <ol className="divide-y divide-border">{lines.map((line, index) => <li key={index} className="flex items-start justify-between gap-3 px-3 py-2">
      <div className="min-w-0">
        <p className="text-foreground">{line.label}</p>
        {line.dayType && <p className="text-xs text-muted-foreground">{line.dayType === 'DAY' ? 'Precio de día' : 'Precio de noche'}{line.startAt && line.endAt ? ` · ${time(line.startAt)} a ${time(line.endAt)}` : ''}</p>}
        {line.unitPrice !== undefined && <p className="text-xs text-muted-foreground">{Number((line.minutes ?? 0).toFixed(2))} min · {formatPrice(line.unitPrice)} por período{Number.isInteger(line.units) ? ` · ${line.units} ${line.units === 1 ? 'período' : 'períodos'}` : ''}</p>}
        {line.minutes !== undefined && !line.dayType && <p className="text-xs text-muted-foreground">{line.minutes} minutos</p>}
      </div>
      <span className="whitespace-nowrap font-medium gm-tnum">{line.amount === 0 ? '—' : formatPrice(line.amount)}</span>
    </li>)}</ol>
    <div className="flex justify-between border-t border-border bg-gm-surface-2/50 px-3 py-2 font-semibold"><span>Total</span><span className="gm-tnum">{formatPrice(total)}</span></div>
  </div>;
}
