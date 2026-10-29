'use client';

import { useState } from 'react';
import { BoxListDialog } from '../box-list-dialog';
import { TicketTableDialog } from '@/app/(protected)/(user)/tickets/tickets-days-or-weeks/ticket-table-dialog';
import { TicketRegistrationForDay } from '@/types/ticket-registration-for-day.type';
import { NavUser } from './nav-user';

// Lado derecho de la barra: el menú (secciones, acciones del día y cuenta) y los diálogos que
// abre. Los diálogos quedan fuera del menú para seguir abiertos cuando el menú se cierra.
export function TopNav({
  userNav,
  ticketRegistrationsDayOrWeek,
}: {
  userNav: React.ComponentProps<typeof NavUser>['userNav'];
  ticketRegistrationsDayOrWeek: TicketRegistrationForDay[];
}) {
  const [openBoxDialog, setOpenBoxDialog] = useState(false);
  const [openTicketDialog, setOpenTicketDialog] = useState(false);

  return (
    <>
      <div className="ml-auto flex items-center">
        <NavUser userNav={userNav} onOpenBoxList={() => setOpenBoxDialog(true)} onOpenRegistrations={() => setOpenTicketDialog(true)} />
      </div>
      <BoxListDialog open={openBoxDialog} setOpen={setOpenBoxDialog} />
      <TicketTableDialog ticketRegistrationForDay={ticketRegistrationsDayOrWeek} open={openTicketDialog} setOpen={setOpenTicketDialog} />
    </>
  );
}
