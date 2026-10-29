'use server';

import { deleteTicketPrice as deleteTicketPriceAPI } from '@/services/tickets.service';

export async function deleteTicketPriceAction(id: string) {
  try {
    const success = await deleteTicketPriceAPI(id);
    if (!success) {
      return { error: 'Error al eliminar la tarifa' };
    }
    return { success: 'Tarifa eliminada exitosamente' };
  } catch (error) {
    console.log(error);
    return { error: 'Error al eliminar la tarifa' };
  }
}
