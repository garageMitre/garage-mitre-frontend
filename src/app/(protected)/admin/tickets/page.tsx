export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { getTickets, getTicketsPrice } from '@/services/tickets.service';
import { getTariffPlanAction } from '@/actions/tickets/tariff-plan.action';
import { TicketsTable } from './components/tickets-table';
import { ticketColumns } from './components/ticket-columns';
import { currentUser } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { ExportTicketsExcel } from '../components/export-ticket-excel';
import { TicketsTabs } from './components/tickets-tabs';

export default async function UserPage() {
  const user = await currentUser();
  const isAdmin = user?.role === 'ADMIN';
  const [tickets, tariff, ticketsPrice] = await Promise.all([
    getTickets(),
    isAdmin ? getTariffPlanAction() : null,
    isAdmin ? getTicketsPrice() : null,
  ]);
  const dayWeekMonthPrices = (ticketsPrice?.data || []).filter((p) =>
    ['DIA', 'SEMANA', 'MES'].includes(p.ticketTimeType ?? ''),
  );

  const sortedTickets = (tickets?.data || []).sort((a, b) => {
    const codeA = parseInt(a.codeBar, 10);
    const codeB = parseInt(b.codeBar, 10);
    return codeA - codeB;
  });

  return (
    <PageShell>
      <PageHeader
        title="Tickets y precios"
        description={
          sortedTickets.length > 0
            ? `${sortedTickets.length} códigos de barra registrados.`
            : 'Registrá el primer ticket para empezar a operar.'
        }
        actions={<ExportTicketsExcel tickets={sortedTickets} />}
      />

      <TicketsTabs
        catalog={<TicketsTable columns={ticketColumns} data={sortedTickets} />}
        tariffs={
          tariff
            ? { plan: tariff.plan ?? null, loadError: tariff.error, passPrices: dayWeekMonthPrices }
            : undefined
        }
      />
    </PageShell>
  );
}
