/**
 * HabitTrackingPage.jsx — HABIT TRACKING PAGE (/habits)
 *
 * Redesigned premium habit tracking interface featuring:
 *   - KPI summary cards (Total streak days, Completed today, Consistency rank)
 *   - Habit cards with emoji icons, streak info, weekly dots, and progress rings
 *   - Consistency heatmap (GitHub-style contribution grid)
 *   - Create habit form (collapsible)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  createHabit,
  deleteHabit,
  listHabitsByUser,
  listHabitLogsByHabitIds,
  upsertHabitLog
} from "../services/habitsApi";
import { buildHabitProgressByHabit, getTodayIsoDate } from "../services/habitStreaks";
import { Button } from "../components/ui/Button";
import { validateHabitPayload } from "../utils/validation";

const DEFAULT_HABIT_FORM = {
  title: "",
  frequency: "daily"
};

/** Rotating color palette for habit cards */
const HABIT_COLORS = [
  { border: "rgba(185, 117, 255, 0.5)", dot: "#b975ff", ring: "#b975ff", bg: "rgba(185, 117, 255, 0.06)" },
  { border: "rgba(0, 229, 255, 0.5)", dot: "#00e5ff", ring: "#00e5ff", bg: "rgba(0, 229, 255, 0.06)" },
  { border: "rgba(0, 230, 118, 0.5)", dot: "#00e676", ring: "#00e676", bg: "rgba(0, 230, 118, 0.06)" },
  { border: "rgba(255, 234, 0, 0.5)", dot: "#ffea00", ring: "#ffea00", bg: "rgba(255, 234, 0, 0.06)" },
  { border: "rgba(255, 23, 107, 0.5)", dot: "#ff176b", ring: "#ff176b", bg: "rgba(255, 23, 107, 0.06)" },
  { border: "rgba(255, 107, 0, 0.5)", dot: "#ff6b00", ring: "#ff6b00", bg: "rgba(255, 107, 0, 0.06)" }
];

/** Emoji icons to assign to habits */
const HABIT_ICONS = ["🧘", "⏱️", "💪", "📖", "✍️", "🎯", "🏃", "💡", "🎨", "🌱"];

/** SVG circular progress ring */
function ProgressRing({ percentage, color, size = 40 }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="habit-progress-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize="10"
        fontWeight="700"
      >
        {percentage}%
      </text>
    </svg>
  );
}

/** Weekly completion dots (last 7 days) */
function WeeklyDots({ habitLogs, color }) {
  // Build an array of the last 7 days
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const completed = habitLogs.some((l) => l.log_date === iso && l.completed);
    days.push({ iso, completed });
  }

  return (
    <div className="habit-weekly-dots">
      {days.map((day) => (
        <span
          key={day.iso}
          className={`habit-weekly-dot ${day.completed ? "habit-weekly-dot--done" : ""}`}
          style={day.completed ? { background: color } : undefined}
          title={day.iso}
        />
      ))}
    </div>
  );
}

