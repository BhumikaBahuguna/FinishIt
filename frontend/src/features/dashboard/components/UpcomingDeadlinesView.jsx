import { Card } from "../../../shared/components/ui/Card";

export function UpcomingDeadlinesView({ upcomingDeadlines }) {
  return (
    <Card title="Upcoming Deadlines">
      {upcomingDeadlines.length === 0 ? <p>No upcoming deadlines.</p> : null}

      {upcomingDeadlines.length > 0 ? (
        <ul className="data-list compact-list">
          {upcomingDeadlines.map((task) => (
            <li key={task.id} className="data-list-item">
              <h3>{task.title}</h3>
              <p className="data-list-meta">Deadline: {new Date(task.deadline).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
