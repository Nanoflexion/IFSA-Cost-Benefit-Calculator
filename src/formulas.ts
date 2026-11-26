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
  netSavings: number;        // headline: annual savings × years
  annualSavings: number;
  monthlySavings: number;
  roi: number;               // percent
  leaksPrevented: number;    // per year
  bedDaysSaved: number;      // per year (operational output, never priced)
  standard: Segment[];       // bar 1: expected monthly cost, no patch
  patch: Segment[];          // bar 2: expected monthly cost, with patch
  curve: { day: number; value: number }[];
  patchLine: number;
  avgStayStandard: number;   // expected days in hospital, no patch
  avgStayPatch: number;      // expected days in hospital, with patch
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usdCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
export const money = (n: number) => usd.format(n);
export const moneyCompact = (n: number) => usdCompact.format(n);

export const defaultValues = (): Values =>
  Object.fromEntries(INPUTS.map(i => [i.id, i.default]));

export function calculate(v: Values): Results {
  const C = CONSTANTS;
  const m = v.proceduresPerMonth;
  const N = C.monthsPerYear * m;          // procedures per year
  const p = v.leakRate / 100;             // % to probability
  const CL = v.leakCost;
  const P = 500;
  const { leakReduction: e, patchesPerCase: q, implementationCost: I } = C;

  // Monthly costs
  const expectedLeaksMonth = m * p;                        // can be fractional
  const baseMonth = m * C.baseSurgeryCost;
  const leakCostMonth = expectedLeaksMonth * CL;           // no patch
  const patchCostMonth = m * q * P + I / C.monthsPerYear;  // patches for every surgery
  const residualLeakMonth = expectedLeaksMonth * (1 - e) * CL;
  const monthlySavings = leakCostMonth - residualLeakMonth - patchCostMonth;

  // Annual costs
  const annualSavings = monthlySavings * C.monthsPerYear;
  const patchProgramCost = patchCostMonth * C.monthsPerYear;
  const roi = patchProgramCost > 0 ? (annualSavings / patchProgramCost) * 100 : 0;
  const leaksPrevented = N * p * e;
  const bedDaysSaved = leaksPrevented * (C.daysLeak - C.daysNoLeak);

  // Bar segments
  const base: Segment = {
    key: 'base', label: 'Surgery cost without a leak', value: baseMonth, color: COLORS.base,
    detail: `${m} surgeries × ${money(C.baseSurgeryCost)} = ${money(baseMonth)}`,
  };

  const standard: Segment[] = [
  base,
  { key: 'extended', label: 'Expected leak cost', value: leakCostMonth, color: COLORS.extended,
    detail: `${m} surgeries × ${v.leakRate}% leak rate × ${money(CL)} per leak = ${money(leakCostMonth)}` },
];

const patch: Segment[] = [
  base,
  { key: 'device', label: 'Nanoflexion patch cost', value: patchCostMonth, color: COLORS.device,
    detail: `${m} patches × ${money(P)} = ${money(m * q * P)}` },
  { key: 'other', label: 'Remaining leak cost', value: residualLeakMonth, color: COLORS.otherPatch,
    detail: `${m} × ${v.leakRate}% × (1 − ${e * 100}% prevented) × ${money(CL)} = ${money(residualLeakMonth)}` },
].filter(s => s.value > 0);

  // Expected length of stay (averages across all patients, not individual predictions)
  const extraDays = C.daysLeak - C.daysNoLeak;
  const avgStayStandard = C.daysNoLeak + p * extraDays;
  const avgStayPatch = C.daysNoLeak + p * (1 - e) * extraDays;

  // Line chart
  const slope = CL / extraDays;   // allocated cost per extra day
  const standardCost = (t: number) =>
    C.baseSurgeryCost + Math.max(0, t - C.daysNoLeak) * slope;

  const wholeDays = Array.from(
    { length: SETTINGS.maxDay - SETTINGS.minDay + 1 }, (_, i) => SETTINGS.minDay + i);
  const days = [...new Set([...wholeDays, C.daysNoLeak])].sort((a, b) => a - b);
  const curve = days.map(day => ({ day, value: standardCost(day) }));

  return {
    netSavings: annualSavings * SETTINGS.years,
    annualSavings, monthlySavings, roi, leaksPrevented, bedDaysSaved,
    avgStayStandard, avgStayPatch,
    standard, patch, curve,
    patchLine: C.baseSurgeryCost + q * P,
  };
}