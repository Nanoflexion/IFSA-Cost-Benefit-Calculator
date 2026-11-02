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

    const maxDay = this.curve[this.curve.length - 1].day;
    const x = scaleLinear().domain([0, maxDay]).range([m.left, w - m.right]);
    const yMax = Math.max(this.flatLine, ...this.curve.map(d => d.value));
    const y = scaleLinear().domain([0, yMax]).nice().range([h - m.bottom, m.top]);
    const path = line<Point>().x(d => x(d.day)).y(d => y(d.value)).curve(curveMonotoneX);

    // Axes
    svg.selectAll<SVGGElement, number>('g.x-axis').data([0]).join('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${h - m.bottom})`)
      .call(axisBottom(x).ticks(Math.min(maxDay, 10)).tickFormat(d => String(d)));
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

    // Line labels
    const mid = this.curve[Math.floor(this.curve.length * 0.6)];
    svg.selectAll<SVGTextElement, number>('text.lbl-standard').data([0]).join('text')
      .attr('class', 'lbl-standard').attr('text-anchor', 'end')
      .attr('x', x(mid.day) - 8).attr('y', y(mid.value) - 10)
      .style('fill', COLORS.standardLine).text(this.standardLabel);
    svg.selectAll<SVGTextElement, number>('text.lbl-flat').data([0]).join('text')
      .attr('class', 'lbl-flat').attr('text-anchor', 'end')
      .attr('x', w - m.right).attr('y', y(this.flatLine) + 18)
      .style('fill', COLORS.patchLine).text(this.flatLabel);

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
        const day = Math.max(0, Math.min(maxDay, Math.round(x.invert(px))));
        const p = this.curve.find(d => d.day === day);
        if (!p) return;
        guide.attr('x1', x(day)).attr('x2', x(day)).attr('opacity', 1);
        this.showTip(e, `Day ${day}\n${this.standardLabel}: ${money(p.value)}\nProjected Cost with Patch: ${money(this.flatLine)}`);
      })
      .on('pointerleave', () => { guide.attr('opacity', 0); this.hideTip(); });
  }
}
