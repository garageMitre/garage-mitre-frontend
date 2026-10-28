export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { AlertCircle, CreditCardIcon } from 'lucide-react';
import { NotesTable } from './components/notes-table';
import { noteColumns } from './components/note-columns';
import { getNotes } from '@/services/notes.service';


export default async function NotePage() {
  const notes = await getNotes();

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3 mb-6 sm:mb-8 bg-secondary/50 p-4 sm:p-6 rounded-xl backdrop-blur-sm">
        <AlertCircle  className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Avisos</h1>
        </div>
      </div>
      <NotesTable
        columns={noteColumns}
        data={notes?.data || []}
      />
    </div>
  );
}
