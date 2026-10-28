'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Car, CheckCircle2, Clock, HandCoins, Loader2, Timer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Ticket } from '@/types/ticket.type';
import { TicketRegistration } from '@/types/ticket-registration.type';
import { TicketPriceBracket } from '@/types/ticket-price-bracket.type';
import { TicketSchedule } from '@/services/tickets.service';
import { addAdvancePaymentAction } from '@/actions/tickets/add-advance-payment.action';
import {
  elapsedMinutes,
  formatElapsed,
  parseEntry,
  resolveDayType,
  resolveNextCascade,
  resolvePriceCascade,
  TZ,
} from '@/utils/active-ticket.utils';
import { formatRecurringUnitLabel } from '@/utils/ticket-price-bracket.utils';

const metodoLabel: Record<'CASH' | 'TRANSFER', string> = { CASH: 'Efectivo', TRANSFER: 'Transferencia' };

const ars = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);

const dayTypeLabel: Record<string, string> = { DAY: 'Día', NIGHT: 'Noche' };

interface ActiveTicketDialogProps {
  ticket: Ticket | null;
  registration: TicketRegistration | null;
  brackets: TicketPriceBracket[];
  schedule: TicketSchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActiveTicketDialog({
  ticket,
  registration,
  brackets,
  schedule,
  open,
  onOpenChange,
}: ActiveTicketDialogProps) {
  const [now, setNow] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();
  const [expectedBracketId, setExpectedBracketId] = useState<string>('none');
  const router = useRouter();

  // The elapsed readout is the point of this dialog — keep it ticking while open.
  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [open]);

  // Resetea el form cada vez que se abre un ticket distinto — si no, queda pegado el valor
  // del ticket anterior.
  useEffect(() => {
    setExpectedBracketId('none');
  }, [registration?.id]);

  const entry = useMemo(
    () =>
      registration ? parseEntry(registration.entryDay, registration.entryTime) : null,
    [registration],
  );

  const elapsed = entry ? elapsedMinutes(entry, now) : null;
  const dayType = entry ? resolveDayType(entry, schedule) : null;
  const grace = schedule?.graceMinutes ?? 5;

  const current = useMemo(
    () =>
      ticket && elapsed !== null
        ? resolvePriceCascade(brackets, ticket.vehicleType, dayType, elapsed, grace)
        : null,
    [brackets, ticket, dayType, elapsed, grace],
  );
  const next = useMemo(
    () =>
      ticket && elapsed !== null
        ? resolveNextCascade(brackets, ticket.vehicleType, dayType, elapsed, grace)
        : null,
    [brackets, ticket, dayType, elapsed, grace],
  );

  // Franjas candidatas para "tarifa estimada" — mismo vehículo, sin restringir por horario
  // (el operador puede estar avisando de antemano una franja de un horario que todavía no
  // empezó, ej. franja nocturna a la tarde). Se excluyen las franjas "sin límite": no tiene
  // sentido "avisar" una duración sin techo, son el fallback, no una estimación real.
  const candidateBrackets = useMemo(
    () =>
      ticket
        ? brackets
            .filter((b) => b.vehicleType === ticket.vehicleType && b.uptoMinutes !== null)
            .sort((a, b) => a.uptoMinutes! - b.uptoMinutes!)
        : [],
    [brackets, ticket],
  );
  const vehicleTypeLabel = ticket?.vehicleType === 'CAMIONETA' ? 'Camioneta' : 'Auto';

  const hasAdvance = registration?.advancePaidAmount != null;
  const exceededExpected =
    hasAdvance && registration?.expectedUptoMinutes != null && elapsed !== null
      ? elapsed > registration.expectedUptoMinutes
      : null;

