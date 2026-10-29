
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { ReactNode } from 'react';
import { currentUser } from '@/lib/auth';
import { NavUser } from './nav-user';
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
        <header className="relative flex h-14 items-center gap-2 border-b shadow-sm px-4 md:px-6">
          {sidebar && <SidebarTrigger className="size-9 shrink-0 rounded-lg md:hidden" aria-label="Abrir menú" />}
          <div className="flex items-center w-full justify-between">
            <Link href="/tickets">
               <div className={`flex items-center space-x-2 mt-3 mb-2 ${sidebar ? 'ml-1 md:ml-20' : 'ml-20'}`}>
                 <div className="bg-yellow-400 px-3 py-1 rounded-md shadow-md">
                   <span className="text-black text-lg font-bold">GARAGE</span>
                 </div>
                  <span className="text-white text-lg font-semibold">MITRE</span>
                </div>
             </Link>
            <div className="flex items-center gap-6">
              <div>
             {/* <NotificationSidebar/> */}
              </div>
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
