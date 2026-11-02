import { describe, it, expect } from 'vitest';
import { calculate } from '../src/formulas';

describe('calculate', () => {
  it('returns a series of years + 1 points', () => {
    expect(calculate({ units: 100, years: 5, currentCost: 50 }).series).toHaveLength(6);
  });
});
