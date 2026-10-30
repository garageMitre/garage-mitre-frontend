'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/swipe-toast/toast';
import { Minus, Plus, RefreshCw } from 'lucide-react';
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
import { updateAmountCustomerAction } from '@/actions/customers/update-amount-customer.action';
import { amountCustomerSchema, AmountCustomerSchemaType } from '@/schemas/amount-customer.schema';

const ars = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

// El backend (CustomersService.updateAmount) no distingue entre los cuatro propietarios manuales:
// con cualquiera de ellos actualiza las cocheras de todos (Aznar y Fontela); sin propietario,
// las de Garage Mitre y terceros. Se muestran esos dos grupos reales en vez de cuatro nombres.
const GROUPS = [
  { value: '', label: 'Garage Mitre y terceros', description: 'Cocheras del garage y de propietarios particulares.' },
  { value: 'JOSE_RICARDO_AZNAR', label: 'Aznar y Fontela', description: 'Cocheras de José Ricardo y Carlos Alberto Aznar, Nidia y Aldo Fontela.' },
] as const;

const optionClass = (selected: boolean) =>
  cn(
    'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
    selected ? 'border-yellow-400/60 bg-yellow-400/10' : 'border-border hover:border-muted-foreground/40',
  );

export function UpdateAmountPanel() {
  const [open, setOpen] = useState(false);
  const [isNegative, setIsNegative] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AmountCustomerSchemaType>({
    resolver: zodResolver(amountCustomerSchema),
    defaultValues: { amount: undefined, customerType: 'RENTER', ownerTypeOfRenter: '' },
  });
  const amount = Number(form.watch('amount')) || 0;
  const group = GROUPS.find((g) => g.value === (form.watch('ownerTypeOfRenter') ?? '')) ?? GROUPS[0];

  const onSubmit = (values: AmountCustomerSchemaType) => {
    const finalAmount = isNegative ? -Math.abs(values.amount) : Math.abs(values.amount);
    startTransition(() => {
      updateAmountCustomerAction({ ...values, amount: finalAmount })
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
            return;
          }
          toast.success('Montos actualizados exitosamente');
          setOpen(false);
          form.reset({ amount: undefined, customerType: 'RENTER', ownerTypeOfRenter: values.ownerTypeOfRenter });
        })
        .catch((error) => {
          console.error(error);
          toast.error(error.message || 'Error al actualizar los montos');
        });
    });
  };

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div className="max-w-xl">
          <h2 className="text-base font-semibold">Actualizar el alquiler de los inquilinos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Suma o resta un monto al alquiler de cada cochera de un grupo de inquilinos. También ajusta el
            recibo pendiente de cada uno según cuántas cocheras tenga.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 gap-1.5 rounded-lg">
              <RefreshCw className="size-4" />
              Actualizar montos
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Actualizar montos</DialogTitle>
              <DialogDescription>Elegí el grupo de cocheras, si se suma o se resta y el monto por cochera.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="ownerTypeOfRenter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cocheras</FormLabel>
                      <FormControl>
                        <div role="radiogroup" aria-label="Grupo de cocheras" className="space-y-2">
                          {GROUPS.map((option) => {
                            const selected = (field.value ?? '') === option.value;
                            return (
                              <button key={option.label} type="button" role="radio" aria-checked={selected} disabled={isPending} onClick={() => field.onChange(option.value)} className={optionClass(selected)}>
                                <span className={cn('mt-0.5 size-3.5 shrink-0 rounded-full border', selected ? 'border-yellow-400 bg-yellow-400' : 'border-muted-foreground/50')} />
                                <span>
                                  <span className="block font-medium">{option.label}</span>
                                  <span className="block text-xs text-muted-foreground">{option.description}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <span className="text-sm font-medium">Operación</span>
                  <div role="radiogroup" aria-label="Operación" className="grid grid-cols-2 gap-2">
                    {[
                      { negative: false, label: 'Sumar', icon: Plus },
                      { negative: true, label: 'Restar', icon: Minus },
                    ].map(({ negative, label, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        role="radio"
                        aria-checked={isNegative === negative}
                        disabled={isPending}
                        onClick={() => setIsNegative(negative)}
                        className={cn(
                          'flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
                          isNegative === negative
                            ? negative
                              ? 'border-red-500/60 bg-red-500/10 text-red-400'
                              : 'border-green-500/60 bg-green-500/10 text-green-400'
                            : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <Icon className="size-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto por cochera</FormLabel>
                      {/* FormControl va sobre el Input (no sobre el contenedor) para que la etiqueta lo nombre. */}
                      <div className="relative">
                        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">$</span>
                        <FormControl>
                          <Input disabled={isPending} type="number" inputMode="numeric" min={0} placeholder="0" className="pl-7 tabular-nums" {...field} value={field.value ?? ''} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resumen antes de confirmar: es un cambio masivo. */}
                {amount > 0 && (
                  <p className="rounded-lg border bg-secondary/40 px-3 py-2 text-sm" aria-live="polite">
                    Se va a <strong>{isNegative ? 'restar' : 'sumar'} {ars(Math.abs(amount))}</strong> a cada cochera de{' '}
                    <strong>{group.label}</strong> y al recibo pendiente de cada inquilino.
                  </p>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending || amount <= 0}>
                    {isPending ? 'Actualizando…' : 'Confirmar'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>
    </section>
  );
}
