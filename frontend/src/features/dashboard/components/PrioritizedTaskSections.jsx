import { Card } from "../../../shared/components/ui/Card";
import { EISENHOWER_QUADRANTS } from "../../tasks/services/taskPrioritization";

const QUADRANT_CONFIG = [
  {
    key: EISENHOWER_QUADRANTS.DO_FIRST,
    title: "Urgent and Important"
  },
  {
    key: EISENHOWER_QUADRANTS.SCHEDULE,
    title: "Important but Not Urgent"
  },
  {
    key: EISENHOWER_QUADRANTS.DELEGATE,
    title: "Urgent but Not Important"
  },
  {
    key: EISENHOWER_QUADRANTS.ELIMINATE,
    title: "Neither Urgent nor Important"
  }
];

export function PrioritizedTaskSections({ matrix }) {
  return (
    <Card title="Prioritized Task Sections">
      <section className="matrix-grid">
        {QUADRANT_CONFIG.map((quadrant) => {
          const tasks = matrix[quadrant.key] ?? [];

          return (
            <article key={quadrant.key} className={`matrix-quadrant matrix-quadrant-${quadrant.key}`}>
              <h3>{quadrant.title}</h3>
              {tasks.length === 0 ? <p className="data-list-meta">No tasks.</p> : null}

              {tasks.length > 0 ? (
                <ul className="data-list compact-list">
                  {tasks.slice(0, 3).map((task) => (
                    <li key={task.id} className="data-list-item">
                      <h4>{task.title}</h4>
                      <p className="data-list-meta">Status: {task.status}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        })}
      </section>
    </Card>
  );
}
