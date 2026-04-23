/**
 * DashboardPage.jsx — MAIN DASHBOARD PAGE (/dashboard)
 *
 * Complete redesign matching the premium dark dashboard reference:
 * - Top section: Eisenhower Matrix (left) + Habit Tracker panel (right)
 * - Below: KPI stat cards (total, completed, overdue, active, habits, habits today)
 * - Below: Overdue tasks list and Upcoming deadlines list side-by-side
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { upsertHabitLog } from "../services/habitsApi";
import { getTodayIsoDate } from "../services/habitStreaks";
import { Button } from "../components/ui/Button";
import { HabitTrackingOverview } from "../components/dashboard/HabitTrackingOverview";
import { OverviewStats } from "../components/dashboard/OverviewStats";
import { OverdueTaskView } from "../components/dashboard/OverdueTaskView";
import { PrioritizedTaskSections } from "../components/dashboard/PrioritizedTaskSections";
import { UpcomingDeadlinesView } from "../components/dashboard/UpcomingDeadlinesView";
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
    <div className="dashboard-page">
      {/* Error message */}
      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}

      {/* Quick action buttons */}
      <div className="dashboard-actions">
        <Button type="button" onClick={() => navigate("/tasks")}>
          + New Task
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate("/habits")}>
          + New Habit
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="dashboard-loading">
          <div className="dashboard-loading__spinner" />
          <p>Loading dashboard data...</p>
        </div>
      )}

      {/* Main content: Matrix + Habit Tracker */}
      {!isLoading && (
        <>
          <div className="dashboard-top">
            {/* Left: Eisenhower Matrix */}
            <div className="dashboard-top__matrix">
              <PrioritizedTaskSections matrix={dashboardData.matrix} />
            </div>

            {/* Right: Habit Tracker Panel */}
            <div className="dashboard-top__habits">
              <HabitTrackingOverview
                habitsToday={dashboardData.habitsToday}
                onToggleHabit={handleHabitToggle}
                isUpdatingHabit={isUpdatingHabit}
              />
            </div>
          </div>

          {/* KPI Stats Row */}
          <OverviewStats stats={dashboardData.stats} />

          {/* Overdue Tasks + Upcoming Deadlines */}
          <div className="dashboard-bottom-grid">
            <OverdueTaskView overdueTasks={dashboardData.overdueTasks} />
            <UpcomingDeadlinesView upcomingDeadlines={dashboardData.upcomingDeadlines} />
          </div>
        </>
      )}
    </div>
  );
}