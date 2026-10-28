export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';

import {
  getCustomersSummary,
  getHourlyActivity,
  getOtherPaymentsSummary,
  getReceiptsSummary,
  getRevenueSummary,
} from '@/services/dashboard.service';
import { findReceipts } from '@/services/customers.service';
import { DashboardDateRangePicker } from './components/date-range-picker';
import { ActivityRevenueChart } from './components/activity-revenue-chart';
import { HourlyActivityAreaChart } from './components/hourly-activity-area-chart';
import { IncomeExpensesLineChart } from './components/income-expenses-line-chart';
import { ReceiptsByTypeChart } from './components/receipts-by-type-chart';
import { CustomersByTypeChart } from './components/customers-by-type-chart';
import { PaymentTypesBulletChart } from './components/payment-types-bullet-chart';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';
import { HashScroll } from './components/hash-scroll';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; receiptsMonth?: string; hourlyDate?: string }>;
}) {
  const params = await searchParams;
  const argentinaNow = dayjs().tz('America/Argentina/Buenos_Aires');
  const from = params.from ?? argentinaNow.startOf('month').format('YYYY-MM-DD');
  const to = params.to ?? argentinaNow.format('YYYY-MM-DD');
  const hourlyDate = params.hourlyDate ?? argentinaNow.format('YYYY-MM-DD');

  // La actividad de recaudación siempre muestra su propia ventana fija de 140 días
  // (como un heatmap de GitHub) independiente del selector de rango de la página.
  const activityFrom = argentinaNow.subtract(139, 'day').format('YYYY-MM-DD');
  const activityTo = argentinaNow.format('YYYY-MM-DD');

  // Recibos pagados vs pendientes tiene su propio filtro por mes, independiente
  // del rango global de la página.
  const receiptsMonth = params.receiptsMonth ?? argentinaNow.format('YYYY-MM');
  const receiptsMonthFrom = dayjs.tz(receiptsMonth, 'America/Argentina/Buenos_Aires').startOf('month').format('YYYY-MM-DD');
  const receiptsMonthTo = dayjs.tz(receiptsMonth, 'America/Argentina/Buenos_Aires').endOf('month').format('YYYY-MM-DD');
  const receiptsMonthLabelRaw = dayjs.tz(receiptsMonth, 'America/Argentina/Buenos_Aires').format('MMMM YYYY');
  const receiptsMonthLabel = receiptsMonthLabelRaw.charAt(0).toUpperCase() + receiptsMonthLabelRaw.slice(1);

  const [activityRevenue, hourlyActivity, otherPayments, receipts, receiptsForGauge, receiptsMonthDetail, customers] =
    await Promise.all([
      getRevenueSummary({ from: activityFrom, to: activityTo }),
      getHourlyActivity(hourlyDate),
      getOtherPaymentsSummary({ from, to }),
      getReceiptsSummary({ from, to }),
      getReceiptsSummary({ from: receiptsMonthFrom, to: receiptsMonthTo }),
      findReceipts({ from: receiptsMonthFrom, to: receiptsMonthTo }),
      getCustomersSummary({ from, to }),
    ]);

  return (
    <PageShell>
      <HashScroll />
      <PageHeader title="Dashboard" />

      <div>
        <ActivityRevenueChart data={activityRevenue} />
      </div>

      <div>
        <HourlyActivityAreaChart data={hourlyActivity} date={hourlyDate} />
      </div>

      {/* Tiene su propio filtro de mes, independiente del rango global de abajo — por eso va
          aparte, ocupando todo el ancho, en vez de compartir grilla con los que sí lo usan.
          El id es el destino del acceso directo "Ver métricas" del menú de Clientes —
          scroll-mt para que no quede tapado por el topbar sticky. */}
      <div id="recibos-pagados-pendientes" className="scroll-mt-24">
        <ReceiptsByTypeChart
          data={receiptsForGauge}
          month={receiptsMonth}
          monthLabel={receiptsMonthLabel}
          receipts={receiptsMonthDetail ?? []}
        />
      </div>

      <div className="flex justify-end">
        <DashboardDateRangePicker from={from} to={to} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <IncomeExpensesLineChart data={otherPayments} />
        </div>
        <div>
          <CustomersByTypeChart data={customers} />
        </div>
        <div>
          <PaymentTypesBulletChart data={receipts} />
        </div>
      </div>
    </PageShell>
  );
}
