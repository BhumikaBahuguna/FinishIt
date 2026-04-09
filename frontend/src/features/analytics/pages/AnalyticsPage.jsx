/**
 * AnalyticsPage.jsx — ANALYTICS PAGE (/analytics)
 *
 * Displays productivity charts and statistics:
 * KPI cards, task completion stats, habit streak summaries,
 * overdue trend bar chart, and productivity overview chart.
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { HabitStreakSummary } from "../components/HabitStreakSummary";
import { OverdueTaskTrendChart } from "../components/OverdueTaskTrendChart";
import { ProductivityOverviewChart } from "../components/ProductivityOverviewChart";
import { TaskCompletionStatistics } from "../components/TaskCompletionStatistics";
import { getAnalyticsSnapshot } from "../services/analyticsApi";

const EMPTY_ANALYTICS = {
  taskCompletionStats: {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    archivedTasks: 0,
    completionRate: 0
  },
  overdueTaskTrend: [],
  productivityOverview: [],
  habitStreakSummary: {
    summaries: [],
    stats: {
      activeHabits: 0,
      habitsCompletedToday: 0,
      averageCurrentStreak: 0
    }
  },
  productivitySummary: {
    activeTasks: 0,
    totalOverdueInPeriod: 0,
    bestProductivityDay: "N/A",
    bestProductivityScore: 0
  }
};

export function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      if (!user?.id) {
        setAnalytics(EMPTY_ANALYTICS);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      const { data, error } = await getAnalyticsSnapshot(user.id);

      if (error) {
        setErrorMessage(error.message ?? "Unable to load analytics.");
        setIsLoading(false);
        return;
      }

      setAnalytics(data ?? EMPTY_ANALYTICS);
      setIsLoading(false);
    }

    loadAnalytics();
  }, [user?.id]);

  return (
    <div className="page-content">
      <PageHeader
        title="Analytics"
        subtitle="View productivity trends and historical insights."
      />

      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}
      {isLoading ? <p>Loading analytics...</p> : null}

      <section className="kpi-grid analytics-kpi-grid">
        <div className="card">
          <p className="kpi-label">Active Tasks</p>
          <p className="kpi-value">{analytics.productivitySummary.activeTasks}</p>
        </div>
        <div className="card">
          <p className="kpi-label">Overdue in 14 Days</p>
          <p className="kpi-value">{analytics.productivitySummary.totalOverdueInPeriod}</p>
        </div>
        <div className="card">
          <p className="kpi-label">Best Day</p>
          <p className="kpi-value">{analytics.productivitySummary.bestProductivityDay}</p>
        </div>
      </section>

      <section className="grid grid-2">
        <TaskCompletionStatistics stats={analytics.taskCompletionStats} />
        <HabitStreakSummary habitStreakSummary={analytics.habitStreakSummary} />
      </section>

      <section className="grid grid-2">
        <OverdueTaskTrendChart points={analytics.overdueTaskTrend} />
        <ProductivityOverviewChart
          points={analytics.productivityOverview}
          summary={analytics.productivitySummary}
        />
      </section>
    </div>
  );
}