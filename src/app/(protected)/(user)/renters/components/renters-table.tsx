'use client';

import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ColumnDef } from '@tanstack/react-table';

import { Customer } from '@/types/cutomer.type';
import { Vehicle } from '@/types/vehicle.type';
import { DataTableShell } from '@/components/data-table-shell';
import { CreateRenterDialog } from './create-renter-dialog';
import { CustomerInlineDetail } from '../../components/receipts/customer-inline-detail';

interface RentersTableProps {
  columns: (customersRenters: Vehicle[]) => ColumnDef<Customer>[];
  data: Customer[];
  customersRenters: Vehicle[];
}

export function RentersTable({ columns, data, customersRenters }: RentersTableProps) {
  const searchParams = useSearchParams();
  const lastNameQuery = searchParams.get('lastName') || '';
  const session = useSession();
  const isAdmin = session.data?.user.role === 'ADMIN';

  return (
    <DataTableShell
      data={data}
      columns={columns(customersRenters)}
      filterColumn="lastName"
      filterPlaceholder="Filtrar por apellido..."
      initialFilter={lastNameQuery}
      initialSort={[{ id: 'lastName', desc: false }]}
      toolbarRight={
        isAdmin ? <CreateRenterDialog customersRenters={customersRenters} /> : null
      }
      renderSubComponent={(row) => <CustomerInlineDetail customer={row.original} />}
    />
  );
}
