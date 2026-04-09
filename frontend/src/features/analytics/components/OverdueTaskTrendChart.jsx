/** OverdueTaskTrendChart.jsx — 14-day bar chart showing daily overdue task counts */
import { Card } from "../../../shared/components/ui/Card";

export function OverdueTaskTrendChart({ points }) {
  const maxValue = Math.max(...points.map((point) => point.count), 1);

  return (
    <Card title="Overdue Task Trends (Last 14 Days)">
      {points.length === 0 ? <p>No trend data available.</p> : null}

      {points.length > 0 ? (
        <div className="bar-chart" role="img" aria-label="Overdue task trend bar chart">
          {points.map((point) => {
            const heightPercent = Math.round((point.count / maxValue) * 100);

            return (
              <div key={point.isoDate} className="bar-group">
                <div className="bar-track">
                  <div
                    className="bar-fill bar-fill-alert"
                    style={{ height: `${heightPercent}%` }}
                    title={`${point.label}: ${point.count}`}
                  />
                </div>
                <p className="bar-value">{point.count}</p>
                <p className="bar-label">{point.label}</p>
              </div>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
}
