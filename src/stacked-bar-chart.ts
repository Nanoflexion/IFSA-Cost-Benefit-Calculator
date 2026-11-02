import { customElement, property } from 'lit/decorators.js';
import { select, type Selection } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import 'd3-transition';
import { ChartBase } from './chart-base';
import { money, moneyCompact, type Segment } from './formulas';
import { SETTINGS } from './config';

export interface BarGroup { label: string; segments: Segment[] }
interface Rect { id: string; seg: Segment; group: BarGroup; y0: number; y1: number }

function wrapLabels(sel: Selection<any, any, any, any>, maxChars: number) {
  sel.each(function () {
    const t = select(this);
    const words = t.text().split(/\s+/);
    t.text(null).attr('dy', null);
    const lines: string[] = [];
    let cur = '';
    for (const wd of words) {
      if (cur && (cur + ' ' + wd).length > maxChars) { lines.push(cur); cur = wd; }
      else cur = (cur + ' ' + wd).trim();
    }
    if (cur) lines.push(cur);
    lines.forEach((l, i) =>
      t.append('tspan').attr('x', 0).attr('dy', i === 0 ? '0.9em' : '1.15em').text(l));
  });
}

@customElement('stacked-bar-chart')
export class StackedBarChart extends ChartBase {
  @property({ attribute: false }) groups: BarGroup[] = [];
  @property() yLabel = '$$$';
  @property({ type: Boolean, attribute: 'show-ticks' }) showTicks = false;

  protected override draw() {
    if (!this.svgEl || this.width < 10) return;
    const w = this.width, h = SETTINGS.barChartHeight;
    const m = { top: 28, right: 16, bottom: 72, left: this.showTicks ? 64 : 40 };
    const svg = select(this.svgEl).attr('viewBox', `0 0 ${w} ${h}`);

    const x = scaleBand().domain(this.groups.map(g => g.label))
      .range([m.left, w - m.right]).padding(0.5);
    const yMax = Math.max(1, ...this.groups.map(g => g.segments.reduce((s, d) => s + d.value, 0)));
    const y = scaleLinear().domain([0, yMax]).nice().range([h - m.bottom, m.top]);

    // Axes
    svg.selectAll<SVGGElement, number>('g.x-axis').data([0]).join('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${h - m.bottom})`)
      .call(axisBottom(x).tickSize(0))
      .selectAll('text').call(wrapLabels, Math.max(10, Math.floor(x.step() / 7)));

    svg.selectAll<SVGGElement, number>('g.y-axis').data([0]).join('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${m.left},0)`)
      .call(axisLeft(y).ticks(5)
        .tickSize(this.showTicks ? 6 : 0)
        .tickFormat(this.showTicks ? (d) => moneyCompact(Number(d)) : () => ''));

    svg.selectAll<SVGTextElement, number>('text.y-title').data([0]).join('text')
      .attr('class', 'y-title')
      .attr('transform', `translate(14,${(m.top + h - m.bottom) / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .text(this.yLabel);

    // Stack segments
    const rects: Rect[] = this.groups.flatMap(g => {
      let acc = 0;
      return g.segments.map(seg => {
        const r = { id: `${g.label}|${seg.key}`, seg, group: g, y0: acc, y1: acc + seg.value };
        acc += seg.value;
        return r;
      });
    });

    // Total cost label on top of each bar
const totals = this.groups.map(g => ({
  label: g.label,
  total: g.segments.reduce((s, d) => s + d.value, 0),
}));

    svg.selectAll<SVGGElement, number>('g.totals').data([0]).join('g')
        .attr('class', 'totals')
        .selectAll<SVGTextElement, { label: string; total: number }>('text')
        .data(totals, d => d.label)
        .join(enter => enter.append('text').attr('y', y(0)))
        .attr('class', 'total')
        .attr('text-anchor', 'middle')
        .attr('x', d => x(d.label)! + x.bandwidth() / 2)
        .text(d => money(d.total))
        .transition().duration(300)
        .attr('y', d => y(d.total) - 6);

    svg.selectAll<SVGGElement, number>('g.bars').data([0]).join('g').attr('class', 'bars')
      .selectAll<SVGRectElement, Rect>('rect')
      .data(rects, d => d.id)
      .join(enter => enter.append('rect').attr('y', y(0)).attr('height', 0))
      .attr('x', d => x(d.group.label)!)
      .attr('width', x.bandwidth())
      .attr('fill', d => d.seg.color)
      .on('pointermove', (e: PointerEvent, d) =>
        this.showTip(e, `${d.seg.label}\n${d.seg.detail ?? money(d.seg.value)}`))
      .on('pointerleave', () => this.hideTip())
      .transition().duration(300)
      .attr('y', d => y(d.y1))
      .attr('height', d => y(d.y0) - y(d.y1));
  }
}
