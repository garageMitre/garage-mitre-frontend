'use client';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Note } from '@/types/note.type';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, StickyNote, User } from 'lucide-react';
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
      <span className="gm-mono gm-tnum text-[12.5px] font-semibold text-foreground">
        {row.getValue('date')}
      </span>
    ),
  },
  {
    accessorKey: 'hours',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Horario" />
    ),
    cell: ({ row }) => (
      <span className="gm-mono gm-tnum text-[12.5px] text-muted-foreground">
        {row.getValue('hours')}
      </span>
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Descripción" />
    ),
    cell: ({ row }) => {
      const desc = row.getValue('description') as string;
      const truncated = desc.length > 80 ? desc.slice(0, 80) + '…' : desc;
      return (
        <div className="flex items-start gap-2 min-w-[300px] max-w-[480px]">
          <StickyNote className="size-3.5 mt-0.5 text-gm-yellow shrink-0" />
          <span className="text-[13px] text-foreground">{truncated}</span>
        </div>
      );
    },
  },
  {
    accessorFn: (row) => row.user?.email,
    id: 'wallet',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usuario" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <User className="size-3.5" />
        {row.original.user?.email}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const note = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <span className="sr-only">Abrir acciones</span>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border border-border bg-gm-surface p-1 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]"
          >
            <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Acciones
            </DropdownMenuLabel>
            <ViewNoteDialog note={note} />
            <UpdateNoteDialog note={note} />
            <DropdownMenuSeparator className="bg-border" />
            <DeleteNoteDialog note={note} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
