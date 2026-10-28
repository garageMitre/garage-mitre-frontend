'use client';

import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { Column, Table } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './dropdown-menu';
import { Button } from './button';
import { BlendIcon } from 'lucide-react';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

// Nombres de las columnas que usan las tablas de la app; antes el menú mostraba el id interno
// («lastName», «numberOfVehicles»).
const COLUMN_LABELS: Record<string, string> = {
  lastName: 'Apellido',
  firstName: 'Nombre',
  lastNameCustomer: 'Apellido',
  numberOfVehicles: 'Cocheras',
  paymentSummary: 'Resumen',
  vehicleType: 'Vehículo',
  price: 'Precio',
  description: 'Descripción',
  ticketDayType: 'Horario',
  ticketTimeType: 'Duración',
  ticketTimePrice: 'Precio por unidad',
  weeks: 'Semanas',
  days: 'Días',
  hours: 'Horas',
  wallet: 'Caja',
  username: 'Usuario',
  email: 'Email',
  type: 'Tipo',
  retired: 'Retirado',
  parkingType: 'Tipo de cochera',
  paid: 'Pagado',
  dateNow: 'Fecha',
  date: 'Fecha',
  codeBar: 'Código de barras',
  amount: 'Monto',
};

// Una columna puede definir su propio nombre con meta.label; si no, se usa el diccionario y,
// como último recurso, el id separado en palabras.
function columnLabel<TData>(column: Column<TData, unknown>) {
  const meta = column.columnDef.meta as { label?: string } | undefined;
  if (meta?.label) return meta.label;
  if (COLUMN_LABELS[column.id]) return COLUMN_LABELS[column.id];
  const words = column.id.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-9 gap-1.5 rounded-lg bg-secondary lg:flex"
        >
          <BlendIcon className="h-4 w-4" />
          Vista
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide(),
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {columnLabel(column)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
