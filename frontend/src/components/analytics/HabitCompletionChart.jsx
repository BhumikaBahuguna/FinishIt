/**
 * HabitCompletionChart.jsx — SVG AREA CHART (Habit Completion Rate)
 *
 * Displays a smooth area chart showing the percentage of habits
 * completed per day over the last period.
 */

export function HabitCompletionChart({ points, habitsTotal }) {
  if (!points || points.length === 0) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-card__title">Habit Completion Rate</h3>
        <p className="analytics-chart-card__subtitle">% of habits completed per day</p>
        <p className="analytics-chart-card__empty">No data available yet.</p>
      </div>
    );
  }

  // Compute completion % per day
  const safeTotal = Math.max(habitsTotal, 1);
  const data = points.map((p) => ({
    ...p,
    percentage: Math.round((p.habitsCompleted / safeTotal) * 100)
  }));

  const maxVal = 100;
  const chartW = 400;
  const chartH = 160;
  const padL = 30;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const coords = data.map((p, i) => ({
    x: padL + (i / Math.max(data.length - 1, 1)) * innerW,
    y: padT + innerH - (p.percentage / maxVal) * innerH,
    label: p.label,
    pct: p.percentage
  }));

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const areaPoints = [
    `${coords[0].x},${padT + innerH}`,
    ...coords.map((c) => `${c.x},${c.y}`),
    `${coords[coords.length - 1].x},${padT + innerH}`
  ].join(" ");

  const yTicks = [0, 25, 50, 75, 100];
  const xLabelIndexes = [0, Math.floor(data.length / 3), Math.floor((2 * data.length) / 3), data.length - 1];

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-card__title">Habit Completion Rate</h3>
      <p className="analytics-chart-card__subtitle">% of habits completed per day</p>

      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="analytics-svg-chart">
        <defs>
          <linearGradient id="habitAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e676" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00e676" stopOpacity="0.02" />
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
        <polygon points={areaPoints} fill="url(#habitAreaGradient)" />

        {/* Line */}
        <polyline points={polylinePoints} fill="none" stroke="#00e676" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill="#00e676" stroke="#030303" strokeWidth="1.5">
            <title>{c.label}: {c.pct}%</title>
          </circle>
        ))}

        {/* X-axis labels */}
        {xLabelIndexes.map((idx) => {
          if (!coords[idx]) return null;
          return (
            <text key={idx} x={coords[idx].x} y={chartH - 5} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8">
              {data[idx].label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
