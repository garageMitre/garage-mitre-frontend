'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Customer } from '@/types/cutomer.type';
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
        <Button variant="ghost" className="w-full justify-start gap-2 px-2 font-normal" size="sm">
          <Eye className="w-4 h-4" />
          Ver detalles
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {customer.firstName} {customer.lastName}
          </DialogTitle>
          <DialogDescription>Información del cliente y sus cocheras.</DialogDescription>
        </DialogHeader>

        {/* Datos del Cliente */}
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
          {[
            { label: 'Nombre y apellido', value: `${customer.firstName} ${customer.lastName}` },
            { label: 'Celular', value: customer.phone || '—' },
            { label: 'Cocheras', value: customer.numberOfVehicles },
          ].map((item) => (
            <div key={item.label} className="bg-card px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 text-sm font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>

        {/* Sección de Vehículos */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Cocheras registradas</h3>
          {vehiclesToDisplay && vehiclesToDisplay.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                    <TableHead>Cochera</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehiclesToDisplay.map((vehicleRenter, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{vehicleRenter.garageNumber || '—'}</TableCell>

                      {/* Mostrar propietario si es RENTER */}
                      {customer.customerType !== 'OWNER' && (
                        <TableCell>
                          {vehicleRenter.vehicle
                            ? `${vehicleRenter.vehicle.customer?.firstName ?? 'Sin nombre'} ${vehicleRenter.vehicle.customer?.lastName ?? ''} (${vehicleRenter.vehicle.garageNumber})`
                            : pendingReceipt?.receiptTypeKey
                              ? receiptTypeNames[pendingReceipt.receiptTypeKey] ?? pendingReceipt.receiptTypeKey
                              : '—'}
                        </TableCell>
                      )}

                      <TableCell className="text-right tabular-nums">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(vehicleRenter.amount ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No hay cocheras registradas.</p>
          )}
        </div>

        {/* Botón de Cerrar */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
