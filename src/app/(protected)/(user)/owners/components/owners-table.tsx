'use client';

import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ColumnDef } from '@tanstack/react-table';

import { ParkingType } from '@/types/parking-type';
import { Customer } from '@/types/cutomer.type';
import { DataTableShell } from '@/components/data-table-shell';
import { CreateOwnerDialog } from './create-owner-dialog';
import { CustomerInlineDetail } from '../../components/receipts/customer-inline-detail';

interface OwnersTableProps {
  columns: (parkingTypes: ParkingType[]) => ColumnDef<Customer>[];
  data: Customer[];
  parkingTypes: ParkingType[];
}

export function OwnersTable({ columns, data, parkingTypes }: OwnersTableProps) {
  const searchParams = useSearchParams();
  const lastNameQuery = searchParams.get('lastName') || '';
  const session = useSession();
  const isAdmin = session.data?.user.role === 'ADMIN';

  return (
    <DataTableShell
      data={data}
      columns={columns(parkingTypes)}
      filterColumn="lastName"
      filterPlaceholder="Filtrar por apellido..."
      initialFilter={lastNameQuery}
      initialSort={[{ id: 'lastName', desc: false }]}
      toolbarRight={isAdmin ? <CreateOwnerDialog /> : null}
      renderSubComponent={(row) => <CustomerInlineDetail customer={row.original} />}
    />
  );
}
