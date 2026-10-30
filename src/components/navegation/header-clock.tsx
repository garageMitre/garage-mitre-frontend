'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const TZ = 'America/Argentina/Buenos_Aires';
const timeFormat = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
const dateFormat = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });

// "jueves, 30 de octubre" → "Jueves 30 de octubre"
const formatDate = (date: Date) => {
  const text = dateFormat.format(date).replace(',', '');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Fecha y hora de Argentina en el centro del header: los tickets se cobran por hora de entrada
// y salida, así que el operador la tiene siempre a la vista.
export function HeaderClock() {
  // Se arma recién en el navegador: la hora del servidor no coincidiría con la del cliente.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="timer"
      aria-label="Fecha y hora actual"
      className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 lg:flex"
    >
      <Clock aria-hidden="true" className="size-[18px] text-yellow-400" />
      <span className="min-w-[3.25rem] text-xl font-extrabold tabular-nums tracking-tight">
        {now ? timeFormat.format(now) : '--:--'}
      </span>
      <span aria-hidden="true" className="h-[18px] w-px bg-white/15" />
      <span className="text-sm font-medium text-muted-foreground">{now ? formatDate(now) : ' '}</span>
    </div>
  );
}
