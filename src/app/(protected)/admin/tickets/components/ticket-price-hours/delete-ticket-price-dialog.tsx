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
import { ticketPrice } from '@/types/ticket-price';
import { deleteTicketPriceSchema, DeleteTicketPriceSchemaType } from '@/schemas/ticket-price.schema';
import { deleteTicketPriceAction } from '@/actions/tickets/delete-ticket-precio.action';

const DELETE_TICKET_TEXT = 'Eliminar ticket';

export function DeleteTicketPriceDialog({ ticketPrice }: { ticketPrice: ticketPrice }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<DeleteTicketPriceSchemaType>({
    resolver: zodResolver(deleteTicketPriceSchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const onSubmit = (values: DeleteTicketPriceSchemaType) => {
    if (
      values.confirmation !== DELETE_TICKET_TEXT
    ) {
      toast.error('Los detalles de confirmación no coinciden.');
      return;
    }

    startTransition(() => {
      deleteTicketPriceAction(ticketPrice.id).then((data) => {
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
            className="w-full justify-start"
            size="sm"
            onClick={() => setOpen(true)}
          >
            Eliminar
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Precio Ticket</DialogTitle>
            <DialogDescription>
              Ingrese {DELETE_TICKET_TEXT} para confirmar.
            </DialogDescription>
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
