function parseIsoDate(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null;
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (formatIsoDate(parsedDate) !== isoDate) {
    return null;
  }

  return parsedDate;
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(isoDate, offsetDays) {
  const baseDate = parseIsoDate(isoDate);

  if (!baseDate) {
    return null;
  }

  baseDate.setUTCDate(baseDate.getUTCDate() + offsetDays);
  return formatIsoDate(baseDate);
}

export function getTodayIsoDate() {
  return formatIsoDate(new Date());
}

export function calculateHabitStreaks(logs) {
  const completedDates = logs
    .filter((log) => Boolean(log.completed))
    .map((log) => log.log_date)
    .filter((logDate) => parseIsoDate(logDate) != null);

  if (completedDates.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastCompletedDate: null
    };
  }

  const uniqueSortedDates = [...new Set(completedDates)].sort();
  let bestStreak = 1;
  let runningBest = 1;

  for (let index = 1; index < uniqueSortedDates.length; index += 1) {
    const previousDate = uniqueSortedDates[index - 1];
    const currentDate = uniqueSortedDates[index];
    const nextExpected = addDays(previousDate, 1);

    if (nextExpected && nextExpected === currentDate) {
      runningBest += 1;
      bestStreak = Math.max(bestStreak, runningBest);
    } else {
      runningBest = 1;
    }
  }

  let currentStreak = 1;

  for (let index = uniqueSortedDates.length - 1; index > 0; index -= 1) {
    const currentDate = uniqueSortedDates[index];
    const previousDate = uniqueSortedDates[index - 1];
    const nextExpected = addDays(previousDate, 1);

    if (nextExpected && nextExpected === currentDate) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  return {
    currentStreak,
    bestStreak,
    lastCompletedDate: uniqueSortedDates[uniqueSortedDates.length - 1]
  };
}

export function buildHabitProgressByHabit(habits, habitLogs) {
  const logsByHabitId = new Map();

  habitLogs.forEach((log) => {
    const existingLogs = logsByHabitId.get(log.habit_id) ?? [];
    existingLogs.push(log);
    logsByHabitId.set(log.habit_id, existingLogs);
  });

  const today = getTodayIsoDate();
  const summaryByHabitId = new Map();

  habits.forEach((habit) => {
    const logs = logsByHabitId.get(habit.id) ?? [];
    const streaks = calculateHabitStreaks(logs);
    const completedToday = logs.some((log) => log.log_date === today && log.completed);

    summaryByHabitId.set(habit.id, {
      ...streaks,
      completedToday
    });
  });

  return summaryByHabitId;
}
