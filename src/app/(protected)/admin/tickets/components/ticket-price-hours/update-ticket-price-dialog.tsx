'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useTransition } from 'react';
import {
  updateUserPassword,
  UpdateUserPasswordType,
  updateUserSchema,
  UpdateUserSchemaType,
} from '@/schemas/user.schema';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePassword } from '@/actions/users/update-password.action';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getUserByUsername } from '@/services/users.service';
import { useCurrentUser } from '@/hooks/auth/use-current-user';
import { updateUserAction } from '@/actions/users/update-user.action';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User } from '@/types/user.type';
import { Ticket } from '@/types/ticket.type';
import { updateTicketSchema, UpdateTicketSchemaType } from '@/schemas/ticket.schema';
import { updateTicketAction } from '@/actions/tickets/update-ticket.action';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ticketPrice } from '@/types/ticket-price';
import { updateTicketPriceSchema, UpdateTicketPriceSchemaType } from '@/schemas/ticket-price.schema';
import { updateTicketPriceAction } from '@/actions/tickets/update-ticket-price.action';


export function UpdateTicketPriceDialog({ ticketPrice }: { ticketPrice: ticketPrice }) {

  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateTicketPriceSchemaType>({
    resolver: zodResolver(updateTicketPriceSchema),
    defaultValues: {
      price: ticketPrice.price,
      ticketDayType: ticketPrice.ticketDayType || 'DAY',
      vehicleType: ticketPrice.vehicleType || 'AUTO',
    },
  });


  const onSubmit = async (values: UpdateTicketPriceSchemaType) => {
    startTransition(async() => {
      const data = await updateTicketPriceAction(ticketPrice.id, values);
      if (!data || data.error) {
        toast.error(data?.error?.message ?? 'Error desconocido');
      } else {
        toast.success('Precio ticket editado exitosamente');
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
            Editar Ticket
          </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg">
        <DialogHeader className="items-center">
          <DialogTitle>Actualizar Precio Ticket</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="price"
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
{/* Campo solo lectura: Tipo de Horario */}
<FormField
  control={form.control}
  name="ticketDayType"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tipo de Horario</FormLabel>
      <FormControl>
        <p className="border border-input rounded-md px-3 py-2 text-sm bg-muted">
          {field.value === 'DAY' ? 'Día' : field.value === 'NIGHT' ? 'Noche' : ''}
        </p>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Campo solo lectura: Tipo de Vehículo */}
<FormField
  control={form.control}
  name="vehicleType"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tipo de Vehículo</FormLabel>
      <FormControl>
        <p className="border border-input rounded-md px-3 py-2 text-sm bg-muted">
          {field.value === 'AUTO' ? 'Auto' : field.value === 'CAMIONETA' ? 'Camioneta' : ''}
        </p>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

            <Button className="w-full" type="submit" disabled={isPending}>
              Editar Precio Ticket
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
