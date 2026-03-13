import { useEffect, useRef } from 'react';
import { BarChart3, RefreshCw, TrendingUp, Landmark, LineChart } from 'lucide-react';
import { INVESTMENTS } from '../data/mockData';
import * as d3 from 'd3';
import './InvestmentPortfolio.css';

function Sparkline({ data, color, width = 120, height = 40 }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!svgRef.current || !data) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const xScale = d3.scaleLinear().domain([0, data.length - 1]).range([2, width - 2]);
    const yScale = d3.scaleLinear()
      .domain([d3.min(data) * 0.95, d3.max(data) * 1.05])
      .range([height - 2, 2]);

    const line = d3.line().x((d, i) => xScale(i)).y(d => yScale(d)).curve(d3.curveMonotoneX);
    const area = d3.area().x((d, i) => xScale(i)).y0(height).y1(d => yScale(d)).curve(d3.curveMonotoneX);

    const defs = svg.append('defs');
    const gradientId = `spark-grad-${Math.random().toString(36).slice(2)}`;
    const gradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.3);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);

    svg.append('path').datum(data).attr('d', area).attr('fill', `url(#${gradientId})`);
    svg.append('path').datum(data).attr('d', line).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);
    svg.append('circle')
      .attr('cx', xScale(data.length - 1)).attr('cy', yScale(data[data.length - 1]))
      .attr('r', 3).attr('fill', color);
  }, [data, color, width, height]);

  return <svg ref={svgRef} width={width} height={height} role="img" aria-label="Performance trend" />;
}

const TYPE_ICONS = {
  'Mutual Fund': BarChart3,
  'SIP': RefreshCw,
  'Stock': TrendingUp,
  'Savings Scheme': Landmark,
  'ETF': LineChart,
};

export default function InvestmentPortfolio() {
  const totalInvested = INVESTMENTS.reduce((sum, inv) => sum + inv.invested, 0);
  const totalCurrent = INVESTMENTS.reduce((sum, inv) => sum + inv.current, 0);
  const totalReturns = ((totalCurrent - totalInvested) / totalInvested * 100).toFixed(1);

  return (
    <div className="invest">
      <div className="invest__header">
        <h2>Investment Portfolio</h2>
        <p>Track your investments across mutual funds, SIPs, stocks, and savings schemes.</p>
      </div>

      <div className="invest__summary">
        <div className="glass-card invest__summary-card glow-purple animate-slide-up stagger-1">
          <span className="invest__summary-label">Total Invested</span>
          <span className="invest__summary-value">₹{totalInvested.toLocaleString('en-IN')}</span>
        </div>
        <div className="glass-card invest__summary-card glow-emerald animate-slide-up stagger-2">
          <span className="invest__summary-label">Current Value</span>
          <span className="invest__summary-value" style={{ color: '#10b981' }}>₹{totalCurrent.toLocaleString('en-IN')}</span>
        </div>
        <div className="glass-card invest__summary-card glow-cyan animate-slide-up stagger-3">
          <span className="invest__summary-label">Total Returns</span>
          <span className="invest__summary-value" style={{ color: '#06b6d4' }}>+{totalReturns}%</span>
        </div>
      </div>

      <div className="invest__cards-wrapper">
        <div className="invest__cards scrollbar-hide">
          {INVESTMENTS.map((inv, i) => {
            const returnAmt = inv.current - inv.invested;
            const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
            const color = colors[i % colors.length];
            const TypeIcon = TYPE_ICONS[inv.type] || BarChart3;

            return (
              <div key={inv.id} className="invest__card glass-card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="invest__card-header">
                  <div className="invest__card-icon" style={{ background: color + '22', color }}>
                    <TypeIcon size={18} strokeWidth={1.8} />
                  </div>
                  <span className="invest__card-type" style={{ color }}>{inv.type}</span>
                </div>
                <h4 className="invest__card-name">{inv.name}</h4>
                <div className="invest__card-chart">
                  <Sparkline data={inv.monthlyData} color={color} width={200} height={60} />
                </div>
                <div className="invest__card-stats">
                  <div className="invest__card-stat">
                    <span className="invest__card-stat-label">Invested</span>
                    <span className="invest__card-stat-value">₹{inv.invested.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="invest__card-stat">
                    <span className="invest__card-stat-label">Current</span>
                    <span className="invest__card-stat-value" style={{ color: '#10b981' }}>₹{inv.current.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="invest__card-stat">
                    <span className="invest__card-stat-label">Returns</span>
                    <span className="invest__card-stat-value" style={{ color }}>+₹{returnAmt.toLocaleString('en-IN')} ({inv.returns}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
