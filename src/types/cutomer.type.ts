import { Receipt } from "./receipt.type";
import { Vehicle } from "./vehicle.type";


export const CUSTOMER_TYPE = ['OWNER', 'RENTER', 'PRIVATE'] as const;
export type CustomerType = (typeof CUSTOMER_TYPE)[number];



export type Customer = {
    id: string;
    firstName: string;
    lastName: string;  
    email: string;
    address: string; 
    documentNumber: number;
    numberOfVehicles: number;
    startDate: Date | null; 
    previusStartDate: Date | null;  
    customerType: CustomerType;
    deletedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    receipts: Receipt[];
    vehicles: Vehicle[];
}