'use client';

import { Plus } from 'lucide-react';
import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
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
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parkingTypeSchema, ParkingTypeSchemaType } from '@/schemas/parking-type.schema';
import { createParkingTypeAction } from '@/actions/parking-type/create-parking-type.action';

export function CreateParkingTypeDialog() {
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<ParkingTypeSchemaType>({
    resolver: zodResolver(parkingTypeSchema),
    defaultValues: {
      amount: 0,
      parkingType: 'EXPENSES_1',
    },
  });

  const onSubmit = (values: ParkingTypeSchemaType) => {
    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      const data = await createParkingTypeAction(values); // Se almacena el resultado de la acción en 'data'
    
      if (!data || data.error) {
        // Verifica si data.error es un string o un objeto antes de acceder a 'message'
        const errorMessage = typeof data.error === 'string' 
          ? data.error // Si el error es solo un string, mostramos ese mensaje
          : data.error.message; // Si el error es un objeto, accedemos a 'message'
  
        toast.error(errorMessage); // Mostramos el mensaje de error
      } else {
        toast.success('Tipo de Estacionamiento creado exitosamente');
        form.reset();
        setOpen(false);
      }
    });
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 gap-1.5 rounded-lg" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Crear Tipo de Estacionamiento
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg">
        <DialogHeader className="items-center">
          <DialogTitle>Crear Tipo de Estacionamiento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="parkingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Estacionamiento</FormLabel>
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
                        <SelectItem value="EXPENSES_1">Expensas 1</SelectItem>
                        <SelectItem value="EXPENSES_2">Expensas 2</SelectItem>
                        <SelectItem value="EXPENSES_ZOM_1">Expensas salon 1</SelectItem>
                        <SelectItem value="EXPENSES_ZOM_2">Expensas salon 2</SelectItem>
                        <SelectItem value="EXPENSES_ZOM_3">Expensas salon 3</SelectItem>
                        <SelectItem value="EXPENSES_RICARDO_AZNAR">Expensas Ricado Aznar</SelectItem>
                        <SelectItem value="EXPENSES_CARLOS_AZNAR">Expensas Carlos Aznar</SelectItem>
                        <SelectItem value="EXPENSES_ALDO_FONTELA">Expensas Aldo Fontela</SelectItem>
                        <SelectItem value="EXPENSES_NIDIA_FONTELA">Expensas Nidia Fontela</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          <Button className="w-full" type="submit" disabled={isPending}>
            Crear
          </Button>
        </form>
      </Form>
      </DialogContent>
    </Dialog>
  );
}

