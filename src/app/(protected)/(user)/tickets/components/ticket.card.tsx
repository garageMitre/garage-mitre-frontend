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
import { TicketIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Fila del detalle: etiqueta a la izquierda, valor a la derecha.
function Row({ label, last, children }: { label: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3", !last && "border-b")}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

function Barcode({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border bg-background px-2.5 py-0.5 font-mono text-[13px] tracking-wider">{children}</span>
  );
}

// "Adentro" en amarillo (el ticket está en el garage); "Salida registrada" en verde.
function StatusPill({ tone, children }: { tone: "inside" | "out"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tone === "inside" ? "border-yellow-400/35 bg-yellow-400/10 text-yellow-400" : "border-green-400/35 bg-green-400/10 text-green-400",
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone === "inside" ? "bg-yellow-400" : "bg-green-400")} />
      {children}
    </span>
  );
}


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

      {/* Misma información y orden que antes; el ancho fijo de un cuarto se volvía una columna
          angosta en el celular. */}
      <Card className="mx-auto mt-7 w-full max-w-[440px] overflow-hidden rounded-2xl border bg-card shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
        <CardHeader className="flex-row items-start gap-3.5 space-y-0 p-5 sm:p-6">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-400">
            <TicketIcon className="size-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg font-bold tracking-tight">Registro de Tickets X Hora</CardTitle>
            <CardDescription className="leading-snug">Escanea el código de barras en esta pagina y registra un ticket por hora</CardDescription>
          </div>
        </CardHeader>

        {latestRegistration ? (
          latestRegistration.ticket?.vehicleType ? (
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-4 border-t bg-secondary/25 px-5 py-4 sm:px-6">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descripción</p>
                  <p className="text-[15px] font-semibold leading-snug">{latestRegistration.description}</p>
                </div>
                <StatusPill tone="inside">Adentro</StatusPill>
              </div>
              <dl className="px-5 pb-2 pt-1 sm:px-6">
                <Row label="Día de entrada">{formatDateA(latestRegistration.entryDay)}</Row>
                <Row label="Horario de entrada">{latestRegistration.entryTime}</Row>
                <Row label="Codigo de barras" last><Barcode>{latestRegistration.ticket.codeBar}</Barcode></Row>
              </dl>
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <div className="flex items-end justify-between gap-4 border-t bg-secondary/25 px-5 py-4 sm:px-6">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Precio</p>
                  <p className="text-4xl font-extrabold leading-none tracking-tight tabular-nums">${Number(latestRegistration.price ?? 0).toLocaleString("es-AR")}</p>
                </div>
                <StatusPill tone="out">Salida registrada</StatusPill>
              </div>
              <dl className="px-5 pb-2 pt-1 sm:px-6">
                <Row label="Día de salida">{formatDateA(latestRegistration.departureDay)}</Row>
                <Row label="Horario de entrada">{latestRegistration.entryTime}</Row>
                <Row label="Horario de salida">{latestRegistration.departureTime}</Row>
                <Row label="Codigo de barras" last><Barcode>{latestRegistration.codeBarTicket}</Barcode></Row>
              </dl>
            </CardContent>
          )
        ) : (
          <CardContent className="border-t px-6 py-8">
            <p className="text-center text-sm text-muted-foreground">No hay registros disponibles.</p>
          </CardContent>
        )}
      </Card>

      <CreateTicketRegistrationDialog setIsDialogOpen={setIsDialogOpen} />
    </>
  );
}
