import { Card } from "../../../shared/components/ui/Card";

export function TaskCompletionStatistics({ stats }) {
  return (
    <Card title="Task Completion Statistics">
      <div className="kpi-grid analytics-kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">Total Tasks</p>
          <p className="kpi-value">{stats.totalTasks}</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Completed</p>
          <p className="kpi-value">{stats.completedTasks}</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Completion Rate</p>
          <p className="kpi-value">{stats.completionRate}%</p>
        </div>
      </div>

      <div className="progress-track" aria-label="Task completion progress">
        <div className="progress-fill" style={{ width: `${stats.completionRate}%` }} />
      </div>

      <ul className="data-list compact-list">
        <li className="data-list-item">
          <p className="data-list-meta">Pending: {stats.pendingTasks}</p>
          <p className="data-list-meta">In Progress: {stats.inProgressTasks}</p>
          <p className="data-list-meta">Archived: {stats.archivedTasks}</p>
        </li>
      </ul>
    </Card>
  );
}
