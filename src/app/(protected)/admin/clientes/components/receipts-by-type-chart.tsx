'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Receipt } from '@/types/receipt.type';
import { cn } from '@/lib/utils';
import { ReceiptsMonthFilter } from './receipts-month-filter';
import { ReceiptsDetailDialog } from './receipts-detail-dialog';
import { CUSTOMER_TYPE_LABEL, CUSTOMER_TYPE_ORDER } from './customer-types';

// Verde = pagado, amarillo = pendiente (difieren también en luminosidad, no solo en tono).
const PAID_COLOR = '#22c55e';
const PENDING_COLOR = '#facc15';
const EMPTY_COLOR = 'hsl(var(--secondary))';

const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DURATION = 900;
const EASE = 'cubic-bezier(.22,1,.36,1)';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Cuenta desde el valor que se ve ahora hasta el nuevo; si cambia a mitad de camino, sigue desde ahí.
function useCountUp(value: number) {
  const [shown, setShown] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    const from = current.current;
    if (prefersReducedMotion() || from === value) {
      current.current = value;
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const next = from + (value - from) * (1 - Math.pow(1 - t, 3));
      current.current = next;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return Math.round(shown);
}

// El primer cuadro se dibuja vacío para que anillos y barra se llenen al entrar.
function useReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return ready;
}

const pctOf = (paid: number, total: number) => (total === 0 ? 0 : (paid / total) * 100);

function Swatch({ color }: { color: string }) {
  return <span aria-hidden="true" className="inline-block size-2 shrink-0 rounded-[2px]" style={{ background: color }} />;
}

function TypeRing({ paid, total, ready }: { paid: number; total: number; ready: boolean }) {
  const pending = total - paid;
  const paidLen = ready && total ? (paid / total) * CIRCUMFERENCE : 0;
  const pendingLen = ready && total ? CIRCUMFERENCE - paidLen : 0;
  // Un corte chico entre los dos tramos cuando hay de ambos.
  const gap = paid > 0 && pending > 0 ? 4 : 0;
  const transition = `stroke-dasharray ${DURATION}ms ${EASE}, stroke-dashoffset ${DURATION}ms ${EASE}`;
  const pct = useCountUp(pctOf(paid, total));

  return (
    <div className="relative size-[96px] shrink-0 sm:size-[124px]">
      <svg viewBox="0 0 124 124" aria-hidden="true" className="size-full">
        <g transform="rotate(-90 62 62)">
          {/* var() no se resuelve en atributos de presentación del SVG: va en style. */}
          <circle cx="62" cy="62" r={RADIUS} fill="none" strokeWidth="12" style={{ stroke: EMPTY_COLOR }} />
          <circle
            className="motion-reduce:!transition-none"
            cx="62" cy="62" r={RADIUS} fill="none" stroke={PENDING_COLOR} strokeWidth="12"
            style={{ strokeDasharray: `${Math.max(pendingLen - gap, 0)} ${CIRCUMFERENCE}`, strokeDashoffset: -(paidLen + gap / 2), transition }}
          />
          <circle
            className="motion-reduce:!transition-none"
            cx="62" cy="62" r={RADIUS} fill="none" stroke={PAID_COLOR} strokeWidth="12"
            style={{ strokeDasharray: `${Math.max(paidLen - gap, 0)} ${CIRCUMFERENCE}`, strokeDashoffset: -gap / 2, transition }}
          />
        </g>
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{total ? `${pct}%` : '—'}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">pagado</span>
      </div>
    </div>
  );
}

function TypeTile({ label, paid, total, ready }: { label: string; paid: number; total: number; ready: boolean }) {
  const pending = total - paid;
  const shownPaid = useCountUp(paid);
  const shownPending = useCountUp(pending);

  const status =
    total === 0
      ? { text: 'Sin recibos', className: 'border-border bg-secondary/60 text-muted-foreground' }
      : pending === 0
        ? { text: 'Al día', className: 'border-green-500/35 bg-green-500/10 text-green-400' }
        : { text: `${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`, className: 'border-yellow-400/35 bg-yellow-400/10 text-yellow-400' };

  return (
    <article
      aria-label={`${label}: ${paid} de ${total} pagados`}
      className="flex items-center gap-4 rounded-xl border bg-background/40 p-4 transition-colors hover:border-muted-foreground/40 sm:gap-5 sm:p-5"
    >
      <TypeRing paid={paid} total={total} ready={ready} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <h3 className="text-base font-semibold">{label}</h3>
          <p className="font-mono text-xs text-muted-foreground">
            {total ? `${paid} de ${total} pagados` : 'Sin recibos este mes'}
          </p>
        </div>
        <dl className="space-y-1.5 text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-muted-foreground"><Swatch color={PAID_COLOR} />Pagados</dt>
            <dd className="font-semibold tabular-nums">{shownPaid}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-muted-foreground"><Swatch color={PENDING_COLOR} />Pendientes</dt>
            <dd className="font-semibold tabular-nums">{shownPending}</dd>
          </div>
        </dl>
        <span className={cn('self-start whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium', status.className)}>
          {status.text}
        </span>
      </div>
    </article>
  );
}

