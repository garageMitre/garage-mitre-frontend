"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { receiptSchema, ReceiptSchemaType } from "@/schemas/receipt.schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Receipt } from "@/types/receipt.type";

interface PaymentTypeReceiptDialogProps {
  open: boolean;
  onConfirm: (data: ReceiptSchemaType) => Promise<void>;
  onClose: () => void;
  receipt?: Receipt;
  customer?: { credit: number };
  customerType?: string; 
}

export function PaymentTypeReceiptDialog({
  open,
  onConfirm,
  onClose,
  receipt,
  customer,
  customerType
}: PaymentTypeReceiptDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ReceiptSchemaType>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      payments: [{ paymentType: "TRANSFER", price: undefined }],
      print: false,
      onAccount: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payments",
  });

  const onAccount = form.watch("onAccount");
  const paymentType = form.watch(`payments.0.paymentType`);
  const isCredit = paymentType === "CREDIT";

  // 🧹 Si selecciona crédito → limpiar otras formas y dejar solo CREDIT
  useEffect(() => {
    if (isCredit) {
      form.setValue("payments", [{ paymentType: "CREDIT", price: undefined }]);
    }
  }, [isCredit, form]);

  // 🧾 Si no es pago a cuenta y solo hay una forma, seteo automático del precio
  useEffect(() => {
    if (!onAccount && fields.length === 1 && receipt?.price) {
      form.setValue(`payments.0.price`, receipt.price);
    }
  }, [onAccount, fields.length, form, receipt?.price]);

  const handleSubmit = async (data: ReceiptSchemaType) => {
    try {
      setIsPending(true);
      // 🧠 Si no es pago a cuenta y hay una sola forma → aseguramos price correcto
      if (!data.onAccount && data.payments.length === 1 && receipt?.price) {
        data.payments[0].price = receipt.price;
      }

      await onConfirm(data);
      onClose();
      form.reset();
    } catch (err) {
      console.error("❌ Error al confirmar:", err);
    } finally {
      setIsPending(false);
    }
  };

  const typeOfCustomer =
  receipt?.customer?.customerType ||
  customerType ||
  null;


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Seleccionar forma(s) de pago</DialogTitle>

          {receipt && (
            <div className="mb-4 p-2 border rounded text-sm">
              <p>
                <strong>Recibo Nº:</strong> {receipt.receiptNumber}
              </p>
              <p>
                <strong>Estado:</strong>{" "}
                {receipt.status === "PAID" ? "Pagado" : "Pendiente"}
              </p>
              <p>
                <strong>Monto:</strong> ${receipt.startAmount}
              </p>
              {receipt.price > 0 && (
                <p>
                  <strong>Monto Restante:</strong> ${receipt.price}
                </p>
              )}
            </div>
          )}

          {isCredit && customer && (
            <div className="p-2 bg-muted rounded text-sm">
              <p>
                💳 <strong>Crédito disponible:</strong> ${customer.credit}
              </p>
            </div>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* ✅ Selector de pago a cuenta */}
            <FormField
              control={form.control}
              name="onAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Es un pago a cuenta?</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isPending}
                      onValueChange={(value) => field.onChange(value === "true")}
                      defaultValue={field.value?.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {fields.map((f, index) => (
              <div key={f.id} className="flex gap-4 items-end">
                {/* 🧾 Tipo de pago */}
                <FormField
                  control={form.control}
                  name={`payments.${index}.paymentType`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Tipo de pago</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {typeOfCustomer === "PRIVATE" ? (
                              <>
                                <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                <SelectItem value="CASH">Efectivo</SelectItem>
                                <SelectItem value="FIX">Correccion</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                <SelectItem value="CASH">Efectivo</SelectItem>
                                <SelectItem value="CHECK">Cheque</SelectItem>
                                <SelectItem value="CREDIT">Crédito</SelectItem>
                                <SelectItem value="FIX">Correccion</SelectItem>

                              </>
                            )}
                          </SelectContent>

                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                {/* 💰 Campo monto */}
                {!isCredit && (onAccount || fields.length > 1) && (
                  <FormField
                    control={form.control}
                    name={`payments.${index}.price`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel>Monto</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="$"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? undefined : Number(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isCredit && fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    x
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ paymentType: "CASH", price: undefined })}
              disabled={isCredit}
            >
              Agregar otra forma de pago
            </Button>

            <DialogFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Procesando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
