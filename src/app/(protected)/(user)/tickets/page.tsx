export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import {
  getTicketRegistrations,
  getTickets,
  getTicketPriceBrackets,
  getTicketSchedule,
  getTicketsRegistrationForDay,
} from "@/services/tickets.service";
import { currentUser } from "@/lib/auth";
import CardTicket from "./components/ticket.card";

export default async function TicketPage() {
  const registrations = await getTicketRegistrations();
  const ticketsCatalog = await getTickets();
  const priceBrackets = await getTicketPriceBrackets();
  const schedule = await getTicketSchedule();
  const registrationsForDay = await getTicketsRegistrationForDay();
  const user = await currentUser();

  return (
    <div className="py-2 lg:py-4 short:py-0 short:-my-2">
      <CardTicket
        initialRegistrations={registrations}
        ticketCatalog={ticketsCatalog?.data || []}
        priceBrackets={priceBrackets || []}
        schedule={schedule}
        registrationsForDay={registrationsForDay || []}
        isAdmin={user?.role === "ADMIN"}
      />
    </div>
  );
}
