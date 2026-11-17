import { LitElement, html, css, unsafeCSS } from 'lit';
import { property, query } from 'lit/decorators.js';
import { FONT_STACK } from './config';

export abstract class ChartBase extends LitElement {
  @property() label = '';
  @query('svg') protected svgEl!: SVGSVGElement;
  @query('.wrap') protected wrapEl!: HTMLDivElement;
  @query('.tip') protected tipEl!: HTMLDivElement;
  protected width = 0;
  private ro?: ResizeObserver;

  static styles = css`
    :host {
      display: block;
      font-family: ${unsafeCSS(FONT_STACK)};
    }
    .wrap { position: relative; }
    svg { display: block; width: 100%; height: auto; }
    svg text { font-family: inherit; font-size: 0.8rem; fill: #000000; }
    svg .domain, svg .tick line { stroke: #000000; stroke-width: 1.5; }
    svg text.total { font-size: 0.8rem; font-weight: 700; }
    svg text.x-title,
    svg text.y-title {
      font-size: 0.8rem;
      font-weight: 400;
    }
    svg .x-axis text { font-size: 0.8rem; }
    .tip {
      display: none; position: absolute; pointer-events: none; z-index: 2;
      background: #fff; border: 1px solid #0f4a59; padding: 6px 8px;
      font-size: 0.8rem; line-height: 1.4; white-space: pre-line; border-radius: 6px;
    }
  `;

  protected abstract draw(): void;

  override render() {
    return html`<div class="wrap"><svg role="img" aria-label=${this.label}></svg><div class="tip"></div></div>`;
  }

  override firstUpdated() {
    this.ro = new ResizeObserver(entries => {
      this.width = Math.floor(entries[0].contentRect.width);
      this.draw();
    });
    this.ro.observe(this);
  }

  override updated() {
    if (!this.width) this.width = this.clientWidth;
    this.draw();
  }

  override disconnectedCallback() {
    this.ro?.disconnect();
    super.disconnectedCallback();
  }

  protected showTip(e: PointerEvent, text: string) {
    const box = this.wrapEl.getBoundingClientRect();
    const tip = this.tipEl;
    tip.textContent = text;
    tip.style.display = 'block';
    const left = Math.min(e.clientX - box.left + 12, box.width - tip.offsetWidth);
    tip.style.left = `${Math.max(0, left)}px`;
    tip.style.top = `${e.clientY - box.top + 12}px`;
  }

  protected hideTip() {
    this.tipEl.style.display = 'none';
  }
}
