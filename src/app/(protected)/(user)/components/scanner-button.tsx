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
import { Hash, Keyboard, Loader2, QrCode, ScanLine, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ScannerButton({
  isDialogOpen,
  scannerRef,
  scannerStyle,
  manualRef,
  manualStyle,
}: {
  isDialogOpen: boolean;
  scannerRef?: (el: HTMLElement | null) => void;
  scannerStyle?: React.CSSProperties;
  manualRef?: (el: HTMLElement | null) => void;
  manualStyle?: React.CSSProperties;
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
              toast.success('🧾 Recibo detectado', { duration: 5000 });
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
              toast.success('🎫 Ticket detectado', { duration: 3000 });
              setTimeout(() => window.location.reload(), 1000);
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
    <div className="flex flex-col items-center gap-5">
      {/* Scanner area — dashed card (tour ref) */}
      <div ref={scannerRef} style={scannerStyle} className="w-full">
        <div
          className={cn(
            'relative w-full flex flex-col items-center gap-2.5 py-7 px-6 rounded-[20px] border border-dashed transition-all duration-300',
            isScanning
              ? 'border-gm-orange/50 bg-gm-orange/10 text-[#FF8458]'
              : 'border-gm-yellow/35 bg-[hsl(32_22%_9%/0.35)] text-gm-yellow/90',
          )}
        >
          {isScanning ? (
            <Loader2 className="size-[26px] animate-spin" />
          ) : (
            <QrCode className="size-[26px]" strokeWidth={1.6} />
          )}
          <span className="text-[13.5px] font-semibold">
            {isScanning ? 'Escaneando…' : 'Escanear código de barras'}
          </span>
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
      </div>

      {/* Manual entry toggle + form */}
      <div className="flex flex-col items-center gap-3 w-full">
      <button
        ref={manualRef}
        style={manualStyle}
        onClick={() => setManualInputVisible((p) => !p)}
        className={cn(
          'group relative inline-flex items-center gap-3 rounded-2xl border px-6 py-3.5 text-sm font-semibold backdrop-blur-xl transition-all duration-300',
          manualInputVisible
            ? 'border-border/50 bg-card/30 text-foreground hover:border-border/70'
            : 'border-border/50 bg-card/30 text-foreground hover:border-gm-orange/40 hover:bg-gm-orange/10 hover:shadow-[0_0_30px_-8px_hsl(var(--gm-orange)/0.3)]',
        )}
      >
        {manualInputVisible ? (
          <>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-white/5 transition-colors">
              <X className="size-4" />
            </span>
            Cancelar ingreso manual
          </>
        ) : (
          <>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gm-orange/30 bg-gm-orange/15 text-[#FF8458] transition-colors group-hover:bg-gm-orange/25">
              <Keyboard className="size-4" />
            </span>
            Ingresar código manualmente
          </>
        )}
      </button>

      {/* Manual entry form */}
      {manualInputVisible && (
        <div className="w-full max-w-md space-y-2">
          <Label>Código de recibo o ticket</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
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
                placeholder="Pegá o tipeá el código…"
                className="pl-9 gm-mono tracking-[0.04em]"
              />
            </div>
            <Button
              onClick={() => {
                handleSubmit(manualBarCode);
                setManualBarCode('');
                setManualInputVisible(false);
              }}
              disabled={!manualBarCode}
            >
              <ScanLine className="size-4" />
              Confirmar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Apretá <kbd className="gm-kbd">Enter</kbd> para procesar.
          </p>
        </div>
      )}

      </div>

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
