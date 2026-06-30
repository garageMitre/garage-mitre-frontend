export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { getTickets, getTicketsPrice } from '@/services/tickets.service';
import { TicketsTable } from './components/tickets-table';
import { ticketColumns } from './components/ticket-columns';
import { ticketPriceColumns } from './components/ticket-price-hours/ticket-price-columns';
import { TicketsPriceTable } from './components/ticket-price-hours/tickets-price-table';
import { TicketsPriceWeekOrDayTable } from './components/ticket-price-week-or-day/tickets-price-table';
import { ticketPriceWeekOrDayColumns } from './components/ticket-price-week-or-day/ticket-price-columns';
import { currentUser } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { ExportTicketsExcel } from '../components/export-ticket-excel';
import { Clock4, Hourglass } from 'lucide-react';
import { CreateTicketPriceDialog } from './components/ticket-price-hours/create-ticket-price-dialog';
import { CreateTicketPriceWeekOrDayDialog } from './components/ticket-price-week-or-day/create-ticket-price-dialog';

export default async function UserPage() {
  const tickets = await getTickets();
  const ticketsPrice = await getTicketsPrice();
  const user = await currentUser();

  const sortedTickets = (tickets?.data || []).sort((a, b) => {
    const codeA = parseInt(a.codeBar, 10);
    const codeB = parseInt(b.codeBar, 10);
    return codeA - codeB;
  });

  const ticketTimeTypeNull =
    ticketsPrice?.data?.filter((tp) => tp.ticketTimeType === null) || [];
  const vehicleTypeNull =
    ticketsPrice?.data?.filter((tp) => tp.ticketDayType === null) || [];

  return (
    <div className="container mx-auto px-4 py-6 sm:p-8 max-w-7xl space-y-10">
      <PageHeader
        breadcrumb={['Garage Mitre', 'Administración', 'Tickets']}
        title="Tickets y precios"
        description={
          sortedTickets.length > 0
            ? `${sortedTickets.length} códigos de barra registrados.`
            : 'Registrá el primer ticket para empezar a operar.'
        }
        actions={<ExportTicketsExcel tickets={sortedTickets} />}
      />

      <section>
        <TicketsTable columns={ticketColumns} data={sortedTickets} />
      </section>

      {user?.role === 'ADMIN' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-md border border-gm-yellow/40 bg-gm-yellow/15 text-gm-yellow">
                  <Clock4 className="size-4" />
                </span>
                <div>
                  <h2 className="gm-display text-[14px] font-bold text-foreground">
                    Precios por hora
                  </h2>
                  <p className="text-[11.5px] text-muted-foreground">
                    Según tipo de vehículo y horario.
                  </p>
                </div>
              </div>
              <CreateTicketPriceDialog />
            </div>
            <TicketsPriceTable
              columns={ticketPriceColumns}
              data={ticketTimeTypeNull}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-md border border-gm-orange/40 bg-gm-orange/15 text-[#FF8458]">
                  <Hourglass className="size-4" />
                </span>
                <div>
                  <h2 className="gm-display text-[14px] font-bold text-foreground">
                    Precios por abono
                  </h2>
                  <p className="text-[11.5px] text-muted-foreground">
                    Tickets por día o semana.
                  </p>
                </div>
              </div>
              <CreateTicketPriceWeekOrDayDialog />
            </div>
            <TicketsPriceWeekOrDayTable
              columns={ticketPriceWeekOrDayColumns}
              data={vehicleTypeNull}
            />
          </div>
        </section>
      )}
    </div>
  );
}
