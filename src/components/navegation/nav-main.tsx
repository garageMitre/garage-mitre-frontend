'use client';

import { type LucideIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

// La barra amarilla marca la página actual también con el menú colapsado (solo íconos).
const itemClass =
  'relative h-10 gap-3 rounded-lg px-3 font-medium text-foreground/75 transition-colors ' +
  'hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:text-white ' +
  'data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/30 data-[active=true]:to-primary/20 data-[active=true]:text-white ' +
  '[&>svg]:size-[18px] [&[data-active=true]>svg]:text-yellow-400 ' +
  'before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-yellow-400 before:opacity-0 data-[active=true]:before:opacity-100';

export function NavMain({ label, items }: { label?: string; items: NavItem[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="py-1">
      {label && (
        <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarMenu className="gap-1">
        {items.map(({ title, url, icon: Icon }) => {
          // Las subpáginas (p. ej. /admin/clientes/...) también marcan su sección.
          const isActive = pathname === url || pathname.startsWith(`${url}/`);
          return (
            <SidebarMenuItem key={url}>
              <SidebarMenuButton asChild tooltip={title} isActive={isActive} className={itemClass}>
                <Link
                  href={url}
                  aria-current={isActive ? 'page' : undefined}
                  // En el celular el menú es un panel: se cierra al elegir una página.
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <Icon />
                  <span>{title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
