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
    ticket: Ticket;
    boxList: BoxList;
    updatedAt: Date;
}