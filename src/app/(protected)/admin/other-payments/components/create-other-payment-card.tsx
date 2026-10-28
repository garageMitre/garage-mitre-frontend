"use client"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useTransition, useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { otherPaymentSchema, OtherPaymentSchemaType } from "@/schemas/other-payment.schema";
import { createOtherPaymentAction } from "@/actions/other-payment/create-other-payment.action";
import { PAYMENT_TYPE } from "@/types/other-payment.type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function CardOtherPayment({ className }: { className?: string }) {
    const [error, setError] = useState<string | undefined>('');
    const [success, setSuccess] = useState<string | undefined>('');
    const [isPending, startTransition] = useTransition();

    const form = useForm<OtherPaymentSchemaType>({
        resolver: zodResolver(otherPaymentSchema),
        defaultValues: {
            type: PAYMENT_TYPE[0],
            description: "",
            price: undefined,
        },
    });

const onSubmit = (values: OtherPaymentSchemaType) => {
  setError(undefined);
  setSuccess(undefined);

  startTransition(() => {
    createOtherPaymentAction(values)
      .then((data) => {
        if (data.error) {
          setError(data.error);
          toast.error(data.error);
        } else {
          setSuccess(data.success);
          toast.success('Gasto Registrado exitosamente');

          // 🔁 Reset del formulario solo si la acción fue exitosa
          form.reset({
            description: "",
            price: "" as unknown as number
          });
        }
      })
      .catch((error) => {
        console.error(error);
        setError('Error al crear pago');
        toast.error(error.message || 'Error desconocido');
      });
  });
};

    return (
        <Card className={`w-3/5 h-full flex flex-col ${className} mx-auto my-auto flex justify-center`}>
            <CardHeader>
                <CardTitle>Varios</CardTitle>
                <CardDescription>Registra Ingresos o Egresos</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex flex-col h-full">

                    <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
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
                        <SelectItem value="EGRESOS">Egreso</SelectItem>
                        <SelectItem value="INGRESOS">Ingreso</SelectItem>
                      </SelectContent>
                    </Select>
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
                                    <FormLabel className="flex items-center gap-2">
                                        Descripcion 
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
                        <div className="flex-grow"></div> 
                        <Button className="w-full" type="submit" disabled={isPending}>
                            Crear
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
