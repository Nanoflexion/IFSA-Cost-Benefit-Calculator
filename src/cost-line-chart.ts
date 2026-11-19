import { customElement, property } from 'lit/decorators.js';
import { select, pointer } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { line, curveMonotoneX } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import 'd3-transition';
import { ChartBase } from './chart-base';
import { COLORS, SETTINGS } from './config';
import { money, moneyCompact } from './formulas';

export interface Point { day: number; value: number }

function splitLabel(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(/\s+/)) {
    if (cur && (cur + ' ' + word).length > maxChars) { lines.push(cur); cur = word; }
    else cur = (cur + ' ' + word).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

@customElement('cost-line-chart')
export class CostLineChart extends ChartBase {
  @property({ attribute: false }) curve: Point[] = [];
  @property({ type: Number }) flatLine = 0;
  @property() standardLabel = '';
  @property() flatLabel = '';
  @property() xLabel = 'Days in Hospital';
  @property() yLabel = '$$$';
  @property({ type: Boolean }) showTicks = false;

  protected override draw() {
    if (!this.svgEl || this.width < 10 || this.curve.length === 0) return;
    const w = this.width, h = SETTINGS.lineChartHeight;
    const m = { top: 16, right: 16, bottom: 48, left: this.showTicks ? 64 : 40 };
    const svg = select(this.svgEl).attr('viewBox', `0 0 ${w} ${h}`);

    const minDay = this.curve[0].day;
    const maxDay = this.curve[this.curve.length - 1].day;
    const x = scaleLinear().domain([minDay, maxDay]).range([m.left, w - m.right]);
    const values = [this.flatLine, ...this.curve.map(d => d.value)];
    const yLo = Math.min(...values);
    const yHi = Math.max(...values);
    const pad = (yHi - yLo || 1) * 0.15;                 // breathing room above and below
    const y = scaleLinear().domain([yLo - pad, yHi + pad]).nice().range([h - m.bottom, m.top]);
    const path = line<Point>().x(d => x(d.day)).y(d => y(d.value)).curve(curveMonotoneX);

    // Axes
    svg.selectAll<SVGGElement, number>('g.x-axis').data([0]).join('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${h - m.bottom})`)
      .call(axisBottom(x).ticks(Math.min(maxDay - minDay, 8)).tickFormat(d => String(d)));
    svg.selectAll<SVGGElement, number>('g.y-axis').data([0]).join('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${m.left},0)`)
      .call(axisLeft(y).ticks(5)
     .tickSize(this.showTicks ? 6 : 0)
     .tickFormat(this.showTicks ? (d) => moneyCompact(Number(d)) : () => ''));

    svg.selectAll<SVGTextElement, number>('text.x-title').data([0]).join('text')
      .attr('class', 'x-title').attr('x', (m.left + w - m.right) / 2).attr('y', h - 8)
      .attr('text-anchor', 'middle').text(this.xLabel);
    svg.selectAll<SVGTextElement, number>('text.y-title').data([0]).join('text')
      .attr('class', 'y-title')
      .attr('transform', `translate(14,${(m.top + h - m.bottom) / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle').text(this.yLabel);

    // Standard cost curve
    svg.selectAll<SVGPathElement, Point[]>('path.standard').data([this.curve]).join(
      enter => enter.append('path').attr('d', d => path(d)))
      .attr('class', 'standard').attr('fill', 'none')
      .attr('stroke', COLORS.standardLine).attr('stroke-width', 3)
      .transition().duration(300).attr('d', d => path(d));

    // Flat patch cost line
    svg.selectAll<SVGLineElement, number>('line.flat').data([this.flatLine]).join(
      enter => enter.append('line').attr('y1', d => y(d)).attr('y2', d => y(d)))
      .attr('class', 'flat').attr('x1', m.left).attr('x2', w - m.right)
      .attr('stroke', COLORS.patchLine).attr('stroke-width', 3)
      .transition().duration(300).attr('y1', d => y(d)).attr('y2', d => y(d));

    // Line label
    const narrow = w < 480;
    const maxChars = Math.max(12, Math.floor((w - m.left - m.right) * 0.5 / 6.5));
    const mid = this.curve[Math.floor(this.curve.length * 0.6)];

    const drawLabel = (cls: string, show: boolean, x0: number, y0: number, text: string, color: string) => {
      const t = svg.selectAll<SVGTextElement, number>(`text.${cls}`)
        .data(show ? [0] : []).join('text')
        .attr('class', cls)
        .attr('text-anchor', 'end')
        .attr('x', x0).attr('y', y0)
        .style('fill', color);
      t.selectAll('tspan')
        .data(splitLabel(text, maxChars))
        .join('tspan')
        .attr('x', x0)
        .attr('dy', (_, i) => (i === 0 ? 0 : '1.2em'))
        .text(d => d);
    };

    drawLabel('lbl-standard', !narrow, x(mid.day) - 8, y(mid.value) - 10, this.standardLabel, COLORS.standardLine);
    drawLabel('lbl-flat', !narrow, w - m.right, y(this.flatLine) + 18, this.flatLabel, COLORS.patchLine);

    // Replaces labels with a legend for smaller screens
    const legend = svg.selectAll<SVGGElement, number>('g.legend').data([0]).join('g')
      .attr('class', 'legend')
      .style('pointer-events', 'none');
    legend.selectAll('*').remove();

    if (narrow) {
      let yy = m.top + 4;
      [
        { text: this.standardLabel, color: COLORS.standardLine },
        { text: this.flatLabel, color: COLORS.patchLine },
      ].forEach(item => {
        const lines = splitLabel(item.text, maxChars);
        legend.append('line')
          .attr('x1', m.left + 8).attr('x2', m.left + 22)
          .attr('y1', yy + 6).attr('y2', yy + 6)
          .attr('stroke', item.color).attr('stroke-width', 3);
        const t = legend.append('text')
          .attr('x', m.left + 28).attr('y', yy + 10)
          .style('fill', item.color);
        lines.forEach((l, i) =>
          t.append('tspan').attr('x', m.left + 28).attr('dy', i === 0 ? 0 : '1.2em').text(l));
        yy += lines.length * 15 + 8;
      });
    }

    // Hover readout
    const guide = svg.selectAll<SVGLineElement, number>('line.guide').data([0]).join('line')
      .attr('class', 'guide').attr('y1', m.top).attr('y2', h - m.bottom)
      .attr('stroke', '#555').attr('stroke-dasharray', '4 3').attr('opacity', 0);

    svg.selectAll<SVGRectElement, number>('rect.overlay').data([0]).join('rect')
      .attr('class', 'overlay')
      .attr('x', m.left).attr('y', m.top)
      .attr('width', w - m.left - m.right).attr('height', h - m.top - m.bottom)
      .attr('fill', 'transparent').style('touch-action', 'pan-y')
      .on('pointermove', (e: PointerEvent) => {
        const [px] = pointer(e, this.svgEl);
        const day = Math.max(minDay, Math.min(maxDay, Math.round(x.invert(px))));
        const p = this.curve.find(d => d.day === day);
        if (!p) return;
        guide.attr('x1', x(day)).attr('x2', x(day)).attr('opacity', 1);
        this.showTip(e, `Day ${day}\n${this.standardLabel}: ${money(p.value)}\nProjected Cost with Patch: ${money(this.flatLine)}`);
      })
      .on('pointerleave', () => { guide.attr('opacity', 0); this.hideTip(); });
  }
}
