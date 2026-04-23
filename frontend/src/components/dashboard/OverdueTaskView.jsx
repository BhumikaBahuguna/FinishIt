/**
 * OverdueTaskView.jsx — OVERDUE TASKS LIST SECTION
 *
 * Displays a styled list of overdue tasks with red accent borders,
 * showing task title, due date, and how long overdue each task is.
 */

export function OverdueTaskView({ overdueTasks }) {
  return (
    <div className="detail-list-section">
      <div className="detail-list-section__header">
        <h3 className="detail-list-section__title">
          🚨 Overdue Tasks
          <span className="detail-list-section__count">{overdueTasks.length}</span>
        </h3>
      </div>

      {overdueTasks.length === 0 ? (
        <p className="detail-list-section__empty">
          ✨ No overdue tasks — you're all caught up!
        </p>
      ) : (
        <ul className="detail-list">
          {overdueTasks.map((task) => (
            <li key={task.id} className="detail-list__item detail-list__item--danger">
              <div className="detail-list__item-main">
                <h4 className="detail-list__item-title">{task.title}</h4>
                <p className="detail-list__item-meta">
                  Due: {new Date(task.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
              <span className="detail-list__badge detail-list__badge--danger">
                {task.overdueDays + 1}d overdue
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
