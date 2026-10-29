export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';
import { Users } from 'lucide-react';
import { findReceipts } from '@/services/customers.service';
import { ReceiptsByTypeChart } from './components/receipts-by-type-chart';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

const TZ = 'America/Argentina/Buenos_Aires';

// Métricas de cobranza de clientes (antes vivían en el dashboard): recibos pagados vs pendientes
// por tipo de cliente para un mes, elegido con ?receiptsMonth=YYYY-MM (por defecto, el actual).
export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ receiptsMonth?: string }>;
}) {
  const params = await searchParams;
  const requested = params.receiptsMonth;
  const month = requested && /^\d{4}-\d{2}$/.test(requested) ? requested : dayjs().tz(TZ).format('YYYY-MM');
  const start = dayjs.tz(`${month}-01`, TZ);
  const from = start.startOf('month').format('YYYY-MM-DD');
  const to = start.endOf('month').format('YYYY-MM-DD');
  const labelRaw = start.format('MMMM YYYY');
  const monthLabel = labelRaw.charAt(0).toUpperCase() + labelRaw.slice(1);
  const prevStart = start.subtract(1, 'month');

  // El mes anterior solo se usa para la comparación ("+10 pts vs agosto"); si falla, no se muestra.
  const [receipts, previousReceipts] = await Promise.all([
    findReceipts({ from, to }),
    findReceipts({ from: prevStart.startOf('month').format('YYYY-MM-DD'), to: prevStart.endOf('month').format('YYYY-MM-DD') }),
  ]);
  const previous = previousReceipts
    ? {
        label: prevStart.format('MMMM'),
        paid: previousReceipts.filter((r) => r.status === 'PAID').length,
        total: previousReceipts.length,
      }
    : null;

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-xl bg-secondary/50 p-4 backdrop-blur-sm sm:mb-8 sm:flex-row sm:items-center sm:gap-3 sm:p-6">
        <Users className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Cobranza del mes de propietarios, inquilinos y terceros.
          </p>
        </div>
      </div>

      {receipts === null ? (
        <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">
          No se pudieron cargar los recibos. Intentá nuevamente.
        </p>
      ) : (
        <ReceiptsByTypeChart month={month} monthLabel={monthLabel} receipts={receipts} previous={previous} />
      )}
    </div>
  );
}
