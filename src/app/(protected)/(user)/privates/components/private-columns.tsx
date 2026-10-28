'use client';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef, SortingFn } from '@tanstack/react-table';
import { Ban, MoreHorizontal, Printer } from 'lucide-react';
import { useState } from 'react';
import { Customer } from '@/types/cutomer.type';
import { useSession } from 'next-auth/react';
import { PaymentSummaryCell } from '../../components/receipts/automatic-open-summary';
import { Vehicle } from '@/types/vehicle.type';
import { ViewCustomerRenterDialog } from '../../components/customers/view-customer-renter-dialog';
import { DeletePrivateDialog } from './delete-private-dialog';
import { UpdatePrivateDialog } from './update-private-dialog';
import { SoftDeletePrivateDialog } from './soft-delete-private-dialog';
import { RestoredPrivateDialog } from './restored-private-dialog';

const customSort: SortingFn<Customer> = (rowA, rowB, columnId) => {
  if (rowA.original.deletedAt && !rowB.original.deletedAt) return 1;
  if (!rowA.original.deletedAt && rowB.original.deletedAt) return -1;
  const valueA = rowA.getValue(columnId) as string;
  const valueB = rowB.getValue(columnId) as string;
  return valueA.toLowerCase().localeCompare(valueB.toLowerCase());
};

export const privateColumns = (customerRenters: Vehicle[]): ColumnDef<Customer>[] => [
  {
    accessorKey: 'lastName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Apellido" />,
    cell: ({ row }) => (
      <div
      className={`text-sm sm:text-base max-w-[200px] sm:max-w-[300px] truncate ${
        row.original.deletedAt ? 'text-gray-500 opacity-60' : ''
      }`}
    >
        {row.original.lastName}
      </div>
    ),
    sortingFn: customSort,
  },
  {
    accessorKey: 'firstName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) =>   <div
    className={`text-sm sm:text-base max-w-[200px] sm:max-w-[300px] truncate ${
      row.original.deletedAt ? 'text-gray-500 opacity-60' : ''
    }`}
  >{row.original.firstName}</div>,
    sortingFn: customSort,
  },
  {
    accessorKey: 'numberOfVehicles',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Número de vehículos" />,
    cell: ({ row }) => (
      <div
      className={`text-sm sm:text-base max-w-[200px] sm:max-w-[300px] truncate ${
        row.original.deletedAt ? 'text-gray-500 opacity-60' : ''
      }`}
    >
        {row.original.numberOfVehicles}
      </div>
    ),
    sortingFn: customSort,
  },
  {
    id: 'paymentSummary',
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <PaymentSummaryCell
          key={`${customer.id}-${customer.lastName}`} // 👈 esto fuerza el remount
          customer={customer}
        />
      );
    },
  },
  
  
  
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;
      const [openDropdown, setOpenDropdown] = useState(false);
      const session = useSession();

      return (
        <>
          <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-sm sm:text-base">Acciones</DropdownMenuLabel>
              <ViewCustomerRenterDialog customer={customer} />
              {session.data?.user.role === 'ADMIN' && (
                <>
                  <DropdownMenuSeparator />
                  {customer.deletedAt === null ? (
                    <>
                    <UpdatePrivateDialog customer={customer} customersRenters={customerRenters} />
                    <SoftDeletePrivateDialog customer={customer} />
                    </>
                  ): (
                    <>
                    <DeletePrivateDialog customer={customer} />
                    <RestoredPrivateDialog customer={customer} />
                  </>
                  )}
                </>
              )}            
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    },
  }
  
];
