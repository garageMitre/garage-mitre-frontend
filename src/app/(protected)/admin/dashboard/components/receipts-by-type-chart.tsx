'use client';

import { useEffect, useState } from 'react';
import { Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { ReceiptsSummaryResponse } from '@/types/dashboard.type';
import { Receipt } from '@/types/receipt.type';
import { CustomerType } from '@/types/cutomer.type';
import { MONO_BADGE, MONO_CARD, MONO_FOOTER, MONO_LABEL, MONO_STAGE, MONO_STAT } from './mono-style';
import { ReceiptsMonthFilter } from './receipts-month-filter';
import { ReceiptsDetailDialog } from './receipts-detail-dialog';
import { cn } from '@/lib/utils';

const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  OWNER: 'Propietarios',
  RENTER: 'Inquilinos',
  PRIVATE: 'Terceros',
};
const CUSTOMER_TYPE_ORDER: CustomerType[] = ['OWNER', 'RENTER', 'PRIVATE'];

// --chart-1/2 en este proyecto son tripletes HSL crudos (ej. "46 92% 53%"), como el resto de
// las variables --gm-* — hay que envolverlos en hsl() para que sirvan como color real.
const chartConfig = {
  count: { label: 'Recibos' },
  PAID: { label: 'Pagados', color: 'hsl(var(--chart-1))' },
  PENDING: { label: 'Pendientes', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

const RADIAN = Math.PI / 180;

// Etiqueta custom: línea propia + circulito del color de la porción + número bien separado
// de la línea — el label por defecto de recharts pega el número justo al final de la línea
// y, con el radio chico de estos gráficos, se corta contra el borde del contenedor.
//
// El ángulo NO sale de la porción real (midAngle): con proporciones distintas en cada
// círculo (o una sola porción al 100%), el número termina en un lugar distinto en cada uno.
// Cada dato trae su propio "labelAngle" fijo (Pagado siempre arriba, Pendiente siempre abajo)
// para que los tres círculos queden alineados entre sí.
type PieLabelProps = {
  cx: number;
  cy: number;
  outerRadius: number;
  value: number;
  fill: string;
  labelAngle: number;
};

function renderReceiptsPieLabel({ cx, cy, outerRadius, value, fill, labelAngle }: PieLabelProps) {
  const cos = Math.cos(-labelAngle * RADIAN);
  const sin = Math.sin(-labelAngle * RADIAN);
  const lineEndX = cx + (outerRadius + 10) * cos;
  const lineEndY = cy + (outerRadius + 10) * sin;
  const dotX = cx + (outerRadius + 18) * cos;
  const dotY = cy + (outerRadius + 18) * sin;
  const textX = cx + (outerRadius + 32) * cos;
  const textY = cy + (outerRadius + 32) * sin;

  return (
    <g>
      <line
        x1={cx + outerRadius * cos}
        y1={cy + outerRadius * sin}
        x2={lineEndX}
        y2={lineEndY}
        stroke={fill}
        strokeWidth={1.5}
      />
      <circle cx={dotX} cy={dotY} r={3.5} fill={fill} />
      <text
        x={textX}
        y={textY}
        textAnchor={textX > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="fill-foreground text-[14px] font-bold gm-tnum"
      >
        {value}
      </text>
    </g>
  );
}

export function ReceiptsByTypeChart({
  data,
  month,
  monthLabel,
  receipts,
}: {
  data: ReceiptsSummaryResponse | null;
  month: string;
  monthLabel: string;
  receipts: Receipt[];
}) {
  // "Ver métricas" del menú de Clientes puede apuntar a una página que ya está montada
  // (si ya estás en el dashboard, Next no la vuelve a montar) — sin este truco los gráficos
  // no repetirían su animación de entrada al usar ese acceso directo.
  const [replayKey, setReplayKey] = useState(0);
  useEffect(() => {
    const handler = () => setReplayKey((k) => k + 1);
    window.addEventListener('gm:replay-receipts-chart', handler);
    return () => window.removeEventListener('gm:replay-receipts-chart', handler);
  }, []);

  const paid = data?.byStatus.find((s) => s.status === 'PAID')?.count ?? 0;
  const pending = data?.byStatus.find((s) => s.status === 'PENDING')?.count ?? 0;
  const totalCount = paid + pending;
  const pct = totalCount === 0 ? 0 : Math.round((paid / totalCount) * 100);

  // Un círculo por tipo de cliente (el mismo agrupamiento que ya usa "Ver detalle") para ver
  // de un vistazo dónde está concentrada la cobranza pendiente.
  const byType = CUSTOMER_TYPE_ORDER.map((type) => {
    const rows = receipts.filter((r) => r.customer?.customerType === type);
    const paidCount = rows.filter((r) => r.status === 'PAID').length;
    const total = rows.length;
    return { type, paidCount, pendingCount: total - paidCount, total };
  }).filter((t) => t.total > 0);

  return (
    <div className={cn(MONO_CARD, 'min-h-[420px]')}>
      <div className="mb-1 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={MONO_LABEL}>Recibos pagados vs pendientes</span>
            <span className={MONO_BADGE}>Por tipo de cliente</span>
          </div>
          <div className={MONO_STAT}>
            {pct}% <span className="text-xs font-normal text-muted-foreground">recibos pagados</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ReceiptsDetailDialog receipts={receipts} monthLabel={monthLabel} />
          <ReceiptsMonthFilter month={month} />
        </div>
      </div>

      <div key={replayKey} className={`${MONO_STAGE} flex items-center justify-around gap-2`}>
        {byType.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Sin recibos para el período seleccionado.</p>
        ) : (
          byType.map((t) => {
            const chartData = (
              [
                { status: 'PAID' as const, count: t.paidCount, fill: 'var(--color-PAID)', labelAngle: 90 },
                { status: 'PENDING' as const, count: t.pendingCount, fill: 'var(--color-PENDING)', labelAngle: 270 },
              ]
            ).filter((d) => d.count > 0);

            return (
              <div key={t.type} className="flex flex-1 flex-col items-center gap-1.5">
                <ChartContainer config={chartConfig} className="mx-auto h-[210px] w-full max-w-[210px]">
                  <PieChart margin={{ top: 22, right: 22, bottom: 22, left: 22 }}>
                    <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" />} />
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="status"
                      outerRadius={44}
                      label={renderReceiptsPieLabel}
                      labelLine={false}
                      animationDuration={800}
                    />
                  </PieChart>
                </ChartContainer>
                <span className="text-[13px] font-medium text-foreground">{CUSTOMER_TYPE_LABEL[t.type]}</span>
                <span className="gm-mono text-[11px] text-muted-foreground">
                  {t.paidCount}/{t.total} pagados
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className={MONO_FOOTER}>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-gm-yellow" /> Pagado
          <span className="ml-2 inline-block size-2 rounded-full bg-gm-orange" /> Pendiente
        </span>
        <span className="font-medium text-gm-yellow">
          Pagados {paid} · Pendientes {pending}
        </span>
      </div>
    </div>
  );
}
