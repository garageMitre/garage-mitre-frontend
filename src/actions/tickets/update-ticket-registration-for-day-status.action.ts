'use server';

import { TicketRegistrationForDayStatusSchemaType } from '@/schemas/ticket-registration-for-day.schema';
import { UpdateTicketSchemaType } from '@/schemas/ticket.schema';
import { updateTicketStatus as updateTicketStatusAPI } from '@/services/tickets.service'

export async function updateTicketRegistrationForDayStatusAction(
  id: string,
  values: Partial<TicketRegistrationForDayStatusSchemaType>,
) {
  try {
    const success = await updateTicketStatusAPI(id, values);
    if (!success) {
      return { error: 'Error al editar el ticket' };
    }
    return { success: 'Ticket editado exitosamente' };
  } catch (error) {
    console.log(error);
    return { error: 'Error al editar el ticket' };
  }
}
