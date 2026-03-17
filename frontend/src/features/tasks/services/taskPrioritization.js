const TERMINAL_TASK_STATUSES = new Set(["completed", "archived"]);

export const EISENHOWER_QUADRANTS = {
  DO_FIRST: "urgent_important",
  SCHEDULE: "important_not_urgent",
  DELEGATE: "urgent_not_important",
  ELIMINATE: "not_urgent_not_important"
};

const QUADRANT_LABELS = {
  [EISENHOWER_QUADRANTS.DO_FIRST]: "Urgent and Important",
  [EISENHOWER_QUADRANTS.SCHEDULE]: "Important but Not Urgent",
  [EISENHOWER_QUADRANTS.DELEGATE]: "Urgent but Not Important",
  [EISENHOWER_QUADRANTS.ELIMINATE]: "Neither Urgent nor Important"
};

const QUADRANT_ORDER = {
  [EISENHOWER_QUADRANTS.DO_FIRST]: 1,
  [EISENHOWER_QUADRANTS.SCHEDULE]: 2,
  [EISENHOWER_QUADRANTS.DELEGATE]: 3,
  [EISENHOWER_QUADRANTS.ELIMINATE]: 4
};

function toDeadlineTimestamp(deadline) {
  if (!deadline) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(deadline).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

export function getEisenhowerQuadrant(task, options = {}) {
  const urgentThreshold = options.urgentThreshold ?? 4;
  const importantThreshold = options.importantThreshold ?? 4;

  const isUrgent = Number(task.urgency) >= urgentThreshold;
  const isImportant = Number(task.importance) >= importantThreshold;

  if (isUrgent && isImportant) return EISENHOWER_QUADRANTS.DO_FIRST;
  if (!isUrgent && isImportant) return EISENHOWER_QUADRANTS.SCHEDULE;
  if (isUrgent && !isImportant) return EISENHOWER_QUADRANTS.DELEGATE;
  return EISENHOWER_QUADRANTS.ELIMINATE;
}

export function getQuadrantLabel(quadrant) {
  return QUADRANT_LABELS[quadrant] ?? "Unknown";
}

export function prioritizeTasks(tasks, options = {}) {
  return [...tasks]
    .map((task) => {
      const quadrant = getEisenhowerQuadrant(task, options);
      return {
        ...task,
        quadrant,
        quadrantLabel: getQuadrantLabel(quadrant)
      };
    })
    .sort((left, right) => {
      const leftQuadrantOrder = QUADRANT_ORDER[left.quadrant] ?? 99;
      const rightQuadrantOrder = QUADRANT_ORDER[right.quadrant] ?? 99;

      if (leftQuadrantOrder !== rightQuadrantOrder) {
        return leftQuadrantOrder - rightQuadrantOrder;
      }

      const deadlineDifference =
        toDeadlineTimestamp(left.deadline) - toDeadlineTimestamp(right.deadline);

      if (deadlineDifference !== 0) {
        return deadlineDifference;
      }

      if (left.importance !== right.importance) {
        return Number(right.importance) - Number(left.importance);
      }

      if (left.urgency !== right.urgency) {
        return Number(right.urgency) - Number(left.urgency);
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
}

export function buildEisenhowerMatrix(tasks, options = {}) {
  const matrix = {
    [EISENHOWER_QUADRANTS.DO_FIRST]: [],
    [EISENHOWER_QUADRANTS.SCHEDULE]: [],
    [EISENHOWER_QUADRANTS.DELEGATE]: [],
    [EISENHOWER_QUADRANTS.ELIMINATE]: []
  };

  const prioritized = prioritizeTasks(tasks, options);

  prioritized.forEach((task) => {
    matrix[task.quadrant].push(task);
  });

  return matrix;
}

export function getOverdueTasks(tasks, now = new Date()) {
  const nowTimestamp = now.getTime();

  return tasks
    .filter((task) => {
      if (!task.deadline) return false;
      if (TERMINAL_TASK_STATUSES.has(task.status)) return false;

      const deadlineTimestamp = new Date(task.deadline).getTime();
      return !Number.isNaN(deadlineTimestamp) && deadlineTimestamp < nowTimestamp;
    })
    .map((task) => {
      const overdueMilliseconds = nowTimestamp - new Date(task.deadline).getTime();
      const overdueDays = Math.floor(overdueMilliseconds / (1000 * 60 * 60 * 24));

      return {
        ...task,
        overdueDays
      };
    })
    .sort((left, right) => new Date(left.deadline) - new Date(right.deadline));
}
