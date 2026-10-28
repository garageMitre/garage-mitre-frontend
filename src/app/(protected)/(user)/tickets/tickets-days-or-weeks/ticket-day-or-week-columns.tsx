'use client';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from '@/types/user.type';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheckIcon, BadgeXIcon, MoreHorizontal } from 'lucide-react';
import { TicketRegistrationForDay } from '@/types/ticket-registration-for-day.type';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateTicketRegistrationForDayStatusAction } from '@/actions/tickets/update-ticket-registration-for-day-status.action';
import { DeleteTicketRegistrationForDayDialog } from './delete-registration-for-day-dialog';
async function toggleFieldOnServer(
  id: string,
  field: 'paid' | 'retired',
  newValue: boolean
) {
  const payload = { [field]: newValue }; // genera: { paid: true } o { retired: false }

  const data = await updateTicketRegistrationForDayStatusAction(id, payload);

    if (data.error) {
    toast.error(data.error);
  }

  return data;
}

export const ticketDayOrWeekColumns: ColumnDef<TicketRegistrationForDay>[] = [
  

    {
    accessorKey: 'lastNameCustomer',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Apellido" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[50px] text-sm">{row.getValue('lastNameCustomer')}</div>
    ),
  },
    {
    accessorKey: 'price',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Monto" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[50px] text-sm">$ {row.getValue('price')}</div>
    ),
  },
      {
    accessorKey: 'weeks',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Semana/s" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[50px] text-sm text-center">{row.getValue('weeks') ?? 0}</div>
    ),
  },
      {
    accessorKey: 'days',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dias/s" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[50px] text-sm text-center">{row.getValue('days')?? 0}</div>
    ),
  },
    {
    accessorKey: 'vehicleType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo de Vehiculo" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[50px] text-sm text-center">{row.getValue('vehicleType')}</div>
    ),
  },
        {
    accessorKey: 'dateNow',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Desde" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[50px] text-sm">{row.getValue('dateNow')}</div>
    ),
  },
  {
    accessorKey: 'paid',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pagado" />
    ),
    cell: ({ row }) => {
      const ticket = row.original
      // estado local para forzar re-render
      const [isPaid, setIsPaid] = useState<boolean>(ticket.paid)

      const handleToggle = async () => {
        const newValue = !isPaid
        try {
          await toggleFieldOnServer(ticket.id, 'paid', newValue)
          setIsPaid(newValue)
          toast.success(`Pago marcado como ${newValue ? 'Sí' : 'No'}`)
        } catch (err) {
          console.error(err)
          toast.error('No se pudo actualizar el pago')
        }
      }

      return (
        <Button
          size="sm"
          variant="outline"
          className={
            isPaid
              ? 'w-20 bg-green-900 text-white hover:bg-green-600'
              : 'w-20 bg-red-900 text-white hover:bg-red-600'
          }
          onClick={handleToggle}
        >
          {isPaid ? 'Sí' : 'No'}
        </Button>
      )
    },
  },

  {
    accessorKey: 'retired',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Retirado" />
    ),
    cell: ({ row }) => {
      const ticket = row.original
      const [isRetired, setIsRetired] = useState<boolean>(ticket.retired)

      const handleToggle = async () => {
        const newValue = !isRetired
        try {
          await toggleFieldOnServer(ticket.id, 'retired', newValue)
          setIsRetired(newValue)
          toast.success(`Retirado marcado como ${newValue ? 'Sí' : 'No'}`)
        } catch {
          toast.error('No se pudo actualizar estado de retirado')
        }
      }

      return (
        <Button
          size="sm"
          variant="outline"
          className={
            isRetired
              ? 'w-20 bg-green-900 text-white hover:bg-green-600'
              : 'w-20 bg-red-900 text-white hover:bg-red-600'
          }
          onClick={handleToggle}
        >
          {isRetired ? 'Sí' : 'No'}
        </Button>
      )
    },
  },
    {
      id: 'actions',
      cell: ({ row }) => {
        const ticket = row.original;
  
        return  (
          <div>
          <DeleteTicketRegistrationForDayDialog ticket={ticket} />
          </div>
        )
      },
    },
];
