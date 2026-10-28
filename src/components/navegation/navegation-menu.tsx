'use client';

import { BarChart3, ChevronDown, Home, Key, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const RECEIPTS_METRICS_ID = 'recibos-pagados-pendientes';

export function NavigationMenuDemo({
  setIsExpanded,
}: {
  setIsExpanded: (state: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Si ya estás en el dashboard, un click en "Ver métricas" no navega a ningún lado nuevo
  // (misma ruta) — Next no vuelve a montar la página, así que ni el scroll ni la animación
  // de los gráficos se disparan solos. Lo hacemos a mano en ese caso puntual.
  const handleMetricsClick = (e: React.MouseEvent) => {
    if (pathname !== '/admin/dashboard') return;
    e.preventDefault();
    document.getElementById(RECEIPTS_METRICS_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.dispatchEvent(new Event('gm:replay-receipts-chart'));
  };

  const handleToggleMenu = () => {
    const newState = !menuOpen;
    setMenuOpen(newState);
    setIsExpanded(newState);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleToggleMenu}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] text-foreground transition-colors duration-150 hover:bg-white/[0.08]',
          menuOpen && 'bg-white/[0.06]',
        )}
      >
        <Users className="size-3.5 text-muted-foreground" />
        <span className="flex-1 text-left font-medium">Clientes</span>
        <ChevronDown
          className={cn(
            'size-3 text-muted-foreground transition-transform duration-200',
            menuOpen && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-200 ease-out',
          menuOpen
            ? 'grid-rows-[1fr] opacity-100 mt-1'
            : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-px rounded-lg border border-border/40 bg-white/[0.03] p-1 ml-5">
            <Link
              href="/owners"
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors duration-150 hover:bg-white/[0.08] hover:text-foreground"
            >
              <Home className="size-3 shrink-0" />
              Propietarios
            </Link>
            <Link
              href="/renters"
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors duration-150 hover:bg-white/[0.08] hover:text-foreground"
            >
              <Key className="size-3 shrink-0" />
              Inquilinos
            </Link>
            <Link
              href="/privates"
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors duration-150 hover:bg-white/[0.08] hover:text-foreground"
            >
              <ShieldCheck className="size-3 shrink-0" />
              Inquilinos de terceros
            </Link>

            <div className="my-1 border-t border-border/40" />

            <Link
              href={`/admin/dashboard#${RECEIPTS_METRICS_ID}`}
              onClick={handleMetricsClick}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-gm-yellow transition-colors duration-150 hover:bg-gm-yellow/10"
            >
              <BarChart3 className="size-3 shrink-0" />
              Ver métricas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
