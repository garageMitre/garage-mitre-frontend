'use server';

import { deleteTicketPrice as deleteTicketPriceAPI } from '@/services/tickets.service';

export async function deleteTicketPriceAction(id: string) {
  try {
    const success = await deleteTicketPriceAPI(id);
    if (!success) {
      return { error: 'Error al eliminar el precio ticket' };
    }
    return { success: 'Precio Ticket eliminado exitosamente' };
  } catch (error) {
    console.log(error);
    return { error: 'Error al eliminar el precio ticket' };
  }
}
