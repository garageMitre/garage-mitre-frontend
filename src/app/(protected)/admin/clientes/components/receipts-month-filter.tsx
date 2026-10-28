'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

const MONTH_OPTIONS_COUNT = 12;

// Últimos 12 meses; el elegido viaja en la URL (?receiptsMonth=YYYY-MM) y la página lo vuelve a pedir.
export function ReceiptsMonthFilter({ month }: { month: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const options = Array.from({ length: MONTH_OPTIONS_COUNT }, (_, i) => {
    const d = dayjs().tz('America/Argentina/Buenos_Aires').startOf('month').subtract(i, 'month');
    return { value: d.format('YYYY-MM'), label: d.format('MMMM YYYY') };
  });

  const onChange = (nextMonth: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('receiptsMonth', nextMonth);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Select value={month} onValueChange={onChange}>
      <SelectTrigger aria-label="Mes" className="h-8 w-auto gap-1.5 px-2.5 font-mono text-[11px] capitalize">
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
  );
}
