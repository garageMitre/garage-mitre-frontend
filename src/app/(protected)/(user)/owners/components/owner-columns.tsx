'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { UpdateOwnerDialog } from './update-owner-dialog';
import { DeleteOwnerDialog } from './delete-owner-dialog';
import { cancelReceipt, getCustomerById, historialReceipts } from '@/services/customers.service';
import { PaymentSummaryTable } from '../../components/payment-summary-customer-table';
import { ViewCustomerDialog } from '../../components/view-customer-dialog';
import { toast } from 'sonner';
import { Customer } from '@/types/cutomer.type';
import generateReceipt from '@/utils/generate-receipt';
import { useSession } from 'next-auth/react';
import { PaymentTypeReceiptDialog } from '../../components/payment-type-receipt-dialog';

export const OwnerColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'lastName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Apellido" />,
    cell: ({ row }) => (
      <div className="text-sm sm:text-base max-w-[200px] sm:max-w-[300px] truncate">
        {row.original.lastName}
      </div>
    ),
  },
  {
    accessorKey: 'firstName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => <div className="font-medium text-sm sm:text-base">{row.original.firstName}</div>,
  },
  {
    accessorKey: 'numberOfVehicles',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Número de vehículos" />,
    cell: ({ row }) => (
      <div className="text-sm sm:text-base max-w-[200px] sm:max-w-[300px] truncate">
        {row.original.numberOfVehicles}
      </div>
    ),
  },
  
  {
    id: 'paymentSummary',
    cell: ({ row }) => (
      <PaymentSummaryTable customer={row.original}>
        <span className="text-gray-500 hover:underline cursor-pointer">
          Ver Resumen
        </span>
      </PaymentSummaryTable>
    ),
  },
  
  {
    id: 'actions',
    cell: ({ row }) => {
      const customer = row.original;
      const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
      const [openPrintDialog, setOpenPrintDialog] = useState(false);
      const [openCancelDialog, setOpenCancelDialog] = useState(false);
      const [openDropdown, setOpenDropdown] = useState(false);
      const session = useSession();
      const [selectedPaymentType, setSelectedPaymentType] = useState<"TRANSFER" | "CASH" | null>(null);
      
      const handlePrint = () => {
        setOpenPaymentDialog(true); // Primero abre el diálogo de selección de tipo de pago
      };
      
      const handleConfirmPayment = async (paymentType: "TRANSFER" | "CASH") => {
        setSelectedPaymentType(paymentType);
        setOpenPaymentDialog(false);
        setOpenPrintDialog(true); // Luego abre el diálogo de confirmación de impresión
      };
      
      const handleConfirmPrint = async () => {
        if (!selectedPaymentType) return;
      
        try {
          const updatedCustomer = await getCustomerById(customer.id, session.data?.token);
      
          if (!updatedCustomer) {
            toast.error("No se pudieron obtener los datos actualizados del cliente.");
            return;
          }
      
          await generateReceipt(updatedCustomer, "Expensas correspondientes", { paymentType: selectedPaymentType });
      
          toast.success("Recibo generado y enviado a la impresora.");
        } catch (error) {
          console.error("Error al imprimir el recibo:", error);
          toast.error("Error al enviar el recibo a la impresora.");
        } finally {
          setOpenPrintDialog(false);
          setSelectedPaymentType(null); // Limpiar el estado después de imprimir
        }
      };

            
      const handleConfirm = async () => {
        if (!selectedPaymentType) return;
      
        try {
          const updatedCustomer = await getCustomerById(customer.id, session.data?.token);
      
          if (!updatedCustomer) {
            toast.error("No se pudieron obtener los datos actualizados del cliente.");
            return;
          }
      
          await historialReceipts(customer.id, {paymentType: selectedPaymentType});
      
          toast.success("Pago registrado exitosamente.");
        } catch (error) {
          console.error("Error al registrar el pago:", error);
          toast.error("Error al registrar el pago.");
        } finally {
          setOpenPrintDialog(false);
          setSelectedPaymentType(null); // Limpiar el estado después de imprimir
        }
      };

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
              <ViewCustomerDialog customer={customer} />
              {session.data?.user.role === 'ADMIN' && (
                <>
                  <DropdownMenuSeparator />
                  <UpdateOwnerDialog customer={customer} />
                  <DeleteOwnerDialog customer={customer} />
                </>
              )}            
              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={handlePrint}>
                Imprimir Recibo
              </DropdownMenuItem>

              <Dialog open={openPrintDialog} onOpenChange={setOpenPrintDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Está seguro?</DialogTitle>
                  <DialogDescription>Se generará e imprimirá un recibo para este propietario.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenPrintDialog(false)}>Cancelar</Button>
                  <Button onClick={handleConfirmPrint}>Imprimir y Registrar Pago</Button>
                  <Button onClick={handleConfirm}>Registrar Pago</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>


              <Dialog open={openCancelDialog} onOpenChange={setOpenCancelDialog}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Cancelar Recibo</DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>¿Está seguro?</DialogTitle>
                    <DialogDescription>Se eliminará el último recibo del propietario y el anterior se marcará como "pendiente".</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenCancelDialog(false)}>Cancelar</Button>
                    <Button
                      onClick={() => {
                        cancelReceipt(customer.id);
                        setOpenCancelDialog(false);
                        setOpenDropdown(false);
                        toast.success('Recibo cancelado exitosamente');
                      }}
                    >
                      Confirmar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dialog para seleccionar tipo de pago antes de imprimir */}
          <PaymentTypeReceiptDialog
            open={openPaymentDialog}
            onConfirm={handleConfirmPayment}
            onClose={() => setOpenPaymentDialog(false)}
          />
        </>
      );
    },
  },
];
