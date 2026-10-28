'use client';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { ChevronsUpDown, Home, Key, KeyIcon, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { BoxListDialog } from '../box-list-dialog';
import { useState } from 'react';

export function NavigationMenuDemo({ setIsExpanded }: { setIsExpanded: (state: boolean) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleToggleMenu = () => {
    const newState = !menuOpen;
    setMenuOpen(newState);
    setIsExpanded(newState);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className=" w-full h-full text-center data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          onClick={handleToggleMenu}
        >
                      <Users/>
          <div className="hidden lg:grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Clientes</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4 mr-1" />
        </SidebarMenuButton>

        {menuOpen && (
    <div className="w-[--radix-dropdown-menu-trigger-width] min-w-40 rounded-lg shadow-md mt-2">
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <Link href="/owners">
        <DropdownMenuItem className="cursor-pointer flex items-center gap-2 pl-4">
          <Home size={18} />
          Propietarios
        </DropdownMenuItem>
      </Link>
    </DropdownMenuGroup>

    <DropdownMenuSeparator />

    <DropdownMenuGroup>
      <Link href="/renters">
        <DropdownMenuItem className="cursor-pointer flex items-center gap-2 pl-4">
          <Key size={18} />
          Inquilinos
        </DropdownMenuItem>
      </Link>
    </DropdownMenuGroup>

    <DropdownMenuSeparator />

    <DropdownMenuGroup>
      <Link href="/privates">
        <DropdownMenuItem className="cursor-pointer flex items-center gap-2 pl-4">
        <ShieldCheck size={24} />
          Inquilinos de Terceros
        </DropdownMenuItem>
      </Link>
    </DropdownMenuGroup>
  </div>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
