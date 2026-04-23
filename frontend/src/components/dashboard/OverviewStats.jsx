/**
 * OverviewStats.jsx — DASHBOARD KPI STATISTICS CARDS
 *
 * Displays total tasks, completed tasks, overdue tasks, active tasks,
 * total habits, and habits done today as a horizontal grid of stat cards.
 */

const STAT_CARDS = [
  { key: "totalTasks", label: "Total Tasks", icon: "📋", accentClass: "kpi-stat--primary" },
  { key: "completedTasks", label: "Completed", icon: "✅", accentClass: "kpi-stat--success" },
  { key: "overdueTasks", label: "Overdue", icon: "⚠️", accentClass: "kpi-stat--danger" },
  { key: "pendingTasks", label: "Active Tasks", icon: "🔄", accentClass: "kpi-stat--info" },
  { key: "totalHabits", label: "Total Habits", icon: "🎯", accentClass: "kpi-stat--purple" },
  { key: "completedHabitsToday", label: "Habits Done Today", icon: "🔥", accentClass: "kpi-stat--warning" }
];

export function OverviewStats({ stats }) {
  return (
    <section className="kpi-stats-row" aria-label="Dashboard summary statistics">
      {STAT_CARDS.map((item) => (
        <div key={item.key} className={`kpi-stat-card ${item.accentClass}`}>
          <div className="kpi-stat-card__icon">{item.icon}</div>
          <div className="kpi-stat-card__content">
            <p className="kpi-stat-card__value">{stats[item.key] ?? 0}</p>
            <p className="kpi-stat-card__label">{item.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
