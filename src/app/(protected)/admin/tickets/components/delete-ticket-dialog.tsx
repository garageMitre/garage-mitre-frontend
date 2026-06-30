'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Ticket } from '@/types/ticket.type';
import { deleteTicketSchema, DeleteTicketSchemaType } from '@/schemas/ticket.schema';
import { deleteTicketAction } from '@/actions/tickets/delete-ticket.action';
import { Trash2 } from 'lucide-react';

const DELETE_TICKET_TEXT = 'Eliminar ticket';

export function DeleteTicketDialog({ ticket }: { ticket: Ticket }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<DeleteTicketSchemaType>({
    resolver: zodResolver(deleteTicketSchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const onSubmit = (values: DeleteTicketSchemaType) => {
    if (
      values.confirmation !== DELETE_TICKET_TEXT
    ) {
      toast.error('Los detalles de confirmación no coinciden.');
      return;
    }

    startTransition(() => {
      deleteTicketAction(ticket.id).then((data) => {
        if (!data || data.error) {
          toast.error(data.error);
        } else {
          toast.success(data.success);
          form.reset();
          setOpen(false);
        }
      });
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-[#F08775] hover:text-[#F08775] hover:bg-destructive/15"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Eliminar ticket
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md border border-destructive/40 bg-destructive/15 text-[#F08775]">
                <Trash2 className="size-4" />
              </span>
              <div>
                <DialogTitle>Eliminar ticket</DialogTitle>
                <DialogDescription className="mt-0.5">
                  Ingresá {DELETE_TICKET_TEXT} para confirmar.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmación</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        placeholder={DELETE_TICKET_TEXT}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={isPending}
                >
                  Eliminar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
