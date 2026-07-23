"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TicketRegistration } from "@/types/ticket-registration.type";
import { CreateTicketRegistrationDialog } from "../tickets-days-or-weeks/create-ticket-registration-for-day-dialog";
import ScannerButton from "../../components/scanner-button";
import { useTour, tourHighlight, tourTransition } from "./ticket-tour";
import {
  Car,
  Clock,
  CalendarDays,
  QrCode,
  Barcode,
  CircleDollarSign,
  Timer,
} from "lucide-react";

const TOUR_STEPS = [
  {
    key: "scanner",
    title: "Escáner de código de barras",
    desc: "Activá el escáner y pasá el código de barras del ticket. El sistema registra automáticamente la entrada o salida del vehículo.",
  },
  {
    key: "manual",
    title: "Ingreso manual de código",
    desc: "Si el código de barras no escanea, tocá acá para escribirlo a mano y confirmarlo.",
  },
  {
    key: "ticket",
    title: "Último registro",
    desc: "Acá ves el detalle del último ticket procesado: código de barras, horario de entrada y salida, y el precio calculado según tipo de vehículo.",
  },
  {
    key: "dayTicket",
    title: "Tickets por día o semana",
    desc: "Para tickets de día completo o semana entera, usá este botón para registrarlos manualmente sin necesidad de escanear el código.",
  },
];

