/**
 * TaskActivityChart.jsx — SVG LINE CHART (Task Activity, last 14 days)
 *
 * Displays an SVG line chart showing task activity over the last 14 days.
 * Uses a smooth polyline with gradient fill beneath it.
 */

export function TaskActivityChart({ points }) {
  if (!points || points.length === 0) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-card__title">Task Activity</h3>
        <p className="analytics-chart-card__subtitle">Last 14 days</p>
        <p className="analytics-chart-card__empty">No data available yet.</p>
      </div>
    );
  }

  const maxVal = Math.max(...points.map((p) => p.count), 1);
  const chartW = 400;
  const chartH = 160;
  const padL = 30;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const coords = points.map((p, i) => ({
    x: padL + (i / (points.length - 1)) * innerW,
    y: padT + innerH - (p.count / maxVal) * innerH,
    label: p.label,
    count: p.count
  }));

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const areaPoints = [
    `${coords[0].x},${padT + innerH}`,
    ...coords.map((c) => `${c.x},${c.y}`),
    `${coords[coords.length - 1].x},${padT + innerH}`
  ].join(" ");

  // Y-axis labels
  const yTicks = [0, Math.ceil(maxVal / 4), Math.ceil(maxVal / 2), Math.ceil((3 * maxVal) / 4), maxVal];
  // X-axis: show a few labels
  const xLabelIndexes = [0, Math.floor(points.length / 3), Math.floor((2 * points.length) / 3), points.length - 1];

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-card__title">Task Activity</h3>
      <p className="analytics-chart-card__subtitle">Last 14 days</p>

      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="analytics-svg-chart">
        <defs>
          <linearGradient id="taskAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = padT + innerH - (tick / maxVal) * innerH;
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              <text x={padL - 5} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="8">{tick}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <polygon points={areaPoints} fill="url(#taskAreaGradient)" />

        {/* Line */}
        <polyline points={polylinePoints} fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill="#00e5ff" stroke="#030303" strokeWidth="1.5">
            <title>{c.label}: {c.count}</title>
          </circle>
        ))}

        {/* X-axis labels */}
        {xLabelIndexes.map((idx) => {
          if (!coords[idx]) return null;
          return (
            <text key={idx} x={coords[idx].x} y={chartH - 5} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8">
              {points[idx].label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
