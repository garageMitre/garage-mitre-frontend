'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TARIFF_VEHICLES, type TariffPlan } from '@/types/tariff-plan.type';
import type { ticketPrice } from '@/types/ticket-price';
import { TariffsBody } from './tarifas/tariffs-body';
import { TariffPasses } from './tarifas/tariff-passes';

interface TicketsTabsProps {
  /** Barcode catalog table. */
  catalog: React.ReactNode;
  /** Tarifas por tiempo y de día/semana/mes — se omiten para usuarios que no son admin. */
  tariffs?: { plan: TariffPlan | null; loadError?: string; passPrices: ticketPrice[] };
}

// Mismo control segmentado que «Por hora / Día/Sem/Mes» en la pantalla de operación.
const triggerClass =
  'h-9 gap-2 rounded-md px-4 text-[13px] font-semibold text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border';

export function TicketsTabs({ catalog, tariffs }: TicketsTabsProps) {
  const [tab, setTab] = useState('catalog');
  const [editing, setEditing] = useState(false);

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg border border-border bg-gm-surface-2 p-1 max-sm:[contain:inline-size] sm:w-fit">
        <TabsTrigger value="catalog" className={triggerClass}>
          Tickets
        </TabsTrigger>
        {tariffs && (
          <TabsTrigger value="porTiempo" className={triggerClass}>
            Por tiempo
            {editing && (
              <span className="size-1.5 rounded-full bg-gm-yellow" title="Borrador sin aplicar">
                <span className="sr-only">(borrador sin aplicar)</span>
              </span>
            )}
          </TabsTrigger>
        )}
        {tariffs && (
          <TabsTrigger value="diaSemanaMes" className={triggerClass}>
            Día / semana / mes
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="catalog" className="mt-5 short:mt-4">
        {catalog}
      </TabsContent>
      {tariffs && (
        // Montado siempre: cambiar de pestaña no puede descartar un borrador sin aplicar.
        <TabsContent value="porTiempo" forceMount className="mt-5 short:mt-4 data-[state=inactive]:hidden">
          <TariffsBody initialPlan={tariffs.plan} loadError={tariffs.loadError} onDraftChange={setEditing} />
        </TabsContent>
      )}
      {tariffs && (
        <TabsContent value="diaSemanaMes" className="mt-5 short:mt-4">
          <TariffPasses prices={tariffs.passPrices} vehicles={TARIFF_VEHICLES} />
        </TabsContent>
      )}
    </Tabs>
  );
}
