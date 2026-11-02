import { COLORS, CONSTANTS, INPUTS, SETTINGS } from './config';

export type Values = Record<string, number>;

export interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
  detail?: string;   // shown in the tooltip
}

export interface Results {
  netSavings: number;
  standard: Segment[];                          // stacked bar 1
  patch: Segment[];                             // stacked bar 2
  curve: { day: number; value: number }[];      // standard cost vs. days
  patchLine: number;                            // flat patch cost
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usdCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
export const money = (n: number) => usd.format(n);
export const moneyCompact = (n: number) => usdCompact.format(n);

export const defaultValues = (): Values =>
  Object.fromEntries(INPUTS.map(i => [i.id, i.default]));

const sum = (segs: Segment[]) => segs.reduce((s, d) => s + d.value, 0);

// PLACEHOLDER FUNCTIONS!!
export function calculate(v: Values): Results {
  const C = CONSTANTS;

  const baseCost = v.costPerDay * C.baseStayDays;
  const extendedCost = v.costPerDay * v.extraDays;

  const standard: Segment[] = [
    { key: 'base', label: 'Base stay cost', value: baseCost, color: COLORS.base,
      detail: `${money(v.costPerDay)}/day × ${C.baseStayDays} days = ${money(baseCost)}` },
    { key: 'extended', label: 'Extended stay cost', value: extendedCost, color: COLORS.extended,
      detail: `${money(v.costPerDay)}/day × ${v.extraDays} days = ${money(extendedCost)}` },
    { key: 'other', label: 'Other treatment costs', value: C.otherCostStandard, color: COLORS.other },
  ];

  const patch: Segment[] = [
    { key: 'base', label: 'Base stay cost', value: baseCost, color: COLORS.base,
      detail: `${money(v.costPerDay)}/day × ${C.baseStayDays} days = ${money(baseCost)}` },
    { key: 'device', label: 'Nanoflexion patch cost', value: v.patchCost, color: COLORS.device },
    { key: 'other', label: 'Other treatment costs', value: C.otherCostPatch, color: COLORS.otherPatch },
  ];

  const standardTotal = sum(standard);
  const patchTotal = sum(patch);
  const netSavings = (standardTotal - patchTotal) * v.patientsPerYear * SETTINGS.years;

  const curve = Array.from({ length: SETTINGS.maxDays + 1 }, (_, day) => ({
    day,
    value: C.startCost + v.costPerDay * day * (1 + C.curveGrowth * day),
  }));

  return { netSavings, standard, patch, curve, patchLine: patchTotal };
}