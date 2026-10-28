'use client';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ParkingType } from '@/types/parking-type';
import { User } from '@/types/user.type';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheckIcon, BadgeXIcon, MoreHorizontal } from 'lucide-react';
import { UpdateParkingTypeDailog } from './update-parking-type-dialog';
import { DeleteParkingTypeDialog } from './delete-parking-type-dialog';
export const parkingTypeColumns: ColumnDef<ParkingType>[] = [
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Precio" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[100px] text-sm">{row.getValue('amount')}</div>
    ),
  },
  {
    accessorKey: 'parkingType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo de Estacionamiento" />
    ),
    cell: ({ row }) => {
      const parkingTypeMap: Record<string, string> = {
        EXPENSES_1: 'Expensas 1',
        EXPENSES_2: 'Expensas 2',
        EXPENSES_ZOM_1: 'Expensas salon 1',
        EXPENSES_ZOM_2: 'Expensas salon 2',
        EXPENSES_ZOM_3: 'Expensas salon 3',
        EXPENSES_RICARDO_AZNAR: 'Expensas Ricardo Aznar',
        EXPENSES_ALDO_FONTELA: 'Expensas Aldo Fontela',
        EXPENSES_CARLOS_AZNAR: 'Expensas Carlos Aznar',
        EXPENSES_NIDIA_FONTELA: 'Expensas Nidia Fontela',

      };

      const parkingType = row.getValue('parkingType') as string;
      return (
        <div className="min-w-[100px] text-sm">
          {parkingTypeMap[parkingType] || parkingType}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const parkingType = row.original;

      return  (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir acciones</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Acciones</DropdownMenuLabel>
            <UpdateParkingTypeDailog parkingType={parkingType} />
            <DeleteParkingTypeDialog parkingType={parkingType} />
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];
