import { BoxList } from "./box-list.type";
import { Customer } from "./cutomer.type";

export const PAYMENT_STATUS_TYPE = ['PENDING', 'PAID'] as const;
export type PaymentStatusType = (typeof PAYMENT_STATUS_TYPE)[number];

export const PAYMENT_TYPE = ['TRANSFER', 'CASH'] as const;
export type PaymentType = (typeof PAYMENT_TYPE)[number];

export type Receipt = {
    id: string;
    status: PaymentStatusType;
    paymentType: PaymentType;
    price: number;
    startAmount: number;
    lastInterestApplied: Date | null; 
    interestPercentage: number;
    paymentDate: Date | null;
    dateNow: Date | null;
    boxList: BoxList;
    customer: Customer;
}