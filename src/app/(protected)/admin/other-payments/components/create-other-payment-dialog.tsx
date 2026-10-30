'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/swipe-toast/toast';
import { ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { otherPaymentSchema, OtherPaymentSchemaType } from '@/schemas/other-payment.schema';
import { createOtherPaymentAction } from '@/actions/other-payment/create-other-payment.action';
import { PAYMENT_TYPE } from '@/types/other-payment.type';

const TYPE_OPTIONS = [
  { value: 'EGRESOS', label: 'Egreso', icon: ArrowDownCircle, active: 'border-red-500/60 bg-red-500/10 text-red-400' },
  { value: 'INGRESOS', label: 'Ingreso', icon: ArrowUpCircle, active: 'border-green-500/60 bg-green-500/10 text-green-400' },
] as const;

// Antes era un formulario siempre abierto arriba de la tabla; ahora se abre desde el botón,
// como el resto de las altas de admin.
export function CreateOtherPaymentDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<OtherPaymentSchemaType>({
    resolver: zodResolver(otherPaymentSchema),
    defaultValues: {
      type: PAYMENT_TYPE[0],
      description: '',
      price: undefined,
    },
  });

  const onSubmit = (values: OtherPaymentSchemaType) => {
    startTransition(() => {
      createOtherPaymentAction(values)
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
            return;
          }
          toast.success(values.type === 'INGRESOS' ? 'Ingreso registrado exitosamente' : 'Egreso registrado exitosamente');
          form.reset({ type: values.type, description: '', price: '' as unknown as number });
          setOpen(false);
        })
        .catch((error) => {
          console.error(error);
          toast.error(error.message || 'Error al registrar el movimiento');
        });
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 gap-1.5 rounded-lg">
          <Plus className="size-4" />
          Registrar movimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
          <DialogDescription>Un ingreso o egreso de caja que no viene de tickets ni recibos.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <div role="radiogroup" aria-label="Tipo de movimiento" className="grid grid-cols-2 gap-2">
                      {TYPE_OPTIONS.map((option) => {
                        const selected = field.value === option.value;
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={isPending}
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              'flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
                              selected ? option.active : 'border-border text-muted-foreground hover:text-foreground',
                            )}
                          >
                            <Icon className="size-4" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} placeholder="Ej.: compra de lamparitas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  {/* FormControl va sobre el Input (no sobre el contenedor) para que la etiqueta lo nombre. */}
                  <div className="relative">
                    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">$</span>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="0"
                        className="pl-7 tabular-nums"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando…' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
