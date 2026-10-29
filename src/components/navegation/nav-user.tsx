"use client";
import { LogOut, Shield } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { User } from 'next-auth';

// Cuenta del usuario: solo el avatar en la barra; nombre, email y opciones de la cuenta en el menú.
// Las secciones y acciones del día están en TopNav.
export function NavUser({
  userNav,
}: {
  userNav: {
    name: string;
    email: string;
    avatar: string;
    role: User['role'];
  };
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

      <DropdownMenuContent align="end" sideOffset={10} className="w-72 rounded-xl p-0">
        <div className="flex items-center gap-3 px-3.5 pb-3 pt-3.5">
          <Avatar className="size-10">
            <AvatarImage src={userNav.avatar} alt="" />
            <AvatarFallback className="bg-yellow-400/15 text-sm font-bold text-yellow-400">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-snug">
            <p className="truncate text-sm font-semibold">{userNav.name}</p>
            <p className="truncate text-xs text-muted-foreground">{userNav.email}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="px-3.5 pb-3">
            <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-400">
              Administrador
            </span>
          </div>
        )}
        <DropdownMenuSeparator className="my-0" />
        <div className="p-1.5">
          <DropdownMenuItem asChild className="cursor-pointer gap-3 py-2">
            <Link href={isAdmin ? '/admin/users' : '/admin/other-payments'}>
              <Shield />
              {isAdmin ? 'Administrar' : 'Administrar gastos'}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => signOut()} className="cursor-pointer gap-3 py-2 text-red-400 focus:text-red-400">
            <LogOut />
            Cerrar sesión
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
