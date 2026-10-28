"use client";
import { useState } from 'react';
import {
  AlertCircle,
  BellDot,
  Box,
  ChevronsUpDown,
  History,
  LogOut,
  Shield,
  TicketIcon,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { User } from 'next-auth';
import { ClientesMenuGroup } from './navegation-menu';
import { BoxListDialog } from '../box-list-dialog';
import { useNotifications } from '@/hooks/use-notification';
import { TicketTableDialog } from '@/app/(protected)/(user)/tickets/tickets-days-or-weeks/ticket-table-dialog';
import { TicketRegistrationForDay } from '@/types/ticket-registration-for-day.type';

export function NavUser({
  userNav,
  ticketRegistrationsDayOrWeek
}: {
  userNav: {
    name: string;
    email: string;
    avatar: string;
    role: User['role'];
  };
  ticketRegistrationsDayOrWeek : TicketRegistrationForDay[]
}) {
  const [openBoxDialog, setOpenBoxDialog] = useState(false);
  const [openTicketDialog, setOpenTicketDialog] = useState(false);
  const { hasNewNoteAlert, clearNoteAlert } = useNotifications();
  const isAdmin = userNav.role === 'ADMIN';
  // Dos letras como máximo («Ignacio Gaute» → «IG»), aunque el nombre tenga más palabras.
  const initials = userNav.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="w-70 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userNav.avatar} alt={userNav.name} />
                  <AvatarFallback className="rounded-lg bg-yellow-400/15 text-xs font-semibold text-yellow-400">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:grid flex-1 text-left text-sm leading-tight" title={`${userNav.name} · ${userNav.email}`}>
                  <span className="truncate font-semibold">{userNav.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{userNav.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="bottom"
              align="center"
              sideOffset={8}
            >
              {isAdmin && (
                <>
                  <ClientesMenuGroup />
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Operación del día */}
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/tickets">
                    <TicketIcon />
                    Tickets
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpenBoxDialog(true)} className="cursor-pointer">
                  <Box />
                  Planilla de caja
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpenTicketDialog(true)} className="cursor-pointer">
                  <History />
                  Ver registros de tickets
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/notes" onClick={clearNoteAlert}>
                    <AlertCircle />
                    Avisos
                    {hasNewNoteAlert && (
                      <span className="ml-auto flex items-center text-red-500" title="Hay avisos nuevos">
                        <BellDot />
                        <span className="sr-only">Hay avisos nuevos</span>
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={isAdmin ? '/admin/users' : '/admin/other-payments'}>
                    <Shield />
                    {isAdmin ? 'Administrar' : 'Administrar gastos'}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => signOut()}
                className="cursor-pointer text-red-400 focus:text-red-400"
              >
                <LogOut />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {/* Fuera del menú: se abren al elegir la opción y siguen abiertos aunque el menú se cierre. */}
      <BoxListDialog open={openBoxDialog} setOpen={setOpenBoxDialog} />
      <TicketTableDialog
        ticketRegistrationForDay={ticketRegistrationsDayOrWeek}
        open={openTicketDialog}
        setOpen={setOpenTicketDialog}
      />
    </>
  );
}
