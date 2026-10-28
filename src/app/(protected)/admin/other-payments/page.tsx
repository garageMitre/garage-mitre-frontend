export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { expenseColumns } from './components/other-payment-columns';
import { ExpenseTable } from './components/other-payment-table';
import { CreateOtherPaymentDialog } from './components/create-other-payment-dialog';
import { getExpenses } from '@/services/expenses.service';
import { PageHeader } from '@/components/page-header';
import { PageShell } from '@/components/page-shell';


export default async function OtherPaymentPage() {
  const expenses = await getExpenses()
  return (
    <PageShell>
      <PageHeader
        title="Registrar ingresos o egresos"
        description="Cargá los movimientos que no provienen de tickets ni abonos."
        actions={<CreateOtherPaymentDialog />}
      />
      <ExpenseTable
        columns={expenseColumns}
        data={expenses|| []}
      />
    </PageShell>
  );
}
