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
import { toast } from '@/components/swipe-toast/toast';
import { deleteCustomerAction } from '@/actions/customers/delete-customer.action';
import { deleteCustomerSchema, DeleteCustomerSchemaType } from '@/schemas/customer.schema';
import { Customer } from '@/types/cutomer.type';
import { Trash, X } from 'lucide-react';
import { deleteRegistrationForDaySchema, DeleteRegistrationForDaySchemaType } from '@/schemas/ticket-registration-for-day.schema';
import { TicketRegistrationForDay } from '@/types/ticket-registration-for-day.type';
import { deleteTicketRegistrationForDay } from '@/services/tickets.service';
import { useSession } from 'next-auth/react';
import { deleteTicketRegistrationForDayAction } from '@/actions/tickets/delete-ticket-registration-for-day.action';


const DELETE_TICKET_TEXT = 'Eliminar Ticket';

export function DeleteTicketRegistrationForDayDialog({ ticket }: { ticket: TicketRegistrationForDay }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const session = useSession();
  

  const form = useForm<DeleteRegistrationForDaySchemaType>({
    resolver: zodResolver(deleteRegistrationForDaySchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const onSubmit = (values: DeleteRegistrationForDaySchemaType) => {

    startTransition(async () => {
      const data = await deleteTicketRegistrationForDayAction(ticket.id, session.data?.token);
    
      if ('error' in data) {
        toast.error(data.error);
      } else {
        toast.success('Ticket eliminado exitosamente');
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
            className="w-full justify-center text-red-600 hover:text-red-800"
            size="sm"
            onClick={() => setOpen(true)}
          >
            ❌
          </Button>

        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Ticket</DialogTitle>
            <DialogDescription>
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
