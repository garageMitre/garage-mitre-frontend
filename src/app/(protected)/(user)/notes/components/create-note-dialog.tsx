'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ticketSchema, TicketSchemaType } from '@/schemas/ticket.schema';
import { createTicketAction } from '@/actions/tickets/create-ticket.action';
import { noteSchema, NoteSchemaType } from '@/schemas/note.schema';
import { createNoteAction } from '@/actions/notes/create-note.action';
import { useSession } from 'next-auth/react';
import { Textarea } from '@/components/ui/textarea';

export function CreateNoteDialog() {
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const session = useSession();

  const form = useForm<NoteSchemaType>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      description: ''
    },
  });

  const onSubmit = (values: NoteSchemaType) => {
    setError(undefined);
    setSuccess(undefined);

    startTransition(() => {
      createNoteAction(values, session.data?.user.id || "")
        .then((data) => {
          setError(data.error);
          setSuccess(data.success);
          toast.success('Aviso creado exitosamente');
          setOpen(false)
          window.dispatchEvent(new Event('new-note-created'));
        })
        .catch((error) => {
          console.error(error);
          setError('Error al crear el Aviso');
          toast.error(error);
        });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" onClick={() => setOpen(true)}>
          Crear Aviso
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg">
        <DialogHeader className="items-center">
          <DialogTitle>Crear Aviso</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripcion</FormLabel>
                  <FormControl>
                    <Textarea disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit" disabled={isPending}>
              Crear Aviso
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
