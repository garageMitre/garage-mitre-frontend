'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableShell } from '@/components/data-table-shell';
import { CreateTicketDialog } from './create-ticket-dialog';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function TicketsTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  return (
    <DataTableShell
      data={data}
      columns={columns}
      filterColumn="vehicleType"
      filterPlaceholder="Filtrar tipos..."
      pageSize={5}
      emptyMessage="No hay tickets registrados."
      toolbarRight={<CreateTicketDialog />}
    />
  );
}