export default function CardTicket({
  initialRegistrations,
}: {
  initialRegistrations: TicketRegistration[];
}) {
  const [registrations, setRegistrations] =
    useState<TicketRegistration[]>(initialRegistrations);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const tour = useTour(TOUR_STEPS);

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
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0]
      : null;

  const formatDate = (date: string | Date) => {
    if (typeof date === "string") {
      const [year, month, day] = date.split("-");
      return `${day}/${month}/${year}`;
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isDayTicket = latestRegistration?.ticket?.vehicleType;

  return (
    <>
      {/* Tour help button */}
      <div className="flex justify-end mb-2 max-w-3xl mx-auto">
        {tour.node}
      </div>

      <div className="w-full max-w-3xl mx-auto">
        <ScannerButton
          isDialogOpen={isDialogOpen}
          scannerRef={(el) => tour.refFor("scanner")(el)}
          scannerStyle={tour.isActive("scanner") ? { ...tourTransition, ...tourHighlight } : tourTransition}
          manualRef={(el) => tour.refFor("manual")(el)}
          manualStyle={tour.isActive("manual") ? { ...tourTransition, ...tourHighlight } : tourTransition}
        />
      </div>

      <div
        ref={(el) => tour.refFor("ticket")(el)}
        style={
          tour.isActive("ticket")
            ? { ...tourTransition, ...tourHighlight }
            : tourTransition
        }
        className="w-full max-w-3xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <div className="relative flex w-full flex-col md:flex-row">
          {/* ── Main ticket content (left) ── */}
          <div className="relative flex-1 p-8 md:p-10 overflow-hidden rounded-3xl md:rounded-r-none md:rounded-l-3xl border border-border/50 border-b-0 md:border-b md:border-r-0 bg-card/30 backdrop-blur-xl">
            {/* Gradient overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-gm-yellow/5 via-transparent to-gm-orange/5" />

            {/* Shimmer */}
            <div className="absolute -inset-full animate-[shimmer_4s_infinite] bg-gradient-to-r from-transparent via-gm-yellow/5 to-transparent" />

            {/* Dashed border (desktop) */}
            <div className="absolute top-0 bottom-0 right-0 hidden md:block border-r-2 border-dashed border-border/50" />
            {/* Cutout circles (desktop) */}
            <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background z-10 hidden md:block" />
            <div className="absolute -right-3 -bottom-3 h-6 w-6 rounded-full bg-background z-10 hidden md:block" />

            {/* Dashed border (mobile) */}
            <div className="absolute left-0 right-0 bottom-0 block md:hidden border-b-2 border-dashed border-border/50" />
            {/* Cutout circles (mobile) */}
            <div className="absolute -left-3 -bottom-3 h-6 w-6 rounded-full bg-background z-10 block md:hidden" />
            <div className="absolute -right-3 -bottom-3 h-6 w-6 rounded-full bg-background z-10 block md:hidden" />

            {/* Decorative blurs */}
            <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-gm-yellow blur-3xl opacity-[0.07]" />
            <div className="absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-gm-orange blur-3xl opacity-[0.07]" />

            <div className="relative z-10 flex h-full flex-col justify-between space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="yellow">
                    <Car className="mr-1 h-3 w-3" />
                    {isDayTicket ? "TICKET X DÍA" : "TICKET X HORA"}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    #GM-{latestRegistration?.id?.slice(-4).toUpperCase() ?? "0000"}
                  </span>
                </div>

                <div>
                  <h1 className="gm-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    Garage{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gm-yellow to-gm-orange">
                      Mitre
                    </span>
                  </h1>
                  <p className="mt-2 text-lg text-muted-foreground">
                    Registro de estacionamiento
                  </p>
                </div>
              </div>

              {/* Details */}
              {latestRegistration ? (
                isDayTicket ? (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center text-muted-foreground text-sm">
                          <CalendarDays className="mr-2 h-4 w-4" />
                          ENTRADA
                        </div>
                        <p className="text-foreground font-medium gm-mono gm-tnum">
                          {formatDate(latestRegistration.entryDay)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Clock className="mr-2 h-4 w-4" />
                          HORARIO
                        </div>
                        <p className="text-foreground font-medium gm-mono gm-tnum">
                          {latestRegistration.entryTime}
                        </p>
                      </div>
                    </div>

                    {latestRegistration.description && (
                      <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card/30 p-4 backdrop-blur-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gm-yellow/30 bg-gm-yellow/10">
                          <Car className="h-5 w-5 text-gm-yellow" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {latestRegistration.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {latestRegistration.ticket?.vehicleType === "AUTO"
                              ? "Automóvil"
                              : "Camioneta"}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center text-muted-foreground text-sm">
                          <CalendarDays className="mr-2 h-4 w-4" />
                          SALIDA
                        </div>
                        <p className="text-foreground font-medium gm-mono gm-tnum">
                          {formatDate(latestRegistration.departureDay)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-muted-foreground text-sm">
                          <CircleDollarSign className="mr-2 h-4 w-4" />
                          PRECIO
                        </div>
                        <p className="text-foreground font-medium gm-mono gm-tnum text-xl">
                          ${latestRegistration.price}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card/30 p-4 backdrop-blur-md">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gm-yellow/30 bg-gm-yellow/10">
                        <Timer className="h-5 w-5 text-gm-yellow" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                              Entrada
                            </p>
                            <p className="text-sm font-medium text-foreground gm-mono gm-tnum">
                              {latestRegistration.entryTime}
                            </p>
                          </div>
                          <div className="h-px flex-1 bg-border/60" />
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                              Salida
                            </p>
                            <p className="text-sm font-medium text-foreground gm-mono gm-tnum">
                              {latestRegistration.departureTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-card/30 mb-4">
                    <QrCode className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No hay registros disponibles.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Escaneá un código de barras para comenzar.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Stub / barcode (right) ── */}
          <div className="relative flex w-full flex-col items-center justify-center p-8 backdrop-blur-md md:w-56 rounded-3xl md:rounded-l-none md:rounded-r-3xl border border-border/50 border-t-0 md:border-t md:border-l-0 bg-card/10 transition-transform duration-300 hover:translate-x-2 hover:rotate-1">
            <div className="space-y-6 text-center">
              <div className="rounded-xl bg-gm-surface-2 border border-border/40 p-4 shadow-lg">
                <Barcode className="h-24 w-24 text-foreground mx-auto" />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Código
                </p>
                <p className="font-mono text-xl font-bold text-foreground gm-tnum">
                  {latestRegistration
                    ? isDayTicket
                      ? latestRegistration.ticket?.codeBar ?? "—"
                      : latestRegistration.codeBarTicket ?? "—"
                    : "—"}
                </p>
              </div>

              {latestRegistration && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-[hsl(120_35%_55%)] animate-pulse" />
                  <span>Registrado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto flex justify-center mt-2">
        <div
          ref={(el) => tour.refFor("dayTicket")(el)}
          style={
            tour.isActive("dayTicket")
              ? { ...tourTransition, ...tourHighlight }
              : tourTransition
          }
        >
          <CreateTicketRegistrationDialog setIsDialogOpen={setIsDialogOpen} />
        </div>
      </div>
    </>
  );
}