/** Consistency Heatmap — GitHub-style contribution grid */
function ConsistencyHeatmap({ habitLogs }) {
  // Build a map of date -> count across all habits
  const dateCounts = useMemo(() => {
    const counts = {};
    (habitLogs ?? []).forEach((log) => {
      if (log.completed) {
        counts[log.log_date] = (counts[log.log_date] || 0) + 1;
      }
    });
    return counts;
  }, [habitLogs]);

  // Generate the last 90 days
  const cells = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      result.push({ date: iso, count: dateCounts[iso] || 0 });
    }
    return result;
  }, [dateCounts]);

  const maxCount = Math.max(1, ...cells.map((c) => c.count));

  function getIntensity(count) {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  return (
    <div className="heatmap-section">
      <h3 className="heatmap-section__title">Consistency Heatmap</h3>
      <div className="heatmap-grid">
        {cells.map((cell) => (
          <span
            key={cell.date}
            className={`heatmap-cell heatmap-cell--${getIntensity(cell.count)}`}
            title={`${cell.date}: ${cell.count} completed`}
          />
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend__label">Less</span>
        <span className="heatmap-cell heatmap-cell--0" />
        <span className="heatmap-cell heatmap-cell--1" />
        <span className="heatmap-cell heatmap-cell--2" />
        <span className="heatmap-cell heatmap-cell--3" />
        <span className="heatmap-cell heatmap-cell--4" />
        <span className="heatmap-legend__label">More</span>
      </div>
    </div>
  );
}

export function HabitTrackingPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [habitForm, setHabitForm] = useState(DEFAULT_HABIT_FORM);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const habitProgressById = useMemo(
    () => buildHabitProgressByHabit(habits, habitLogs),
    [habits, habitLogs]
  );

  const loadHabits = useCallback(async () => {
    if (!user?.id) {
      setHabits([]);
      setHabitLogs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const { data: habitsData, error: habitsError } = await listHabitsByUser(user.id);

      if (habitsError) {
        setErrorMessage(habitsError.message);
        return;
      }

      const nextHabits = habitsData ?? [];
      setHabits(nextHabits);

      const habitIds = nextHabits.map((habit) => habit.id);
      const { data: logsData, error: logsError } = await listHabitLogsByHabitIds(habitIds);

      if (logsError) {
        setErrorMessage(logsError.message);
        return;
      }

      setHabitLogs(logsData ?? []);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load habits.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  function handleHabitFormChange(event) {
    const { name, value } = event.target;

    setHabitForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleHabitCreate(event) {
    event.preventDefault();

    if (!user?.id) return;

    const validation = validateHabitPayload(
      {
        title: habitForm.title,
        frequency: habitForm.frequency
      },
      { partial: false }
    );

    if (!validation.isValid) {
      setSubmitErrorMessage(validation.errors.join(" "));
      return;
    }

    setSubmitErrorMessage("");
    setIsSubmitting(true);

    try {
      const { error } = await createHabit({
        user_id: user.id,
        title: validation.normalized.title,
        frequency: validation.normalized.frequency
      });

      if (error) {
        setSubmitErrorMessage(error.message);
        return;
      }

      setHabitForm(DEFAULT_HABIT_FORM);
      setShowCreateForm(false);
      await loadHabits();
    } catch (error) {
      setSubmitErrorMessage(error.message || "Unable to create habit.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleHabitDelete(habitId) {
    setSubmitErrorMessage("");

    try {
      const { error } = await deleteHabit(habitId);

      if (error) {
        setSubmitErrorMessage(error.message);
        return;
      }

      await loadHabits();
    } catch (error) {
      setSubmitErrorMessage(error.message || "Unable to delete habit.");
    }
  }

  async function handleTodayToggle(habitId, completed) {
    setSubmitErrorMessage("");

    try {
      const { error } = await upsertHabitLog({
        habitId,
        logDate: getTodayIsoDate(),
        completed
      });

      if (error) {
        setSubmitErrorMessage(error.message);
        return;
      }

      await loadHabits();
    } catch (error) {
      setSubmitErrorMessage(error.message || "Unable to update habit completion.");
    }
  }

  // Computed KPI values
  const totalStreakDays = habits.reduce(
    (sum, h) => sum + (habitProgressById.get(h.id)?.currentStreak ?? 0),
    0
  );
  const completedToday = habits.filter(
    (h) => habitProgressById.get(h.id)?.completedToday
  ).length;
  const totalHabits = habits.length;

  // Consistency rank based on average streak
  const avgStreak = totalHabits > 0 ? totalStreakDays / totalHabits : 0;
  const consistencyLevel = Math.min(10, Math.max(1, Math.ceil(avgStreak / 3)));

  // Get logs for a specific habit
  function getHabitLogs(habitId) {
    return habitLogs.filter((l) => l.habit_id === habitId);
  }

  // Calculate completion percentage (last 7 days)
  function getCompletionPercentage(habitId) {
    const logs = getHabitLogs(habitId);
    const today = new Date();
    let completed = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      if (logs.some((l) => l.log_date === iso && l.completed)) {
        completed++;
      }
    }
    return Math.round((completed / 7) * 100);
  }

  return (
    <div className="habits-page">
      {/* Page Header */}
      <header className="habits-page__header">
        <div>
          <h1 className="habits-page__title">Habits</h1>
          <p className="habits-page__subtitle">Build consistency. Own your days.</p>
        </div>
        <Button type="button" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "✕ Close" : "+ New Habit"}
        </Button>
      </header>

      {/* Error messages */}
      {errorMessage && <p className="status-error">{errorMessage}</p>}
      {submitErrorMessage && <p className="status-error">{submitErrorMessage}</p>}

      {/* Create Habit Form (collapsible) */}
      {showCreateForm && (
        <div className="habits-create-card">
          <h3 className="habits-create-card__title">Create a New Habit</h3>
          <form className="habits-create-form" onSubmit={handleHabitCreate}>
            <input
              id="habit-title"
              name="title"
              value={habitForm.title}
              onChange={handleHabitFormChange}
              placeholder="Habit name (e.g. Morning Meditation)"
              className="habits-create-form__input"
              required
            />
            <select
              id="habit-frequency"
              name="frequency"
              value={habitForm.frequency}
              onChange={handleHabitFormChange}
              className="habits-create-form__select"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Habit"}
            </Button>
          </form>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="habits-kpi-row">
        <div className="habits-kpi-card habits-kpi-card--fire">
          <span className="habits-kpi-card__icon">🔥</span>
          <div>
            <p className="habits-kpi-card__value">{totalStreakDays}</p>
            <p className="habits-kpi-card__label">Total streak days</p>
          </div>
        </div>

        <div className="habits-kpi-card habits-kpi-card--trophy">
          <span className="habits-kpi-card__icon">🏆</span>
          <div>
            <p className="habits-kpi-card__value">
              {completedToday}/{totalHabits}
            </p>
            <p className="habits-kpi-card__label">Completed today</p>
          </div>
        </div>

        <div className="habits-kpi-card habits-kpi-card--star">
          <span className="habits-kpi-card__icon">⭐</span>
          <div>
            <p className="habits-kpi-card__value">Level {consistencyLevel}</p>
            <p className="habits-kpi-card__label">Consistency rank</p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="dashboard-loading">
          <div className="dashboard-loading__spinner" />
          <p>Loading habits...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && habits.length === 0 && (
        <div className="habits-empty">
          <p className="habits-empty__icon">🎯</p>
          <p className="habits-empty__text">No habits yet. Create your first habit to start building consistency!</p>
        </div>
      )}

      {/* Habit Cards List */}
      {!isLoading && habits.length > 0 && (
        <div className="habits-list">
          {habits.map((habit, index) => {
            const colorTheme = HABIT_COLORS[index % HABIT_COLORS.length];
            const icon = HABIT_ICONS[index % HABIT_ICONS.length];
            const progress = habitProgressById.get(habit.id);
            const currentStreak = progress?.currentStreak ?? 0;
            const completedTodayFlag = progress?.completedToday ?? false;
            const percentage = getCompletionPercentage(habit.id);
            const logs = getHabitLogs(habit.id);

            return (
              <div
                key={habit.id}
                className="habit-card"
                style={{
                  borderLeftColor: colorTheme.border,
                  background: colorTheme.bg
                }}
              >
                {/* Left: Icon + Info */}
                <div className="habit-card__left">
                  <div
                    className="habit-card__icon"
                    style={{ background: `${colorTheme.border}` }}
                  >
                    {icon}
                  </div>
                  <div className="habit-card__info">
                    <h3 className="habit-card__name">{habit.title}</h3>
                    <p className="habit-card__streak">
                      🔥 {currentStreak} day streak
                    </p>
                  </div>
                </div>

                {/* Right: Weekly dots + Progress + Actions */}
                <div className="habit-card__right">
                  <WeeklyDots habitLogs={logs} color={colorTheme.dot} />
                  <ProgressRing percentage={percentage} color={colorTheme.ring} />
                  <label className="habit-toggle habit-card__toggle">
                    <input
                      type="checkbox"
                      checked={completedTodayFlag}
                      onChange={(e) =>
                        handleTodayToggle(habit.id, e.target.checked)
                      }
                    />
                    <span className="habit-toggle__slider" />
                  </label>
                  <button
                    className="habit-card__delete"
                    onClick={() => handleHabitDelete(habit.id)}
                    title="Delete habit"
                    aria-label={`Delete ${habit.title}`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Consistency Heatmap */}
      {!isLoading && habits.length > 0 && (
        <ConsistencyHeatmap habitLogs={habitLogs} />
      )}
    </div>
  );
}