export function ReceiptsByTypeChart({
  month,
  monthLabel,
  receipts,
  previous,
}: {
  month: string;
  monthLabel: string;
  receipts: Receipt[];
  previous: { label: string; paid: number; total: number } | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const ready = useReady();

  const paid = receipts.filter((r) => r.status === 'PAID').length;
  const total = receipts.length;
  const pct = pctOf(paid, total);
  const shownPct = useCountUp(pct);
  const shownPaid = useCountUp(paid);
  const shownPending = useCountUp(total - paid);

  // Comparación en puntos porcentuales contra el mes anterior (si ese mes tuvo recibos).
  const delta = previous && previous.total > 0 && total > 0 ? Math.round(pct - pctOf(previous.paid, previous.total)) : null;

  // Los tres tipos siempre a la vista, aunque alguno no tenga recibos ese mes.
  const byType = CUSTOMER_TYPE_ORDER.map((type) => {
    const rows = receipts.filter((r) => r.customer?.customerType === type);
    return { type, paid: rows.filter((r) => r.status === 'PAID').length, total: rows.length };
  });

  // La página se vuelve a pedir con el mes nuevo; este componente se conserva, así que los
  // anillos y los números animan desde lo que se veía hasta los valores nuevos.
  const changeMonth = (nextMonth: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('receiptsMonth', nextMonth);
    startTransition(() => router.push(`?${params.toString()}`, { scroll: false }));
  };

  return (
    <section
      aria-label="Recibos pagados vs pendientes"
      aria-busy={isPending}
      className="flex flex-col gap-6 rounded-2xl border bg-card p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recibos pagados vs pendientes</h2>
            <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 font-mono text-[10px] text-yellow-400">
              Por tipo de cliente
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {/* Sin recibos no hay porcentaje que mostrar: un 0% en verde confundiría. */}
            <span className={cn('text-4xl font-bold tabular-nums tracking-tight sm:text-[44px] sm:leading-none', total ? 'text-green-400' : 'text-muted-foreground')}>
              {total ? `${shownPct}%` : '—'}
            </span>
            <span className="text-sm text-muted-foreground">recibos pagados</span>
            {delta !== null && previous && (
              <span
                className={cn(
                  'rounded-md px-2 py-0.5 font-mono text-xs font-medium',
                  delta >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400',
                )}
              >
                {delta > 0 ? '+' : delta < 0 ? '−' : '±'}
                {Math.abs(delta)} pts vs {previous.label}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReceiptsDetailDialog receipts={receipts} monthLabel={monthLabel} />
          <ReceiptsMonthFilter month={month} onChange={changeMonth} />
        </div>
      </div>

      {/* Mientras llega el mes nuevo se atenúa lo de abajo; el cambio en sí lo muestran las animaciones. */}
      <div className={cn('flex flex-col gap-6 transition-opacity duration-200', isPending && 'opacity-60')}>
        <div className="space-y-2.5">
          <div
            role="img"
            aria-label={`${paid} de ${total} recibos pagados`}
            className="flex h-2.5 overflow-hidden rounded-full"
            style={{ background: total ? PENDING_COLOR : EMPTY_COLOR }}
          >
            <div
              className="h-full border-r-[3px] border-card motion-reduce:!transition-none"
              style={{
                width: `${ready ? pct : 0}%`,
                background: PAID_COLOR,
                borderRightWidth: pct > 0 && pct < 100 ? 3 : 0,
                transition: `width ${DURATION}ms ${EASE}`,
              }}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-2 font-mono text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-green-400">{shownPaid}</span> pagados ·{' '}
              <span className="font-semibold text-yellow-400">{shownPending}</span> pendientes
            </span>
            <span>{total} recibos en total</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {byType.map((t) => (
            <TypeTile key={t.type} label={CUSTOMER_TYPE_LABEL[t.type]} paid={t.paid} total={t.total} ready={ready} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t pt-3 font-mono text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Swatch color={PAID_COLOR} />Pagado</span>
        <span className="inline-flex items-center gap-1.5"><Swatch color={PENDING_COLOR} />Pendiente</span>
      </div>
    </section>
  );
}
