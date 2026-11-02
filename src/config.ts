export interface InputDef {
  id: string;
  label: string;
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
  { id: 'patientsPerYear', label: 'Patients Treated Per Year', min: 50, max: 5000, step: 50, default: 500 },
  { id: 'costPerDay', label: 'Cost Per Hospital Day (USD)', prefix: '$', min: 500, max: 5000, step: 100, default: 2500 },
  { id: 'extraDays', label: 'Extra Days from Complications', suffix: 'days', min: 0, max: 15, step: 1, default: 4 },
  { id: 'patchCost', label: 'Patch Cost Per Patient (USD)', prefix: '$', min: 50, max: 2000, step: 50, default: 400 },
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
};

export const COLORS = {
  base: '#37464d',
  extended: '#126a7d',
  other: '#2ca1bc',
  device: '#4dc5a1',
  otherPatch: '#2ca1bc',
  standardLine: '#399d8c',
  patchLine: '#0f4a59',
};

export const fill = (s: string) => s.replace('{years}', String(SETTINGS.years));