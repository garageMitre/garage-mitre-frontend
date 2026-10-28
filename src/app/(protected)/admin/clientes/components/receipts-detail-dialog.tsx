'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ListFilter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt } from '@/types/receipt.type';
import { CustomerType } from '@/types/cutomer.type';
import { ReceiptMovementsDrawer } from '@/app/(protected)/(user)/components/receipts/receipt-movements-drower';
import { CUSTOMER_TYPE_LABEL, CUSTOMER_TYPE_ORDER, CUSTOMER_TYPE_ROUTE, PAYMENT_TYPE_LABEL } from './customer-types';

// "TP" existe en el enum del backend pero ningún cobro manual lo ofrece: no sirve como filtro.
const FILTERABLE_PAYMENT_TYPES = Object.entries(PAYMENT_TYPE_LABEL).filter(([value]) => value !== 'TP');

const ars = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

// Un recibo puede tener varios pagos parciales con distinto medio: si coinciden se muestra ese
// medio, si no, "Mixto".
function resolvePaymentType(receipt: Receipt): string | null {
  const types = new Set((receipt.payments ?? []).map((p) => p.paymentType).filter(Boolean));
  if (types.size === 0) return null;
  if (types.size > 1) return 'MIX';
  return [...types][0] as string;
}

// MIX/TP guardados en un único pago los pone el backend solo cuando un inquilino de terceros
// paga y compensa el recibo del propietario: no son medios elegidos en el mostrador.
const AUTO_COMPENSATION_TYPES = new Set(['MIX', 'TP']);

function describePayment(receipt: Receipt): string | null {
  const distinct = new Set((receipt.payments ?? []).map((p) => p.paymentType).filter(Boolean));
  if (distinct.size > 1) return `Pagó con ${PAYMENT_TYPE_LABEL.MIX}`;
  const only = distinct.size === 1 ? ([...distinct][0] as string) : null;
  if (only && AUTO_COMPENSATION_TYPES.has(only)) return 'Cobro automático (pago de un tercero)';
  if (only) return `Pagó con ${PAYMENT_TYPE_LABEL[only] ?? only}`;
  return null;
}

// Mientras está pendiente, "price" es el saldo que falta; el monto del recibo es "startAmount".
function resolveAmount(receipt: Receipt): number {
  return receipt.status === 'PAID' ? receipt.startAmount : receipt.price;
}

export function ReceiptsDetailDialog({ receipts, monthLabel }: { receipts: Receipt[]; monthLabel: string }) {
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PAID' | 'PENDING'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const paidCount = receipts.filter((r) => r.status === 'PAID').length;
  const pendingCount = receipts.length - paidCount;

  const grouped = useMemo(() => {
    const filtered = receipts.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && resolvePaymentType(r) !== paymentFilter) return false;
      return true;
    });
    const byType = new Map<CustomerType, Receipt[]>();
    for (const r of filtered) {
      const t = r.customer?.customerType;
      if (!t) continue;
      if (!byType.has(t)) byType.set(t, []);
      byType.get(t)!.push(r);
    }
    for (const list of byType.values()) {
      list.sort((a, b) =>
        (a.customer?.lastName ?? '').localeCompare(b.customer?.lastName ?? '', 'es', { sensitivity: 'base' }),
      );
    }
    return CUSTOMER_TYPE_ORDER.filter((t) => byType.has(t)).map((t) => ({ type: t, rows: byType.get(t)! }));
  }, [receipts, statusFilter, paymentFilter]);

  const totalShown = grouped.reduce((sum, g) => sum + g.rows.length, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 font-mono text-[11px] text-muted-foreground hover:text-foreground">
          <ListFilter className="size-3.5" />
          Ver detalle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recibos de {monthLabel}</DialogTitle>
          <DialogDescription>
            {paidCount} pagados · {pendingCount} pendientes
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'PAID' | 'PENDING')}>
            <SelectTrigger aria-label="Estado" className="h-8 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="PAID">Pagado</SelectItem>
              <SelectItem value="PENDING">Pendiente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger aria-label="Medio de pago" className="h-8 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los medios de pago</SelectItem>
              {FILTERABLE_PAYMENT_TYPES.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {totalShown === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-[12px] text-muted-foreground">
            No hay recibos que coincidan con el filtro.
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <div key={g.type}>
                <div className="mb-1.5 flex items-center gap-2">
                  <h4 className="text-[12px] font-bold uppercase tracking-wide text-foreground">{CUSTOMER_TYPE_LABEL[g.type]}</h4>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{g.rows.length}</span>
                </div>
                <div className="space-y-1.5">
                  {g.rows.map((r) => {
                    const customerType = r.customer?.customerType;
                    const paymentText = r.status === 'PAID' ? describePayment(r) : null;
                    return (
                      <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto_86px_28px] items-center gap-3 rounded-lg border bg-secondary/40 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-medium text-foreground">
                            {r.customer?.lastName} {r.customer?.firstName}
                          </p>
                          {r.status === 'PAID' && (
                            <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                              {paymentText && <span>{paymentText}</span>}
                              <ReceiptMovementsDrawer receipt={r} />
                            </div>
                          )}
                        </div>
                        <span className="whitespace-nowrap text-right font-mono text-[12.5px] font-semibold text-foreground">
                          {ars(resolveAmount(r))}
                        </span>
                        <div className="flex justify-end">
                          <span
                            className={
                              r.status === 'PAID'
                                ? 'rounded-full border border-yellow-400/40 bg-yellow-400/15 px-2 py-0.5 text-[10.5px] font-bold uppercase text-yellow-400'
                                : 'rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase text-foreground'
                            }
                          >
                            {r.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="flex justify-end">
                          {customerType && (
                            <Link
                              href={`/${CUSTOMER_TYPE_ROUTE[customerType]}`}
                              title={`Ir a ${CUSTOMER_TYPE_LABEL[customerType]}`}
                              className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-yellow-400"
                            >
                              <ExternalLink className="size-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
