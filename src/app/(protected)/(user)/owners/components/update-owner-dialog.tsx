'use client';

import { useState } from 'react';
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
import { updateCustomerAction } from '@/actions/customers/update-customer.action';
import { Customer } from '@/types/cutomer.type';
import {
  updateCustomerSchema,
  UpdateCustomerSchemaType,
} from '@/schemas/customer.schema';
import { Edit, X } from 'lucide-react';
import { PARKING_TYPE } from '@/types/vehicle.type';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParkingType } from '@/types/parking-type';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from '@/components/ui/checkbox';


export function UpdateOwnerDialog({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'customer' | 'vehicles'>('customer');
  const [isPending, setIsPending] = useState(false);

  const form = useForm<Partial<UpdateCustomerSchemaType>>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      firstName: customer.firstName ?? '',
      lastName: customer.lastName ?? '',
      phone: customer.phone ?? '',
      numberOfVehicles: customer.numberOfVehicles ?? 0,
      comments: customer.comments ?? "",
      customerType: customer.customerType ?? 'OWNER',
      hasDebt: customer.hasDebt || false,
      monthsDebt: customer.monthsDebt || [],
      credit: customer.credit || 0,
      vehicles: customer.vehicles?.map((vehicle) => ({
        id:vehicle.id ?? "",
        garageNumber: vehicle.garageNumber ?? "",
        parking: vehicle.parkingType?.parkingType ?? PARKING_TYPE[0],
        rent: vehicle.rent ,
        amountRenter: vehicle.amountRenter || 0
      })) ?? [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'vehicles',
  });
  const handleCustomerSubmit = (values: Partial<UpdateCustomerSchemaType>) => {
    const numberOfVehicles = values.numberOfVehicles ?? 0;
    const currentVehicles = form.getValues('vehicles') ?? [];
  
    // Si el número de vehículos es mayor, añadimos vehículos nuevos con los valores por defecto
    if (currentVehicles.length < numberOfVehicles) {
      const vehiclesToAdd = Array.from(
        { length: numberOfVehicles - currentVehicles.length },
        (_, index) => ({
          rent: false,
          garageNumber:  '',
          parking: PARKING_TYPE[1], 
          amountRenter: 0
        })
      );
      // Aquí estamos asegurándonos de que los valores de parking de los vehículos existentes se mantengan
      replace([...currentVehicles, ...vehiclesToAdd]);
    } else if (currentVehicles.length > numberOfVehicles) {
      // Si hay menos vehículos, eliminamos los vehículos extra
      replace(currentVehicles.slice(0, numberOfVehicles));
    }
  
    setPhase('vehicles');
  };
  

  const handleVehiclesSubmit = async (values: Partial<UpdateCustomerSchemaType>) => {
    if (!values.hasDebt) {
    values.monthsDebt = [];
  }
    setIsPending(true);
    try {
      const data = await updateCustomerAction(customer.id, values);
  
      if (!data || data.error) {
        toast.error(data?.error?.message ?? 'Error desconocido');
      } else {
        toast.success('Propietario y vehículos actualizados exitosamente');
        setOpen(false);
        setPhase('customer');
        form.reset();
      }
    } catch (error) {
      toast.error('Error inesperado');
    } finally {
      setIsPending(false);
    }
  };

  const today = new Date();
const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), 1);

