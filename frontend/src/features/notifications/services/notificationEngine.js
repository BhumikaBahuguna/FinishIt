import { listHabitsByUser, listHabitLogsByHabitIds } from "../../habits/services/habitsApi";
import { buildHabitProgressByHabit, getTodayIsoDate } from "../../habits/services/habitStreaks";
import { getOverdueTasks } from "../../tasks/services/taskPrioritization";
import { listTasksByUser } from "../../tasks/services/tasksApi";

const ACTIVE_TASK_STATUSES = new Set(["pending", "in_progress"]);
export const DAILY_REMINDER_STORAGE_KEY = "finishit.dailyReminderDate";

const SEVERITY_RANK = {
  critical: 3,
  warning: 2,
  info: 1
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getLocalStorageValue(key) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function setDailyReminderSent() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAILY_REMINDER_STORAGE_KEY, getTodayKey());
}

function shouldEmitDailyReminder() {
  return getLocalStorageValue(DAILY_REMINDER_STORAGE_KEY) !== getTodayKey();
}

function toHumanTime(dateTime) {
  const parsedDate = new Date(dateTime);
  return Number.isNaN(parsedDate.getTime()) ? "Invalid date" : parsedDate.toLocaleString();
}

function isoDateFromDate(date) {
  return date.toISOString().slice(0, 10);
}

function expectedCompletionDateByFrequency(today, frequency) {
  const target = new Date(today);

  if (frequency === "daily") {
    target.setDate(target.getDate() - 1);
    return isoDateFromDate(target);
  }

  if (frequency === "weekly") {
    target.setDate(target.getDate() - 7);
    return isoDateFromDate(target);
  }

  if (frequency === "monthly") {
    target.setMonth(target.getMonth() - 1);
    return isoDateFromDate(target);
  }

  // Treat custom as daily until custom recurrence rules are introduced.
  target.setDate(target.getDate() - 1);
  return isoDateFromDate(target);
}

function buildUpcomingDeadlineNotifications(tasks, now, horizonHours = 24) {
  const horizonMs = horizonHours * 60 * 60 * 1000;
  const nowMs = now.getTime();

  return tasks
    .filter((task) => {
      if (!task.deadline) return false;
      if (!ACTIVE_TASK_STATUSES.has(task.status)) return false;

      const deadlineMs = new Date(task.deadline).getTime();
      if (Number.isNaN(deadlineMs)) return false;

      const delta = deadlineMs - nowMs;
      return delta >= 0 && delta <= horizonMs;
    })
    .map((task) => {
      const deadlineMs = new Date(task.deadline).getTime();
      const minutesLeft = Math.max(0, Math.floor((deadlineMs - nowMs) / (1000 * 60)));
      const hoursLeft = Math.floor(minutesLeft / 60);
      const severity = hoursLeft <= 3 ? "warning" : "info";

      return {
        id: `task-upcoming-${task.id}`,
        type: "upcoming_task_deadline",
        severity,
        title: `Upcoming deadline: ${task.title}`,
        message:
          hoursLeft > 0
            ? `Due in ${hoursLeft} hour(s) at ${toHumanTime(task.deadline)}.`
            : `Due in ${minutesLeft} minute(s) at ${toHumanTime(task.deadline)}.`,
        createdAt: now.toISOString(),
        relatedEntityId: task.id,
        route: "/tasks"
      };
    });
}

function buildOverdueTaskNotifications(tasks, now) {
  return getOverdueTasks(tasks, now).map((task) => ({
    id: `task-overdue-${task.id}`,
    type: "overdue_task",
    severity: "critical",
    title: `Overdue task: ${task.title}`,
    message: `Missed deadline by ${task.overdueDays + 1} day(s).`,
    createdAt: now.toISOString(),
    relatedEntityId: task.id,
    route: "/tasks"
  }));
}

