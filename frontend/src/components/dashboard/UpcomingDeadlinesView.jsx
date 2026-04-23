/**
 * UpcomingDeadlinesView.jsx — UPCOMING DEADLINES LIST SECTION
 *
 * Displays a styled list of tasks with approaching deadlines,
 * showing task title and deadline date/time with an info accent.
 */

export function UpcomingDeadlinesView({ upcomingDeadlines }) {
  return (
    <div className="detail-list-section">
      <div className="detail-list-section__header">
        <h3 className="detail-list-section__title">
          📅 Upcoming Deadlines
          <span className="detail-list-section__count">{upcomingDeadlines.length}</span>
        </h3>
      </div>

      {upcomingDeadlines.length === 0 ? (
        <p className="detail-list-section__empty">
          No upcoming deadlines.
        </p>
      ) : (
        <ul className="detail-list">
          {upcomingDeadlines.map((task) => {
            const deadline = new Date(task.deadline);
            const now = Date.now();
            const diffMs = deadline.getTime() - now;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            let timeLabel;
            if (diffHours < 24) {
              timeLabel = `${diffHours}h left`;
            } else {
              timeLabel = `${diffDays}d left`;
            }

            const isUrgent = diffHours < 24;

            return (
              <li
                key={task.id}
                className={`detail-list__item ${isUrgent ? "detail-list__item--warning" : "detail-list__item--info"}`}
              >
                <div className="detail-list__item-main">
                  <h4 className="detail-list__item-title">{task.title}</h4>
                  <p className="detail-list__item-meta">
                    Deadline: {deadline.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                <span
                  className={`detail-list__badge ${isUrgent ? "detail-list__badge--warning" : "detail-list__badge--info"}`}
                >
                  {timeLabel}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
