export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { CreditCardIcon } from 'lucide-react';
import { findReceipts, getCustomers, getCustomerThird, getCustomerVehicleRenter } from '@/services/customers.service';
import { DropdownMenuAction } from '../components/customers/drop-menu-actions';
import { CUSTOMER_TYPE } from '@/types/cutomer.type';
import { privateColumns } from './components/private-columns';
import { PrivatesTable } from './components/privates-table';


export default async function PrivatePage() {
  const customers = await getCustomers(CUSTOMER_TYPE[2]);
  const customersThirds = await getCustomerVehicleRenter()
  const receipts = await findReceipts();

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3 mb-6 sm:mb-8 bg-secondary/50 p-4 sm:p-6 rounded-xl backdrop-blur-sm">
        <CreditCardIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Administrar Inquilinos de Terceros</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestiona todos los Inquilinos de Terceros.
          </p>
        </div>
      </div>
      <div className="mb-4">
        <DropdownMenuAction customers={customers || []} type='PRIVATE' receipts={receipts || []} />
      </div>
      <PrivatesTable
        columns={privateColumns}
        data={customers|| []}
        customersRenters={customersThirds || []}
      />
    </div>
  );
}
