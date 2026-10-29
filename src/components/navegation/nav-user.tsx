"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bell, Box, ChevronDown, History, Home, Key, LogOut, Shield, ShieldCheck, TicketIcon, Users } from 'lucide-react';

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
import { User } from 'next-auth';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notification';

const CLIENT_ROUTES = ['/owners', '/renters', '/privates', '/admin/clientes'];
const isUnder = (pathname: string, url: string) => pathname === url || pathname.startsWith(`${url}/`);

const itemClass = 'cursor-pointer gap-3 rounded-lg px-2 py-2';

// Ícono en baldosa; con "active" la página actual se marca en amarillo.
function Tile({ icon: Icon, active, tone }: { icon: typeof Box; active?: boolean; tone?: 'accent' | 'danger' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-lg border [&>svg]:size-4',
        tone === 'danger'
          ? 'border-red-500/20 bg-red-500/10'
          : active || tone === 'accent'
            ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400'
            : 'bg-secondary/60 text-muted-foreground',
      )}
    >
      <Icon />
    </span>
  );
}

function Text({ title, hint }: { title: string; hint?: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium leading-tight">{title}</span>
      {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
    </span>
  );
}

// Todo el menú de la app vive acá: secciones, acciones del día y la cuenta. La barra solo
// muestra el logo y este botón (avatar + flecha). Los diálogos de planilla y registros los
// maneja TopNav.
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
  const pathname = usePathname();
  const { hasNewNoteAlert, clearNoteAlert } = useNotifications();
  const isAdmin = userNav.role === 'ADMIN';
  const clientesActive = CLIENT_ROUTES.some((url) => isUnder(pathname, url));
  // Clientes se despliega dentro del mismo menú; arranca abierto si ya estás en esa sección.
  const [clientesOpen, setClientesOpen] = useState(clientesActive);
  // Dos letras como máximo («Ignacio Gaute» → «IG»), aunque el nombre tenga más palabras.
  const initials = userNav.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

  const clientes = [
    { href: '/owners', label: 'Propietarios', icon: Home },
    { href: '/renters', label: 'Inquilinos', icon: Key },
    { href: '/privates', label: 'Inquilinos de terceros', icon: ShieldCheck },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menú de ${userNav.name}`}
          title={`${userNav.name} · ${userNav.email}`}
          className="group relative flex h-10 items-center gap-1.5 rounded-full border bg-secondary/30 py-0.5 pl-0.5 pr-2.5 outline-none transition-colors hover:border-yellow-400/50 focus-visible:ring-2 focus-visible:ring-yellow-400 data-[state=open]:border-yellow-400"
        >
          <Avatar className="size-8">
            <AvatarImage src={userNav.avatar} alt="" />
            <AvatarFallback className="bg-yellow-400/15 text-xs font-bold text-yellow-400">{initials}</AvatarFallback>
          </Avatar>
          <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
          {hasNewNoteAlert && (
            <span aria-hidden="true" className="absolute right-0 top-0 size-2.5 rounded-full bg-yellow-400 ring-2 ring-background" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="max-h-[calc(100dvh-5rem)] w-80 overflow-y-auto rounded-xl p-0"
      >
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
            Secciones
          </DropdownMenuLabel>
          <DropdownMenuItem asChild className={itemClass}>
            <Link href="/tickets" aria-current={isUnder(pathname, '/tickets') ? 'page' : undefined}>
              <Tile icon={TicketIcon} active={isUnder(pathname, '/tickets')} />
              <Text title="Tickets" />
            </Link>
          </DropdownMenuItem>
          {/* «Clientes» solo lo ve un administrador, como hasta ahora. */}
          {isAdmin && (
            <>
              <DropdownMenuItem
                aria-expanded={clientesOpen}
                // Desplegar no cierra el menú: solo muestra u oculta las opciones de clientes.
                onSelect={(event) => {
                  event.preventDefault();
                  setClientesOpen((value) => !value);
                }}
                className={itemClass}
              >
                <Tile icon={Users} active={clientesActive} />
                <Text title="Clientes" />
                <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', clientesOpen && 'rotate-180')} />
              </DropdownMenuItem>
              {clientesOpen && (
                <div className="ml-6 border-l pl-2">
                  {clientes.map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild className="cursor-pointer gap-2.5 rounded-lg px-2 py-1.5">
                      <Link href={href} aria-current={isUnder(pathname, href) ? 'page' : undefined} className={cn(isUnder(pathname, href) && 'text-yellow-400')}>
                        <Icon className="size-4 text-muted-foreground" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {/* «Ver métricas» lleva a /admin/clientes, que solo puede abrir un administrador. */}
                  <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-2 py-1.5 text-yellow-400 focus:text-yellow-400">
                    <Link href="/admin/clientes">
                      <BarChart3 className="size-4" />
                      Ver métricas
                    </Link>
                  </DropdownMenuItem>
                </div>
              )}
            </>
          )}
          <DropdownMenuItem asChild className={itemClass}>
            <Link href="/notes" onClick={clearNoteAlert} aria-current={isUnder(pathname, '/notes') ? 'page' : undefined}>
              <Tile icon={Bell} active={isUnder(pathname, '/notes')} />
              <Text title="Avisos" />
              {hasNewNoteAlert && (
                <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[11px] font-bold text-black">
                  Nuevos<span className="sr-only"> avisos</span>
                </span>
              )}
            </Link>
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="p-1.5">
          <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Operación del día
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={onOpenBoxList} className={itemClass}>
            <Tile icon={Box} tone="accent" />
            <Text title="Planilla de caja" hint="Elegí un día e imprimí su planilla" />
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenRegistrations} className={itemClass}>
            <Tile icon={History} tone="accent" />
            <Text title="Ver registros de tickets" hint="Tickets por día y por semana" />
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="p-1.5">
          <DropdownMenuItem asChild className={itemClass}>
            <Link href={isAdmin ? '/admin/users' : '/admin/other-payments'}>
              <Tile icon={Shield} />
              <Text
                title={isAdmin ? 'Administrar' : 'Administrar gastos'}
                hint={isAdmin ? 'Usuarios, tarifas, montos y caja' : 'Ingresos y egresos de caja'}
              />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => signOut()} className={cn(itemClass, 'text-red-400 focus:bg-red-500/10 focus:text-red-400')}>
            <Tile icon={LogOut} tone="danger" />
            <Text title="Cerrar sesión" />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
