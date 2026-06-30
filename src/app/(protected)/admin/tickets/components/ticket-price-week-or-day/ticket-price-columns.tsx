'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { ticketPrice } from '@/types/ticket-price';
import { UpdateTicketPriceWeekOrDayDialog } from './update-ticket-price-dialog';
import { DeleteTicketPriceWeekOrDayDialog } from './delete-ticket-price-dialog';

const timeTypeMap: Record<string, string> = {
  DIA: 'Día',
  SEMANA: 'Semana',
  SEMANA_Y_DIA: 'Semana y día',
};

const ars = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n);

export const ticketPriceWeekOrDayColumns: ColumnDef<ticketPrice>[] = [
  {
    accessorKey: 'ticketTimePrice',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Precio" />
    ),
    cell: ({ row }) => (
      <span className="gm-display gm-tnum text-[13.5px] font-bold text-foreground">
        {ars(row.getValue('ticketTimePrice'))}
      </span>
    ),
  },
  {
    accessorKey: 'ticketTimeType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('ticketTimeType') as string;
      return <Badge variant="orange">{timeTypeMap[value] || value}</Badge>;
    },
  },
  {
    accessorKey: 'vehicleType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vehículo" />
    ),
    cell: ({ row }) => (
      <Badge variant="default">{row.getValue('vehicleType')}</Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const ticketPrice = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <span className="sr-only">Abrir acciones</span>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 border border-border bg-gm-surface p-1 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]"
          >
            <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Acciones
            </DropdownMenuLabel>
            <UpdateTicketPriceWeekOrDayDialog ticketPrice={ticketPrice} />
            <DeleteTicketPriceWeekOrDayDialog ticketPrice={ticketPrice} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
