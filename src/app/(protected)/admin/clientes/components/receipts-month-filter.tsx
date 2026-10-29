'use client';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

const MONTH_OPTIONS_COUNT = 12;

const arrowClass =
  'grid size-8 place-items-center text-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400';

// Últimos 12 meses, con flechas para pasar de a uno. Quien lo usa decide cómo navegar
// (la página lo lleva en ?receiptsMonth=YYYY-MM).
export function ReceiptsMonthFilter({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  const options = Array.from({ length: MONTH_OPTIONS_COUNT }, (_, i) => {
    const d = dayjs().tz('America/Argentina/Buenos_Aires').startOf('month').subtract(i, 'month');
    return { value: d.format('YYYY-MM'), label: d.format('MMMM YYYY') };
  });
  // Las opciones van del más nuevo al más viejo: "anterior" es el índice siguiente.
  const index = options.findIndex((o) => o.value === month);
  const older = index >= 0 ? options[index + 1] : undefined;
  const newer = index > 0 ? options[index - 1] : undefined;

  return (
    <div className="flex h-8 items-center overflow-hidden rounded-md border">
      <button type="button" aria-label="Mes anterior" disabled={!older} onClick={() => older && onChange(older.value)} className={`${arrowClass} border-r`}>
        <ChevronLeft className="size-4" />
      </button>
      <Select value={month} onValueChange={onChange}>
        <SelectTrigger aria-label="Mes" className="h-8 w-auto min-w-[140px] justify-center gap-1.5 rounded-none border-0 px-2.5 font-mono text-[11px] font-semibold capitalize focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-[13px] capitalize">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button type="button" aria-label="Mes siguiente" disabled={!newer} onClick={() => newer && onChange(newer.value)} className={`${arrowClass} border-l`}>
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
