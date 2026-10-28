'use client';

import React, { useState, useRef, useEffect, startTransition } from 'react';
import { startScanner } from '@/services/scanner.service';
import { toast } from 'sonner';
import { getCustomerById } from '@/services/customers.service';
import { historialReceiptsAction } from '@/actions/receipts/create-receipt.action';
import { useSession } from 'next-auth/react';
import { OpenScannerDialog } from './open-scanner-dialog';
import { Customer } from '@/types/cutomer.type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReceiptSchemaType } from '@/schemas/receipt.schema';
import { Receipt } from '@/types/receipt.type';
import { Keyboard, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ScannerButton({
  isDialogOpen,
  scannerRef,
  scannerStyle,
  manualRef,
  manualStyle,
  onScanningChange,
  onTicketRegistered,
  onTicketExited,
  extraActions,
}: {
  isDialogOpen: boolean;
  scannerRef?: (el: HTMLElement | null) => void;
  scannerStyle?: React.CSSProperties;
  manualRef?: (el: HTMLElement | null) => void;
  manualStyle?: React.CSSProperties;
  onScanningChange?: (isScanning: boolean) => void;
  onTicketRegistered?: () => void;
  /** Se dispara además de onTicketRegistered cuando el escaneo cerró una salida (no una entrada). */
  onTicketExited?: (registration: { id: string; price: number }) => void;
  /** Extra buttons rendered alongside the manual-entry toggle in the action bar. */
  extraActions?: React.ReactNode;
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const session = useSession();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [barCode, setBarCode] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer>();
  const [receipt, setReceipt] = useState<Receipt>();
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [manualBarCode, setManualBarCode] = useState('');

  useEffect(() => {
    onScanningChange?.(isScanning);
  }, [isScanning, onScanningChange]);

  useEffect(() => {
    const handleKeyDown = () => {
      const dialogIsOpen = isDialogOpen || dialogOpen || manualInputVisible;
      if (!dialogIsOpen && !isScanning) {
        setIsScanning(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    const handleKeyUp = () => setIsScanning(false);

    const dialogIsOpen = isDialogOpen || dialogOpen || manualInputVisible;
    if (!dialogIsOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDialogOpen, dialogOpen, manualInputVisible, isScanning]);

  const handleSubmit = async (code: string) => {
    if (!code) return;
    startTransition(() => {
      startScanner({ barCode: code })
        .then(async (data) => {
          if (!data || 'error' in data) {
            toast.error(data?.error || 'Error desconocido');
          } else {
            if (data.type === 'RECEIPT') {
              toast.success('Recibo detectado', { duration: 5000 });
              setCustomerId(data.id);
              setBarCode(data.barcode);
              setReceipt(data.receipt);
              setReceiptId(data.receiptId || '');
              try {
                const fetchedCustomer = await getCustomerById(data.id || '', session.data?.token);
                if (!fetchedCustomer) {
                  toast.error('No se encontró el cliente.');
                  return;
                }
                setCustomer(fetchedCustomer);
                setDialogOpen(true);
              } catch (err) {
                console.error('Error al obtener cliente:', err);
                toast.error('Error al obtener los datos del cliente.');
              }
            } else {
              // El ícono del toast ya indica el éxito: el texto dice qué pasó (entrada o salida)
              // y con qué ticket, para que el operador lo confirme de un vistazo.
              const registration = data.registration;
              const ars = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
              if (registration?.departureTime) {
                const due = Math.max(0, registration.price - (registration.advancePaidAmount ?? 0));
                toast.success('Salida registrada', {
                  description: `Ticket ${registration.codeBarTicket ?? code} · ${registration.advancePaidAmount ? `a cobrar ${ars(due)} (total ${ars(registration.price)})` : `total ${ars(registration.price)}`}`,
                  duration: 4000,
                });
              } else {
                const vehicle = registration?.ticket?.vehicleType === 'CAMIONETA' ? 'Camioneta' : registration?.ticket?.vehicleType === 'AUTO' ? 'Auto' : null;
                toast.success('Entrada registrada', {
                  description: `Ticket ${registration?.ticket?.codeBar ?? code}${vehicle ? ` · ${vehicle}` : ''}`,
                  duration: 3000,
                });
              }
              onTicketRegistered?.();
              if (data.registration?.departureTime) {
                onTicketExited?.({ id: data.registration.id, price: data.registration.price });
              }
            }
          }
          setIsScanning(false);
        })
        .catch((err) => {
          console.error(err);
          toast.error('Error en la solicitud.');
          setIsScanning(false);
        });
    });
  };

  const handleConfirm = async (data: ReceiptSchemaType) => {
    if (!data?.payments || !customerId) return;
    try {
      const updatedCustomer = await getCustomerById(customerId, session.data?.token);
      if (!updatedCustomer) {
        toast.error('No se pudieron obtener los datos actualizados del cliente.');
        return;
      }
      setCustomer(updatedCustomer);

      const fullData: ReceiptSchemaType = { ...data, barcode: barCode || undefined };
      const result = await historialReceiptsAction(receiptId || '', customerId, fullData);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success('Pago registrado exitosamente.', { duration: 5000 });
      setDialogOpen(false);
    } catch (err) {
      console.error('Error al registrar el pago:', err);
      toast.error('Error al registrar el pago.');
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Estado del lector — refleja el listener real del escáner USB, no es un botón */}
      <div
        ref={scannerRef}
        style={scannerStyle}
        role="status"
        className="flex h-14 items-center gap-3 rounded-xl border border-border bg-card px-5"
      >
        <span
          className={cn(
            'size-3 shrink-0 rounded-full',
            manualInputVisible || isScanning ? 'bg-gm-yellow' : 'bg-[hsl(120_40%_50%)]',
          )}
        />
        <span className="text-base font-medium text-foreground">
          {manualInputVisible
            ? 'Ingreso manual activo'
            : isScanning
              ? 'Escaneando…'
              : 'Listo para escanear'}
        </span>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          ref={manualRef}
          style={manualStyle}
          onClick={() => setManualInputVisible((p) => !p)}
          className={cn(
            'inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl px-6 text-base font-semibold transition-colors',
            manualInputVisible
              ? 'border border-border bg-card text-foreground hover:bg-gm-surface-2'
              : 'bg-gm-yellow text-gm-ink hover:bg-[hsl(var(--gm-yellow-deep))]',
          )}
        >
          {manualInputVisible ? <X className="size-5" /> : <Keyboard className="size-5" />}
          {manualInputVisible ? 'Cancelar ingreso manual' : 'Ingresar código manual'}
        </button>

        {extraActions}
      </div>

      {/* Hidden input that captures scan input */}
      {!manualInputVisible && (
        <input
          ref={inputRef}
          type="text"
          autoFocus
          onBlur={() => setIsScanning(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          className="absolute h-0 w-0 opacity-0 pointer-events-none"
          aria-hidden
        />
      )}

      {/* Ingreso manual */}
      {manualInputVisible && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <Label className="text-base">Código de recibo o ticket</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              autoFocus
              value={manualBarCode}
              onChange={(e) => setManualBarCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(manualBarCode);
                  setManualBarCode('');
                  setManualInputVisible(false);
                }
              }}
              placeholder="Escribí el código y apretá Enter"
              className="h-14 flex-1 text-lg gm-mono"
            />
            <Button
              onClick={() => {
                handleSubmit(manualBarCode);
                setManualBarCode('');
                setManualInputVisible(false);
              }}
              disabled={!manualBarCode}
              className="h-14 rounded-xl px-8 text-base font-semibold"
            >
              Confirmar
            </Button>
          </div>
        </div>
      )}

      <OpenScannerDialog
        open={dialogOpen}
        onConfirm={handleConfirm}
        onClose={() => setDialogOpen(false)}
        customer={customer}
        receipt={receipt}
        customerType={customer?.customerType}
      />
    </div>
  );
}
