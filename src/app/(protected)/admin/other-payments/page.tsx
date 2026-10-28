export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { Banknote, CreditCardIcon, User, Wallet } from 'lucide-react';
import CardOtherPayment from './components/create-other-payment-card';
import { expenseColumns } from './components/other-payment-columns';
import { ExpenseTable } from './components/other-payment-table';
import { getExpenses } from '@/services/expenses.service';


export default async function OtherPaymentPage() {
  const expenses = await getExpenses()
  return (
    <div className="container mx-auto px-4 py-4 sm:p-6">
      <div className="w-3/5 mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3 mb-6 sm:mb-8 bg-secondary/50 p-4 sm:p-6 rounded-xl backdrop-blur-sm">
          <Banknote className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Registrar Ingresos o Egresos</h1>
          </div>
        </div>
      </div>
      <div className='mb-10'>
        <CardOtherPayment />
      </div>
        <ExpenseTable
          columns={expenseColumns}
          data={expenses|| []}
        />
    </div>
  );
}
