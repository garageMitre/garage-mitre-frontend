import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { TicketPriceBracket } from '@/types/ticket-price-bracket.type';
import { TicketDayType, VehicleType } from '@/types/ticket-price';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const TZ = 'America/Argentina/Buenos_Aires';

/**
 * Registrations store the entry as a `YYYY-MM-DD` day plus an `HH:mm:ss` time,
 * both already in shop-local terms — rebuild the instant in that zone.
 */
export function parseEntry(entryDay: string | Date, entryTime: string) {
  const day =
    typeof entryDay === 'string' ? entryDay : dayjs(entryDay).format('YYYY-MM-DD');
  const parsed = dayjs.tz(`${day} ${entryTime}`, 'YYYY-MM-DD HH:mm:ss', TZ);
  return parsed.isValid() ? parsed : null;
}

export function elapsedMinutes(entry: dayjs.Dayjs, now: number) {
  return Math.max(0, dayjs(now).diff(entry, 'minute'));
}

export function formatElapsed(totalMinutes: number): string {
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Day vs night is decided by the ENTRY time against the configured window —
 * the backend owns the real rule, this only picks which column of the tariff
 * table to show, and the resolved type is always labelled in the UI.
 */
export function resolveDayType(
  entry: dayjs.Dayjs,
  schedule: { dayStartHour: number; dayEndHour: number } | null,
): TicketDayType | null {
  if (!schedule) return null;
  const { dayStartHour, dayEndHour } = schedule;
  const hour = entry.tz(TZ).hour();
  // A window like 20 → 6 wraps past midnight.
  const isDay =
    dayStartHour <= dayEndHour
      ? hour >= dayStartHour && hour < dayEndHour
      : hour >= dayStartHour || hour < dayEndHour;
  return isDay ? 'DAY' : 'NIGHT';
}

// Escala de una franja según su "hasta" en minutos — mismo criterio que el backend
// (resolveExitPrice): múltiplo de 1440 = días, múltiplo de 60 = horas, el resto minutos.
type PriceBracketTier = 'MIN' | 'HOUR' | 'DAY';
const TIER_RANK: Record<PriceBracketTier, number> = { MIN: 0, HOUR: 1, DAY: 2 };

function classifyBracketTier(uptoMinutes: number): PriceBracketTier {
  if (uptoMinutes >= 1440 && uptoMinutes % 1440 === 0) return 'DAY';
  if (uptoMinutes >= 60 && uptoMinutes % 60 === 0) return 'HOUR';
  return 'MIN';
}

export type CascadePart = { label: string; price: number };

export type PriceEstimate = {
  price: number;
  label: string;
  parts: CascadePart[];
  /** Techo de la franja que "cubre" esta estimación — null si viene de la franja sin límite. */
  uptoMinutes: number | null;
  isOpenEnded: boolean;
  recurringUnitMinutes: number | null;
};

function resolveWithinLadder(
  covering: TicketPriceBracket,
  previous: TicketPriceBracket | null,
  elapsed: number,
  grace: number,
  allFinite: TicketPriceBracket[],
): CascadePart[] {
  const gap = Math.abs((covering.uptoMinutes ?? 0) - elapsed);
  if (previous === null || gap <= grace) {
    return [{ label: covering.label, price: covering.price }];
  }

  const previousTier = classifyBracketTier(previous.uptoMinutes!);
  const smaller = allFinite.filter(
    (b) => b.uptoMinutes !== null && TIER_RANK[classifyBracketTier(b.uptoMinutes)] < TIER_RANK[previousTier],
  );
  if (smaller.length === 0) {
    return [{ label: covering.label, price: covering.price }];
  }

  const remainder = elapsed - previous.uptoMinutes!;
  const subParts = resolveLadderSubset(smaller, remainder, grace);
  if (subParts === null) {
    // El excedente no entra ni con tolerancia en la escala más chica — la cascada no alcanza a
    // cubrirlo, así que se cobra directo el techo de `covering` (mismo criterio que el backend).
    return [{ label: covering.label, price: covering.price }];
  }
  return [{ label: previous.label, price: previous.price }, ...subParts];
}

// Precio por bloque de una franja recurrente — mismo criterio que priceBracketAmount en el
// backend, en orden: 1) coincidencia exacta del "cada X" con el "hasta" de otra franja ya
// cargada; 2) si no hay, se deriva proporcionalmente de la franja más chica de una escala más
// GRANDE (ej. "cada 1 minuto" toma "hasta 1 hora" ÷ 60); 3) si no hay ninguna franja más grande
// cargada, devuelve null para que el llamador use el precio propio de la franja.
function resolveRecurringUnitPrice(recurringUnitMinutes: number, finite: TicketPriceBracket[]): number | null {
  const exact = finite.find((b) => b.uptoMinutes === recurringUnitMinutes);
  if (exact) return exact.price;

  const tier = classifyBracketTier(recurringUnitMinutes);
  const biggerTiers: PriceBracketTier[] = tier === 'MIN' ? ['HOUR', 'DAY'] : tier === 'HOUR' ? ['DAY'] : [];

  for (const biggerTier of biggerTiers) {
    const anchor = finite
      .filter((b) => b.uptoMinutes !== null && classifyBracketTier(b.uptoMinutes) === biggerTier)
      .sort((a, b) => a.uptoMinutes! - b.uptoMinutes!)[0];
    if (anchor) {
      return Math.round((anchor.price / anchor.uptoMinutes!) * recurringUnitMinutes);
    }
  }

  return null;
}

function resolveLadderSubset(brackets: TicketPriceBracket[], elapsed: number, grace: number): CascadePart[] | null {
  const sorted = [...brackets].sort((a, b) => a.uptoMinutes! - b.uptoMinutes!);
  let previous: TicketPriceBracket | null = null;
  for (const bracket of sorted) {
    const threshold = bracket.uptoMinutes! + grace;
    if (elapsed <= threshold) {
      return resolveWithinLadder(bracket, previous, elapsed, grace, sorted);
    }
    previous = bracket;
  }
  return null;
}

/**
 * Misma lógica de cascada que el backend (TicketsService.resolveExitPrice): agota la escalera
 * de minutos, al llegar a una hora completa suma la tarifa de esa hora más el resultado de
 * re-aplicar la escalera de minutos sobre el excedente, y así de nuevo al pasar de horas a
 * días — para que la vista previa en vivo coincida con lo que se cobra realmente al salir.
 */
export function resolvePriceCascade(
  brackets: TicketPriceBracket[],
  vehicleType: VehicleType,
  dayType: TicketDayType | null,
  elapsed: number,
  graceMinutes: number,
): PriceEstimate | null {
  const pool = brackets
    .filter((b) => b.vehicleType === vehicleType)
    .filter((b) => b.ticketDayType === null || dayType === null || b.ticketDayType === dayType);

  const finite = pool.filter((b) => b.uptoMinutes !== null).sort((a, b) => a.uptoMinutes! - b.uptoMinutes!);
  const openEnded = pool.find((b) => b.uptoMinutes === null) ?? null;

  if (finite.length === 0) {
    if (!openEnded) return null;
    return {
      price: openEnded.price,
      label: openEnded.label,
      parts: [{ label: openEnded.label, price: openEnded.price }],
      uptoMinutes: null,
      isOpenEnded: true,
      recurringUnitMinutes: openEnded.recurringUnitMinutes,
    };
  }

  const lastBracket = finite[finite.length - 1];
  let previous: TicketPriceBracket | null = null;

  for (const bracket of finite) {
    const isLastWithCeiling = bracket === lastBracket && !openEnded;
    const threshold = isLastWithCeiling ? bracket.uptoMinutes! : bracket.uptoMinutes! + graceMinutes;
    if (elapsed <= threshold) {
      const parts = resolveWithinLadder(bracket, previous, elapsed, graceMinutes, finite);
      return {
        price: parts.reduce((sum, p) => sum + p.price, 0),
        label: parts.map((p) => p.label).join(' + '),
        parts,
        uptoMinutes: bracket.uptoMinutes,
        isOpenEnded: false,
        recurringUnitMinutes: null,
      };
    }
    previous = bracket;
  }

  // Superó todas las franjas con techo — misma cuenta que priceBracketAmount en el backend.
  if (openEnded) {
    const baseMinutes = previous?.uptoMinutes ?? 0;
    const basePrice = previous?.price ?? 0;
    const baseParts: CascadePart[] = previous ? [{ label: previous.label, price: previous.price }] : [];

    if (!openEnded.recurringUnitMinutes) {
      return {
        price: basePrice + openEnded.price,
        label: [previous?.label, openEnded.label].filter(Boolean).join(' + '),
        parts: [...baseParts, { label: openEnded.label, price: openEnded.price }],
        uptoMinutes: null,
        isOpenEnded: true,
        recurringUnitMinutes: null,
      };
    }

    const unitPrice = resolveRecurringUnitPrice(openEnded.recurringUnitMinutes, finite) ?? openEnded.price;

    const over = Math.max(0, elapsed - baseMinutes);
    const units = Math.max(1, Math.ceil(over / openEnded.recurringUnitMinutes));
    return {
      price: basePrice + units * unitPrice,
      label: [previous?.label, openEnded.label].filter(Boolean).join(' + '),
      parts: [...baseParts, { label: `${units} × ${openEnded.label}`, price: units * unitPrice }],
      uptoMinutes: null,
      isOpenEnded: true,
      recurringUnitMinutes: openEnded.recurringUnitMinutes,
    };
  }

  return {
    price: lastBracket.price,
    label: lastBracket.label,
    parts: [{ label: lastBracket.label, price: lastBracket.price }],
    uptoMinutes: lastBracket.uptoMinutes,
    isOpenEnded: false,
    recurringUnitMinutes: null,
  };
}

/**
 * Qué pasaría a continuación: el precio (ya en cascada) al llegar al próximo techo de franja
 * que todavía no se alcanzó, o al próximo bloque recurrente si ya se está en la franja sin
 * límite — para que "Siguiente" muestre el próximo salto real, no un techo plano.
 */
export function resolveNextCascade(
  brackets: TicketPriceBracket[],
  vehicleType: VehicleType,
  dayType: TicketDayType | null,
  elapsed: number,
  graceMinutes: number,
): PriceEstimate | null {
  const pool = brackets
    .filter((b) => b.vehicleType === vehicleType)
    .filter((b) => b.ticketDayType === null || dayType === null || b.ticketDayType === dayType);

  const finite = pool.filter((b) => b.uptoMinutes !== null).sort((a, b) => a.uptoMinutes! - b.uptoMinutes!);
  const nextBracket = finite.find((b) => b.uptoMinutes! > elapsed);
  if (nextBracket) {
    return resolvePriceCascade(brackets, vehicleType, dayType, nextBracket.uptoMinutes!, graceMinutes);
  }

  const openEnded = pool.find((b) => b.uptoMinutes === null) ?? null;
  if (openEnded?.recurringUnitMinutes && finite.length > 0) {
    const baseMinutes = finite[finite.length - 1].uptoMinutes!;
    const over = Math.max(0, elapsed - baseMinutes);
    const units = Math.max(1, Math.ceil(over / openEnded.recurringUnitMinutes));
    const nextBoundary = baseMinutes + units * openEnded.recurringUnitMinutes + 1;
    return resolvePriceCascade(brackets, vehicleType, dayType, nextBoundary, graceMinutes);
  }

  return null;
}