function buildMissedHabitNotifications(habits, habitProgressById, now) {
  const todayIso = getTodayIsoDate();

  return habits
    .filter((habit) => habit.is_active)
    .filter((habit) => {
      const progress = habitProgressById.get(habit.id);
      const completedToday = progress?.completedToday ?? false;
      if (completedToday) return false;

      const expectedCompletionDate = expectedCompletionDateByFrequency(
        new Date(now),
        habit.frequency
      );

      const lastCompletedDate = progress?.lastCompletedDate;
      if (!lastCompletedDate) {
        const createdDate = habit.created_at?.slice(0, 10);
        return Boolean(createdDate && createdDate <= expectedCompletionDate && createdDate < todayIso);
      }

      return lastCompletedDate < expectedCompletionDate;
    })
    .map((habit) => {
      const progress = habitProgressById.get(habit.id);
      return {
        id: `habit-missed-${habit.id}`,
        type: "missed_habit",
        severity: "warning",
        title: `Missed habit: ${habit.title}`,
        message: `Current streak is ${progress?.currentStreak ?? 0}. Mark today's completion to rebuild consistency.`,
        createdAt: now.toISOString(),
        relatedEntityId: habit.id,
        route: "/habits"
      };
    });
}

function buildDailyReminderNotification(tasks, habits, habitProgressById, now) {
  if (!shouldEmitDailyReminder()) {
    return [];
  }

  const activeTaskCount = tasks.filter((task) => ACTIVE_TASK_STATUSES.has(task.status)).length;

  const habitsPendingToday = habits.filter((habit) => {
    if (!habit.is_active) return false;
    const progress = habitProgressById.get(habit.id);
    return !(progress?.completedToday ?? false);
  }).length;

  return [
    {
      id: `daily-reminder-${getTodayKey()}`,
      type: "daily_reminder",
      severity: "info",
      title: "Daily productivity reminder",
      message: `You have ${activeTaskCount} active task(s) and ${habitsPendingToday} habit(s) pending today.`,
      createdAt: now.toISOString(),
      relatedEntityId: null,
      route: "/dashboard"
    }
  ];
}

function sortNotifications(notifications) {
  return [...notifications].sort((left, right) => {
    const severityDelta =
      (SEVERITY_RANK[right.severity] ?? 0) - (SEVERITY_RANK[left.severity] ?? 0);

    if (severityDelta !== 0) {
      return severityDelta;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export async function getNotificationsSnapshot(userId) {
  if (!userId) {
    return {
      data: {
        notifications: [],
        stats: {
          upcomingDeadlines: 0,
          overdueTasks: 0,
          missedHabits: 0,
          dailyReminders: 0
        }
      },
      error: null
    };
  }

  try {
    const now = new Date();
    const [tasksResult, habitsResult] = await Promise.all([
      listTasksByUser(userId),
      listHabitsByUser(userId)
    ]);

    if (tasksResult.error) return { data: null, error: tasksResult.error };
    if (habitsResult.error) return { data: null, error: habitsResult.error };

    const tasks = tasksResult.data ?? [];
    const habits = habitsResult.data ?? [];
    const habitIds = habits.map((habit) => habit.id);

    const logsResult = await listHabitLogsByHabitIds(habitIds);
    if (logsResult.error) return { data: null, error: logsResult.error };

    const habitLogs = logsResult.data ?? [];
    const habitProgressById = buildHabitProgressByHabit(habits, habitLogs);

    const upcomingDeadlineNotifications = buildUpcomingDeadlineNotifications(tasks, now);
    const overdueTaskNotifications = buildOverdueTaskNotifications(tasks, now);
    const missedHabitNotifications = buildMissedHabitNotifications(
      habits,
      habitProgressById,
      now
    );
    const dailyReminderNotifications = buildDailyReminderNotification(
      tasks,
      habits,
      habitProgressById,
      now
    );

    const notifications = sortNotifications([
      ...upcomingDeadlineNotifications,
      ...overdueTaskNotifications,
      ...missedHabitNotifications,
      ...dailyReminderNotifications
    ]);

    return {
      data: {
        notifications,
        stats: {
          upcomingDeadlines: upcomingDeadlineNotifications.length,
          overdueTasks: overdueTaskNotifications.length,
          missedHabits: missedHabitNotifications.length,
          dailyReminders: dailyReminderNotifications.length
        }
      },
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error
    };
  }
}
