"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TicketRegistration } from "@/types/ticket-registration.type";
import { CreateTicketRegistrationDialog } from "../tickets-days-or-weeks/create-ticket-registration-for-day-dialog";
import ScannerButton from "../../components/scanner-button";


export default function CardTicket({
  initialRegistrations,
}: {
  initialRegistrations: TicketRegistration[];
}) {
  const [registrations, setRegistrations] = useState<TicketRegistration[]>(initialRegistrations);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {

    const handleNewScan = async () => {
      router.refresh(); 
    };

    document.addEventListener("scan-success", handleNewScan);

    return () => {
      document.removeEventListener("scan-success", handleNewScan);
    };
  }, []);

  const latestRegistration =
  registrations.length > 0
    ? [...registrations].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0]
    : null;


  const formatDateA = (date: string | Date) => {
    if (typeof date === "string") {
      const [year, month, day] = date.split("-");
      return `${day}/${month}/${year}`; // 🔥 Formato dd/mm/yyyy
    }
  
    // Si es un Date, sí formatearlo normal
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
  
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      <ScannerButton isDialogOpen={isDialogOpen} />

      <Card className="w-1/4 max-w-md mx-auto mt-8 p-5">
        <CardHeader>
          <CardTitle>Registro de Tickets X Hora</CardTitle>
          <CardDescription>Escanea el código de barras en esta pagina y registra un ticket por hora</CardDescription>
        </CardHeader>

        {latestRegistration ? (
          latestRegistration.ticket?.vehicleType ? (
            <CardContent>
              <p className="p-3"><strong>Descripción:</strong> {latestRegistration.description}</p>
              <p className="p-3"><strong>Día de entrada:</strong> {formatDateA(latestRegistration.entryDay)}</p>
              <p className="p-3"><strong>Horario de entrada:</strong> {latestRegistration.entryTime}</p>
              <p className="p-3"><strong>Codigo de barras:</strong> {latestRegistration.ticket.codeBar}</p>
            </CardContent>
          ) : (
            <CardContent>
              <p className="p-3"><strong>Precio:</strong> ${latestRegistration.price}</p>
              <p className="p-3"><strong>Día de salida:</strong> {formatDateA(latestRegistration.departureDay)}</p>
              <p className="p-3"><strong>Horario de entrada:</strong> {latestRegistration.entryTime}</p>
              <p className="p-3"><strong>Horario de salida:</strong> {latestRegistration.departureTime}</p>
              <p className="p-3"><strong>Codigo de barras:</strong> {latestRegistration.codeBarTicket}</p>
            </CardContent>
          )
        ) : (
          <CardContent>
            <div className="flex justify-center items-center">No hay registros disponibles.</div>
          </CardContent>
        )}
      </Card>

      <CreateTicketRegistrationDialog setIsDialogOpen={setIsDialogOpen} />
    </>
  );
}
