
import { OtherPayment } from "./other-payment.type";
import { PaymentHistoryOnAccount, Receipt, ReceiptPayment } from "./receipt.type";
import { TicketRegistrationForDay } from "./ticket-registration-for-day.type";
import { TicketRegistration } from "./ticket-registration.type";

export type BoxList = {
    id: string;
    date: Date;
    totalPrice: number;
    boxNumber: number;
    ticketRegistrations: TicketRegistration[];
    ticketRegistrationForDays: TicketRegistrationForDay[];
    receipts: Receipt[];
    otherPayments: OtherPayment[];
    receiptPayments: ReceiptPayment[];  
    paymentHistoryOnAccount: PaymentHistoryOnAccount[]
}

export interface BoxListResponse {
  message: string;
  data: BoxList;
}