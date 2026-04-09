/**
 * analyticsApi.js — ANALYTICS DATA ENGINE
 *
 * Builds analytics snapshots from tasks and habits data:
 *   - Task completion statistics (by status + completion rate)
 *   - 14-day overdue task trend
 *   - 7-day productivity overview (score = tasks×2 + habits)
 *   - Habit streak summaries and rankings
 */

import { listHabitsByUser, listHabitLogsByHabitIds } from "../../habits/services/habitsApi";
import { buildHabitProgressByHabit } from "../../habits/services/habitStreaks";
import { getOverdueTasks } from "../../tasks/services/taskPrioritization";
import { listTasksByUser } from "../../tasks/services/tasksApi";

const ACTIVE_TASK_STATUSES = new Set(["pending", "in_progress"]);

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildRecentDateRange(days) {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    dates.push(date);
  }

  return dates;
}

function countByDate(rows, dateAccessor) {
  return rows.reduce((counts, row) => {
    const date = dateAccessor(row);

    if (!date) return counts;

    counts[date] = (counts[date] ?? 0) + 1;
    return counts;
  }, {});
}

function buildTaskCompletionStatistics(tasks) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const archivedTasks = tasks.filter((task) => task.status === "archived").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    archivedTasks,
    completionRate
  };
}

function buildOverdueTrend(tasks, periodDays = 14) {
  const overdueTasks = getOverdueTasks(tasks);
  const overdueByDate = countByDate(overdueTasks, (task) => task.deadline?.slice(0, 10));
  const dates = buildRecentDateRange(periodDays);

  return dates.map((date) => {
    const isoDate = formatIsoDate(date);
    return {
      isoDate,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: overdueByDate[isoDate] ?? 0
    };
  });
}

function buildProductivityOverview(tasks, habitLogs, periodDays = 7) {
  const taskCompletions = tasks.filter((task) => task.status === "completed");
  const taskCompletionByDate = countByDate(
    taskCompletions,
    (task) => task.completed_at?.slice(0, 10) ?? null
  );

  const completedHabitLogs = habitLogs.filter((log) => Boolean(log.completed));
  const habitCompletionByDate = countByDate(completedHabitLogs, (log) => log.log_date);

  const dates = buildRecentDateRange(periodDays);

  return dates.map((date) => {
    const isoDate = formatIsoDate(date);
    const tasksCompleted = taskCompletionByDate[isoDate] ?? 0;
    const habitsCompleted = habitCompletionByDate[isoDate] ?? 0;

    return {
      isoDate,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      tasksCompleted,
      habitsCompleted,
      score: tasksCompleted * 2 + habitsCompleted
    };
  });
}

function buildHabitStreakSummaries(habits, habitLogs) {
  const progressByHabitId = buildHabitProgressByHabit(habits, habitLogs);

  const summaries = habits
    .map((habit) => {
      const progress = progressByHabitId.get(habit.id);

      return {
        id: habit.id,
        title: habit.title,
        frequency: habit.frequency,
        currentStreak: progress?.currentStreak ?? 0,
        bestStreak: progress?.bestStreak ?? 0,
        completedToday: progress?.completedToday ?? false
      };
    })
    .sort((left, right) => {
      if (left.currentStreak !== right.currentStreak) {
        return right.currentStreak - left.currentStreak;
      }

      if (left.bestStreak !== right.bestStreak) {
        return right.bestStreak - left.bestStreak;
      }

      return left.title.localeCompare(right.title);
    });

  const activeHabits = summaries.length;
  const habitsCompletedToday = summaries.filter((item) => item.completedToday).length;
  const averageCurrentStreak =
    activeHabits > 0
      ? Math.round(
          summaries.reduce((sum, item) => sum + item.currentStreak, 0) / activeHabits
        )
      : 0;

  return {
    summaries,
    stats: {
      activeHabits,
      habitsCompletedToday,
      averageCurrentStreak
    }
  };
}

function buildProductivitySummary(tasks, overdueTrend, productivityOverview) {
  const activeTasks = tasks.filter((task) => ACTIVE_TASK_STATUSES.has(task.status)).length;
  const totalOverdueInPeriod = overdueTrend.reduce((sum, point) => sum + point.count, 0);
  const bestProductivityDay = productivityOverview.reduce(
    (best, point) => (point.score > best.score ? point : best),
    { label: "N/A", score: 0 }
  );

  return {
    activeTasks,
    totalOverdueInPeriod,
    bestProductivityDay: bestProductivityDay.label,
    bestProductivityScore: bestProductivityDay.score
  };
}

export async function getAnalyticsSnapshot(userId) {
  if (!userId) {
    return {
      data: {
        taskCompletionStats: buildTaskCompletionStatistics([]),
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
      },
      error: null
    };
  }

  const [tasksResult, habitsResult] = await Promise.all([
    listTasksByUser(userId),
    listHabitsByUser(userId)
  ]);

  if (tasksResult.error) return { data: null, error: tasksResult.error };
  if (habitsResult.error) return { data: null, error: habitsResult.error };

  const tasks = tasksResult.data ?? [];
  const habits = habitsResult.data ?? [];
  const habitIds = habits.map((habit) => habit.id);

  const habitLogsResult = await listHabitLogsByHabitIds(habitIds);
  if (habitLogsResult.error) return { data: null, error: habitLogsResult.error };

  const habitLogs = habitLogsResult.data ?? [];

  const taskCompletionStats = buildTaskCompletionStatistics(tasks);
  const overdueTaskTrend = buildOverdueTrend(tasks);
  const productivityOverview = buildProductivityOverview(tasks, habitLogs);
  const habitStreakSummary = buildHabitStreakSummaries(habits, habitLogs);
  const productivitySummary = buildProductivitySummary(
    tasks,
    overdueTaskTrend,
    productivityOverview
  );

  return {
    data: {
      taskCompletionStats,
      overdueTaskTrend,
      productivityOverview,
      habitStreakSummary,
      productivitySummary
    },
    error: null
  };
}
