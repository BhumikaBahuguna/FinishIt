/**
 * dashboardApi.js — DASHBOARD DATA AGGREGATION
 *
 * Builds a comprehensive dashboard snapshot by combining data from
 * tasks, habits, and habit logs into a single response.
 *
 * Returns: tasks, prioritized tasks, Eisenhower matrix, overdue tasks,
 * upcoming deadlines, today's habit progress, and summary statistics.
 */

import { listHabitsByUser, listHabitLogsByHabitIds } from "../../habits/services/habitsApi";
import { buildHabitProgressByHabit } from "../../habits/services/habitStreaks";
import { listTasksByUser } from "../../tasks/services/tasksApi";
import {
  buildEisenhowerMatrix,
  getOverdueTasks,
  prioritizeTasks
} from "../../tasks/services/taskPrioritization";

const NON_ACTIONABLE_TASK_STATUSES = new Set(["completed", "archived"]);

function getUpcomingDeadlines(tasks, limit = 5) {
  const now = Date.now();

  return tasks
    .filter((task) => {
      if (!task.deadline) return false;
      if (NON_ACTIONABLE_TASK_STATUSES.has(task.status)) return false;

      const deadline = new Date(task.deadline).getTime();
      return !Number.isNaN(deadline) && deadline >= now;
    })
    .sort((left, right) => new Date(left.deadline) - new Date(right.deadline))
    .slice(0, limit);
}

export async function getDashboardSnapshot(userId) {
  if (!userId) {
    return {
      data: {
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
      },
      error: null
    };
  }

  const [tasksResult, habitsResult] = await Promise.all([
    listTasksByUser(userId),
    listHabitsByUser(userId)
  ]);

  if (tasksResult.error) {
    return { data: null, error: tasksResult.error };
  }

  if (habitsResult.error) {
    return { data: null, error: habitsResult.error };
  }

  const tasks = tasksResult.data ?? [];
  const habits = habitsResult.data ?? [];
  const habitIds = habits.map((habit) => habit.id);

  const logsResult = await listHabitLogsByHabitIds(habitIds);

  if (logsResult.error) {
    return { data: null, error: logsResult.error };
  }

  const habitLogs = logsResult.data ?? [];
  const prioritizedTasks = prioritizeTasks(tasks);
  const matrix = buildEisenhowerMatrix(prioritizedTasks);
  const overdueTasks = getOverdueTasks(tasks);
  const upcomingDeadlines = getUpcomingDeadlines(tasks);
  const habitProgressById = buildHabitProgressByHabit(habits, habitLogs);

  const habitsToday = habits
    .map((habit) => {
      const progress = habitProgressById.get(habit.id);
      return {
        ...habit,
        currentStreak: progress?.currentStreak ?? 0,
        bestStreak: progress?.bestStreak ?? 0,
        completedToday: progress?.completedToday ?? false
      };
    })
    .sort((left, right) => {
      if (left.completedToday !== right.completedToday) {
        return Number(left.completedToday) - Number(right.completedToday);
      }

      return left.title.localeCompare(right.title);
    });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const pendingTasks = tasks.filter(
    (task) => !NON_ACTIONABLE_TASK_STATUSES.has(task.status)
  ).length;

  const stats = {
    totalTasks,
    pendingTasks,
    completedTasks,
    overdueTasks: overdueTasks.length,
    totalHabits: habitsToday.length,
    completedHabitsToday: habitsToday.filter((habit) => habit.completedToday).length
  };

  return {
    data: {
      tasks,
      prioritizedTasks,
      matrix,
      overdueTasks,
      upcomingDeadlines,
      habitsToday,
      stats
    },
    error: null
  };
}
