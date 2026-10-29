"use client";
import { Box, History, LogOut, Shield } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { User } from 'next-auth';

// Ítem con ícono en baldosa y una línea de ayuda debajo del nombre.
function MenuAction({ icon: Icon, title, hint, accent }: { icon: typeof Box; title: string; hint: string; accent?: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`grid size-9 shrink-0 place-items-center rounded-lg border ${accent ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400' : 'bg-secondary/60 text-muted-foreground'}`}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
    </>
  );
}

// Cuenta del usuario: el avatar en la barra; en el menú, sus datos, las acciones del día
// (planilla y registros) y las opciones de la cuenta. Los diálogos los maneja TopNav.
export function NavUser({
  userNav,
  onOpenBoxList,
  onOpenRegistrations,
}: {
  userNav: {
    name: string;
    email: string;
    avatar: string;
    role: User['role'];
  };
  onOpenBoxList: () => void;
  onOpenRegistrations: () => void;
}) {
  const isAdmin = userNav.role === 'ADMIN';
  // Dos letras como máximo («Ignacio Gaute» → «IG»), aunque el nombre tenga más palabras.
  const initials = userNav.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Cuenta de ${userNav.name}`}
          title={`${userNav.name} · ${userNav.email}`}
          className="grid size-10 shrink-0 place-items-center rounded-full outline-none ring-offset-2 ring-offset-background transition-shadow hover:ring-2 hover:ring-yellow-400/50 focus-visible:ring-2 focus-visible:ring-yellow-400 data-[state=open]:ring-2 data-[state=open]:ring-yellow-400"
        >
          <Avatar className="size-9">
            <AvatarImage src={userNav.avatar} alt="" />
            <AvatarFallback className="bg-yellow-400/15 text-xs font-bold text-yellow-400">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={10} className="w-80 overflow-hidden rounded-xl p-0">
        <div className="flex items-center gap-3 bg-secondary/30 px-4 py-3.5">
          <Avatar className="size-11">
            <AvatarImage src={userNav.avatar} alt="" />
            <AvatarFallback className="bg-yellow-400/15 text-sm font-bold text-yellow-400">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-snug">
            <p className="truncate text-sm font-semibold">{userNav.name}</p>
            <p className="truncate text-xs text-muted-foreground">{userNav.email}</p>
          </div>
          {isAdmin && (
            <span className="shrink-0 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-400">
              Administrador
            </span>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="p-1.5">
          <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Operación del día
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={onOpenBoxList} className="cursor-pointer gap-3 rounded-lg px-2 py-2">
            <MenuAction icon={Box} title="Planilla de caja" hint="Elegí un día e imprimí su planilla" accent />
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenRegistrations} className="cursor-pointer gap-3 rounded-lg px-2 py-2">
            <MenuAction icon={History} title="Ver registros de tickets" hint="Tickets por día y por semana" accent />
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="p-1.5">
          <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-2 py-2">
            <Link href={isAdmin ? '/admin/users' : '/admin/other-payments'}>
              <MenuAction
                icon={Shield}
                title={isAdmin ? 'Administrar' : 'Administrar gastos'}
                hint={isAdmin ? 'Usuarios, tarifas, montos y caja' : 'Ingresos y egresos de caja'}
              />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => signOut()} className="cursor-pointer gap-3 rounded-lg px-2 py-2 text-red-400 focus:bg-red-500/10 focus:text-red-400">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-red-500/20 bg-red-500/10">
              <LogOut className="size-4" />
            </span>
            <span className="text-sm font-medium">Cerrar sesión</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
