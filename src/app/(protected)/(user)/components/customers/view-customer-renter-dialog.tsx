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

export function ViewCustomerRenterDialog({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);

  const pendingReceipt = customer.receipts.find((receipt: any) => receipt.status === "PENDING");
  const receiptTypeNames: Record<string, string> = {
    JOSE_RICARDO_AZNAR: 'José Ricardo Aznar',
    CARLOS_ALBERTO_AZNAR: 'Carlos Alberto Aznar',
    NIDIA_ROSA_MARIA_FONTELA: 'Nidia Rosa María Fontela',
    ALDO_RAUL_FONTELA: 'Aldo Raúl Fontela',
    GARAGE_MITRE: 'Garage Mitre'
  };
  // Combina vehículos propios y rentados
  const vehiclesToDisplay = customer.vehicleRenters;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start" size="sm">
        <Eye className="w-4 h-4" />
          Ver Detalles
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[100vh] sm:max-h-[150vh] overflow-y-auto w-full max-w-2xl sm:max-w-3xl">
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
                  <TableHead>Propietario</TableHead>
                 <TableHead>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehiclesToDisplay.map((vehicleRenter, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{vehicleRenter.garageNumber}</TableCell>

                      {/* Mostrar propietario si es RENTER */}
                      {customer.customerType !== 'OWNER' && (
                        <TableCell>
                          {vehicleRenter.vehicle
                            ? `${vehicleRenter.vehicle.customer?.firstName ?? 'Sin nombre'} ${vehicleRenter.vehicle.customer?.lastName ?? ''} (${vehicleRenter.vehicle.garageNumber})`
                            : pendingReceipt?.receiptTypeKey
                              ? receiptTypeNames[pendingReceipt.receiptTypeKey] ?? pendingReceipt.receiptTypeKey
                              : ''}
                        </TableCell>
                      )}

                      <TableCell>${vehicleRenter.amount}</TableCell>
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
