'use server';

import { AdvancePaymentSchemaType } from '@/schemas/advance-payment.schema';
import { addAdvancePayment as addAdvancePaymentAPI } from '@/services/tickets.service';

export async function addAdvancePaymentAction(id: string, values: AdvancePaymentSchemaType) {
  try {
    const data = await addAdvancePaymentAPI(id, values);
    if (!data || 'error' in data) {
      const message = (data as any)?.error?.message ?? 'Error al registrar el anticipo';
      return { error: message };
    }
    return { success: 'Anticipo registrado exitosamente', registration: data };
  } catch (error) {
    console.log(error);
    return { error: 'Error al registrar el anticipo' };
  }
}
