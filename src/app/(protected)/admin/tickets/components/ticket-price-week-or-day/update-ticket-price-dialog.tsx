'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketPrice } from '@/types/ticket-price';
import { updateTicketPriceSchema, UpdateTicketPriceSchemaType } from '@/schemas/ticket-price.schema';
import { updateTicketPriceAction } from '@/actions/tickets/update-ticket-price.action';
import { Hourglass, Loader2, Pencil } from 'lucide-react';

export function UpdateTicketPriceWeekOrDayDialog({ ticketPrice }: { ticketPrice: ticketPrice }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateTicketPriceSchemaType>({
    resolver: zodResolver(updateTicketPriceSchema),
    defaultValues: {
      ticketTimePrice: ticketPrice.ticketTimePrice || 0,
      ticketTimeType: ticketPrice.ticketTimeType || 'DIA',
      vehicleType: ticketPrice.vehicleType || 'AUTO',
    },
  });

  const onSubmit = async (values: UpdateTicketPriceSchemaType) => {
    startTransition(async () => {
      const data = await updateTicketPriceAction(ticketPrice.id, values);
      if (!data || data.error) {
        toast.error(data?.error?.message ?? 'Error desconocido');
      } else {
        toast.success('Precio de ticket editado exitosamente');
        form.reset();
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Pencil className="size-3.5" />
          Editar precio
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-gm-orange/40 bg-gm-orange/15 text-[#FF8458]">
              <Hourglass className="size-4" />
            </span>
            <div>
              <DialogTitle>Actualizar precio</DialogTitle>
              <DialogDescription className="mt-0.5">
                Modificá el precio por abono.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ticketTimeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Ticket</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isPending}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIA">Día/s</SelectItem>
                        <SelectItem value="SEMANA">Semana/s</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Vehículo</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isPending}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO">Auto</SelectItem>
                        <SelectItem value="CAMIONETA">Camioneta</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ticketTimePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de Ticket</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
              Guardar cambios
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
