import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { calculate } from './formulas';

@customElement('nanoflexion-calculator')
export class NanoflexionCalculator extends LitElement {
  @state() private inputs = { units: 100, years: 5, currentCost: 50 };

  private onInput(key: string, e: Event) {
    const value = Number((e.target as HTMLInputElement).value);
    this.inputs = { ...this.inputs, [key]: value };
  }

  render() {
    const r = calculate(this.inputs);
    return html`
      <label>Units
        <input type="number" .value=${String(this.inputs.units)}
               @input=${(e: Event) => this.onInput('units', e)} />
      </label>
      <p>Total savings: ${r.totalSavings}</p>
    `;
  }
}
