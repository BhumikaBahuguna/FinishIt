export const TASK_STATUSES = new Set(["pending", "in_progress", "completed", "archived"]);
export const HABIT_FREQUENCIES = new Set(["daily", "weekly", "monthly", "custom"]);

function sanitizeText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function isValidIsoDateTime(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export function isValidIsoDate(value) {
  if (!value || typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
}

function parseBoundedInteger(value, min, max) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return {
      valid: false,
      value: null
    };
  }

  if (parsed < min || parsed > max) {
    return {
      valid: false,
      value: null
    };
  }

  return {
    valid: true,
    value: parsed
  };
}

export function validateTaskPayload(taskInput, options = {}) {
  const partial = options.partial ?? false;
  const errors = [];
  const normalized = { ...taskInput };

  if (!partial || Object.hasOwn(normalized, "title")) {
    const title = sanitizeText(normalized.title);

    if (!title) {
      errors.push("Task title is required.");
    }

    if (title.length > 200) {
      errors.push("Task title must be 200 characters or fewer.");
    }

    normalized.title = title;
  }

  if (Object.hasOwn(normalized, "description") && normalized.description != null) {
    normalized.description = String(normalized.description).trim();
  }

  // Urgency is auto-computed from the deadline — skip user-input validation.
  // If present, normalize to boolean.
  if (Object.hasOwn(normalized, "urgency")) {
    normalized.urgency = Boolean(normalized.urgency);
  }

  if (!partial || Object.hasOwn(normalized, "importance")) {
    if (normalized.importance == null && !partial) {
      errors.push("Task importance is required (true or false).");
    } else if (Object.hasOwn(normalized, "importance")) {
      normalized.importance = Boolean(normalized.importance);
    }
  }

  if (Object.hasOwn(normalized, "status")) {
    if (!TASK_STATUSES.has(normalized.status)) {
      errors.push("Task status is invalid.");
    }
  }

  if (Object.hasOwn(normalized, "deadline") && normalized.deadline) {
    if (!isValidIsoDateTime(normalized.deadline)) {
      errors.push("Task deadline is invalid.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalized
  };
}

export function validateHabitPayload(habitInput, options = {}) {
  const partial = options.partial ?? false;
  const errors = [];
  const normalized = { ...habitInput };

  if (!partial || Object.hasOwn(normalized, "title")) {
    const title = sanitizeText(normalized.title);

    if (!title) {
      errors.push("Habit title is required.");
    }

    if (title.length > 200) {
      errors.push("Habit title must be 200 characters or fewer.");
    }

    normalized.title = title;
  }

  if (!partial || Object.hasOwn(normalized, "frequency")) {
    if (!HABIT_FREQUENCIES.has(normalized.frequency)) {
      errors.push("Habit frequency is invalid.");
    }
  }

  if (Object.hasOwn(normalized, "is_active")) {
    normalized.is_active = Boolean(normalized.is_active);
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalized
  };
}
