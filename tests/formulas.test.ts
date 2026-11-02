import { describe, it, expect } from 'vitest';
import { calculate, defaultValues } from '../src/formulas';
import { SETTINGS } from '../src/config';

describe('calculate (placeholder model)', () => {
  const r = calculate(defaultValues());

  it('produces one curve point per day, including day 0', () => {
    expect(r.curve).toHaveLength(SETTINGS.maxDays + 1);
  });

  it('shows a positive saving with default inputs', () => {
    expect(r.netSavings).toBeGreaterThan(0);
  });

  it('returns three segments per bar', () => {
    expect(r.standard).toHaveLength(3);
    expect(r.patch).toHaveLength(3);
  });
});
