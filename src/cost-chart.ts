import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { max } from 'd3-array';
import 'd3-transition';

@customElement('cost-chart')
export class CostChart extends LitElement {
  @property({ attribute: false }) series: { year: number; without: number; with: number }[] = [];
  @property({ type: Number }) breakEven?: number;

  render() { return html`<svg></svg>`; }

  updated() {                                  // runs after every data change
    const svg = select(this.renderRoot.querySelector('svg')!);
    const width = this.clientWidth || 600, height = 320;
    const m = { top: 16, right: 16, bottom: 32, left: 56 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const x = scaleLinear()
      .domain([0, max(this.series, d => d.year)!])
      .range([m.left, width - m.right]);
    const y = scaleLinear()
      .domain([0, max(this.series, d => Math.max(d.with, d.without))!])
      .nice()
      .range([height - m.bottom, m.top]);

    const mkLine = (key: 'with' | 'without') =>
      line<any>().x(d => x(d.year)).y(d => y(d[key]));

    (['without', 'with'] as const).forEach(key => {
      svg.selectAll<SVGPathElement, unknown>(`path.${key}`)
        .data([this.series])
        .join('path')
        .attr('class', key)
        .attr('fill', 'none')
        .attr('stroke', key === 'with' ? '#0a7' : '#999')
        .attr('stroke-width', 2)
        .transition().duration(300)
        .attr('d', mkLine(key));
    });

  }
}