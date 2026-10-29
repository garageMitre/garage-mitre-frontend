'use client';

import { useState, useTransition, useEffect, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCustomerById } from '@/services/customers.service';
import {
  BadgeCheck,
  Clock,
  Printer,
  Ban,
  Save,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Customer } from '@/types/cutomer.type';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { generateReceiptsWithoutRegistering } from '@/utils/generate-receipt-without-registering';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cancelReceiptAction } from '@/actions/receipts/cancel-receipt.action';
import { ReceiptSchemaType } from '@/schemas/receipt.schema';
import { historialReceiptsAction } from '@/actions/receipts/create-receipt.action';
import { PaymentTypeReceiptDialog } from './payment-type-receipt-dialog';
import { Receipt } from '@/types/receipt.type';
import { ReceiptMovementsDrawer } from './receipt-movements-drower';
import { DeleteReceiptDialog } from './delete-receipt-dialog';
import { Loader } from '@/components/ui/loader';

dayjs.extend(utc);
dayjs.extend(timezone);

interface PaymentSummaryTableProps {
  customer: Customer;
  children?: ReactNode;
  autoOpen?: boolean;
}

const TZ = 'America/Argentina/Buenos_Aires';

export function PaymentSummaryTable({
  customer,
  children,
  autoOpen,
}: PaymentSummaryTableProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [receipts, setReceipts] = useState(customer.receipts || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  const [selectedPayments, setSelectedPayments] = useState<
    ReceiptSchemaType['payments']
  >([{ paymentType: 'CASH' }]);

  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedReceiptForPayment, setSelectedReceiptForPayment] =
    useState<Receipt | null>(null);

  const pageSize = 10;
  const { data: session } = useSession();
  const [updatedCustomer, setUpdatedCustomer] = useState<Customer | null>(null);

  // ✅ Parse robusto (ISO / Date / string) en TZ AR
  const toTime = (value?: string | Date | null) => {
    if (!value) return NaN;

    if (value instanceof Date) {
      return value.getTime();
    }

    // primero intento parse normal
    let d = dayjs(value);
    if (!d.isValid()) {
      // fallback TZ
      d = dayjs.tz(value, TZ);
    }

    return d.isValid() ? d.valueOf() : NaN;
  };

  // ✅ Orden: más reciente ARRIBA según "Fecha de Inicio" (startDate)
  //    y si empatan, por fecha de pago / creación.
  const sortReceiptsMostRecentFirst = (list: Receipt[]) => {
    return [...list].sort((a, b) => {
      const aStart = toTime(a.startDate ?? null);
      const bStart = toTime(b.startDate ?? null);

      const aStartSafe = isNaN(aStart) ? -Infinity : aStart;
      const bStartSafe = isNaN(bStart) ? -Infinity : bStart;

      // 1) startDate DESC (período)
      if (bStartSafe !== aStartSafe) return bStartSafe - aStartSafe;

      // 2) tie-breaker: paymentDate/dateNow DESC
      const aTie = toTime(a.paymentDate ?? a.dateNow ?? null);
      const bTie = toTime(b.paymentDate ?? b.dateNow ?? null);

      const aTieSafe = isNaN(aTie) ? -Infinity : aTie;
      const bTieSafe = isNaN(bTie) ? -Infinity : bTie;

      return bTieSafe - aTieSafe;
    });
  };

  useEffect(() => {
    if (autoOpen) {
      setOpen(false);
      setTimeout(() => setOpen(true), 100);
    }
  }, [autoOpen]);

  useEffect(() => {
    if (!open) return;

    startTransition(async () => {
      try {
        const updatedOwner = await getCustomerById(customer.id, session?.token);
        if (updatedOwner) {
          setUpdatedCustomer(updatedOwner);

          const sortedReceipts = sortReceiptsMostRecentFirst(
            updatedOwner.receipts || []
          );

          setReceipts(sortedReceipts);
          setCurrentPage(1); // ✅ como es newest-first
        }
      } catch (error) {
        console.error('Error fetching owner receipts:', error);
      }
    });
  }, [open, customer.id, session?.token]);

  const activeCustomer = updatedCustomer || customer;

  const paginatedReceipts = receipts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function getMonthName(dateString?: string | null): string {
    if (!dateString) return 'Sin fecha';
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const date = dayjs.tz(dateString, TZ);
    if (!date.isValid()) return 'Fecha inválida';
    return meses[date.month()];
  }

  const handlePrint = async (receiptOwner: Receipt) => {
    try {
      await generateReceiptsWithoutRegistering(activeCustomer, receiptOwner);
    } catch (err) {
      console.error('Error al generar el recibo para imprimir:', err);
    }
  };

  const refreshReceipts = async () => {
    try {
      const updatedOwner = await getCustomerById(customer.id, session?.token);
      if (updatedOwner) {
        setUpdatedCustomer(updatedOwner);

        const sortedReceipts = sortReceiptsMostRecentFirst(
          updatedOwner.receipts || []
        );

        setReceipts(sortedReceipts);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error actualizando recibos:', error);
    }
  };

  const handleRegister = (receipt: Receipt) => {
    setSelectedReceiptForPayment(receipt);
    setOpenPaymentDialog(true);
  };

  const handleConfirmPayment = async (data: ReceiptSchemaType) => {
    try {
      const result = await historialReceiptsAction(
        selectedReceiptForPayment?.id || '',
        customer.id,
        data
      );

      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success('Pago registrado exitosamente.');
        await refreshReceipts();
      }
    } catch (error) {
      console.error('Error al registrar el pago:', error);
      toast.error('Error al registrar el pago.');
    } finally {
      setOpenPaymentDialog(false);
      setSelectedReceiptForPayment(null);
    }
  };

  function translatePaymentType(type: string) {
    switch (type) {
      case 'TRANSFER':
        return 'Transferencia';
      case 'CASH':
        return 'Efectivo';
      case 'CHECK':
        return 'Cheque';
      case 'CREDIT':
        return 'Crédito';
      case 'FIX':
        return 'Corrección';
      default:
        // MIX/TP: los estampa el backend cuando el pago de un inquilino de terceros compensa este recibo.
        return 'Automático';
    }
  }

  const paymentTypesOf = (receipt: Receipt): string[] =>
    receipt.payments?.length
      ? receipt.payments.map((p) => translatePaymentType(p.paymentType))
      : receipt.paymentHistoryOnAccount?.length
      ? receipt.paymentHistoryOnAccount.map((p) => translatePaymentType(p.paymentType))
      : receipt.paymentType
      ? [translatePaymentType(receipt.paymentType)]
      : [];

  const ars = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

  // Mientras está pendiente "price" es el saldo que falta; pagado (price 0) se muestra el monto original.
  const amountOf = (receipt: Receipt) =>
    receipt.price && receipt.price > 0 ? receipt.price : receipt.startAmount;

  // paymentDate es una fecha sin hora (YYYY-MM-DD): se formatea tal cual, sin corrimiento de zona.
  const formatPaymentDate = (value?: string | null) => {
    if (!value) return '—';
    const date = dayjs(value);
    return date.isValid() ? date.format('DD/MM/YYYY') : '—';
  };

  const periodOf = (receipt: Receipt) => {
    const month = getMonthName(receipt.startDate);
    const date = receipt.startDate ? dayjs.tz(receipt.startDate, TZ) : null;
    return date?.isValid() ? `${month} ${date.year()}` : month;
  };

  const totalPages = Math.max(1, Math.ceil(receipts.length / pageSize));
  const pendingReceipts = receipts.filter((r) => r.status !== 'PAID');
  const pendingTotal = pendingReceipts.reduce((sum, r) => sum + (r.price ?? 0), 0);

  const confirmCancel = async () => {
    if (!selectedReceiptId) return;
    const result = await cancelReceiptAction(selectedReceiptId, customer.id);
    if (result.error) toast.error(result.error.message);
    else {
      toast.success('Recibo cancelado exitosamente');
      await refreshReceipts();
    }
    setOpenCancelDialog(false);
    setSelectedReceiptId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {/* Botón real (antes un span): se puede abrir con el teclado y se lee como acción. */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {children || 'Ver resumen'}
          </button>
        </DialogTrigger>

        <DialogContent className="max-h-[85vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              Resumen de recibos de {customer.firstName} {customer.lastName}
            </DialogTitle>
            <DialogDescription>
              {receipts.length} {receipts.length === 1 ? 'recibo' : 'recibos'} ·{' '}
              {pendingReceipts.length === 0
                ? 'sin deuda pendiente'
                : `${pendingReceipts.length} ${pendingReceipts.length === 1 ? 'pendiente' : 'pendientes'} por ${ars(pendingTotal)}`}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                  <TableHead className="w-[130px]">Estado</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Fecha de pago</TableHead>
                  <TableHead>Medio de pago</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Movimientos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedReceipts.length > 0 ? (
                  paginatedReceipts.map((receiptOwner) => {
                    const isPaid = receiptOwner.status === 'PAID';
                    const methods = paymentTypesOf(receiptOwner);
                    return (
                      <TableRow key={receiptOwner.id} className="transition-colors hover:bg-secondary/30">
                        <TableCell>
                          <span
                            className={
                              isPaid
                                ? 'inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400'
                                : 'inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400'
                            }
                          >
                            {isPaid ? <BadgeCheck className="size-3.5" /> : <Clock className="size-3.5" />}
                            {isPaid ? 'Pagado' : 'Pendiente'}
                          </span>
                        </TableCell>

                        <TableCell className="whitespace-nowrap">{periodOf(receiptOwner)}</TableCell>

                        <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                          {formatPaymentDate(receiptOwner.paymentDate)}
                        </TableCell>

                        <TableCell>
                          {methods.length ? (
                            <div className="flex flex-col gap-0.5 text-sm">
                              {methods.map((method, i) => (
                                <span key={i}>{method}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right font-medium tabular-nums whitespace-nowrap">
                          {ars(amountOf(receiptOwner))}
                          {!isPaid && receiptOwner.startAmount > (receiptOwner.price ?? 0) && (
                            <span className="block text-xs font-normal text-muted-foreground">
                              de {ars(receiptOwner.startAmount)}
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <ReceiptMovementsDrawer receipt={receiptOwner} />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="Imprimir recibo"
                              aria-label="Imprimir recibo"
                              onClick={() => handlePrint(receiptOwner)}
                            >
                              <Printer className="size-4" />
                            </Button>
                            {/* Registrar solo tiene sentido con saldo; cancelar, sobre un recibo ya pagado. */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title={isPaid ? 'El recibo ya está pagado' : 'Registrar pago'}
                              aria-label="Registrar pago"
                              disabled={isPaid}
                              onClick={() => handleRegister(receiptOwner)}
                            >
                              <Save className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-red-500 hover:text-red-400"
                              title={isPaid ? 'Cancelar pago' : 'Solo se cancela un recibo pagado'}
                              aria-label="Cancelar pago"
                              disabled={!isPaid}
                              onClick={() => {
                                setSelectedReceiptId(receiptOwner.id);
                                setOpenCancelDialog(true);
                              }}
                            >
                              <Ban className="size-4" />
                            </Button>
                            <DropdownMenu
                              open={openDropdownId === receiptOwner.id}
                              onOpenChange={(open) =>
                                setOpenDropdownId(open ? receiptOwner.id : null)
                              }
                            >
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8" aria-label="Más acciones">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Acciones
                                </DropdownMenuLabel>
                                <DeleteReceiptDialog receipt={receiptOwner} />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                      {isPending ? <Loader size="sm" label="Cargando recibos…" className="py-4" /> : 'No hay recibos registrados.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Antes se paginaba de a 10 sin botones: los recibos más viejos no se podían ver. */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 text-sm">
              <span className="text-muted-foreground tabular-nums">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Página anterior"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Página siguiente"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Una sola confirmación para toda la tabla (antes cada fila tenía la suya con el mismo
          estado y se abrían todas juntas). */}
      <Dialog
        open={openCancelDialog}
        onOpenChange={(value) => {
          setOpenCancelDialog(value);
          if (!value) setSelectedReceiptId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Cancelar el pago de este recibo?</DialogTitle>
            <DialogDescription>
              El recibo vuelve a quedar pendiente y se quita de la planilla de caja. Si se pagó con
              crédito, el monto se reintegra.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpenCancelDialog(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Cancelar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentTypeReceiptDialog
        open={openPaymentDialog}
        onConfirm={handleConfirmPayment}
        onClose={() => setOpenPaymentDialog(false)}
        receipt={selectedReceiptForPayment ?? undefined}
        customer={customer}
        customerType={customer.customerType}
      />
    </>
  );
}
