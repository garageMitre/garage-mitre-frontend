import { BoxList } from "./box-list.type";
import { Ticket } from "./ticket.type";


export type TicketRegistration = {
    id: string;
    description: string;
    price: number;
    codeBarTicket: string;
    entryDay: string;
    departureDay: string;
    entryTime: string;
    departureTime: string;
    dateNow: Date | null;
    // Opcional: la planilla lo muestra (EF/TR) si el backend lo manda; esta versión no lo guarda.
    paymentMetodo?: 'CASH' | 'TRANSFER' | null;
    ticket: Ticket;
    boxList: BoxList;
    updatedAt: Date;
}