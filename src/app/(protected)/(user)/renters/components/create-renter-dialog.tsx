'use client';

import { useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { createCustomerAction } from '@/actions/customers/create-customer.action';
import { customerSchema, CustomerSchemaType } from '@/schemas/customer.schema';
import { Vehicle } from '@/types/vehicle.type';
import { CustomerStepperShell } from '@/components/customer-stepper-shell';
import { RenterPhase2 } from '@/components/renter-phase-2';

export function CreateRenterDialog({
  customersRenters,
}: {
  customersRenters: Vehicle[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CustomerSchemaType>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      comments: '',
      customerNumber: undefined,
      numberOfVehicles: 1,
      customerType: 'RENTER',
      hasDebt: false,
      monthsDebt: [],
      vehicleRenters: [],
      credit: 0,
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'vehicleRenters',
  });

  const handleNext = (values: CustomerSchemaType) => {
    const n = values.numberOfVehicles;
    const current = form.getValues('vehicleRenters') ?? [];
    if (current.length < n) {
      replace([
        ...current,
        ...Array.from({ length: n - current.length }, () => ({
          owner: '',
          garageNumber: '',
          amount: 0,
        })),
      ]);
    } else if (current.length > n) {
      replace(current.slice(0, n));
    }
  };

  const handleConfirm = (values: CustomerSchemaType) => {
    startTransition(async () => {
      const data = await createCustomerAction(values);
      if (!data || data.error) {
        const msg =
          typeof data?.error === 'string' ? data.error : data?.error?.message;
        toast.error(msg ?? 'No se pudo crear el inquilino');
      } else {
        toast.success('Inquilino creado exitosamente');
        form.reset();
        setOpen(false);
      }
    });
  };

  return (
    <CustomerStepperShell
      open={open}
      setOpen={setOpen}
      trigger={
        <Button size="lg">
          <UserPlus className="size-4" />
          Nuevo inquilino
        </Button>
      }
      form={form}
      isPending={isPending}
      title="Nuevo inquilino"
      entityLabel="inquilino"
      mode="create"
      vehiclesCount={fields.length}
      vehiclesStepLabel="Cocheras"
      onNextFromCustomer={handleNext}
      onConfirm={handleConfirm}
      vehiclesPhase={
        <RenterPhase2
          form={form}
          customersRenters={customersRenters}
          fields={fields}
          isPending={isPending}
        />
      }
    />
  );
}
