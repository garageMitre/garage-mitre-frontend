'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Option = { value: string; label: string };
export const tariffScheduleOptions: Option[] = [
  { value: 'ANY', label: 'Todo el día' },
  { value: 'DAY', label: 'Sólo de día' },
  { value: 'NIGHT', label: 'Sólo de noche' },
];

export function TariffSelect({ value, onValueChange, options, name, disabled, className, placeholder = 'Elegir' }: {
  value: string; onValueChange: (value: string) => void; options: Option[]; name: string; disabled?: boolean; className?: string; placeholder?: string;
}) {
  return <Select value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger aria-label={name} className={cn('h-9 text-[13px]', className)}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
    </SelectContent>
  </Select>;
}
