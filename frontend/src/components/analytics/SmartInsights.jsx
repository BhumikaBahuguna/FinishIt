/**
 * SmartInsights.jsx — AI-POWERED SMART INSIGHTS PANEL
 *
 * Generates actionable insights from the analytics data:
 *   - Peak productivity detection
 *   - Delegation opportunities
 *   - Streak momentum building
 *   - Urgent queue warnings
 */

import { useMemo } from "react";

function generateInsights(analytics) {
  const insights = [];
  const { taskCompletionStats, habitStreakSummary, productivitySummary, productivityOverview } = analytics;

  // 1. Peak productivity detection
  if (productivityOverview && productivityOverview.length > 0) {
    const bestDay = productivityOverview.reduce(
      (best, point) => (point.score > best.score ? point : best),
      { label: "N/A", score: 0 }
    );
    if (bestDay.score > 0) {
      insights.push({
        icon: "⚡",
        iconClass: "insight-icon--yellow",
        title: "Peak productivity detected",
        description: `Your most productive day was ${bestDay.label} with a score of ${bestDay.score}. Block this time for deep work.`
      });
    }
  }

  // 2. Delegation opportunity
  const pendingCount = taskCompletionStats.pendingTasks;
  if (pendingCount > 2) {
    insights.push({
      icon: "→",
      iconClass: "insight-icon--orange",
      title: "Delegation opportunity",
      description: `${pendingCount} tasks are pending. Consider delegating lower-priority items to free up focus time.`
    });
  }

  // 3. Streak momentum
  const topHabit = habitStreakSummary.summaries[0];
  if (topHabit && topHabit.currentStreak > 0) {
    insights.push({
      icon: "🔥",
      iconClass: "insight-icon--fire",
      title: "Streak momentum building",
      description: `Your top habit "${topHabit.title}" has a ${topHabit.currentStreak}-day streak. Keep going — you're building real consistency!`
    });
  }

  // 4. Urgent queue warning
  const overdueCount = productivitySummary.totalOverdueInPeriod;
  if (overdueCount > 0) {
    insights.push({
      icon: "!",
      iconClass: "insight-icon--red",
      title: "Urgent queue growing",
      description: `${overdueCount} tasks need immediate attention. Start with the highest priority.`
    });
  }

  // 5. Completion rate
  if (taskCompletionStats.completionRate > 70) {
    insights.push({
      icon: "🏆",
      iconClass: "insight-icon--green",
      title: "Excellent completion rate",
      description: `You've completed ${taskCompletionStats.completionRate}% of your tasks. Outstanding performance — keep the momentum!`
    });
  } else if (taskCompletionStats.totalTasks > 0 && taskCompletionStats.completionRate < 30) {
    insights.push({
      icon: "📋",
      iconClass: "insight-icon--cyan",
      title: "Room for improvement",
      description: `Your completion rate is ${taskCompletionStats.completionRate}%. Try breaking large tasks into smaller, actionable steps.`
    });
  }

  // Fallback
  if (insights.length === 0) {
    insights.push({
      icon: "💡",
      iconClass: "insight-icon--purple",
      title: "Getting started",
      description: "Add tasks and habits to unlock personalized productivity insights."
    });
  }

  return insights;
}

export function SmartInsights({ analytics }) {
  const insights = useMemo(() => generateInsights(analytics), [analytics]);

  return (
    <div className="smart-insights">
      <h3 className="smart-insights__title">Smart Insights</h3>

      <div className="smart-insights__list">
        {insights.map((insight, i) => (
          <div key={i} className="smart-insight-card">
            <div className={`smart-insight-card__icon ${insight.iconClass}`}>
              {insight.icon}
            </div>
            <div className="smart-insight-card__body">
              <h4 className="smart-insight-card__title">{insight.title}</h4>
              <p className="smart-insight-card__desc">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
