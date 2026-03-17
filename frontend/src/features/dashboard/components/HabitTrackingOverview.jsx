import { Card } from "../../../shared/components/ui/Card";

export function HabitTrackingOverview({ habitsToday, onToggleHabit, isUpdatingHabit }) {
  return (
    <Card title="Today Habit Tracking">
      {habitsToday.length === 0 ? <p>No habits yet.</p> : null}

      {habitsToday.length > 0 ? (
        <ul className="data-list compact-list">
          {habitsToday.map((habit) => (
            <li key={habit.id} className="data-list-item">
              <div className="habit-row-header">
                <h3>{habit.title}</h3>
                <p className="data-list-meta">{habit.frequency}</p>
              </div>

              <div className="checkbox-row">
                <input
                  id={`dashboard-habit-${habit.id}`}
                  type="checkbox"
                  checked={habit.completedToday}
                  disabled={isUpdatingHabit}
                  onChange={(event) => onToggleHabit(habit.id, event.target.checked)}
                />
                <label htmlFor={`dashboard-habit-${habit.id}`}>Completed today</label>
              </div>

              <p className="data-list-meta">Current streak: {habit.currentStreak} day(s)</p>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
