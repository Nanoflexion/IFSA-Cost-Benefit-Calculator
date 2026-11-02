import { ASSUMPTIONS } from './config';

export interface Inputs { units: number; years: number; currentCost: number; }

export function calculate({ units, years, currentCost }: Inputs) {
  const series = [];
  for (let year = 0; year <= years; year++) {
    series.push({
      year,
      without: units * currentCost * year,
      with: ASSUMPTIONS.upfrontCost + units * ASSUMPTIONS.newCostPerUnit * year,
    });
  }
  const last = series[series.length - 1];
  return { series, totalSavings: last.without - last.with };
}
