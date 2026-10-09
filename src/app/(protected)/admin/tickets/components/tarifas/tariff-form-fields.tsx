'use client';

import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TariffSelect } from './tariff-select';

export const fieldValue = (value: number | undefined) => Number.isFinite(value) ? value : '';
export const fieldNumber = (value: string) => value === '' ? NaN : Number(value);

// `label` se ve arriba del campo. Con `hideLabel` queda solo para lectores de pantalla; con 'sm' se ve en el
// celular y se oculta desde sm, donde la fila tiene encabezado de columnas.
function FieldLabel({ htmlFor, label, hidden }: { htmlFor: string; label: string; hidden?: boolean | 'sm' }) {
  return <label htmlFor={htmlFor} className={hidden === true ? 'sr-only' : cn('block text-xs font-medium text-muted-foreground', hidden === 'sm' && 'sm:sr-only')}>{label}</label>;
}

export function MoneyField({ label, name, value, onChange, max = 2147483647, hideLabel, className }: {
  label: string; name: string; value: number | undefined; onChange: (value: number) => void; max?: number; hideLabel?: boolean | 'sm'; className?: string;
}) {
  const id = useId();
  return <div className={cn('min-w-0 space-y-1.5', className)}>
    <FieldLabel htmlFor={id} label={label} hidden={hideLabel} />
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">$</span>
      <Input id={id} aria-label={name} type="number" inputMode="numeric" min={0} max={max} step={1}
        placeholder="0" value={fieldValue(value)} onChange={event => onChange(fieldNumber(event.target.value))}
        className="h-9 pl-7 text-sm gm-tnum" />
    </div>
  </div>;
}

export function DurationField({ label, name, value, onChange, max = 5256000, commitOnBlur = false, hideLabel, className }: {
  label: string; name: string; value: number; onChange: (value: number) => void; max?: number; commitOnBlur?: boolean; hideLabel?: boolean | 'sm'; className?: string;
}) {
  const id = useId();
  const [editing, setEditing] = useState<string | null>(null);
  const [unit, setUnit] = useState(() => value > 0 && value % 1440 === 0 ? 1440 : value > 0 && value % 60 === 0 ? 60 : 1);
  return <div className={cn('min-w-0 space-y-1.5', className)}>
    <FieldLabel htmlFor={id} label={label} hidden={hideLabel} />
    <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-1.5">
      <Input id={id} aria-label={name} type="number" inputMode="decimal" min={0} max={max / unit} step="any"
        placeholder="1" value={editing ?? fieldValue(value / unit)} className="h-9 min-w-0 text-sm gm-tnum"
        onChange={event => commitOnBlur ? setEditing(event.target.value) : onChange(fieldNumber(event.target.value) * unit)}
        onBlur={() => { if (editing !== null) { onChange(fieldNumber(editing) * unit); setEditing(null); } }}
        onKeyDown={event => { if (commitOnBlur && event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }} />
      <TariffSelect name={name + ': unidad'} value={String(unit)} onValueChange={value => setUnit(Number(value))} options={[{ value: '1', label: 'minutos' }, { value: '60', label: 'horas' }, { value: '1440', label: 'días' }]} />
    </div>
  </div>;
}
