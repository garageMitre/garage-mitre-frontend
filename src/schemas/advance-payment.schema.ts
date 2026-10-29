import { z } from 'zod';

export const advancePaymentSchema = z.object({
  advancePaidAmount: z.coerce.number().min(0, 'El monto no puede ser negativo'),
  metodo: z.enum(['CASH', 'TRANSFER']).optional(),
  expectedBracketLabel: z.string().optional(),
  expectedUptoMinutes: z.coerce.number().min(0).optional(),
});
export type AdvancePaymentSchemaType = z.infer<typeof advancePaymentSchema>;
