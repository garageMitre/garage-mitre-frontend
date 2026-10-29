'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
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
import { interestSchema, InterestSchemaType } from '@/schemas/interest-schema';
import { createInterestAction } from '@/actions/customers/create-interest.action';
import { Interest } from '@/types/interest.type';

const ars = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

// Los intereses vigentes quedan a la vista y se editan desde un botón (antes la página era
// solo el formulario abierto y no se veía qué estaba configurado).
export function InterestsPanel({ interests }: { interests: Interest[] }) {
  const current = interests?.[0];
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<InterestSchemaType>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      interestOwner: current?.interestOwner || 0,
      interestRenter: current?.interestRenter || 0,
    },
  });

  const onSubmit = (values: InterestSchemaType) => {
    startTransition(() => {
      createInterestAction(values)
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
            return;
          }
          toast.success('Intereses actualizados exitosamente');
          setOpen(false);
          router.refresh();
        })
        .catch((error) => {
          console.error(error);
          toast.error(error.message || 'Error al guardar los intereses');
        });
    });
  };

  const stats = [
    { label: 'Propietarios', value: current?.interestOwner },
    { label: 'Inquilinos', value: current?.interestRenter },
  ];

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4">
        <div className="max-w-xl">
          <h2 className="text-base font-semibold">Intereses por atraso</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            El monto se suma al recibo pendiente cada 10 días, a los clientes que no pagaron pasados los
            10 días desde el 1 de cada mes.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (value) form.reset({ interestOwner: current?.interestOwner || 0, interestRenter: current?.interestRenter || 0 });
          }}
        >
          <DialogTrigger asChild>
            <Button className="h-9 gap-1.5 rounded-lg">
              <Pencil className="size-4" />
              Editar intereses
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar intereses</DialogTitle>
              <DialogDescription>Monto que se suma al recibo pendiente cada 10 días de atraso.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {([
                  ['interestOwner', 'Propietarios'],
                  ['interestRenter', 'Inquilinos'],
                ] as const).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        {/* FormControl va sobre el Input (no sobre el contenedor) para que la etiqueta lo nombre. */}
                        <div className="relative">
                          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">$</span>
                          <FormControl>
                            <Input disabled={isPending} type="number" inputMode="numeric" min={0} className="pl-7 tabular-nums" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Guardando…' : 'Guardar cambios'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>
      <dl className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card px-5 py-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">
              {stat.value != null ? ars(stat.value) : <span className="text-base font-normal text-muted-foreground">Sin configurar</span>}
            </dd>
            {stat.value != null && <p className="text-xs text-muted-foreground">cada 10 días de atraso</p>}
          </div>
        ))}
      </dl>
    </section>
  );
}
