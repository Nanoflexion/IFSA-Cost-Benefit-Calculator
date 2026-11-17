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
  maxDays: 10,        // x-axis range of the line chart
  lineChartHeight: 260,
  barChartHeight: 260,
  showYTicks: true,
};

// PLACEHOLDERS!!
export const INPUTS: InputDef[] = [
  { id: 'patientsPerYear', label: 'Patients treated per year',
    help: 'The number of patients at your facility each year who could use the patch. Use your own annual patient volume.',
    min: 50, max: 5000, step: 50, default: 500 },
  { id: 'costPerDay', label: 'Cost per hospital day', prefix: '$',
    help: 'What one extra day in the hospital costs your facility, including staff, room, and supplies.',
    min: 500, max: 5000, step: 100, default: 2500 },
  { id: 'extraDays', label: 'Extra days from complications', suffix: 'days',
    help: 'The average number of additional hospital days a patient needs when a complication occurs.',
    min: 0, max: 15, step: 1, default: 4 },
  { id: 'patchCost', label: 'Patch cost per patient', prefix: '$',
    help: 'The price of one Nanoflexion patch for one patient.',
    min: 50, max: 2000, step: 50, default: 400 },
];

// PLACEHOLDERS!!
export const CONSTANTS = {
  baseStayDays: 4,
  otherCostStandard: 3000,
  otherCostPatch: 1500,
  curveGrowth: 0.15,    // how steeply the standard-cost curve rises
  startCost: 2000,      // standard cost at day 0 on the line chart
};

export const COPY = {
  title: 'Calculate Potential Savings',
  subtitle:
    'Change any figure to match your facility for an estimate on how much your facility can save in {years} years.',
  resultLabel: 'Potential Net {years}-Year Savings',
  barStandard: 'Projected Patient Cost with Existing Treatment',
  barPatch: 'Projected Patient Cost with Nanoflexion Patch',
  lineStandard: 'Standard Patient Cost',
  linePatch: 'Projected Patient Cost with Nanoflexion Patch',
  xAxisDays: 'Days in Hospital',
  lineTitle: 'Cost per patient vs. days in hospital',
  barTitle: 'Projected cost per patient',
  yAxisLine: 'Cost per Patient ($)',
  yAxisBar: 'Total Cost per Patient ($)',
  lineDescription:
    'Shows how the cost of a standard patient grows with each extra day in the hospital, compared with the flat cost when using the Nanoflexion patch.',
  barDescription:
    'Compares the total projected cost per patient with and without the patch. Hover over or tap a section of a bar to see the cost breakdown.',
};

export const COLORS = {
  base: '#225ea8',
  extended: '#a1dab4',
  other: '#41b6c4',
  device: '#edf8b1',
  otherPatch: '#41b6c4',
  standardLine: '#399d8c',
  patchLine: '#0f4a59',
};

export const fill = (s: string) => s.replace('{years}', String(SETTINGS.years));