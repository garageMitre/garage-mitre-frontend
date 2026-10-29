'use client'

import { ArrowLeft, Banknote, DollarSignIcon, ParkingCircle, Ticket, User, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/ui/sidebar'
import { NavSection, NavSidebar } from './nav-sidebar'

const adminSections: NavSection[] = [
  {
    label: 'Gestión',
    items: [
      { title: 'Usuarios', url: '/admin/users', icon: User },
      { title: 'Clientes', url: '/admin/clientes', icon: Users },
    ],
  },
  {
    label: 'Tarifas',
    items: [
      { title: 'Tickets', url: '/admin/tickets', icon: Ticket },
      { title: 'Tipo de estacionamiento', url: '/admin/parking-type', icon: ParkingCircle },
    ],
  },
  {
    label: 'Caja',
    items: [
      { title: 'Actualizar montos', url: '/admin/update-amount-customers', icon: DollarSignIcon },
      { title: 'Varios', url: '/admin/other-payments', icon: Banknote },
    ],
  },
]

// Un usuario que no es administrador solo puede registrar movimientos en Varios.
const userSections: NavSection[] = [
  { label: 'Caja', items: [{ title: 'Varios', url: '/admin/other-payments', icon: Banknote }] },
]

export function AdminNavbarSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const isAdmin = (session?.user?.role?.toUpperCase() ?? 'USER') === 'ADMIN'

  return (
    <NavSidebar
      title="Administración"
      sections={isAdmin ? adminSections : userSections}
      footer={{ title: 'Volver a tickets', url: '/tickets', icon: ArrowLeft }}
      {...props}
    />
  )
}
