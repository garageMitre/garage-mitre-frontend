'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Moon, Plus, Sun, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TariffBracket, TariffDraft, TariffVehicle } from '@/types/tariff-plan.type';
import { bracketLabel } from '@/utils/tariff-plan.utils';
import { DurationField, MoneyField } from './tariff-form-fields';
import { TariffSelect, tariffScheduleOptions } from './tariff-select';

const scopeOrder = { ANY: 0, DAY: 1, NIGHT: 2 };
const endingTitle = { ANY: 'General', DAY: 'De día', NIGHT: 'De noche' };

export function TariffPriceList({ draft, onChange, vehicles, night, onEnableNight }: {
  draft: TariffDraft; onChange: (draft: TariffDraft) => void; vehicles: TariffVehicle[]; night: boolean; onEnableNight: () => void;
}) {
  const keys = useRef(new WeakMap<TariffBracket, string>());
  const nextKey = useRef(0);
  const container = useRef<HTMLDivElement>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const keyFor = (row: TariffBracket) => {
    if (row.id) return row.id;
    let key = keys.current.get(row);
    if (!key) { key = 'draft-' + nextKey.current++; keys.current.set(row, key); }
    return key;
  };
  useEffect(() => {
    if (!copiedKey) return;
    const row = container.current?.querySelector('[data-row-key="' + copiedKey + '"]');
    row?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [copiedKey]);
  const availableEndingScopes = (row: TariffBracket) => (['DAY', 'NIGHT', null] as const).filter(scope =>
    !draft.brackets.some(other => other.vehicleType === row.vehicleType && other.uptoMinutes === null && other.ticketDayType === scope));
  const duplicate = (index: number) => {
    const { id: _id, ...copy } = draft.brackets[index];
    if (copy.uptoMinutes === null) {
      const scopes = availableEndingScopes(copy);
      if (!scopes.length) return;
      copy.ticketDayType = scopes[0];
      if (copy.ticketDayType !== null) onEnableNight();
    }
    const brackets = [...draft.brackets];
    brackets.splice(index + 1, 0, copy);
    setCopiedKey(keyFor(copy));
    onChange({ ...draft, brackets });
  };
  const update = (index: number, patch: Partial<TariffBracket>, relabel = false) => {
    const row = { ...draft.brackets[index], ...patch };
    keys.current.set(row, keyFor(draft.brackets[index]));
    if (relabel) row.label = bracketLabel(row);
    onChange({ ...draft, brackets: draft.brackets.map((previous, i) => i === index ? row : previous) });
  };
  const remove = (index: number) => onChange({ ...draft, brackets: draft.brackets.filter((_, i) => i !== index) });
  const add = (vehicleType: string, open: boolean, scope: TariffBracket['ticketDayType'] = null) => {
    if (open && draft.brackets.some(row => row.vehicleType === vehicleType && row.uptoMinutes === null && row.ticketDayType === scope)) return;
    if (scope !== null) onEnableNight();
    const rows = draft.brackets.filter(row => row.vehicleType === vehicleType);
    const last = Math.max(0, ...rows.map(row => Number.isFinite(row.uptoMinutes) ? row.uptoMinutes ?? 0 : 0));
    const row: TariffBracket = { vehicleType, ticketDayType: scope, label: '', uptoMinutes: open ? null : Math.min(last + 60, 5256000), price: NaN, recurringUnitMinutes: open ? 60 : null, recurringPriceMode: 'FIXED' };
    row.label = bracketLabel(row);
    onChange({ ...draft, brackets: [...draft.brackets, row] });
  };
  const scheduleField = (row: TariffBracket, index: number, name: string) => <TariffSelect name={name + ': horario'} value={row.ticketDayType ?? 'ANY'}
    onValueChange={value => update(index, { ticketDayType: value === 'ANY' ? null : value as 'DAY' | 'NIGHT' })}
    options={tariffScheduleOptions.filter(option => row.uptoMinutes !== null || !draft.brackets.some((other, otherIndex) => otherIndex !== index && other.vehicleType === row.vehicleType && other.uptoMinutes === null && (other.ticketDayType ?? 'ANY') === option.value))} />;
  const rowActions = (row: TariffBracket, index: number, vehicle: TariffVehicle) => <div className="flex items-center justify-end">
    <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" title="Duplicar fila" disabled={row.uptoMinutes === null && !availableEndingScopes(row).length} aria-label={'Duplicar ' + row.label + ' de ' + vehicle.name} onClick={() => duplicate(index)}><Copy className="size-3.5" aria-hidden="true" /></Button>
    <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" title="Quitar fila" aria-label={'Quitar ' + row.label + ' de ' + vehicle.name} onClick={() => remove(index)}><Trash2 className="size-3.5" aria-hidden="true" /></Button>
  </div>;
  const cols = night ? 'sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_72px]' : 'sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_72px]';

  return <div ref={container} className="space-y-4">
    {copiedKey && <p role="status" className="text-xs text-muted-foreground">Fila duplicada. Revisá la duración, el horario y el importe.</p>}
    {vehicles.map(vehicle => {
      const rows = draft.brackets.map((row, index) => ({ row, index })).filter(({ row }) => row.vehicleType === vehicle.code);
      const durations = rows.filter(({ row }) => row.uptoMinutes !== null).sort((a, b) =>
        (Number.isFinite(a.row.uptoMinutes) ? a.row.uptoMinutes! : Infinity) - (Number.isFinite(b.row.uptoMinutes) ? b.row.uptoMinutes! : Infinity));
      const endings = rows.filter(({ row }) => row.uptoMinutes === null).sort((a, b) => scopeOrder[a.row.ticketDayType ?? 'ANY'] - scopeOrder[b.row.ticketDayType ?? 'ANY']);
      return <fieldset data-tariff-price-list key={vehicle.code} className="min-w-0 overflow-hidden rounded-lg border border-border">
        <legend className="sr-only">Precios de {vehicle.name}</legend>
        <div className="flex items-center justify-between gap-2 border-b border-border bg-gm-surface-2/50 px-4 py-2.5">
          <h4 className="text-sm font-semibold text-foreground">{vehicle.name}</h4>
          {!vehicle.enabled && <span className="text-xs text-muted-foreground">Deshabilitado · precios conservados</span>}
        </div>
        <div className="px-4">
          <div className={'hidden gap-3 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:grid ' + cols} aria-hidden="true">
            <span>Hasta</span><span>Precio total</span>{night && <span>Horario</span>}<span />
          </div>
          {!durations.length && <p className="py-4 text-sm text-muted-foreground">Sin duraciones. Empezá, por ejemplo, con el precio de 1 hora.</p>}
          {durations.map(({ row, index }, position) => <div key={keyFor(row)} data-row-key={keyFor(row)} data-tariff-duration className={'grid items-center gap-3 border-b border-border py-2.5 last:border-0 ' + cols}>
            <DurationField commitOnBlur hideLabel="sm" label="Hasta" name={vehicle.name + ': duración ' + (position + 1)} value={row.uptoMinutes!} onChange={value => update(index, { uptoMinutes: value }, true)} />
            <MoneyField hideLabel="sm" label="Precio total" name={vehicle.name + ': precio ' + (position + 1)} value={row.price} onChange={value => update(index, { price: value })} />
            {night && scheduleField(row, index, vehicle.name + ': duración ' + (position + 1))}
            {rowActions(row, index, vehicle)}
          </div>)}
          <div className="py-2.5"><Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-[13px] text-muted-foreground hover:text-foreground" onClick={() => add(vehicle.code, false)}><Plus className="mr-1 size-3.5" aria-hidden="true" />Agregar duración</Button></div>
        </div>
        <div className="space-y-2.5 border-t border-border bg-gm-surface-2/30 px-4 py-3">
          <div><p className="text-xs font-semibold text-foreground">Después de la última duración</p><p className="text-xs text-muted-foreground">{endings.length ? 'Cómo se sigue cobrando si se queda más tiempo.' : 'Sin regla, se cobra el último importe de la lista.'}</p></div>
          {endings.map(({ row, index }, position) => {
            const scope = row.ticketDayType ?? 'ANY';
            const name = vehicle.name + ': cobro posterior ' + (position + 1);
            return <div key={keyFor(row)} data-row-key={keyFor(row)} data-tariff-ending={scope} className="space-y-2 rounded-md border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{scope === 'DAY' ? <Sun className="size-3.5" aria-hidden="true" /> : scope === 'NIGHT' ? <Moon className="size-3.5" aria-hidden="true" /> : null}{endingTitle[scope]}</span>
                {rowActions(row, index, vehicle)}
              </div>
              <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5"><span className="block text-xs font-medium text-muted-foreground">Cobro</span><TariffSelect name={name} value={row.recurringUnitMinutes === null ? 'TOTAL' : 'EXTRA'} onValueChange={value => update(index, { recurringUnitMinutes: value === 'EXTRA' ? 60 : null, recurringPriceMode: row.recurringPriceMode ?? 'DERIVED' }, true)} options={[{ value: 'EXTRA', label: 'Adicional por período' }, { value: 'TOTAL', label: 'Total fijo de la estadía' }]} /></div>
                {row.recurringUnitMinutes !== null && <DurationField label="Cada" name={vehicle.name + ': período adicional ' + (position + 1)} value={row.recurringUnitMinutes} onChange={value => update(index, { recurringUnitMinutes: value }, true)} />}
                <MoneyField label={row.recurringUnitMinutes === null ? 'Total' : row.recurringPriceMode === 'FIXED' ? 'Adicional' : 'Respaldo'} name={vehicle.name + ': precio posterior ' + (position + 1)} value={row.price} onChange={value => update(index, { price: value })} />
                {night && <div className="space-y-1.5"><span className="block text-xs font-medium text-muted-foreground">Horario</span>{scheduleField(row, index, vehicle.name + ': regla posterior ' + (position + 1))}</div>}
              </div>
              {row.recurringUnitMinutes !== null && row.recurringPriceMode !== 'FIXED' && <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Configuración anterior: el adicional se calcula con los otros precios de la lista.</span>
                <button type="button" className="font-medium text-foreground underline underline-offset-2" onClick={() => update(index, { recurringPriceMode: 'FIXED' })}>Usar el importe cargado</button>
              </div>}
            </div>;
          })}
          <div className="flex flex-wrap gap-1">
            {!night && !endings.length && <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-[13px] text-muted-foreground hover:text-foreground" onClick={() => add(vehicle.code, true)}><Plus className="mr-1 size-3.5" aria-hidden="true" />Agregar regla</Button>}
            {night && !endings.some(({ row }) => row.ticketDayType === 'DAY') && <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-[13px] text-muted-foreground hover:text-foreground" onClick={() => add(vehicle.code, true, 'DAY')}><Sun className="mr-1 size-3.5" aria-hidden="true" />Regla de día</Button>}
            {night && !endings.some(({ row }) => row.ticketDayType === 'NIGHT') && <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-[13px] text-muted-foreground hover:text-foreground" onClick={() => add(vehicle.code, true, 'NIGHT')}><Moon className="mr-1 size-3.5" aria-hidden="true" />Regla de noche</Button>}
          </div>
        </div>
      </fieldset>;
    })}
    {night && <p className="text-xs text-muted-foreground">Un precio de día o de noche reemplaza al de «Todo el día» para la misma duración.</p>}
  </div>;
}
