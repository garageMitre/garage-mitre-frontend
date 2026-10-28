'use client'

import {
  CreditCardIcon,
  HandCoins,
  Home,
  HelpCircle,
  User2,
  Scale,
  BarChart,
  UserCheck,
  ArrowLeft,
  Globe,
  User,
  Wallet,
  Banknote,
  ParkingCircle,
  Ticket,
  DollarSignIcon,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavMain } from './nav-main'
import { useSession } from 'next-auth/react'

export function AdminNavbarSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const role = session?.user?.role?.toUpperCase() ?? 'USER'
  const isAdmin = role === 'ADMIN'

  const allNavItems = [
    { title: 'Usuarios', url: '/admin/users', icon: <User /> },
    { title: 'Tickets', url: '/admin/tickets', icon: <Ticket /> },
    { title: 'Tipo de Estacionamiento', url: '/admin/parking-type', icon: <ParkingCircle /> },
    { title: 'Actualizar Montos', url: '/admin/update-amount-customers', icon: <DollarSignIcon /> },
    { title: 'Varios', url: '/admin/other-payments', icon: <Banknote /> },
    { title: 'Volver', url: '/tickets', icon: <ArrowLeft /> },
  ]

  // 👇 Si no es admin, solo mostramos los dos últimos
  const navItems = isAdmin ? allNavItems : allNavItems.slice(-2)

  return (
    <Sidebar
      collapsible="icon"
      className="group/sidebar border-r bg-gradient-to-b from-background to-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      {...props}
    >
      <SidebarHeader className="h-14 border-b flex justify-center items-center bg-gradient-to-r from-background to-background/95">
        <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:text-white transition-all duration-200" />
      </SidebarHeader>

      <SidebarContent className="py-1 bg-gradient-to-r from-background to-background/95">
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarRail className="after:bg-border after:opacity-50 hover:after:opacity-100 after:transition-opacity" />
    </Sidebar>
  )
}
