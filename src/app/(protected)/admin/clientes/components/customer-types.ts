import { CustomerType } from '@/types/cutomer.type';

export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  OWNER: 'Propietarios',
  RENTER: 'Inquilinos',
  PRIVATE: 'Terceros',
};

export const CUSTOMER_TYPE_ORDER: CustomerType[] = ['OWNER', 'RENTER', 'PRIVATE'];

export const CUSTOMER_TYPE_ROUTE: Record<CustomerType, string> = {
  OWNER: 'owners',
  RENTER: 'renters',
  PRIVATE: 'privates',
};

export const PAYMENT_TYPE_LABEL: Record<string, string> = {
  TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
  CHECK: 'Cheque',
  MIX: 'Mixto',
  CREDIT: 'Crédito',
  // No es un medio de pago real: el backend lo estampa en el recibo del propietario cuando
  // el pago de un inquilino de terceros lo compensa.
  TP: 'Automático',
  FIX: 'Corrección',
};
