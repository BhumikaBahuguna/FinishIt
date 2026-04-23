/**
 * AnalyticsPage.jsx — PERFORMANCE ANALYTICS PAGE (/analytics)
 *
 * Redesigned premium analytics dashboard featuring:
 *   - 4 KPI cards with icons and accent subtitles
 *   - Task Activity line chart (14 days)
 *   - Habit Completion Rate area chart (14 days)
 *   - Task Distribution donut chart (by Eisenhower quadrant)
 *   - Smart Insights panel with AI-generated recommendations
 */

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { TaskActivityChart } from "../components/analytics/TaskActivityChart";
import { HabitCompletionChart } from "../components/analytics/HabitCompletionChart";
import { TaskDistributionChart } from "../components/analytics/TaskDistributionChart";
import { SmartInsights } from "../components/analytics/SmartInsights";
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

  const { taskCompletionStats, habitStreakSummary, productivitySummary } = analytics;
  const urgentCount = productivitySummary.totalOverdueInPeriod;
  const avgStreak = habitStreakSummary.stats.averageCurrentStreak;
  const habitsTotal = habitStreakSummary.stats.activeHabits;
  const habitsDoneToday = habitStreakSummary.stats.habitsCompletedToday;
  const todayRate = habitsTotal > 0 ? Math.round((habitsDoneToday / habitsTotal) * 100) : 0;

  return (
    <div className="analytics-page">
      {/* Header */}
      <header className="analytics-page__header">
        <h1 className="analytics-page__title">Performance Analytics</h1>
        <p className="analytics-page__subtitle">Your productivity intelligence dashboard</p>
      </header>

      {errorMessage && <p className="status-error">{errorMessage}</p>}

      {isLoading && (
        <div className="dashboard-loading">
          <div className="dashboard-loading__spinner" />
          <p>Loading analytics...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* KPI Cards Row */}
          <div className="analytics-kpi-row">
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-card__icon analytics-kpi-card__icon--green">✓</div>
              <div className="analytics-kpi-card__body">
                <p className="analytics-kpi-card__value">{taskCompletionStats.completedTasks}</p>
                <p className="analytics-kpi-card__label">Tasks Completed</p>
                <p className="analytics-kpi-card__sub analytics-kpi-card__sub--green">
                  {taskCompletionStats.completionRate}% completion rate
                </p>
              </div>
            </div>

            <div className="analytics-kpi-card">
              <div className="analytics-kpi-card__icon analytics-kpi-card__icon--red">◎</div>
              <div className="analytics-kpi-card__body">
                <p className="analytics-kpi-card__value">{taskCompletionStats.pendingTasks}</p>
                <p className="analytics-kpi-card__label">Pending Tasks</p>
                <p className="analytics-kpi-card__sub analytics-kpi-card__sub--red">
                  {urgentCount} urgent
                </p>
              </div>
            </div>

            <div className="analytics-kpi-card">
              <div className="analytics-kpi-card__icon analytics-kpi-card__icon--cyan">⚡</div>
              <div className="analytics-kpi-card__body">
                <p className="analytics-kpi-card__value">{avgStreak}d</p>
                <p className="analytics-kpi-card__label">Avg Streak</p>
                <p className="analytics-kpi-card__sub analytics-kpi-card__sub--cyan">
                  Habit consistency
                </p>
              </div>
            </div>

            <div className="analytics-kpi-card">
              <div className="analytics-kpi-card__icon analytics-kpi-card__icon--purple">↗</div>
              <div className="analytics-kpi-card__body">
                <p className="analytics-kpi-card__value">{todayRate}%</p>
                <p className="analytics-kpi-card__label">Today's Rate</p>
                <p className="analytics-kpi-card__sub analytics-kpi-card__sub--purple">
                  Habits completed
                </p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="analytics-charts-row">
            <TaskActivityChart points={analytics.overdueTaskTrend} />
            <HabitCompletionChart
              points={analytics.productivityOverview}
              habitsTotal={habitsTotal}
            />
          </div>

          {/* Bottom Row: Distribution + Smart Insights */}
          <div className="analytics-bottom-row">
            <TaskDistributionChart analytics={analytics} />
            <SmartInsights analytics={analytics} />
          </div>
        </>
      )}
    </div>
  );
}