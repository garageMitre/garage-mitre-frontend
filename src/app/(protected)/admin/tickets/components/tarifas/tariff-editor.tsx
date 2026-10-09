'use client';

import { useId, useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { TariffDraft, TariffMethod, TariffVehicle } from '@/types/tariff-plan.type';
import { changeCrossing, changeMethod, crossingMode, durationLabel, hasNightPrices, tariffMethod, useDayPricesAllDay } from '@/utils/tariff-plan.utils';
import { TariffSelect } from './tariff-select';
import { crossingNames, hour } from './tariff-summary';
import { TariffConfirmDialog } from './tariff-confirm-dialog';
import { TariffPriceList } from './tariff-price-list';
import { DurationField, MoneyField, fieldNumber, fieldValue } from './tariff-form-fields';

const hours = Array.from({ length: 24 }, (_, value) => ({ value: String(value), label: hour(value) }));
const methods: [TariffMethod, string, string][] = [
  ['STARTED', 'Por hora o fracción', 'El mismo importe por cada período que empieza.'],
  ['CUSTOM', 'Lista de precios', 'Un precio para 30 minutos, otro para 1 hora, y así.'],
];

function EditorSection({ step, title, description, aside, children }: { step: number; title: string; description?: string; aside?: ReactNode; children: ReactNode }) {
  return <section className="space-y-4 border-t border-border px-5 py-5 first:border-t-0">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-gm-surface-2 text-[11px] font-semibold text-muted-foreground gm-tnum">{step}</span>
        <div><h3 className="text-sm font-semibold text-foreground">{title}</h3>{description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}</div>
      </div>
      {aside}
    </div>
    {children}
  </section>;
}

export function TariffEditor({ draft, onChange, vehicles }: { draft: TariffDraft; onChange: (draft: TariffDraft) => void; vehicles: TariffVehicle[] }) {
  const method = tariffMethod(draft);
  const options = draft.schedule.pricingOptions;
  const supported = method === 'CUSTOM' || method === 'STARTED';
  const [night, setNight] = useState(() => hasNightPrices(draft));
  const [confirmNight, setConfirmNight] = useState(false);
  const nightId = useId(), graceId = useId();
  const known = new Map(vehicles.map(vehicle => [vehicle.code, vehicle]));
  const codes = [...new Set([...vehicles.filter(v => v.enabled).map(v => v.code), ...draft.brackets.map(row => row.vehicleType), ...options.charging.rates.map(row => row.vehicleType)])];
  const editableVehicles = codes.map(code => known.get(code) ?? { code, name: code, enabled: false });
  const selectMethod = (next: TariffMethod) => {
    const changed = changeMethod(draft, next);
    setNight(hasNightPrices(changed)); onChange(changed);
  };
  const updateSchedule = (patch: Partial<TariffDraft['schedule']>) => onChange({ ...draft, schedule: { ...draft.schedule, ...patch } });
  const updateCharging = (patch: Partial<typeof options.charging>) => updateSchedule({ pricingOptions: { ...options, charging: { ...options.charging, ...patch } } });
  const setRate = (vehicleType: string, field: 'dayPrice' | 'nightPrice', value: number) => {
    const previous = options.charging.rates.find(row => row.vehicleType === vehicleType) ?? { vehicleType, dayPrice: NaN, nightPrice: NaN };
    const next = { ...previous, [field]: value, ...(!night && field === 'dayPrice' ? { nightPrice: value } : {}) };
    updateCharging({ rates: [...options.charging.rates.filter(row => row.vehicleType !== vehicleType), next] });
  };
  const toggleNight = (enabled: boolean) => {
    if (!enabled && hasNightPrices(draft)) { setConfirmNight(true); return; }
    setNight(enabled);
  };
  const showSchedule = night || crossingMode(draft) === 'SPLIT';

  return <>
    <EditorSection step={1} title="Forma de cobro" description="Cómo se calcula el precio de una estadía.">
      <div role="radiogroup" aria-label="Forma de cobro" className="grid gap-2 sm:grid-cols-2">
        {methods.map(([value, title, description]) => <label key={value} className={cn('flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors', method === value ? 'border-gm-yellow/60 bg-gm-yellow/[0.06]' : 'border-border hover:border-muted-foreground/40')}>
          <input type="radio" name="tariff-method" value={value} checked={method === value} onChange={() => selectMethod(value)} className="mt-0.5 accent-[hsl(var(--gm-yellow))]" />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">{title}{value === 'STARTED' && <span className="rounded border border-border px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Predeterminada</span>}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
          </span>
        </label>)}
      </div>
      {!supported && <p className="rounded-lg border border-border bg-gm-surface-2 px-4 py-3 text-sm text-muted-foreground">Esta tarifa usa una modalidad anterior. Elegí una de las dos opciones para editarla; la vigente se conserva hasta que apliques los cambios.</p>}
    </EditorSection>

    {supported && <>
      <EditorSection step={2} title="Precios" description={method === 'CUSTOM' ? 'Una fila por duración, de menor a mayor.' : 'Importe por cada período que empieza.'}
        aside={<div className="flex items-center gap-2.5"><label htmlFor={nightId} className="cursor-pointer text-xs font-medium text-muted-foreground">Precio distinto de noche</label><Switch id={nightId} checked={night} onCheckedChange={toggleNight} /></div>}>
        {method !== 'CUSTOM' ? <div className="space-y-4">
          <DurationField label="Duración de cada período" name="Duración del período de cobro" value={options.charging.unitMinutes} max={10080} onChange={value => updateCharging({ unitMinutes: value })} className="max-w-xs" />
          {/* Filas que se apilan en el celular: el nombre arriba y los importes uno al lado del otro. */}
          <div className="divide-y divide-border rounded-lg border border-border">
            {editableVehicles.map(vehicle => {
              const rate = options.charging.rates.find(row => row.vehicleType === vehicle.code);
              return <div key={vehicle.code} className={'grid items-end gap-3 px-4 py-3 ' + (night ? 'sm:grid-cols-[minmax(0,1fr)_200px_200px]' : 'sm:grid-cols-[minmax(0,1fr)_200px]')}>
                <p className="text-sm font-medium text-foreground sm:pb-2">{vehicle.name}</p>
                <div className={night ? 'grid grid-cols-2 gap-3 sm:contents' : 'contents'}>
                  <MoneyField label={night ? 'De día' : 'Precio por ' + durationLabel(options.charging.unitMinutes)} name={vehicle.name + ': precio ' + (night ? 'de día' : 'todo el día')} value={rate?.dayPrice} max={100000000} onChange={value => setRate(vehicle.code, 'dayPrice', value)} />
                  {night && <MoneyField label="De noche" name={vehicle.name + ': precio de noche'} value={rate?.nightPrice} max={100000000} onChange={value => setRate(vehicle.code, 'nightPrice', value)} />}
                </div>
              </div>;
            })}
          </div>
        </div> : <TariffPriceList draft={draft} onChange={onChange} vehicles={editableVehicles} night={night} onEnableNight={() => setNight(true)} />}
      </EditorSection>

      <EditorSection step={3} title="Horarios y tolerancia">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {showSchedule && <>
            <div className="space-y-1.5"><span className="block text-xs font-medium text-muted-foreground">Día desde</span><TariffSelect name="Inicio del horario de día" value={String(draft.schedule.dayStartHour)} onValueChange={value => updateSchedule({ dayStartHour: Number(value) })} options={hours} /></div>
            <div className="space-y-1.5"><span className="block text-xs font-medium text-muted-foreground">Día hasta</span><TariffSelect name="Fin del horario de día" value={String(draft.schedule.dayEndHour)} onValueChange={value => updateSchedule({ dayEndHour: Number(value) })} options={hours} /></div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1"><span className="block text-xs font-medium text-muted-foreground">Si cruza de día a noche</span><TariffSelect name="Precio al cambiar de horario" value={crossingMode(draft)} onValueChange={value => onChange(changeCrossing(draft, value as 'ENTRY' | 'EXIT' | 'SPLIT'))} options={Object.entries(crossingNames).map(([value, label]) => ({ value, label }))} /></div>
          </>}
          <div className="space-y-1.5">
            <label htmlFor={graceId} className="block text-xs font-medium text-muted-foreground">Tolerancia</label>
            <div className="relative"><Input id={graceId} aria-label="Tolerancia en minutos" className="h-9 pr-12 text-sm gm-tnum" type="number" min={0} max={5256000} step={1} value={fieldValue(draft.schedule.graceMinutes)} onChange={event => updateSchedule({ graceMinutes: fieldNumber(event.target.value) })} /><span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">min</span></div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {showSchedule ? 'Fuera del horario de día se usa el precio de noche (hora de Argentina). ' : 'Mismo precio todo el día. '}
          {method === 'STARTED' ? 'La tolerancia permite pasarse unos minutos antes de cobrar el período siguiente; no hace gratis el primero.' : 'La tolerancia permite pasarse unos minutos de una duración antes de cobrar la siguiente.'}
        </p>
      </EditorSection>
    </>}

    <TariffConfirmDialog open={confirmNight} onOpenChange={setConfirmNight} title="¿Usar el mismo precio todo el día?" description="Los precios de día también se usarán durante la noche." cancelLabel="Mantener precios de noche" confirmLabel="Usar precios de día" onConfirm={() => { onChange(useDayPricesAllDay(draft)); setNight(false); }}>
      <p className="text-sm text-muted-foreground">Los precios exclusivos de noche se quitarán del borrador. Las tarifas vigentes no cambian hasta que apliques.</p>
    </TariffConfirmDialog>
  </>;
}
