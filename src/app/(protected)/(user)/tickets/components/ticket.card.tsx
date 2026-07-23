"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TicketRegistration } from "@/types/ticket-registration.type";
import { Ticket } from "@/types/ticket.type";
import { CreateTicketRegistrationDialog } from "../tickets-days-or-weeks/create-ticket-registration-for-day-dialog";
import ScannerButton from "../../components/scanner-button";
import { useTour, tourHighlight, tourTransition } from "./ticket-tour";
import {
  Car,
  Clock,
  CalendarDays,
  QrCode,
  CircleDollarSign,
  Timer,
} from "lucide-react";

dayjs.extend(utc);
dayjs.extend(timezone);
const TZ = "America/Argentina/Buenos_Aires";

const TOUR_STEPS = [
  {
    key: "scanner",
    title: "Escáner de código de barras",
    desc: "El sistema escucha el lector de código de barras en todo momento: pasá el ticket y registra automáticamente la entrada o salida del vehículo.",
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
    key: "occupancy",
    title: "Vehículos en el playón",
    desc: "Todos los tickets del catálogo. Los casilleros en amarillo siguen activos (fueron escaneados y no registraron salida, el vehículo sigue en el playón); los grises están inactivos o libres.",
  },
  {
    key: "dayTicket",
    title: "Tickets por día o semana",
    desc: "Para tickets de día completo o semana entera, usá este botón para registrarlos manualmente sin necesidad de escanear el código.",
  },
];

// `ticket.ticketRegistration` on the catalog entity doesn't reliably reflect
// the most recent scan, so match against the live registrations list instead
// — day tickets link back via `registration.ticket`, hourly ones via the
// scanned barcode itself.
function latestRegistrationForTicket(t: Ticket, registrations: TicketRegistration[]) {
  const matches = registrations.filter(
    (r) => r.ticket?.id === t.id || r.codeBarTicket === t.codeBar
  );
  if (matches.length === 0) return null;
  return matches.reduce((latest, r) =>
    new Date(r.updatedAt).getTime() > new Date(latest.updatedAt).getTime() ? r : latest
  );
}

// A catalog ticket is active (still in the lot) until its latest registration
// has its departure scanned.
function isTicketActive(t: Ticket, registrations: TicketRegistration[]) {
  const latest = latestRegistrationForTicket(t, registrations);
  return !!latest && !latest.departureTime && !latest.departureDay;
}

