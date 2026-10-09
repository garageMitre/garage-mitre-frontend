'use client';

import { useState } from 'react';
import { Map } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TicketPriceBracketMap } from '@/app/(protected)/admin/tickets/components/ticket-price-bracket/ticket-price-bracket-map';
import { TicketPriceBracket } from '@/types/ticket-price-bracket.type';
import { TicketSchedule } from '@/services/tickets.service';

export function PriceBracketMapDialog({
  brackets,
  schedule,
}: {
  brackets: TicketPriceBracket[];
  schedule: TicketSchedule | null;
}) {
  const [open, setOpen] = useState(false);

  if (!schedule) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-gm-surface-2 hover:text-foreground"
      >
        <Map className="size-3.5" />
        Mapa de tarifas
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
          <DialogTitle className="sr-only">Mapa de tarifas</DialogTitle>
          <DialogDescription className="sr-only">
            Escalera de precios por franja horaria, con la tolerancia entre saltos y la diferencia
            entre día y noche.
          </DialogDescription>
          <TicketPriceBracketMap brackets={brackets} schedule={schedule} embedded />
        </DialogContent>
      </Dialog>
    </>
  );
}
