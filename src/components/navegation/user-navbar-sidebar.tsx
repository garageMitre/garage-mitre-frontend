'use client';

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
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';

export const userNavItems = [
  {
    title: 'Registrar Gastos',
    url: '/admin/other-payments',
    icon: <Banknote  />,
  },
  {
    title: 'Volver',
    url: '/tickets',
    icon: <ArrowLeft />,
  },
];

export function UserNavbarSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={userNavItems} />
      </SidebarContent>
      <SidebarRail className="after:bg-border after:opacity-50 hover:after:opacity-100 after:transition-opacity" />
    </Sidebar>
  );
}
