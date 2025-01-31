
import { CreditCardIcon } from 'lucide-react';
import { RentersTable } from './components/renters-table';
import { renterColumns } from './components/renter-columns';
import { getRenters } from '@/services/renters.service';


export default async function RenterPage() {
  const renters = await getRenters();

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3 mb-6 sm:mb-8 bg-secondary/50 p-4 sm:p-6 rounded-xl backdrop-blur-sm">
        <CreditCardIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Administrar inquilinos</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestiona todos los inquilinos.
          </p>
        </div>
      </div>
      <RentersTable
        columns={renterColumns}
        data={renters?.data || []}
      />
    </div>
  );
}
