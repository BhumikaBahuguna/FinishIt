import { Card } from "../../../shared/components/ui/Card";

export function HabitStreakSummary({ habitStreakSummary }) {
  const { summaries, stats } = habitStreakSummary;

  return (
    <Card title="Habit Streak Summaries">
      <div className="kpi-grid analytics-kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">Active Habits</p>
          <p className="kpi-value">{stats.activeHabits}</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Completed Today</p>
          <p className="kpi-value">{stats.habitsCompletedToday}</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Avg Current Streak</p>
          <p className="kpi-value">{stats.averageCurrentStreak}</p>
        </div>
      </div>

      {summaries.length === 0 ? <p>No habits to analyze yet.</p> : null}

      {summaries.length > 0 ? (
        <ul className="data-list compact-list">
          {summaries.slice(0, 6).map((habit) => (
            <li key={habit.id} className="data-list-item">
              <div className="habit-row-header">
                <h3>{habit.title}</h3>
                <p className="data-list-meta">{habit.frequency}</p>
              </div>

              <p className="data-list-meta">Current streak: {habit.currentStreak} day(s)</p>
              <p className="data-list-meta">Best streak: {habit.bestStreak} day(s)</p>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
