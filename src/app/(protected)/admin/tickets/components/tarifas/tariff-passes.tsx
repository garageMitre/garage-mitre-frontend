'use client';

import { MoreHorizontal } from 'lucide-react';
import type { ticketPrice, TicketTimeType, VehicleType } from '@/types/ticket-price';
import type { TariffVehicle } from '@/types/tariff-plan.type';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/components/pricing-breakdown';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UpdateTicketPriceDialog } from '../ticket-price/update-ticket-price-dialog';
import { DeleteTicketPriceDialog } from '../ticket-price/delete-ticket-price-dialog';
import { CreateTicketPriceDialog } from '../ticket-price/create-ticket-price-dialog';
import { TariffCard, TariffCardHeader, tdClass, thClass } from './tariff-ui';

const unassigned = '__UNASSIGNED__';
const durationNames: Record<string, string> = { DIA: 'Día', SEMANA: 'Semana', SEMANA_Y_DIA: 'Semana y día', MES: 'Mes', MES_Y_DIA: 'Mes y día' };
const baseDurations: TicketTimeType[] = ['DIA', 'SEMANA', 'MES'];
const durationOrder: Record<string, number> = { DIA: 0, SEMANA: 1, SEMANA_Y_DIA: 2, MES: 3, MES_Y_DIA: 4 };

// Grilla duración × vehículo: se ve de un vistazo qué precio falta y se carga desde su celda.
export function TariffPasses({ prices, vehicles }: { prices: ticketPrice[]; vehicles: TariffVehicle[] }) {
  const columns = [...new Set([...vehicles.filter(v => v.enabled).map(v => v.code), ...prices.map(price => price.vehicleType ?? unassigned)])]
    .map(code => ({ code, name: code === unassigned ? 'Sin vehículo' : vehicles.find(v => v.code === code)?.name ?? code, enabled: vehicles.some(v => v.code === code && v.enabled) }));
  const durations = [...new Set([...baseDurations, ...prices.map(price => price.ticketTimeType).filter((type): type is TicketTimeType => !!type)])]
    .sort((a, b) => (durationOrder[a] ?? 99) - (durationOrder[b] ?? 99));
  const find = (vehicle: string, duration: string) => prices.find(price => (price.vehicleType ?? unassigned) === vehicle && price.ticketTimeType === duration);

  return <TariffCard aria-labelledby="passes-heading" data-tariff-passes>
    <TariffCardHeader id="passes-heading" eyebrow="Tickets de día, semana o mes" title="Precios por unidad"
      description="Se multiplican por la cantidad elegida al registrar el ticket. «Semana y día» o «Mes y día» combinan estos mismos precios." />
    <div className="overflow-x-auto [contain:inline-size]">
      <table data-pass-rows className="w-full">
        <caption className="sr-only">Precios por día, semana o mes de cada vehículo</caption>
        <thead><tr className="border-b border-border">
          <th scope="col" className={thClass}>Duración</th>
          {columns.map(column => <th key={column.code} scope="col" className={thClass + ' text-right'}>{column.name}</th>)}
        </tr></thead>
        <tbody>{durations.map(duration => <tr key={duration} className="border-b border-border last:border-0">
          <th scope="row" className={tdClass + ' text-left font-medium'}>{durationNames[duration] ?? duration}</th>
          {columns.map(column => {
            const price = find(column.code, duration);
            const label = (durationNames[duration] ?? duration) + ' de ' + column.name;
            return <td key={column.code} className="px-5 py-2 text-right">
              {price ? <div className="flex items-center justify-end gap-1">
                <span className="text-sm font-semibold gm-tnum">{formatPrice(price.ticketTimePrice)}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label={'Acciones de ' + label}><MoreHorizontal className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 border border-border bg-gm-surface p-1"><UpdateTicketPriceDialog ticketPrice={price} /><DeleteTicketPriceDialog ticketPrice={price} /></DropdownMenuContent>
                </DropdownMenu>
              </div> : column.enabled && baseDurations.includes(duration)
                ? <CreateTicketPriceDialog compact defaultVehicleType={column.code as VehicleType} defaultTimeType={duration} />
                : <span className="text-sm text-muted-foreground">—</span>}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
    <p className="border-t border-border px-5 py-2.5 text-xs text-muted-foreground">Un ticket por tiempo que se queda 24 horas se cobra con las tarifas por tiempo, no como un día.</p>
  </TariffCard>;
}
