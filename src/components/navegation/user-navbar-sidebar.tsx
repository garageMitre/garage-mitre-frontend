'use client';

import { ArrowLeft, Banknote } from 'lucide-react';
import { Sidebar } from '@/components/ui/sidebar';
import { NavSidebar } from './nav-sidebar';

export function UserNavbarSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <NavSidebar
      title="Caja"
      sections={[{ items: [{ title: 'Registrar gastos', url: '/admin/other-payments', icon: Banknote }] }]}
      footer={{ title: 'Volver a tickets', url: '/tickets', icon: ArrowLeft }}
      {...props}
    />
  );
}
