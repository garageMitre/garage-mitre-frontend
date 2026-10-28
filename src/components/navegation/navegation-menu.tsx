'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { BarChart3, ChevronDown, Home, Key, ShieldCheck, Users } from 'lucide-react';
import { DropdownMenuGroup, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Grupo «Clientes» del menú del usuario: se despliega ahí mismo, sin abrir otro menú. Los ítems
// son ítems reales del menú (navegables con flechas y Enter) en vez de botones sueltos.
export function ClientesMenuGroup() {
  const [open, setOpen] = useState(false);
  // «Ver métricas» lleva a /admin/clientes, que solo puede abrir un administrador.
  const { data: session } = useSession();
  const isAdmin = session?.user?.role?.toUpperCase() === 'ADMIN';

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem
        aria-expanded={open}
        // Desplegar no cierra el menú: solo muestra u oculta las opciones de clientes.
        onSelect={(event) => {
          event.preventDefault();
          setOpen((value) => !value);
        }}
        className="cursor-pointer font-semibold"
      >
        <Users />
        Clientes
        <ChevronDown className={cn('ml-auto transition-transform duration-200', open && 'rotate-180')} />
      </DropdownMenuItem>

      {open && (
        <div className="ml-[15px] border-l border-border pl-1.5">
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/owners">
              <Home />
              Propietarios
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/renters">
              <Key />
              Inquilinos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/privates">
              <ShieldCheck />
              Inquilinos de terceros
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild className="cursor-pointer text-yellow-400 focus:text-yellow-400">
              <Link href="/admin/clientes">
                <BarChart3 />
                Ver métricas
              </Link>
            </DropdownMenuItem>
          )}
        </div>
      )}
    </DropdownMenuGroup>
  );
}
