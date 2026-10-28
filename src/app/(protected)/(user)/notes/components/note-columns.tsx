'use client';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Note } from '@/types/note.type';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheckIcon, BadgeXIcon, MoreHorizontal } from 'lucide-react';
import { UpdateNoteDialog } from './update-note-dialog';
import { DeleteNoteDialog } from './delete-note-dialog';
import { ViewNoteDialog } from './view-note-dialog';


export const noteColumns: ColumnDef<Note>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[100px] text-sm">{row.getValue('date')}</div>
    ),
  },
  {
    accessorKey: 'hours',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Horario" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[100px] text-sm">{row.getValue('hours')}</div>
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Descripción" />
    ),
    cell: ({ row }) => {
      const description = row.getValue('description') as string; // Aseguramos que description es de tipo string
      const truncatedDescription = description.length > 3 ? description.slice(0, 3) + "..." : description;
      return <div className="min-w-[100px] text-sm">{truncatedDescription}</div>;
    },
  },
  {
    accessorFn: (row) => row.user?.email,
    id: 'wallet',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usuario" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[100] text-sm">{row.original.user?.email}</div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const note = row.original;

      return  (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel className="text-sm">Acciones</DropdownMenuLabel>
            <ViewNoteDialog note={note}/>
            <UpdateNoteDialog note={note} />
            <DeleteNoteDialog note={note} />
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];
