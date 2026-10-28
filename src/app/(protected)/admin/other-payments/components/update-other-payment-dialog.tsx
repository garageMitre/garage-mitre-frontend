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
import { startTransition, useState, useTransition } from 'react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ParkingType } from '@/types/parking-type';
import { updateParkingTypeSchema, UpdateParkingTypeSchemaType } from '@/schemas/parking-type.schema';
import { updateParkingTypeAction } from '@/actions/parking-type/update-parking-type.action';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OtherPayment } from '@/types/other-payment.type';
import { updateOtherPaymentSchema, updateOtherPaymentSchemaType } from '@/schemas/other-payment.schema';
import { updateExpenseAction } from '@/actions/other-payment/update-other-payment.action';


export function UpdateExpenseDailog({ expense }: { expense: OtherPayment }) {
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<updateOtherPaymentSchemaType>({
    resolver: zodResolver(updateOtherPaymentSchema),
    defaultValues: {
      description: expense.description,
      price: expense.price
    },
  });


  const onSubmit = async (values: updateOtherPaymentSchemaType) => {
    startTransition(async () => {
      const response = await updateExpenseAction(expense.id, values);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Gasto actualizado exitosamente');
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
            className="w-full justify-start gap-2 px-2 font-normal"
            size="sm"
            onClick={() => setOpen(true)}
          >
            Editar
          </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg">
        <DialogHeader className="items-center">
          <DialogTitle>Editar Gasto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        Descripcion del gasto 
                                    </FormLabel>
                                    <FormControl>
                                        <Input disabled={isPending} {...field} />
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
                                    <FormLabel className="flex items-center gap-2">
                                        Monto 
                                    </FormLabel>
                                    <FormControl>
                                        <Input disabled={isPending} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
            <Button className="w-full" type="submit" disabled={isPending}>
              Editar
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
