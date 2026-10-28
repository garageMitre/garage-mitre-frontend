'use client';

import { useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { formatPrice } from '@/components/pricing-breakdown';
import type { TariffBracket, TariffPlan, TariffVehicle } from '@/types/tariff-plan.type';
import { crossingMode, durationLabel, hasNightPrices, tariffMethod } from '@/utils/tariff-plan.utils';
import { FactGrid, Segmented, TariffCard, TariffCardHeader, tdClass, thClass } from './tariff-ui';

export const methodNames = {
  STARTED: 'Por hora o fracción',
  COMPLETED: 'Sólo períodos completos',
  PROPORTIONAL: 'Por minuto, proporcional al tiempo',
  CUSTOM: 'Lista de precios por duración',
};
export const crossingNames = {
  ENTRY: 'Usar el precio de la hora de entrada',
  EXIT: 'Usar el precio de la hora de salida',
  SPLIT: 'Separar el tiempo de día y de noche',
};
const crossingShort = { ENTRY: 'Según la entrada', EXIT: 'Según la salida', SPLIT: 'Tramos separados' };
export const hour = (value: number) => String(value).padStart(2, '0') + ':00';

// Una franja de día o de noche reemplaza a la general sólo en la misma duración (igual que el backend).
export function scopedBrackets(brackets: TariffBracket[], vehicle: string, day: 'DAY' | 'NIGHT') {
  const scoped = new Map<number | null, TariffBracket>();
  for (const row of brackets.filter(row => row.vehicleType === vehicle && row.ticketDayType === null)) scoped.set(row.uptoMinutes, row);
  for (const row of brackets.filter(row => row.vehicleType === vehicle && row.ticketDayType === day)) scoped.set(row.uptoMinutes, row);
  return [...scoped.values()].sort((a, b) => (a.uptoMinutes ?? Infinity) - (b.uptoMinutes ?? Infinity));
}

export function TariffSummary({ plan, vehicles, actions }: { plan: TariffPlan; vehicles: TariffVehicle[]; actions?: ReactNode }) {
  const [selected, setSelected] = useState('');
  const [day, setDay] = useState<'DAY' | 'NIGHT'>('DAY');
  const method = tariffMethod(plan), options = plan.schedule.pricingOptions;
  const names = new Map(vehicles.map(v => [v.code, v.name]));
  const pricedCodes = method === 'CUSTOM' ? plan.brackets.map(row => row.vehicleType) : options.charging.rates.map(rate => rate.vehicleType);
  const codes = [...new Set([...vehicles.filter(v => v.enabled).map(v => v.code), ...pricedCodes])];
  const vehicle = codes.includes(selected) ? selected : codes[0] ?? '';
  const night = hasNightPrices(plan), crossing = crossingMode(plan);
  const hasPrices = pricedCodes.length > 0;
  const period = night ? day : 'DAY';
  const rows = scopedBrackets(plan.brackets, vehicle, period);
  const showSchedule = night || crossing === 'SPLIT';

  const facts = [
    { label: 'Precio', value: night ? 'Distinto de día y noche' : 'Igual todo el día' },
    ...(showSchedule ? [{ label: 'Horario de día', value: `${hour(plan.schedule.dayStartHour)} – ${hour(plan.schedule.dayEndHour)}` }, { label: 'Cambio de horario', value: crossingShort[crossing] }] : []),
    ...(method === 'CUSTOM' || method === 'STARTED' ? [{ label: 'Tolerancia', value: `${plan.schedule.graceMinutes} min` }] : []),
  ];

  return <TariffCard aria-labelledby="current-tariff-heading" data-tariff-summary>
    <TariffCardHeader id="current-tariff-heading" eyebrow="Tarifas vigentes" title={hasPrices ? methodNames[method] : 'Sin tarifas configuradas'}
      description={hasPrices ? 'Se calculan al registrar la salida de cada ticket, con los precios vigentes en ese momento.' : 'Cargá los importes del garage y probá un ejemplo antes de empezar a escanear tickets.'}
      actions={actions} />
    {hasPrices && <>
      <FactGrid facts={facts} className="border-b border-border" />
      {method !== 'CUSTOM' ? <div className="overflow-x-auto [contain:inline-size]">
        <table className="w-full">
          <caption className="sr-only">Precio por período de cada vehículo</caption>
          <thead><tr className="border-b border-border">
            <th scope="col" className={thClass}>Vehículo</th>
            <th scope="col" className={thClass + ' hidden sm:table-cell'}>Período</th>
            <th scope="col" className={thClass + ' text-right'}>{night ? 'Día' : 'Precio'}</th>
            {night && <th scope="col" className={thClass + ' text-right'}>Noche</th>}
          </tr></thead>
          <tbody>{codes.map(code => {
            const rate = options.charging.rates.find(row => row.vehicleType === code);
            return <tr key={code} className="border-b border-border last:border-0">
              <th scope="row" className={tdClass + ' text-left font-medium'}>{names.get(code) ?? code}<span className="block text-xs font-normal text-muted-foreground sm:hidden">Cada {durationLabel(options.charging.unitMinutes)}</span></th>
              <td className={tdClass + ' hidden text-muted-foreground sm:table-cell'}>Cada {durationLabel(options.charging.unitMinutes)}</td>
              <td className={tdClass + ' text-right font-semibold gm-tnum'}>{rate ? formatPrice(rate.dayPrice) : <span className="font-normal text-muted-foreground">Sin precio</span>}</td>
              {night && <td className={tdClass + ' text-right font-semibold gm-tnum'}>{rate ? formatPrice(rate.nightPrice) : <span className="font-normal text-muted-foreground">Sin precio</span>}</td>}
            </tr>;
          })}</tbody>
        </table>
        <p className="border-t border-border px-5 py-2.5 text-xs text-muted-foreground">{method === 'STARTED' ? 'Se cobra cada período que empieza, pasada la tolerancia.' : method === 'PROPORTIONAL' ? 'Se cobra la proporción usada y se redondea el total a pesos.' : 'El tiempo que no completa un período no se cobra.'}</p>
      </div> : <>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <Segmented label="Vehículo" value={vehicle} onChange={setSelected} options={codes.map(code => ({ value: code, label: names.get(code) ?? code }))} />
          {night && <Segmented label="Horario" value={day} onChange={setDay} options={[
            { value: 'DAY', label: `Día · ${hour(plan.schedule.dayStartHour)}–${hour(plan.schedule.dayEndHour)}`, icon: <Sun className="size-3.5" aria-hidden="true" /> },
            { value: 'NIGHT', label: `Noche · ${hour(plan.schedule.dayEndHour)}–${hour(plan.schedule.dayStartHour)}`, icon: <Moon className="size-3.5" aria-hidden="true" /> },
          ]} />}
        </div>
        {rows.length ? <table className="w-full">
          <caption className="sr-only">Precios vigentes de {names.get(vehicle) ?? vehicle}{night ? ' de ' + (day === 'DAY' ? 'día' : 'noche') : ''}</caption>
          <thead><tr className="border-b border-border"><th scope="col" className={thClass}>Duración</th><th scope="col" className={thClass + ' text-right'}>Importe</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={row.id ?? index} className="border-b border-border last:border-0">
            <th scope="row" className={tdClass + ' text-left font-medium'}>
              {row.uptoMinutes !== null ? 'Hasta ' + durationLabel(row.uptoMinutes) : row.recurringUnitMinutes ? 'Después, cada ' + durationLabel(row.recurringUnitMinutes) : 'Después, total fijo'}
              {row.uptoMinutes === null && row.recurringUnitMinutes && row.recurringPriceMode !== 'FIXED' && <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Calculado con la lista; se muestra el importe de respaldo.</span>}
            </th>
            <td className={tdClass + ' text-right font-semibold gm-tnum'}>{row.recurringUnitMinutes && row.recurringPriceMode === 'FIXED' ? '+ ' : ''}{formatPrice(row.price)}</td>
          </tr>)}</tbody>
        </table> : <p className="px-5 py-6 text-center text-sm text-muted-foreground">No hay precios para este vehículo{night ? ' en el horario de ' + (day === 'DAY' ? 'día' : 'noche') : ''}.</p>}
        <p className="border-t border-border px-5 py-2.5 text-xs text-muted-foreground">Entre dos duraciones el cálculo puede combinar duraciones menores. Comprobalo en el simulador.</p>
      </>}
    </>}
  </TariffCard>;
}
