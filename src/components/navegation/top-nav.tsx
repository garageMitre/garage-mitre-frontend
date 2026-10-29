'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bell, Box, ChevronDown, History, Home, Key, ShieldCheck, TicketIcon, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { BoxListDialog } from '../box-list-dialog';
import { useNotifications } from '@/hooks/use-notification';
import { TicketTableDialog } from '@/app/(protected)/(user)/tickets/tickets-days-or-weeks/ticket-table-dialog';
import { TicketRegistrationForDay } from '@/types/ticket-registration-for-day.type';

const CLIENT_ROUTES = ['/owners', '/renters', '/privates', '/admin/clientes'];

const isUnder = (pathname: string, url: string) => pathname === url || pathname.startsWith(`${url}/`);

// Pestaña del header: la página actual lleva una barra amarilla sobre el borde inferior.
const tabClass = (active: boolean) =>
  cn(
    'relative flex items-center gap-2 px-3.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-400 [&>svg]:size-4',
    'after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:bg-yellow-400 after:transition-opacity',
    active ? 'font-semibold text-foreground after:opacity-100' : 'text-muted-foreground after:opacity-0 hover:text-foreground',
  );

const actionClass =
  'flex h-9 items-center gap-2 rounded-lg border px-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary xl:px-3.5 [&>svg]:size-4';

// Botón de la barra inferior del celular.
const bottomClass = (active: boolean) =>
  cn(
    'relative flex flex-col items-center justify-center gap-1 text-center text-[11px] font-medium leading-tight outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-400 [&>svg]:size-[22px]',
    active ? 'text-yellow-400' : 'text-muted-foreground',
  );

function ClientesMenu({ isAdmin, children, side = 'bottom' }: { isAdmin: boolean; children: React.ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="start" sideOffset={side === 'top' ? 10 : 6} className="w-60 rounded-xl p-1.5">
        <DropdownMenuItem asChild className="cursor-pointer gap-3 py-2">
          <Link href="/owners"><Home />Propietarios</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer gap-3 py-2">
          <Link href="/renters"><Key />Inquilinos</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer gap-3 py-2">
          <Link href="/privates"><ShieldCheck />Inquilinos de terceros</Link>
        </DropdownMenuItem>
        {/* «Ver métricas» lleva a /admin/clientes, que solo puede abrir un administrador. */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer gap-3 py-2 text-yellow-400 focus:text-yellow-400">
              <Link href="/admin/clientes"><BarChart3 />Ver métricas</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Secciones y acciones del día a la vista (antes estaban todas dentro del menú del usuario).
// En el celular las secciones pasan a una barra fija abajo.
export function TopNav({
  isAdmin,
  ticketRegistrationsDayOrWeek,
}: {
  isAdmin: boolean;
  ticketRegistrationsDayOrWeek: TicketRegistrationForDay[];
}) {
  const pathname = usePathname();
  const [openBoxDialog, setOpenBoxDialog] = useState(false);
  const [openTicketDialog, setOpenTicketDialog] = useState(false);
  const { hasNewNoteAlert, clearNoteAlert } = useNotifications();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ticketsActive = isUnder(pathname, '/tickets');
  const clientesActive = CLIENT_ROUTES.some((url) => isUnder(pathname, url));
  const avisosActive = isUnder(pathname, '/notes');

  const newNotesDot = hasNewNoteAlert && (
    <>
      <span aria-hidden="true" className="size-2 rounded-full bg-yellow-400 ring-2 ring-background" />
      <span className="sr-only">Hay avisos nuevos</span>
    </>
  );

  return (
    <>
      <nav aria-label="Secciones" className="hidden self-stretch md:flex">
        <Link href="/tickets" aria-current={ticketsActive ? 'page' : undefined} className={tabClass(ticketsActive)}>
          <TicketIcon />
          Tickets
        </Link>
        {isAdmin && (
          <ClientesMenu isAdmin={isAdmin}>
            <button type="button" className={cn(tabClass(clientesActive), 'group')}>
              <Users />
              Clientes
              <ChevronDown className="!size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </button>
          </ClientesMenu>
        )}
        <Link href="/notes" onClick={clearNoteAlert} aria-current={avisosActive ? 'page' : undefined} className={tabClass(avisosActive)}>
          <Bell />
          Avisos
          {newNotesDot}
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" onClick={() => setOpenBoxDialog(true)} aria-label="Planilla de caja" title="Planilla de caja" className={cn(actionClass, 'hidden md:flex')}>
          <Box />
          <span className="hidden xl:inline">Planilla de caja</span>
        </button>
        <button type="button" onClick={() => setOpenTicketDialog(true)} aria-label="Ver registros de tickets" title="Ver registros de tickets" className={actionClass}>
          <History />
          <span className="hidden xl:inline">Ver registros de tickets</span>
        </button>
        <span aria-hidden="true" className="mx-1.5 hidden h-6 w-px bg-border md:block" />
      </div>

      {/* Va al body con un portal: el backdrop-filter del header vuelve "fixed" relativo al header. */}
      {mounted && createPortal(
      <nav
        aria-label="Secciones"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 grid h-16 border-t bg-background/95 px-2 pb-1 backdrop-blur md:hidden',
          isAdmin ? 'grid-cols-4' : 'grid-cols-3',
        )}
      >
        <Link href="/tickets" aria-current={ticketsActive ? 'page' : undefined} className={bottomClass(ticketsActive)}>
          <TicketIcon />
          Tickets
        </Link>
        {isAdmin && (
          <ClientesMenu isAdmin={isAdmin} side="top">
            <button type="button" className={bottomClass(clientesActive)}>
              <Users />
              Clientes
            </button>
          </ClientesMenu>
        )}
        <button type="button" onClick={() => setOpenBoxDialog(true)} className={bottomClass(false)}>
          <Box />
          Planilla de caja
        </button>
        <Link href="/notes" onClick={clearNoteAlert} aria-current={avisosActive ? 'page' : undefined} className={bottomClass(avisosActive)}>
          <Bell />
          Avisos
          {hasNewNoteAlert && <span className="absolute left-1/2 top-2.5 ml-1.5">{newNotesDot}</span>}
        </Link>
      </nav>,
      document.body,
      )}

      {/* Fuera de los menús: se abren al elegir la opción y siguen abiertos aunque el menú se cierre. */}
      <BoxListDialog open={openBoxDialog} setOpen={setOpenBoxDialog} />
      <TicketTableDialog ticketRegistrationForDay={ticketRegistrationsDayOrWeek} open={openTicketDialog} setOpen={setOpenTicketDialog} />
    </>
  );
}