const monthOptions = Array.from({ length: 12 }).map((_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  const value = d.toISOString().slice(0, 7); // "YYYY-MM"
  const label = d.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
  const isDisabled = d < oneYearAgo;

  return { value, label, isDisabled };
})
// Filtrar el mes actual
.filter(option => {
  const currentMonth = today.toISOString().slice(0, 7);
  return option.value !== currentMonth;
});


   const hasDebt = form.watch('hasDebt');

  const formattedMonth = (month: string) =>
  month.length === 7 ? `${month}-01` : month;

  

  

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Edit className="w-4 h-4" />
          Editar Propietario
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg">
        <DialogHeader className="items-center">
          <DialogTitle>
            {phase === 'customer' ? 'Editar Cliente' : 'Editar Cocheras'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
             onSubmit={form.handleSubmit(
              phase === 'customer' ? handleCustomerSubmit : handleVehiclesSubmit
            )}
            className="space-y-4"
          >
            {/* Formulario de Cliente */}
            {phase === 'customer' && (
              <>
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input disabled={isPending} placeholder="Escriba Nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input disabled={isPending} placeholder="Escriba Apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Celular</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isPending}
                          placeholder="Escriba número de celular"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfVehicles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Cocheras</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={isPending}
                          min={1}
                          placeholder="Escriba número de vehículos"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                             <FormField control={form.control} name="hasDebt"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>¿Tiene deudas?</FormLabel>
                                      <FormControl>
                                        <Select
                                          disabled={isPending}
                                          onValueChange={v => field.onChange(v === 'true')}
                                          value={field.value?.toString()}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Seleccione"/>
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="true">Sí</SelectItem>
                                            <SelectItem value="false">No</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage/>
                                    </FormItem>
                                  )}
                                /> 
                                {hasDebt && (
                            <FormField
                              control={form.control}
                              name="monthsDebt"
                              render={() => (
                                <FormItem>
                                  <FormLabel>Meses adeudados</FormLabel>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      Selecciona meses
                      <span className="ml-2">&#x25BC;</span>
                    </Button>
                  </PopoverTrigger>

                    <PopoverContent
                      side="bottom"
                      align="start"
                      sideOffset={8}
                      avoidCollisions={false}
                      className="w-[300px] p-2 shadow-lg rounded-md z-50"
                    >
                      <Command>
                        <CommandList className="max-h-[260px] overflow-y-auto">
                          <CommandGroup>
                            {monthOptions.map(option => {
                              const monthKey = formattedMonth(option.value);
                              const current = form.getValues('monthsDebt') ?? [];
                              const isSelected = current.some(d => d.month === monthKey);

                              return (
                                <CommandItem
                                  key={option.value}
                                  onSelect={() => {
                                    if (option.isDisabled) return;

                                    if (isSelected) {
                                      form.setValue(
                                        'monthsDebt',
                                        current?.filter(d => d.month !== monthKey)
                                      );
                                    } else {
                                      form.setValue('monthsDebt', [
                                        ...current,
                                        { month: monthKey, amount: 0 }
                                      ]);
                                    }
                                  }}
                                  className={`flex items-center justify-between gap-2 ${
                                    option.isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                  }`}
                                  style={{ pointerEvents: option.isDisabled ? 'none' : 'auto' }}
                                >
                                  {option.label}
                                  <Checkbox checked={isSelected} />
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>

                </Popover>

                
                            <div className="mt-4 space-y-3">
                              {form.watch('monthsDebt')
                                ?.filter(entry => {
                                  // Busco ese mes en customer.monthsDebt para ver su status
                                  const monthStatus = customer.monthsDebt?.find(m => m.month === entry.month)?.status;
                                  return monthStatus !== 'PAID'; // Solo muestro si no está pagado
                                })
                                .map((entry, index) => {
                                  const label = monthOptions.find(opt =>
                                    formattedMonth(opt.value) === entry.month
                                  )?.label ?? entry.month;

                                  return (
                                    <div key={entry.month} className="flex items-center mt-5 gap-4">
                                      <span className="w-40 text-sm text-white">{label} :</span>
                                      $
                                      <Input
                                        type="number"
                                        min={0}
                                        step={1}
                                        className="w-40"
                                        value={entry.amount}
                                        onChange={(e) =>
                                          form.setValue(
                                            `monthsDebt.${index}.amount`,
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </div>
                                  );
                                })}
                            </div>

                
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                
                                )} 
                
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentario</FormLabel>
                      <FormControl>
                        <Textarea disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

            <FormField
              control={form.control}
              name="credit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crédito Existente ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      disabled={isPending}
                      placeholder="Actualizar Monto"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              </>
            )}

            {/* Formulario de Vehículos */}
            {phase === 'vehicles' && (
              <>
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.garageNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Cochera</FormLabel>
                          <FormControl>
                          <Input disabled={isPending} placeholder="Numero de cochera" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
            <FormField
              control={form.control}
              name={`vehicles.${index}.parking`}
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
                      <SelectItem value="EXPENSES_1">Expensas 1</SelectItem>
                        <SelectItem value="EXPENSES_2">Expensas 2</SelectItem>
                        <SelectItem value="EXPENSES_ZOM_1">Expensas salon 1</SelectItem>
                        <SelectItem value="EXPENSES_ZOM_2">Expensas salon 2</SelectItem>
                        <SelectItem value="EXPENSES_ZOM_3">Expensas salon 3</SelectItem>
                        <SelectItem value="EXPENSES_RICARDO_AZNAR">Expensas Ricado Aznar</SelectItem>
                        <SelectItem value="EXPENSES_ALDO_FONTELA">Expensas Aldo Fontela</SelectItem>
                        <SelectItem value="EXPENSES_NIDIA_FONTELA">Expensas Nidia Fontela</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                <FormField
                  control={form.control}
                  name={`vehicles.${index}.rent`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Este propietario usa esta cochera para alquilar?</FormLabel>
                      <FormControl>
                      <Select
                      disabled={isPending}
                      onValueChange={(value) => field.onChange(value === 'true')}
                      value={field.value?.toString()}
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
                {form.watch(`vehicles.${index}.rent`) === true && (
                <FormField
                control={form.control}
                name={`vehicles.${index}.amountRenter`}
                render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto de Alquiler</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ingrese el monto"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                )}
                />
                )}
                    <div className='p-5'>
                    <Separator/>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="flex items-center justify-end gap-2">
              {phase === 'vehicles' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPhase('customer')}
                >
                  Atrás
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {phase === 'customer' ? 'Siguiente' : 'Confirmar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
