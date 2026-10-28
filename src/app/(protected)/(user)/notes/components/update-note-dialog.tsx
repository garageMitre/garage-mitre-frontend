'use client';

import { Button } from '@/components/ui/button';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Note } from '@/types/note.type';
import { updateNoteSchema, UpdateNoteSchemaType } from '@/schemas/note.schema';
import { updateNoteAction } from '@/actions/notes/update-note.action';
import { Textarea } from '@/components/ui/textarea';


export function UpdateNoteDialog({ note }: { note: Note }) {

  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateNoteSchemaType>({
    resolver: zodResolver(updateNoteSchema),
    defaultValues: {
      description: note.description || '',
    },
  });


  const onSubmit = async (values: UpdateNoteSchemaType) => {
    startTransition(async () => {
      const response = await updateNoteAction(note.id, values);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Aviso actualizado exitosamente');
        form.reset();
        setOpen(false);
      }
    });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
      <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
            onClick={() => setOpen(true)}
          >
            Editar Aviso
          </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg">
        <DialogHeader className="items-center">
          <DialogTitle>Editar Aviso</DialogTitle>
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
              Editar Aviso
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
