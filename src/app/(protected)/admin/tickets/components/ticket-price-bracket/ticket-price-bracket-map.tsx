'use client';

import { useState } from 'react';
import { Infinity as InfinityIcon, Moon, RotateCcw, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TicketPriceBracket } from '@/types/ticket-price-bracket.type';
import { TicketSchedule } from '@/services/tickets.service';
import { TARIFF_VEHICLES } from '@/types/tariff-plan.type';
import { formatRecurringUnitLabel, minutesToAmountUnit, resolveRecurringUnitPrice, type DurationUnit } from '@/utils/ticket-price-bracket.utils';
import { FactGrid, Segmented, TariffCard } from '../tarifas/tariff-ui';

const TIER_RANK: Record<DurationUnit, number> = { MIN: 0, HOUR: 1, DAY: 2 };
const ars = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
const pad = (h: number) => `${h.toString().padStart(2, '0')}:00`;
// «1 h 05», «30 min», «2 días»: corto para filas de ejemplo.
const short = (minutes: number) => {
  if (minutes % 1440 === 0) return `${minutes / 1440} ${minutes === 1440 ? 'día' : 'días'}`;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
};
const upto = (minutes: number) => 'Hasta ' + short(minutes);

type Period = 'DAY' | 'NIGHT';

// Mapa de cómo se cobra un ticket por tiempo, con la configuración vigente. Sigue las mismas
// reglas que el cálculo del backend (src/tickets/pricing): por hora o fracción, o la lista de
// duraciones con tolerancia, cascada por escala y regla posterior.
export function TicketPriceBracketMap({ brackets, schedule, embedded = false }: {
  brackets: TicketPriceBracket[];
  schedule: TicketSchedule;
  /** true cuando se muestra dentro de otro contenedor (ej. un dialog) — omite su propia tarjeta. */
  embedded?: boolean;
}) {
  const charging = schedule.pricingOptions?.charging.enabled ? schedule.pricingOptions.charging : null;
  const codes = [...new Set([...TARIFF_VEHICLES.map(v => v.code), ...brackets.map(b => b.vehicleType), ...(charging?.rates.map(r => r.vehicleType) ?? [])])];
  const vehicleName = (code: string) => TARIFF_VEHICLES.find(v => v.code === code)?.name ?? code;
  const [selected, setSelected] = useState(codes[0] ?? 'AUTO');
  const [periodChoice, setPeriod] = useState<Period>('DAY');
  const vehicle = codes.includes(selected) ? selected : codes[0] ?? 'AUTO';
  const hasNight = charging ? charging.rates.some(r => r.dayPrice !== r.nightPrice) : brackets.some(b => b.ticketDayType !== null);
  const period: Period = hasNight ? periodChoice : 'DAY';
  const grace = schedule.graceMinutes;
  const crossing = schedule.pricingOptions?.crossing.enabled ? schedule.pricingOptions.crossing.mode : schedule.pricingDayTypeBasis ?? 'EXIT';

  // Una franja de día/noche reemplaza a la general sólo en la misma duración.
  const scoped = new Map<number | null, TicketPriceBracket>();
  for (const b of brackets.filter(b => b.vehicleType === vehicle && b.ticketDayType === null)) scoped.set(b.uptoMinutes, b);
  for (const b of brackets.filter(b => b.vehicleType === vehicle && b.ticketDayType === period)) scoped.set(b.uptoMinutes, b);
  const finite = [...scoped.values()].filter(b => b.uptoMinutes !== null).sort((a, b) => a.uptoMinutes! - b.uptoMinutes!);
  const openEnded = scoped.get(null) ?? null;
  const tier = (b: TicketPriceBracket) => TIER_RANK[minutesToAmountUnit(b.uptoMinutes!).unit];
  // Entre una franja de horas/días y la siguiente se vuelve a cobrar la lista chica sobre el
  // excedente (nunca más que la franja siguiente). Devuelve las franjas que se reutilizan.
  const restartAt = (i: number) => i > 0 && tier(finite[i - 1]) > 0 ? finite.map((b, idx) => ({ b, idx })).filter(({ b }) => tier(b) < tier(finite[i - 1])).map(({ idx }) => idx + 1) : [];
  const recurring = openEnded?.recurringUnitMinutes
    ? openEnded.recurringPriceMode === 'FIXED'
      ? { price: openEnded.price, source: null as string | null }
      : (() => { const r = resolveRecurringUnitPrice(openEnded.recurringUnitMinutes!, finite, openEnded.id); return { price: r?.price ?? openEnded.price, source: r?.sourceLabel ?? null }; })()
    : null;

  const rate = charging?.rates.find(r => r.vehicleType === vehicle);
  const unitPrice = rate ? (period === 'DAY' ? rate.dayPrice : rate.nightPrice) : null;
  const periods = (minutes: number) => !charging ? 0 : charging.mode === 'PROPORTIONAL' ? minutes / charging.unitMinutes : charging.mode === 'COMPLETED' ? Math.floor(minutes / charging.unitMinutes)
    : minutes > 0 ? Math.max(1, Math.ceil(Math.max(0, minutes - Math.min(grace, charging.unitMinutes - 1)) / charging.unitMinutes)) : 0;
  const examples = charging ? [...new Set([Math.round(charging.unitMinutes / 2), charging.unitMinutes, charging.unitMinutes + grace, charging.unitMinutes + grace + 1, charging.unitMinutes * 2, charging.unitMinutes * 3, ...(charging.unitMinutes < 1440 ? [1440] : [])])].filter(m => m > 0).sort((a, b) => a - b) : [];

  const facts = [
    { label: 'Forma de cobro', value: charging ? 'Por hora o fracción' : 'Lista de precios' },
    { label: 'Día', value: `${pad(schedule.dayStartHour)} – ${pad(schedule.dayEndHour)}` },
    { label: 'Noche', value: `${pad(schedule.dayEndHour)} – ${pad(schedule.dayStartHour)}` },
    { label: 'Tolerancia', value: `${grace} min` },
  ];

  const content = <>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Mapa de tarifas</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">Cómo se calcula el cobro de un ticket por tiempo.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Vehículo" value={vehicle} onChange={setSelected} options={codes.map(code => ({ value: code, label: vehicleName(code) }))} />
        {hasNight && <Segmented label="Horario" value={period} onChange={setPeriod} options={[
          { value: 'DAY', label: 'Día', icon: <Sun className="size-3.5" aria-hidden="true" /> },
          { value: 'NIGHT', label: 'Noche', icon: <Moon className="size-3.5" aria-hidden="true" /> },
        ]} />}
      </div>
    </div>

    <div className="mt-4 overflow-hidden rounded-xl border border-border">
      <FactGrid facts={facts} className="border-b border-border" />

      {charging ? unitPrice === null ? <Empty vehicle={vehicleName(vehicle)} /> : <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-4">
          <span className="text-2xl font-semibold text-foreground gm-tnum">{ars(unitPrice)}</span>
          <span className="text-sm text-muted-foreground">por cada {short(charging.unitMinutes)}{hasNight ? ` · ${period === 'DAY' ? 'de día' : 'de noche'}` : ''}</span>
        </div>
        <table className="w-full border-t border-border">
          <caption className="sr-only">Ejemplos de cobro</caption>
          <thead><tr className="border-b border-border">
            <th scope="col" className="px-5 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Permanencia</th>
            <th scope="col" className="px-5 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Períodos</th>
            <th scope="col" className="px-5 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Cobro</th>
          </tr></thead>
          <tbody>{examples.map(minutes => {
            const units = periods(minutes);
            return <tr key={minutes} className="border-b border-border last:border-0">
              <th scope="row" className="px-5 py-2 text-left text-sm font-medium">{short(minutes)}</th>
              <td className="px-5 py-2 text-sm text-muted-foreground gm-tnum">{Number(units.toFixed(2))}</td>
              <td className="px-5 py-2 text-right text-sm font-semibold gm-tnum">{ars(Math.round(units * unitPrice))}</td>
            </tr>;
          })}</tbody>
        </table>
      </div> : !finite.length && !openEnded ? <Empty vehicle={vehicleName(vehicle)} period={hasNight ? period : undefined} /> : <ol className="px-5 py-3">
        {finite.map((b, i) => {
          const next = finite[i + 1] ?? null;
          const restart = next ? restartAt(i + 1) : [];
          const isLast = i === finite.length - 1;
          return <li key={b.id}>
            <Step index={i + 1} label={upto(b.uptoMinutes!)} price={ars(b.price)} />
            {(next || openEnded) && <Connector>
              <span>{next ? `Hasta ${grace} min de tolerancia antes de pasar a la siguiente.` : `Pasada la última duración (+${grace} min), se aplica la regla posterior.`}</span>
              {restart.length > 0 && <span className="flex items-start gap-1.5"><RotateCcw className="mt-0.5 size-3 shrink-0" aria-hidden="true" />Entre {short(b.uptoMinutes!)} y {short(next!.uptoMinutes!)}: {ars(b.price)} más la lista desde la franja {restart.join(', ')} sobre el excedente, sin superar {ars(next!.price)}.</span>}
            </Connector>}
            {isLast && !openEnded && <Connector last><span>Sin regla posterior: pasada esta duración se sigue cobrando {ars(b.price)}.</span></Connector>}
          </li>;
        })}
        {openEnded && <li>
          <div className="flex items-center gap-3 py-2">
            <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground"><InfinityIcon className="size-3.5" /></span>
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
              {finite.length ? `Después de ${short(finite[finite.length - 1].uptoMinutes!)}` : 'Desde el inicio'}
              <span className="block text-xs font-normal text-muted-foreground">
                {recurring ? `Se suma ${formatRecurringUnitLabel(openEnded.recurringUnitMinutes!)}${recurring.source ? ` · según «${recurring.source}»` : ''}` : 'Total fijo por toda la estadía'}
              </span>
            </span>
            <span className="text-sm font-semibold text-foreground gm-tnum">{recurring ? `+ ${ars(recurring.price)}` : ars(openEnded.price)}</span>
          </div>
        </li>}
      </ol>}
    </div>

    <p className="mt-3 text-xs text-muted-foreground">
      {charging ? 'Se cobra cada período que empieza, pasada la tolerancia. ' : 'Cada duración cubre hasta su límite; pasarse menos que la tolerancia no cambia el precio. '}
      {hasNight ? (crossing === 'SPLIT' ? 'Si cruza de día a noche, cada tramo se cobra con su precio.' : `Si cruza de día a noche, se usa el precio de la hora de ${crossing === 'ENTRY' ? 'entrada' : 'salida'}.`) : 'Mismo precio de día y de noche.'}
    </p>
  </>;

  return embedded ? <div>{content}</div> : <TariffCard className="p-5">{content}</TariffCard>;
}

function Step({ index, label, price }: { index: number; label: string; price: string }) {
  return <div className="flex items-center gap-3 py-2">
    <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-gm-surface-2 text-[11px] font-semibold text-muted-foreground gm-tnum">{index}</span>
    <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground gm-tnum">{price}</span>
  </div>;
}

function Connector({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <div className={cn('ml-3 flex flex-col gap-1 border-l border-border py-1 pl-6 text-xs text-muted-foreground', last && 'border-dashed')}>{children}</div>;
}

function Empty({ vehicle, period }: { vehicle: string; period?: Period }) {
  return <p className="px-5 py-8 text-center text-sm text-muted-foreground">No hay tarifas cargadas para {vehicle}{period ? ` en horario de ${period === 'DAY' ? 'día' : 'noche'}` : ''}.</p>;
}
