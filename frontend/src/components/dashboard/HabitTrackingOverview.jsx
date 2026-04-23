/**
 * HabitTrackingOverview.jsx — HABIT TRACKER SIDEBAR PANEL
 *
 * Redesigned to match the premium dashboard reference:
 * - Streak Flame banner with current top streak
 * - Weekly calendar grid showing completion dots
 * - Habit streaks list with fire/star icons and day counts
 */


/** Build a weekly calendar grid for the current week */
function getWeekDays() {
  const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return days.map((label, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      label,
      date: date.getDate(),
      isToday:
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth()
    };
  });
}

/** Pick a streak icon based on streak length */
function getStreakIcon(streak) {
  if (streak >= 14) return "⭐";
  if (streak >= 7) return "🔥";
  if (streak >= 3) return "🔥";
  return "↗";
}

export function HabitTrackingOverview({
  habitsToday,
  onToggleHabit,
  isUpdatingHabit
}) {
  const weekDays = getWeekDays();

  // Find the habit with the best current streak for the banner
  const topStreakHabit = habitsToday.reduce(
    (best, habit) =>
      (habit.currentStreak ?? 0) > (best?.currentStreak ?? 0) ? habit : best,
    habitsToday[0]
  );

  const topStreakDays = topStreakHabit?.currentStreak ?? 0;
  const completedCount = habitsToday.filter((h) => h.completedToday).length;
  const totalCount = habitsToday.length;

  return (
    <div className="habit-panel">
      <div className="habit-panel__header-row">
        <h2 className="habit-panel__title">Habit Tracker</h2>
        <button className="matrix-section__menu" aria-label="Options">⋯</button>
      </div>

      {/* Streak Flame Banner */}
      <div className="streak-banner">
        <div className="streak-banner__icon">🔥 Streak Flame</div>
        <p className="streak-banner__value">
          Focus Streak: {topStreakDays} Days 🔥
        </p>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="habit-calendar">
        <div className="habit-calendar__header">
          {weekDays.map((day) => (
            <span
              key={day.label}
              className={`habit-calendar__day-label ${day.isToday ? "habit-calendar__day-label--today" : ""}`}
            >
              {day.label}
            </span>
          ))}
        </div>

        {/* Completion dot rows per habit (show up to 4 rows) */}
        {habitsToday.slice(0, 4).map((habit) => (
          <div key={habit.id} className="habit-calendar__row">
            {weekDays.map((day) => (
              <span
                key={day.label}
                className={`habit-calendar__dot ${
                  day.isToday && habit.completedToday
                    ? "habit-calendar__dot--done"
                    : day.isToday
                      ? "habit-calendar__dot--today"
                      : "habit-calendar__dot--past"
                }`}
              />
            ))}
          </div>
        ))}

        {habitsToday.length === 0 && (
          <p className="habit-panel__empty">No habits tracked yet.</p>
        )}
      </div>

      {/* Completion summary */}
      <div className="habit-panel__summary">
        <span className="habit-panel__summary-label">Today</span>
        <span className="habit-panel__summary-value">
          {completedCount}/{totalCount} completed
        </span>
      </div>

      {/* Habit Streaks List */}
      <div className="habit-streaks">
        <h3 className="habit-streaks__title">HABIT STREAKS</h3>
        <ul className="habit-streaks__list">
          {habitsToday.map((habit) => (
            <li key={habit.id} className="habit-streaks__item">
              <div className="habit-streaks__left">
                <span className="habit-streaks__icon">
                  {getStreakIcon(habit.currentStreak ?? 0)}
                </span>
                <div className="habit-streaks__info">
                  <span className="habit-streaks__name">{habit.title}</span>
                  {habit.currentStreak >= 7 && (
                    <span className="habit-streaks__fire">🔥</span>
                  )}
                </div>
              </div>
              <div className="habit-streaks__right">
                <span className="habit-streaks__days">
                  {habit.currentStreak ?? 0} days
                </span>
                <label className="habit-toggle">
                  <input
                    type="checkbox"
                    checked={habit.completedToday}
                    disabled={isUpdatingHabit}
                    onChange={(e) =>
                      onToggleHabit(habit.id, e.target.checked)
                    }
                  />
                  <span className="habit-toggle__slider" />
                </label>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
