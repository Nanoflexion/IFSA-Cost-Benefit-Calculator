import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { COPY, INPUTS, SETTINGS, fill, type InputDef } from './config';
import { calculate, defaultValues, money, type Values } from './formulas';
import './stacked-bar-chart';
import './cost-line-chart';

@customElement('nanoflexion-calculator')
export class NanoflexionCalculator extends LitElement {
  @state() private draft: Values = defaultValues();    // what the sliders show
  @state() private applied: Values = defaultValues();  // what the charts show

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
          <label for=${id}>${def.label}</label>
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

  override render() {
    const r = calculate(this.applied);
    return html`
      <section class="calc">
        <h2>${fill(COPY.title)}</h2>
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

            <div class="card">
              <h3 class="chart-title">${COPY.lineTitle}</h3>
              <cost-line-chart
                label="Line chart: standard patient cost rises with days in hospital, patch cost stays flat"
                .curve=${r.curve}
                .flatLine=${r.patchLine}
                .standardLabel=${COPY.lineStandard}
                .flatLabel=${COPY.linePatch}
                .xLabel=${COPY.xAxisDays}
                .yLabel=${COPY.yAxisLine}
                .showTicks=${SETTINGS.showYTicks}></cost-line-chart>
            </div>

            <div class="card">
              <h3 class="chart-title">${COPY.barTitle}</h3>
              <stacked-bar-chart
                label="Stacked bar chart comparing projected patient cost with and without the patch"
                .yLabel=${COPY.yAxisBar}
                .showTicks=${SETTINGS.showYTicks}
                .groups=${[
                  { label: COPY.barStandard, segments: r.standard },
                  { label: COPY.barPatch, segments: r.patch },
                ]}></stacked-bar-chart>
            </div>
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
      font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: var(--text);
    }
    .calc { container-type: inline-size; background: var(--bg); padding: 24px; box-sizing: border-box }
    h2 { margin: 0 0 8px; font-size: 1.5rem; font-weight: 500; }
    .sub { margin: 0 0 20px; font-size: 1rem; }
    .grid { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: 16px; align-items: start; }
    .panel { background: var(--panel); padding: 45px 24px 45px 24px; display: flex; flex-direction: column; gap: 22px; color: #ffffff; font-style: bold; }
    .right { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
    .card { background: var(--panel); padding: 16px; background-color: #cadde3 }

    .result { text-align: center; background-color: #0f4a59;}
    .result-label { font-size: 1rem; color: #64ea81; }
    .result-value { font-size: 2rem; font-weight: 700; margin-top: 6px; color: #ffffff;}

    .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.9rem; margin-bottom: 6px; }
    .box { display: inline-flex; align-items: center; gap: 2px; background: #5f919e; border: 1px solid #cbc9c9;
           border-radius: 3px; padding: 1px 6px; font-size: 0.9rem; white-space: nowrap; }
    .box input { width: 6ch; border: 0; background: transparent; text-align: right; font: inherit; color: inherit;
                 -moz-appearance: textfield; }
    .box input::-webkit-outer-spin-button,
    .box input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

    .chart-title {
      margin: 0 0 8px;
      font-size: 0.9rem;
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

    @container (max-width: 720px) {
      .grid { grid-template-columns: 1fr; }
      .calc { padding: 16px; }
    }
  `;
}
