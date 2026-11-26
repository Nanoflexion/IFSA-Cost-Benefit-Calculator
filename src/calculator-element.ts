import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { COPY, FONT_STACK, INPUTS, SETTINGS, fill, type InputDef } from './config';
import { calculate, defaultValues, money, type Values, type Segment } from './formulas';
import './stacked-bar-chart';
import './cost-line-chart';

@customElement('nanoflexion-calculator')
export class NanoflexionCalculator extends LitElement {
  @state() private draft: Values = defaultValues();    // what the sliders show
  @state() private applied: Values = defaultValues();  // what the charts show
  @state() private openHelp: string | null = null;   // which tooltip is open (for tap/click)
  @state() private showBase = SETTINGS.showBaseCost;

  private reference = calculate(defaultValues());   // default-input results, for the fixed axis

  private setValue(def: InputDef, raw: number) {
    const n = Number.isFinite(raw) ? raw : def.default;
    const value = Math.min(def.max, Math.max(def.min, n));
    this.draft = { ...this.draft, [def.id]: value };
    if (SETTINGS.liveUpdate) this.applied = this.draft;
    return value;
  }

  private renderInput(def: InputDef) {
    const id = `in-${def.id}`;
    const value = String(this.draft[def.id]);
    return html`
      <div class="field">
        <div class="row">
          <span class="label-group">
            <label for=${id}>${def.label}</label>
            ${this.renderHelp(def)}
          </span>
          <span class="box">
            ${def.prefix ?? ''}<input type="number" aria-label="${def.label} value"
              min=${def.min} max=${def.max} step=${def.step} .value=${value}
              @change=${(e: Event) => {
                const el = e.target as HTMLInputElement;
                el.value = String(this.setValue(def, Number(el.value)));
              }} />${def.suffix ?? ''}
          </span>
        </div>
        <input id=${id} type="range"
          min=${def.min} max=${def.max} step=${def.step} .value=${value}
          @input=${(e: Event) => this.setValue(def, Number((e.target as HTMLInputElement).value))} />
      </div>`;
  }

  private renderHelp(def: InputDef) {
    if (!def.help) return nothing;
    const tipId = `tip-${def.id}`;
    const open = this.openHelp === def.id;
    return html`
      <span class="help ${open ? 'open' : ''}">
        <button type="button" class="help-btn"
          aria-label="What does ${def.label} mean?"
          aria-describedby=${tipId}
          aria-expanded=${String(open)}
          @click=${() => (this.openHelp = open ? null : def.id)}>?</button>
        <span id=${tipId} role="tooltip" class="tip">${def.help}</span>
      </span>`;
  }

