export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
import { getTicketRegistrations } from "@/services/tickets.service";
import CardTicket from "./components/ticket.card";

export default async function TicketPage() {
  const registrations = await getTicketRegistrations();

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="container mx-auto px-4">
        <CardTicket initialRegistrations={registrations} />
      </div>
    </div>
  );
}
