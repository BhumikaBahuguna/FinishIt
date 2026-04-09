/**
 * DashboardPage.jsx — MAIN DASHBOARD PAGE (/dashboard)
 *
 * The primary landing page after login. Shows a unified overview of:
 *   - KPI stats (total tasks, overdue, habits done today, etc.)
 *   - Eisenhower Matrix with prioritized task sections
 *   - Today's habit tracking with toggle checkboxes
 *   - Overdue tasks and upcoming deadline warnings
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { upsertHabitLog } from "../../habits/services/habitsApi";
import { getTodayIsoDate } from "../../habits/services/habitStreaks";
import { Button } from "../../../shared/components/ui/Button";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { HabitTrackingOverview } from "../components/HabitTrackingOverview";
import { OverviewStats } from "../components/OverviewStats";
import { OverdueTaskView } from "../components/OverdueTaskView";
import { PrioritizedTaskSections } from "../components/PrioritizedTaskSections";
import { UpcomingDeadlinesView } from "../components/UpcomingDeadlinesView";
import { getDashboardSnapshot } from "../services/dashboardApi";

const EMPTY_DASHBOARD_DATA = {
  tasks: [],
  prioritizedTasks: [],
  matrix: {
    urgent_important: [],
    important_not_urgent: [],
    urgent_not_important: [],
    not_urgent_not_important: []
  },
  overdueTasks: [],
  upcomingDeadlines: [],
  habitsToday: [],
  stats: {
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalHabits: 0,
    completedHabitsToday: 0
  }
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingHabit, setIsUpdatingHabit] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setDashboardData(EMPTY_DASHBOARD_DATA);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await getDashboardSnapshot(user.id);

    if (error) {
      setErrorMessage(error.message ?? "Unable to load dashboard data.");
      setIsLoading(false);
      return;
    }

    setDashboardData(data ?? EMPTY_DASHBOARD_DATA);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleHabitToggle(habitId, completed) {
    setIsUpdatingHabit(true);
    setErrorMessage("");

    const { error } = await upsertHabitLog({
      habitId,
      logDate: getTodayIsoDate(),
      completed
    });

    if (error) {
      setErrorMessage(error.message ?? "Unable to update habit completion.");
      setIsUpdatingHabit(false);
      return;
    }

    await loadDashboard();
    setIsUpdatingHabit(false);
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of priorities, habits, and progress."
      />

      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}

      <div className="actions-row compact-top-gap">
        <Button type="button" onClick={() => navigate("/tasks")}>Task Creation and Editing</Button>
        <Button type="button" variant="secondary" onClick={() => navigate("/habits")}>
          Habit Tracking Interface
        </Button>
      </div>

      <OverviewStats stats={dashboardData.stats} />

      {isLoading ? <p>Loading dashboard data...</p> : null}

      <section className="grid grid-2">
        <PrioritizedTaskSections matrix={dashboardData.matrix} />
        <HabitTrackingOverview
          habitsToday={dashboardData.habitsToday}
          onToggleHabit={handleHabitToggle}
          isUpdatingHabit={isUpdatingHabit}
        />
      </section>

      <section className="grid grid-2">
        <OverdueTaskView overdueTasks={dashboardData.overdueTasks} />
        <UpcomingDeadlinesView upcomingDeadlines={dashboardData.upcomingDeadlines} />
      </section>
    </div>
  );
}