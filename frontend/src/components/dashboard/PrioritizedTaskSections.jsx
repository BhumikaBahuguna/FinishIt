/**
 * PrioritizedTaskSections.jsx — EISENHOWER MATRIX DASHBOARD VIEW
 *
 * Displays the 4 Eisenhower quadrants as large colored sections with task cards.
 * Each quadrant has a distinct color and shows task cards with deadline/urgency badges.
 * Matches the premium dark dashboard aesthetic from the design reference.
 */
import { EISENHOWER_QUADRANTS } from "../../services/taskPrioritization";

const QUADRANT_CONFIG = [
  {
    key: EISENHOWER_QUADRANTS.DO_FIRST,
    title: "Do First",
    subtitle: "Urgent & Important",
    cssClass: "matrix-section--do-first"
  },
  {
    key: EISENHOWER_QUADRANTS.SCHEDULE,
    title: "Schedule",
    subtitle: "Not Urgent but Important",
    cssClass: "matrix-section--schedule"
  },
  {
    key: EISENHOWER_QUADRANTS.DELEGATE,
    title: "Delegate",
    subtitle: "Urgent But Not Important",
    cssClass: "matrix-section--delegate"
  },
  {
    key: EISENHOWER_QUADRANTS.ELIMINATE,
    title: "Eliminate",
    subtitle: "Not Urgent & Not Important",
    cssClass: "matrix-section--eliminate"
  }
];

/** Format a deadline into a human-readable relative string */
function formatDeadline(deadline) {
  if (!deadline) return null;
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  if (Number.isNaN(dl)) return null;

  const diffMs = dl - now;
  const absDiffMs = Math.abs(diffMs);

  if (diffMs < 0) {
    // Overdue
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    if (days > 0) return `Overdue by ${days}d`;
    const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
    return hours > 0 ? `Overdue by ${hours}h` : "Overdue";
  }

  const mins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (mins < 60) return `${mins} mins to start`;
  if (hours < 24) return `${hours}h remaining`;
  return `${days}d remaining`;
}

function getUrgencyBadge(task) {
  if (!task.deadline) return { label: "No deadline", type: "neutral" };
  const now = Date.now();
  const dl = new Date(task.deadline).getTime();
  if (Number.isNaN(dl)) return { label: "No deadline", type: "neutral" };

  const diffMs = dl - now;
  if (diffMs < 0) return { label: "Overdue", type: "overdue" };
  if (diffMs < 4 * 60 * 60 * 1000) return { label: "Critical", type: "critical" };
  if (diffMs < 48 * 60 * 60 * 1000) return { label: "Urgent", type: "urgent" };
  return { label: "Hover", type: "normal" };
}

function TaskCard({ task }) {
  const deadlineText = formatDeadline(task.deadline);
  const badge = getUrgencyBadge(task);

  return (
    <div className="matrix-task-card">
      <div className="matrix-task-card__header">
        <h4 className="matrix-task-card__title">{task.title}</h4>
        <span className={`matrix-task-badge matrix-task-badge--${badge.type}`}>
          {badge.type === "overdue" ? "🔴" : badge.type === "critical" ? "🔥" : ""}
        </span>
      </div>
      {deadlineText && (
        <p className="matrix-task-card__deadline">
          <span className="matrix-task-card__clock">⏱</span> {deadlineText}
        </p>
      )}
      <span className={`matrix-urgency-tag matrix-urgency-tag--${badge.type}`}>
        {badge.label}
      </span>
    </div>
  );
}

export function PrioritizedTaskSections({ matrix }) {
  return (
    <div className="matrix-dashboard">
      <h2 className="matrix-dashboard__title">Eisenhower Matrix</h2>

      <div className="matrix-dashboard__grid">
        {QUADRANT_CONFIG.map((quadrant) => {
          const tasks = matrix[quadrant.key] ?? [];

          return (
            <section
              key={quadrant.key}
              className={`matrix-section ${quadrant.cssClass}`}
            >
              <div className="matrix-section__header">
                <h3 className="matrix-section__title">
                  {quadrant.title}{" "}
                  <span className="matrix-section__subtitle">
                    ({quadrant.subtitle})
                  </span>
                </h3>
                <button className="matrix-section__menu" aria-label="Options">⋯</button>
              </div>

              <div className="matrix-section__cards">
                {tasks.length === 0 && (
                  <p className="matrix-section__empty">No tasks in this quadrant.</p>
                )}
                {tasks.slice(0, 4).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
