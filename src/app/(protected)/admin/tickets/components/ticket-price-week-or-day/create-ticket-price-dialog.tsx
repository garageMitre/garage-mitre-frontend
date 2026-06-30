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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ticketPriceSchema, TicketPriceSchemaType } from '@/schemas/ticket-price.schema';
import { createTicketPriceAction } from '@/actions/tickets/create-ticket-price.action';
import { Hourglass, Loader2, Plus } from 'lucide-react';

export function CreateTicketPriceWeekOrDayDialog() {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<TicketPriceSchemaType>({
    resolver: zodResolver(ticketPriceSchema),
    defaultValues: {
      ticketTimePrice: undefined,
      ticketTimeType: 'DIA',
      vehicleType: 'AUTO'
    },
  });

  const onSubmit = (values: TicketPriceSchemaType) => {
    startTransition(async () => {
      const data = await createTicketPriceAction(values);
      if (!data || data.error) {
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : data.error.message;
        toast.error(errorMessage);
      } else {
        toast.success('Precio de ticket creado exitosamente');
        form.reset();
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 rounded-md text-[12px] font-semibold">
          <Plus className="size-3.5" />
          Nuevo precio
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-gm-orange/40 bg-gm-orange/15 text-[#FF8458]">
              <Hourglass className="size-4" />
            </span>
            <div>
              <DialogTitle>Nuevo precio por abono</DialogTitle>
              <DialogDescription className="mt-0.5">
                Definí el precio por día o semana según vehículo.
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
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Crear precio
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
