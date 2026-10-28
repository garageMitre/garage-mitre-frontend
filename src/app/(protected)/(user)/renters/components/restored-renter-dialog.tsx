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
import { Customer } from '@/types/cutomer.type';
import { deleteCustomerSchema, DeleteCustomerSchemaType, RestoredCustomerSchemaType, restoredCustomerSchema } from '@/schemas/customer.schema';
import { restoredCustomerAction } from '@/actions/customers/restored-customer.action';
import { RecycleIcon, Rotate3DIcon } from 'lucide-react';

const RESTORED_RENTER_TEXT = 'Restaurar Inquilino';

export function RestoredRenterDialog({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<RestoredCustomerSchemaType>({
    resolver: zodResolver(restoredCustomerSchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const onSubmit = (values: RestoredCustomerSchemaType) => {
    if (values.confirmation !== RESTORED_RENTER_TEXT) {
      toast.error('Los detalles de confirmación no coinciden.');
      return;
    }

    startTransition(() => {
      restoredCustomerAction(customer.id).then((data) => {
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
            <Rotate3DIcon className="w-4 h-4" />
            Restaurar Inquilino
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Inquilino</DialogTitle>
            <DialogDescription>
              Ingrese {RESTORED_RENTER_TEXT} para confirmar.
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
                        placeholder={RESTORED_RENTER_TEXT}
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
                  Restaurar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
