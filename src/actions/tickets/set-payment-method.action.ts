'use server';

import { setPaymentMethod as setPaymentMethodAPI } from '@/services/tickets.service';

export async function setPaymentMethodAction(id: string, metodo: 'CASH' | 'TRANSFER') {
  try {
    const data = await setPaymentMethodAPI(id, metodo);
    if (!data || 'error' in data) {
      const message = (data as any)?.error?.message ?? 'Error al registrar el pago';
      return { error: message };
    }
    return { success: 'Pago registrado exitosamente' };
  } catch (error) {
    console.log(error);
    return { error: 'Error al registrar el pago' };
  }
}
