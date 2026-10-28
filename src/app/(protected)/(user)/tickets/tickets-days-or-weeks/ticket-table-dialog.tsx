// ticket-table-dialog.tsx
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TicketDayOrWeekTable } from './tickets-day-or-week-table';
import { ticketDayOrWeekColumns } from './ticket-day-or-week-columns';
import { TicketRegistrationForDay } from '@/types/ticket-registration-for-day.type';

export function TicketTableDialog({
  ticketRegistrationForDay,
  open,
  setOpen,
}: {
  ticketRegistrationForDay: TicketRegistrationForDay[];
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-6xl max-h-5xl w-full shadow-none">
        <DialogHeader className="items-center">
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <div className="w-full p-0">
          <TicketDayOrWeekTable
            columns={ticketDayOrWeekColumns}
            data={ticketRegistrationForDay || []}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