  private onDocClick = (e: Event) => {
    const insideHelp = e.composedPath().some(
      el => (el as HTMLElement).classList?.contains('help'));
    if (!insideHelp) this.openHelp = null;
  };
  private onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.openHelp = null;
  };

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.onDocClick);
    document.addEventListener('keydown', this.onKey);
  }
  override disconnectedCallback() {
    document.removeEventListener('click', this.onDocClick);
    document.removeEventListener('keydown', this.onKey);
    super.disconnectedCallback();
  }

  override render() {
    const r = calculate(this.applied);
    const sum = (segs: Segment[]) => segs.reduce((s, d) => s + d.value, 0);
    const view = (segs: Segment[]) =>
      this.showBase ? segs : segs.filter(s => s.key !== 'base');

    const std = view(r.standard);
    const pat = view(r.patch);

    // Fixed axis: based on the default inputs, grows only if a bar would not fit
    const refMax = Math.max(sum(view(this.reference.standard)), sum(view(this.reference.patch)));
    const headroom = this.showBase
      ? SETTINGS.barAxisHeadroom.withSurgery
      : SETTINGS.barAxisHeadroom.difference;
    const barAxisMax = Math.max(refMax * headroom, Math.max(sum(std), sum(pat)) * 1.1);

    const legend = [...std, ...pat]
      .filter((s, i, all) => all.findIndex(t => t.label === s.label) === i);
    const total = (segs: { value: number }[]) => segs.reduce((s, d) => s + d.value, 0);
    const savings = total(r.standard) - total(r.patch);
    const perPatientSaving = Math.ceil(savings);
    return html`
      <section class="calc">
        <h1>${fill(COPY.title)}</h1>
        <p class="sub">${fill(COPY.subtitle)}</p>

        <div class="grid">
          <div class="panel" role="group" aria-label="Calculator inputs">
            ${INPUTS.map(def => this.renderInput(def))}
          </div>

          <div class="right">
            <div class="card result" aria-live="polite">
              <div class="result-label">${fill(COPY.resultLabel)}</div>
              <div class="result-value">${money(r.netSavings)}</div>
            </div>

            <div class="charts">
              <div class="card">
                <h3 class="chart-title">${COPY.barTitle} $${perPatientSaving}</h3>
                <p class="chart-desc">
                  ${COPY.barDescription}
                </p>
                <div class="toggle-wrap">
                  <div class="toggle" role="group" aria-label="Bar chart view">
                    <button type="button" aria-pressed=${String(this.showBase)}
                      @click=${() => (this.showBase = true)}>${COPY.viewTotal}</button>
                    <button type="button" aria-pressed=${String(!this.showBase)}
                      @click=${() => (this.showBase = false)}>${COPY.viewDifference}</button>
                  </div>
                </div>

                <stacked-bar-chart
                  label="Stacked bar chart comparing projected monthly cost with and without the patch"
                  .yLabel=${this.showBase ? COPY.yAxisBar : COPY.yAxisBarExtra}
                  .yMax=${barAxisMax}
                  .showTicks=${SETTINGS.showYTicks}
                  .groups=${[
                    { label: COPY.barStandard, segments: std },
                    { label: COPY.barPatch, segments: pat },
                  ]}></stacked-bar-chart>

                <ul class="legend">
                  ${legend.map(s => html`
                    <li><span class="swatch" style="background:${s.color}"></span>${s.label}</li>`)}
                </ul>
              </div>

              <div class="card">
                <h3 class="chart-title">${COPY.lineTitle}</h3>
                <p class="chart-desc">${COPY.lineDescription}</p>
                <p class="stay-summary" aria-live="polite">
                  Expected hospital stay:
                  <strong>${r.avgStayStandard.toFixed(1)} days</strong> without the patch vs.
                  <strong>${r.avgStayPatch.toFixed(1)} days</strong> with it
                  (${(r.avgStayStandard - r.avgStayPatch).toFixed(1)} days shorter on average).
                </p>
                <cost-line-chart
                  label="Line chart: standard patient cost rises with days in hospital, patch cost stays flat"
                  .curve=${r.curve}
                  .flatLine=${r.patchLine}
                  .standardLabel=${COPY.lineStandard}
                  .flatLabel=${COPY.linePatch}
                  .xLabel=${COPY.xAxisDays}
                  .yLabel=${COPY.yAxisLine}
                  .showTicks=${SETTINGS.showYTicks}></cost-line-chart>
                  <div></div>
              </div>
            </div>

            <p class="disclaimer">${COPY.disclaimer}</p>
          </div>
        </div>
      </section>`;
  }

  static styles = css`
    :host {
      display: block;
      --bg: #e9eff0;
      --panel: #0f4a59;
      --text: #000000;
      --accent: #64ea81;
      font-family: ${unsafeCSS(FONT_STACK)};
      color: var(--text);
      container-type: inline-size;
      max-width: 100%;
    }
    .calc { background: var(--bg); padding: 24px; box-sizing: border-box }
    h1 { margin: 0 0 8px; font-size: 1.5rem; font-weight: 500; }
    .sub { margin: 0 0 20px; font-size: 1rem; }
    .grid {
      display: grid;
      grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);  /* skinny inputs, charts take the rest */
      gap: clamp(12px, 2cqi, 20px);
      align-items: start;
    }
      
    .charts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: clamp(12px, 2cqi, 20px);
      row-gap: 0;
    }
    .charts > .card {
      display: grid;
      grid-row: span 5;
      grid-template-rows: subgrid;   /* title, description, extra row, chart, footer */
    }
    .panel { background: var(--panel); padding: 35px; display: flex; flex-direction: column; gap: 20px; color: #ffffff; font-style: bold; }
    .right { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
    .card { background: var(--panel); padding: 16px; background-color: #e5f3f7 }

    .result { text-align: center; background-color: #0f4a59;}
    .result-label { font-size: 1rem; color: #64ea81; }
    .result-value { font-size: 2rem; font-weight: 700; margin-top: 6px; color: #ffffff;}

    .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.8rem; margin-bottom: 6px; }
    .box { display: inline-flex; align-items: center; gap: 2px; background: #3A585F; border: 1px solid #cbc9c9;
           border-radius: 3px; padding: 1px 6px; font-size: 0.9rem; white-space: nowrap; flex: none; }
    .box input { width: 6ch; border: 0; background: transparent; text-align: right; font: inherit; color: inherit;
                 -moz-appearance: textfield; }
    .box input::-webkit-outer-spin-button,
    .box input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

    .chart-title {
      margin: 0 0 8px;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #0f4a59;
    }

    input[type='range'] { -webkit-appearance: none; appearance: none; width: 100%; height: 20px; background: transparent; margin: 0; }
    input[type='range']::-webkit-slider-runnable-track { height: 5px; background: #cbc9c9 }
    input[type='range']::-moz-range-track { height: 2px; background: #111; }
    input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; margin-top: -8px;
      border-radius: 50%; background: var(--accent); border: 1px solid #ffffff; }
    input[type='range']::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--accent); border: 1px solid #222; }
    input:focus-visible, button:focus-visible { outline: 2px solid #1f2f8f; outline-offset: 2px; }

    button { align-self: flex-start; padding: 10px 36px; background: var(--accent); border: 1px solid #333;
             border-radius: 6px; font: inherit; cursor: pointer; }

  @container (max-width: 1000px) {
    .charts { grid-template-columns: minmax(0, 1fr); row-gap: clamp(12px, 2cqi, 20px); }
    .charts > .card { display: block; grid-row: auto; }
  }

  @container (max-width: 720px) {
    .grid { grid-template-columns: minmax(0, 1fr); }
    .panel { position: static; padding: 16px; gap: 18px; }
    .card { padding: 12px; }
  }

  .label-group { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; }
  .help { position: relative; display: inline-flex; }
  .help-btn {
    padding: 0; width: 18px; height: 18px; border-radius: 50%;
    border: 1px solid #555; background: #e9f0f0; color: #1f2328;
    font-size: 0.7rem; font-weight: 700; line-height: 1; cursor: help;
  }
  .tip {
    visibility: hidden; opacity: 0; transition: opacity 0.15s;
    position: absolute; left: 0; top: calc(100% + 6px); z-index: 10;
    width: max-content; max-width: 220px;
    background: #1f2328; color: #fff;
    padding: 8px 10px; border-radius: 4px;
    font-size: 0.8rem; line-height: 1.4; pointer-events: none;
  }
  .help:hover .tip,
  .help-btn:focus-visible + .tip,
  .help.open .tip { visibility: visible; opacity: 1; }

  .chart-desc {
    margin: 0 0 10px;
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .chart-summary, .stay-summary { margin: 8px 0 0; font-size: 0.8rem; }

  .toggle-wrap { display: flex; justify-content: center; margin-top: 25px;  }
  .toggle { display: inline-flex; border: 1px solid #333; border-radius: 6px; overflow: hidden; }
  .toggle button { padding: 6px 12px; background: transparent; border: 0; border-radius: 0; font-size: 0.8rem; cursor: pointer; }
  .toggle button + button { border-left: 1px solid #333; }
  .toggle button[aria-pressed='true'] { background: #0f4a59; color: #fff; }

  .legend {
    list-style: none;
    margin: 2px 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 16px;
    font-size: 0.75rem;
  }
  .legend li { display: flex; align-items: center; gap: 6px; }
  .swatch { width: 12px; height: 12px; border: 1px solid #333; flex: none; }

  .disclaimer { margin: 12px 0 0; font-size: 0.75rem; line-height: 1.4; color: #333; }
  `;
}
