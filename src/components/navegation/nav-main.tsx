'use client';

import React from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon | React.ReactNode | (() => React.JSX.Element);
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = mounted && pathname === item.url;
          const hasActiveChild =
            mounted && item.items?.some((subItem) => pathname === subItem.url);

          if (!item.items?.length) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className="group relative flex w-full items-center rounded-md px-2 py-6 text-sm font-medium transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:text-white data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/30 data-[active=true]:to-primary/20 data-[active=true]:text-white"
                >
                  <Link
                    href={item.url}
                    className="flex items-center w-full gap-x-3"
                  >
                    {item.icon && (
                      <div className="flex h-5 w-5 items-center justify-center transition-transform duration-200 group-hover:scale-110">
                        {typeof item.icon === 'function'
                          ? item.icon({})
                          : item.icon}
                      </div>
                    )}
                    <span className="truncate group-[[data-collapsible=icon]]/sidebar:hidden">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={hasActiveChild}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={hasActiveChild}
                    className="group relativeflex items-center rounded-l-full px-4 py-8 text-sm font-medium transition-all duration-200 hover:bg-gradient-to-r data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/30 data-[active=true]:to-primary/20 data-[active=true]:text-white"
                  >
                    {item.icon && (
                      <div className="flex h-7 w-5 items-center justify-center transition-transform duration-200 group-hover:scale-110">
                        {typeof item.icon === 'function'
                          ? item.icon({})
                          : item.icon}
                      </div>
                    )}
                    <span className="ml-10 truncate group-[[data-collapsible=icon]]/sidebar:hidden">
                      {item.title}
                    </span>
                    <ChevronRight className="ml-auto h-5 w-5 shrink-0 transition-all duration-200 text-muted-foreground/50 group-hover:text-primary group-data-[state=open]/collapsible:rotate-90 group-[[data-collapsible=icon]]/sidebar:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="animate-accordion-down group-[[data-collapsible=icon]]/sidebar:hidden">
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={mounted && pathname === subItem.url}
                          className="group flex w-full items-center rounded-md px-4 py-2 pl-12 text-sm font-medium transition-all duration-200 hover:bg-gradient-to-r hover:text-white data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/30 data-[active=true]:to-primary/20 data-[active=true]:text-white"
                        >
                          <Link href={subItem.url}>
                            <span className="truncate">{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
