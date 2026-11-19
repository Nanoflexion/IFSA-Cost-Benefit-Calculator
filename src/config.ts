export const FONT_STACK = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export interface InputDef {
  id: string;
  label: string;
  help?: string;
  min: number;
  max: number;
  step: number;
  default: number;
  prefix?: string;   // e.g. '$'
  suffix?: string;   // e.g. 'days'
}

export const SETTINGS = {
  years: 3,           // the "X" in "X-year savings"
  liveUpdate: true,   // false = results only change when Calculate is clicked
  lineChartHeight: 260,
  barChartHeight: 260,
  showYTicks: true,
  minDay: 12,    // first day shown on the x-axis
  maxDay: 28,    // last day shown
  showBaseCost: true,   // false = bars show only the costs that differ between scenarios
};

export const INPUTS: InputDef[] = [
  { id: 'proceduresPerMonth', label: 'Eligible procedures per month',
    help: 'Colorectal surgeries with an anastomosis that your facility performs each month.',
    min: 1, max: 100, step: 1, default: 5 },
  { id: 'leakRate', label: 'Baseline leak rate', suffix: '%',
    help: 'How often an anastomotic leak occurs today without the patch.',
    min: 1, max: 20, step: 0.01, default: 6.18 },
  { id: 'leakCost', label: 'Added hospital cost per leak', prefix: '$',
    help: 'The extra hospital cost of one leak, including the longer stay and readmissions.',
    min: 5000, max: 60000, step: 1, default: 28597 },
  { id: 'patchPrice', label: 'Price per patch', prefix: '$',
    help: 'What your facility would pay for one patch. One patch is used per surgery. The default of $500 is an illustrative price, not a Nanoflexion quote.',
    min: 0, max: 3000, step: 10, default: 500 },
];

export const CONSTANTS = {
  monthsPerYear: 12,
  leakReduction: 1,          // e: 100% what-if, NOT a verified clinical result
  patchesPerCase: 1,         // q: one patch per eligible surgery (per the PDF)
  implementationCost: 0,     // I: annual training/implementation cost
  baseSurgeryCost: 44308,    // C0: cost per surgery without a leak (Hammond 2014)
  daysNoLeak: 16.8,          // D0: total inpatient days, no leak
  daysLeak: 26.3,            // DL: total inpatient days, with a leak
};

export const COPY = {
  title: 'Calculate Potential Savings',
  subtitle:
    'Change any figure to match your facility for an estimate on how much your facility can save in {years} years.',
  resultLabel: 'Potential Net {years}-Year Savings',
  barStandard: 'Projected Cost with Existing Treatment',
  barPatch: 'Projected Cost with Nanoflexion Patch',
  lineStandard: 'Standard Patient Cost with Leak',
  linePatch: 'Projected Patient Cost with Nanoflexion Patch',
  xAxisDays: 'Days in Hospital',
  lineTitle: 'Cost of a patient with a leak vs. days in hospital',
  barTitle: 'Expected cost per month',
  yAxisLine: 'Cost per Month ($)',
  yAxisBar: 'Total Cost per Month ($)',
  lineDescription:
    'A patient who develops a leak costs more the longer they stay while a patched patient costs a fixed amount.',
  barDescription:
    'Compare the total projected cost per month with and without the patch. Hover over or tap a section of a bar to see the cost breakdown.',
    disclaimer:
  '*These estimates assume the patch prevents 100% of leaks, one patch is used per surgery, and there is no implementation cost. These are hypothetical planning assumptions, not verified clinical results or a Nanoflexion price quote.'
};

export const COLORS = {
  base: '#225ea8',
  extended: '#a1dab4',
  device: '#41b6c4',
  otherPatch: '#41b6c4',
  standardLine: '#399d8c',
  patchLine: '#0f4a59',
};

export const fill = (s: string) => s.replace('{years}', String(SETTINGS.years));