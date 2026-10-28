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
import { DeleteUserSchemaType, deleteUserSchema } from '@/schemas/user.schema';

import { toast } from 'sonner';
import { User } from '@/types/user.type';
import { deleteUserAction } from '@/actions/users/delete-user.action';
import { ParkingType } from '@/types/parking-type';
import { deleteParkingTypeSchema, DeleteParkingTypeSchemaType } from '@/schemas/parking-type.schema';
import { deleteParkingTypeAction } from '@/actions/parking-type/delete-parking-type.action';

const DELETE_PARKING_TYPE_TEXT = 'Eliminar Tipo de Estacionamiento';

export function DeleteParkingTypeDialog({ parkingType }: { parkingType: ParkingType }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<DeleteParkingTypeSchemaType>({
    resolver: zodResolver(deleteParkingTypeSchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const onSubmit = (values: DeleteParkingTypeSchemaType) => {
    if (
      values.confirmation !== DELETE_PARKING_TYPE_TEXT
    ) {
      toast.error('Los detalles de confirmación no coinciden.');
      return;
    }

    startTransition(() => {
      deleteParkingTypeAction(parkingType.id).then((data) => {
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
            className="w-full justify-start gap-2 px-2 font-normal text-red-500 hover:text-red-500"
            size="sm"
            onClick={() => setOpen(true)}
          >
            Eliminar
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Tipo de Estacionamiento</DialogTitle>
            <DialogDescription>
              Ingrese {DELETE_PARKING_TYPE_TEXT} para confirmar.
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
                        placeholder={DELETE_PARKING_TYPE_TEXT}
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
                  variant="destructive"
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
