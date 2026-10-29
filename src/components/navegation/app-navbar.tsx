
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { ReactNode } from 'react';
import { currentUser } from '@/lib/auth';
import { NavUser } from './nav-user';
import { BrandLogo } from '@/components/brand-logo';
import { NotificationSidebar } from '@/app/(protected)/(user)/components/notifications-sidebar';
import { getTicketsRegistrationForDay } from '@/services/tickets.service';

interface AppNavbarProps {
  children: ReactNode;
  adminSidebar?: ReactNode;
  userSidebar?: ReactNode;
}

export async function AppNavbar({ children, adminSidebar, userSidebar }: AppNavbarProps) {
  const user = await currentUser();
  const tickets = await getTicketsRegistrationForDay();
  const ticketRegistrationsDayOrWeek = Array.isArray(tickets) ? tickets : [];
  




  // El Sidebar ya se oculta solo en el celular y ahí se abre como panel desde el botón del header.
  const sidebar = user?.role === 'ADMIN' ? adminSidebar : userSidebar;

  return (
    <>
      {sidebar}
      {/* min-w-0: sin esto una tabla ancha estira toda la página en el celular en vez de desplazarse sola. */}
      <SidebarInset className="flex min-w-0 flex-col">
        {/* Fijo arriba al desplazarse; el fondo translúcido deja ver que hay contenido debajo. */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
          {sidebar && <SidebarTrigger className="size-9 shrink-0 rounded-lg md:hidden" aria-label="Abrir menú" />}
          <div className="flex w-full items-center justify-between gap-4">
            <Link
              href="/tickets"
              aria-label="Garage Mitre, ir a tickets"
              className="rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <BrandLogo />
            </Link>
            <div className="flex items-center gap-6">
              <NavUser
                userNav={{
                  avatar: user?.image ?? '',
                  email: user?.email ?? '',
                  name: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`,
                  role: user?.role || 'USER',
                }}
                ticketRegistrationsDayOrWeek={ticketRegistrationsDayOrWeek || []}
              />

            </div>
          </div>
        </header>
        {children}
      </SidebarInset>
    </>
  );
}
