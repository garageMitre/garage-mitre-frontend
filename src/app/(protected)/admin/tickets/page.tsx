export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { Ticket, FileSpreadsheet } from 'lucide-react';
import { getTickets, getTicketsPrice } from '@/services/tickets.service';
import { TicketsTable } from './components/tickets-table';
import { ticketColumns } from './components/ticket-columns';
import { ticketPriceColumns } from './components/ticket-price-hours/ticket-price-columns';
import { TicketsPriceTable } from './components/ticket-price-hours/tickets-price-table';
import { TicketsPriceWeekOrDayTable } from './components/ticket-price-week-or-day/tickets-price-table';
import { ticketPriceWeekOrDayColumns } from './components/ticket-price-week-or-day/ticket-price-columns';
import { currentUser } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ExportTicketsExcel } from '../components/export-ticket-excel';

export default async function UserPage() {
  const tickets = await getTickets();
  const ticketsPrice = await getTicketsPrice();
  const user = await currentUser();

  // ✅ Ordenar tickets por número de código de barras (numéricamente)
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
    <div className="container mx-auto px-4 py-6 space-y-10">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-3 p-6 bg-secondary/50 rounded-xl shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Ticket className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Administrar Tickets</h1>
            <p className="text-muted-foreground text-sm">
              Gestiona todos los tickets registrados.
            </p>
          </div>
        </div>

        {/* 🧭 Dropdown de acciones */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <ExportTicketsExcel tickets={sortedTickets} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabla principal de tickets */}
      <section className="w-full space-y-2">
        <TicketsTable columns={ticketColumns} data={sortedTickets} />
      </section>

      {user?.role === 'ADMIN' && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">
                Precios por Hora (según vehículo)
              </h2>
              <TicketsPriceTable
                columns={ticketPriceColumns}
                data={ticketTimeTypeNull}
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">
                Precios por Tipo de Ticket (día / semana)
              </h2>
              <TicketsPriceWeekOrDayTable
                columns={ticketPriceWeekOrDayColumns}
                data={vehicleTypeNull}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
