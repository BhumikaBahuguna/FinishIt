import { Card } from "../../../shared/components/ui/Card";

export function OverdueTaskView({ overdueTasks }) {
  return (
    <Card title={`Overdue Tasks (${overdueTasks.length})`}>
      {overdueTasks.length === 0 ? <p>No overdue tasks.</p> : null}

      {overdueTasks.length > 0 ? (
        <ul className="data-list compact-list">
          {overdueTasks.map((task) => (
            <li key={task.id} className="data-list-item">
              <h3>{task.title}</h3>
              <p className="data-list-meta">Due: {new Date(task.deadline).toLocaleString()}</p>
              <p className="data-list-meta">Overdue by {task.overdueDays + 1} day(s)</p>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
