'use server';

import { pricingOptionsSchema } from '@/schemas/pricing-options.schema';
import { getTariffPlan, simulateTariffPlan, updateTariffPlan } from '@/services/tickets.service';
import { tariffForVehicle, validateTariffDraft } from '@/utils/tariff-plan.utils';
import type { TariffDraft, TariffPlan } from '@/types/tariff-plan.type';
import type { PricingPreviewResult } from '@/types/pricing-options.type';

type PlanResponse = { plan?: TariffPlan; error?: string; conflict?: boolean };

export async function getTariffPlanAction(): Promise<PlanResponse> {
  const result = await getTariffPlan();
  return 'error' in result ? { error: result.error.message } : { plan: result.data };
}

export async function saveTariffPlanAction(expectedRevision: string, plan: TariffDraft): Promise<PlanResponse> {
  const errors = validateTariffDraft(plan);
  if (errors.length || !pricingOptionsSchema.safeParse(plan.schedule.pricingOptions).success) return { error: errors[0] || 'Revisá los precios y las reglas de cobro.' };
  const result = await updateTariffPlan(expectedRevision, plan);
  return 'error' in result ? { error: result.error.message, conflict: result.error.status === 409 } : { plan: result.data };
}

export async function simulateTariffPlanAction(vehicleType: string, entryAt: string, elapsedMinutes: number, plan?: TariffDraft): Promise<{ result?: PricingPreviewResult; error?: string }> {
  if (!/^[A-Z][A-Z0-9_]{0,31}$/.test(vehicleType) || !Number.isInteger(elapsedMinutes) || elapsedMinutes < 0 || elapsedMinutes > 5256000 || !Number.isFinite(Date.parse(entryAt))) return { error: 'Revisá el vehículo, la hora de entrada y la permanencia.' };
  if (plan) {
    plan = tariffForVehicle(plan, vehicleType);
    const errors = validateTariffDraft(plan);
    if (errors.length || !pricingOptionsSchema.safeParse(plan.schedule.pricingOptions).success) return { error: errors[0] || 'Completá el borrador antes de simular.' };
  }
  const result = await simulateTariffPlan({ vehicleType, entryAt, elapsedMinutes, ...(plan ? { plan: { schedule: plan.schedule, brackets: plan.brackets } } : {}) });
  return 'error' in result ? { error: result.error.message } : { result: result.data };
}
