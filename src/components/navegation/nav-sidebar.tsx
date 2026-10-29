'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { NavItem, NavMain } from './nav-main';

export interface NavSection {
  label?: string;
  items: NavItem[];
}

// Marco común de los menús laterales: título, secciones y la salida ("Volver") abajo, separada.
export function NavSidebar({
  title,
  sections,
  footer,
  ...props
}: React.ComponentProps<typeof Sidebar> & { title: string; sections: NavSection[]; footer?: NavItem }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 flex-row items-center gap-2 border-b px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <SidebarTrigger className="size-8 shrink-0 rounded-lg transition-colors hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:text-white" />
        <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">{title}</span>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {sections.map((section) => (
          <NavMain key={section.label ?? section.items[0]?.url} label={section.label} items={section.items} />
        ))}
      </SidebarContent>

      {footer && (
        <SidebarFooter className="border-t p-0 py-1">
          <NavMain items={[footer]} />
        </SidebarFooter>
      )}

      <SidebarRail className="after:bg-border after:opacity-50 after:transition-opacity hover:after:opacity-100" />
    </Sidebar>
  );
}
