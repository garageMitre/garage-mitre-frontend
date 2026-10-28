'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Note } from '@/types/note.type';
import { DataTableShell } from '@/components/data-table-shell';
import { CreateNoteDialog } from './create-note-dialog';

interface NotesTableProps {
  columns: ColumnDef<Note>[];
  data: Note[];
}

export function NotesTable({ columns, data }: NotesTableProps) {
  return (
    <DataTableShell
      data={data}
      columns={columns}
      filterColumn="date"
      filterPlaceholder="Filtrar por fecha..."
      pageSize={20}
      toolbarRight={<CreateNoteDialog />}
      emptyMessage="No hay avisos por ahora — creá el primero."
    />
  );
}
