import { TICKET_TIME_TYPE } from '@/types/ticket-registration-for-day.type';
import { TICKET_TYPE } from '@/types/ticket.type';
import { z } from 'zod';

export const ticketRegistrationForDaySchema = z.object({
    weeks: z.coerce.number().optional(),
    days: z.coerce.number().optional(),
    ticketTimeType: z.enum(TICKET_TIME_TYPE).optional(), 
    vehicleType: z.enum(TICKET_TYPE),
    firstNameCustomer: z.string().optional(),
    lastNameCustomer:  z.string().min(2, 'El Apellido debe tener al menos 2 caracteres')
  .max(50, 'El Apellido no puede tener más de 50 caracteres'),
    vehiclePlateCustomer:  z.string().optional(),
    paid: z.boolean().optional(),
    retired: z.boolean().optional(),
});
export type TicketRegistrationForDaySchemaType = z.infer<typeof ticketRegistrationForDaySchema>;


export const ticketRegistrationForDayStatusSchema = z.object({
    paid: z.boolean().optional(),
    retired: z.boolean().optional(),
});
export type TicketRegistrationForDayStatusSchemaType = z.infer<typeof ticketRegistrationForDayStatusSchema>;


export const deleteRegistrationForDaySchema = z.object({
  confirmation: z.string().min(0, 'Ingrese la confirmación "Eliminar Ticket"'),
});
export type DeleteRegistrationForDaySchemaType = z.infer<typeof deleteRegistrationForDaySchema>;