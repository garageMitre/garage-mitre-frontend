'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PricingBreakdown, formatPrice } from '@/components/pricing-breakdown';
import { simulateTariffPlanAction } from '@/actions/tickets/tariff-plan.action';
import { tariffForVehicle, validateTariffDraft } from '@/utils/tariff-plan.utils';
import type { TariffDraft, TariffVehicle } from '@/types/tariff-plan.type';
import type { PricingPreviewResult } from '@/types/pricing-options.type';
import { TariffSelect } from './tariff-select';
import { Eyebrow, TariffCard, TariffCardHeader } from './tariff-ui';

type Preview = { result?: PricingPreviewResult; error?: string };
const presets: [string, string, string][] = [['0', '30', '30 min'], ['1', '5', '1 h 05'], ['1', '15', '1 h 15'], ['3', '0', '3 h'], ['24', '0', '24 h']];

export function TariffSimulator({ draft, revision, invalid, vehicles }: {
  draft: TariffDraft | null; revision: string; invalid: boolean; vehicles: TariffVehicle[];
}) {
  const active = vehicles.filter(v => v.enabled);
  const [selected, setSelected] = useState('');
  const vehicle = active.some(v => v.code === selected) ? selected : active[0]?.code ?? '';
  const draftErrors = draft && vehicle ? validateTariffDraft(tariffForVehicle(draft, vehicle), active.filter(v => v.code === vehicle)) : [];
  const cannotSimulate = invalid || draftErrors.length > 0;
  const [time, setTime] = useState('19:30');
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('15');
  const [current, setCurrent] = useState<Preview | null>(null);
  const [proposed, setProposed] = useState<Preview | null>(null);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const version = useRef(0);
  const ids = { time: useId(), hours: useId(), minutes: useId() };
  const clear = () => { version.current++; setCurrent(null); setProposed(null); setError(''); };
  useEffect(clear, [draft, revision, vehicle]);
  const run = () => {
    clear();
    if (cannotSimulate) return;
    const duration = Number(hours) * 60 + Number(minutes);
    if (!vehicle || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || hours === '' || minutes === '' || !Number.isInteger(Number(hours)) || Number(hours) < 0 || !Number.isInteger(Number(minutes)) || Number(minutes) < 0 || Number(minutes) > 59 || duration > 5256000) {
      setError('Elegí un vehículo y completá una hora y permanencia válidas.'); return;
    }
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const entryAt = date + 'T' + time + ':00-03:00';
    const token = version.current;
    startTransition(async () => {
      const results = await Promise.all([
        simulateTariffPlanAction(vehicle, entryAt, duration),
        draft ? simulateTariffPlanAction(vehicle, entryAt, duration, draft) : Promise.resolve(null),
      ]);
      if (version.current === token) { setCurrent(results[0]); setProposed(results[1]); }
    });
  };
  const resultCard = (title: string, preview: Preview | null) => preview && <div className="min-w-0 space-y-2 rounded-lg border border-border p-4">
    <Eyebrow>{title}</Eyebrow>
    {preview.error && <p className="text-sm text-destructive" role="alert">{preview.error}</p>}
    {preview.result && <>
      <p className="text-2xl font-semibold text-foreground gm-tnum">{formatPrice(preview.result.price)}</p>
      <p className="text-xs text-muted-foreground">{preview.result.elapsedMinutes} min de permanencia · {preview.result.billableMinutes} min facturables</p>
      <details className="group pt-1"><summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">Ver detalle del cálculo</summary><div className="pt-2"><PricingBreakdown lines={preview.result.breakdown} total={preview.result.price} /></div></details>
      {preview.result.usedFallback && <p className="text-xs text-[#FF8458]">Se usó el último precio de la lista: no hay regla para esa duración.</p>}
    </>}
  </div>;

  return <TariffCard aria-labelledby="tariff-simulator-heading">
    <TariffCardHeader id="tariff-simulator-heading" eyebrow="Prueba sin cobros" title="Simulador"
      description={draft ? 'Compara las tarifas vigentes con tu borrador para la misma estadía.' : 'Calcula una estadía con las tarifas vigentes, sin registrar nada.'} />
    <form onSubmit={event => { event.preventDefault(); run(); }} className="space-y-4 px-5 py-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] lg:items-end">
        <div className="space-y-1.5"><span className="block text-xs font-medium text-muted-foreground">Vehículo</span><TariffSelect name="Vehículo del ejemplo" value={vehicle} onValueChange={value => { setSelected(value); clear(); }} disabled={!active.length} options={active.map(v => ({ value: v.code, label: v.name }))} /></div>
        <div className="space-y-1.5"><label htmlFor={ids.time} className="block text-xs font-medium text-muted-foreground">Entrada (hoy)</label><Input id={ids.time} className="h-9 text-sm" type="time" required value={time} onChange={event => { setTime(event.target.value); clear(); }} /></div>
        <div className="space-y-1.5"><label htmlFor={ids.hours} className="block text-xs font-medium text-muted-foreground">Horas</label><Input id={ids.hours} className="h-9 text-sm gm-tnum" type="number" min={0} max={87600} step={1} required value={hours} onChange={event => { setHours(event.target.value); clear(); }} /></div>
        <div className="space-y-1.5"><label htmlFor={ids.minutes} className="block text-xs font-medium text-muted-foreground">Minutos</label><Input id={ids.minutes} className="h-9 text-sm gm-tnum" type="number" min={0} max={59} step={1} required value={minutes} onChange={event => { setMinutes(event.target.value); clear(); }} /></div>
        <Button type="submit" size="sm" className="h-9" disabled={pending || cannotSimulate || !vehicle}>{pending ? 'Calculando…' : draft ? 'Comparar' : 'Calcular'}</Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">Permanencias:</span>
        {presets.map(([h, m, label]) => <button key={label} type="button" onClick={() => { setHours(h); setMinutes(m); clear(); }}
          className={'h-7 rounded-md border px-2.5 text-xs font-medium transition-colors ' + (hours === h && minutes === m ? 'border-gm-yellow/60 bg-gm-yellow/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>{label}</button>)}
      </div>
      {cannotSimulate && <p className="text-xs text-muted-foreground">{draftErrors[0] ?? 'Completá el borrador para probarlo.'}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {(current || proposed) && <div aria-live="polite" className={draft ? 'grid gap-3 lg:grid-cols-2' : ''}>{resultCard('Vigente', current)}{draft && resultCard('Con tu borrador', proposed)}</div>}
    </form>
  </TariffCard>;
}
