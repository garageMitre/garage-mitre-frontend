'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Receipt } from '@/types/receipt.type';
import { ReceiptPayment, PaymentHistoryOnAccount } from '@/types/receipt.type';
import { useState } from 'react';

interface ReceiptMovementsDrawerProps {
  receipt: Receipt & {
    payments?: ReceiptPayment[];
    paymentHistoryOnAccount?: PaymentHistoryOnAccount[];
  };
}

export function ReceiptMovementsDrawer({ receipt }: ReceiptMovementsDrawerProps) {
  const [open, setOpen] = useState(false);

const hasMovements =
  (receipt.payments?.length || 0) > 0 ||
  (receipt.paymentHistoryOnAccount?.length || 0) > 0 ||
  (!receipt.payments?.length &&
    !receipt.paymentHistoryOnAccount?.length &&
    receipt.status === 'PAID');

  if (!hasMovements) return null;
const hasOnlyReceiptPayment =
  receipt.status === 'PAID' &&
  (!receipt.payments?.length || receipt.payments.length === 0) &&
  (!receipt.paymentHistoryOnAccount?.length || receipt.paymentHistoryOnAccount.length === 0);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <span className="text-gray-500 hover:underline cursor-pointer">
          Ver movimientos
        </span>
      </DrawerTrigger>

      <DrawerContent className="p-6 sm:max-w-2xl mx-auto rounded-t-xl">
        <DrawerHeader className="mb-4">
          <DrawerTitle className="text-xl">Movimientos del Recibo</DrawerTitle>
          <p className="text-sm">Total inicial: ${receipt.startAmount}</p>
          {receipt.status === 'PENDING' && receipt.price > 0 && (
          <p className="text-sm font-medium text-red-600">
            Total Restante: ${receipt.price}
          </p>
        )}

        </DrawerHeader>

        <div className="space-y-6">
          {receipt.payments?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Pagos</h3>
              <ul className="space-y-2 text-sm">
                {receipt.payments.map((p, idx) => (
                  <li key={`payment-${idx}`} className="p-3 border rounded-md">
                    <div><strong>Tipo:</strong> {translatePaymentType(p.paymentType)}</div>
                    <div><strong>Monto:</strong> ${p.price}</div>
                    <div><strong>Fecha:</strong> {p.paymentDate && new Date(
                          new Date(p.paymentDate).getTime() +
                          new Date().getTimezoneOffset() * 60000
                        ).toLocaleDateString()}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        {hasOnlyReceiptPayment && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Pagos</h3>
            <ul className="space-y-2 text-sm">
              <li className="p-3 border rounded-md">
                <div><strong>Tipo:</strong> {translatePaymentType(receipt.paymentType)}</div>
                <div><strong>Monto:</strong> ${receipt.price}</div>
                <div><strong>Fecha:</strong> {receipt.paymentDate && new Date(
                          new Date(receipt.paymentDate).getTime() +
                          new Date().getTimezoneOffset() * 60000
                        ).toLocaleDateString()}</div>
              </li>
            </ul>
          </div>
        )}


          {receipt.paymentHistoryOnAccount?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Pagos a Cuenta</h3>
              <ul className="space-y-2 text-sm">
                {receipt.paymentHistoryOnAccount.map((p, idx) => (
                  <li key={`history-${idx}`} className="p-3 border rounded-md">
                    <div><strong>Tipo:</strong> {translatePaymentType(p.paymentType)}</div>
                    <div><strong>Monto:</strong> ${p.price}</div>
                    <div><strong>Fecha:</strong> {p.paymentDate && new Date(
                          new Date(p.paymentDate).getTime() +
                          new Date().getTimezoneOffset() * 60000
                        ).toLocaleDateString()}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function translatePaymentType(type: string) {
  return type === 'TRANSFER'
    ? 'Transferencia'
    : type === 'CASH'
    ? 'Efectivo'
    : type === 'CHECK'
    ? 'Cheque'
        : type === 'CREDIT'
    ? 'Credito'
    : 'Transferencia';
}
