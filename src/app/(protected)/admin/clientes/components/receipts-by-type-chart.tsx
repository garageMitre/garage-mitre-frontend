'use client';

import { Receipt } from '@/types/receipt.type';
import { ReceiptsMonthFilter } from './receipts-month-filter';
import { ReceiptsDetailDialog } from './receipts-detail-dialog';
import { CUSTOMER_TYPE_LABEL, CUSTOMER_TYPE_ORDER } from './customer-types';

// Amarillo y naranja de la marca, los mismos del gráfico original del dashboard.
const PAID_COLOR = 'hsl(46 92% 53%)';
const PENDING_COLOR = 'hsl(14 80% 51%)';

// Número + punto + línea, fijos arriba (pagados) o abajo (pendientes) para que los tres
// círculos queden alineados entre sí aunque las proporciones sean distintas.
function PieLabel({ value, color, position }: { value: number; color: string; position: 'top' | 'bottom' }) {
  const parts = [
    <span key="n" className="text-sm font-bold tabular-nums text-foreground">{value}</span>,
    <span key="d" className="size-[7px] rounded-full" style={{ background: color }} />,
    <span key="l" className="h-2 w-[1.5px]" style={{ background: color }} />,
  ];
  return <div className="flex flex-col items-center gap-1">{position === 'top' ? parts : parts.reverse()}</div>;
}

function TypePie({ paid, pending }: { paid: number; pending: number }) {
  const total = paid + pending;
  const pendingPct = total === 0 ? 0 : (pending / total) * 100;
  return (
    <div className="flex flex-col items-center">
      {paid > 0 ? <PieLabel value={paid} color={PAID_COLOR} position="top" /> : <div className="h-[39px]" />}
      <div
        role="img"
        aria-label={`${paid} pagados y ${pending} pendientes`}
        title={`Pagados: ${paid} · Pendientes: ${pending}`}
        className="size-[88px] rounded-full"
        // Arranca a las 3 en punto y avanza en sentido horario, como el gráfico original.
        style={{ background: `conic-gradient(from 90deg, ${PENDING_COLOR} 0 ${pendingPct}%, ${PAID_COLOR} ${pendingPct}% 100%)` }}
      />
      {pending > 0 ? <PieLabel value={pending} color={PENDING_COLOR} position="bottom" /> : <div className="h-[39px]" />}
    </div>
  );
}

export function ReceiptsByTypeChart({
  month,
  monthLabel,
  receipts,
}: {
  month: string;
  monthLabel: string;
  receipts: Receipt[];
}) {
  const paid = receipts.filter((r) => r.status === 'PAID').length;
  const pending = receipts.length - paid;
  const pct = receipts.length === 0 ? 0 : Math.round((paid / receipts.length) * 100);

  // Un círculo por tipo de cliente para ver de un vistazo dónde está la cobranza pendiente.
  const byType = CUSTOMER_TYPE_ORDER.map((type) => {
    const rows = receipts.filter((r) => r.customer?.customerType === type);
    const paidCount = rows.filter((r) => r.status === 'PAID').length;
    return { type, paidCount, pendingCount: rows.length - paidCount, total: rows.length };
  }).filter((t) => t.total > 0);

  return (
    <section className="flex min-h-[420px] flex-col rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recibos pagados vs pendientes</h2>
            <span className="rounded-full border border-yellow-400/30 bg-yellow-400/15 px-2 py-0.5 font-mono text-[10px] text-yellow-400">
              Por tipo de cliente
            </span>
          </div>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-yellow-400">
            {pct}% <span className="text-xs font-normal text-muted-foreground">recibos pagados</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReceiptsDetailDialog receipts={receipts} monthLabel={monthLabel} />
          <ReceiptsMonthFilter month={month} />
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-around gap-6 py-6">
        {byType.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin recibos para el período seleccionado.</p>
        ) : (
          byType.map((t) => (
            <div key={t.type} className="flex min-w-[140px] flex-1 flex-col items-center gap-1.5">
              <TypePie paid={t.paidCount} pending={t.pendingCount} />
              <span className="mt-3 text-[13px] font-medium text-foreground">{CUSTOMER_TYPE_LABEL[t.type]}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {t.paidCount}/{t.total} pagados
              </span>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 font-mono text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block size-2 rounded-full" style={{ background: PAID_COLOR }} /> Pagado
          <span className="ml-2 inline-block size-2 rounded-full" style={{ background: PENDING_COLOR }} /> Pendiente
        </span>
        <span className="font-medium text-yellow-400">
          Pagados {paid} · Pendientes {pending}
        </span>
      </div>
    </section>
  );
}
