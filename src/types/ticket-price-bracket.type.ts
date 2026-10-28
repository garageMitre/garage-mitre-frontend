import { TicketDayType, VehicleType } from './ticket-price';

export type TicketPriceBracket = {
  id: string;
  vehicleType: VehicleType;
  ticketDayType: TicketDayType | null;
  label: string;
  uptoMinutes: number | null;
  price: number;
  recurringUnitMinutes: number | null;
  // FIXED cobra `price` por unidad; DERIVED (franjas anteriores al editor) lo calcula con la lista.
  recurringPriceMode?: 'FIXED' | 'DERIVED';
  createdAt: string;
  updatedAt: string;
};
