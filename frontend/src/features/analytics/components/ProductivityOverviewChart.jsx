/** ProductivityOverviewChart.jsx — 7-day grouped bar chart comparing tasks vs habits completed */
import { Card } from "../../../shared/components/ui/Card";

export function ProductivityOverviewChart({ points, summary }) {
  const maxValue = Math.max(
    ...points.map((point) => Math.max(point.tasksCompleted, point.habitsCompleted)),
    1
  );

  return (
    <Card title="Productivity Overview Charts (Last 7 Days)">
      <p className="data-list-meta">
        Most productive day: {summary.bestProductivityDay} (score {summary.bestProductivityScore})
      </p>

      {points.length === 0 ? <p>No productivity data available.</p> : null}

      {points.length > 0 ? (
        <div className="grouped-chart" role="img" aria-label="Tasks and habits completion chart">
          {points.map((point) => {
            const tasksHeight = Math.round((point.tasksCompleted / maxValue) * 100);
            const habitsHeight = Math.round((point.habitsCompleted / maxValue) * 100);

            return (
              <div key={point.isoDate} className="grouped-bar-group">
                <div className="grouped-bars">
                  <div
                    className="bar-fill bar-fill-primary"
                    style={{ height: `${tasksHeight}%` }}
                    title={`${point.label} tasks: ${point.tasksCompleted}`}
                  />
                  <div
                    className="bar-fill bar-fill-secondary"
                    style={{ height: `${habitsHeight}%` }}
                    title={`${point.label} habits: ${point.habitsCompleted}`}
                  />
                </div>
                <p className="bar-value small-value">
                  {point.tasksCompleted}/{point.habitsCompleted}
                </p>
                <p className="bar-label">{point.label}</p>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="chart-legend">
        <span><i className="legend-dot legend-primary" /> Tasks completed</span>
        <span><i className="legend-dot legend-secondary" /> Habits completed</span>
      </div>
    </Card>
  );
}
