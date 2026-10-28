'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Customer } from '@/types/cutomer.type';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, X } from 'lucide-react';

export function ViewCustomerDialog({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);

  const parkingTypeMap: Record<string, string> = {
    EXPENSES_1: 'Expensas 1',
    EXPENSES_2: 'Expensas 2',
    EXPENSES_ZOM_1: 'Expensas salón 1',
    EXPENSES_ZOM_2: 'Expensas salón 2',
    EXPENSES_ZOM_3: 'Expensas salón 3',
    EXPENSES_RICARDO_AZNAR: 'Expensas Ricardo Aznar',
    EXPENSES_ALDO_FONTELA: 'Expensas Aldo Fontela',
    EXPENSES_NIDIA_FONTELA: 'Expensas Nidia Fontela',
  };

  // Combina vehículos propios y rentados
  const vehiclesToDisplay = customer.vehicles;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start" size="sm">
        <Eye className="w-4 h-4" />
          Ver Detalles
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[100vh] sm:max-h-[150vh] overflow-y-auto w-full max-w-3xl sm:max-w-3xl">
        <DialogHeader className="items-center">
          <DialogTitle>Información del Cliente</DialogTitle>
        </DialogHeader>

        {/* Datos del Cliente */}
        <Card>
          <CardContent className="p-4 space-y-3 text-sm sm:text-base">
            <p><strong>Nombre y Apellido:</strong> {customer.firstName} {customer.lastName}</p>
            <p><strong>Celular:</strong> {customer.phone}</p>
            <p><strong>Número de Vehículos:</strong> {customer.numberOfVehicles}</p>
          </CardContent>
        </Card>

        {/* Sección de Vehículos */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Vehículos Registrados</h3>
          {vehiclesToDisplay && vehiclesToDisplay.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Cochera</TableHead>
                  {customer.customerType !== 'OWNER' && (
                    <TableHead>Propietario</TableHead>
                  )}
                 <TableHead>Monto</TableHead>
                 <TableHead>Tipo de Estacionamiento</TableHead>
                  {customer.customerType === 'OWNER' && (
                    <TableHead>¿Usa cochera para alquilar?</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehiclesToDisplay.map((vehicle, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{vehicle.garageNumber}</TableCell>

                      {/* Mostrar propietario si es RENTER */}
                      {customer.customerType !== 'OWNER' && (
                        <TableCell>
                          {vehicle.customer
                            ? `${vehicle.customer.firstName} ${vehicle.customer.lastName}`
                            : 'Garage Mitre'}
                        </TableCell>
                      )}

                      <TableCell>${vehicle.amount}</TableCell>
                      {vehicle.parkingType !== null ? (
                      <TableCell>{parkingTypeMap[vehicle.parkingType?.parkingType] || vehicle.parkingType?.parkingType}</TableCell>
                    ): (
                      <TableCell>Alquiler</TableCell>
                    )}

                      {/* Mostrar "¿Usa cochera para alquilar?" si es OWNER */}
                      {customer.customerType === 'OWNER' && (
                        <TableCell>{vehicle.rent ? 'Sí' : 'No'}</TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500 mt-2">No hay vehículos registrados.</p>
          )}
        </div>

        {/* Botón de Cerrar */}
        <div className="flex justify-end mt-4">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
