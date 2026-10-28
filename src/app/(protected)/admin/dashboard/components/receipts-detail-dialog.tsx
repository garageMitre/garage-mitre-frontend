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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt } from '@/types/receipt.type';
import { CustomerType } from '@/types/cutomer.type';
import { PAYMENT_TYPE_LABEL } from './payment-types-bullet-chart';
import { ReceiptMovementsDrawer } from '@/app/(protected)/(user)/components/receipts/receipt-movements-drower';

const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  OWNER: 'Propietarios',
  RENTER: 'Inquilinos',
  PRIVATE: 'Terceros',
};
const CUSTOMER_TYPE_ORDER: CustomerType[] = ['OWNER', 'RENTER', 'PRIVATE'];
const CUSTOMER_TYPE_ROUTE: Record<CustomerType, string> = {
  OWNER: 'owners',
  RENTER: 'renters',
  PRIVATE: 'privates',
};

// El tipo "TP" (tarjeta) existe en el enum del backend pero ningún flujo de cobro lo ofrece hoy
// — no tiene sentido como filtro porque nunca va a haber un recibo con ese medio.
const FILTERABLE_PAYMENT_TYPES = Object.entries(PAYMENT_TYPE_LABEL).filter(([value]) => value !== 'TP');

const ars = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

// Un recibo puede tener varios pagos parciales con distinto medio (igual que en la planilla de
// caja) — si todos coinciden se muestra ese medio, si no, "Mixto".
function resolvePaymentType(receipt: Receipt): string | null {
  const types = new Set((receipt.payments ?? []).map((p) => p.paymentType).filter(Boolean));
  if (types.size === 0) return null;
  if (types.size > 1) return 'MIX';
  return [...types][0] as string;
}

// "MIX"/"TP" también existen como valor YA GUARDADO en un único pago (no combinado): el backend
// los estampa automáticamente en el recibo del propietario cuando un inquilino de terceros paga
// y ese pago compensa el recibo del propietario — ahí no hay "medios de pago" reales que mostrar.
// Solo cuando hay 2+ pagos con medios distintos es un "Mixto" genuino (varias formas de pago
// elegidas en el mostrador).
const AUTO_COMPENSATION_TYPES = new Set(['MIX', 'TP']);

function describePaymentLabel(receipt: Receipt): string {
  const types = (receipt.payments ?? []).map((p) => p.paymentType).filter(Boolean);
  const distinct = new Set(types);
  if (distinct.size > 1) return `Pagó con ${PAYMENT_TYPE_LABEL.MIX}`;
  const only = distinct.size === 1 ? ([...distinct][0] as string) : null;
  if (only && AUTO_COMPENSATION_TYPES.has(only)) return 'Cobro automático (pago de un tercero)';
  if (only) return `Pagó con ${PAYMENT_TYPE_LABEL[only] ?? only}`;
  return 'Ver movimientos';
}

// Mientras el recibo está pendiente, "price" es el saldo restante (y llega a 0 cuando se termina
// de pagar) — el monto real del recibo es "startAmount", que no cambia con los pagos.
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
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 rounded-md border-border bg-transparent px-2.5 text-[11px] font-mono text-muted-foreground hover:text-foreground"
        >
          <ListFilter className="size-3.5" />
          Ver detalle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-gm-yellow/40 bg-gm-yellow/15 text-gm-yellow">
              <ListFilter className="size-4" />
            </span>
            <div>
              <DialogTitle className="capitalize">Recibos de {monthLabel}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {paidCount} pagados · {pendingCount} pendientes
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'PAID' | 'PENDING')}>
            <SelectTrigger className="h-8 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="PAID">Pagado</SelectItem>
              <SelectItem value="PENDING">Pendiente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="h-8 text-[12px]">
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
          <div className="rounded-md border border-dashed border-border bg-gm-surface-2/40 p-6 text-center text-[12px] text-muted-foreground">
            No hay recibos que coincidan con el filtro.
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <div key={g.type}>
                <div className="mb-1.5 flex items-center gap-2">
                  <h4 className="gm-display text-[12px] font-bold uppercase tracking-[0.05em] text-foreground">
                    {CUSTOMER_TYPE_LABEL[g.type]}
                  </h4>
                  <span className="gm-mono text-[10.5px] text-muted-foreground">{g.rows.length}</span>
                </div>
                <div className="space-y-1.5">
                  {g.rows.map((r) => {
                    const customerType = r.customer?.customerType;
                    return (
                      <div
                        key={r.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto_86px_28px] items-center gap-3 rounded-[8px] border border-border bg-gm-surface-2 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-medium text-foreground">
                            {r.customer?.lastName} {r.customer?.firstName}
                          </p>
                          {r.status === 'PAID' && (
                            <ReceiptMovementsDrawer
                              receipt={r}
                              triggerClassName="text-[11px] text-muted-foreground hover:text-gm-yellow hover:underline cursor-pointer transition-colors"
                              triggerLabel={describePaymentLabel(r)}
                            />
                          )}
                        </div>
                        <span className="gm-mono whitespace-nowrap text-right text-[12.5px] font-semibold text-foreground">
                          {ars(resolveAmount(r))}
                        </span>
                        <div className="flex justify-end">
                          <Badge variant={r.status === 'PAID' ? 'yellow' : 'outline'}>
                            {r.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="flex justify-end">
                          {r.customer && customerType && (
                            <Link
                              href={`/${CUSTOMER_TYPE_ROUTE[customerType]}?customerId=${r.customer.id}`}
                              title="Ver cliente"
                              className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:bg-gm-surface-3 hover:text-gm-yellow"
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