  const handleSaveExpectedBracket = () => {
    if (!registration) return;
    const expectedBracket = candidateBrackets.find((b) => b.id === expectedBracketId);
    startTransition(async () => {
      // Sin cobro acá — solo queda avisada la tarifa esperada, para el aviso de "se pasó o
      // no". El cobro real se hace al registrar la salida (diálogo de efectivo/transferencia).
      const result = await addAdvancePaymentAction(registration.id, {
        advancePaidAmount: 0,
        expectedBracketLabel: expectedBracket?.label,
        expectedUptoMinutes: expectedBracket?.uptoMinutes ?? undefined,
      });
      if ('error' in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success('Tarifa estimada guardada exitosamente');
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto sm:max-h-[90dvh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-gm-yellow/40 bg-gm-yellow/15 text-gm-yellow">
              <Car className="size-4" />
            </span>
            <div>
              <DialogTitle>Ticket {ticket?.codeBar ?? '—'}</DialogTitle>
              <DialogDescription className="mt-0.5">
                Vehículo en el playón · {ticket?.vehicleType === 'CAMIONETA' ? 'Camioneta' : 'Automóvil'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* Time in the lot */}
          <div className="rounded-md border border-border bg-gm-surface-2 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              <Timer className="size-3.5" />
              En el playón
            </div>
            <div className="gm-display gm-tnum mt-1 text-[26px] font-bold leading-none text-gm-yellow">
              {elapsed !== null ? formatElapsed(elapsed) : '—'}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-2.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Desde
              </span>
              <span className="gm-mono gm-tnum text-[13px] font-semibold text-foreground">
                {entry ? entry.tz(TZ).format('DD/MM/YYYY HH:mm:ss') : '—'}
              </span>
            </div>
          </div>

          {/* Tariff in force — read from the price table, never a computed total */}
          <div className="rounded-md border border-border bg-gm-surface-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <Clock className="size-3.5" />
                Franja vigente
              </div>
              {dayType && (
                <Badge variant={dayType === 'NIGHT' ? 'blue' : 'yellow'}>
                  {dayTypeLabel[dayType]}
                </Badge>
              )}
            </div>

            {current ? (
              <>
                {/* Cascada: si hay más de una parte, se muestra el detalle de cada escalón
                    ya sumado — evita que se vea como si cobrara el techo plano de la franja
                    que "cubre" el tiempo transcurrido cuando en realidad se cobra en cascada. */}
                {current.parts.length > 1 ? (
                  <div className="mt-2 space-y-1">
                    {current.parts.map((part, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-[12.5px]">
                        <span className="text-muted-foreground">{part.label}</span>
                        <span className="gm-mono gm-tnum font-semibold text-foreground">{ars(part.price)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                    <span className="text-[13px] font-medium text-foreground">{current.label}</span>
                    {current.recurringUnitMinutes && (
                      <span className="text-[11.5px] font-normal text-muted-foreground">
                        {formatRecurringUnitLabel(current.recurringUnitMinutes)}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Acumulado ahora
                  </span>
                  <span className="gm-display gm-tnum text-[20px] font-bold leading-none text-gm-yellow">
                    {ars(current.price)}
                  </span>
                </div>

                {next && next.price !== current.price && (
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-2.5">
                    <span className="text-[11.5px] text-muted-foreground">Siguiente: {next.label}</span>
                    <span className="gm-mono gm-tnum text-[12.5px] font-semibold text-muted-foreground">
                      {ars(next.price)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-[12px] text-muted-foreground">
                No hay una franja cargada para este vehículo y horario. Revisá las
                franjas de precio en Administración.
              </p>
            )}
          </div>

          {/* Tarifa estimada — solo un aviso de cuánto se espera que dure, sin cobrar nada acá.
              El cobro real (con el método efectivo/transferencia) se hace al registrar la
              salida, no en este diálogo. */}
          <div className="rounded-md border border-border bg-gm-surface-2 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              <HandCoins className="size-3.5" />
              Tarifa estimada
            </div>

            {hasAdvance ? (
              <>
                {registration!.advancePaidAmount! > 0 && (
                  <p className="mt-1.5 text-[12.5px] text-foreground">
                    Se cobró <strong>{ars(registration!.advancePaidAmount!)}</strong>
                    {registration!.advancePaymentMetodo && (
                      <> · {metodoLabel[registration!.advancePaymentMetodo]}</>
                    )}
                  </p>
                )}
                {registration!.expectedBracketLabel ? (
                  <p className="mt-1.5 text-[12.5px] text-foreground">
                    Se avisó: <strong>{registration!.expectedBracketLabel}</strong>
                  </p>
                ) : (
                  <p className="mt-1.5 text-[12px] text-muted-foreground">
                    No se avisó ninguna tarifa estimada para este ticket.
                  </p>
                )}
                {exceededExpected !== null && (
                  <div
                    className={
                      'mt-2 flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11.5px] font-medium ' +
                      (exceededExpected
                        ? 'border-destructive/40 bg-destructive/10 text-[#F08775]'
                        : 'border-[hsl(120_35%_45%)]/40 bg-[hsl(120_35%_45%)]/10 text-[hsl(120_45%_65%)]')
                    }
                  >
                    {exceededExpected ? (
                      <>
                        <AlertTriangle className="size-3.5 shrink-0" />
                        Ya se pasó de la tarifa estimada
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        Todavía dentro de lo estimado
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mt-2">
                  <Select disabled={isPending} value={expectedBracketId} onValueChange={setExpectedBracketId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tarifa estimada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin tarifa estimada</SelectItem>
                      {candidateBrackets.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.label} · {vehicleTypeLabel} · {b.ticketDayType ? dayTypeLabel[b.ticketDayType] : 'Cualquiera'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Avisá cuánto pensás que va a durar la estadía para ver si se pasa o no. El
                    cobro se hace al registrar la salida.
                  </p>
                </div>

                <Button
                  className="mt-2.5 w-full"
                  size="sm"
                  disabled={isPending || expectedBracketId === 'none'}
                  onClick={handleSaveExpectedBracket}
                >
                  {isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                  Guardar tarifa estimada
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
