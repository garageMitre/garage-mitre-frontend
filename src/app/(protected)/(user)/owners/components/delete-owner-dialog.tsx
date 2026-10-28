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
import { deleteCustomerAction } from '@/actions/customers/delete-customer.action';
import { deleteCustomerSchema, DeleteCustomerSchemaType } from '@/schemas/customer.schema';
import { Customer } from '@/types/cutomer.type';
import { Trash } from 'lucide-react';

const DELETE_OWNER_TEXT = 'Eliminar Propietario';

export function DeleteOwnerDialog({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<DeleteCustomerSchemaType>({
    resolver: zodResolver(deleteCustomerSchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const onSubmit = (values: DeleteCustomerSchemaType) => {
    if (values.confirmation !== DELETE_OWNER_TEXT) {
      toast.error('Los detalles de confirmación no coinciden.');
      return;
    }

    startTransition(async () => {
      const data = await deleteCustomerAction(customer.id);
    
      if ('error' in data) {
        toast.error(data.error.message);
      } else {
        toast.success('Propietario y vehículos eliminados exitosamente');
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
            <Trash className="w-4 h-4" />
            Eliminar Propietario
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Propietario</DialogTitle>
            <DialogDescription>
              Ingrese {DELETE_OWNER_TEXT} para confirmar.Se eliminara de forma permanente.
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
                        placeholder={DELETE_OWNER_TEXT}
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
