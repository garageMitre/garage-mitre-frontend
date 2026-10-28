import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ticketRegistrationForDaySchema, TicketRegistrationForDaySchemaType } from "@/schemas/ticket-registration-for-day.schema";
import { createTicketRegistrationForDayAction } from "@/actions/tickets/create-ticket-registration-for-day.action";

export function CreateTicketRegistrationDialog({ setIsDialogOpen }: { setIsDialogOpen: (open: boolean) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [ticketType, setTicketType] = useState<'DIA' | 'SEMANA' | 'SEMANA_Y_DIA'>('DIA'); // Estado para manejar el tipo de selección

  

  const form = useForm<TicketRegistrationForDaySchemaType>({
    resolver: zodResolver(ticketRegistrationForDaySchema),
    defaultValues: {
      firstNameCustomer: '',
      lastNameCustomer: '',
      vehiclePlateCustomer: '',
      paid: true,
      retired:false,
      ticketTimeType: 'DIA',
      vehicleType: 'AUTO',
      weeks: undefined,
      days: undefined,
    },
  });

const onSubmit = async (values: TicketRegistrationForDaySchemaType) => {
  await createTicketRegistrationForDayAction(values);
  toast.success("Ticket creado exitosamente");

  // Resetea el formulario
  form.reset({
    ticketTimeType: 'DIA', // Puedes establecer los valores por defecto
    weeks: undefined,
    days: undefined,
    firstNameCustomer: '',
    lastNameCustomer: '',
    vehiclePlateCustomer: '',
    paid: true,
    retired:false,
  });

  // Restablece también el tipo de ticket visualmente
  setTicketType('DIA');

  // Cierra los diálogos
  setIsOpen(false);
  setIsDialogOpen(false);
};
  return (
    <div className="text-center mt-8">
      <Button
      variant="default"
      size="sm"
      onClick={() => {
        setIsOpen(true);
        setIsDialogOpen(true);
      }}
      className="bg-yellow-400 text-black hover:bg-yellow-500 text-black cursor-pointer text-lg font-bold"
    >
      Crear Ticket Por Día/semana
    </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg">
          <DialogHeader className="items-center">
            <DialogTitle>Crear Ticket Por Día/semana</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Select para elegir entre Día o Semana */}
            <FormField
              control={form.control}
              name="ticketTimeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Ticket</FormLabel>
                  <FormControl>
                  <Select
                    disabled={isPending}
                    onValueChange={(value) => {
                      setTicketType(value as 'DIA' | 'SEMANA' | 'SEMANA_Y_DIA');
                      field.onChange(value); // ✅ ACTUALIZA EL FORMULARIO
                    }}
                    value={field.value} // también puede ser útil para mantenerlo sincronizado
                  >

                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIA">Dia/s</SelectItem>
                        <SelectItem value="SEMANA">Semana/s</SelectItem>
                        <SelectItem value="SEMANA_Y_DIA">Semana/s y Dia/s</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              {/* Campo para días */}
              {ticketType === 'DIA' && (
                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seleccione la Cantidad de dia/s</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={String(field.value) || '1'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione cantidad" />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 overflow-y-auto">
                            {[1, 2, 3, 4, 5, 6].map((days) => (
                              <SelectItem key={days} value={String(days)}>
                                {days} dia/s
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Campo para semanas */}
              {ticketType === 'SEMANA' && (
                <FormField
                  control={form.control}
                  name="weeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seleccione la Cantidad de semana/s</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={String(field.value) || '1'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione cantidad" />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 overflow-y-auto">
                            {[1, 2, 3, 4, 5, 6].map((weeks) => (
                              <SelectItem key={weeks} value={String(weeks)}>
                                {weeks} semana/s
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {ticketType === 'SEMANA_Y_DIA' && (
                <>
                <FormField
                  control={form.control}
                  name="weeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seleccione la Cantidad de semana/s</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={String(field.value) || '1'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione cantidad" />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 overflow-y-auto">
                            {[1, 2, 3, 4, 5, 6].map((weeks) => (
                              <SelectItem key={weeks} value={String(weeks)}>
                                {weeks} semana/s
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seleccione la Cantidad de dia/s</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={String(field.value) || '1'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione cantidad" />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 overflow-y-auto">
                            {[1, 2, 3, 4, 5, 6].map((days) => (
                              <SelectItem key={days} value={String(days)}>
                                {days} dia/s
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </>
              )}
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Vehículo</FormLabel>
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
                          <SelectItem value="AUTO">Auto</SelectItem>
                          <SelectItem value="CAMIONETA">Camioneta</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstNameCustomer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Del Cliente (opcional)</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} placeholder="Escriba Nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                  control={form.control}
                  name="lastNameCustomer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido Del Cliente (obligatorio)</FormLabel>
                      <FormControl>
                        <Input disabled={isPending} placeholder="Escriba Apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehiclePlateCustomer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patente (opcional)</FormLabel>
                      <FormControl>
                        <Input disabled={isPending} placeholder="Escriba Patente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  <FormField
                    control={form.control}
                    name="paid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>¿El cliente realizó el pago?</FormLabel>
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


              <Button className="w-full" type="submit">
                Crear Ticket
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
