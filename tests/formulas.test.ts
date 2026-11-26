import { describe, it, expect } from 'vitest';
import { calculate, defaultValues } from '../src/formulas';

const sum = (s: { value: number }[]) => s.reduce((t, d) => t + d.value, 0);

describe('calculate (matches Nanoflexion formula PDF)', () => {
  const r = calculate(defaultValues());

  it('annual savings = $76,037.68', () => expect(r.annualSavings).toBeCloseTo(76037.68, 1));
  it('monthly savings = annual / 12', () => expect(r.monthlySavings).toBeCloseTo(76037.68 / 12, 1));
  it('3-year savings = $228,113.03', () => expect(r.netSavings).toBeCloseTo(228113.03, 1));
  it('ROI = 253.5%', () => expect(r.roi).toBeCloseTo(253.5, 1));
  it('leaks prevented = 3.708/year', () => expect(r.leaksPrevented).toBeCloseTo(3.708, 3));
  it('bed-days saved = 35.23/year', () => expect(r.bedDaysSaved).toBeCloseTo(35.23, 2));
  it('bar difference equals monthly savings', () =>
    expect(sum(r.standard) - sum(r.patch)).toBeCloseTo(r.monthlySavings, 2));
  it('expected leak cost scales with the leak-cost input', () => {
    const a = calculate({ ...defaultValues(), leakCost: 20000 });
    const b = calculate({ ...defaultValues(), leakCost: 40000 });
    const leak = (x: typeof a) => x.standard.find(s => s.key === 'extended')!.value;
    expect(leak(b) / leak(a)).toBeCloseTo(2, 5);
  });
  it('expected stay without patch = 17.39 days', () =>
  expect(r.avgStayStandard).toBeCloseTo(17.3871, 3));
  it('expected stay with patch = 16.8 days', () =>
    expect(r.avgStayPatch).toBeCloseTo(16.8, 3));
  it('both bars include the same surgery cost segment', () => {
  const base = (s: typeof r.standard) => s.find(x => x.key === 'base')!.value;
  expect(base(r.standard)).toBeCloseTo(5 * 44308, 2);
  expect(base(r.patch)).toBeCloseTo(5 * 44308, 2);
});
});