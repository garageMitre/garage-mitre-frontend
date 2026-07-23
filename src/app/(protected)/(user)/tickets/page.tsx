export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { getTicketRegistrations, getTickets } from "@/services/tickets.service";
import CardTicket from "./components/ticket.card";

export default async function TicketPage() {
  const registrations = await getTicketRegistrations();
  const ticketsCatalog = await getTickets();

  return (
    <div
      className="py-10 px-4 sm:px-6"
      style={{
        background:
          "radial-gradient(ellipse at 15% 0%, hsl(var(--gm-yellow) / 0.07), transparent 45%), " +
          "radial-gradient(ellipse at 90% 90%, hsl(var(--gm-orange) / 0.08), transparent 50%)",
      }}
    >
      <CardTicket
        initialRegistrations={registrations}
        ticketCatalog={ticketsCatalog?.data || []}
      />
    </div>
  );
}