export default function CardTicket({
  initialRegistrations,
  ticketCatalog,
}: {
  initialRegistrations: TicketRegistration[];
  ticketCatalog: Ticket[];
}) {
  const [registrations, setRegistrations] =
    useState<TicketRegistration[]>(initialRegistrations);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [justScannedTicketId, setJustScannedTicketId] = useState<string | null>(null);
  const prevLatestIdRef = useRef<string | null>(null);
  const router = useRouter();
  const tour = useTour(TOUR_STEPS);

  // router.refresh() re-renders the server-fetched props in place — sync
  // them into state so the update actually shows up (state initializers only
  // run once on mount, they don't pick up later prop changes on their own).
  useEffect(() => {
    setRegistrations(initialRegistrations);
  }, [initialRegistrations]);

  const latestRegistration =
    registrations.length > 0
      ? [...registrations].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0]
      : null;

  // Briefly pulse the sidebar chip for whatever ticket just landed a new registration.
  useEffect(() => {
    const currentId = latestRegistration?.id ?? null;
    const prevId = prevLatestIdRef.current;
    prevLatestIdRef.current = currentId;
    if (currentId && prevId && currentId !== prevId && latestRegistration) {
      const matched = ticketCatalog.find(
        (t) => t.id === latestRegistration.ticket?.id || t.codeBar === latestRegistration.codeBarTicket
      );
      if (matched) {
        setJustScannedTicketId(matched.id);
        const timer = setTimeout(() => setJustScannedTicketId(null), 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [latestRegistration?.id]);

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
  const todayStr = dayjs().tz(TZ).format("DD/MM/YYYY");
  const sortedCatalog = [...ticketCatalog].sort(
    (a, b) => parseInt(a.codeBar, 10) - parseInt(b.codeBar, 10)
  );
  const activeTickets = sortedCatalog.filter((t) => isTicketActive(t, registrations));

  return (
    <>
      {/* Tour help button */}
      <div className="flex justify-end mb-2 max-w-[1180px] mx-auto">
        {tour.node}
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto mb-8">
        <nav className="flex items-center gap-1.5 gm-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">
          <span>Garage Mitre</span>
          <span className="opacity-50">/</span>
          <span>Operación</span>
          <span className="opacity-50">/</span>
          <span>Tickets</span>
        </nav>
        <div className="flex items-end justify-between gap-4 flex-wrap border-b border-border pb-5">
          <div>
            <h1 className="gm-display text-[26px] md:text-[30px] font-bold tracking-[0.01em] text-foreground">
              Registro de estacionamiento
            </h1>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground max-w-[520px]">
              Escaneá el código de barras del ticket para registrar entrada o salida del vehículo.
            </p>
          </div>
          <div className="flex items-center gap-2 gm-mono text-[11px] text-muted-foreground">
            <span
              className="h-[7px] w-[7px] rounded-full bg-[hsl(120_35%_55%)]"
              style={{ animation: "gm-blink 1.4s steps(2, jump-none) infinite" }}
            />
            Turno activo · {todayStr}
          </div>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto flex gap-7 flex-wrap items-start">
        {/* ── Main column ──────────────────────────────────────── */}
        <div className="flex-1 min-w-[320px]">
          <div className="mb-6">
            <ScannerButton
              isDialogOpen={isDialogOpen}
              onScanningChange={setIsScanning}
              onTicketRegistered={() => router.refresh()}
              scannerRef={(el) => tour.refFor("scanner")(el)}
              scannerStyle={tour.isActive("scanner") ? { ...tourTransition, ...tourHighlight } : tourTransition}
              manualRef={(el) => tour.refFor("manual")(el)}
              manualStyle={tour.isActive("manual") ? { ...tourTransition, ...tourHighlight } : tourTransition}
            />
          </div>

          <div
            key={latestRegistration?.id ?? "empty"}
            ref={(el) => tour.refFor("ticket")(el)}
            style={{
              ...(tour.isActive("ticket") ? { ...tourTransition, ...tourHighlight } : tourTransition),
              animation: "gm-ticket-rise 560ms cubic-bezier(.2,.7,.3,1) both",
            }}
          >
            <div className="relative flex w-full flex-col sm:flex-row">
              {/* ── Main stub ── */}
              <div
                className="relative flex-1 p-8 sm:p-9 overflow-hidden rounded-3xl sm:rounded-r-none border border-border bg-card/50 backdrop-blur-xl"
                style={isScanning ? { animation: "gm-barglow 950ms ease-in-out" } : undefined}
              >
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-gm-yellow/5 via-transparent to-gm-orange/5" />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(100deg, transparent 40%, hsl(var(--gm-yellow) / 0.06) 50%, transparent 60%)",
                    backgroundSize: "250% 100%",
                    animation: "gm-bgsweep 5s ease-in-out infinite",
                  }}
                />
                <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-gm-yellow blur-3xl opacity-[0.07]" />
                <div className="absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-gm-orange blur-3xl opacity-[0.07]" />

                <div className="relative z-10 flex h-full flex-col justify-between gap-7">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Badge variant="yellow">
                        <Car className="mr-1 h-3 w-3" />
                        {isDayTicket ? "TICKET X DÍA" : "TICKET X HORA"}
                      </Badge>
                      <span className="gm-mono text-xs text-muted-foreground">
                        #GM-{latestRegistration?.id?.slice(-4).toUpperCase() ?? "0000"}
                      </span>
                    </div>

                    <div>
                      <h2 className="gm-display text-4xl font-bold tracking-tight text-foreground">
                        Garage{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gm-yellow to-gm-orange">
                          Mitre
                        </span>
                      </h2>
                      <p className="mt-2 text-[15px] text-muted-foreground">
                        Registro de estacionamiento
                      </p>
                    </div>
                  </div>

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
                          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-md">
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

                        <div className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground border-t border-border pt-3.5 w-full">
                          <span className="h-[7px] w-[7px] rounded-full shrink-0 bg-[hsl(200_60%_60%)] shadow-[0_0_8px_hsl(200_60%_60%/0.7)]" />
                          <span className="font-semibold tracking-[0.03em] uppercase text-foreground">ENTRADA</span>
                          registrada correctamente
                        </div>
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

                        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-md">
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
                              <div className="h-px flex-1 bg-border" />
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

                        <div className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground border-t border-border pt-3.5 w-full">
                          <span className="h-[7px] w-[7px] rounded-full shrink-0 bg-[hsl(120_35%_55%)] shadow-[0_0_8px_hsl(120_35%_55%/0.7)]" />
                          <span className="font-semibold tracking-[0.03em] uppercase text-foreground">SALIDA</span>
                          registrada correctamente
                        </div>
                      </>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card/40 mb-4">
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

              {/* ── Barcode stub ── */}
              <div
                className="relative flex w-full sm:w-[240px] shrink-0 flex-col items-center justify-center gap-6 p-8 rounded-3xl sm:rounded-l-none border border-border sm:border-l-0 bg-card/30 backdrop-blur-md"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(180deg, transparent 0 10px, hsl(var(--gm-line-strong) / 0.8) 10px 12px)",
                  backgroundSize: "2px 100%",
                  backgroundPosition: "left",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div className="relative w-full rounded-[14px] border border-border bg-gm-surface-2 p-4 shadow-lg overflow-hidden">
                  <div
                    className="h-16 w-full rounded"
                    style={{
                      backgroundColor: "#f2ead9",
                      backgroundImage:
                        "repeating-linear-gradient(90deg, hsl(var(--gm-ink)) 0 3px, transparent 3px 5px, hsl(var(--gm-ink)) 5px 6px, transparent 6px 10px, hsl(var(--gm-ink)) 10px 14px, transparent 14px 17px, hsl(var(--gm-ink)) 17px 19px, transparent 19px 24px)",
                    }}
                  />
                  {isScanning && (
                    <div
                      className="absolute left-4 right-4 top-4 h-[3px] rounded-full bg-gm-yellow"
                      style={{
                        boxShadow: "0 0 12px 2px hsl(var(--gm-yellow) / 0.9)",
                        animation: "gm-scanline 950ms linear",
                      }}
                    />
                  )}
                </div>

                <div className="space-y-1 text-center">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Código
                  </p>
                  <p className="gm-mono text-xl font-bold text-foreground gm-tnum">
                    {latestRegistration
                      ? isDayTicket
                        ? latestRegistration.ticket?.codeBar ?? "—"
                        : latestRegistration.codeBarTicket ?? "—"
                      : "—"}
                  </p>
                </div>

                {latestRegistration && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <div
                      className="h-2 w-2 rounded-full bg-[hsl(120_35%_55%)]"
                      style={{ animation: "gm-blink 1.4s steps(2, jump-none) infinite" }}
                    />
                    <span>Registrado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar: vehicles currently parked ───────────────── */}
        <div
          ref={(el) => tour.refFor("occupancy")(el)}
          style={
            tour.isActive("occupancy")
              ? { ...tourTransition, ...tourHighlight }
              : tourTransition
          }
          className="w-full sm:w-[300px] shrink-0 rounded-[20px] border border-border bg-card/50 p-5 sm:sticky sm:top-6"
        >
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="gm-display text-[13px] font-bold tracking-[0.05em] text-foreground">
              Vehículos en el playón
            </h3>
            <span className="gm-mono text-[11px] text-muted-foreground">
              {activeTickets.length}/{sortedCatalog.length}
            </span>
          </div>

          {sortedCatalog.length > 0 && (
            <>
              <div className="h-[6px] rounded-full bg-gm-surface-3 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gm-yellow to-gm-orange transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.round((activeTickets.length / sortedCatalog.length) * 100)}%` }}
                />
              </div>
              <p className="mb-4 text-[11px] text-muted-foreground">
                {Math.round((activeTickets.length / sortedCatalog.length) * 100)}% de los tickets circulando en el playón
              </p>
            </>
          )}

          {sortedCatalog.length > 0 ? (
            <div className="grid grid-cols-5 gap-[7px] mb-4">
              {sortedCatalog.map((t) => {
                const active = isTicketActive(t, registrations);
                const justScanned = t.id === justScannedTicketId;
                return (
                  <div
                    key={t.id}
                    title={`Ticket ${t.codeBar} · ${active ? "activo" : "inactivo"}`}
                    style={justScanned ? { animation: "gm-chippulse 1.1s ease-in-out 2" } : undefined}
                    className={cn(
                      "h-[30px] rounded-[7px] grid place-items-center gm-mono text-[10px] font-bold border transition-shadow duration-300",
                      active
                        ? "text-gm-ink bg-gradient-to-br from-gm-yellow to-gm-orange border-gm-yellow/60"
                        : "text-muted-foreground bg-gm-surface-2 border-border",
                    )}
                  >
                    {t.codeBar}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-gm-surface-2/40 p-4 text-center text-[12px] text-muted-foreground mb-4">
              No hay tickets registrados.
            </div>
          )}

          <div className="flex flex-col gap-2 text-[11.5px] text-muted-foreground border-t border-border pt-3.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded shrink-0 bg-gm-yellow/85 shadow-[0_0_8px_hsl(var(--gm-yellow)/0.5)]" />
              Activo · sin salida registrada
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded shrink-0 border border-border bg-gm-surface-2" />
              Inactivo · con salida registrada
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto flex justify-center mt-8">
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
