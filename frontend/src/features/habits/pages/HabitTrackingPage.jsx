/**
 * HabitTrackingPage.jsx — HABIT TRACKING PAGE (/habits)
 *
 * Allows users to create recurring habits, mark daily completion,
 * view streak statistics, and delete habits.
 * Each habit shows current streak, best streak, and a today toggle.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  createHabit,
  deleteHabit,
  listHabitsByUser,
  listHabitLogsByHabitIds,
  upsertHabitLog
} from "../services/habitsApi";
import { buildHabitProgressByHabit, getTodayIsoDate } from "../services/habitStreaks";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { validateHabitPayload } from "../../../shared/utils/validation";

const DEFAULT_HABIT_FORM = {
  title: "",
  frequency: "daily"
};

export function HabitTrackingPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [habitForm, setHabitForm] = useState(DEFAULT_HABIT_FORM);

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

  return (
    <div className="page-content">
      <PageHeader
        title="Habit Tracking"
        subtitle="Track recurring habits and monitor consistency."
      />

      <Card title="Create Habit">
        {submitErrorMessage ? <p className="status-error">{submitErrorMessage}</p> : null}

        <form className="data-form" onSubmit={handleHabitCreate}>
          <label htmlFor="habit-title">Title</label>
          <input
            id="habit-title"
            name="title"
            value={habitForm.title}
            onChange={handleHabitFormChange}
            placeholder="Habit name"
            required
          />

          <label htmlFor="habit-frequency">Frequency</label>
          <select
            id="habit-frequency"
            name="frequency"
            value={habitForm.frequency}
            onChange={handleHabitFormChange}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>

          <div className="actions-row">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Habit"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Habit Overview">
        {isLoading ? <p>Loading habits...</p> : null}
        {!isLoading && errorMessage ? <p className="status-error">{errorMessage}</p> : null}
        {!isLoading && !errorMessage && habits.length === 0 ? <p>No habits found.</p> : null}

        {!isLoading && !errorMessage && habits.length > 0 ? (
          <ul className="data-list">
            {habits.map((habit) => (
              <li key={habit.id} className="data-list-item">
                <h3>{habit.title}</h3>
                <p className="data-list-meta">Frequency: {habit.frequency}</p>

                <div className="checkbox-row">
                  <input
                    id={`habit-${habit.id}-today`}
                    type="checkbox"
                    checked={habitProgressById.get(habit.id)?.completedToday ?? false}
                    onChange={(event) => handleTodayToggle(habit.id, event.target.checked)}
                  />
                  <label htmlFor={`habit-${habit.id}-today`}>Completed today</label>
                </div>

                <p className="data-list-meta">
                  Current streak: {habitProgressById.get(habit.id)?.currentStreak ?? 0} day(s)
                </p>
                <p className="data-list-meta">
                  Best streak: {habitProgressById.get(habit.id)?.bestStreak ?? 0} day(s)
                </p>

                <div className="actions-row">
                  <Button type="button" variant="secondary" onClick={() => handleHabitDelete(habit.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </div>
  );
}