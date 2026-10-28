'use server';

import { ticketPriceSchema, TicketPriceSchemaType } from '@/schemas/ticket-price.schema';
import { createTicketPrice as createTicketPriceAPI } from '@/services/tickets.service';
import { handleTicketError, TicketError } from './ticket.utility';

export async function createTicketPriceAction(values: TicketPriceSchemaType) {
  const validatedFields = ticketPriceSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  try {
    const ticketPrice = await createTicketPriceAPI(validatedFields.data);

    if (!ticketPrice) {
      return {
        error: {
          code: 'SERVER_ERROR',
          message: 'Error inesperado en el servidor.',
        },
      };
    }

    if ('error' in ticketPrice) {
      return { error: handleTicketError(ticketPrice.error as TicketError) };
    }

    return { success: 'Tarifa creada exitosamente' };
  } catch (error: unknown) {
    console.error('Error desde el backend:', error);
    return {
      error: {
        code: 'SERVER_ERROR',
        message: (error as Error)?.message || 'Error inesperado en el servidor.',
      },
    };
  }
}
